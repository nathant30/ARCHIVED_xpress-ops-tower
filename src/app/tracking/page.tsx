'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  MapPin, Navigation, Phone, MessageCircle, ArrowLeft, 
  Clock, User, Car, Route, RefreshCw, Zap, AlertTriangle 
} from 'lucide-react';

export default function TrackingPage() {
  const searchParams = useSearchParams();
  const driverName = searchParams.get('driver') || 'Unknown Driver';
  const plate = searchParams.get('plate') || 'Unknown';
  const bookingId = searchParams.get('booking') || '';

  const [currentLocation, setCurrentLocation] = useState({
    lat: 14.5995 + (Math.random() - 0.5) * 0.1, // Manila area with random offset
    lng: 120.9842 + (Math.random() - 0.5) * 0.1,
    address: 'Loading location...'
  });

  const [trackingData, setTrackingData] = useState({
    speed: Math.floor(Math.random() * 60) + 20,
    direction: Math.floor(Math.random() * 360),
    batteryLevel: Math.floor(Math.random() * 40) + 60,
    signal: 'Strong',
    lastUpdate: new Date(),
    status: Math.random() > 0.3 ? 'On Route' : 'Idle'
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLocation(prev => ({
        ...prev,
        lat: prev.lat + (Math.random() - 0.5) * 0.001,
        lng: prev.lng + (Math.random() - 0.5) * 0.001,
        address: `${Math.floor(Math.random() * 9999)} ${['Rizal Ave', 'EDSA', 'Taft Ave', 'Roxas Blvd', 'Ortigas Ave'][Math.floor(Math.random() * 5)]}, Manila`
      }));

      setTrackingData(prev => ({
        ...prev,
        speed: Math.max(0, prev.speed + (Math.random() - 0.5) * 10),
        direction: (prev.direction + (Math.random() - 0.5) * 20) % 360,
        lastUpdate: new Date(),
        status: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'Idle' : 'On Route') : prev.status
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.close()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Live Tracking</h1>
                <p className="text-sm text-gray-500">Booking {bookingId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Current Location</h2>
                <p className="text-sm text-gray-600">{currentLocation.address}</p>
              </div>
              
              {/* Google Maps Embed */}
              <div className="aspect-[16/10] relative">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=${currentLocation.lat},${currentLocation.lng}&zoom=15&maptype=roadmap`}
                  className="w-full h-full rounded-b-lg"
                  style={{border: 0}}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
                
                {/* Live indicator overlay */}
                <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">{driverName}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
                  <span>Driver moving at {Math.floor(trackingData.speed)} km/h</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-500">{new Date(Date.now() - 120000).toLocaleTimeString()}</span>
                  <span>Location updated</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-500">{new Date(Date.now() - 300000).toLocaleTimeString()}</span>
                  <span>Status changed to "{trackingData.status}"</span>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Info & Controls */}
          <div className="space-y-6">
            
            {/* Driver Profile */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{driverName}</h3>
                  <p className="text-sm text-gray-600">{plate}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`font-medium ${trackingData.status === 'On Route' ? 'text-green-600' : 'text-yellow-600'}`}>
                    {trackingData.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Speed</span>
                  <span className="font-medium">{Math.floor(trackingData.speed)} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Direction</span>
                  <span className="font-medium">{Math.floor(trackingData.direction)}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Battery</span>
                  <span className="font-medium">{trackingData.batteryLevel}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Signal</span>
                  <span className="font-medium text-green-600">{trackingData.signal}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center">
                  <Phone className="w-4 h-4" />
                  Call Driver
                </button>
                <button className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center">
                  <MessageCircle className="w-4 h-4" />
                  Send Message
                </button>
                <button className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center">
                  <RefreshCw className="w-4 h-4" />
                  Refresh Location
                </button>
              </div>
            </div>

            {/* Technical Info */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold mb-3">Technical Details</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Coordinates</span>
                  <span className="font-mono">{currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Update</span>
                  <span>{trackingData.lastUpdate.toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Update Interval</span>
                  <span>3 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span>GPS Accuracy</span>
                  <span>±3 meters</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}