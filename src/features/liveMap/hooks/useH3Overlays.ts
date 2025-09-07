'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cellToBoundary, getResolution } from 'h3-js';
import type { HexStat, LatLng } from '@/types/map';

interface UseH3OverlaysOptions {
  map: google.maps.Map | null;
  isLoaded: boolean;
  enabled: boolean;
}

const H3_COLORS = {
  optimal: '#22c55e',    // Green
  moderate: '#f59e0b',   // Amber  
  high: '#ef4444',       // Red
  low: '#3b82f6'         // Blue
};

export function useH3Overlays({ map, isLoaded, enabled }: UseH3OverlaysOptions) {
  const overlaysRef = useRef<Map<string, google.maps.Polygon>>(new Map());
  const [overlayStats, setOverlayStats] = useState({
    totalHexes: 0,
    visibleHexes: 0,
    averageResolution: 0,
    performance: {
      renderTime: 0,
      lastUpdate: new Date()
    }
  });

  const h3ToLatLngPath = useCallback((h3: string): LatLng[] => {
    const boundary = cellToBoundary(h3, true);
    return boundary.map(([lat, lng]) => ({ lat, lng }));
  }, []);

  const getHexColor = useCallback((hexStat: HexStat): string => {
    const ratio = hexStat.supply / Math.max(hexStat.demand, 1);
    const etaMinutes = hexStat.eta / 60;

    // Color logic based on supply/demand ratio and ETA
    if (ratio >= 1.2 && etaMinutes <= 3) return H3_COLORS.optimal;
    if (ratio >= 0.8 && etaMinutes <= 5) return H3_COLORS.moderate;
    if (ratio >= 0.5 && etaMinutes <= 8) return H3_COLORS.high;
    return H3_COLORS.low;
  }, []);

  const getHexOpacity = useCallback((hexStat: HexStat, zoom: number): number => {
    // Adaptive opacity based on zoom level and demand intensity
    const baseOpacity = 0.3;
    const zoomFactor = Math.max(0.1, Math.min(1, (zoom - 10) / 8)); // Scale 10-18 zoom to 0.1-1
    const demandFactor = Math.max(0.3, Math.min(1, hexStat.demand / 100));
    
    return Math.min(0.8, baseOpacity + (zoomFactor * demandFactor * 0.3));
  }, []);

  const createHexPolygon = useCallback((hexStat: HexStat, zoom: number): google.maps.Polygon => {
    const path = h3ToLatLngPath(hexStat.h3);
    const color = getHexColor(hexStat);
    const opacity = getHexOpacity(hexStat, zoom);

    const polygon = new google.maps.Polygon({
      paths: path,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillColor: color,
      fillOpacity: opacity,
      zIndex: 50,
      clickable: true
    });

    // Add click handler for hex details
    polygon.addListener('click', (e: google.maps.MapMouseEvent) => {
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-3 min-w-48">
            <h3 class="font-semibold text-lg mb-2 text-slate-900">Hex Analytics</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-600">H3 Index:</span>
                <span class="font-mono text-xs">${hexStat.h3}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Demand:</span>
                <span class="font-semibold text-blue-600">${hexStat.demand}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Supply:</span>
                <span class="font-semibold text-green-600">${hexStat.supply}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Avg ETA:</span>
                <span class="font-semibold text-amber-600">${Math.round(hexStat.eta / 60)}min</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Ratio:</span>
                <span class="font-semibold ${
                  hexStat.supply / Math.max(hexStat.demand, 1) >= 1.2 ? 'text-green-600' :
                  hexStat.supply / Math.max(hexStat.demand, 1) >= 0.8 ? 'text-amber-600' : 'text-red-600'
                }">${(hexStat.supply / Math.max(hexStat.demand, 1)).toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Resolution:</span>
                <span class="font-semibold">${getResolution(hexStat.h3)}</span>
              </div>
            </div>
          </div>
        `,
        position: e.latLng
      });
      infoWindow.open(map);
    });

    // Add hover effects
    polygon.addListener('mouseover', () => {
      polygon.setOptions({
        strokeWeight: 2,
        fillOpacity: Math.min(0.9, opacity + 0.2)
      });
    });

    polygon.addListener('mouseout', () => {
      polygon.setOptions({
        strokeWeight: 1,
        fillOpacity: opacity
      });
    });

    return polygon;
  }, [map, h3ToLatLngPath, getHexColor, getHexOpacity]);

  const updateH3Overlays = useCallback((hexStats: HexStat[]) => {
    if (!map || !isLoaded || !enabled) return;

    const startTime = performance.now();
    const currentZoom = map.getZoom() || 11;
    
    // Performance optimization: limit overlays based on zoom
    const maxHexes = currentZoom < 12 ? 100 : currentZoom < 15 ? 300 : 800;
    const limitedHexStats = hexStats.slice(0, maxHexes);

    // Clear existing overlays
    overlaysRef.current.forEach(overlay => {
      overlay.setMap(null);
    });
    overlaysRef.current.clear();

    let visibleCount = 0;
    let totalResolution = 0;

    // Create new overlays with performance tracking
    limitedHexStats.forEach(hexStat => {
      try {
        const polygon = createHexPolygon(hexStat, currentZoom);
        polygon.setMap(map);
        overlaysRef.current.set(hexStat.h3, polygon);
        visibleCount++;
        totalResolution += getResolution(hexStat.h3);
      } catch (error) {
        console.warn(`Failed to create overlay for H3: ${hexStat.h3}`, error);
      }
    });

    const endTime = performance.now();
    setOverlayStats({
      totalHexes: hexStats.length,
      visibleHexes: visibleCount,
      averageResolution: visibleCount > 0 ? Math.round(totalResolution / visibleCount) : 0,
      performance: {
        renderTime: endTime - startTime,
        lastUpdate: new Date()
      }
    });
  }, [map, isLoaded, enabled, createHexPolygon]);

  const clearH3Overlays = useCallback(() => {
    overlaysRef.current.forEach(overlay => {
      overlay.setMap(null);
    });
    overlaysRef.current.clear();
    setOverlayStats({
      totalHexes: 0,
      visibleHexes: 0,
      averageResolution: 0,
      performance: {
        renderTime: 0,
        lastUpdate: new Date()
      }
    });
  }, []);

  const setOverlaysVisibility = useCallback((visible: boolean) => {
    overlaysRef.current.forEach(overlay => {
      overlay.setVisible(visible);
    });
  }, []);

  const highlightHexes = useCallback((hexIds: string[], highlight: boolean = true) => {
    hexIds.forEach(hexId => {
      const overlay = overlaysRef.current.get(hexId);
      if (overlay) {
        overlay.setOptions({
          strokeColor: highlight ? '#0A4060' : overlay.get('strokeColor'),
          strokeWeight: highlight ? 3 : 1,
          fillOpacity: highlight ? 0.8 : 0.3,
          zIndex: highlight ? 100 : 50
        });
        
        if (highlight) {
          // Pulse animation for highlighted hexes
          let pulseCount = 0;
          const pulseInterval = setInterval(() => {
            const currentOpacity = overlay.get('fillOpacity');
            overlay.setOptions({
              fillOpacity: currentOpacity === 0.8 ? 0.4 : 0.8
            });
            pulseCount++;
            if (pulseCount >= 6) { // 3 full pulses
              clearInterval(pulseInterval);
              overlay.setOptions({ fillOpacity: 0.6 });
            }
          }, 300);
        }
      }
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearH3Overlays();
    };
  }, [clearH3Overlays]);

  return {
    updateH3Overlays,
    clearH3Overlays,
    setOverlaysVisibility,
    highlightHexes,
    overlayStats,
    overlays: overlaysRef.current
  };
}