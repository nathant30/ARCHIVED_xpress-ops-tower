'use client';

import React from 'react';
import { useJsApiLoader, GoogleMap } from '@react-google-maps/api';

const libraries: (
  | "drawing"
  | "geometry"  
  | "localContext"
  | "places"
  | "visualization"
)[] = ['visualization', 'geometry'];

export default function DebugMapPage() {
  const apiKey = "AIzaSyBlVH5zLYBzZxizy4wCo_a3sOZC-UvWP5M";
  
  console.log('=== DEBUG MAP PAGE ===');
  console.log('API Key (first 10):', apiKey.substring(0, 10) + '...');
  console.log('Window location:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'debug-map-page',
    googleMapsApiKey: apiKey,
    libraries,
    version: 'weekly'
  });

  console.log('Loading state:', { isLoaded, loadError });

  return (
    <div style={{ padding: '20px' }}>
      <h1>Google Maps Debug Page</h1>
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5' }}>
        <p><strong>API Key:</strong> {apiKey.substring(0, 10)}...</p>
        <p><strong>Is Loaded:</strong> {String(isLoaded)}</p>
        <p><strong>Load Error:</strong> {loadError ? loadError.message : 'None'}</p>
        <p><strong>Window Location:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
      </div>
      
      {loadError && (
        <div style={{ 
          background: '#ffebee',
          border: '2px solid red',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '5px'
        }}>
          <h2 style={{ color: 'red', margin: '0 0 10px 0' }}>Map Loading Error</h2>
          <p>{loadError.message}</p>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            fontSize: '12px',
            overflow: 'auto' 
          }}>
            {JSON.stringify(loadError, null, 2)}
          </pre>
        </div>
      )}

      {!isLoaded && !loadError && (
        <div style={{ 
          background: '#e3f2fd',
          border: '2px solid blue',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '20px',
          borderRadius: '5px'
        }}>
          <p>Loading Google Maps...</p>
        </div>
      )}

      {isLoaded && (
        <div style={{ 
          background: '#e8f5e8',
          border: '2px solid green',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '5px'
        }}>
          <h2 style={{ color: 'green', margin: '0 0 10px 0' }}>Google Maps Loaded Successfully!</h2>
          <div style={{ width: '100%', height: '400px' }}>
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={{ lat: 14.5995, lng: 120.9842 }}
              zoom={11}
              onLoad={(map) => {
                console.log('Map instance loaded successfully!', map);
                // Add a test marker
                new google.maps.Marker({
                  position: { lat: 14.5995, lng: 120.9842 },
                  map: map,
                  title: 'Debug test marker - API is working!'
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}