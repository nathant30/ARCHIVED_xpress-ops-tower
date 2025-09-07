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

export default function SimpleMapDebug() {
  const apiKey = "AIzaSyBlVH5zLYBzZxizy4wCo_a3sOZC-UvWP5M";
  
  console.log('=== SIMPLE MAP DEBUG ===');
  console.log('API Key (first 10):', apiKey.substring(0, 10) + '...');
  console.log('Window location:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'simple-debug-map',
    googleMapsApiKey: apiKey,
    libraries,
    version: 'weekly'
  });

  console.log('Loading state:', { isLoaded, loadError });

  if (loadError) {
    console.error('Map load error:', loadError);
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        background: '#ffebee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        border: '2px solid red',
        padding: '20px'
      }}>
        <h2 style={{ color: 'red', margin: '0 0 10px 0' }}>Map Loading Error</h2>
        <p style={{ color: '#666', margin: 0 }}>
          {loadError.message || 'Unknown error occurred'}
        </p>
        <pre style={{ 
          marginTop: '10px', 
          fontSize: '12px', 
          background: '#f5f5f5', 
          padding: '10px',
          maxWidth: '100%',
          overflow: 'auto'
        }}>
          {JSON.stringify(loadError, null, 2)}
        </pre>
      </div>
    );
  }

  if (!isLoaded) {
    console.log('Still loading...');
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        background: '#e3f2fd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        border: '2px solid blue'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #ddd',
          borderTop: '5px solid #2196f3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: '20px', color: '#666' }}>Loading Google Maps...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  console.log('Map loaded successfully!');
  
  return (
    <div style={{ width: '100%', height: '400px', border: '2px solid green' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: 14.5995, lng: 120.9842 }}
        zoom={11}
        onLoad={(map) => {
          console.log('Map instance loaded:', map);
          // Add a simple marker to test
          new google.maps.Marker({
            position: { lat: 14.5995, lng: 120.9842 },
            map: map,
            title: 'Test marker - API working!'
          });
        }}
        options={{
          disableDefaultUI: false,
          gestureHandling: 'greedy'
        }}
      />
    </div>
  );
}