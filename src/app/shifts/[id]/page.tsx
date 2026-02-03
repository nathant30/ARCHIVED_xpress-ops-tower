'use client';

/**
 * Shift Details Page
 * Shift info with clock events, tardy tracking, geofence validation
 * Built by Agent 10 - Critical Frontend UI Developer
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useShiftsStore, ClockEvent } from '@/stores/shiftsStore';
import { useRouter } from 'next/navigation';

// Mock clock events
const MOCK_CLOCK_EVENTS: ClockEvent[] = [
  {
    id: 'CE-001',
    driverId: 'D-001',
    driverName: 'Juan Dela Cruz',
    eventType: 'clock_in',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    geofenceValidated: true,
    status: 'on_time',
    minutesOffset: 3,
    latitude: 14.5547,
    longitude: 121.0244,
  },
  {
    id: 'CE-002',
    driverId: 'D-002',
    driverName: 'Maria Santos',
    eventType: 'clock_in',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    geofenceValidated: true,
    status: 'early',
    minutesOffset: 12,
    latitude: 14.5547,
    longitude: 121.0244,
  },
  {
    id: 'CE-003',
    driverId: 'D-003',
    driverName: 'Pedro Garcia',
    eventType: 'clock_in',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    geofenceValidated: true,
    status: 'late',
    minutesOffset: -8,
    latitude: 14.5547,
    longitude: 121.0244,
  },
  {
    id: 'CE-004',
    driverId: 'D-004',
    driverName: 'Ana Lopez',
    eventType: 'clock_in',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    geofenceValidated: false,
    geofenceOverride: true,
    overrideReason: 'GPS signal issue at depot',
    overrideBy: 'SUP-001',
    status: 'on_time',
    minutesOffset: 1,
    latitude: 14.5550,
    longitude: 121.0250,
  },
  {
    id: 'CE-005',
    driverId: 'D-005',
    driverName: 'Carlos Reyes',
    eventType: 'clock_in',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    geofenceValidated: true,
    status: 'on_time',
    minutesOffset: 0,
    latitude: 14.5547,
    longitude: 121.0244,
  },
];

const ShiftDetailsPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { selectedShift, updateShift } = useShiftsStore();

  const shift = selectedShift;

  useEffect(() => {
    setIsClient(true);

    // Mock: Load clock events if shift exists
    if (shift && shift.clockEvents.length === 0) {
      updateShift(shift.id, { clockEvents: MOCK_CLOCK_EVENTS });
    }
  }, [shift, updateShift]);

  // Calculate stats
  const clockedIn = shift?.clockEvents.filter(e => e.eventType === 'clock_in').length || 0;
  const tardyDrivers = shift?.clockEvents.filter(e => e.status === 'late').length || 0;
  const geofenceOverrides = shift?.clockEvents.filter(e => e.geofenceOverride).length || 0;

  // Format time offset
  const formatOffset = (minutes?: number) => {
    if (minutes === undefined) return '';
    if (minutes === 0) return 'On time';
    if (minutes > 0) return `${minutes}m early`;
    return `${Math.abs(minutes)}m late`;
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Shift Not Found</h2>
        <Button onClick={() => router.push('/shifts')}>
          Back to Shifts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{shift.id}</h1>
              <Badge
                variant={
                  shift.status === 'active' ? 'default' :
                  shift.status === 'completed' ? 'secondary' :
                  'outline'
                }
              >
                {shift.status.toUpperCase()}
              </Badge>
              <Badge variant="outline">{shift.template.toUpperCase()}</Badge>
            </div>
            <p className="text-gray-600">{shift.depotName}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clocked In</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {clockedIn}/{shift.assignedDrivers.length}
                </h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tardy</p>
                <h3 className="text-3xl font-bold text-red-600 mt-2">{tardyDrivers}</h3>
                <p className="text-xs text-gray-500 mt-1">&gt;{shift.lateClockInMinutes}min late</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Roll Call</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {shift.rollCallComplete ? (
                    <Badge variant="default">Complete</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overrides</p>
                <h3 className="text-3xl font-bold text-yellow-600 mt-2">{geofenceOverrides}</h3>
                <p className="text-xs text-gray-500 mt-1">Geofence overrides</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Shift Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shift Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold">{new Date(shift.date).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold">{shift.startTime} - {shift.endTime}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Depot:</span>
                <span className="font-semibold">{shift.depotName}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Supervisor:</span>
                <span className="font-semibold">{shift.supervisorName}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-gray-600">Driver Slots:</span>
                <span className="font-semibold">{shift.minDrivers} - {shift.maxDrivers}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clock-In Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Early Window:</span>
                <span className="font-semibold">{shift.earlyClockInMinutes} minutes</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Late Penalty:</span>
                <span className="font-semibold">{shift.lateClockInMinutes} minutes</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Geofence:</span>
                {shift.requireGeofence ? (
                  <Badge variant="default">Required</Badge>
                ) : (
                  <Badge variant="secondary">Optional</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Clock Events */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Clock Events ({shift.clockEvents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shift.clockEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">No clock events yet</p>
                  </div>
                ) : (
                  shift.clockEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Driver Info */}
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            event.status === 'late' ? 'bg-red-100' :
                            event.status === 'early' ? 'bg-blue-100' :
                            'bg-green-100'
                          }`}>
                            <Users className={`h-5 w-5 ${
                              event.status === 'late' ? 'text-red-600' :
                              event.status === 'early' ? 'text-blue-600' :
                              'text-green-600'
                            }`} />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">{event.driverName}</span>
                              <Badge variant="outline" className="text-xs">
                                {event.driverId}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <span className={`font-semibold ${
                                event.status === 'late' ? 'text-red-600' :
                                event.status === 'early' ? 'text-blue-600' :
                                'text-green-600'
                              }`}>
                                {formatOffset(event.minutesOffset)}
                              </span>
                            </div>

                            {/* Geofence Status */}
                            <div className="flex items-center gap-2 mt-2">
                              {event.geofenceValidated ? (
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Geofence Validated</span>
                                </div>
                              ) : event.geofenceOverride ? (
                                <div className="flex items-center gap-1 text-xs text-yellow-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>Override: {event.overrideReason}</span>
                                  <Badge variant="outline" className="text-xs ml-1">
                                    By {event.overrideBy}
                                  </Badge>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-xs text-red-600">
                                  <XCircle className="h-3 w-3" />
                                  <span>Geofence Failed</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Status Badge */}
                        <Badge
                          variant={
                            event.status === 'late' ? 'destructive' :
                            event.status === 'early' ? 'default' :
                            'secondary'
                          }
                          className="flex-shrink-0"
                        >
                          {event.eventType.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ShiftDetailsPage;
