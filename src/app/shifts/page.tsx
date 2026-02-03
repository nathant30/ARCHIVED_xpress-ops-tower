'use client';

/**
 * Shifts Calendar Page
 * Calendar view with week/month toggle, shift scheduling
 * Built by Agent 10 - Critical Frontend UI Developer
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useShiftsStore, Shift } from '@/stores/shiftsStore';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useRouter } from 'next/navigation';

// Mock shifts data
const MOCK_SHIFTS: Shift[] = [
  {
    id: 'SHF-001',
    depotId: 'depot-1',
    depotName: 'Makati Central Depot',
    date: new Date().toISOString().split('T')[0],
    startTime: '06:00',
    endTime: '18:00',
    supervisorId: 'SUP-001',
    supervisorName: 'Maria Santos',
    template: '2x12',
    minDrivers: 15,
    maxDrivers: 25,
    assignedDrivers: ['D-001', 'D-002', 'D-003', 'D-004', 'D-005'],
    clockEvents: [],
    rollCallComplete: false,
    status: 'active',
    earlyClockInMinutes: 15,
    lateClockInMinutes: 5,
    requireGeofence: true,
  },
  {
    id: 'SHF-002',
    depotId: 'depot-1',
    depotName: 'Makati Central Depot',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '06:00',
    supervisorId: 'SUP-002',
    supervisorName: 'John Cruz',
    template: '2x12',
    minDrivers: 12,
    maxDrivers: 20,
    assignedDrivers: ['D-101', 'D-102', 'D-103'],
    clockEvents: [],
    rollCallComplete: false,
    status: 'scheduled',
    earlyClockInMinutes: 15,
    lateClockInMinutes: 5,
    requireGeofence: true,
  },
  {
    id: 'SHF-003',
    depotId: 'depot-2',
    depotName: 'BGC Operations Hub',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '06:00',
    endTime: '14:00',
    supervisorId: 'SUP-003',
    supervisorName: 'Ana Reyes',
    template: '3x8',
    minDrivers: 10,
    maxDrivers: 18,
    assignedDrivers: ['D-201', 'D-202', 'D-203', 'D-204'],
    clockEvents: [],
    rollCallComplete: false,
    status: 'scheduled',
    earlyClockInMinutes: 15,
    lateClockInMinutes: 5,
    requireGeofence: true,
  },
];

const DEPOT_COLORS: Record<string, string> = {
  'depot-1': 'bg-blue-100 text-blue-700 border-blue-300',
  'depot-2': 'bg-green-100 text-green-700 border-green-300',
  'depot-3': 'bg-purple-100 text-purple-700 border-purple-300',
  'depot-4': 'bg-orange-100 text-orange-700 border-orange-300',
  'depot-5': 'bg-pink-100 text-pink-700 border-pink-300',
};

const ShiftsCalendarPage = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const {
    shifts,
    selectedDate,
    calendarView,
    depotFilter,
    statusFilter,
    setShifts,
    selectShift,
    setSelectedDate,
    setCalendarView,
    setDepotFilter,
    setStatusFilter,
  } = useShiftsStore();

  useEffect(() => {
    setIsClient(true);
    if (!isFeatureEnabled('shifts')) {
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (!isClient) return;
    setShifts(MOCK_SHIFTS);
  }, [isClient, setShifts]);

  // Generate calendar days for week view
  const calendarDays = useMemo(() => {
    const date = new Date(selectedDate);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day.toISOString().split('T')[0]);
    }
    return days;
  }, [selectedDate]);

  // Filter shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      const matchesDepot = depotFilter === 'all' || shift.depotId === depotFilter;
      const matchesStatus = statusFilter === 'all' || shift.status === statusFilter;
      return matchesDepot && matchesStatus;
    });
  }, [shifts, depotFilter, statusFilter]);

  // Get shifts for a specific date
  const getShiftsForDate = (date: string) => {
    return filteredShifts.filter(shift => shift.date === date);
  };

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const handleShiftClick = (shift: Shift) => {
    selectShift(shift);
    router.push(`/shifts/${shift.id}`);
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            Shift Scheduling
          </h1>
          <p className="text-gray-600 mt-1">
            Manage shifts and driver assignments • {shifts.length} shifts scheduled
          </p>
        </div>

        <Button
          onClick={() => router.push('/shifts/create')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Shift
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Shifts</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{shifts.length}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Now</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">
                  {shifts.filter(s => s.status === 'active').length}
                </h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <h3 className="text-3xl font-bold text-blue-600 mt-2">
                  {shifts.filter(s => s.status === 'scheduled').length}
                </h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Drivers Assigned</p>
                <h3 className="text-3xl font-bold text-purple-600 mt-2">
                  {shifts.reduce((sum, s) => sum + s.assignedDrivers.length, 0)}
                </h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <select
                value={depotFilter}
                onChange={(e) => setDepotFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Depots</option>
                <option value="depot-1">Makati Central</option>
                <option value="depot-2">BGC Operations</option>
                <option value="depot-3">Quezon City</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={calendarView === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarView('week')}
              >
                Week
              </Button>
              <Button
                variant={calendarView === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCalendarView('month')}
              >
                Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {calendarDays.map((day) => (
              <div key={day} className="text-center border-b-2 pb-2">
                <p className="text-sm font-semibold text-gray-900">{formatDayName(day)}</p>
                <p className="text-xs text-gray-600">{formatDate(day)}</p>
              </div>
            ))}

            {/* Shift Cards */}
            {calendarDays.map((day) => {
              const dayShifts = getShiftsForDate(day);
              const isToday = day === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={day}
                  className={`min-h-[200px] p-2 rounded-lg ${
                    isToday ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'
                  }`}
                >
                  <div className="space-y-2">
                    {dayShifts.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center mt-4">No shifts</p>
                    ) : (
                      dayShifts.map((shift) => (
                        <div
                          key={shift.id}
                          onClick={() => handleShiftClick(shift)}
                          className={`p-2 rounded-lg border-2 cursor-pointer hover:shadow-md transition-shadow ${
                            DEPOT_COLORS[shift.depotId] || 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold">{shift.startTime}</span>
                            <Badge variant="outline" className="text-xs">
                              {shift.template}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium truncate mb-1">{shift.depotName}</p>
                          <div className="flex items-center gap-1 text-xs">
                            <Users className="h-3 w-3" />
                            <span>{shift.assignedDrivers.length}/{shift.maxDrivers}</span>
                          </div>
                          {shift.status === 'active' && (
                            <Badge variant="default" className="text-xs mt-1">
                              ACTIVE
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftsCalendarPage;
