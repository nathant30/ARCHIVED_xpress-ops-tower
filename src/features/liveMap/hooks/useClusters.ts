'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { DriverMarker, RiderMarker, ClusterStats } from '@/types/map';

interface UseClusterOptions {
  map: google.maps.Map | null;
  isLoaded: boolean;
}

export function useClusters({ map, isLoaded }: UseClusterOptions) {
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const [clusterStats, setClusterStats] = useState<ClusterStats>({
    totalMarkers: 0,
    visibleMarkers: 0,
    clusterCount: 0,
    performance: {
      renderTime: 0,
      lastUpdate: new Date()
    }
  });

  // Initialize clusterer when map is ready
  useEffect(() => {
    if (!map || !isLoaded || clustererRef.current) return;

    clustererRef.current = new MarkerClusterer({
      map,
      algorithm: new (MarkerClusterer as any).SuperClusterAlgorithm({
        radius: 60,
        maxZoom: 16,
        minPoints: 3,
      }),
      renderer: {
        render: ({ count, position }) => {
          // Custom cluster rendering with Xpress design language
          const colorClass = count > 100 ? 'bg-red-500' : 
                           count > 50 ? 'bg-orange-500' : 
                           count > 10 ? 'bg-amber-500' : 'bg-blue-500';

          const clusterElement = document.createElement('div');
          clusterElement.className = `
            ${colorClass} text-white rounded-full flex items-center justify-center
            font-bold text-sm shadow-lg border-2 border-white
            transform hover:scale-110 transition-transform duration-200
            ${count > 100 ? 'w-14 h-14 text-lg' : 
              count > 50 ? 'w-12 h-12' : 
              count > 10 ? 'w-10 h-10' : 'w-8 h-8 text-xs'}
          `;
          clusterElement.textContent = count.toString();

          // Add click handler for cluster expansion
          clusterElement.addEventListener('click', () => {
            if (map) {
              map.setZoom((map.getZoom() || 11) + 2);
              map.panTo(position);
            }
          });

          return new google.maps.marker.AdvancedMarkerElement({
            position,
            content: clusterElement,
            zIndex: 1000
          });
        }
      }
    });

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
    };
  }, [map, isLoaded]);

  const createMarkerElement = useCallback((marker: DriverMarker | RiderMarker): HTMLElement => {
    const element = document.createElement('div');
    element.className = 'relative transform transition-all duration-200 hover:scale-110 cursor-pointer';

    if ('service' in marker) {
      // Driver marker
      const statusColor = marker.status === 'idle' ? 'bg-green-500' : 
                         marker.status === 'enroute' ? 'bg-blue-500' : 'bg-amber-500';
      
      const serviceIcon = marker.service === 'tnvs' ? '🚗' :
                         marker.service === 'taxi' ? '🚖' :
                         marker.service === 'special' ? '🚙' :
                         marker.service === 'pop' ? '🏍️' : '🛺';

      element.innerHTML = `
        <div class="relative">
          <div class="${statusColor} w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm">
            ${serviceIcon}
          </div>
          ${marker.status === 'idle' ? 
            '<div class="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-30"></div>' : 
            ''
          }
          <div class="absolute -top-1 -right-1 w-3 h-3 ${statusColor} rounded-full border border-white"></div>
        </div>
      `;

      // Add focus ring for accessibility
      element.setAttribute('tabindex', '0');
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', `Driver ${marker.id}: ${marker.status}`);
      element.addEventListener('focus', () => {
        element.style.outline = '2px solid #0A4060';
        element.style.outlineOffset = '2px';
      });
      element.addEventListener('blur', () => {
        element.style.outline = 'none';
      });
    } else {
      // Rider marker
      element.innerHTML = `
        <div class="w-6 h-6 bg-purple-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>
      `;
    }

    return element;
  }, []);

  const updateDriverMarkers = useCallback((drivers: DriverMarker[]) => {
    if (!clustererRef.current) return;

    const startTime = performance.now();
    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
    const currentMarkers = markersRef.current;

    // Update existing markers and create new ones
    drivers.forEach(driver => {
      let marker = currentMarkers.get(driver.id);
      
      if (marker) {
        // Update position
        marker.position = driver.pos;
        // Update content if status changed
        const newContent = createMarkerElement(driver);
        if (marker.content !== newContent) {
          marker.content = newContent;
        }
      } else {
        // Create new marker
        marker = new google.maps.marker.AdvancedMarkerElement({
          position: driver.pos,
          content: createMarkerElement(driver),
          zIndex: 100
        });
        currentMarkers.set(driver.id, marker);
      }
      
      newMarkers.push(marker);
    });

    // Remove markers that no longer exist
    const currentDriverIds = new Set(drivers.map(d => d.id));
    currentMarkers.forEach((marker, id) => {
      if (!currentDriverIds.has(id)) {
        currentMarkers.delete(id);
      }
    });

    // Update clusterer
    clustererRef.current.clearMarkers();
    clustererRef.current.addMarkers(newMarkers);

    const endTime = performance.now();
    setClusterStats({
      totalMarkers: drivers.length,
      visibleMarkers: newMarkers.length,
      clusterCount: clustererRef.current.clusters.length,
      performance: {
        renderTime: endTime - startTime,
        lastUpdate: new Date()
      }
    });
  }, [createMarkerElement]);

  const updateRiderMarkers = useCallback((riders: RiderMarker[]) => {
    // Similar implementation for riders
    // For brevity, implementing basic version
    if (!clustererRef.current) return;

    const riderMarkers = riders.map(rider => 
      new google.maps.marker.AdvancedMarkerElement({
        position: rider.pos,
        content: createMarkerElement(rider),
        zIndex: 50
      })
    );

    // Add to existing markers instead of replacing
    clustererRef.current.addMarkers(riderMarkers);
  }, [createMarkerElement]);

  const clearAllMarkers = useCallback(() => {
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      markersRef.current.clear();
      setClusterStats({
        totalMarkers: 0,
        visibleMarkers: 0,
        clusterCount: 0,
        performance: {
          renderTime: 0,
          lastUpdate: new Date()
        }
      });
    }
  }, []);

  const getMarkerById = useCallback((id: string) => {
    return markersRef.current.get(id);
  }, []);

  return {
    updateDriverMarkers,
    updateRiderMarkers,
    clearAllMarkers,
    getMarkerById,
    clusterStats,
    clusterer: clustererRef.current
  };
}