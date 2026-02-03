/**
 * Ground Ops Zustand Store
 * State management for depot operations and vehicle readiness
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Vehicle Readiness State Machine (from governance doc)
export type VehicleReadinessState =
  | 'IDLE'
  | 'CLEANING'
  | 'INSPECTED'
  | 'FUELED'
  | 'SAFE'
  | 'AVAILABLE'
  | 'ON_TRIP'
  | 'NEEDS_MAINTENANCE'
  | 'IN_MAINTENANCE'
  | 'MAINTENANCE_COMPLETE';

export interface Vehicle {
  id: string;
  code: string;
  type: '2W' | '4W_CAR' | '4W_SUV' | '4W_TAXI';
  state: VehicleReadinessState;
  depotId: string;
  licensePlate: string;
  assignedTo?: string;
  lastUpdated: string;
  stateEnteredAt: string;
  photos: string[];
  fuelLevel?: number;
  odometer?: number;
  dashcamWorking?: boolean;
  gpsAccuracy?: number;
}

export interface Depot {
  id: string;
  name: string;
  location: string;
  region: string;
  status: 'operational' | 'limited' | 'closed';
  vehicleCount: number;
  availableVehicles: number;
  maintenanceVehicles: number;
  supervisorId?: string;
  supervisorName?: string;
}

export interface SafetyChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  required: boolean;
}

export interface RollCallData {
  driverId: string;
  driverName: string;
  vehicleId: string;
  depotId: string;
  checkInTime: string;
  geofenceValidated: boolean;
  photoUrl?: string;
  signature?: string;
  acknowledged: boolean;
}

interface GroundOpsState {
  // Depots
  depots: Depot[];
  selectedDepot: Depot | null;

  // Vehicles by state
  vehiclesByState: Record<VehicleReadinessState, Vehicle[]>;
  selectedVehicle: Vehicle | null;

  // Safety checklist
  safetyChecklist: SafetyChecklistItem[];

  // Roll call
  rollCallData: RollCallData[];

  // Actions - Depots
  setDepots: (depots: Depot[]) => void;
  selectDepot: (depot: Depot | null) => void;

  // Actions - Vehicles
  setVehiclesByState: (vehiclesByState: Record<VehicleReadinessState, Vehicle[]>) => void;
  selectVehicle: (vehicle: Vehicle | null) => void;
  transitionVehicleState: (vehicleId: string, newState: VehicleReadinessState) => void;
  updateVehicle: (vehicleId: string, updates: Partial<Vehicle>) => void;

  // Actions - Safety Checklist
  setSafetyChecklist: (checklist: SafetyChecklistItem[]) => void;
  toggleChecklistItem: (itemId: string) => void;

  // Actions - Roll Call
  setRollCallData: (data: RollCallData[]) => void;
  addRollCall: (data: RollCallData) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  depots: [],
  selectedDepot: null,
  vehiclesByState: {
    IDLE: [],
    CLEANING: [],
    INSPECTED: [],
    FUELED: [],
    SAFE: [],
    AVAILABLE: [],
    ON_TRIP: [],
    NEEDS_MAINTENANCE: [],
    IN_MAINTENANCE: [],
    MAINTENANCE_COMPLETE: [],
  },
  selectedVehicle: null,
  safetyChecklist: [],
  rollCallData: [],
};

export const useGroundOpsStore = create<GroundOpsState>()(
  devtools(
    (set) => ({
      ...initialState,

      setDepots: (depots) => set({ depots }, false, 'setDepots'),

      selectDepot: (depot) => set({ selectedDepot: depot }, false, 'selectDepot'),

      setVehiclesByState: (vehiclesByState) => set({ vehiclesByState }, false, 'setVehiclesByState'),

      selectVehicle: (vehicle) => set({ selectedVehicle: vehicle }, false, 'selectVehicle'),

      transitionVehicleState: (vehicleId, newState) => set((state) => {
        const allVehicles: Vehicle[] = [];
        Object.values(state.vehiclesByState).forEach(vehicles => allVehicles.push(...vehicles));

        const vehicle = allVehicles.find(v => v.id === vehicleId);
        if (!vehicle) return state;

        const oldState = vehicle.state;
        const updatedVehicle = {
          ...vehicle,
          state: newState,
          stateEnteredAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };

        // Remove from old state array
        const newVehiclesByState = { ...state.vehiclesByState };
        newVehiclesByState[oldState] = newVehiclesByState[oldState].filter(v => v.id !== vehicleId);

        // Add to new state array
        newVehiclesByState[newState] = [...newVehiclesByState[newState], updatedVehicle];

        return {
          vehiclesByState: newVehiclesByState,
          selectedVehicle: state.selectedVehicle?.id === vehicleId ? updatedVehicle : state.selectedVehicle,
        };
      }, false, 'transitionVehicleState'),

      updateVehicle: (vehicleId, updates) => set((state) => {
        const allVehicles: Vehicle[] = [];
        Object.values(state.vehiclesByState).forEach(vehicles => allVehicles.push(...vehicles));

        const vehicle = allVehicles.find(v => v.id === vehicleId);
        if (!vehicle) return state;

        const updatedVehicle = {
          ...vehicle,
          ...updates,
          lastUpdated: new Date().toISOString(),
        };

        const newVehiclesByState = { ...state.vehiclesByState };
        newVehiclesByState[vehicle.state] = newVehiclesByState[vehicle.state].map(v =>
          v.id === vehicleId ? updatedVehicle : v
        );

        return {
          vehiclesByState: newVehiclesByState,
          selectedVehicle: state.selectedVehicle?.id === vehicleId ? updatedVehicle : state.selectedVehicle,
        };
      }, false, 'updateVehicle'),

      setSafetyChecklist: (checklist) => set({ safetyChecklist: checklist }, false, 'setSafetyChecklist'),

      toggleChecklistItem: (itemId) => set((state) => ({
        safetyChecklist: state.safetyChecklist.map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      }), false, 'toggleChecklistItem'),

      setRollCallData: (data) => set({ rollCallData: data }, false, 'setRollCallData'),

      addRollCall: (data) => set((state) => ({
        rollCallData: [data, ...state.rollCallData],
      }), false, 'addRollCall'),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'GroundOpsStore' }
  )
);
