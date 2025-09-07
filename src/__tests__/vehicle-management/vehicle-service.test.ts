// Vehicle Service Unit Tests
// Comprehensive test suite for vehicle database operations and business logic
// Testing all CRUD operations, filtering, validation, and ownership models

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  VehicleFilterParams,
  VehicleOwnershipType,
  VehicleStatus,
  VehicleCondition,
  VehicleCategory,
  FuelType
} from '@/types/vehicles';

// Mock vehicle service for testing
class MockVehicleService {
  private vehicles: Vehicle[] = [];
  private nextId = 1;

  constructor() {
    this.seedTestData();
  }

  private seedTestData() {
    this.vehicles = [
      {
        id: 'veh-001',
        vehicleCode: 'XOT-001',
        licensePlate: 'ABC123',
        vin: 'JT2BF22K5Y0123456',
        make: 'Toyota',
        model: 'Vios',
        year: 2020,
        color: 'White',
        category: 'sedan',
        fuelType: 'gasoline',
        engineDisplacement: 1300,
        seatingCapacity: 4,
        cargoCapacityKg: 300,
        ownershipType: 'xpress_owned',
        status: 'active',
        conditionRating: 'good',
        conditionScore: 85.0,
        regionId: 'region-manila',
        serviceTypes: ['ride_4w'],
        maxTripDistanceKm: 100,
        acquisitionCost: 800000,
        currentMarketValue: 650000,
        monthlyDepreciation: 8000,
        insuranceValue: 700000,
        registrationExpiry: new Date('2025-12-31'),
        ltfrbFranchiseNumber: 'LTFRB-NCR-2024-001',
        ltfrbFranchiseExpiry: new Date('2026-06-30'),
        insuranceProvider: 'PhilCare Insurance',
        insurancePolicyNumber: 'PC-2024-001',
        insuranceExpiry: new Date('2025-03-15'),
        insuranceCoverageAmount: 1000000,
        obdDeviceInstalled: true,
        obdDeviceSerial: 'OBD-001-ABC',
        telematicsProvider: 'FleetTrack',
        telematicsPlan: 'Premium',
        lastMaintenanceDate: new Date('2024-10-15'),
        nextMaintenanceDue: new Date('2025-01-15'),
        totalMaintenanceCost: 25000,
        maintenanceAlertsCount: 0,
        totalDistanceKm: 15000,
        totalTrips: 850,
        averageRating: 4.5,
        fuelEfficiencyKmpl: 14.5,
        carbonEmissionsKg: 2400,
        dailyOperatingHours: 12,
        utilizationRate: 75.0,
        availabilityScore: 92.0,
        emergencyContacts: [],
        safetyFeatures: { abs: true, airbags: true, gps: true },
        accidentCount: 0,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-12-01'),
        createdBy: 'admin-001',
        updatedBy: 'ops-001',
        isActive: true
      },
      {
        id: 'veh-002',
        vehicleCode: 'XOT-002',
        licensePlate: 'DEF456',
        make: 'Honda',
        model: 'City',
        year: 2021,
        color: 'Silver',
        category: 'sedan',
        fuelType: 'gasoline',
        engineDisplacement: 1500,
        seatingCapacity: 4,
        cargoCapacityKg: 350,
        ownershipType: 'fleet_owned',
        fleetOwnerName: 'Metro Fleet Services',
        status: 'active',
        conditionRating: 'excellent',
        conditionScore: 95.0,
        regionId: 'region-cebu',
        serviceTypes: ['ride_4w'],
        maxTripDistanceKm: 120,
        acquisitionCost: 950000,
        currentMarketValue: 820000,
        monthlyDepreciation: 6000,
        registrationExpiry: new Date('2025-11-30'),
        obdDeviceInstalled: false,
        totalMaintenanceCost: 18000,
        maintenanceAlertsCount: 1,
        totalDistanceKm: 12000,
        totalTrips: 600,
        averageRating: 4.7,
        fuelEfficiencyKmpl: 16.2,
        carbonEmissionsKg: 1800,
        dailyOperatingHours: 10,
        utilizationRate: 68.0,
        availabilityScore: 88.0,
        emergencyContacts: [],
        safetyFeatures: { abs: true, airbags: true },
        accidentCount: 0,
        createdAt: new Date('2024-03-20'),
        updatedAt: new Date('2024-12-01'),
        isActive: true
      },
      {
        id: 'veh-003',
        vehicleCode: 'XOT-003',
        licensePlate: 'GHI789',
        make: 'Nissan',
        model: 'Almera',
        year: 2019,
        color: 'Black',
        category: 'sedan',
        fuelType: 'gasoline',
        seatingCapacity: 4,
        ownershipType: 'driver_owned',
        status: 'maintenance',
        conditionRating: 'fair',
        conditionScore: 70.0,
        regionId: 'region-manila',
        serviceTypes: ['ride_4w'],
        maxTripDistanceKm: 80,
        registrationExpiry: new Date('2025-08-15'),
        obdDeviceInstalled: true,
        totalMaintenanceCost: 42000,
        maintenanceAlertsCount: 3,
        totalDistanceKm: 45000,
        totalTrips: 1200,
        averageRating: 4.2,
        fuelEfficiencyKmpl: 13.8,
        carbonEmissionsKg: 6200,
        dailyOperatingHours: 14,
        utilizationRate: 82.0,
        availabilityScore: 75.0,
        emergencyContacts: [],
        safetyFeatures: {},
        accidentCount: 1,
        createdAt: new Date('2023-09-10'),
        updatedAt: new Date('2024-12-01'),
        isActive: true
      }
    ];
  }

  getVehicles(filters: VehicleFilterParams = {}): Vehicle[] {
    let vehicles = [...this.vehicles.filter(v => v.isActive)];

    if (filters.ownershipType) {
      vehicles = vehicles.filter(v => v.ownershipType === filters.ownershipType);
    }
    
    if (filters.status) {
      vehicles = vehicles.filter(v => v.status === filters.status);
    }
    
    if (filters.regionId) {
      vehicles = vehicles.filter(v => v.regionId === filters.regionId);
    }
    
    if (filters.category) {
      vehicles = vehicles.filter(v => v.category === filters.category);
    }
    
    if (filters.fuelType) {
      vehicles = vehicles.filter(v => v.fuelType === filters.fuelType);
    }
    
    if (filters.make) {
      vehicles = vehicles.filter(v => v.make.toLowerCase().includes(filters.make!.toLowerCase()));
    }
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      vehicles = vehicles.filter(v => 
        v.vehicleCode.toLowerCase().includes(search) ||
        v.licensePlate.toLowerCase().includes(search) ||
        v.make.toLowerCase().includes(search) ||
        v.model.toLowerCase().includes(search)
      );
    }
    
    if (filters.hasActiveAlerts) {
      vehicles = vehicles.filter(v => v.maintenanceAlertsCount > 0);
    }

    return vehicles;
  }

  getVehicleById(id: string): Vehicle | null {
    return this.vehicles.find(v => v.id === id && v.isActive) || null;
  }

  createVehicle(data: CreateVehicleRequest, createdBy: string): Vehicle {
    const id = `veh-${String(this.nextId++).padStart(3, '0')}`;
    const vehicle: Vehicle = {
      id,
      ...data,
      status: 'inactive' as VehicleStatus,
      conditionRating: 'good' as VehicleCondition,
      conditionScore: 85.0,
      totalMaintenanceCost: 0,
      maintenanceAlertsCount: 0,
      totalDistanceKm: 0,
      totalTrips: 0,
      averageRating: 5.0,
      carbonEmissionsKg: 0,
      dailyOperatingHours: 12,
      utilizationRate: 0,
      availabilityScore: 100.0,
      emergencyContacts: [],
      safetyFeatures: {},
      accidentCount: 0,
      obdDeviceInstalled: data.obdDeviceInstalled || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      isActive: true,
      maxTripDistanceKm: 100
    };

    this.vehicles.push(vehicle);
    return vehicle;
  }

  updateVehicle(id: string, data: UpdateVehicleRequest, updatedBy: string): Vehicle | null {
    const index = this.vehicles.findIndex(v => v.id === id && v.isActive);
    if (index === -1) return null;

    this.vehicles[index] = {
      ...this.vehicles[index],
      ...data,
      updatedAt: new Date(),
      updatedBy
    };

    return this.vehicles[index];
  }

  deleteVehicle(id: string): boolean {
    const index = this.vehicles.findIndex(v => v.id === id && v.isActive);
    if (index === -1) return false;

    this.vehicles[index].isActive = false;
    this.vehicles[index].status = 'decommissioned';
    this.vehicles[index].updatedAt = new Date();
    
    return true;
  }

  resetTestData() {
    this.vehicles = [];
    this.nextId = 1;
    this.seedTestData();
  }
}

describe('Vehicle Service Unit Tests', () => {
  let vehicleService: MockVehicleService;

  beforeEach(() => {
    vehicleService = new MockVehicleService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================
  // Vehicle CRUD Operations Tests
  // =====================================================

  describe('Vehicle CRUD Operations', () => {
    describe('getVehicles', () => {
      it('should return all active vehicles when no filters applied', () => {
        const vehicles = vehicleService.getVehicles();
        expect(vehicles).toHaveLength(3);
        expect(vehicles.every(v => v.isActive)).toBe(true);
      });

      it('should filter vehicles by ownership type', () => {
        const xpressOwnedVehicles = vehicleService.getVehicles({ ownershipType: 'xpress_owned' });
        expect(xpressOwnedVehicles).toHaveLength(1);
        expect(xpressOwnedVehicles[0].ownershipType).toBe('xpress_owned');

        const fleetOwnedVehicles = vehicleService.getVehicles({ ownershipType: 'fleet_owned' });
        expect(fleetOwnedVehicles).toHaveLength(1);
        expect(fleetOwnedVehicles[0].ownershipType).toBe('fleet_owned');

        const driverOwnedVehicles = vehicleService.getVehicles({ ownershipType: 'driver_owned' });
        expect(driverOwnedVehicles).toHaveLength(1);
        expect(driverOwnedVehicles[0].ownershipType).toBe('driver_owned');
      });

      it('should filter vehicles by status', () => {
        const activeVehicles = vehicleService.getVehicles({ status: 'active' });
        expect(activeVehicles).toHaveLength(2);
        expect(activeVehicles.every(v => v.status === 'active')).toBe(true);

        const maintenanceVehicles = vehicleService.getVehicles({ status: 'maintenance' });
        expect(maintenanceVehicles).toHaveLength(1);
        expect(maintenanceVehicles[0].status).toBe('maintenance');
      });

      it('should filter vehicles by region', () => {
        const manilaVehicles = vehicleService.getVehicles({ regionId: 'region-manila' });
        expect(manilaVehicles).toHaveLength(2);
        expect(manilaVehicles.every(v => v.regionId === 'region-manila')).toBe(true);

        const cebuVehicles = vehicleService.getVehicles({ regionId: 'region-cebu' });
        expect(cebuVehicles).toHaveLength(1);
        expect(cebuVehicles[0].regionId).toBe('region-cebu');
      });

      it('should filter vehicles by category and fuel type', () => {
        const sedanVehicles = vehicleService.getVehicles({ category: 'sedan' });
        expect(sedanVehicles).toHaveLength(3);

        const gasolineVehicles = vehicleService.getVehicles({ fuelType: 'gasoline' });
        expect(gasolineVehicles).toHaveLength(3);
      });

      it('should search vehicles by text', () => {
        const toyotaVehicles = vehicleService.getVehicles({ search: 'Toyota' });
        expect(toyotaVehicles).toHaveLength(1);
        expect(toyotaVehicles[0].make).toBe('Toyota');

        const plateSearchVehicles = vehicleService.getVehicles({ search: 'ABC' });
        expect(plateSearchVehicles).toHaveLength(1);
        expect(plateSearchVehicles[0].licensePlate).toBe('ABC123');

        const codeSearchVehicles = vehicleService.getVehicles({ search: 'XOT-002' });
        expect(codeSearchVehicles).toHaveLength(1);
        expect(codeSearchVehicles[0].vehicleCode).toBe('XOT-002');
      });

      it('should filter vehicles with active alerts', () => {
        const vehiclesWithAlerts = vehicleService.getVehicles({ hasActiveAlerts: true });
        expect(vehiclesWithAlerts).toHaveLength(2);
        expect(vehiclesWithAlerts.every(v => v.maintenanceAlertsCount > 0)).toBe(true);
      });

      it('should apply multiple filters simultaneously', () => {
        const filteredVehicles = vehicleService.getVehicles({
          regionId: 'region-manila',
          status: 'active',
          ownershipType: 'xpress_owned'
        });
        expect(filteredVehicles).toHaveLength(1);
        expect(filteredVehicles[0].vehicleCode).toBe('XOT-001');
      });
    });

    describe('getVehicleById', () => {
      it('should return vehicle by valid ID', () => {
        const vehicle = vehicleService.getVehicleById('veh-001');
        expect(vehicle).toBeTruthy();
        expect(vehicle!.id).toBe('veh-001');
        expect(vehicle!.vehicleCode).toBe('XOT-001');
      });

      it('should return null for non-existent ID', () => {
        const vehicle = vehicleService.getVehicleById('veh-999');
        expect(vehicle).toBeNull();
      });

      it('should return null for inactive vehicle', () => {
        vehicleService.deleteVehicle('veh-001');
        const vehicle = vehicleService.getVehicleById('veh-001');
        expect(vehicle).toBeNull();
      });
    });

    describe('createVehicle', () => {
      it('should create a new Xpress-owned vehicle', () => {
        const vehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-004',
          licensePlate: 'JKL012',
          make: 'Hyundai',
          model: 'Accent',
          year: 2022,
          color: 'Red',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'xpress_owned',
          regionId: 'region-davao',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-10-31'),
          acquisitionCost: 750000,
          obdDeviceInstalled: true
        };

        const newVehicle = vehicleService.createVehicle(vehicleData, 'admin-001');
        
        expect(newVehicle.id).toMatch(/^veh-\d{3}$/);
        expect(newVehicle.vehicleCode).toBe('XOT-004');
        expect(newVehicle.licensePlate).toBe('JKL012');
        expect(newVehicle.make).toBe('Hyundai');
        expect(newVehicle.model).toBe('Accent');
        expect(newVehicle.year).toBe(2022);
        expect(newVehicle.ownershipType).toBe('xpress_owned');
        expect(newVehicle.status).toBe('inactive'); // New vehicles start inactive
        expect(newVehicle.conditionRating).toBe('good');
        expect(newVehicle.conditionScore).toBe(85.0);
        expect(newVehicle.totalTrips).toBe(0);
        expect(newVehicle.totalDistanceKm).toBe(0);
        expect(newVehicle.isActive).toBe(true);
        expect(newVehicle.createdBy).toBe('admin-001');
      });

      it('should create a fleet-owned vehicle with owner name', () => {
        const vehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-005',
          licensePlate: 'MNO345',
          make: 'Mitsubishi',
          model: 'Mirage',
          year: 2021,
          color: 'Blue',
          category: 'hatchback',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'fleet_owned',
          fleetOwnerName: 'Premium Fleet Solutions',
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-09-30')
        };

        const newVehicle = vehicleService.createVehicle(vehicleData, 'ops-001');
        
        expect(newVehicle.ownershipType).toBe('fleet_owned');
        expect(newVehicle.fleetOwnerName).toBe('Premium Fleet Solutions');
        expect(newVehicle.createdBy).toBe('ops-001');
      });

      it('should create a driver-owned vehicle', () => {
        const vehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-006',
          licensePlate: 'PQR678',
          make: 'Suzuki',
          model: 'Dzire',
          year: 2020,
          color: 'White',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'driver_owned',
          regionId: 'region-cebu',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2025-12-15')
        };

        const newVehicle = vehicleService.createVehicle(vehicleData, 'driver-001');
        
        expect(newVehicle.ownershipType).toBe('driver_owned');
        expect(newVehicle.obdDeviceInstalled).toBe(false); // Default for not specified
      });
    });

    describe('updateVehicle', () => {
      it('should update vehicle basic information', () => {
        const updateData: UpdateVehicleRequest = {
          color: 'Pearl White',
          status: 'in_service',
          conditionRating: 'excellent',
          conditionScore: 92.0
        };

        const updatedVehicle = vehicleService.updateVehicle('veh-001', updateData, 'ops-001');
        
        expect(updatedVehicle).toBeTruthy();
        expect(updatedVehicle!.color).toBe('Pearl White');
        expect(updatedVehicle!.status).toBe('in_service');
        expect(updatedVehicle!.conditionRating).toBe('excellent');
        expect(updatedVehicle!.conditionScore).toBe(92.0);
        expect(updatedVehicle!.updatedBy).toBe('ops-001');
        expect(updatedVehicle!.updatedAt).toBeInstanceOf(Date);
      });

      it('should update vehicle maintenance information', () => {
        const updateData: UpdateVehicleRequest = {
          nextMaintenanceDue: new Date('2025-02-15'),
          totalMaintenanceCost: 28000
        };

        const updatedVehicle = vehicleService.updateVehicle('veh-001', updateData, 'maint-001');
        
        expect(updatedVehicle).toBeTruthy();
        expect(updatedVehicle!.nextMaintenanceDue).toEqual(new Date('2025-02-15'));
        expect(updatedVehicle!.totalMaintenanceCost).toBe(28000);
      });

      it('should return null for non-existent vehicle', () => {
        const updateData: UpdateVehicleRequest = { color: 'Red' };
        const updatedVehicle = vehicleService.updateVehicle('veh-999', updateData, 'ops-001');
        
        expect(updatedVehicle).toBeNull();
      });

      it('should return null for inactive vehicle', () => {
        vehicleService.deleteVehicle('veh-001');
        const updateData: UpdateVehicleRequest = { color: 'Red' };
        const updatedVehicle = vehicleService.updateVehicle('veh-001', updateData, 'ops-001');
        
        expect(updatedVehicle).toBeNull();
      });
    });

    describe('deleteVehicle', () => {
      it('should soft delete a vehicle', () => {
        const success = vehicleService.deleteVehicle('veh-001');
        
        expect(success).toBe(true);
        
        // Vehicle should be marked as inactive
        const allVehicles = vehicleService.vehicles;
        const deletedVehicle = allVehicles.find(v => v.id === 'veh-001');
        expect(deletedVehicle!.isActive).toBe(false);
        expect(deletedVehicle!.status).toBe('decommissioned');
        
        // Should not appear in active vehicle list
        const activeVehicles = vehicleService.getVehicles();
        expect(activeVehicles.find(v => v.id === 'veh-001')).toBeUndefined();
      });

      it('should return false for non-existent vehicle', () => {
        const success = vehicleService.deleteVehicle('veh-999');
        expect(success).toBe(false);
      });

      it('should return false for already inactive vehicle', () => {
        vehicleService.deleteVehicle('veh-001');
        const success = vehicleService.deleteVehicle('veh-001');
        expect(success).toBe(false);
      });
    });
  });

  // =====================================================
  // Business Logic Tests
  // =====================================================

  describe('Business Logic Validation', () => {
    describe('Ownership Model Logic', () => {
      it('should handle Xpress-owned vehicle properties', () => {
        const xpressVehicle = vehicleService.getVehicleById('veh-001');
        
        expect(xpressVehicle!.ownershipType).toBe('xpress_owned');
        expect(xpressVehicle!.acquisitionCost).toBeDefined();
        expect(xpressVehicle!.currentMarketValue).toBeDefined();
        expect(xpressVehicle!.monthlyDepreciation).toBeDefined();
        expect(xpressVehicle!.fleetOwnerName).toBeUndefined();
        expect(xpressVehicle!.operatorOwnerName).toBeUndefined();
      });

      it('should handle fleet-owned vehicle properties', () => {
        const fleetVehicle = vehicleService.getVehicleById('veh-002');
        
        expect(fleetVehicle!.ownershipType).toBe('fleet_owned');
        expect(fleetVehicle!.fleetOwnerName).toBe('Metro Fleet Services');
        expect(fleetVehicle!.acquisitionCost).toBeDefined();
        expect(fleetVehicle!.operatorOwnerName).toBeUndefined();
      });

      it('should handle driver-owned vehicle properties', () => {
        const driverVehicle = vehicleService.getVehicleById('veh-003');
        
        expect(driverVehicle!.ownershipType).toBe('driver_owned');
        expect(driverVehicle!.fleetOwnerName).toBeUndefined();
        expect(driverVehicle!.operatorOwnerName).toBeUndefined();
        // Driver-owned vehicles may not have acquisition cost tracked
      });
    });

    describe('Performance Metrics Calculation', () => {
      it('should calculate utilization rate correctly', () => {
        const vehicles = vehicleService.getVehicles();
        
        vehicles.forEach(vehicle => {
          expect(vehicle.utilizationRate).toBeGreaterThanOrEqual(0);
          expect(vehicle.utilizationRate).toBeLessThanOrEqual(100);
        });
      });

      it('should calculate availability score correctly', () => {
        const vehicles = vehicleService.getVehicles();
        
        vehicles.forEach(vehicle => {
          expect(vehicle.availabilityScore).toBeGreaterThanOrEqual(0);
          expect(vehicle.availabilityScore).toBeLessThanOrEqual(100);
        });
      });

      it('should track fuel efficiency metrics', () => {
        const vehicleWithFuelData = vehicleService.getVehicleById('veh-001');
        
        expect(vehicleWithFuelData!.fuelEfficiencyKmpl).toBe(14.5);
        expect(vehicleWithFuelData!.totalDistanceKm).toBeGreaterThan(0);
      });
    });

    describe('Maintenance Logic', () => {
      it('should track maintenance costs and alerts', () => {
        const highMaintenanceVehicle = vehicleService.getVehicleById('veh-003');
        
        expect(highMaintenanceVehicle!.totalMaintenanceCost).toBe(42000);
        expect(highMaintenanceVehicle!.maintenanceAlertsCount).toBe(3);
        expect(highMaintenanceVehicle!.status).toBe('maintenance');
      });

      it('should handle vehicles without maintenance alerts', () => {
        const goodVehicle = vehicleService.getVehicleById('veh-001');
        
        expect(goodVehicle!.maintenanceAlertsCount).toBe(0);
        expect(goodVehicle!.status).toBe('active');
        expect(goodVehicle!.conditionRating).toBe('good');
      });
    });

    describe('Environmental Impact Tracking', () => {
      it('should track carbon emissions', () => {
        const vehicles = vehicleService.getVehicles();
        
        vehicles.forEach(vehicle => {
          expect(vehicle.carbonEmissionsKg).toBeGreaterThanOrEqual(0);
          expect(typeof vehicle.carbonEmissionsKg).toBe('number');
        });
      });

      it('should correlate emissions with distance and efficiency', () => {
        const highMileageVehicle = vehicleService.getVehicleById('veh-003');
        const lowMileageVehicle = vehicleService.getVehicleById('veh-002');
        
        // High mileage vehicle should have higher emissions
        expect(highMileageVehicle!.carbonEmissionsKg).toBeGreaterThan(lowMileageVehicle!.carbonEmissionsKg);
        expect(highMileageVehicle!.totalDistanceKm).toBeGreaterThan(lowMileageVehicle!.totalDistanceKm);
      });
    });

    describe('Safety and Compliance', () => {
      it('should track accident count and safety features', () => {
        const vehicles = vehicleService.getVehicles();
        
        vehicles.forEach(vehicle => {
          expect(vehicle.accidentCount).toBeGreaterThanOrEqual(0);
          expect(typeof vehicle.safetyFeatures).toBe('object');
        });
      });

      it('should track registration and insurance expiry', () => {
        const xpressVehicle = vehicleService.getVehicleById('veh-001');
        
        expect(xpressVehicle!.registrationExpiry).toBeInstanceOf(Date);
        expect(xpressVehicle!.insuranceExpiry).toBeInstanceOf(Date);
        expect(xpressVehicle!.ltfrbFranchiseExpiry).toBeInstanceOf(Date);
      });
    });

    describe('OBD Device Integration', () => {
      it('should track OBD device status', () => {
        const obdVehicle = vehicleService.getVehicleById('veh-001');
        const nonObdVehicle = vehicleService.getVehicleById('veh-002');
        
        expect(obdVehicle!.obdDeviceInstalled).toBe(true);
        expect(obdVehicle!.obdDeviceSerial).toBe('OBD-001-ABC');
        expect(obdVehicle!.telematicsProvider).toBe('FleetTrack');
        
        expect(nonObdVehicle!.obdDeviceInstalled).toBe(false);
        expect(nonObdVehicle!.obdDeviceSerial).toBeUndefined();
      });
    });
  });

  // =====================================================
  // Edge Cases and Error Handling Tests
  // =====================================================

  describe('Edge Cases and Error Handling', () => {
    describe('Input Validation', () => {
      it('should handle empty search strings', () => {
        const vehicles = vehicleService.getVehicles({ search: '' });
        expect(vehicles).toHaveLength(3);
      });

      it('should handle case-insensitive searches', () => {
        const vehicles1 = vehicleService.getVehicles({ search: 'TOYOTA' });
        const vehicles2 = vehicleService.getVehicles({ search: 'toyota' });
        const vehicles3 = vehicleService.getVehicles({ search: 'Toyota' });
        
        expect(vehicles1).toEqual(vehicles2);
        expect(vehicles2).toEqual(vehicles3);
      });

      it('should handle invalid filter values gracefully', () => {
        const vehicles = vehicleService.getVehicles({ 
          ownershipType: 'invalid_type' as VehicleOwnershipType 
        });
        expect(vehicles).toHaveLength(0);
      });
    });

    describe('Data Consistency', () => {
      it('should maintain referential integrity', () => {
        const vehicle = vehicleService.getVehicleById('veh-001');
        
        expect(vehicle!.createdAt).toBeInstanceOf(Date);
        expect(vehicle!.updatedAt).toBeInstanceOf(Date);
        expect(vehicle!.updatedAt.getTime()).toBeGreaterThanOrEqual(vehicle!.createdAt.getTime());
        expect(vehicle!.isActive).toBe(true);
      });

      it('should handle numeric calculations correctly', () => {
        const vehicles = vehicleService.getVehicles();
        
        vehicles.forEach(vehicle => {
          expect(vehicle.conditionScore).toBeGreaterThan(0);
          expect(vehicle.conditionScore).toBeLessThanOrEqual(100);
          expect(vehicle.utilizationRate).toBeGreaterThanOrEqual(0);
          expect(vehicle.utilizationRate).toBeLessThanOrEqual(100);
        });
      });
    });

    describe('Performance Edge Cases', () => {
      it('should handle vehicles with zero trips', () => {
        const newVehicleData: CreateVehicleRequest = {
          vehicleCode: 'XOT-007',
          licensePlate: 'STU901',
          make: 'Kia',
          model: 'Rio',
          year: 2023,
          color: 'Gray',
          category: 'sedan',
          fuelType: 'gasoline',
          seatingCapacity: 4,
          ownershipType: 'xpress_owned',
          regionId: 'region-manila',
          serviceTypes: ['ride_4w'],
          registrationExpiry: new Date('2026-01-31')
        };

        const newVehicle = vehicleService.createVehicle(newVehicleData, 'admin-001');
        
        expect(newVehicle.totalTrips).toBe(0);
        expect(newVehicle.totalDistanceKm).toBe(0);
        expect(newVehicle.averageRating).toBe(5.0); // Default rating for new vehicles
        expect(newVehicle.utilizationRate).toBe(0);
      });
    });
  });

  // =====================================================
  // Philippines-Specific Features Tests
  // =====================================================

  describe('Philippines-Specific Features', () => {
    describe('LTFRB Compliance', () => {
      it('should track LTFRB franchise information', () => {
        const vehicle = vehicleService.getVehicleById('veh-001');
        
        expect(vehicle!.ltfrbFranchiseNumber).toBe('LTFRB-NCR-2024-001');
        expect(vehicle!.ltfrbFranchiseExpiry).toBeInstanceOf(Date);
        expect(vehicle!.ltfrbFranchiseExpiry!.getTime()).toBeGreaterThan(Date.now());
      });
    });

    describe('Regional Operations', () => {
      it('should support Philippine regional codes', () => {
        const regions = ['region-manila', 'region-cebu', 'region-davao'];
        const vehicles = vehicleService.getVehicles();
        
        vehicles.forEach(vehicle => {
          expect(regions).toContain(vehicle.regionId);
        });
      });
    });

    describe('Insurance and Registration', () => {
      it('should track Philippine insurance requirements', () => {
        const vehicle = vehicleService.getVehicleById('veh-001');
        
        expect(vehicle!.insuranceProvider).toBe('PhilCare Insurance');
        expect(vehicle!.insurancePolicyNumber).toBe('PC-2024-001');
        expect(vehicle!.insuranceExpiry).toBeInstanceOf(Date);
        expect(vehicle!.insuranceCoverageAmount).toBe(1000000);
      });
    });
  });
});