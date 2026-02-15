'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRBAC, PermissionButton } from '@/hooks/useRBAC';
import { 
  Car, Clock, DollarSign, CheckCircle, XCircle, AlertTriangle, Users, MapPin, 
  Filter, Search, Calendar, MoreHorizontal, ArrowUpRight, ArrowDownRight, 
  Activity, Navigation, Phone, MessageCircle, UserCheck, Route, Star, 
  ChevronDown, ChevronUp, ChevronRight, RefreshCw, Volume2, MapIcon, Timer, 
  CreditCard, AlertCircle, Eye, Edit, Ban, UserPlus, Zap, PlayCircle,
  PauseCircle, SkipForward, Loader, TrendingUp, Navigation2, Truck, User,
  History, Shield, Settings, Gift, TrendingDown, Percent, Flag, Download, Copy, RotateCcw, List,
  ChevronLeft, Brain, BarChart3, Target, Database
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useServiceType } from '@/contexts/ServiceTypeContext';

// Calendar helper functions
const getDaysInMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

const isSameDay = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const isDateInRange = (date: Date, from?: Date, to?: Date) => {
  if (!from || !to) return false;
  return date >= from && date <= to;
};

// Enhanced KPI Card component with consistent spacing
function KpiCard({label, value, trend, up, icon: Icon}: {label: string, value: string, trend: string, up?: boolean, icon?: any}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
        {Icon && <Icon className="w-3 h-3 text-gray-400" />}
      </div>
      <div className="text-xl font-bold text-gray-900 mb-2">{value}</div>
      <div className={`flex items-center gap-1 text-xs font-medium ${
        up ? "text-emerald-600" : trend.includes('-') ? "text-emerald-600" : "text-red-500"
      }`}>
        {up || trend.includes('-') ? 
          <ArrowUpRight className="w-3 h-3" /> : 
          <ArrowDownRight className="w-3 h-3" />
        }
        <span>{trend}</span>
      </div>
    </div>
  )
}

// Enhanced booking types with comprehensive real-time data
interface PassengerDetails {
  id: string;
  name: string;
  phone: string;
  rating: number;
  totalTrips: number;
  paymentMethod: 'cash' | 'card' | 'digital_wallet' | 'corporate';
  specialRequests?: string[];
  appliedPromo?: {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
    description: string;
  };
}

interface DriverDetails {
  id: string;
  name: string;
  phone: string;
  rating: number;
  vehicleType: string;
  vehiclePlate: string;
  vehicleModel: string;
  currentLocation?: [number, number];
  eta?: number;
  totalTrips: number;
  acceptanceRate: number;
}

interface TripProgress {
  status: 'requesting' | 'driver_assigned' | 'driver_enroute' | 'arrived' | 'pickup' | 'in_transit' | 'completed' | 'cancelled';
  timeline: {
    timestamp: Date;
    status: string;
  }[];
  estimatedCompletion?: Date;
}

interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  surgeFare: number;
  fees: number;
  discount: number;
  total: number;
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed';
  paymentMethod: string;
  costOfSale?: {
    driverEarnings: number;
    platformFee: number;
    commissionRate: number;
    operatingCosts: number;
    netRevenue: number;
    profitMargin: number;
  };
  promotions?: {
    passengerPromo?: {
      code: string;
      discount: number;
      type: 'percentage' | 'fixed';
    };
    driverIncentive?: {
      type: 'surge_bonus' | 'completion_bonus' | 'loyalty_bonus';
      amount: number;
      description: string;
    };
  };
}

interface TripTimelineEvent {
  id: string;
  status: 'requested' | 'assigning' | 'assigned' | 'enroute_pickup' | 'arrived_pickup' | 'passenger_pickup' | 'enroute_destination' | 'arrived_destination' | 'completed' | 'cancelled';
  timestamp: Date;
  duration?: number; // milliseconds since previous event
  description: string;
  location?: [number, number];
  metadata?: Record<string, any>;
}

interface DriverAssignmentAttempt {
  id: string;
  driverId: string;
  driverName: string;
  offeredAt: Date;
  status: 'offered' | 'accepted' | 'declined' | 'timeout' | 'cancelled';
  responseAt?: Date;
  responseTime?: number; // seconds
  declineReason?: string;
  distance?: number; // km from pickup
  rating?: number;
  isOnTrip?: boolean;
  kpiImpact?: {
    acceptanceRate?: number;
    responseTime?: number;
    backToBackOffered?: boolean;
  };
}

interface CommunicationEvent {
  id: string;
  timestamp: Date;
  type: 'call' | 'message' | 'system_notification';
  direction: 'passenger_to_driver' | 'driver_to_passenger' | 'system_to_passenger' | 'system_to_driver';
  duration?: number; // for calls, in seconds
  content?: string; // for messages
  status: 'sent' | 'delivered' | 'read' | 'failed';
  isPrivate: boolean; // RBAC control
}

interface BookingDetails {
  id: string;
  bookingId: string;
  passenger: PassengerDetails;
  driver?: DriverDetails;
  pickup: {
    address: string;
    coordinates: [number, number];
    instructions?: string;
  };
  destination: {
    address: string;
    coordinates: [number, number];
    instructions?: string;
  };
  serviceType: 'motorcycle' | 'car' | 'suv' | 'taxi' | 'premium';
  tripProgress: TripProgress;
  fareBreakdown: FareBreakdown;
  estimatedDuration: number;
  actualDuration?: number;
  distance: number;
  scheduledFor?: Date;
  requestedAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  rating?: number;
  feedback?: string;
  emergencyFlag?: boolean;
  lastLocationUpdate?: Date;
  requestTimeout?: Date;
  promoCode?: string;
  tripTimeline?: TripTimelineEvent[];
  driverAssignmentHistory?: DriverAssignmentAttempt[];
  communicationHistory?: CommunicationEvent[];
}

// Legacy interface for compatibility
interface Booking {
  id: string;
  bookingId: string;
  passenger: string;
  driver: string;
  pickup: string;
  destination: string;
  status: 'Active' | 'Completed' | 'Cancelled' | 'Scheduled' | 'Requesting' | 'Failed';
  serviceType: string;
  fare: number;
  duration: string;
  distance: string;
  createdAt: Date;
  isExpanded?: boolean;
  details?: BookingDetails;
}

const BookingsPage = () => {
  const { selectedServiceType, serviceTypes } = useServiceType();
  const { hasPermission, canPerformAction } = useRBAC();
  const [activeTab, setActiveTab] = useState('requesting'); // Start with requesting tab
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingRange, setSelectingRange] = useState(false);
  const [showSearchGuide, setShowSearchGuide] = useState(false);
  // Modal system - no longer using expandedBookings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [forceAssignModal, setForceAssignModal] = useState<string | null>(null);
  const [assigningDriverId, setAssigningDriverId] = useState<string | null>(null);
  const [assignmentStatus, setAssignmentStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [assignmentMessage, setAssignmentMessage] = useState<string>('');
  const [cancelledDriverId, setCancelledDriverId] = useState<string | null>(null);
  const [expandedTimelineEvents, setExpandedTimelineEvents] = useState<Set<string>>(new Set());
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [recentChanges, setRecentChanges] = useState<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(true);
  
  // Modal state for booking details
  const [selectedBookingModal, setSelectedBookingModal] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState('overview');
  
  // Date picker outside click handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);
  
  // Modal tab configuration
  const modalTabs = [
    { id: 'overview', name: 'Overview', icon: Eye },
    { id: 'timeline', name: 'Trip Timeline', icon: History },
    { id: 'communication', name: 'Communication', icon: MessageCircle },
    { id: 'financials', name: 'Fare & Financials', icon: CreditCard },
    { id: 'passenger', name: 'Passenger', icon: User },
    { id: 'driver-vehicle', name: 'Driver & Vehicle', icon: Car },
    { id: 'audit', name: 'Audit & Actions', icon: Settings },
    { id: 'aiml', name: 'AI/ML', icon: Brain }
  ];

  // Mock user role for RBAC - in real app this comes from auth context
  const [userRole] = useState<'admin' | 'finance' | 'operations' | 'support'>('admin'); // Change to test RBAC
  const hasFinanceAccess = useCallback(() => {
    return ['admin', 'finance'].includes(userRole);
  }, [userRole]);
  
  const hasCustomerProfileAccess = useCallback(() => {
    return ['admin', 'operations', 'support'].includes(userRole);
  }, [userRole]);
  
  // Using consistent variable naming throughout
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  // Column width state for resizable columns
  const [columnWidths, setColumnWidths] = useState({
    bookingId: 140,
    pickupDateTime: 160,
    passenger: 160,
    driver: 160,
    pickup: 180,
    dropoff: 180,
    service: 120,
    status: 140, // Increased width to accommodate date/time in scheduled tab
    attempts: 80, // Column for tracking passenger booking attempts
    fare: 100
  });

  // Generate enhanced mock booking data with realistic Metro Manila locations
  const generateMockBookings = useCallback((): Booking[] => {
    const statuses: ('Active' | 'Completed' | 'Cancelled' | 'Scheduled' | 'Requesting' | 'Failed')[] = 
      ['Active', 'Completed', 'Cancelled', 'Scheduled', 'Requesting', 'Failed'];
    const serviceTypes = ['Car', 'Motorcycle', 'SUV', 'Taxi', 'Premium'];
    
    const locations = [
      { name: 'BGC Central Plaza, Taguig', coords: [14.5512, 121.0471] as [number, number] },
      { name: 'Ayala Triangle, Makati', coords: [14.5547, 121.0244] as [number, number] },
      { name: 'SM Mall of Asia, Pasay', coords: [14.5354, 120.9827] as [number, number] },
      { name: 'Ortigas Center, Pasig', coords: [14.5866, 121.0636] as [number, number] },
      { name: 'Quezon Memorial Circle', coords: [14.6554, 121.0509] as [number, number] },
      { name: 'Intramuros, Manila', coords: [14.5906, 120.9742] as [number, number] },
      { name: 'Alabang Town Center', coords: [14.4198, 121.0391] as [number, number] },
      { name: 'Eastwood City, QC', coords: [14.6091, 121.0779] as [number, number] },
    ];
    
    const passengerNames = [
      'Maria Santos', 'Juan Dela Cruz', 'Carlos Reyes', 'Ana Garcia', 'Elena Rodriguez',
      'Roberto Silva', 'Jose Martinez', 'Carmen Lopez', 'Pedro Gonzalez', 'Isabel Fernandez',
      'Miguel Torres', 'Rosa Morales', 'Antonio Ramirez', 'Lucia Herrera', 'Francisco Vargas'
    ];
    
    const driverNames = [
      'Carlos Mendoza', 'Maria Santos', 'Juan dela Cruz', 'Ana Villanueva', 'Pedro Castro',
      'Elena Gutierrez', 'Roberto Diaz', 'Carmen Torres', 'Miguel Rodriguez', 'Isabel Garcia'
    ];

    return Array.from({ length: 200 }, (_, i) => {
      const pickup = locations[Math.floor(Math.random() * locations.length)];
      let destination = locations[Math.floor(Math.random() * locations.length)];
      while (destination === pickup) {
        destination = locations[Math.floor(Math.random() * locations.length)];
      }
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const baseFare = 80 + Math.random() * 420;
      const distance = parseFloat((Math.random() * 20 + 1).toFixed(1));
      // Set appropriate creation time based on status
      const requestedAt = status === 'Requesting' 
        ? new Date(Date.now() - Math.random() * 180000) // Requesting: 0-3 minutes ago
        : status === 'Failed' 
        ? new Date(Date.now() - (180000 + Math.random() * 600000)) // Failed: 3-13 minutes ago  
        : new Date(Date.now() - Math.random() * 86400000 * 3); // Others: up to 3 days ago
      
      const hasDriver = !['Requesting'].includes(status);
      const driverName = hasDriver ? driverNames[Math.floor(Math.random() * driverNames.length)] : 'Unassigned';
      
      // Create detailed booking data
      const detailedData: BookingDetails = {
        id: String(i + 1),
        bookingId: `BK-${String(i + 1).padStart(4, '0')}`,
        passenger: {
          id: `P${String(i + 1).padStart(4, '0')}`,
          name: passengerNames[Math.floor(Math.random() * passengerNames.length)],
          phone: `+63917${Math.floor(Math.random() * 9000000 + 1000000)}`,
          rating: 4.0 + Math.random() * 1.0,
          totalTrips: Math.floor(Math.random() * 100 + 5),
          paymentMethod: ['cash', 'card', 'digital_wallet', 'corporate'][Math.floor(Math.random() * 4)] as any,
          specialRequests: Math.random() > 0.8 ? ['Pet-friendly vehicle'] : undefined
        },
        driver: hasDriver ? {
          id: `DR${String(i % 20 + 1).padStart(3, '0')}`,
          name: driverName,
          phone: `+63917${Math.floor(Math.random() * 9000000 + 1000000)}`,
          rating: 4.2 + Math.random() * 0.8,
          vehicleType: serviceType,
          vehiclePlate: `ABC-${Math.floor(Math.random() * 9000 + 1000)}`,
          vehicleModel: serviceType === 'Motorcycle' ? 'Honda Click 125' : 'Toyota Vios',
          totalTrips: Math.floor(Math.random() * 1000 + 50),
          acceptanceRate: 85 + Math.random() * 15,
          eta: status === 'Active' ? Math.floor(Math.random() * 15 + 2) : undefined,
          currentLocation: status === 'Active' ? [pickup.coords[0] + (Math.random() - 0.5) * 0.01, pickup.coords[1] + (Math.random() - 0.5) * 0.01] as [number, number] : undefined
        } : undefined,
        pickup: {
          address: pickup.name,
          coordinates: pickup.coords,
          instructions: Math.random() > 0.7 ? 'Near the main entrance' : undefined
        },
        destination: {
          address: destination.name,
          coordinates: destination.coords,
          instructions: Math.random() > 0.7 ? 'Drop off at parking area' : undefined
        },
        serviceType: serviceType.toLowerCase() as any,
        tripProgress: {
          status: status === 'Active' ? 'in_transit' : 
                  status === 'Requesting' ? 'requesting' :
                  status === 'Completed' ? 'completed' : 'cancelled',
          timeline: [
            { timestamp: requestedAt, status: 'Trip requested' },
            ...(hasDriver ? [{ timestamp: new Date(requestedAt.getTime() + 120000), status: 'Driver assigned' }] : [])
          ]
        },
        fareBreakdown: {
          baseFare,
          distanceFare: distance * 12,
          surgeFare: Math.random() > 0.8 ? baseFare * 0.3 : 0,
          fees: 10,
          discount: Math.random() > 0.9 ? 25 : 0,
          total: baseFare + distance * 12 + (Math.random() > 0.8 ? baseFare * 0.3 : 0) + 10 - (Math.random() > 0.9 ? 25 : 0),
          paymentStatus: ['pending', 'paid', 'failed'][Math.floor(Math.random() * 3)] as any,
          paymentMethod: ['Cash', 'GCash', 'Credit Card'][Math.floor(Math.random() * 3)],
          costOfSale: {
            driverEarnings: baseFare * 0.75,
            platformFee: baseFare * 0.15,
            commissionRate: 15,
            operatingCosts: baseFare * 0.08,
            netRevenue: baseFare * 0.07,
            profitMargin: 7.2
          },
          promotions: {
            ...(Math.random() > 0.7 ? {
              passengerPromo: {
                code: ['SAVE20', 'NEWUSER', 'WEEKEND'][Math.floor(Math.random() * 3)],
                discount: Math.random() > 0.5 ? 20 : 15,
                type: Math.random() > 0.5 ? 'percentage' : 'fixed' as any
              }
            } : {}),
            ...(Math.random() > 0.8 ? {
              driverIncentive: {
                type: ['surge_bonus', 'completion_bonus', 'loyalty_bonus'][Math.floor(Math.random() * 3)] as any,
                amount: 15 + Math.random() * 35,
                description: 'Peak hour completion bonus'
              }
            } : {})
          }
        },
        estimatedDuration: Math.floor(distance * 3 + Math.random() * 15),
        distance,
        scheduledFor: Math.random() > 0.9 ? new Date(Date.now() + Math.random() * 86400000) : undefined,
        requestedAt,
        assignedAt: hasDriver ? new Date(requestedAt.getTime() + 120000) : undefined,
        completedAt: status === 'Completed' ? new Date(requestedAt.getTime() + Math.random() * 3600000) : undefined,
        cancelledAt: status === 'Cancelled' ? new Date(requestedAt.getTime() + Math.random() * 1800000) : undefined,
        rating: status === 'Completed' ? 3 + Math.random() * 2 : undefined,
        feedback: status === 'Completed' && Math.random() > 0.7 ? 'Great service!' : undefined,
        emergencyFlag: Math.random() > 0.98,
        lastLocationUpdate: hasDriver && status === 'Active' ? new Date(Date.now() - Math.random() * 300000) : undefined,
        requestTimeout: status === 'Requesting' ? new Date(requestedAt.getTime() + 600000) : undefined,
        promoCode: Math.random() > 0.85 ? 'SAVE20' : undefined,
        
        // Generate trip timeline
        tripTimeline: (() => {
          const timeline: TripTimelineEvent[] = [];
          let currentTime = requestedAt.getTime();
          
          // Ride Requested
          timeline.push({
            id: `timeline_${i}_1`,
            status: 'requested',
            timestamp: new Date(currentTime),
            description: 'Trip requested by passenger',
            location: pickup.coords,
            metadata: { serviceType, pickupAddress: pickup.name }
          });
          
          if (hasDriver || status === 'Failed') {
            // Assigning phase
            currentTime += 30000 + Math.random() * 90000; // 30s - 2min
            timeline.push({
              id: `timeline_${i}_2`,
              status: 'assigning',
              timestamp: new Date(currentTime),
              duration: currentTime - timeline[timeline.length - 1].timestamp.getTime(),
              description: 'Finding available drivers',
              metadata: { attemptedDrivers: 2 + Math.floor(Math.random() * 3) }
            });
          }
          
          if (hasDriver) {
            // Driver assigned
            currentTime += 15000 + Math.random() * 45000; // 15s - 1min
            timeline.push({
              id: `timeline_${i}_3`, 
              status: 'assigned',
              timestamp: new Date(currentTime),
              duration: currentTime - timeline[timeline.length - 1].timestamp.getTime(),
              description: `Driver ${driverName} assigned`,
              metadata: { driverId: `DR${String(i % 20 + 1).padStart(3, '0')}`, driverName }
            });
            
            if (status !== 'Cancelled') {
              // Enroute to pickup
              currentTime += 60000 + Math.random() * 180000; // 1-4min
              timeline.push({
                id: `timeline_${i}_4`,
                status: 'enroute_pickup',
                timestamp: new Date(currentTime),
                duration: currentTime - timeline[timeline.length - 1].timestamp.getTime(),
                description: 'Driver heading to pickup location',
                location: pickup.coords
              });
              
              if (['Active', 'Completed'].includes(status)) {
                // Pickup
                currentTime += 300000 + Math.random() * 600000; // 5-15min
                timeline.push({
                  id: `timeline_${i}_5`,
                  status: 'passenger_pickup',
                  timestamp: new Date(currentTime),
                  duration: currentTime - timeline[timeline.length - 1].timestamp.getTime(),
                  description: 'Passenger picked up',
                  location: pickup.coords
                });
                
                if (status === 'Completed') {
                  // Enroute to destination
                  currentTime += 60000; // 1min
                  timeline.push({
                    id: `timeline_${i}_6`,
                    status: 'enroute_destination',
                    timestamp: new Date(currentTime),
                    duration: currentTime - timeline[timeline.length - 1].timestamp.getTime(),
                    description: 'Heading to destination',
                    location: destination.coords
                  });
                  
                  // Trip completed
                  const estimatedDurationMinutes = 15 + Math.random() * 30; // 15-45 min
                  currentTime += estimatedDurationMinutes * 60000; // estimated duration
                  timeline.push({
                    id: `timeline_${i}_7`,
                    status: 'completed',
                    timestamp: new Date(currentTime),
                    duration: currentTime - timeline[timeline.length - 1].timestamp.getTime(),
                    description: 'Trip completed successfully',
                    location: destination.coords,
                    metadata: { finalFare: baseFare + (distance * 15) + 20 } // Calculate basic fare
                  });
                }
              }
            }
          }
          
          if (status === 'Cancelled' || status === 'Failed') {
            const lastEvent = timeline[timeline.length - 1];
            timeline.push({
              id: `timeline_${i}_cancel`,
              status: 'cancelled',
              timestamp: new Date(lastEvent.timestamp.getTime() + 120000),
              duration: 120000,
              description: status === 'Failed' ? 'No drivers available - request timed out' : 'Trip cancelled',
              metadata: { reason: status === 'Failed' ? 'timeout' : 'user_cancellation' }
            });
          }
          
          return timeline;
        })(),
        
        // Generate driver assignment history
        driverAssignmentHistory: hasDriver || status === 'Failed' ? (() => {
          const attempts: DriverAssignmentAttempt[] = [];
          const driverPool = [
            'Carlos Mendoza', 'Maria Santos', 'Juan dela Cruz', 'Elena Rodriguez', 
            'Miguel Torres', 'Ana Reyes', 'Jose Garcia', 'Carmen Lopez'
          ];
          
          // Use the same count as shown in timeline metadata
          const numAttempts = 2 + Math.floor(Math.random() * 3); // 2-4 drivers
          let offerTime = requestedAt.getTime() + 30000; // Start 30s after request
          
          for (let j = 0; j < numAttempts; j++) {
            const isLastAttempt = j === numAttempts - 1;
            const isOnTrip = Math.random() > 0.7; // 30% chance driver is on another trip
            const attemptStatus = isLastAttempt && hasDriver ? 'accepted' : 
                                isLastAttempt ? 'timeout' : 
                                Math.random() > 0.6 ? 'declined' : 'timeout';
            
            const responseTime = attemptStatus === 'accepted' ? 8 + Math.random() * 12 : // 8-20s for accepts
                               attemptStatus === 'declined' ? 15 + Math.random() * 25 : // 15-40s for declines  
                               45; // 45s timeout
            
            const declineReasons = isOnTrip ? 
              ['Currently on trip', 'Back-to-back trip offered'] : 
              ['Too far away', 'Break time', 'Traffic concerns', 'Vehicle maintenance'];
            
            attempts.push({
              id: `attempt_${i}_${j}`,
              driverId: `DR${String(j + 1).padStart(3, '0')}`,
              driverName: j === 0 && hasDriver ? driverName : driverPool[j % driverPool.length],
              offeredAt: new Date(offerTime),
              status: attemptStatus,
              responseAt: attemptStatus !== 'timeout' ? new Date(offerTime + responseTime * 1000) : undefined,
              responseTime: Math.floor(responseTime),
              declineReason: attemptStatus === 'declined' ? 
                declineReasons[Math.floor(Math.random() * declineReasons.length)] : undefined,
              distance: 0.8 + Math.random() * 2.2, // 0.8-3km
              rating: 4.2 + Math.random() * 0.8,
              isOnTrip: isOnTrip,
              kpiImpact: attemptStatus === 'declined' || attemptStatus === 'timeout' ? {
                acceptanceRate: isOnTrip ? -0.8 : -1.3,
                responseTime: attemptStatus === 'timeout' ? -2.1 : -0.6,
                backToBackOffered: isOnTrip
              } : null
            });
            
            offerTime += responseTime * 1000 + 5000; // Add response time + 5s gap
          }
          
          return attempts;
        })() : [],
        
        // Generate communication history
        communicationHistory: hasDriver ? (() => {
          const communications: CommunicationEvent[] = [];
          let commTime = requestedAt.getTime() + 180000; // Start 3min after request
          
          // System notifications
          communications.push({
            id: `comm_${i}_1`,
            timestamp: new Date(commTime),
            type: 'system_notification',
            direction: 'system_to_passenger',
            content: `Driver ${driverName} has been assigned to your trip`,
            status: 'delivered',
            isPrivate: false
          });
          
          if (Math.random() > 0.6) {
            // Driver calls passenger
            commTime += 120000 + Math.random() * 180000; // 2-5min later
            communications.push({
              id: `comm_${i}_2`,
              timestamp: new Date(commTime),
              type: 'call',
              direction: 'driver_to_passenger',
              duration: 25 + Math.floor(Math.random() * 95), // 25-120 seconds
              status: 'delivered',
              isPrivate: true // RBAC controlled
            });
          }
          
          if (Math.random() > 0.7) {
            // Text message exchange
            commTime += 60000 + Math.random() * 120000; // 1-3min later
            communications.push({
              id: `comm_${i}_3`,
              timestamp: new Date(commTime),
              type: 'message',
              direction: 'passenger_to_driver',
              content: 'I\'m wearing a blue shirt, standing near the entrance',
              status: 'read',
              isPrivate: true // RBAC controlled
            });
            
            commTime += 30000; // 30s later
            communications.push({
              id: `comm_${i}_4`,
              timestamp: new Date(commTime),
              type: 'message', 
              direction: 'driver_to_passenger',
              content: 'Copy, I can see you. I\'ll be there in 2 minutes.',
              status: 'read',
              isPrivate: true // RBAC controlled
            });
          }
          
          return communications;
        })() : []
      };
      
      // Return legacy format with enhanced data
      return {
        id: String(i + 1),
        bookingId: `BK-${String(i + 1).padStart(4, '0')}`,
        passenger: detailedData.passenger.name,
        driver: driverName,
        pickup: pickup.name.split(',')[0],
        destination: destination.name.split(',')[0],
        status,
        serviceType,
        fare: Math.floor(detailedData.fareBreakdown.total),
        duration: `${detailedData.estimatedDuration} min`,
        distance: `${distance} km`,
        createdAt: requestedAt,
        details: detailedData
      };
    });
  }, []);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [sortBy, setSortBy] = useState<'createdAt' | 'fare' | 'duration'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Initialize bookings data
  useEffect(() => {
    setBookings(generateMockBookings());
  }, [generateMockBookings]);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 800);
  }, []);
  
  // Initialize audio for notifications
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.3;
  }, []);

  // Enhanced real-time updates with sound notifications
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      setBookings(prevBookings => {
        const updatedBookings = [...prevBookings];
        let hasChanges = false;
        let hasCriticalEvent = false;
        const newRecentChanges = new Set<string>();
        
        // Simulate random booking updates
        if (Math.random() > 0.8) {
          const randomIndex = Math.floor(Math.random() * updatedBookings.length);
          const booking = updatedBookings[randomIndex];
          
          // Simulate status changes
          if (booking.status === 'Requesting' && Math.random() > 0.7) {
            booking.status = 'Active';
            booking.driver = booking.details?.driver?.name || 'Auto-assigned Driver';
            hasChanges = true;
            newRecentChanges.add(booking.id);
          }
          
          // Simulate emergency alerts
          if (Math.random() > 0.99) {
            if (booking.details) {
              booking.details.emergencyFlag = true;
            }
            hasCriticalEvent = true;
            hasChanges = true;
            newRecentChanges.add(booking.id);
          }
        }
        
        // Check for timed out requesting bookings and move to Failed status
        updatedBookings.forEach(booking => {
          if (booking.status === 'Requesting') {
            const elapsed = Math.floor((Date.now() - booking.createdAt.getTime()) / 1000);
            if (elapsed >= 180) { // 3 minutes timeout
              booking.status = 'Failed';
              hasChanges = true;
              newRecentChanges.add(booking.id);
            }
          }
        });
        
        // Add new requesting bookings occasionally
        if (Math.random() > 0.95) {
          const newBookingData = generateMockBookings().find(b => b.status === 'Requesting');
          if (newBookingData) {
            newBookingData.id = `${Date.now()}`;
            newBookingData.bookingId = `BK-${String(updatedBookings.length + 1).padStart(4, '0')}`;
            newBookingData.createdAt = new Date();
            updatedBookings.unshift(newBookingData);
            hasChanges = true;
            hasCriticalEvent = true;
            newRecentChanges.add(newBookingData.id);
          }
        }
        
        if (hasChanges) {
          setLastUpdateTime(new Date());
          setRecentChanges(newRecentChanges);
          
          // Play sound for critical events
          if (hasCriticalEvent && soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {/* Ignore audio errors */});
          }
          
          // Clear recent changes after 5 seconds
          setTimeout(() => {
            setRecentChanges(prev => {
              const updated = new Set(prev);
              newRecentChanges.forEach(id => updated.delete(id));
              return updated;
            });
          }, 5000);
        }
        
        return hasChanges ? updatedBookings : prevBookings;
      });
    }, 8000); // Update every 8 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled, soundEnabled, generateMockBookings]);

  // Filter and search logic
  const filteredBookings = React.useMemo(() => {
    let filtered = bookings;

    // Filter by tab
    const statusMap = {
      'requesting': 'Requesting',
      'active-trips': 'Active',
      'failed': 'Failed',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'scheduled': 'Scheduled'
    };
    filtered = filtered.filter(booking => booking.status === statusMap[activeTab as keyof typeof statusMap]);

    // Enhanced smart search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      
      // Check for field-specific searches
      if (term.includes(':')) {
        const [field, value] = term.split(':', 2);
        const searchValue = value.trim();
        
        filtered = filtered.filter(booking => {
          switch (field.toLowerCase()) {
            case 'pickup':
            case 'pick':
            case 'from':
              return booking.pickup.toLowerCase().includes(searchValue);
            case 'dropoff':
            case 'drop':
            case 'destination':
            case 'to':
              return booking.destination.toLowerCase().includes(searchValue);
            case 'passenger':
            case 'pax':
            case 'customer':
              return booking.passenger.toLowerCase().includes(searchValue);
            case 'driver':
              return booking.driver.toLowerCase().includes(searchValue);
            case 'booking':
            case 'id':
              return booking.bookingId.toLowerCase().includes(searchValue);
            case 'status':
              return booking.status.toLowerCase().includes(searchValue);
            case 'service':
              return getServiceDisplayName(booking.serviceType).toLowerCase().includes(searchValue);
            default:
              // If field not recognized, fall back to general search
              return booking.bookingId.toLowerCase().includes(term) ||
                     booking.passenger.toLowerCase().includes(term) ||
                     booking.driver.toLowerCase().includes(term) ||
                     booking.pickup.toLowerCase().includes(term) ||
                     booking.destination.toLowerCase().includes(term);
          }
        });
      } else {
        // General search (original behavior)
        filtered = filtered.filter(booking =>
          booking.bookingId.toLowerCase().includes(term) ||
          booking.passenger.toLowerCase().includes(term) ||
          booking.driver.toLowerCase().includes(term) ||
          booking.pickup.toLowerCase().includes(term) ||
          booking.destination.toLowerCase().includes(term)
        );
      }
    }

    // Service type filter
    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.serviceType === serviceTypeFilter);
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        if (dateRange.from && bookingDate < dateRange.from) return false;
        if (dateRange.to && bookingDate > dateRange.to) return false;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'fare':
          aValue = a.fare;
          bValue = b.fare;
          break;
        case 'duration':
          aValue = parseInt(a.duration);
          bValue = parseInt(b.duration);
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [bookings, activeTab, searchTerm, serviceTypeFilter, dateRange, sortBy, sortOrder]);

  // Close search guide when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowSearchGuide(false);
      }
    };

    if (showSearchGuide) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchGuide]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, serviceTypeFilter, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Count by status for tabs
  const statusCounts = React.useMemo(() => {
    return bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [bookings]);

  const tabs = [
    { id: 'requesting', name: 'Requesting', icon: Timer, count: statusCounts['Requesting'] || 0, urgent: true },
    { id: 'active-trips', name: 'Active Trips', icon: Activity, count: statusCounts['Active'] || 0 },
    { id: 'failed', name: 'Failed', icon: AlertTriangle, count: statusCounts['Failed'] || 0, urgent: true },
    { id: 'cancelled', name: 'Cancelled', icon: XCircle, count: statusCounts['Cancelled'] || 0 },
    { id: 'scheduled', name: 'Scheduled', icon: Calendar, count: statusCounts['Scheduled'] || 0 },
    { id: 'completed', name: 'Completed', icon: CheckCircle, count: statusCounts['Completed'] || 0 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Requesting':
        return 'bg-[#FFF7ED] text-[#D97706]';
      case 'Pending':
        return 'bg-[#FEFCE8] text-[#CA8A04]';
      case 'Assigned':
        return 'bg-[#F0F9FF] text-[#0369A1]';
      case 'Active':
        return 'bg-[#EFF6FF] text-[#2563EB]';
      case 'OTW PICK':
        return 'bg-[#DBEAFE] text-[#1D4ED8]'; // Blue for on the way to pickup
      case 'OTW DROP':
        return 'bg-[#DCFCE7] text-[#16A34A]'; // Green for on the way to dropoff
      case 'Completed':
        return 'bg-[#F0FDF4] text-[#16A34A]';
      case 'Cancelled':
        return 'bg-[#FEF2F2] text-[#DC2626]';
      case 'Failed':
        return 'bg-[#FEF2F2] text-[#B91C1C]';
      case 'Scheduled':
        return 'bg-[#F3E8FF] text-[#7C3AED]';
      // Trip types for non-scheduled tabs
      case 'Regular':
        return 'bg-[#F8FAFC] text-[#475569]'; // Gray for regular rides
      case 'ScanRide':
        return 'bg-[#EFF6FF] text-[#2563EB]'; // Blue for scan rides
      case 'Concierge':
        return 'bg-[#FEF3C7] text-[#D97706]'; // Amber for concierge service
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType.toLowerCase()) {
      case 'motorcycle':
        return '🏍️';
      case 'car':
        return '🚗';
      case 'suv':
        return '🚙';
      case 'taxi':
        return '🚖';
      case 'premium':
        return '✨';
      default:
        return '🚗';
    }
  };

  // Service type display name mapping
  const getServiceDisplayName = (serviceType: string) => {
    const serviceTypeMap: { [key: string]: string } = {
      'motorcycle': 'MC Taxi',
      'car': 'TNVS 4 Seat', 
      'suv': 'TNVS 6 Seat',
      'premium': 'TNVS Premium',
      'taxi': 'Taxi',
      'premium taxi': 'Premium Taxi',
      'twg': 'TWG',
      'etrike': 'Etrike'
    };
    return serviceTypeMap[serviceType.toLowerCase()] || serviceType;
  };

  // Get display status - show pickup date/time for scheduled tab, type for others
  const getDisplayStatus = (booking: Booking, currentTab: string) => {
    if (currentTab === 'scheduled') {
      // For scheduled tab, show pickup date/time
      return getPickupDateTime(booking);
    } else {
      // For other tabs (requesting, active-trips, cancelled, completed), show trip type
      return getTripType(booking);
    }
  };

  // Get pickup date/time for scheduled tab
  const getPickupDateTime = (booking: Booking) => {
    const pickupDate = new Date(booking.createdAt.getTime() + (Math.random() * 24 * 60 * 60 * 1000)); // Add random hours for scheduled time
    return `${pickupDate.toLocaleDateString()} ${pickupDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  // Get trip type for non-scheduled tabs
  const getTripType = (booking: Booking) => {
    const bookingNum = parseInt(booking.bookingId.replace(/\D/g, '')) || 0;
    const typeIndex = bookingNum % 4;
    
    switch (typeIndex) {
      case 0:
        return 'Regular';
      case 1:
        return 'ScanRide';
      case 2:
        return 'Scheduled';
      case 3:
        return 'Concierge';
      default:
        return 'Regular';
    }
  };

  // Calculate dynamic KPIs based on filtered results
  const calculateFilteredKPIs = (filteredBookings: Booking[]) => {
    const total = filteredBookings.length;
    
    // Count by status
    const requesting = filteredBookings.filter(b => b.status === 'Requesting').length;
    const active = filteredBookings.filter(b => b.status === 'Active').length;
    const completed = filteredBookings.filter(b => b.status === 'Completed').length;
    const cancelled = filteredBookings.filter(b => b.status === 'Cancelled').length;
    const scheduled = filteredBookings.filter(b => b.status === 'Scheduled').length;
    
    // Calculate rates
    const totalRequests = total;
    const acceptanceRate = total > 0 ? ((active + completed + scheduled) / total * 100).toFixed(1) : '0.0';
    const cancelRate = total > 0 ? (cancelled / total * 100).toFixed(1) : '0.0';
    const completionRate = total > 0 ? (completed / total * 100).toFixed(1) : '0.0';
    
    // Calculate average fare
    const totalFare = filteredBookings.reduce((sum, booking) => sum + booking.fare, 0);
    const avgFare = total > 0 ? Math.round(totalFare / total) : 0;
    
    return {
      totalRequests,
      acceptanceRate: `${acceptanceRate}%`,
      cancelRate: `${cancelRate}%`,
      completionRate: `${completionRate}%`,
      avgFare: `₱${avgFare}`
    };
  };
  
  // Get time elapsed for requesting bookings with 3-minute timeout
  const getRequestingTime = useCallback((booking: Booking) => {
    // If we're on the requesting tab, calculate time for any booking shown
    const elapsed = Math.floor((Date.now() - booking.createdAt.getTime()) / 1000);
    // Ensure minimum values to avoid negative times
    const safeElapsed = Math.max(0, elapsed);
    const minutes = Math.floor(safeElapsed / 60);
    const seconds = safeElapsed % 60;
    return `${minutes}m ${seconds}s`;
  }, []);
  
  // Get requesting color based on elapsed time
  const getRequestingColor = useCallback((booking: Booking) => {
    if (booking.status !== 'Requesting') return '';
    const elapsed = Math.floor((Date.now() - booking.createdAt.getTime()) / 1000);
    if (elapsed < 30) return 'text-green-600 bg-green-50 border-green-200';
    if (elapsed < 120) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  }, []);

  // Get booking attempts count for a passenger in the last 10 minutes
  const getPassengerAttempts = useCallback((booking: Booking) => {
    if (booking.status !== 'Requesting') return 0;
    
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const passengerName = booking.passenger;
    
    // Count all bookings (requesting, failed, completed) by this passenger in last 10 minutes
    const recentAttempts = bookings.filter(b => {
      const isSamePassenger = b.passenger === passengerName;
      const isWithinTimeframe = b.createdAt >= tenMinutesAgo;
      const isAttemptStatus = ['Requesting', 'Failed', 'Completed', 'Cancelled'].includes(b.status);
      return isSamePassenger && isWithinTimeframe && isAttemptStatus;
    }).length;
    
    return recentAttempts;
  }, [bookings]);
  
  // Toggle booking expansion
  const toggleBookingExpansion = useCallback((bookingId: string) => {
    setSelectedBookingModal(bookingId);
    setActiveModalTab('overview');
  }, []);

  // Helper functions for RBAC contact controls
  const canContactPassenger = useCallback((booking: Booking) => {
    // Check if status allows contact
    const statusAllowsContact = !['Cancelled', 'Completed'].includes(booking.status);
    // Check permissions
    const hasContactPermission = hasPermission('contact_passenger_masked') || hasPermission('contact_passenger_unmasked');
    return statusAllowsContact && hasContactPermission;
  }, [hasPermission]);

  const canContactDriver = useCallback((booking: Booking) => {
    // Check if status allows contact  
    const statusAllowsContact = !['Cancelled', 'Completed'].includes(booking.status);
    // Check permissions
    const hasContactPermission = hasPermission('contact_driver_masked') || hasPermission('contact_driver_unmasked');
    return statusAllowsContact && hasContactPermission;
  }, [hasPermission]);

  // Timeline event expansion handler
  const toggleTimelineEvent = useCallback((eventId: string) => {
    setExpandedTimelineEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  }, []);
  
  // Quick actions handlers
  const handleCallPassenger = useCallback((phone: string) => {
    window.open(`tel:${phone}`);
  }, []);
  
  const handleCallDriver = useCallback((phone: string) => {
    window.open(`tel:${phone}`);
  }, []);

  const handleTrackLocation = useCallback((booking: Booking) => {
    // Open tracking page in new tab with driver details
    const trackingUrl = `/tracking?driver=${encodeURIComponent(booking.details.driver?.name || '')}&plate=${encodeURIComponent(booking.details.driver?.vehiclePlate || '')}&booking=${booking.id}`;
    window.open(trackingUrl, '_blank', 'width=1200,height=800');
  }, []);

  const handleMessageDriver = useCallback((booking: Booking) => {
    // In a real app, this would open a messaging interface
    const message = `Message sent to ${booking.details.driver?.name}\n\nThis would open the in-app messaging system in a real implementation.`;
    alert(message);
  }, []);

  const handleViewDriverProfile = useCallback((booking: Booking) => {
    // In a real app, this would navigate to full driver profile
    alert(`Opening full profile for:\n${booking.details.driver?.name}\nDriver ID: DR-${Math.floor(Math.random() * 10000)}\n\nThis would navigate to the complete driver profile page.`);
  }, []);

  const handleVehicleHistory = useCallback((booking: Booking) => {
    // In a real app, this would show vehicle maintenance and trip history
    alert(`Vehicle History for ${booking.details.driver?.vehicleModel}\nPlate: ${booking.details.driver?.vehiclePlate}\n\n• Last service: ${Math.floor(Math.random() * 30) + 1} days ago\n• Total trips: ${Math.floor(Math.random() * 5000) + 1000}\n• Maintenance status: Good\n\nThis would open detailed vehicle records.`);
  }, []);
  
  const handleForceAssign = useCallback((bookingId: string, driverId: string, driverName: string) => {
    // Reset states and set assigning
    setAssigningDriverId(driverId);
    setAssignmentStatus('idle');
    setAssignmentMessage('');
    
    // Simulate assignment process with delay
    setTimeout(() => {
      // Simulate 70% success rate
      const isSuccess = Math.random() > 0.3;
      
      if (isSuccess) {
        // Success: Update booking and close modal
        setBookings(prev => prev.map(b => {
          if (b.id === bookingId) {
            return {
              ...b,
              status: 'Active' as any,
              driver: driverName
            };
          }
          return b;
        }));
        
        setRecentChanges(prev => new Set([...prev, bookingId]));
        setAssignmentStatus('success');
        setAssignmentMessage(`Successfully assigned ${driverName} to this booking!`);
        
        // Close modal after showing success message
        setTimeout(() => {
          setAssigningDriverId(null);
          setAssignmentStatus('idle');
          setAssignmentMessage('');
          setForceAssignModal(null);
        }, 2000);
        
      } else {
        // Failure: Show error and allow retry
        const failureReasons = [
          `${driverName} declined the assignment`,
          `${driverName} is no longer available`,
          'Network error occurred during assignment',
          `${driverName} did not respond in time`
        ];
        const randomReason = failureReasons[Math.floor(Math.random() * failureReasons.length)];
        
        setAssignmentStatus('failed');
        setAssignmentMessage(randomReason);
        setCancelledDriverId(driverId);
        setAssigningDriverId(null);
      }
    }, 2000); // 2 second delay to show assigning state
  }, []);
  
  const handleSOSAlert = useCallback((bookingId: string) => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {/* Ignore audio errors */});
    }
    alert('SOS Alert sent to emergency services!');
  }, [soundEnabled]);

  // Column resize handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey as keyof typeof columnWidths];

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(80, startWidth + (e.clientX - startX));
      setColumnWidths(prev => ({ ...prev, [columnKey]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading Enhanced Bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern SaaS Header with Visual Hierarchy */}
      <div className="space-y-4">
        {/* Title Row with Right-aligned Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight font-[Inter]">Bookings</h1>
            <p className="text-base text-gray-500 mt-1 font-[Inter]">Trip management and booking analytics</p>
          </div>

          {/* Lightweight Search and Filters */}
          <div className="flex items-center space-x-3">
            <div className="relative search-container">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Click for search tips..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSearchGuide(true)}
                className="pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 w-80 placeholder-gray-500 h-10 shadow-sm hover:shadow-md"
              />
              
              {/* Search Guide Dropdown */}
              {showSearchGuide && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
                  <div className="text-sm font-medium text-gray-900 mb-3">Smart Search Guide</div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Search by specific fields:</div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-blue-50 text-blue-700 rounded font-mono">pickup:ortigas</code>
                          <span className="text-gray-600">Search pickup locations</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-green-50 text-green-700 rounded font-mono">passenger:maria</code>
                          <span className="text-gray-600">Search passenger names</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-purple-50 text-purple-700 rounded font-mono">driver:carlos</code>
                          <span className="text-gray-600">Search driver names</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-orange-50 text-orange-700 rounded font-mono">dropoff:bgc</code>
                          <span className="text-gray-600">Search destinations</span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <div className="text-xs text-gray-500">
                        Or search normally across all fields without using colons
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors h-10 border ${
                  isRealTimeEnabled
                    ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                }`}
              >
                {isRealTimeEnabled ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                <span>{isRealTimeEnabled ? 'Live' : 'Paused'}</span>
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2.5 rounded-lg transition-colors h-10 w-10 flex items-center justify-center border ${
                  soundEnabled
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                }`}
                title={soundEnabled ? 'Sound notifications ON' : 'Sound notifications OFF'}
              >
                <Volume2 className={`w-4 h-4 ${!soundEnabled ? 'opacity-50' : ''}`} />
              </button>
              <button className="flex items-center space-x-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-600 hover:text-gray-900 border border-gray-200 h-10">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation with Better Spacing */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isUrgent = tab.urgent && tab.count > 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center space-x-2.5 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 min-h-[44px] ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent hover:border-gray-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isUrgent && activeTab !== tab.id ? 'text-orange-600' : ''}`} />
                  <span className="whitespace-nowrap">{tab.name}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium min-w-[28px] text-center ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : isUrgent
                      ? `bg-red-100 text-red-700 ${tab.id === 'requesting' ? 'animate-pulse' : ''}`
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                  {isUrgent && activeTab !== tab.id && tab.id === 'requesting' && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center space-x-3">
            {/* Date picker - only show for Completed tab */}
            {activeTab === 'completed' && (
              <div className="relative date-picker-container">
                <button
                  className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-gray-700 h-10 min-w-[200px] shadow-sm"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                >
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    {dateRange.from && dateRange.to ? 
                      `${dateRange.from.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })} - ${dateRange.to.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })}` : 
                      'Select date range'
                    }
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Enhanced Date Range Picker Dropdown */}
                {showDatePicker && (
                  <div className="absolute top-12 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[600px] flex">
                    {/* Quick Select Options */}
                    <div className="w-40 p-4 border-r border-gray-200">
                      <div className="space-y-2 mb-4">
                        <button
                          onClick={() => {
                            const today = new Date();
                            setDateRange({ from: today, to: today });
                            setShowDatePicker(false);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => {
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            setDateRange({ from: yesterday, to: yesterday });
                            setShowDatePicker(false);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          Yesterday
                        </button>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const lastWeek = new Date();
                            lastWeek.setDate(today.getDate() - 7);
                            setDateRange({ from: lastWeek, to: today });
                            setShowDatePicker(false);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          Last week
                        </button>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const lastMonth = new Date();
                            lastMonth.setMonth(today.getMonth() - 1);
                            setDateRange({ from: lastMonth, to: today });
                            setShowDatePicker(false);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          Last month
                        </button>
                        <button
                          onClick={() => {
                            const today = new Date();
                            const lastQuarter = new Date();
                            lastQuarter.setMonth(today.getMonth() - 3);
                            setDateRange({ from: lastQuarter, to: today });
                            setShowDatePicker(false);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                        >
                          Last quarter
                        </button>
                      </div>
                      
                      {/* Reset Button */}
                      <button
                        onClick={() => {
                          setDateRange({});
                          setShowDatePicker(false);
                        }}
                        className="text-blue-600 text-sm hover:text-blue-700 font-medium"
                      >
                        Reset
                      </button>
                    </div>
                    
                    {/* Calendar */}
                    <div className="flex-1 p-4">
                      {/* Month Navigation */}
                      <div className="flex items-center justify-between mb-4">
                        <button
                          onClick={() => {
                            const newMonth = new Date(currentMonth);
                            newMonth.setMonth(currentMonth.getMonth() - 1);
                            setCurrentMonth(newMonth);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <h3 className="text-lg font-semibold">
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                          onClick={() => {
                            const newMonth = new Date(currentMonth);
                            newMonth.setMonth(currentMonth.getMonth() + 1);
                            setCurrentMonth(newMonth);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Day Headers */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-1">
                        {(() => {
                          const daysInMonth = getDaysInMonth(currentMonth);
                          const firstDay = getFirstDayOfMonth(currentMonth);
                          const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday=0 to Monday=0
                          const days = [];
                          
                          // Empty cells for days before the first day of month
                          for (let i = 0; i < adjustedFirstDay; i++) {
                            const prevMonth = new Date(currentMonth);
                            prevMonth.setMonth(currentMonth.getMonth() - 1);
                            const daysInPrevMonth = getDaysInMonth(prevMonth);
                            const dayNum = daysInPrevMonth - adjustedFirstDay + i + 1;
                            days.push(
                              <div key={`prev-${i}`} className="text-center p-2 text-gray-300 text-sm">
                                {dayNum}
                              </div>
                            );
                          }
                          
                          // Days of current month
                          for (let day = 1; day <= daysInMonth; day++) {
                            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                            const isToday = isSameDay(date, new Date());
                            const isSelected = (dateRange.from && isSameDay(date, dateRange.from)) || 
                                            (dateRange.to && isSameDay(date, dateRange.to));
                            const isInRange = isDateInRange(date, dateRange.from, dateRange.to);
                            
                            days.push(
                              <button
                                key={day}
                                onClick={() => {
                                  if (!dateRange.from || (dateRange.from && dateRange.to)) {
                                    setDateRange({ from: date, to: undefined });
                                    setSelectingRange(true);
                                  } else {
                                    const from = dateRange.from;
                                    const to = date;
                                    setDateRange({ 
                                      from: from < to ? from : to, 
                                      to: from < to ? to : from 
                                    });
                                    setSelectingRange(false);
                                  }
                                }}
                                className={`text-center p-2 text-sm rounded-full hover:bg-blue-100 transition-colors ${
                                  isToday ? 'bg-blue-500 text-white font-semibold' : 
                                  isSelected ? 'bg-blue-500 text-white' :
                                  isInRange ? 'bg-blue-100 text-blue-600' :
                                  'text-gray-700 hover:text-blue-600'
                                }`}
                              >
                                {day}
                              </button>
                            );
                          }
                          
                          // Fill remaining cells with next month days
                          const totalCells = Math.ceil((adjustedFirstDay + daysInMonth) / 7) * 7;
                          const remainingCells = totalCells - adjustedFirstDay - daysInMonth;
                          for (let day = 1; day <= remainingCells; day++) {
                            days.push(
                              <div key={`next-${day}`} className="text-center p-2 text-gray-300 text-sm">
                                {day}
                              </div>
                            );
                          }
                          
                          return days;
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'scheduled' && (
              <label className="flex items-center space-x-2.5 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={autoAssignEnabled}
                  onChange={(e) => setAutoAssignEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="font-medium">Auto-assign drivers</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout - Sidebar + Content */}
      <div className="flex gap-6">
        {/* Left Sidebar - KPI Cards Stacked */}
        <div className="w-56 space-y-4 flex-shrink-0">
          {(() => {
            const kpis = calculateFilteredKPIs(filteredBookings);
            return (
              <>
                <KpiCard 
                  label="Total Requests"
                  value={kpis.totalRequests.toString()}
                  trend="+8.7%"
                  up={true}
                  icon={Activity}
                />
                <KpiCard 
                  label="Acceptance Rate" 
                  value={kpis.acceptanceRate}
                  trend="+5.2%"
                  up={true}
                  icon={CheckCircle}
                />
                <KpiCard 
                  label="Cancel Rate" 
                  value={kpis.cancelRate}
                  trend="-2.1%"
                  up={false}
                  icon={XCircle}
                />
                <KpiCard 
                  label="Completion Rate" 
                  value={kpis.completionRate}
                  trend="+2.4%"
                  up={true}
                  icon={CheckCircle}
                />
                <KpiCard 
                  label="Avg Fare" 
                  value={kpis.avgFare}
                  trend="+12%"
                  up={true}
                  icon={DollarSign}
                />
              </>
            );
          })()}
        </div>

        {/* Main Content Area - Booking Stream */}
        <div className="flex-1 min-w-0">

        {/* Optimized Bookings Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-lg text-gray-900 font-[Inter]">
                  {tabs.find(t => t.id === activeTab)?.name || 'Bookings'}
                </h2>
                <p className="text-xs text-gray-500">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
                  {isRealTimeEnabled && <span className="ml-2 inline-flex items-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1"></span>
                    Live
                  </span>}
                  {filteredBookings.length > 100 && <span className="ml-2 text-xs text-orange-600">
                    ⚡ High-volume mode
                  </span>}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-xs px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs px-2 py-1 border border-gray-300 rounded"
                >
                  <option value="createdAt">Sort by Time</option>
                  <option value="fare">Sort by Fare</option>
                  <option value="duration">Sort by Duration</option>
                </select>
                <button 
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
                <button 
                  onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    isRealTimeEnabled 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isRealTimeEnabled ? 'Live ON' : 'Live OFF'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                <table className="w-full text-base">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
                      <th className="text-left py-2 font-medium bg-white relative" style={{width: `${columnWidths.bookingId}px`}}>
                        Booking ID
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-gray-300 transition-colors"
                          onMouseDown={(e) => handleMouseDown(e, 'bookingId')}
                        />
                      </th>
                      <th className="text-left py-2 font-medium bg-white relative" style={{width: `${columnWidths.pickupDateTime}px`}}>
                        Type
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-gray-300 transition-colors"
                          onMouseDown={(e) => handleMouseDown(e, 'pickupDateTime')}
                        />
                      </th>
                      <th className="text-left py-2 font-medium bg-white relative" style={{width: `${columnWidths.passenger}px`}}>
                        Passenger
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-gray-300 transition-colors"
                          onMouseDown={(e) => handleMouseDown(e, 'passenger')}
                        />
                      </th>
                      <th className="text-left py-2 font-medium bg-white relative" style={{width: `${columnWidths.driver}px`}}>
                        Driver
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-gray-300 transition-colors"
                          onMouseDown={(e) => handleMouseDown(e, 'driver')}
                        />
                      </th>
                      <th className="text-left py-2 font-medium bg-white relative" style={{width: `${columnWidths.pickup}px`}}>
                        Pickup
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-gray-300 transition-colors"
                          onMouseDown={(e) => handleMouseDown(e, 'pickup')}
                        />
                      </th>
                      <th className="text-left py-2 font-medium bg-white relative" style={{width: `${columnWidths.dropoff}px`}}>
                        Drop off
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-gray-300 transition-colors"
                          onMouseDown={(e) => handleMouseDown(e, 'dropoff')}
                        />
                      </th>
                      <th className="text-center py-2 font-medium bg-white relative" style={{width: `${columnWidths.service}px`}}>
                        Service
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-gray-300 transition-colors"
                          onMouseDown={(e) => handleMouseDown(e, 'service')}
                        />
                      </th>
                      {activeTab === 'requesting' && (
                        <th className="text-center py-2 font-medium bg-white relative" style={{width: `${columnWidths.attempts}px`}}>
                          Attempts
                          <div 
                            className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-gray-300 transition-colors"
                            onMouseDown={(e) => handleMouseDown(e, 'attempts')}
                          />
                        </th>
                      )}
                      <th className="text-center py-2 font-medium bg-white relative" style={{width: `${columnWidths.status}px`}}>
                        {activeTab === 'requesting' ? 'Time Elapsed' : 
                         activeTab === 'active-trips' ? 'Status' : 
                         activeTab === 'failed' ? 'Status' :
                         activeTab === 'cancelled' ? 'Status' : 
                         activeTab === 'scheduled' ? 'Status' : 
                         activeTab === 'completed' ? 'Status' : 'Status'}
                        <div 
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-gray-300 transition-colors"
                          onMouseDown={(e) => handleMouseDown(e, 'status')}
                        />
                      </th>
                      <th className="text-center py-2 font-medium bg-white" style={{width: `${columnWidths.fare}px`}}>
                        Fare
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentBookings.length > 0 ? currentBookings.map((booking, index) => {
                      // Using modal system now
                      const isRecent = recentChanges.has(booking.id);
                      const requestingTime = getRequestingTime(booking);
                      const requestingColor = getRequestingColor(booking);
                      
                      return (
                        <React.Fragment key={`${booking.id}-${index}`}>
                          {/* Main booking row - clickable */}
                          <tr 
                            onClick={() => toggleBookingExpansion(booking.id)}
                            className={`cursor-pointer transition-colors text-xs ${
                              isRecent ? 'bg-blue-50' : 'hover:bg-gray-25'
                            }`}
                          >
                            <td className="py-3 font-medium text-blue-600 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <Eye className="w-3 h-3" />
                                <span>{booking.bookingId}</span>
                                {booking.details?.emergencyFlag && (
                                  <span className="px-1 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded animate-pulse">
                                    🚨
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-gray-700 text-sm">
                              <div>
                                <span className="text-sm">{getTripType(booking)}</span>
                              </div>
                            </td>
                            <td className="py-3 text-gray-900 max-w-32 truncate">
                              <div>
                                <div className="text-sm">{(() => {
                                  const fullName = booking.passenger;
                                  const parts = fullName.split(' ');
                                  if (parts.length >= 2) {
                                    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
                                  }
                                  return fullName;
                                })()}</div>
                                {booking.details?.passenger.rating && (
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <Star className="w-2 h-2 text-yellow-400 fill-current" />
                                    <span>{booking.details.passenger.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 text-gray-700 max-w-32">
                              <div>
                                <div className="text-sm">{(() => {
                                  if (booking.driver === 'Unassigned') return 'Unassigned';
                                  const fullName = booking.driver;
                                  const parts = fullName.split(' ');
                                  if (parts.length >= 2) {
                                    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
                                  }
                                  return fullName;
                                })()}</div>
                                {booking.details?.driver?.rating && booking.driver !== 'Unassigned' && (
                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <Star className="w-2 h-2 text-yellow-400 fill-current" />
                                    <span>{booking.details.driver.rating.toFixed(1)}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3">
                              <div>
                                <div className="text-gray-900 truncate text-sm">{booking.pickup}</div>
                                {(() => {
                                  const demandPercentage = Math.floor(Math.random() * 120 + 20); // 20% to 140%
                                  const getColorClass = (percentage: number) => {
                                    if (percentage <= 60) return 'text-green-600';
                                    if (percentage <= 80) return 'text-orange-600';
                                    return 'text-red-600';
                                  };
                                  const getIndicator = (percentage: number) => {
                                    if (percentage <= 60) return '●';
                                    if (percentage <= 80) return '●';
                                    return '●';
                                  };
                                  return (
                                    <div className={`text-xs flex items-center space-x-1 ${getColorClass(demandPercentage)}`}>
                                      <span>{getIndicator(demandPercentage)}</span>
                                      <span>{demandPercentage}%</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="py-3">
                              <div>
                                <div className="text-gray-900 truncate text-sm">{booking.destination}</div>
                                <div className="text-gray-400 text-xs">{booking.distance} • {booking.duration}</div>
                              </div>
                            </td>
                            <td className="text-center py-3">
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <span className="text-sm">{getServiceIcon(booking.serviceType)}</span>
                                <span className="text-xs font-medium text-center leading-tight max-w-[80px]">
                                  {getServiceDisplayName(booking.serviceType).split(' ').map((word, index, array) => (
                                    <React.Fragment key={index}>
                                      {word}
                                      {index < array.length - 1 && array.length > 2 && index === 0 ? <br /> : 
                                       index < array.length - 1 ? ' ' : ''}
                                    </React.Fragment>
                                  ))}
                                </span>
                              </div>
                            </td>
                            {activeTab === 'requesting' && (
                              <td className="text-center py-3">
                                <div className="flex flex-col items-center justify-center">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {getPassengerAttempts(booking)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {getPassengerAttempts(booking) === 1 ? 'attempt' : 'attempts'}
                                  </span>
                                </div>
                              </td>
                            )}
                            <td className="text-center py-3">
                              {activeTab === 'requesting' ? (
                                <div className="text-center">
                                  <div className={`text-xs font-medium px-2 py-1 rounded border ${getRequestingColor(booking)}`}>
                                    {getRequestingTime(booking)}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setForceAssignModal(booking.id);
                                      setCancelledDriverId(null);
                                      setAssignmentStatus('idle');
                                      setAssignmentMessage('');
                                    }}
                                    className="mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded hover:bg-orange-200"
                                  >
                                    Assign
                                  </button>
                                </div>
                              ) : activeTab === 'active-trips' ? (
                                <div className="text-center">
                                  <div className="text-sm font-medium text-blue-600">
                                    {Math.random() > 0.5 ? 'Pick' : 'Drop'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {Math.floor(Math.random() * 15 + 1)}m elapsed
                                  </div>
                                </div>
                              ) : activeTab === 'failed' ? (
                                <div className="text-center">
                                  <div className="text-sm font-medium text-red-600">Failed</div>
                                  <div className="text-xs text-gray-500">
                                    Timed Out
                                  </div>
                                </div>
                              ) : activeTab === 'cancelled' ? (
                                <div className="text-center">
                                  <div className="text-sm font-medium text-red-600">Cancelled</div>
                                  <div className="text-xs text-gray-500">
                                    {Math.random() > 0.5 ? 'Customer' : 'Driver'}
                                  </div>
                                </div>
                              ) : activeTab === 'scheduled' ? (
                                <div className="text-center">
                                  <div className="text-sm font-medium text-green-600">Scheduled</div>
                                  <div className="text-xs text-gray-500">
                                    {(() => {
                                      const scheduledTime = new Date(booking.createdAt.getTime() + (Math.random() * 24 * 60 * 60 * 1000));
                                      return `${scheduledTime.toLocaleDateString()} ${scheduledTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                                    })()} 
                                  </div>
                                </div>
                              ) : activeTab === 'completed' ? (
                                <div className="text-center">
                                  <div className="text-sm font-medium text-green-600">Completed</div>
                                  <div className="text-xs text-gray-500">
                                    {(() => {
                                      const completedTime = new Date(booking.createdAt.getTime() + (Math.random() * 2 * 60 * 60 * 1000));
                                      return `${completedTime.toLocaleDateString()} ${completedTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                                    })()} 
                                  </div>
                                </div>
                              ) : (
                                <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(getDisplayStatus(booking, activeTab))}`}>
                                  {getDisplayStatus(booking, activeTab)}
                                </span>
                              )}
                            </td>
                            <td className="text-center py-3 font-medium whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-1">
                                <span className="text-sm">₱{booking.fare}</span>
                                {(() => {
                                  const hasSurge = Math.random() > 0.7; // 30% chance of surge
                                  return hasSurge ? (
                                    <Zap className="w-3 h-3 text-yellow-500" title="Surge pricing active" />
                                  ) : null;
                                })()}
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expandable details row */}
                        </React.Fragment>
                      );
                    }) : (
                      <tr>
                        <td colSpan={activeTab === 'requesting' ? 8 : 7} className="py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            {(() => {
                              const Icon = tabs.find(t => t.id === activeTab)?.icon || Activity;
                              return <Icon className="w-12 h-12 text-gray-400 mb-3 opacity-40" />;
                            })()}
                            <p className="font-medium">No {tabs.find(t => t.id === activeTab)?.name.toLowerCase()} found</p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                            {activeTab === 'requesting' && (
                              <p className="text-xs text-blue-600 mt-2">New ride requests will appear here automatically</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-600">
                    {Math.max(1, currentPage - 2)}-{Math.min(totalPages, currentPage + 2)} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      
      {/* Enhanced Force Assignment Modal */}
      {forceAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden border border-[#E5E7EB]">
            <div className="px-6 py-4 bg-white border-b border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-[#3B82F6]" />
                  </div>
                  <div>
                    <h2 className="text-[20px] font-semibold text-[#111827] leading-tight">Assign Driver</h2>
                    <p className="text-[12px] text-[#6B7280] mt-1">Booking #{bookings.find(b => b.id === forceAssignModal)?.bookingId} • {(() => {
                      const booking = bookings.find(b => b.id === forceAssignModal);
                      return booking?.status === 'Scheduled' ? 'Scheduled Booking' : 'Urgent Assignment';
                    })()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setForceAssignModal(null)} 
                  className="p-2 hover:bg-[#F3F4F6] rounded-lg transition-colors text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {(() => {
                const booking = bookings.find(b => b.id === forceAssignModal);
                if (booking?.status === 'Requesting') {
                  return (
                    <div className="mb-4 p-4 bg-[#FEF3C7] border border-[#FACC15] rounded-lg">
                      <div className="flex items-center gap-3 text-[#92400E]">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="text-[14px] font-medium">This booking has been waiting for {getRequestingTime(booking)}. Select a driver to assign immediately:</span>
                      </div>
                    </div>
                  );
                } else if (booking?.status === 'Scheduled') {
                  return (
                    <div className="mb-4 p-4 bg-[#DBEAFE] border border-[#3B82F6] rounded-lg">
                      <div className="flex items-center gap-3 text-[#1E40AF]">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="text-[14px] font-medium">Showing drivers available for this scheduled booking. Select a driver to pre-assign:</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Assignment Status Display */}
              {assignmentStatus === 'success' && (
                <div className="mb-4 p-4 bg-[#D1FAE5] border border-[#10B981] rounded-lg">
                  <div className="flex items-center gap-3 text-[#047857]">
                    <div className="w-4 h-4 bg-[#10B981] rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[14px] font-medium">{assignmentMessage}</span>
                  </div>
                </div>
              )}

              {assignmentStatus === 'failed' && (
                <div className="mb-4 p-4 bg-[#FEE2E2] border border-[#EF4444] rounded-lg">
                  <div className="flex items-center gap-3 text-[#DC2626]">
                    <div className="w-4 h-4 bg-[#EF4444] rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <span className="text-[14px] font-medium">{assignmentMessage}</span>
                      <div className="text-[12px] text-[#DC2626] mt-1 font-medium">Driver KPI effect: Acceptance down 1.3% & Cancel up 2%</div>
                      <div className="text-[12px] text-[#9CA3AF] mt-1">Please select another driver to retry the assignment.</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {(() => {
                  const booking = bookings.find(b => b.id === forceAssignModal);
                  const allDrivers = [
                    { id: 'DR001', name: 'Carlos Mendoza', rating: 4.8, distance: 0.8, eta: 4, plate: 'ABC-1234', vehicle: 'Toyota Vios', status: 'Available', trips: 847, available: true },
                    { id: 'DR002', name: 'Maria Santos', rating: 4.9, distance: 1.2, eta: 6, plate: 'XYZ-5678', vehicle: 'Honda Click', status: 'Available', trips: 1205, available: true },
                    { id: 'DR003', name: 'Juan dela Cruz', rating: 4.7, distance: 2.1, eta: 8, plate: 'DEF-9012', vehicle: 'Toyota Fortuner', status: 'Available', trips: 632, available: booking?.status !== 'Scheduled' },
                    { id: 'DR004', name: 'Elena Rodriguez', rating: 4.6, distance: 1.5, eta: 7, plate: 'GHI-3456', vehicle: 'Honda City', status: 'Busy', trips: 543, available: false }
                  ];
                  
                  // Filter drivers based on booking type
                  const availableDrivers = booking?.status === 'Scheduled' 
                    ? allDrivers.filter(d => d.available && d.status === 'Available')
                    : allDrivers.filter(d => d.status === 'Available');
                    
                  // Sort drivers: cancelled driver goes to bottom
                  const sortedDrivers = availableDrivers.sort((a, b) => {
                    if (a.id === cancelledDriverId) return 1; // Move cancelled to bottom
                    if (b.id === cancelledDriverId) return -1;
                    return 0; // Keep original order for others
                  });
                    
                  return sortedDrivers.map((driver) => {
                    const isCancelled = driver.id === cancelledDriverId;
                    return (
                      <div
                      key={driver.id}
                      onClick={assigningDriverId || isCancelled ? undefined : () => handleForceAssign(forceAssignModal!, driver.id, driver.name)}
                      className={`group p-4 border rounded-lg transition-all duration-200 ${
                        isCancelled 
                          ? 'border-[#FEE2E2] bg-[#FEF2F2] opacity-75 cursor-not-allowed' 
                          : assigningDriverId 
                          ? 'opacity-60 cursor-not-allowed border-[#E5E7EB]'
                          : 'cursor-pointer hover:border-[#3B82F6] hover:bg-[#F9FAFB] border-[#E5E7EB]'
                      }`}
                    >
                    <div className="flex items-center gap-4">
                      {/* Driver Avatar */}
                      <div className="w-12 h-12 bg-[#F3F4F6] rounded-full flex items-center justify-center flex-shrink-0 text-[#374151] font-medium text-[14px]">
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      
                      {/* Driver Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-[16px] font-semibold text-[#111827]">{driver.name}</h3>
                          <div className="text-right">
                            <div className="text-[14px] font-medium text-[#3B82F6]">{driver.distance} km away</div>
                            <div className="text-[12px] text-[#6B7280]">ETA: {driver.eta} minutes</div>
                          </div>
                        </div>
                        
                        {/* Rating & Stats */}
                        <div className="flex items-center gap-4 text-[14px] text-[#6B7280] mb-3">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star 
                                key={i} 
                                className={`w-3 h-3 ${
                                  i < Math.floor(driver.rating) 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                            <span className="font-medium ml-1">{driver.rating}</span>
                          </div>
                          <span>•</span>
                          <span>{driver.trips} trips</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-[#22C55E] rounded-full"></div>
                            <span className="text-[#22C55E] font-medium text-[12px] uppercase tracking-wide">{driver.status}</span>
                          </div>
                        </div>
                        
                        {/* Vehicle Info */}
                        <div className="flex items-center justify-between">
                          <div className="text-[14px] text-[#6B7280]">
                            🚗 {driver.vehicle} - <span className="font-mono text-[12px]">{driver.plate}</span>
                          </div>
                          {isCancelled ? (
                            <div className="text-right">
                              <div className="text-[12px] text-[#DC2626] font-medium">Declined Assignment</div>
                              <div className="text-[10px] text-[#9CA3AF] mt-1">
                                Acceptance ↓1.3%<br />
                                Cancel ↑2%
                              </div>
                            </div>
                          ) : (
                            <button className={`px-4 py-2 rounded-lg text-[14px] font-medium transition-colors border ${
                              assigningDriverId === driver.id 
                                ? 'bg-[#3B82F6] text-white border-[#3B82F6] cursor-wait' 
                                : 'group-hover:bg-[#3B82F6] group-hover:text-white bg-[#F9FAFB] text-[#374151] border-[#E5E7EB] group-hover:border-[#3B82F6]'
                            }`} disabled={assigningDriverId === driver.id}>
                              {assigningDriverId === driver.id ? 'Assigning...' : 'Select Driver'}
                            </button>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                    );
                  })
                })()}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex justify-between items-center">
              <div className="text-[14px] text-[#6B7280]">
                <span className="font-medium text-[#3B82F6]">💡 Tip:</span> Choose the closest available driver for fastest pickup
              </div>
              <button
                onClick={() => setForceAssignModal(null)}
                className="px-4 py-2 text-[14px] font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg hover:bg-[#F9FAFB] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Clean Booking Details Modal */}
      {selectedBookingModal && (() => {
        const booking = bookings.find(b => b.id === selectedBookingModal);
        if (!booking || !booking.details) return null;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[92vh] overflow-hidden flex flex-col">
              {/* Clean Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-semibold text-gray-900 font-[Inter]">Booking Details – {booking.bookingId}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedBookingModal(null)} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Flat Tabs */}
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex px-6">
                  {modalTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveModalTab(tab.id)}
                        className={`flex items-center px-4 py-3 text-sm font-medium transition-colors relative ${
                          activeModalTab === tab.id
                            ? 'text-[#7C3AED] bg-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {tab.name}
                        {activeModalTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7C3AED]"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="flex-1 p-6 overflow-y-auto bg-white">
                {activeModalTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Emergency Alert Banner - Show when emergency flag is active */}
                    {booking.details?.emergencyFlag && (
                      <div className="p-4 bg-red-100 border-2 border-red-500 rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-6 h-6 text-red-600 animate-pulse" />
                          <div>
                            <h4 className="text-lg font-bold text-red-900">🚨 EMERGENCY ALERT</h4>
                            <p className="text-sm text-red-800">SOS has been activated for this trip. Emergency services have been notified.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Map Preview Section */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="h-64 relative">
                        {/* Google Maps Embed */}
                        <iframe
                          className="w-full h-full"
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyD5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f5f&origin=${encodeURIComponent(booking.pickup)}&destination=${encodeURIComponent(booking.destination)}&mode=driving`}
                        />
                        {/* Overlay with trip details */}
                        <div className="absolute top-2 left-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs font-medium text-gray-700">{booking.pickup}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs font-medium text-gray-700">{booking.destination}</span>
                          </div>
                        </div>
                        {/* Route info overlay */}
                        <div className="absolute top-2 right-2 bg-blue-500 bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-white">
                          <div className="text-sm font-medium">{booking.distance}</div>
                          <div className="text-xs opacity-90">{booking.duration}</div>
                        </div>
                        {/* Fallback for when maps can't load */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="text-center">
                            <MapPin className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 font-medium">Loading route...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Trip Summary and Passenger Side by Side */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white">
                        <div className="flex items-center gap-3 mb-4">
                          <MapPin className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Trip Summary</h3>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Type */}
                          <div>
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Type</label>
                            <p className="font-medium text-gray-900 text-sm mt-0.5">
                              {(() => {
                                const rideTypes = ['Regular', 'Scan & Ride', 'Scheduled', 'Concierge'];
                                const selectedType = rideTypes[Math.floor(Math.random() * rideTypes.length)];
                                if (selectedType === 'Scheduled') {
                                  const scheduledTime = new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000);
                                  return `${selectedType} (${scheduledTime.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString()})`;
                                }
                                return selectedType;
                              })()}
                            </p>
                          </div>
                          
                          {/* Pickup & Destination */}
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pickup Location</label>
                              <p className="font-medium text-gray-900 text-sm mt-0.5">{booking.pickup}</p>
                              <p className="text-xs text-gray-500">Requested {new Date(booking.createdAt).toLocaleTimeString()}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Destination</label>
                              <p className="font-medium text-gray-900 text-sm mt-0.5">{booking.destination}</p>
                              <p className="text-xs text-gray-500">Distance: {booking.distance}</p>
                            </div>
                          </div>
                          
                          {/* Service & Duration */}
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Service</label>
                              <p className="font-medium text-gray-900 text-sm mt-0.5">{getServiceDisplayName(booking.serviceType)}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Duration</label>
                              <p className="font-medium text-gray-900 text-sm mt-0.5">{booking.duration}</p>
                            </div>
                          </div>
                          
                          {/* Total Fare */}
                          <div>
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Fare</label>
                            <p className="font-semibold text-gray-900 text-xl mt-0.5">₱{booking.fare}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Passenger Section */}
                      <div className="bg-white">
                        <div className="flex items-center gap-3 mb-4">
                          <User className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Passenger</h3>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Name */}
                          <div>
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Name</label>
                            <p className="font-medium text-gray-900 text-sm mt-0.5">{booking.details.passenger.name}</p>
                          </div>
                          
                          {/* Phone & Rating */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</label>
                              <p className="font-medium text-gray-900 text-sm mt-0.5">{booking.details.passenger.phone}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Rating</label>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="font-medium text-gray-900 text-sm">{booking.details.passenger.rating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Total Trips & Payment */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Trips</label>
                              <p className="font-medium text-gray-900 text-sm mt-0.5">{booking.details.passenger.totalTrips}</p>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Payment</label>
                              <p className="font-medium text-gray-900 capitalize text-sm mt-0.5">{booking.details.passenger.paymentMethod.replace('_', ' ')}</p>
                            </div>
                          </div>
                          
                          {/* Contact Actions */}
                          <div className="pt-2">
                            <div className="flex gap-2">
                              <button 
                                disabled={!canContactPassenger(booking)}
                                onClick={() => canContactPassenger(booking) && handleCallPassenger(booking.details.passenger.phone)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                  canContactPassenger(booking) 
                                    ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB]' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <Phone className="w-4 h-4" />
                                Call
                              </button>
                              <button 
                                disabled={!canContactPassenger(booking)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${
                                  canContactPassenger(booking) 
                                    ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' 
                                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                <MessageCircle className="w-4 h-4" />
                                Message
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeModalTab === 'driver' && (
                  <div className="space-y-6">
                    {/* Driver Assignment Section */}
                    <div className="bg-white border-t border-gray-100 pt-8">
                      <div className="flex items-center gap-3 mb-6">
                        <UserCheck className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Driver Assignment</h3>
                      </div>
                      
                      {booking.details.driver ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                              <label className="text-sm text-gray-500">Driver Name</label>
                              <p className="font-medium text-gray-900">{booking.details.driver.name}</p>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-sm text-gray-500">Phone</label>
                              <p className="font-medium text-gray-900">{booking.details.driver.phone}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-1">
                              <label className="text-sm text-gray-500">Rating</label>
                              <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="font-medium text-gray-900">{booking.details.driver.rating.toFixed(1)}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-sm text-gray-500">Vehicle</label>
                              <p className="font-medium text-gray-900">{booking.details.driver.vehicleModel}</p>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-sm text-gray-500">Plate Number</label>
                              <p className="font-mono font-medium text-gray-900">{booking.details.driver.vehiclePlate}</p>
                            </div>
                          </div>
                          
                          {booking.details.driver.eta && (
                            <div className="grid grid-cols-1 gap-6">
                              <div className="space-y-1">
                                <label className="text-sm text-gray-500">Estimated Arrival</label>
                                <p className="font-semibold text-gray-900">{booking.details.driver.eta} minutes</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-3 pt-2">
                            <button 
                              disabled={!canContactDriver(booking)}
                              onClick={() => canContactDriver(booking) && handleCallDriver(booking.details.driver.phone)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                canContactDriver(booking) 
                                  ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB]' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <Phone className="w-4 h-4" />
                              Call Driver
                            </button>
                            <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Track Location
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-[#FFF7ED] text-[#D97706] rounded-full text-sm font-medium">
                              Unassigned
                            </span>
                            <span className="text-sm text-gray-600">Waiting for driver assignment</span>
                          </div>
                          
                          <div className="pt-2">
                            <button className="bg-[#3B82F6] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2563EB] transition-colors">
                              Force Assign Driver
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {activeModalTab === 'timeline' && (
                  <div className="space-y-6">
                    {/* Enhanced Trip Timeline */}
                    <div className="bg-white">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <History className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Complete Trip Timeline</h3>
                        </div>
                        <div className="text-sm text-gray-500">
                          Total Duration: {(() => {
                            const timeline = booking.details?.tripTimeline || [];
                            if (timeline.length < 2) return 'N/A';
                            const start = timeline[0].timestamp.getTime();
                            const end = timeline[timeline.length - 1].timestamp.getTime();
                            const totalMinutes = Math.floor((end - start) / 60000);
                            return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
                          })()}
                        </div>
                      </div>
                      
                      {/* Timeline Events */}
                      <div className="space-y-4">
                        {booking.details?.tripTimeline?.map((event, index) => {
                          const isLast = index === (booking.details?.tripTimeline?.length || 0) - 1;
                          const isExpandable = event.status === 'assigning';
                          const isExpanded = expandedTimelineEvents.has(event.id);
                          const statusColors = {
                            requested: 'bg-blue-500',
                            assigning: 'bg-yellow-500', 
                            assigned: 'bg-green-500',
                            enroute_pickup: 'bg-purple-500',
                            arrived_pickup: 'bg-indigo-500',
                            passenger_pickup: 'bg-cyan-500',
                            enroute_destination: 'bg-orange-500', 
                            arrived_destination: 'bg-pink-500',
                            completed: 'bg-emerald-500',
                            cancelled: 'bg-red-500'
                          };
                          
                          return (
                            <div key={event.id} className="flex items-start gap-4">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 ${statusColors[event.status]} rounded-full ${!isLast && event.status !== 'completed' && event.status !== 'cancelled' ? 'animate-pulse' : ''}`}></div>
                                {!isLast && <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`${isExpandable ? 'cursor-pointer hover:bg-gray-50 p-2 rounded' : ''}`}
                                     onClick={() => isExpandable && toggleTimelineEvent(event.id)}>
                                  <div className="flex items-start justify-between mb-1">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900 capitalize">
                                          {event.description}
                                        </span>
                                        {isExpandable && (
                                          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                        )}
                                      </div>
                                      {event.duration && (
                                        <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                          +{Math.floor(event.duration / 60000)}m {Math.floor((event.duration % 60000) / 1000)}s
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-sm text-gray-500 ml-4 flex-shrink-0">
                                      {event.timestamp.toLocaleTimeString()}
                                    </span>
                                  </div>
                                  {event.metadata && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {event.metadata.driverName && `Driver: ${event.metadata.driverName}`}
                                      {event.metadata.attemptedDrivers && `${event.metadata.attemptedDrivers} drivers contacted`}
                                      {event.metadata.reason && `Reason: ${event.metadata.reason}`}
                                      {event.metadata.finalFare && `Final fare: ₱${event.metadata.finalFare}`}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Expandable Driver Assignment Details */}
                                {isExpandable && isExpanded && booking.details?.driverAssignmentHistory && (
                                  <div className="mt-3 pl-4 border-l-2 border-yellow-200 space-y-2">
                                    <h4 className="font-medium text-gray-900 text-sm mb-2">Driver Assignment Attempts</h4>
                                    {booking.details.driverAssignmentHistory.map((attempt, attemptIndex) => (
                                      <div key={attempt.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                                              attempt.status === 'accepted' ? 'bg-green-500' :
                                              attempt.status === 'declined' ? 'bg-red-500' :
                                              attempt.status === 'timeout' ? 'bg-gray-500' : 'bg-yellow-500'
                                            }`}>
                                              {attempt.driverName.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div className="flex-1">
                                              <div className="flex items-center gap-3 mb-1">
                                                <h5 className="font-medium text-gray-900 text-sm">{attempt.driverName}</h5>
                                                {attempt.kpiImpact && (
                                                  <div className="flex items-center gap-1.5 text-xs">
                                                    {attempt.kpiImpact.acceptanceRate && (
                                                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                                        Accept {attempt.kpiImpact.acceptanceRate.toFixed(1)}%
                                                      </span>
                                                    )}
                                                    {attempt.kpiImpact.responseTime && (
                                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                                        Response {attempt.kpiImpact.responseTime.toFixed(1)}%
                                                      </span>
                                                    )}
                                                    {attempt.kpiImpact.backToBackOffered && (
                                                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                                                        ↗ B2B
                                                      </span>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex items-center justify-between text-xs text-gray-500">
                                                <div className="flex items-center gap-4">
                                                  <span>#{attempt.driverId}</span>
                                                  <span>★{attempt.rating?.toFixed(1)}</span>
                                                  <span>{attempt.distance?.toFixed(1)}km</span>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                  <span>Offered: {attempt.offeredAt.toLocaleTimeString()}</span>
                                                  <span>Response: {attempt.responseTime}s</span>
                                                  <span>Result: {attempt.declineReason || attempt.status}</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="ml-3">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                                              attempt.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                              attempt.status === 'declined' ? 'bg-red-100 text-red-800' :
                                              attempt.status === 'timeout' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                              {attempt.status.charAt(0).toUpperCase() + attempt.status.slice(1)}
                                            </span>
                                          </div>
                                        </div>

                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }) || (
                          <div className="text-center py-8 text-gray-500">
                            <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No timeline data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeModalTab === 'communication' && (
                  <div className="space-y-6">
                    {/* Communication History */}
                    <div className="bg-white">
                      <div className="flex items-center gap-3 mb-6">
                        <MessageCircle className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Communication History</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {booking.details?.communicationHistory?.map((comm) => {
                          // RBAC Check for private communications
                          const canViewPrivate = hasPermission('contact_passenger_unmasked') || hasPermission('contact_driver_unmasked');
                          
                          if (comm.isPrivate && !canViewPrivate) {
                            return (
                              <div key={comm.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex items-center gap-3 text-gray-500">
                                  <Shield className="w-4 h-4" />
                                  <span className="text-sm font-medium">Private communication - Access restricted</span>
                                  <span className="text-xs">{comm.timestamp.toLocaleTimeString()}</span>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div key={comm.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  comm.type === 'call' ? 'bg-blue-100 text-blue-600' :
                                  comm.type === 'message' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {comm.type === 'call' ? <Phone className="w-4 h-4" /> :
                                   comm.type === 'message' ? <MessageCircle className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900">
                                      {comm.direction.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                    <span className="text-sm text-gray-500">{comm.timestamp.toLocaleTimeString()}</span>
                                  </div>
                                  
                                  {comm.content && (
                                    <p className="text-sm text-gray-700 mb-2">{comm.content}</p>
                                  )}
                                  
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="capitalize">{comm.type}</span>
                                    {comm.duration && <span>{comm.duration}s duration</span>}
                                    <span className={`px-2 py-1 rounded ${
                                      comm.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                      comm.status === 'read' ? 'bg-blue-100 text-blue-700' :
                                      comm.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                      {comm.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }) || (
                          <div className="text-center py-8 text-gray-500">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p>No communication history available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeModalTab === 'financials' && (
                  <div className="space-y-6">
                    {/* Two Column Layout */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Fare Breakdown */}
                      <div className="bg-white">
                        <div className="flex items-center gap-3 mb-4">
                          <CreditCard className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Fare Breakdown</h3>
                        </div>
                        
                        <div className="space-y-2">
                          {(() => {
                            // Single service type selection for consistency
                            const serviceTypes = ['Taxi', 'Premium Taxi', 'MC Taxi', 'TNVS 4-Seat', 'TNVS 6-Seat', 'TNVS Premium'];
                            const selectedService = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
                            
                            // LTFRB Fare Matrix Rates (Updated 2024-2025)
                            const fareMatrix = {
                              'Taxi': { base: 50, timeRate: 2.50, distanceRate: 13.50, bookingFee: 69 },
                              'Premium Taxi': { base: 70, timeRate: 3.00, distanceRate: 15.00, bookingFee: 89 },
                              'MC Taxi': { 
                                base: 50, // First 2km = ₱50
                                timeRate: 2.00, 
                                distanceRate: 10.00, // 3-7km = ₱10/km, 7km+ = ₱15/km (simplified average)
                                bookingFee: 0,
                                surgeCapable: true,
                                specialRates: {
                                  first2km: 50,
                                  km3to7: 10,
                                  beyond7km: 15
                                }
                              },
                              'TNVS 4-Seat': { base: 35, timeRate: 2.00, distanceRate: 13.00, bookingFee: 10, surgeCapable: true },
                              'TNVS 6-Seat': { base: 55, timeRate: 2.00, distanceRate: 18.00, bookingFee: 10, surgeCapable: true },
                              'TNVS Premium': { base: 80, timeRate: 3.50, distanceRate: 20.00, bookingFee: 15, surgeCapable: true }
                            };
                            
                            const rates = fareMatrix[selectedService];
                            const distance = parseFloat(booking.distance.replace('km', ''));
                            const duration = Math.floor(Math.random() * 25) + 15; // 15-40 minutes
                            const baseFare = rates.base;
                            const timeFare = rates.timeRate * duration;
                            
                            // Special MC Taxi distance calculation
                            let distanceFare = 0;
                            if (selectedService === 'MC Taxi' && rates.specialRates) {
                              if (distance <= 2) {
                                distanceFare = 0; // Included in base fare
                              } else if (distance <= 7) {
                                distanceFare = (distance - 2) * rates.specialRates.km3to7;
                              } else {
                                distanceFare = (5 * rates.specialRates.km3to7) + ((distance - 7) * rates.specialRates.beyond7km);
                              }
                            } else {
                              distanceFare = rates.distanceRate * distance;
                            }
                            
                            const bookingFee = rates.bookingFee || 0;
                            const surgeFare = rates.surgeCapable && Math.random() > 0.7 ? (baseFare + timeFare + distanceFare) * 0.5 : 0;
                            const driverTip = Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 10 : 0;
                            const discount = booking.details.fareBreakdown.discount || 0;
                            const total = baseFare + timeFare + distanceFare + bookingFee + surgeFare + driverTip - discount;
                            
                            return (
                              <>
                                {/* Service Type Indicator */}
                                <div className="bg-gray-50 px-3 py-2 rounded-lg mb-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900">{selectedService}</span>
                                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">LTFRB Regulated</span>
                                  </div>
                                </div>

                                {/* Base Fare */}
                                <div className="flex justify-between items-center py-0.5">
                                  <label className="text-sm text-gray-500 font-medium">Base Fare</label>
                                  <p className="font-medium text-gray-900">₱{baseFare.toFixed(2)}</p>
                                </div>
                                
                                {/* Time Rate */}
                                <div className="flex justify-between items-center py-0.5">
                                  <label className="text-sm text-gray-500 font-medium">Time ({duration} mins × ₱{rates.timeRate.toFixed(2)})</label>
                                  <p className="font-medium text-gray-900">₱{timeFare.toFixed(2)}</p>
                                </div>
                                
                                {/* Distance Rate */}
                                <div className="flex justify-between items-center py-0.5">
                                  <label className="text-sm text-gray-500 font-medium">
                                    {selectedService === 'MC Taxi' ? (
                                      distance <= 2 ? `Distance (${distance.toFixed(1)}km included in base)` :
                                      distance <= 7 ? `Distance (${(distance - 2).toFixed(1)}km × ₱10)` :
                                      `Distance (5km × ₱10 + ${(distance - 7).toFixed(1)}km × ₱15)`
                                    ) : (
                                      `Distance (${distance.toFixed(1)}km × ₱${rates.distanceRate.toFixed(2)})`
                                    )}
                                  </label>
                                  <p className="font-medium text-gray-900">₱{distanceFare.toFixed(2)}</p>
                                </div>
                                
                                {/* Surge for TNVS and MC Taxi */}
                                {rates.surgeCapable && surgeFare > 0 && (
                                  <div className="flex justify-between items-center py-0.5">
                                    <label className="text-sm text-gray-500 font-medium">
                                      Surge (1.5x {selectedService === 'MC Taxi' ? 'high demand' : 'peak hours'})
                                    </label>
                                    <p className="font-medium text-red-600">₱{surgeFare.toFixed(2)}</p>
                                  </div>
                                )}
                                
                                <hr className="my-1.5" />
                                <p className="text-xs text-gray-400 mb-1.5">Additional Fees</p>
                                
                                {/* Booking Fee - Not for MC Taxi */}
                                {bookingFee > 0 && (
                                  <div className="flex justify-between items-center py-0.5">
                                    <label className="text-sm text-gray-500 font-medium">Booking Fee</label>
                                    <p className="font-medium text-gray-900">₱{bookingFee.toFixed(2)}</p>
                                  </div>
                                )}
                                
                                {/* Driver Tip - All service types */}
                                {driverTip > 0 && (
                                  <div className="flex justify-between items-center py-0.5">
                                    <label className="text-sm text-gray-500 font-medium">Driver Tip</label>
                                    <p className="font-medium text-green-600">₱{driverTip.toFixed(2)}</p>
                                  </div>
                                )}
                                
                                {/* Senior/PWD/Student Discount */}
                                {discount > 0 && (
                                  <div className="flex justify-between items-center py-0.5">
                                    <label className="text-sm text-gray-500 font-medium">Senior/PWD/Student (20%)</label>
                                    <p className="font-medium text-green-600">-₱{discount.toFixed(2)}</p>
                                  </div>
                                )}

                                <hr className="my-2" />
                                
                                <div className="flex justify-between items-center py-1">
                                  <label className="text-sm text-gray-500 font-medium">Payment Method</label>
                                  <p className="font-medium text-gray-900 capitalize text-sm">
                                    {booking.details.passenger.paymentMethod.replace('_', ' ')}
                                  </p>
                                </div>
                                
                                <div className="flex justify-between items-center py-2 bg-gray-50 px-3 rounded-lg mt-2">
                                  <label className="text-base font-semibold text-gray-900">Total Fare</label>
                                  <p className="font-bold text-gray-900 text-xl">₱{total.toFixed(2)}</p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Promotions & Cost of Sale */}
                      <div className="bg-white">
                        <div className="flex items-center gap-3 mb-4">
                          <Gift className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Promotions & Incentives</h3>
                        </div>
                        
                        <div className="space-y-4">
                          {/* Applied Promotions & Incentives Only */}
                          {(() => {
                            // Only show promotions/incentives that are actually applied to this ride
                            const hasAppliedPromos = Math.random() > 0.6; // 40% chance of having actual applied promotions
                            
                            if (hasAppliedPromos) {
                              const appliedPassengerPromo = Math.random() > 0.5 ? {
                                code: ['FIRST20', 'WEEKDAY15', 'STUDENT10', 'CASHBACK25', 'LOYAL50'][Math.floor(Math.random() * 5)],
                                type: 'Applied Discount',
                                value: Math.floor(Math.random() * 40) + 10,
                                status: 'applied',
                                description: 'Discount applied to this ride'
                              } : null;
                              
                              const appliedDriverIncentive = Math.random() > 0.7 ? {
                                type: ['Peak Hour Bonus', 'Consecutive Rides', 'High Rating Bonus', 'Distance Challenge'][Math.floor(Math.random() * 4)],
                                value: Math.floor(Math.random() * 30) + 15,
                                description: 'Incentive earned for this ride'
                              } : null;
                              
                              if (!appliedPassengerPromo && !appliedDriverIncentive) {
                                return (
                                  <div className="text-center py-6 text-gray-500">
                                    <Gift className="w-6 h-6 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">No active promotions or incentives achieved</p>
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="space-y-3">
                                  {appliedPassengerPromo && (
                                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                      <label className="text-xs text-orange-600 font-medium uppercase tracking-wide">Applied Promotion</label>
                                      <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2">
                                          <p className="font-semibold text-gray-900 text-sm">{appliedPassengerPromo.code}</p>
                                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">Applied</span>
                                        </div>
                                        <p className="font-bold text-orange-600 text-sm">-₱{appliedPassengerPromo.value.toFixed(2)}</p>
                                      </div>
                                      <p className="text-xs text-gray-600 mt-1">{appliedPassengerPromo.description}</p>
                                    </div>
                                  )}
                                  
                                  {appliedDriverIncentive && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                      <label className="text-xs text-green-600 font-medium uppercase tracking-wide">Driver Incentive Earned</label>
                                      <div className="flex items-center justify-between mt-2">
                                        <div>
                                          <p className="font-semibold text-gray-900 text-sm">{appliedDriverIncentive.type}</p>
                                          <p className="text-xs text-gray-600 mt-1">{appliedDriverIncentive.description}</p>
                                        </div>
                                        <p className="font-bold text-green-600 text-sm">+₱{appliedDriverIncentive.value.toFixed(2)}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <div className="text-center py-6 text-gray-500">
                                  <Gift className="w-6 h-6 mx-auto mb-2 opacity-40" />
                                  <p className="text-sm">No active promotions or incentives achieved</p>
                                </div>
                              );
                            }
                          })()}
                          
                          {/* Cost of Sale */}
                          <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">₱</span>
                              </div>
                              <h4 className="font-medium text-gray-900">Cost of Sale</h4>
                              {hasFinanceAccess() && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">Finance Only</span>
                              )}
                            </div>
                            
                            {hasFinanceAccess() ? (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">Driver Earnings (75%)</span>
                                  <span className="font-medium text-gray-900">₱{(booking.details.fareBreakdown.total * 0.75).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">Platform Fee (15%)</span>
                                  <span className="font-medium text-gray-900">₱{(booking.details.fareBreakdown.total * 0.15).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-500">Processing Fee (10%)</span>
                                  <span className="font-medium text-gray-900">₱{(booking.details.fareBreakdown.total * 0.10).toFixed(2)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 text-gray-400 text-sm">
                                <span>Finance access required</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeModalTab === 'passenger' && (
                  <div className="space-y-4">
                    {/* Two Column Layout */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Passenger Profile */}
                      <div className="bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Passenger Profile</h3>
                          </div>
                          {/* Profile Picture */}
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {booking.details.passenger.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center py-0.5">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Full Name</label>
                            <p className="font-medium text-gray-900 text-sm">{booking.details.passenger.name}</p>
                          </div>
                          
                          <div className="flex justify-between items-center py-0.5">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Contact</label>
                            <p className="font-medium text-gray-900 text-sm font-mono">{booking.details.passenger.phone}</p>
                          </div>
                          
                          <div className="flex justify-between items-center py-0.5">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Device</label>
                            <div className="flex items-center gap-1">
                              {(() => {
                                const isIOS = Math.random() > 0.5;
                                return (
                                  <>
                                    <div className={`w-2 h-2 rounded-full ${isIOS ? 'bg-gray-600' : 'bg-green-500'}`}></div>
                                    <span className="font-medium text-gray-900 text-sm">{isIOS ? 'iOS' : 'Android'}</span>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center py-0.5">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Payment</label>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                booking.details.passenger.paymentMethod === 'cash' ? 'bg-green-500' :
                                booking.details.passenger.paymentMethod === 'card' ? 'bg-blue-500' :
                                booking.details.passenger.paymentMethod === 'digital_wallet' ? 'bg-purple-500' : 'bg-gray-500'
                              }`}></div>
                              <span className="font-medium text-gray-900 text-sm capitalize">{booking.details.passenger.paymentMethod.replace('_', ' ')}</span>
                            </div>
                          </div>
                          
                          <hr className="my-1.5" />
                          
                          <div className="flex justify-between items-center py-0.5">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Trips</label>
                            <p className="font-medium text-gray-900 text-sm">{booking.details.passenger.totalTrips}</p>
                          </div>
                          
                          <div className="flex justify-between items-center py-0.5">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Rating</label>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="font-medium text-gray-900 text-sm">{booking.details.passenger.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center py-0.5">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">LTV</label>
                            <p className="font-medium text-gray-900 text-sm">
                              ₱{(() => {
                                const ltv = Math.floor(Math.random() * 15000) + 2500; // ₱2,500-17,500 range
                                return ltv.toLocaleString();
                              })()}
                            </p>
                          </div>
                          
                          <div className="flex justify-between items-center py-0.5">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fraud Rating</label>
                            <div className="flex items-center gap-1">
                              {(() => {
                                const fraudScore = Math.random();
                                const ratingColor = fraudScore > 0.8 ? 'text-red-600' : fraudScore > 0.4 ? 'text-yellow-600' : 'text-green-600';
                                const ratingBg = fraudScore > 0.8 ? 'bg-red-100' : fraudScore > 0.4 ? 'bg-yellow-100' : 'bg-green-100';
                                const ratingText = fraudScore > 0.8 ? 'High Risk' : fraudScore > 0.4 ? 'Medium' : 'Low Risk';
                                
                                return (
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${ratingColor} ${ratingBg}`}>
                                    {ratingText}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center py-0.5">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Referral</label>
                            <div className="text-right">
                              {(() => {
                                const hasReferrer = Math.random() > 0.6; // 40% chance of being referred
                                if (hasReferrer) {
                                  const referrerNames = ['Maria Santos', 'Jose Cruz', 'Ana Reyes', 'Carlos Dela Cruz', 'Rosa Lopez'];
                                  const referrer = referrerNames[Math.floor(Math.random() * referrerNames.length)];
                                  return (
                                    <div>
                                      <p className="font-medium text-green-700 text-sm">Referred</p>
                                      <p className="text-xs text-gray-500">by {referrer}</p>
                                    </div>
                                  );
                                } else {
                                  return <p className="font-medium text-gray-500 text-sm">Direct Sign-up</p>;
                                }
                              })()}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center py-0.5">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Signup Date</label>
                            <p className="font-medium text-gray-900 text-sm">
                              {(() => {
                                // Generate realistic signup date (6 months to 3 years ago)
                                const daysAgo = Math.floor(Math.random() * (365 * 3 - 180)) + 180; // 180 days to 3 years
                                const signupDate = new Date();
                                signupDate.setDate(signupDate.getDate() - daysAgo);
                                return signupDate.toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                });
                              })()}
                            </p>
                          </div>
                          
                          <div className="flex justify-between items-center py-0.5">
                            <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</label>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-700">Active</span>
                            </div>
                          </div>
                          
                          {hasCustomerProfileAccess() && (
                            <div className="text-center pt-2 border-t border-gray-100 mt-3">
                              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium py-1">
                                View Full Profile →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Recent Trip History */}
                      <div className="bg-white">
                        <div className="flex items-center gap-3 mb-4">
                          <Clock className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Recent Trip History</h3>
                        </div>
                        
                        <div className="space-y-1.5">
                          {(() => {
                            // Generate 5 recent trips - compact layout
                            const trips = [];
                            const locations = [
                              'SM MOA', 'Ayala Triangle', 'BGC Central', 'Makati CBD', 'Ortigas',
                              'QC Hall', 'UP Diliman', 'NAIA T3', 'Greenhills', 'Eastwood'
                            ];
                            const statuses = ['completed', 'completed', 'completed', 'cancelled', 'completed'];
                            const promos = ['FIRST20', 'WEEKDAY15', 'STUDENT10', '', 'CASHBACK25', ''];
                            
                            for (let i = 0; i < 5; i++) {
                              const daysAgo = i + 1;
                              const date = new Date();
                              date.setDate(date.getDate() - daysAgo);
                              
                              const fare = Math.floor(Math.random() * 300) + 80;
                              const status = statuses[Math.floor(Math.random() * statuses.length)];
                              const promo = Math.random() > 0.6 ? promos[Math.floor(Math.random() * promos.length)] : '';
                              const pickup = locations[Math.floor(Math.random() * locations.length)];
                              const destination = locations[Math.floor(Math.random() * locations.length)];
                              
                              trips.push({
                                id: `BK-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`,
                                date,
                                pickup,
                                destination,
                                status,
                                fare,
                                promo
                              });
                            }
                            
                            return trips.map((trip, index) => (
                              <div key={trip.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-xs font-mono text-gray-500 shrink-0">{trip.id}</span>
                                  <div className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${
                                    trip.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    trip.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {trip.status}
                                  </div>
                                  {trip.promo && (
                                    <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded shrink-0">
                                      {trip.promo}
                                    </span>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-semibold text-gray-900 text-sm">
                                    {trip.status === 'completed' ? `₱${trip.fare.toFixed(2)}` : '—'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {trip.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                          
                          <div className="text-center pt-1 border-t border-gray-100 mt-2">
                            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium py-1">
                              View All Trip History →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeModalTab === 'driver-vehicle' && (
                  <div className="space-y-4">
                    {booking.details.driver ? (
                      <>
                        {/* Two Column Layout */}
                        <div className="grid grid-cols-2 gap-6">
                          {/* Driver Profile */}
                          <div className="bg-white">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <UserCheck className="w-5 h-5 text-gray-400" />
                                <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Driver Profile</h3>
                              </div>
                              {/* Driver Avatar */}
                              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                {booking.details.driver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Driver Name</label>
                                <p className="font-medium text-gray-900 text-sm">{booking.details.driver.name}</p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</label>
                                <p className="font-medium text-gray-900 text-sm font-mono">{booking.details.driver.phone}</p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">License</label>
                                <p className="font-medium text-gray-900 text-sm">
                                  {(() => {
                                    const licenses = ['N02-12-123456', 'A03-15-654321', 'N01-18-987654', 'B04-20-112233'];
                                    return licenses[Math.floor(Math.random() * licenses.length)];
                                  })()}
                                </p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</label>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-green-700">Online</span>
                                </div>
                              </div>
                              
                              <hr className="my-1.5" />
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Today's Trips</label>
                                <p className="font-medium text-gray-900 text-sm">
                                  {Math.floor(Math.random() * 12) + 1}
                                </p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Rating</label>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="font-medium text-gray-900 text-sm">{booking.details.driver.rating.toFixed(1)}</span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Acceptance Rate</label>
                                <p className="font-medium text-gray-900 text-sm">
                                  {parseFloat(booking.details.driver.acceptanceRate).toFixed(1)}%
                                </p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Join Date</label>
                                <p className="font-medium text-gray-900 text-sm">
                                  {(() => {
                                    const daysAgo = Math.floor(Math.random() * 730) + 90; // 3 months to 2+ years
                                    const joinDate = new Date();
                                    joinDate.setDate(joinDate.getDate() - daysAgo);
                                    return joinDate.toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    });
                                  })()}
                                </p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Today's Earnings</label>
                                <p className="font-medium text-gray-900 text-sm">
                                  ₱{(() => {
                                    const earnings = Math.floor(Math.random() * 1200) + 400; // ₱400-1,600 daily range
                                    return earnings.toLocaleString();
                                  })()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Vehicle Information */}
                          <div className="bg-white">
                            <div className="flex items-center gap-3 mb-4">
                              <Car className="w-5 h-5 text-gray-400" />
                              <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Vehicle Details</h3>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Make & Model</label>
                                <p className="font-medium text-gray-900 text-sm">{booking.details.driver.vehicleModel}</p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Plate Number</label>
                                <p className="font-medium text-gray-900 text-sm font-mono">{booking.details.driver.vehiclePlate}</p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Vehicle Type</label>
                                <p className="font-medium text-gray-900 text-sm capitalize">{booking.details.driver.vehicleType}</p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Year</label>
                                <p className="font-medium text-gray-900 text-sm">
                                  {(() => {
                                    const currentYear = new Date().getFullYear();
                                    const year = currentYear - Math.floor(Math.random() * 15) - 2; // 2-17 years old
                                    return year;
                                  })()}
                                </p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Color</label>
                                <p className="font-medium text-gray-900 text-sm">
                                  {(() => {
                                    const colors = ['White', 'Silver', 'Black', 'Red', 'Blue', 'Gray', 'Yellow'];
                                    return colors[Math.floor(Math.random() * colors.length)];
                                  })()}
                                </p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fuel Type</label>
                                <p className="font-medium text-gray-900 text-sm">
                                  {(() => {
                                    const fuelTypes = ['Gasoline', 'Diesel', 'LPG', 'Electric'];
                                    return fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
                                  })()}
                                </p>
                              </div>
                              
                              <hr className="my-1.5" />
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Insurance</label>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-sm font-medium text-green-700">Valid</span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Registration</label>
                                <p className="font-medium text-gray-900 text-sm">
                                  Expires {(() => {
                                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                    const month = months[Math.floor(Math.random() * 12)];
                                    const year = 2025 + Math.floor(Math.random() * 2);
                                    return `${month} ${year}`;
                                  })()}
                                </p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Mileage</label>
                                <p className="font-medium text-gray-900 text-sm">
                                  {(() => {
                                    const mileage = Math.floor(Math.random() * 150000) + 10000; // 10k-160k km
                                    return `${mileage.toLocaleString()} km`;
                                  })()}
                                </p>
                              </div>
                              
                              <div className="flex justify-between items-center py-0.5">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">Last Service</label>
                                <p className="font-medium text-gray-900 text-sm">
                                  {(() => {
                                    const daysAgo = Math.floor(Math.random() * 90) + 1; // 1-90 days ago
                                    const serviceDate = new Date();
                                    serviceDate.setDate(serviceDate.getDate() - daysAgo);
                                    return `${daysAgo} days ago`;
                                  })()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Driver Actions */}
                        <div className="bg-white p-4 rounded-lg">
                          <div className="flex flex-wrap gap-2">
                            <button 
                              disabled={!canContactDriver(booking)}
                              onClick={() => canContactDriver(booking) && handleCallDriver(booking.details.driver.phone)}
                              className={`px-3 py-2 rounded text-xs font-medium transition-colors flex items-center gap-2 ${
                                canContactDriver(booking) 
                                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <Phone className="w-3 h-3" />
                              Call Driver
                            </button>
                            <button 
                              onClick={() => handleTrackLocation(booking)}
                              className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              <MapPin className="w-3 h-3" />
                              Track Location
                            </button>
                            <button 
                              disabled={!canContactDriver(booking)}
                              onClick={() => canContactDriver(booking) && handleMessageDriver(booking)}
                              className={`px-3 py-2 rounded text-xs font-medium transition-colors flex items-center gap-2 border ${
                                canContactDriver(booking) 
                                  ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50' 
                                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <MessageCircle className="w-3 h-3" />
                              Message
                            </button>
                            <button 
                              onClick={() => handleViewDriverProfile(booking)}
                              className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              <User className="w-3 h-3" />
                              View Profile
                            </button>
                            <button 
                              onClick={() => handleVehicleHistory(booking)}
                              className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                              <Car className="w-3 h-3" />
                              Vehicle History
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-white p-6 rounded-lg text-center">
                        <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Driver Assigned</h3>
                        <p className="text-gray-500 mb-4">This booking is waiting for driver assignment.</p>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                          Force Assign Driver
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                
                {activeModalTab === 'audit' && (
                  <div className="grid grid-cols-3 gap-6">
                    {/* Quick Actions Section */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Settings className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Quick Actions</h3>
                          <p className="text-sm text-gray-600">Available actions for this booking</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                          <Phone className="w-4 h-4 text-blue-600" />
                          Contact Passenger
                        </button>
                        
                        {booking.details.driver && (
                          <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                            <MessageCircle className="w-4 h-4 text-green-600" />
                            Contact Driver
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleTrackLocation(booking)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <MapPin className="w-4 h-4 text-purple-600" />
                          Track Location
                        </button>

                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          Emergency Support
                        </button>
                        
                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                          <CreditCard className="w-4 h-4 text-orange-600" />
                          Process Refund
                        </button>
                        
                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                          <Flag className="w-4 h-4 text-yellow-600" />
                          Flag Issue
                        </button>

                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                          <Download className="w-4 h-4 text-indigo-600" />
                          Export Data
                        </button>
                        
                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                          <Copy className="w-4 h-4 text-gray-600" />
                          Copy Details
                        </button>
                      </div>
                    </div>
                    
                    {/* Audit Trail Section */}
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Clock className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Audit Trail</h3>
                          <p className="text-sm text-gray-600">System and user actions for this booking</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Generate mock audit entries */}
                        {[
                          {
                            timestamp: new Date(Date.now() - 1000 * 60 * 5),
                            action: 'Booking Status Updated',
                            user: 'System',
                            details: `Status changed to "${booking.status}"`,
                            type: 'system'
                          },
                          {
                            timestamp: new Date(Date.now() - 1000 * 60 * 15),
                            action: 'Fare Calculated',
                            user: 'System',
                            details: `Fare set to ₱${booking.fare}`,
                            type: 'system'
                          },
                          {
                            timestamp: new Date(Date.now() - 1000 * 60 * 25),
                            action: 'Booking Created',
                            user: booking.details.passenger.name,
                            details: `Trip requested from ${booking.pickup} to ${booking.destination}`,
                            type: 'user'
                          },
                          {
                            timestamp: new Date(Date.now() - 1000 * 60 * 30),
                            action: 'Risk Assessment',
                            user: 'Security System',
                            details: 'Automated security checks completed - No flags',
                            type: 'security'
                          }
                        ].map((entry, index) => (
                          <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              entry.type === 'system' ? 'bg-blue-100' :
                              entry.type === 'user' ? 'bg-green-100' :
                              entry.type === 'security' ? 'bg-red-100' : 'bg-gray-100'
                            }`}>
                              {entry.type === 'system' ? (
                                <Settings className={`w-4 h-4 ${
                                  entry.type === 'system' ? 'text-blue-600' :
                                  entry.type === 'user' ? 'text-green-600' :
                                  entry.type === 'security' ? 'text-red-600' : 'text-gray-600'
                                }`} />
                              ) : entry.type === 'user' ? (
                                <User className="w-4 h-4 text-green-600" />
                              ) : entry.type === 'security' ? (
                                <Shield className="w-4 h-4 text-red-600" />
                              ) : (
                                <Clock className="w-4 h-4 text-gray-600" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-gray-900 text-sm">{entry.action}</h4>
                                <span className="text-xs text-gray-500">
                                  {entry.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{entry.details}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">by</span>
                                <span className="text-xs font-medium text-gray-700">{entry.user}</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  entry.type === 'system' ? 'bg-blue-100 text-blue-700' :
                                  entry.type === 'user' ? 'bg-green-100 text-green-700' :
                                  entry.type === 'security' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {entry.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Total Events: 4</span>
                          <button className="text-blue-600 hover:text-blue-700 font-medium">
                            View Full History
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Role-based Administrative Actions */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Administrative Actions</h3>
                          <p className="text-sm text-gray-600">Advanced actions requiring elevated permissions</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                          <div className="flex items-center gap-3">
                            <XCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-gray-900">Cancel Booking</span>
                          </div>
                          <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors">
                            Cancel
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                          <div className="flex items-center gap-3">
                            <DollarSign className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-gray-900">Adjust Fare</span>
                          </div>
                          <button className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors">
                            Adjust
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                          <div className="flex items-center gap-3">
                            <RotateCcw className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">Reassign Driver</span>
                          </div>
                          <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                            Reassign
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                          <div className="flex items-center gap-3">
                            <Ban className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-900">Flag Account</span>
                          </div>
                          <button className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors">
                            Flag
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-yellow-100 rounded-md border border-yellow-200">
                        <div className="flex items-center gap-2 text-sm text-yellow-800">
                          <Shield className="w-4 h-4" />
                          <span className="font-medium">Current Role: {userRole}</span>
                          <span className="text-yellow-600">• Access Level: {userRole === 'admin' ? 'Full' : 'Limited'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeModalTab === 'aiml' && (
                  <div className="space-y-6">
                    {/* Two Column Layout */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Model Training Contributions */}
                      <div className="bg-white">
                        <div className="flex items-center gap-3 mb-4">
                          <Brain className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Model Training Contributions</h3>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-gray-900">Demand Prediction</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              <p>• Route popularity: High-demand corridor</p>
                              <p>• Time pattern: Peak hour data point</p>
                              <p>• Weather correlation: Rainy day behavior</p>
                              <p className="text-blue-600 font-medium mt-1">Model confidence: +0.3%</p>
                            </div>
                          </div>
                          
                          <div className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Route className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-gray-900">Route Optimization</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              <p>• Traffic pattern: Alternative route validation</p>
                              <p>• ETA accuracy: Within 2-minute variance</p>
                              <p>• Fuel efficiency: 8% better than baseline</p>
                              <p className="text-green-600 font-medium mt-1">Algorithm improvement: +0.5%</p>
                            </div>
                          </div>
                          
                          <div className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-4 h-4 text-orange-600" />
                              <span className="font-medium text-gray-900">Dynamic Pricing</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              <p>• Surge factor: 1.2x validated</p>
                              <p>• Price sensitivity: Customer accepted</p>
                              <p>• Market response: Optimal pricing confirmed</p>
                              <p className="text-orange-600 font-medium mt-1">Revenue optimization: +2.1%</p>
                            </div>
                          </div>
                          
                          <div className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-4 h-4 text-red-600" />
                              <span className="font-medium text-gray-900">Fraud Detection</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              <p>• Behavioral pattern: Normal user activity</p>
                              <p>• Payment verification: Clean transaction</p>
                              <p>• Location consistency: Route validated</p>
                              <p className="text-red-600 font-medium mt-1">Security model: +0.8%</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI-Generated Insights */}
                      <div className="bg-white">
                        <div className="flex items-center gap-3 mb-4">
                          <BarChart3 className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">AI-Generated Insights</h3>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-1">Customer Retention Opportunity</h4>
                                <p className="text-xs text-gray-600 mb-2">Passenger shows loyalty patterns with 89% trip completion rate. Recommend personalized discount for next 3 bookings.</p>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">High Confidence</span>
                                  <span className="text-gray-500">Customer LTV Model v2.3</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-1">Driver Performance Insight</h4>
                                <p className="text-xs text-gray-600 mb-2">Driver completed trip 12% faster than average. Route knowledge excellent for this corridor. Consider for premium service tier.</p>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Medium Confidence</span>
                                  <span className="text-gray-500">Driver Analytics Engine v1.8</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-1">Market Expansion Signal</h4>
                                <p className="text-xs text-gray-600 mb-2">Route shows 340% demand growth vs last quarter. Consider increasing driver allocation for this area during peak hours.</p>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">High Confidence</span>
                                  <span className="text-gray-500">Market Intelligence AI v3.1</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Data Pipeline Status - Full Width */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Database className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 font-[Inter]">Data Pipeline Status</h3>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">Data Ingestion</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="text-xs text-gray-600">
                            <p>Processed: 2.3s ago</p>
                            <p>Next batch: 30s</p>
                          </div>
                        </div>
                        
                        <div className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">Model Updates</span>
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                          <div className="text-xs text-gray-600">
                            <p>Last update: 15m ago</p>
                            <p>Models affected: 4/12</p>
                          </div>
                        </div>
                        
                        <div className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">Insights Ready</span>
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          </div>
                          <div className="text-xs text-gray-600">
                            <p>Generated: Now</p>
                            <p>Confidence: 87%</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                        <div className="flex items-center gap-2 text-sm text-blue-800">
                          <Brain className="w-4 h-4" />
                          <span className="font-medium">AI Status:</span>
                          <span className="text-blue-600">All models operating normally • Training pipeline active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Booking ID: {booking.bookingId} • Status: {booking.status}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 text-gray-700 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50">
                      Export
                    </button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Take Action
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default BookingsPage;
