/**
 * Shifts Zustand Store
 * State management for shift scheduling and clock events
 * Based on SHIFT-HANDOVER-PROTOCOL.md governance
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ShiftTemplate = '2x12' | '3x8' | 'custom';

export interface ClockEvent {
  id: string;
  driverId: string;
  driverName: string;
  eventType: 'clock_in' | 'clock_out';
  timestamp: string;
  geofenceValidated: boolean;
  geofenceOverride?: boolean;
  overrideReason?: string;
  overrideBy?: string;
  latitude?: number;
  longitude?: number;
  status: 'on_time' | 'early' | 'late';
  minutesOffset?: number; // positive = early, negative = late
}

export interface Shift {
  id: string;
  depotId: string;
  depotName: string;
  date: string;
  startTime: string;
  endTime: string;
  supervisorId?: string;
  supervisorName?: string;
  template: ShiftTemplate;
  minDrivers: number;
  maxDrivers: number;
  assignedDrivers: string[];
  clockEvents: ClockEvent[];
  rollCallComplete: boolean;
  status: 'scheduled' | 'active' | 'completed';

  // Clock-in rules
  earlyClockInMinutes: number; // e.g., 15 minutes before
  lateClockInMinutes: number; // e.g., 5 minutes after
  requireGeofence: boolean;
}

interface ShiftsState {
  // Shifts
  shifts: Shift[];
  selectedShift: Shift | null;

  // Calendar view
  calendarView: 'week' | 'month';
  selectedDate: string;

  // Filters
  depotFilter: string | 'all';
  statusFilter: 'all' | 'scheduled' | 'active' | 'completed';

  // Actions - Shifts
  setShifts: (shifts: Shift[]) => void;
  addShift: (shift: Shift) => void;
  selectShift: (shift: Shift | null) => void;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  deleteShift: (id: string) => void;

  // Actions - Clock Events
  addClockEvent: (shiftId: string, event: ClockEvent) => void;
  updateClockEvent: (shiftId: string, eventId: string, updates: Partial<ClockEvent>) => void;

  // Actions - Calendar
  setCalendarView: (view: 'week' | 'month') => void;
  setSelectedDate: (date: string) => void;

  // Actions - Filters
  setDepotFilter: (depot: string | 'all') => void;
  setStatusFilter: (status: 'all' | 'scheduled' | 'active' | 'completed') => void;

  // Reset
  reset: () => void;
}

const initialState = {
  shifts: [],
  selectedShift: null,
  calendarView: 'week' as const,
  selectedDate: new Date().toISOString().split('T')[0],
  depotFilter: 'all' as const,
  statusFilter: 'all' as const,
};

export const useShiftsStore = create<ShiftsState>()(
  devtools(
    (set) => ({
      ...initialState,

      setShifts: (shifts) => set({ shifts }, false, 'setShifts'),

      addShift: (shift) => set((state) => ({
        shifts: [...state.shifts, shift],
      }), false, 'addShift'),

      selectShift: (shift) => set({ selectedShift: shift }, false, 'selectShift'),

      updateShift: (id, updates) => set((state) => ({
        shifts: state.shifts.map(shift =>
          shift.id === id ? { ...shift, ...updates } : shift
        ),
        selectedShift: state.selectedShift?.id === id
          ? { ...state.selectedShift, ...updates }
          : state.selectedShift,
      }), false, 'updateShift'),

      deleteShift: (id) => set((state) => ({
        shifts: state.shifts.filter(shift => shift.id !== id),
        selectedShift: state.selectedShift?.id === id ? null : state.selectedShift,
      }), false, 'deleteShift'),

      addClockEvent: (shiftId, event) => set((state) => ({
        shifts: state.shifts.map(shift =>
          shift.id === shiftId
            ? { ...shift, clockEvents: [...shift.clockEvents, event] }
            : shift
        ),
        selectedShift: state.selectedShift?.id === shiftId
          ? { ...state.selectedShift, clockEvents: [...state.selectedShift.clockEvents, event] }
          : state.selectedShift,
      }), false, 'addClockEvent'),

      updateClockEvent: (shiftId, eventId, updates) => set((state) => ({
        shifts: state.shifts.map(shift =>
          shift.id === shiftId
            ? {
                ...shift,
                clockEvents: shift.clockEvents.map(event =>
                  event.id === eventId ? { ...event, ...updates } : event
                ),
              }
            : shift
        ),
        selectedShift: state.selectedShift?.id === shiftId
          ? {
              ...state.selectedShift,
              clockEvents: state.selectedShift.clockEvents.map(event =>
                event.id === eventId ? { ...event, ...updates } : event
              ),
            }
          : state.selectedShift,
      }), false, 'updateClockEvent'),

      setCalendarView: (view) => set({ calendarView: view }, false, 'setCalendarView'),

      setSelectedDate: (date) => set({ selectedDate: date }, false, 'setSelectedDate'),

      setDepotFilter: (depot) => set({ depotFilter: depot }, false, 'setDepotFilter'),

      setStatusFilter: (status) => set({ statusFilter: status }, false, 'setStatusFilter'),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'ShiftsStore' }
  )
);
