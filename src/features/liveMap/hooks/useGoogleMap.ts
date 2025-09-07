'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import type { LatLng, ZoomLevel, CameraPreset } from '@/types/map';

const LIBRARIES: ("maps" | "marker" | "geometry" | "visualization" | "places")[] = [
  "maps", "marker", "geometry", "visualization", "places"
];

const CAMERA_PRESETS: Record<string, CameraPreset> = {
  city: {
    center: { lat: 14.5995, lng: 120.9842 }, // Manila
    zoom: 11,
    name: 'City'
  },
  district: {
    center: { lat: 14.5547, lng: 121.0244 }, // BGC
    zoom: 13,
    name: 'District'
  },
  street: {
    center: { lat: 14.5176, lng: 121.0509 }, // Makati CBD
    zoom: 15,
    name: 'Street'
  }
};

const MAP_OPTIONS: google.maps.MapOptions = {
  mapId: "XPRESS_BASE", // Configure this in Google Cloud Console
  disableDefaultUI: true,
  gestureHandling: "greedy",
  backgroundColor: "#0b0d10",
  clickableIcons: false,
  minZoom: 3,
  maxZoom: 20,
  styles: [
    // Neutral theme styles for Xpress design language
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#c9b2a6" }]
    },
    {
      featureType: "administrative.land_parcel",
      elementType: "geometry.stroke",
      stylers: [{ color: "#dcd2be" }]
    },
    {
      featureType: "administrative.land_parcel",
      elementType: "labels.text.fill",
      stylers: [{ color: "#ae9e90" }]
    },
    {
      featureType: "landscape.natural",
      elementType: "geometry",
      stylers: [{ color: "#dfd2ae" }]
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#dfd2ae" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#93817c" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry.fill",
      stylers: [{ color: "#a5b076" }]
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#447530" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#f5f1e6" }]
    },
    {
      featureType: "road.arterial",
      elementType: "geometry",
      stylers: [{ color: "#fdfcf8" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#f8c967" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#e9bc62" }]
    },
    {
      featureType: "road.highway.controlled_access",
      elementType: "geometry",
      stylers: [{ color: "#e98d58" }]
    },
    {
      featureType: "road.highway.controlled_access",
      elementType: "geometry.stroke",
      stylers: [{ color: "#db8555" }]
    },
    {
      featureType: "road.local",
      elementType: "labels.text.fill",
      stylers: [{ color: "#806b63" }]
    },
    {
      featureType: "transit.line",
      elementType: "geometry",
      stylers: [{ color: "#dfd2ae" }]
    },
    {
      featureType: "transit.line",
      elementType: "labels.text.fill",
      stylers: [{ color: "#8f7d77" }]
    },
    {
      featureType: "transit.line",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#ebe3cd" }]
    },
    {
      featureType: "transit.station",
      elementType: "geometry",
      stylers: [{ color: "#dfd2ae" }]
    },
    {
      featureType: "water",
      elementType: "geometry.fill",
      stylers: [{ color: "#b9d3c2" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#92998d" }]
    }
  ]
};

export function useGoogleMap() {
  // Debug: Log API key availability (first 10 chars only for security)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCvA59SPvyOeSKPI4y6r-AL97gn1Fq-v-c";
  console.log('Google Maps API Key available:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
  console.log('Current window.location:', typeof window !== 'undefined' ? window.location.href : 'SSR');

  const { isLoaded, loadError } = useJsApiLoader({
    id: "xpress-maps",
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
    version: "weekly"
  });

  // Debug: Log loading states
  console.log('Google Maps Loading State:', { isLoaded, loadError: loadError?.message });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [currentZoom, setCurrentZoom] = useState<ZoomLevel>(11);
  const [currentCenter, setCurrentCenter] = useState<LatLng>({ lat: 14.5995, lng: 120.9842 });
  const [isMapReady, setIsMapReady] = useState(false);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setIsMapReady(true);
    
    // Add zoom change listener
    map.addListener('zoom_changed', () => {
      const zoom = map.getZoom();
      if (zoom) {
        setCurrentZoom(zoom as ZoomLevel);
      }
    });

    // Add center change listener
    map.addListener('center_changed', () => {
      const center = map.getCenter();
      if (center) {
        setCurrentCenter({
          lat: center.lat(),
          lng: center.lng()
        });
      }
    });

    // Add keyboard shortcuts for accessibility
    map.addListener('keydown', (e: KeyboardEvent) => {
      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault();
          map.setZoom(Math.min((map.getZoom() || 11) + 1, 20));
          break;
        case '-':
        case '_':
          e.preventDefault();
          map.setZoom(Math.max((map.getZoom() || 11) - 1, 3));
          break;
        case 'ArrowUp':
          e.preventDefault();
          panMap(map, 0, -0.01);
          break;
        case 'ArrowDown':
          e.preventDefault();
          panMap(map, 0, 0.01);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          panMap(map, -0.01, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          panMap(map, 0.01, 0);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          fitToMetroManila(map);
          break;
      }
    });
  }, []);

  const panMap = (map: google.maps.Map, lngDelta: number, latDelta: number) => {
    const center = map.getCenter();
    if (center) {
      map.panTo({
        lat: center.lat() + latDelta,
        lng: center.lng() + lngDelta
      });
    }
  };

  const fitToMetroManila = (map: google.maps.Map) => {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: 14.7544, lng: 120.8897 }); // North
    bounds.extend({ lat: 14.4074, lng: 121.1787 }); // South
    map.fitBounds(bounds);
  };

  const setCameraPreset = useCallback((preset: 'city' | 'district' | 'street') => {
    if (!mapRef.current) return;
    
    const cameraPreset = CAMERA_PRESETS[preset];
    mapRef.current.panTo(cameraPreset.center);
    mapRef.current.setZoom(cameraPreset.zoom);
  }, []);

  const fitBounds = useCallback((bounds: { sw: LatLng; ne: LatLng }) => {
    if (!mapRef.current) return;
    
    const googleBounds = new google.maps.LatLngBounds();
    googleBounds.extend(bounds.sw);
    googleBounds.extend(bounds.ne);
    mapRef.current.fitBounds(googleBounds);
  }, []);

  const panTo = useCallback((center: LatLng) => {
    if (!mapRef.current) return;
    mapRef.current.panTo(center);
  }, []);

  const setZoom = useCallback((zoom: number) => {
    if (!mapRef.current) return;
    mapRef.current.setZoom(zoom);
  }, []);

  return {
    isLoaded,
    loadError,
    mapRef,
    isMapReady,
    currentZoom,
    currentCenter,
    onMapLoad,
    setCameraPreset,
    fitBounds,
    panTo,
    setZoom,
    mapOptions: MAP_OPTIONS,
    cameraPresets: CAMERA_PRESETS
  };
}