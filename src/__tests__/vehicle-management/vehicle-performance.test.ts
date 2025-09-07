// Vehicle Management Performance Tests
// Comprehensive test suite for large fleet data handling and system performance
// Testing scalability, response times, memory usage, and concurrent operations

import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import { performance } from 'perf_hooks';
import {
  Vehicle,
  CreateVehicleRequest,
  VehicleFilterParams,
  VehicleTelemetryData,
  VehiclePerformanceDaily
} from '@/types/vehicles';

// Mock modules for performance testing
jest.mock('@/lib/database/vehicleService');
jest.mock('@/lib/telemetry/obdProcessor');
jest.mock('@/lib/api-utils');

// Performance test utilities
class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map();

  startMeasurement(name: string): number {
    return performance.now();
  }

  endMeasurement(name: string, startTime: number): number {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    
    this.measurements.get(name)!.push(duration);
    return duration;
  }

  getAverageDuration(name: string): number {
    const durations = this.measurements.get(name) || [];
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  getMaxDuration(name: string): number {
    const durations = this.measurements.get(name) || [];
    return Math.max(...durations);
  }

  getMinDuration(name: string): number {
    const durations = this.measurements.get(name) || [];
    return Math.min(...durations);
  }

  getPercentile(name: string, percentile: number): number {
    const durations = this.measurements.get(name) || [];
    const sorted = durations.sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * sorted.length);
    return sorted[index] || 0;
  }

  reset(): void {
    this.measurements.clear();
  }

  getStats(name: string) {
    return {
      count: this.measurements.get(name)?.length || 0,
      average: this.getAverageDuration(name),
      min: this.getMinDuration(name),
      max: this.getMaxDuration(name),
      p95: this.getPercentile(name, 95),
      p99: this.getPercentile(name, 99)
    };
  }
}

// Mock large-scale vehicle service
class MockLargeScaleVehicleService {
  private vehicles: Map<string, Vehicle> = new Map();
  private telemetryData: Map<string, VehicleTelemetryData[]> = new Map();
  private performanceData: Map<string, VehiclePerformanceDaily[]> = new Map();

  constructor() {
    this.generateLargeDataset();
  }

  private generateLargeDataset(): void {
    // Generate 10,000 vehicles across different regions and ownership types
    const regions = ['region-manila', 'region-cebu', 'region-davao', 'region-baguio', 'region-iloilo'];
    const ownershipTypes = ['xpress_owned', 'fleet_owned', 'operator_owned', 'driver_owned'];
    const makes = ['Toyota', 'Honda', 'Nissan', 'Mitsubishi', 'Hyundai', 'Suzuki'];
    const models = ['Vios', 'City', 'Almera', 'Mirage', 'Accent', 'Dzire'];

    for (let i = 1; i <= 10000; i++) {
      const vehicleId = `veh-${i.toString().padStart(5, '0')}`;
      const regionIndex = i % regions.length;
      const ownershipIndex = i % ownershipTypes.length;
      const makeIndex = i % makes.length;
      const modelIndex = i % models.length;

      const vehicle: Vehicle = {
        id: vehicleId,
        vehicleCode: `XOT-${i.toString().padStart(5, '0')}`,
        licensePlate: `ABC${i.toString().padStart(3, '0')}`,
        vin: `JT2BF22K5Y${i.toString().padStart(7, '0')}`,
        make: makes[makeIndex],
        model: models[modelIndex],
        year: 2018 + (i % 6), // Years 2018-2023
        color: ['White', 'Silver', 'Black', 'Gray', 'Red'][i % 5],
        category: 'sedan',
        fuelType: 'gasoline',
        engineDisplacement: 1300 + (i % 500),
        seatingCapacity: 4,
        cargoCapacityKg: 300,
        ownershipType: ownershipTypes[ownershipIndex] as any,
        status: ['active', 'in_service', 'maintenance', 'inactive'][i % 4] as any,
        conditionRating: ['excellent', 'good', 'fair'][i % 3] as any,
        conditionScore: 60 + (i % 40), // 60-100
        regionId: regions[regionIndex],
        serviceTypes: ['ride_4w'],
        maxTripDistanceKm: 80 + (i % 40), // 80-120 km
        acquisitionCost: 600000 + (i % 400000), // ₱600k-₱1M
        currentMarketValue: 500000 + (i % 300000),
        monthlyDepreciation: 5000 + (i % 5000),
        registrationExpiry: new Date(Date.now() + (i % 365) * 24 * 60 * 60 * 1000),
        obdDeviceInstalled: i % 2 === 0,
        totalMaintenanceCost: (i % 50000) + 10000,
        maintenanceAlertsCount: i % 5,
        totalDistanceKm: (i % 100000) + 5000,
        totalTrips: (i % 2000) + 100,
        averageRating: 3.5 + (i % 15) / 10, // 3.5-5.0
        fuelEfficiencyKmpl: 10 + (i % 8), // 10-18 km/L
        carbonEmissionsKg: 1000 + (i % 5000),
        dailyOperatingHours: 8 + (i % 8), // 8-16 hours
        utilizationRate: 50 + (i % 50), // 50-100%
        availabilityScore: 70 + (i % 30), // 70-100%
        emergencyContacts: [],
        safetyFeatures: {},
        accidentCount: i % 3,
        createdAt: new Date(Date.now() - (i % 365) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        createdBy: `admin-${(i % 10) + 1}`,
        isActive: true
      };

      this.vehicles.set(vehicleId, vehicle);
      
      // Generate telemetry data for vehicles with OBD
      if (vehicle.obdDeviceInstalled) {
        this.generateTelemetryData(vehicleId, 100); // 100 data points per vehicle
      }
      
      // Generate performance data
      this.generatePerformanceData(vehicleId, 30); // 30 days of data
    }
  }

  private generateTelemetryData(vehicleId: string, count: number): void {
    const data: VehicleTelemetryData[] = [];
    
    for (let i = 0; i < count; i++) {
      const telemetry: VehicleTelemetryData = {
        id: `tel-${vehicleId}-${i}`,
        vehicleId,
        deviceId: `obd-${vehicleId}`,
        driverId: `driver-${Math.floor(Math.random() * 1000) + 1}`,
        location: {
          latitude: 14.5995 + (Math.random() - 0.5) * 0.1,
          longitude: 120.9842 + (Math.random() - 0.5) * 0.1
        },
        speedKmh: Math.floor(Math.random() * 80),
        heading: Math.floor(Math.random() * 360),
        altitudeMeters: Math.floor(Math.random() * 100) + 10,
        gpsAccuracyMeters: Math.random() * 5 + 1,
        engineRpm: Math.floor(Math.random() * 3000) + 1000,
        engineLoadPercent: Math.random() * 100,
        throttlePositionPercent: Math.random() * 100,
        engineTemperatureCelsius: Math.floor(Math.random() * 20) + 80,
        coolantTemperatureCelsius: Math.floor(Math.random() * 15) + 75,
        fuelLevelPercent: Math.floor(Math.random() * 100),
        instantaneousFuelConsumptionLph: Math.random() * 10 + 5,
        fuelTrimPercent: Math.random() * 10 - 5,
        batteryVoltage: Math.random() * 2 + 11,
        oilPressureKpa: Math.floor(Math.random() * 200) + 250,
        intakeAirTemperatureCelsius: Math.floor(Math.random() * 20) + 25,
        massAirFlowGps: Math.random() * 30 + 15,
        harshAccelerationCount: Math.floor(Math.random() * 5),
        harshBrakingCount: Math.floor(Math.random() * 5),
        harshCorneringCount: Math.floor(Math.random() * 3),
        idleTimeMinutes: Math.floor(Math.random() * 30),
        ambientTemperatureCelsius: Math.floor(Math.random() * 15) + 25,
        humidityPercent: Math.floor(Math.random() * 30) + 60,
        barometricPressureKpa: Math.random() * 5 + 100,
        activeDtcCodes: [],
        pendingDtcCodes: [],
        dataQualityScore: Math.random() * 20 + 80,
        dataSource: 'obd',
        recordedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        receivedAt: new Date(),
        recordedDate: new Date()
      };
      
      data.push(telemetry);
    }
    
    this.telemetryData.set(vehicleId, data);
  }

  private generatePerformanceData(vehicleId: string, days: number): void {
    const data: VehiclePerformanceDaily[] = [];
    
    for (let i = 0; i < days; i++) {
      const performance: VehiclePerformanceDaily = {
        id: `perf-${vehicleId}-${i}`,
        vehicleId,
        performanceDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        driverId: `driver-${Math.floor(Math.random() * 100) + 1}`,
        totalTrips: Math.floor(Math.random() * 20) + 5,
        completedTrips: Math.floor(Math.random() * 18) + 4,
        cancelledTrips: Math.floor(Math.random() * 3),
        tripCompletionRate: Math.random() * 20 + 80,
        totalOnlineMinutes: Math.floor(Math.random() * 480) + 240,
        totalDrivingMinutes: Math.floor(Math.random() * 300) + 150,
        totalIdleMinutes: Math.floor(Math.random() * 60) + 20,
        utilizationRate: Math.random() * 40 + 60,
        totalDistanceKm: Math.floor(Math.random() * 200) + 50,
        billableDistanceKm: Math.floor(Math.random() * 180) + 45,
        emptyDistanceKm: Math.floor(Math.random() * 30) + 5,
        distanceEfficiency: Math.random() * 20 + 75,
        fuelConsumedLiters: Math.random() * 20 + 10,
        fuelEfficiencyKmpl: Math.random() * 8 + 12,
        fuelCostPhp: Math.random() * 1000 + 500,
        grossRevenuePhp: Math.random() * 3000 + 1500,
        netRevenuePhp: Math.random() * 2000 + 1000,
        driverEarningsPhp: Math.random() * 1500 + 800,
        vehicleExpensesPhp: Math.random() * 500 + 200,
        averageTripRating: Math.random() * 1.5 + 3.5,
        customerComplaints: Math.floor(Math.random() * 3),
        safetyIncidents: Math.floor(Math.random() * 2),
        vehicleIssues: Math.floor(Math.random() * 3),
        carbonEmissionsKg: Math.random() * 50 + 25,
        ecoScore: Math.random() * 30 + 70,
        maintenanceAlertsCount: Math.floor(Math.random() * 4),
        diagnosticEventsCount: Math.floor(Math.random() * 5),
        breakdownIncidents: Math.floor(Math.random() * 2),
        reliabilityScore: Math.random() * 20 + 80,
        obdDataPoints: Math.floor(Math.random() * 1000) + 500,
        obdConnectionUptimePercent: Math.random() * 10 + 90,
        dataQualityScore: Math.random() * 15 + 85,
        regionId: this.vehicles.get(vehicleId)?.regionId,
        topServiceAreas: [],
        costPerKilometer: Math.random() * 10 + 5,
        revenuePerKilometer: Math.random() * 20 + 15,
        profitabilityScore: Math.random() * 30 + 70,
        calculatedAt: new Date(),
        calculationSource: 'system'
      };
      
      data.push(performance);
    }
    
    this.performanceData.set(vehicleId, data);
  }

  // Performance-optimized query methods
  getVehicles(filters: VehicleFilterParams = {}): Vehicle[] {
    let vehicles = Array.from(this.vehicles.values());

    if (filters.ownershipType) {
      vehicles = vehicles.filter(v => v.ownershipType === filters.ownershipType);
    }
    
    if (filters.status) {
      vehicles = vehicles.filter(v => v.status === filters.status);
    }
    
    if (filters.regionId) {
      vehicles = vehicles.filter(v => v.regionId === filters.regionId);
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

    return vehicles;
  }

  getVehicleById(id: string): Vehicle | null {
    return this.vehicles.get(id) || null;
  }

  getTelemetryData(vehicleId: string, limit?: number): VehicleTelemetryData[] {
    const data = this.telemetryData.get(vehicleId) || [];
    return limit ? data.slice(0, limit) : data;
  }

  getPerformanceData(vehicleId: string, days?: number): VehiclePerformanceDaily[] {
    const data = this.performanceData.get(vehicleId) || [];
    return days ? data.slice(0, days) : data;
  }

  // Bulk operations for performance testing
  bulkUpdateVehicles(updates: Array<{ id: string; data: Partial<Vehicle> }>): void {
    updates.forEach(({ id, data }) => {
      const vehicle = this.vehicles.get(id);
      if (vehicle) {
        Object.assign(vehicle, data, { updatedAt: new Date() });
      }
    });
  }

  getVehicleCount(): number {
    return this.vehicles.size;
  }

  clearCache(): void {
    // Simulate cache clearing
  }
}

describe('Vehicle Management Performance Tests', () => {
  let performanceMonitor: PerformanceMonitor;
  let vehicleService: MockLargeScaleVehicleService;

  beforeAll(() => {
    // Increase timeout for performance tests
    jest.setTimeout(60000);
  });

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    vehicleService = new MockLargeScaleVehicleService();
  });

  afterEach(() => {
    performanceMonitor.reset();
  });

  // =====================================================
  // Large Dataset Query Performance Tests
  // =====================================================

  describe('Large Dataset Query Performance', () => {
    it('should handle querying 10,000 vehicles efficiently', () => {
      const startTime = performanceMonitor.startMeasurement('large_query');
      
      const vehicles = vehicleService.getVehicles();
      
      const duration = performanceMonitor.endMeasurement('large_query', startTime);
      
      expect(vehicles.length).toBe(10000);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
      
      console.log(`Large dataset query took ${duration.toFixed(2)}ms`);
    });

    it('should efficiently filter vehicles by region', () => {
      const regions = ['region-manila', 'region-cebu', 'region-davao'];
      
      regions.forEach(region => {
        const startTime = performanceMonitor.startMeasurement('region_filter');
        
        const vehicles = vehicleService.getVehicles({ regionId: region });
        
        const duration = performanceMonitor.endMeasurement('region_filter', startTime);
        
        expect(vehicles.length).toBeGreaterThan(0);
        expect(vehicles.every(v => v.regionId === region)).toBe(true);
        expect(duration).toBeLessThan(100); // Should complete within 100ms
      });
      
      const stats = performanceMonitor.getStats('region_filter');
      console.log(`Region filtering stats:`, stats);
    });

    it('should handle complex multi-filter queries efficiently', () => {
      const complexFilters: VehicleFilterParams = {
        ownershipType: 'xpress_owned',
        status: 'active',
        regionId: 'region-manila',
        make: 'Toyota'
      };
      
      const startTime = performanceMonitor.startMeasurement('complex_filter');
      
      const vehicles = vehicleService.getVehicles(complexFilters);
      
      const duration = performanceMonitor.endMeasurement('complex_filter', startTime);
      
      expect(vehicles.length).toBeGreaterThan(0);
      expect(vehicles.every(v => 
        v.ownershipType === 'xpress_owned' &&
        v.status === 'active' &&
        v.regionId === 'region-manila' &&
        v.make === 'Toyota'
      )).toBe(true);
      expect(duration).toBeLessThan(200); // Should complete within 200ms
      
      console.log(`Complex filtering took ${duration.toFixed(2)}ms, returned ${vehicles.length} vehicles`);
    });

    it('should handle text search across large dataset', () => {
      const searchTerms = ['XOT-001', 'Toyota', 'ABC', 'Vios'];
      
      searchTerms.forEach(term => {
        const startTime = performanceMonitor.startMeasurement('text_search');
        
        const vehicles = vehicleService.getVehicles({ search: term });
        
        const duration = performanceMonitor.endMeasurement('text_search', startTime);
        
        expect(duration).toBeLessThan(300); // Should complete within 300ms
      });
      
      const stats = performanceMonitor.getStats('text_search');
      console.log(`Text search performance:`, stats);
    });
  });

  // =====================================================
  // Concurrent Operations Performance Tests
  // =====================================================

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent vehicle queries', async () => {
      const concurrentQueries = 50;
      const promises: Promise<Vehicle[]>[] = [];
      
      const startTime = performanceMonitor.startMeasurement('concurrent_queries');
      
      for (let i = 0; i < concurrentQueries; i++) {
        const regionIndex = i % 3;
        const region = ['region-manila', 'region-cebu', 'region-davao'][regionIndex];
        
        promises.push(
          Promise.resolve(vehicleService.getVehicles({ regionId: region }))
        );
      }
      
      const results = await Promise.all(promises);
      
      const duration = performanceMonitor.endMeasurement('concurrent_queries', startTime);
      
      expect(results).toHaveLength(concurrentQueries);
      expect(results.every(r => r.length > 0)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      console.log(`${concurrentQueries} concurrent queries took ${duration.toFixed(2)}ms`);
    });

    it('should handle concurrent individual vehicle lookups', async () => {
      const concurrentLookups = 100;
      const vehicleIds = Array.from({ length: concurrentLookups }, (_, i) => 
        `veh-${(i + 1).toString().padStart(5, '0')}`
      );
      
      const startTime = performanceMonitor.startMeasurement('concurrent_lookups');
      
      const promises = vehicleIds.map(id => 
        Promise.resolve(vehicleService.getVehicleById(id))
      );
      
      const results = await Promise.all(promises);
      
      const duration = performanceMonitor.endMeasurement('concurrent_lookups', startTime);
      
      expect(results).toHaveLength(concurrentLookups);
      expect(results.every(r => r !== null)).toBe(true);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
      
      console.log(`${concurrentLookups} concurrent lookups took ${duration.toFixed(2)}ms`);
    });

    it('should handle mixed read/write operations concurrently', async () => {
      const operations = 100;
      const promises: Promise<any>[] = [];
      
      const startTime = performanceMonitor.startMeasurement('mixed_operations');
      
      for (let i = 0; i < operations; i++) {
        if (i % 3 === 0) {
          // Read operation
          promises.push(
            Promise.resolve(vehicleService.getVehicleById(`veh-${(i + 1).toString().padStart(5, '0')}`))
          );
        } else if (i % 3 === 1) {
          // Query operation
          const region = ['region-manila', 'region-cebu', 'region-davao'][i % 3];
          promises.push(
            Promise.resolve(vehicleService.getVehicles({ regionId: region }))
          );
        } else {
          // Update operation (simulated)
          promises.push(
            Promise.resolve(vehicleService.bulkUpdateVehicles([{
              id: `veh-${(i + 1).toString().padStart(5, '0')}`,
              data: { updatedAt: new Date() }
            }]))
          );
        }
      }
      
      await Promise.all(promises);
      
      const duration = performanceMonitor.endMeasurement('mixed_operations', startTime);
      
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      
      console.log(`${operations} mixed operations took ${duration.toFixed(2)}ms`);
    });
  });

  // =====================================================
  // Telemetry Data Performance Tests
  // =====================================================

  describe('Telemetry Data Performance', () => {
    it('should handle large telemetry data queries efficiently', () => {
      const vehicleIds = Array.from({ length: 100 }, (_, i) => 
        `veh-${((i + 1) * 2).toString().padStart(5, '0')}` // OBD-enabled vehicles
      );
      
      const startTime = performanceMonitor.startMeasurement('telemetry_query');
      
      const allTelemetryData = vehicleIds.map(vehicleId => 
        vehicleService.getTelemetryData(vehicleId)
      );
      
      const duration = performanceMonitor.endMeasurement('telemetry_query', startTime);
      
      expect(allTelemetryData).toHaveLength(100);
      expect(allTelemetryData.every(data => data.length === 100)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      
      const totalDataPoints = allTelemetryData.reduce((sum, data) => sum + data.length, 0);
      console.log(`Queried ${totalDataPoints} telemetry data points in ${duration.toFixed(2)}ms`);
    });

    it('should handle telemetry data aggregation efficiently', () => {
      const vehicleIds = Array.from({ length: 50 }, (_, i) => 
        `veh-${((i + 1) * 2).toString().padStart(5, '0')}`
      );
      
      const startTime = performanceMonitor.startMeasurement('telemetry_aggregation');
      
      const aggregatedData = vehicleIds.map(vehicleId => {
        const telemetryData = vehicleService.getTelemetryData(vehicleId);
        
        return {
          vehicleId,
          avgSpeed: telemetryData.reduce((sum, d) => sum + (d.speedKmh || 0), 0) / telemetryData.length,
          avgFuelLevel: telemetryData.reduce((sum, d) => sum + (d.fuelLevelPercent || 0), 0) / telemetryData.length,
          totalHarshEvents: telemetryData.reduce((sum, d) => 
            sum + d.harshAccelerationCount + d.harshBrakingCount + d.harshCorneringCount, 0
          ),
          dataQualityScore: telemetryData.reduce((sum, d) => sum + d.dataQualityScore, 0) / telemetryData.length
        };
      });
      
      const duration = performanceMonitor.endMeasurement('telemetry_aggregation', startTime);
      
      expect(aggregatedData).toHaveLength(50);
      expect(aggregatedData.every(d => 
        typeof d.avgSpeed === 'number' &&
        typeof d.avgFuelLevel === 'number' &&
        typeof d.totalHarshEvents === 'number'
      )).toBe(true);
      expect(duration).toBeLessThan(500); // Should complete within 500ms
      
      console.log(`Telemetry aggregation for 50 vehicles took ${duration.toFixed(2)}ms`);
    });

    it('should handle real-time telemetry processing simulation', async () => {
      const batchSize = 1000;
      const batches = 10;
      
      for (let batch = 0; batch < batches; batch++) {
        const startTime = performanceMonitor.startMeasurement('telemetry_batch');
        
        // Simulate processing a batch of telemetry data
        const batchData: VehicleTelemetryData[] = [];
        for (let i = 0; i < batchSize; i++) {
          const vehicleIndex = (batch * batchSize + i) % 5000; // Distribute across 5000 vehicles
          const vehicleId = `veh-${(vehicleIndex + 1).toString().padStart(5, '0')}`;
          
          const telemetryPoint: VehicleTelemetryData = {
            id: `tel-batch-${batch}-${i}`,
            vehicleId,
            deviceId: `obd-${vehicleId}`,
            speedKmh: Math.floor(Math.random() * 80),
            engineRpm: Math.floor(Math.random() * 3000) + 1000,
            fuelLevelPercent: Math.floor(Math.random() * 100),
            dataQualityScore: Math.random() * 20 + 80,
            dataSource: 'obd',
            recordedAt: new Date(),
            receivedAt: new Date(),
            recordedDate: new Date()
          } as VehicleTelemetryData;
          
          batchData.push(telemetryPoint);
        }
        
        const duration = performanceMonitor.endMeasurement('telemetry_batch', startTime);
        expect(duration).toBeLessThan(100); // Each batch should process within 100ms
      }
      
      const stats = performanceMonitor.getStats('telemetry_batch');
      console.log(`Telemetry batch processing stats:`, stats);
      console.log(`Total processed: ${batches * batchSize} data points`);
    });
  });

  // =====================================================
  // Memory Usage and Resource Management Tests
  // =====================================================

  describe('Memory Usage and Resource Management', () => {
    it('should manage memory efficiently during large operations', () => {
      const initialMemory = process.memoryUsage();
      
      // Perform memory-intensive operations
      const largeResultSets: Vehicle[][] = [];
      
      for (let i = 0; i < 10; i++) {
        const vehicles = vehicleService.getVehicles();
        largeResultSets.push(vehicles);
      }
      
      const peakMemory = process.memoryUsage();
      
      // Clear references to allow garbage collection
      largeResultSets.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      
      const memoryIncrease = peakMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseAfterGC = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Memory usage:
        Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Peak: ${(peakMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB
        After GC: ${(memoryIncreaseAfterGC / 1024 / 1024).toFixed(2)} MB`);
      
      // Memory should not increase significantly after GC
      expect(memoryIncreaseAfterGC).toBeLessThan(memoryIncrease * 0.5);
    });

    it('should handle resource cleanup efficiently', () => {
      const startTime = performanceMonitor.startMeasurement('resource_cleanup');
      
      // Simulate resource-intensive operations
      for (let i = 0; i < 100; i++) {
        const vehicles = vehicleService.getVehicles({ regionId: 'region-manila' });
        vehicles.forEach(vehicle => {
          vehicleService.getTelemetryData(vehicle.id, 10);
          vehicleService.getPerformanceData(vehicle.id, 7);
        });
        
        // Simulate cleanup
        vehicleService.clearCache();
      }
      
      const duration = performanceMonitor.endMeasurement('resource_cleanup', startTime);
      
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      console.log(`Resource cleanup operations took ${duration.toFixed(2)}ms`);
    });
  });

  // =====================================================
  // Scalability Tests
  // =====================================================

  describe('Scalability Tests', () => {
    it('should scale linearly with dataset size', () => {
      const datasetSizes = [1000, 2000, 5000, 10000];
      const performanceMetrics: Array<{ size: number; duration: number }> = [];
      
      datasetSizes.forEach(size => {
        const startTime = performanceMonitor.startMeasurement(`scale_${size}`);
        
        // Query a subset of the data
        const vehicles = vehicleService.getVehicles();
        const subset = vehicles.slice(0, size);
        
        // Perform operations on the subset
        const results = subset.map(vehicle => ({
          id: vehicle.id,
          utilizationRate: vehicle.utilizationRate,
          totalTrips: vehicle.totalTrips
        }));
        
        const duration = performanceMonitor.endMeasurement(`scale_${size}`, startTime);
        
        performanceMetrics.push({ size, duration });
        
        expect(results).toHaveLength(size);
      });
      
      // Check that performance scales reasonably
      const firstMetric = performanceMetrics[0];
      const lastMetric = performanceMetrics[performanceMetrics.length - 1];
      const scaleFactor = lastMetric.size / firstMetric.size;
      const performanceRatio = lastMetric.duration / firstMetric.duration;
      
      console.log('Scalability metrics:', performanceMetrics);
      console.log(`Scale factor: ${scaleFactor}x, Performance ratio: ${performanceRatio.toFixed(2)}x`);
      
      // Performance should not degrade more than 2x relative to scale factor
      expect(performanceRatio).toBeLessThan(scaleFactor * 2);
    });

    it('should handle gradual dataset growth efficiently', () => {
      const growthSteps = 10;
      const stepSize = 1000;
      
      for (let step = 1; step <= growthSteps; step++) {
        const currentSize = step * stepSize;
        
        const startTime = performanceMonitor.startMeasurement('growth_step');
        
        const vehicles = vehicleService.getVehicles();
        const subset = vehicles.slice(0, currentSize);
        
        // Perform typical operations
        const activeVehicles = subset.filter(v => v.status === 'active');
        const avgUtilization = activeVehicles.reduce((sum, v) => sum + v.utilizationRate, 0) / activeVehicles.length;
        
        const duration = performanceMonitor.endMeasurement('growth_step', startTime);
        
        expect(activeVehicles.length).toBeGreaterThan(0);
        expect(avgUtilization).toBeGreaterThan(0);
        expect(duration).toBeLessThan(1000); // Each step should complete within 1 second
      }
      
      const stats = performanceMonitor.getStats('growth_step');
      console.log(`Dataset growth performance:`, stats);
    });
  });

  // =====================================================
  // Response Time SLA Tests
  // =====================================================

  describe('Response Time SLA Tests', () => {
    it('should meet SLA requirements for vehicle queries', () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performanceMonitor.startMeasurement('sla_query');
        
        const vehicles = vehicleService.getVehicles({ status: 'active' });
        
        const duration = performanceMonitor.endMeasurement('sla_query', startTime);
        
        // Each query should meet SLA of 500ms
        expect(duration).toBeLessThan(500);
        expect(vehicles.length).toBeGreaterThan(0);
      }
      
      const stats = performanceMonitor.getStats('sla_query');
      
      console.log(`SLA Query Performance:
        Average: ${stats.average.toFixed(2)}ms
        95th percentile: ${stats.p95.toFixed(2)}ms
        99th percentile: ${stats.p99.toFixed(2)}ms
        Max: ${stats.max.toFixed(2)}ms`);
      
      // 95% of requests should complete within 300ms
      expect(stats.p95).toBeLessThan(300);
      
      // 99% of requests should complete within 400ms
      expect(stats.p99).toBeLessThan(400);
    });

    it('should meet SLA requirements for individual vehicle lookups', () => {
      const iterations = 200;
      
      for (let i = 0; i < iterations; i++) {
        const vehicleId = `veh-${((i % 10000) + 1).toString().padStart(5, '0')}`;
        
        const startTime = performanceMonitor.startMeasurement('sla_lookup');
        
        const vehicle = vehicleService.getVehicleById(vehicleId);
        
        const duration = performanceMonitor.endMeasurement('sla_lookup', startTime);
        
        // Each lookup should meet SLA of 50ms
        expect(duration).toBeLessThan(50);
        expect(vehicle).toBeTruthy();
      }
      
      const stats = performanceMonitor.getStats('sla_lookup');
      
      console.log(`SLA Lookup Performance:
        Average: ${stats.average.toFixed(2)}ms
        95th percentile: ${stats.p95.toFixed(2)}ms
        99th percentile: ${stats.p99.toFixed(2)}ms
        Max: ${stats.max.toFixed(2)}ms`);
      
      // 95% of lookups should complete within 30ms
      expect(stats.p95).toBeLessThan(30);
      
      // 99% of lookups should complete within 40ms
      expect(stats.p99).toBeLessThan(40);
    });
  });

  // =====================================================
  // Load Testing Simulation
  // =====================================================

  describe('Load Testing Simulation', () => {
    it('should handle peak load simulation', async () => {
      const peakConcurrency = 100;
      const testDuration = 5000; // 5 seconds
      const requestsPerSecond = 20;
      
      let totalRequests = 0;
      let successfulRequests = 0;
      let failedRequests = 0;
      
      const startTime = Date.now();
      const endTime = startTime + testDuration;
      
      const workers: Promise<void>[] = [];
      
      for (let worker = 0; worker < peakConcurrency; worker++) {
        workers.push(
          (async () => {
            while (Date.now() < endTime) {
              try {
                totalRequests++;
                
                const operationType = totalRequests % 3;
                
                if (operationType === 0) {
                  // Query operation
                  const vehicles = vehicleService.getVehicles({ status: 'active' });
                  expect(vehicles.length).toBeGreaterThan(0);
                } else if (operationType === 1) {
                  // Lookup operation
                  const vehicleId = `veh-${((totalRequests % 10000) + 1).toString().padStart(5, '0')}`;
                  const vehicle = vehicleService.getVehicleById(vehicleId);
                  expect(vehicle).toBeTruthy();
                } else {
                  // Telemetry operation
                  const vehicleId = `veh-${(((totalRequests % 5000) + 1) * 2).toString().padStart(5, '0')}`;
                  const telemetry = vehicleService.getTelemetryData(vehicleId, 10);
                  expect(telemetry.length).toBeGreaterThan(0);
                }
                
                successfulRequests++;
                
                // Simulate request rate limiting
                await new Promise(resolve => 
                  setTimeout(resolve, 1000 / requestsPerSecond)
                );
                
              } catch (error) {
                failedRequests++;
              }
            }
          })()
        );
      }
      
      await Promise.all(workers);
      
      const actualDuration = Date.now() - startTime;
      const successRate = (successfulRequests / totalRequests) * 100;
      const avgRequestsPerSecond = totalRequests / (actualDuration / 1000);
      
      console.log(`Load Test Results:
        Duration: ${actualDuration}ms
        Total Requests: ${totalRequests}
        Successful: ${successfulRequests}
        Failed: ${failedRequests}
        Success Rate: ${successRate.toFixed(2)}%
        Avg RPS: ${avgRequestsPerSecond.toFixed(2)}`);
      
      // Success rate should be above 95%
      expect(successRate).toBeGreaterThan(95);
      
      // Should handle at least 1000 requests per second
      expect(avgRequestsPerSecond).toBeGreaterThan(1000);
    });
  });
});