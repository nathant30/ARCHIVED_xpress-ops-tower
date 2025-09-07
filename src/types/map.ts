export type LatLng = { lat: number; lng: number };

export type DriverMarker = {
  id: string; 
  pos: LatLng; 
  status: "idle"|"enroute"|"ontrip";
  service: "tnvs"|"taxi"|"special"|"pop"|"twg";
  name?: string;
  rating?: number;
  completedTrips?: number;
  lastActivity?: Date;
  vehicle?: {
    type: string;
    plate: string;
    model?: string;
  };
};

export type RiderMarker = { 
  id: string; 
  pos: LatLng; 
  demandScore?: number;
};

export type HexStat = {
  h3: string;  // res 7–9
  demand: number; 
  supply: number; 
  eta: number; // seconds
};

export type Poi = {
  id: string; 
  pos: LatLng; 
  kind: "airport"|"mall"|"terminal"|"hub";
  name: string; 
  polygon?: LatLng[]; 
  pickupZones?: LatLng[][];
};

export type AiInsight = {
  id: string; 
  title: string; 
  type: "surge"|"supply_gap"|"optimized_route";
  target: { 
    hexes?: string[]; 
    bounds?: {sw: LatLng; ne: LatLng} 
  };
  confidence: number; 
  etaMins?: number;
};

export type ZoomLevel = 11 | 13 | 15; // City/District/Street
export type MapTheme = 'neutral' | 'dark' | 'satellite';

export type MapLayer = {
  id: string;
  enabled: boolean;
  opacity: number;
  zIndex: number;
};

export type ClusterStats = {
  totalMarkers: number;
  visibleMarkers: number;
  clusterCount: number;
  performance: {
    renderTime: number;
    lastUpdate: Date;
  };
};

export type HeatmapData = {
  location: google.maps.LatLng;
  weight: number;
};

export type MapBounds = {
  sw: LatLng;
  ne: LatLng;
};

export type CameraPreset = {
  center: LatLng;
  zoom: number;
  name: string;
};