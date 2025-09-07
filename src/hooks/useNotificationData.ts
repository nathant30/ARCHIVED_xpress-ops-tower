'use client';

import { useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

// Mock data service to simulate real-time updates
export function useNotificationData() {
  const { setBadge, updateBadgeCount, setLiveStatus, removeBadge } = useNotifications();
  
  useEffect(() => {
    // Initialize badges with real-time data simulation
    const initializeBadges = () => {
      // Live Map - always show live status
      setLiveStatus('live-map', true);
      
      // Bookings - dynamic count
      setBadge('bookings', {
        id: 'bookings-count',
        type: 'count',
        value: 142,
        color: 'blue'
      });
      
      // Drivers - dynamic count
      setBadge('drivers', {
        id: 'drivers-count', 
        type: 'count',
        value: 2000,
        color: 'green'
      });
      
      // Safety - NEW badge for new features
      setBadge('safety', {
        id: 'safety-new',
        type: 'new',
        value: 'NEW',
        color: 'purple'
      });
      
      // Fraud Protect - alert count
      setBadge('fraud-protect', {
        id: 'fraud-alerts',
        type: 'count',
        value: 47,
        color: 'red'
      });
      
      // Pricing - NEW badge for pricing center
      setBadge('pricing', {
        id: 'pricing-new',
        type: 'new', 
        value: 'NEW',
        color: 'blue'
      });
      
      // Vehicles - NEW badge for vehicle management
      setBadge('vehicles', {
        id: 'vehicles-new',
        type: 'new',
        value: 'NEW', 
        color: 'green'
      });
      
      // Nexus AI - AI status badge
      setBadge('ai-expansions', {
        id: 'nexus-ai',
        type: 'status',
        value: 'AI',
        color: 'purple',
        persistent: true
      });
    };
    
    initializeBadges();
    
    // Simulate real-time updates
    const updateInterval = setInterval(() => {
      // Randomly update some counts to simulate real-time changes
      const updates = [
        { itemId: 'bookings', count: Math.floor(Math.random() * 50) + 120 },
        { itemId: 'fraud-protect', count: Math.floor(Math.random() * 20) + 30 },
        { itemId: 'drivers', count: Math.floor(Math.random() * 100) + 1950 }
      ];
      
      updates.forEach(({ itemId, count }) => {
        updateBadgeCount(itemId, count);
      });
    }, 30000); // Update every 30 seconds
    
    return () => {
      clearInterval(updateInterval);
    };
  }, [setBadge, updateBadgeCount, setLiveStatus]);
}

// Hook to get mock data counts for specific sections
export function useMockDataCounts() {
  return {
    activeBookings: 142,
    activeFraudAlerts: 47,
    totalDrivers: 2000,
    pendingApprovals: 23,
    systemAlerts: 5,
    activeVehicles: 1850
  };
}