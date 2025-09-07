'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { useGoogleMap } from './hooks/useGoogleMap';
import { useClusters } from './hooks/useClusters';
import { useH3Overlays } from './hooks/useH3Overlays';
import Legend from './components/Legend';
import InsightPin from './components/InsightPin';
import type { 
  DriverMarker, 
  RiderMarker, 
  HexStat, 
  Poi, 
  AiInsight,
  HeatmapData,
  LatLng 
} from '@/types/map';

interface LiveMapProps {
  className?: string;
  // Data props
  drivers?: DriverMarker[];
  riders?: RiderMarker[];
  hexStats?: HexStat[];
  pois?: Poi[];
  aiInsights?: AiInsight[];
  
  // Layer visibility
  showHeatmap?: boolean;
  showDriverHubs?: boolean;
  showZones?: boolean;
  showPOI?: boolean;
  showTrips?: boolean;
  showAiInsights?: boolean;
  
  // Filter props  
  activeStatusFilter?: string | null;
  onStatusFilterChange?: (filter: string | null) => void;
  
  // AI-Enhanced props
  aiDemandPrediction?: number;
  aiAnomalyAreas?: string[];
  aiPredictedHotspots?: string[];
  aiKPIs?: any[];
  
  // Exception Filter Props
  filterData?: {
    drivers: any[];
    areas: any[];
    incidents: any[];
    showAll: boolean;
  };
  activeExceptionFilters?: Record<string, boolean>;
  emergencyIncidents?: any[];
  
  // Zone System Props
  metroManilaZones?: any[];
  selectedZone?: any;
  onZoneSelect?: (zone: any) => void;
  onZoneHover?: (zoneId: string | null) => void;
  
  // Callbacks
  onMapReady?: (map: google.maps.Map) => void;
  onMarkerClick?: (marker: DriverMarker | RiderMarker) => void;
  onInsightClick?: (insight: AiInsight) => void;
}

export default function LiveMap({
  className = '',
  drivers = [],
  riders = [],
  hexStats = [],
  pois = [],
  aiInsights = [],
  showHeatmap = true,
  showDriverHubs = true,
  showZones = true,
  showPOI = true,
  showAiInsights = true,
  activeStatusFilter = null,
  onStatusFilterChange,
  aiDemandPrediction = 0.87,
  aiAnomalyAreas = [],
  aiPredictedHotspots = [],
  filterData,
  activeExceptionFilters,
  emergencyIncidents = [],
  metroManilaZones = [],
  selectedZone,
  onZoneSelect,
  onZoneHover,
  onMapReady,
  onMarkerClick,
  onInsightClick
}: LiveMapProps) {
  const { 
    isLoaded, 
    loadError, 
    mapRef, 
    isMapReady,
    currentZoom,
    currentCenter,
    onMapLoad,
    setCameraPreset,
    fitBounds,
    mapOptions 
  } = useGoogleMap();

  const { 
    updateDriverMarkers,
    updateRiderMarkers,
    clearAllMarkers,
    clusterStats 
  } = useClusters({ 
    map: mapRef.current, 
    isLoaded 
  });

  const { 
    updateH3Overlays,
    clearH3Overlays,
    setOverlaysVisibility,
    highlightHexes,
    overlayStats 
  } = useH3Overlays({ 
    map: mapRef.current, 
    isLoaded,
    enabled: showZones 
  });

  // State management
  const [heatmapLayer, setHeatmapLayer] = useState<google.maps.visualization.HeatmapLayer | null>(null);
  const [legendVisible, setLegendVisible] = useState(true);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [highlightedInsight, setHighlightedInsight] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  // Generate mock data for development
  const mockDrivers: DriverMarker[] = useMemo(() => [
    // BGC Area
    { id: 'driver-1', pos: { lat: 14.5547, lng: 121.0244 }, status: 'idle', service: 'tnvs' },
    { id: 'driver-2', pos: { lat: 14.5565, lng: 121.0267 }, status: 'enroute', service: 'taxi' },
    { id: 'driver-3', pos: { lat: 14.5523, lng: 121.0198 }, status: 'idle', service: 'pop' },
    
    // Makati CBD
    { id: 'driver-4', pos: { lat: 14.5176, lng: 121.0509 }, status: 'enroute', service: 'tnvs' },
    { id: 'driver-5', pos: { lat: 14.5198, lng: 121.0456 }, status: 'idle', service: 'taxi' },
    { id: 'driver-6', pos: { lat: 14.5134, lng: 121.0532 }, status: 'ontrip', service: 'twg' },
    
    // Ortigas
    { id: 'driver-7', pos: { lat: 14.5794, lng: 121.0359 }, status: 'idle', service: 'pop' },
    { id: 'driver-8', pos: { lat: 14.5823, lng: 121.0412 }, status: 'enroute', service: 'tnvs' },
    
    // Manila
    { id: 'driver-9', pos: { lat: 14.5995, lng: 120.9842 }, status: 'idle', service: 'taxi' },
    { id: 'driver-10', pos: { lat: 14.6021, lng: 120.9889 }, status: 'ontrip', service: 'special' },
    
    // Quezon City
    { id: 'driver-11', pos: { lat: 14.6349, lng: 121.0569 }, status: 'idle', service: 'tnvs' },
    { id: 'driver-12', pos: { lat: 14.6423, lng: 121.0634 }, status: 'enroute', service: 'pop' },
    
    // Airport Area
    { id: 'driver-13', pos: { lat: 14.5086, lng: 121.0198 }, status: 'idle', service: 'taxi' },
    { id: 'driver-14', pos: { lat: 14.5123, lng: 121.0145 }, status: 'ontrip', service: 'tnvs' },
    
    // Additional scattered drivers
    ...Array.from({ length: 25 }, (_, i) => ({
      id: `driver-scatter-${i}`,
      pos: {
        lat: 14.4 + Math.random() * 0.4,
        lng: 120.9 + Math.random() * 0.3
      },
      status: Math.random() > 0.6 ? 'idle' : Math.random() > 0.5 ? 'enroute' : 'ontrip' as 'idle' | 'enroute' | 'ontrip',
      service: ['tnvs', 'taxi', 'pop', 'twg', 'special'][Math.floor(Math.random() * 5)] as any
    }))
  ], []);

  const mockHexStats: HexStat[] = useMemo(() => [
    // High-demand areas
    { h3: '871fb46dfffffff', demand: 120, supply: 85, eta: 420 }, // BGC
    { h3: '871fb46e7ffffff', demand: 98, supply: 76, eta: 380 },  // Makati
    { h3: '871fb46edffffff', demand: 87, supply: 94, eta: 290 },  // Ortigas
    { h3: '871fb46f5ffffff', demand: 76, supply: 68, eta: 450 },  // Manila
    { h3: '871fb46f7ffffff', demand: 65, supply: 78, eta: 320 },  // QC
    { h3: '871fb46efffffff', demand: 110, supply: 67, eta: 520 }, // Airport
    
    // Additional hex coverage
    ...Array.from({ length: 15 }, (_, i) => ({
      h3: `871fb46${i.toString(16)}fffffff`,
      demand: Math.floor(Math.random() * 80) + 20,
      supply: Math.floor(Math.random() * 90) + 30,
      eta: Math.floor(Math.random() * 300) + 180
    }))
  ], []);

  const mockAiInsights: AiInsight[] = useMemo(() => [
    {
      id: 'insight-1',
      title: 'Demand Surge Predicted',
      type: 'surge',
      target: { bounds: { sw: { lat: 14.5500, lng: 121.0200 }, ne: { lat: 14.5600, lng: 121.0300 } } },
      confidence: 0.89,
      etaMins: 15
    },
    {
      id: 'insight-2', 
      title: 'Supply Gap Detected',
      type: 'supply_gap',
      target: { bounds: { sw: { lat: 14.5100, lng: 121.0400 }, ne: { lat: 14.5250, lng: 121.0550 } } },
      confidence: 0.76,
      etaMins: 8
    },
    {
      id: 'insight-3',
      title: 'Route Optimization Available',
      type: 'optimized_route', 
      target: { hexes: ['871fb46dfffffff', '871fb46e7ffffff'] },
      confidence: 0.94,
      etaMins: 3
    }
  ], []);

  // Use provided data or fall back to mock data
  const activeDrivers = drivers.length > 0 ? drivers : mockDrivers;
  const activeHexStats = hexStats.length > 0 ? hexStats : mockHexStats;
  const activeAiInsights = aiInsights.length > 0 ? aiInsights : mockAiInsights;

  // Handle map load
  const handleMapLoad = useCallback((map: google.maps.Map) => {
    onMapLoad(map);
    onMapReady?.(map);
    
    // Initialize heatmap layer
    if (showHeatmap && isLoaded) {
      const heatmap = new google.maps.visualization.HeatmapLayer({
        data: [],
        dissipating: true,
        radius: 30,
        maxIntensity: 10,
        opacity: 0.6
      });
      setHeatmapLayer(heatmap);
    }
  }, [onMapLoad, onMapReady, showHeatmap, isLoaded]);

  // Update markers when data changes
  useEffect(() => {
    if (!isMapReady) return;
    
    const filteredDrivers = activeStatusFilter 
      ? activeDrivers.filter(d => d.status === activeStatusFilter)
      : activeDrivers;
    
    updateDriverMarkers(filteredDrivers);
    if (riders.length > 0) {
      updateRiderMarkers(riders);
    }
  }, [activeDrivers, riders, activeStatusFilter, updateDriverMarkers, updateRiderMarkers, isMapReady]);

  // Update H3 overlays
  useEffect(() => {
    if (!isMapReady || !showZones) return;
    updateH3Overlays(activeHexStats);
  }, [activeHexStats, showZones, updateH3Overlays, isMapReady]);

  // Update heatmap data
  useEffect(() => {
    if (!heatmapLayer || !showHeatmap) return;

    const heatmapData: HeatmapData[] = activeDrivers.map(driver => ({
      location: new google.maps.LatLng(driver.pos.lat, driver.pos.lng),
      weight: driver.status === 'idle' ? 1 : driver.status === 'enroute' ? 2 : 3
    }));

    heatmapLayer.setData(heatmapData);
    heatmapLayer.setMap(showHeatmap ? mapRef.current : null);
  }, [activeDrivers, heatmapLayer, showHeatmap, mapRef]);

  // Handle AI insight interactions
  const handleInsightClick = useCallback((insight: AiInsight) => {
    if (insight.target.bounds) {
      fitBounds(insight.target.bounds);
    }
    
    if (insight.target.hexes) {
      highlightHexes(insight.target.hexes, true);
      setTimeout(() => {
        highlightHexes(insight.target.hexes!, false);
      }, 3000);
    }
    
    setHighlightedInsight(insight.id);
    setTimeout(() => {
      setHighlightedInsight(null);
    }, 2000);
    
    onInsightClick?.(insight);
  }, [fitBounds, highlightHexes, onInsightClick]);

  // Auto-refresh simulation
  useEffect(() => {
    if (!showDriverHubs) return;
    
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [showDriverHubs]);

  // Calculate legend data
  const legendData = useMemo(() => {
    const stats = { optimal: 0, moderate: 0, high: 0, low: 0 };
    
    activeHexStats.forEach(hex => {
      const ratio = hex.supply / Math.max(hex.demand, 1);
      const etaMinutes = hex.eta / 60;
      
      if (ratio >= 1.2 && etaMinutes <= 3) stats.optimal++;
      else if (ratio >= 0.8 && etaMinutes <= 5) stats.moderate++;
      else if (ratio >= 0.5 && etaMinutes <= 8) stats.high++;
      else stats.low++;
    });
    
    return stats;
  }, [activeHexStats]);

  // Handle keyboard shortcuts for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mapRef.current) return;
      
      // City/District/Street presets
      switch (e.key) {
        case '1':
          e.preventDefault();
          setCameraPreset('city');
          break;
        case '2':
          e.preventDefault();
          setCameraPreset('district');
          break;
        case '3':
          e.preventDefault();
          setCameraPreset('street');
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          setLegendVisible(!legendVisible);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCameraPreset, legendVisible]);

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <div className="text-center p-8 max-w-md">
          <div className="text-red-600 text-xl font-bold mb-4">🗺️ Map Loading Error</div>
          <div className="text-slate-700 mb-4">
            Failed to load Google Maps. This could be due to:
          </div>
          <div className="text-left text-sm text-slate-600 bg-white p-4 rounded-lg border">
            <ul className="space-y-2">
              <li>• <strong>API Key Issues:</strong> Check if the key is valid</li>
              <li>• <strong>Domain Restrictions:</strong> Add localhost:3003 to allowed domains</li>
              <li>• <strong>Required APIs:</strong> Enable Maps JavaScript API, Places API</li>
              <li>• <strong>Billing:</strong> Ensure billing is set up in Google Cloud</li>
            </ul>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            Current API Key: AIzaSyBlV...P5M
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-600 font-medium">Loading Google Maps...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} role="application" aria-label="Live operations map">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={currentCenter}
        zoom={currentZoom}
        options={mapOptions}
        onLoad={handleMapLoad}
      >
        {/* AI Insight Pins */}
        {showAiInsights && activeAiInsights.map(insight => {
          const position = insight.target.bounds ? {
            lat: (insight.target.bounds.sw.lat + insight.target.bounds.ne.lat) / 2,
            lng: (insight.target.bounds.sw.lng + insight.target.bounds.ne.lng) / 2
          } : { lat: 14.5547, lng: 121.0244 }; // Default to BGC

          return (
            <div key={insight.id} className="absolute" style={{
              left: `${((position.lng - 120.9) / 0.3) * 100}%`,
              top: `${((14.7 - position.lat) / 0.4) * 100}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 200
            }}>
              <InsightPin
                insight={insight}
                onClick={handleInsightClick}
                onFocus={(insight) => setHighlightedInsight(insight.id)}
                onBlur={() => setHighlightedInsight(null)}
                isHighlighted={highlightedInsight === insight.id}
              />
            </div>
          );
        })}
      </GoogleMap>

      {/* Legend */}
      <Legend
        visible={legendVisible}
        onVisibilityToggle={() => setLegendVisible(!legendVisible)}
        currentZoom={currentZoom}
        hoveredZone={hoveredZone ? {
          name: hoveredZone,
          eta: 4.2,
          supplyGap: 22,
          activeTrips: 47,
          demand: 'High +15%'
        } : null}
        legendData={legendData}
        onLegendHover={onZoneHover}
      />

      {/* Performance indicator */}
      <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-medium text-slate-700">
            {clusterStats.totalMarkers} drivers • {overlayStats.visibleHexes} zones
          </span>
        </div>
      </div>

      {/* Accessibility instructions */}
      <div className="sr-only" aria-live="polite">
        Use arrow keys to pan, +/- to zoom, F to fit bounds, 1/2/3 for city/district/street presets, H to toggle legend
      </div>
    </div>
  );
}