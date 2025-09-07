import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LiveMap from '../LiveMap';
import type { DriverMarker, HexStat, AiInsight } from '@/types/map';

// Mock Google Maps API
const mockMap = {
  addListener: jest.fn(),
  setZoom: jest.fn(),
  getZoom: jest.fn(() => 11),
  panTo: jest.fn(),
  getCenter: jest.fn(() => ({ lat: () => 14.5995, lng: () => 120.9842 })),
  fitBounds: jest.fn(),
  setOptions: jest.fn()
};

// Mock the Google Maps hooks
jest.mock('../hooks/useGoogleMap', () => ({
  useGoogleMap: () => ({
    isLoaded: true,
    loadError: null,
    mapRef: { current: mockMap },
    isMapReady: true,
    currentZoom: 11,
    currentCenter: { lat: 14.5995, lng: 120.9842 },
    onMapLoad: jest.fn(),
    setCameraPreset: jest.fn(),
    fitBounds: jest.fn(),
    mapOptions: {},
    cameraPresets: {}
  })
}));

jest.mock('../hooks/useClusters', () => ({
  useClusters: () => ({
    updateDriverMarkers: jest.fn(),
    updateRiderMarkers: jest.fn(),
    clearAllMarkers: jest.fn(),
    clusterStats: {
      totalMarkers: 10,
      visibleMarkers: 8,
      clusterCount: 2,
      performance: { renderTime: 15, lastUpdate: new Date() }
    }
  })
}));

jest.mock('../hooks/useH3Overlays', () => ({
  useH3Overlays: () => ({
    updateH3Overlays: jest.fn(),
    clearH3Overlays: jest.fn(),
    setOverlaysVisibility: jest.fn(),
    highlightHexes: jest.fn(),
    overlayStats: {
      totalHexes: 20,
      visibleHexes: 15,
      averageResolution: 8,
      performance: { renderTime: 25, lastUpdate: new Date() }
    }
  })
}));

// Mock @react-google-maps/api
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: ({ children, onLoad }: any) => {
    React.useEffect(() => {
      onLoad?.(mockMap);
    }, [onLoad]);
    return <div data-testid="google-map">{children}</div>;
  },
  useJsApiLoader: () => ({ isLoaded: true, loadError: null })
}));

describe('LiveMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<LiveMap />);
    
    await waitFor(() => {
      expect(screen.getByTestId('google-map')).toBeInTheDocument();
    });
  });

  it('renders legend component', async () => {
    render(<LiveMap />);
    
    await waitFor(() => {
      expect(screen.getByText(/Heatmap Legend/)).toBeInTheDocument();
    });
  });

  it('displays performance indicator', async () => {
    render(<LiveMap />);
    
    await waitFor(() => {
      expect(screen.getByText(/drivers.*zones/)).toBeInTheDocument();
    });
  });
});