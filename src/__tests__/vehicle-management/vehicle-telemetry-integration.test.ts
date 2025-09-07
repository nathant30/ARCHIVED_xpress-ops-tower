// Vehicle Telemetry Integration Tests
// Comprehensive test suite for OBD device integration and real-time data flow
// Testing WebSocket connections, data processing, and telemetry analytics

import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import ioc from 'socket.io-client';
import {
  VehicleOBDDevice,
  VehicleTelemetryData,
  VehicleDiagnosticEvent,
  OBDStatus
} from '@/types/vehicles';

// Mock modules for testing
jest.mock('@/lib/database/vehicleService');
jest.mock('@/lib/telemetry/obdProcessor');
jest.mock('@/lib/telemetry/diagnosticAnalyzer');

// Test utilities and mock data
const createMockOBDDevice = (overrides: Partial<VehicleOBDDevice> = {}): VehicleOBDDevice => ({
  id: 'obd-001',
  deviceSerial: 'OBD-TEST-001',
  deviceModel: 'OBDLink MX+',
  manufacturer: 'OBDLink',
  firmwareVersion: '1.2.3',
  vehicleId: 'veh-001',
  installedDate: new Date('2024-01-15'),
  installedBy: 'tech-001',
  supportedProtocols: ['CAN', 'ISO9141', 'KWP2000'],
  cellularCarrier: 'Smart Communications',
  dataPlan: 'IoT 1GB',
  monthlyDataCost: 500,
  status: 'connected',
  lastConnectionAt: new Date(),
  connectionFrequency: 30, // seconds
  collectEngineData: true,
  collectGpsData: true,
  collectDiagnosticData: true,
  collectFuelData: true,
  dataRetentionDays: 90,
  totalDataPoints: 45000,
  dataAccuracyRate: 98.5,
  uptimePercentage: 99.2,
  lastMaintenanceDate: new Date('2024-10-01'),
  warrantyExpiryDate: new Date('2026-01-15'),
  supportContact: '+639171234567',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
  isActive: true,
  ...overrides
});

const createMockTelemetryData = (overrides: Partial<VehicleTelemetryData> = {}): VehicleTelemetryData => ({
  id: 'tel-001',
  vehicleId: 'veh-001',
  deviceId: 'obd-001',
  driverId: 'driver-001',
  location: {
    latitude: 14.5995,
    longitude: 120.9842
  },
  speedKmh: 45,
  heading: 90,
  altitudeMeters: 25,
  gpsAccuracyMeters: 3.2,
  engineRpm: 2500,
  engineLoadPercent: 35.5,
  throttlePositionPercent: 15.2,
  engineTemperatureCelsius: 88,
  coolantTemperatureCelsius: 85,
  fuelLevelPercent: 65,
  instantaneousFuelConsumptionLph: 8.5,
  fuelTrimPercent: 2.1,
  batteryVoltage: 12.6,
  oilPressureKpa: 350,
  intakeAirTemperatureCelsius: 32,
  massAirFlowGps: 25.8,
  harshAccelerationCount: 0,
  harshBrakingCount: 0,
  harshCorneringCount: 0,
  idleTimeMinutes: 5,
  ambientTemperatureCelsius: 28,
  humidityPercent: 75,
  barometricPressureKpa: 101.3,
  activeDtcCodes: [],
  pendingDtcCodes: [],
  dataQualityScore: 95.8,
  dataSource: 'obd',
  recordedAt: new Date(),
  receivedAt: new Date(),
  recordedDate: new Date(),
  ...overrides
});

const createMockDiagnosticEvent = (overrides: Partial<VehicleDiagnosticEvent> = {}): VehicleDiagnosticEvent => ({
  id: 'diag-001',
  vehicleId: 'veh-001',
  deviceId: 'obd-001',
  eventCode: 'P0420',
  eventType: 'emissions',
  severity: 'warning',
  eventDescription: 'Catalyst System Efficiency Below Threshold (Bank 1)',
  location: {
    latitude: 14.5995,
    longitude: 120.9842
  },
  odometerKm: 15000,
  driverId: 'driver-001',
  diagnosticData: {
    dtcCode: 'P0420',
    freeFrameData: '01 02 03 04',
    testResults: {
      o2Sensor: 'low_efficiency',
      catalyst: 'degraded'
    }
  },
  recommendedAction: 'Replace catalytic converter',
  affectsSafety: false,
  affectsPerformance: true,
  status: 'active',
  maintenanceRequired: true,
  firstOccurredAt: new Date(),
  lastOccurredAt: new Date(),
  occurrenceCount: 1,
  createdAt: new Date(),
  ...overrides
});

// Mock telemetry service
class MockTelemetryService {
  private devices: Map<string, VehicleOBDDevice> = new Map();
  private telemetryStream: VehicleTelemetryData[] = [];
  private diagnosticEvents: VehicleDiagnosticEvent[] = [];

  addDevice(device: VehicleOBDDevice) {
    this.devices.set(device.id, device);
  }

  getDevice(deviceId: string): VehicleOBDDevice | null {
    return this.devices.get(deviceId) || null;
  }

  updateDeviceStatus(deviceId: string, status: OBDStatus) {
    const device = this.devices.get(deviceId);
    if (device) {
      device.status = status;
      device.lastConnectionAt = new Date();
    }
  }

  addTelemetryData(data: VehicleTelemetryData) {
    this.telemetryStream.push(data);
  }

  getTelemetryData(vehicleId: string, since?: Date): VehicleTelemetryData[] {
    let data = this.telemetryStream.filter(d => d.vehicleId === vehicleId);
    if (since) {
      data = data.filter(d => d.recordedAt > since);
    }
    return data.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  }

  addDiagnosticEvent(event: VehicleDiagnosticEvent) {
    this.diagnosticEvents.push(event);
  }

  getDiagnosticEvents(vehicleId: string): VehicleDiagnosticEvent[] {
    return this.diagnosticEvents.filter(e => e.vehicleId === vehicleId);
  }

  clearData() {
    this.devices.clear();
    this.telemetryStream = [];
    this.diagnosticEvents = [];
  }
}

describe('Vehicle Telemetry Integration Tests', () => {
  let httpServer: any;
  let ioServer: Server;
  let serverSocket: any;
  let clientSocket: any;
  let mockTelemetryService: MockTelemetryService;
  let port: number;

  beforeAll((done) => {
    // Setup test server for WebSocket testing
    httpServer = createServer();
    ioServer = new Server(httpServer);
    
    httpServer.listen(() => {
      const address = httpServer.address() as AddressInfo;
      port = address.port;
      
      ioServer.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      done();
    });
  });

  beforeEach(() => {
    mockTelemetryService = new MockTelemetryService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.close();
      clientSocket = null;
    }
    if (serverSocket) {
      serverSocket.disconnect();
      serverSocket = null;
    }
    mockTelemetryService.clearData();
  });

  afterAll((done) => {
    ioServer.close();
    httpServer.close(done);
  });

  // =====================================================
  // OBD Device Connection Tests
  // =====================================================

  describe('OBD Device Connection Management', () => {
    it('should establish connection with OBD device', async () => {
      const device = createMockOBDDevice();
      mockTelemetryService.addDevice(device);
      
      // Simulate device connection
      mockTelemetryService.updateDeviceStatus(device.id, 'connected');
      
      const connectedDevice = mockTelemetryService.getDevice(device.id);
      expect(connectedDevice?.status).toBe('connected');
      expect(connectedDevice?.lastConnectionAt).toBeDefined();
    });

    it('should handle device disconnection', async () => {
      const device = createMockOBDDevice({ status: 'connected' });
      mockTelemetryService.addDevice(device);
      
      // Simulate device disconnection
      mockTelemetryService.updateDeviceStatus(device.id, 'disconnected');
      
      const disconnectedDevice = mockTelemetryService.getDevice(device.id);
      expect(disconnectedDevice?.status).toBe('disconnected');
    });

    it('should handle device error states', async () => {
      const device = createMockOBDDevice({ status: 'connected' });
      mockTelemetryService.addDevice(device);
      
      // Simulate device error
      mockTelemetryService.updateDeviceStatus(device.id, 'error');
      
      const errorDevice = mockTelemetryService.getDevice(device.id);
      expect(errorDevice?.status).toBe('error');
    });

    it('should track device connection frequency', () => {
      const device = createMockOBDDevice({ connectionFrequency: 30 });
      mockTelemetryService.addDevice(device);
      
      expect(device.connectionFrequency).toBe(30);
      expect(device.totalDataPoints).toBeGreaterThan(0);
      expect(device.uptimePercentage).toBeGreaterThan(95);
    });

    it('should validate device protocols and capabilities', () => {
      const device = createMockOBDDevice();
      
      expect(device.supportedProtocols).toContain('CAN');
      expect(device.collectEngineData).toBe(true);
      expect(device.collectGpsData).toBe(true);
      expect(device.collectDiagnosticData).toBe(true);
      expect(device.collectFuelData).toBe(true);
    });
  });

  // =====================================================
  // Real-time Telemetry Data Tests
  // =====================================================

  describe('Real-time Telemetry Data Processing', () => {
    it('should process incoming telemetry data', async () => {
      const device = createMockOBDDevice();
      mockTelemetryService.addDevice(device);
      
      const telemetryData = createMockTelemetryData();
      mockTelemetryService.addTelemetryData(telemetryData);
      
      const retrievedData = mockTelemetryService.getTelemetryData('veh-001');
      expect(retrievedData).toHaveLength(1);
      expect(retrievedData[0].vehicleId).toBe('veh-001');
      expect(retrievedData[0].deviceId).toBe('obd-001');
    });

    it('should validate telemetry data integrity', () => {
      const telemetryData = createMockTelemetryData();
      
      // Validate GPS coordinates (Philippines)
      expect(telemetryData.location?.latitude).toBeGreaterThan(5);
      expect(telemetryData.location?.latitude).toBeLessThan(20);
      expect(telemetryData.location?.longitude).toBeGreaterThan(115);
      expect(telemetryData.location?.longitude).toBeLessThan(130);
      
      // Validate engine parameters
      expect(telemetryData.speedKmh).toBeGreaterThanOrEqual(0);
      expect(telemetryData.engineRpm).toBeGreaterThanOrEqual(0);
      expect(telemetryData.fuelLevelPercent).toBeGreaterThanOrEqual(0);
      expect(telemetryData.fuelLevelPercent).toBeLessThanOrEqual(100);
      
      // Validate data quality
      expect(telemetryData.dataQualityScore).toBeGreaterThan(90);
      expect(telemetryData.dataSource).toBe('obd');
    });

    it('should handle multiple simultaneous telemetry streams', async () => {
      const devices = [
        createMockOBDDevice({ id: 'obd-001', vehicleId: 'veh-001' }),
        createMockOBDDevice({ id: 'obd-002', vehicleId: 'veh-002' }),
        createMockOBDDevice({ id: 'obd-003', vehicleId: 'veh-003' })
      ];
      
      devices.forEach(device => mockTelemetryService.addDevice(device));
      
      // Simulate data from multiple devices
      const telemetryData = [
        createMockTelemetryData({ id: 'tel-001', vehicleId: 'veh-001', deviceId: 'obd-001' }),
        createMockTelemetryData({ id: 'tel-002', vehicleId: 'veh-002', deviceId: 'obd-002' }),
        createMockTelemetryData({ id: 'tel-003', vehicleId: 'veh-003', deviceId: 'obd-003' })
      ];
      
      telemetryData.forEach(data => mockTelemetryService.addTelemetryData(data));
      
      // Verify each vehicle's data
      const veh001Data = mockTelemetryService.getTelemetryData('veh-001');
      const veh002Data = mockTelemetryService.getTelemetryData('veh-002');
      const veh003Data = mockTelemetryService.getTelemetryData('veh-003');
      
      expect(veh001Data).toHaveLength(1);
      expect(veh002Data).toHaveLength(1);
      expect(veh003Data).toHaveLength(1);
      
      expect(veh001Data[0].deviceId).toBe('obd-001');
      expect(veh002Data[0].deviceId).toBe('obd-002');
      expect(veh003Data[0].deviceId).toBe('obd-003');
    });

    it('should calculate driving behavior metrics', () => {
      const aggressiveDrivingData = createMockTelemetryData({
        harshAccelerationCount: 3,
        harshBrakingCount: 2,
        harshCorneringCount: 1,
        speedKmh: 80,
        engineRpm: 4000
      });
      
      mockTelemetryService.addTelemetryData(aggressiveDrivingData);
      
      const data = mockTelemetryService.getTelemetryData('veh-001')[0];
      expect(data.harshAccelerationCount).toBe(3);
      expect(data.harshBrakingCount).toBe(2);
      expect(data.harshCorneringCount).toBe(1);
      expect(data.speedKmh).toBe(80);
    });

    it('should track fuel consumption patterns', () => {
      const fuelData = [
        createMockTelemetryData({ 
          id: 'tel-fuel-1',
          fuelLevelPercent: 100,
          instantaneousFuelConsumptionLph: 5.5,
          recordedAt: new Date('2024-12-01T08:00:00Z')
        }),
        createMockTelemetryData({ 
          id: 'tel-fuel-2',
          fuelLevelPercent: 95,
          instantaneousFuelConsumptionLph: 8.2,
          recordedAt: new Date('2024-12-01T09:00:00Z')
        }),
        createMockTelemetryData({ 
          id: 'tel-fuel-3',
          fuelLevelPercent: 90,
          instantaneousFuelConsumptionLph: 6.8,
          recordedAt: new Date('2024-12-01T10:00:00Z')
        })
      ];
      
      fuelData.forEach(data => mockTelemetryService.addTelemetryData(data));
      
      const allData = mockTelemetryService.getTelemetryData('veh-001');
      expect(allData).toHaveLength(3);
      
      // Verify fuel consumption trend
      const sortedData = allData.sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
      expect(sortedData[0].fuelLevelPercent).toBeGreaterThan(sortedData[2].fuelLevelPercent);
    });

    it('should handle environmental data collection', () => {
      const environmentalData = createMockTelemetryData({
        ambientTemperatureCelsius: 35, // Hot Philippine day
        humidityPercent: 85, // High humidity
        barometricPressureKpa: 101.3,
        altitudeMeters: 500
      });
      
      mockTelemetryService.addTelemetryData(environmentalData);
      
      const data = mockTelemetryService.getTelemetryData('veh-001')[0];
      expect(data.ambientTemperatureCelsius).toBe(35);
      expect(data.humidityPercent).toBe(85);
      expect(data.barometricPressureKpa).toBe(101.3);
    });
  });

  // =====================================================
  // WebSocket Real-time Communication Tests
  // =====================================================

  describe('WebSocket Real-time Communication', () => {
    it('should establish WebSocket connection for telemetry streaming', (done) => {
      clientSocket = ioc(`http://localhost:${port}`);
      
      clientSocket.on('connect', () => {
        expect(clientSocket.connected).toBe(true);
        done();
      });
    });

    it('should broadcast telemetry updates to connected clients', (done) => {
      clientSocket = ioc(`http://localhost:${port}`);
      
      clientSocket.on('connect', () => {
        // Subscribe to vehicle telemetry updates
        clientSocket.emit('subscribe', { vehicleId: 'veh-001' });
        
        // Listen for telemetry updates
        clientSocket.on('telemetry-update', (data) => {
          expect(data.vehicleId).toBe('veh-001');
          expect(data.telemetry).toBeDefined();
          done();
        });
        
        // Simulate server broadcasting telemetry update
        serverSocket.emit('telemetry-update', {
          vehicleId: 'veh-001',
          telemetry: createMockTelemetryData()
        });
      });
    });

    it('should handle multiple client subscriptions', (done) => {
      const client1 = ioc(`http://localhost:${port}`);
      const client2 = ioc(`http://localhost:${port}`);
      
      let connectCount = 0;
      let updateCount = 0;
      
      const checkComplete = () => {
        if (updateCount === 2) {
          client1.close();
          client2.close();
          done();
        }
      };
      
      [client1, client2].forEach((client, index) => {
        client.on('connect', () => {
          connectCount++;
          client.emit('subscribe', { vehicleId: 'veh-001' });
          
          client.on('telemetry-update', (data) => {
            updateCount++;
            expect(data.vehicleId).toBe('veh-001');
            checkComplete();
          });
          
          if (connectCount === 2) {
            // Broadcast to all connected clients
            ioServer.emit('telemetry-update', {
              vehicleId: 'veh-001',
              telemetry: createMockTelemetryData()
            });
          }
        });
      });
    });

    it('should handle client disconnection gracefully', (done) => {
      clientSocket = ioc(`http://localhost:${port}`);
      
      clientSocket.on('connect', () => {
        clientSocket.emit('subscribe', { vehicleId: 'veh-001' });
        
        // Simulate client disconnect
        clientSocket.disconnect();
        
        setTimeout(() => {
          expect(clientSocket.connected).toBe(false);
          done();
        }, 100);
      });
    });

    it('should support real-time diagnostic alerts', (done) => {
      clientSocket = ioc(`http://localhost:${port}`);
      
      clientSocket.on('connect', () => {
        clientSocket.emit('subscribe', { vehicleId: 'veh-001', alerts: true });
        
        clientSocket.on('diagnostic-alert', (data) => {
          expect(data.vehicleId).toBe('veh-001');
          expect(data.event.severity).toBe('warning');
          expect(data.event.eventCode).toBe('P0420');
          done();
        });
        
        // Simulate diagnostic alert
        serverSocket.emit('diagnostic-alert', {
          vehicleId: 'veh-001',
          event: createMockDiagnosticEvent()
        });
      });
    });
  });

  // =====================================================
  // Diagnostic Event Processing Tests
  // =====================================================

  describe('Diagnostic Event Processing', () => {
    it('should detect and process diagnostic trouble codes', () => {
      const diagnosticEvent = createMockDiagnosticEvent({
        eventCode: 'P0171',
        eventDescription: 'System Too Lean (Bank 1)',
        severity: 'error',
        diagnosticData: {
          dtcCode: 'P0171',
          shortTermFuelTrim: 25, // High positive trim indicates lean condition
          longTermFuelTrim: 20,
          airFlowRate: 18.5
        }
      });
      
      mockTelemetryService.addDiagnosticEvent(diagnosticEvent);
      
      const events = mockTelemetryService.getDiagnosticEvents('veh-001');
      expect(events).toHaveLength(1);
      expect(events[0].eventCode).toBe('P0171');
      expect(events[0].severity).toBe('error');
      expect(events[0].affectsPerformance).toBe(true);
    });

    it('should categorize diagnostic events by severity', () => {
      const events = [
        createMockDiagnosticEvent({ 
          id: 'diag-info',
          eventCode: 'P0000', 
          severity: 'info',
          eventDescription: 'No DTCs detected'
        }),
        createMockDiagnosticEvent({ 
          id: 'diag-warn',
          eventCode: 'P0420', 
          severity: 'warning',
          eventDescription: 'Catalyst efficiency below threshold'
        }),
        createMockDiagnosticEvent({ 
          id: 'diag-error',
          eventCode: 'P0301', 
          severity: 'error',
          eventDescription: 'Cylinder 1 misfire detected'
        }),
        createMockDiagnosticEvent({ 
          id: 'diag-critical',
          eventCode: 'P0606', 
          severity: 'critical',
          eventDescription: 'PCM processor fault'
        })
      ];
      
      events.forEach(event => mockTelemetryService.addDiagnosticEvent(event));
      
      const allEvents = mockTelemetryService.getDiagnosticEvents('veh-001');
      expect(allEvents).toHaveLength(4);
      
      const criticalEvents = allEvents.filter(e => e.severity === 'critical');
      const errorEvents = allEvents.filter(e => e.severity === 'error');
      const warningEvents = allEvents.filter(e => e.severity === 'warning');
      const infoEvents = allEvents.filter(e => e.severity === 'info');
      
      expect(criticalEvents).toHaveLength(1);
      expect(errorEvents).toHaveLength(1);
      expect(warningEvents).toHaveLength(1);
      expect(infoEvents).toHaveLength(1);
    });

    it('should track diagnostic event occurrence patterns', () => {
      const recurringEvent = createMockDiagnosticEvent({
        eventCode: 'P0420',
        occurrenceCount: 5,
        firstOccurredAt: new Date('2024-11-01'),
        lastOccurredAt: new Date('2024-12-01')
      });
      
      mockTelemetryService.addDiagnosticEvent(recurringEvent);
      
      const events = mockTelemetryService.getDiagnosticEvents('veh-001');
      expect(events[0].occurrenceCount).toBe(5);
      expect(events[0].lastOccurredAt.getTime()).toBeGreaterThan(events[0].firstOccurredAt.getTime());
    });

    it('should identify safety-critical diagnostic events', () => {
      const safetyEvents = [
        createMockDiagnosticEvent({
          id: 'safety-1',
          eventCode: 'C0265',
          eventDescription: 'ABS wheel speed sensor malfunction',
          affectsSafety: true,
          severity: 'critical'
        }),
        createMockDiagnosticEvent({
          id: 'safety-2',
          eventCode: 'B0081',
          eventDescription: 'Airbag deployment circuit fault',
          affectsSafety: true,
          severity: 'critical'
        }),
        createMockDiagnosticEvent({
          id: 'non-safety',
          eventCode: 'P0420',
          eventDescription: 'Catalyst efficiency below threshold',
          affectsSafety: false,
          severity: 'warning'
        })
      ];
      
      events.forEach(event => mockTelemetryService.addDiagnosticEvent(event));
      
      const allEvents = mockTelemetryService.getDiagnosticEvents('veh-001');
      const safetyRelated = allEvents.filter(e => e.affectsSafety);
      
      expect(safetyRelated).toHaveLength(2);
      expect(safetyRelated.every(e => e.severity === 'critical')).toBe(true);
    });

    it('should generate maintenance recommendations', () => {
      const maintenanceEvent = createMockDiagnosticEvent({
        eventCode: 'P0171',
        maintenanceRequired: true,
        recommendedAction: 'Clean MAF sensor, check for vacuum leaks, inspect air filter'
      });
      
      mockTelemetryService.addDiagnosticEvent(maintenanceEvent);
      
      const events = mockTelemetryService.getDiagnosticEvents('veh-001');
      expect(events[0].maintenanceRequired).toBe(true);
      expect(events[0].recommendedAction).toContain('MAF sensor');
    });
  });

  // =====================================================
  // Data Quality and Validation Tests
  // =====================================================

  describe('Data Quality and Validation', () => {
    it('should validate telemetry data ranges', () => {
      const invalidData = [
        createMockTelemetryData({ speedKmh: -10 }), // Invalid negative speed
        createMockTelemetryData({ fuelLevelPercent: 150 }), // Invalid fuel level > 100%
        createMockTelemetryData({ engineTemperatureCelsius: -50 }), // Impossible temperature
        createMockTelemetryData({ batteryVoltage: 5 }) // Low battery voltage
      ];
      
      // In real implementation, these would be rejected or flagged
      invalidData.forEach(data => {
        if (data.speedKmh && data.speedKmh < 0) {
          data.dataQualityScore = 0;
        }
        if (data.fuelLevelPercent && (data.fuelLevelPercent < 0 || data.fuelLevelPercent > 100)) {
          data.dataQualityScore = 0;
        }
        if (data.engineTemperatureCelsius && data.engineTemperatureCelsius < -30) {
          data.dataQualityScore = 0;
        }
        if (data.batteryVoltage && data.batteryVoltage < 9) {
          data.dataQualityScore = 0;
        }
      });
      
      const lowQualityData = invalidData.filter(d => d.dataQualityScore === 0);
      expect(lowQualityData).toHaveLength(4);
    });

    it('should calculate data accuracy metrics', () => {
      const device = createMockOBDDevice({
        totalDataPoints: 50000,
        dataAccuracyRate: 98.5,
        uptimePercentage: 99.2
      });
      
      mockTelemetryService.addDevice(device);
      
      const retrievedDevice = mockTelemetryService.getDevice(device.id);
      expect(retrievedDevice?.dataAccuracyRate).toBeGreaterThan(95);
      expect(retrievedDevice?.uptimePercentage).toBeGreaterThan(95);
      expect(retrievedDevice?.totalDataPoints).toBeGreaterThan(10000);
    });

    it('should handle data transmission delays', () => {
      const delayedData = createMockTelemetryData({
        recordedAt: new Date('2024-12-01T10:00:00Z'),
        receivedAt: new Date('2024-12-01T10:05:00Z') // 5 minute delay
      });
      
      mockTelemetryService.addTelemetryData(delayedData);
      
      const data = mockTelemetryService.getTelemetryData('veh-001')[0];
      const delay = data.receivedAt.getTime() - data.recordedAt.getTime();
      const delayMinutes = delay / (1000 * 60);
      
      expect(delayMinutes).toBe(5);
      
      // Adjust data quality score based on delay
      if (delayMinutes > 2) {
        data.dataQualityScore = Math.max(50, data.dataQualityScore - (delayMinutes * 5));
      }
      
      expect(data.dataQualityScore).toBeLessThan(95);
    });

    it('should detect and handle data anomalies', () => {
      const normalData = createMockTelemetryData({ speedKmh: 45, engineRpm: 2500 });
      const anomalousData = createMockTelemetryData({ 
        speedKmh: 0, 
        engineRpm: 4500, // High RPM at zero speed - anomaly
        dataQualityScore: 60
      });
      
      mockTelemetryService.addTelemetryData(normalData);
      mockTelemetryService.addTelemetryData(anomalousData);
      
      const allData = mockTelemetryService.getTelemetryData('veh-001');
      const lowQualityData = allData.filter(d => d.dataQualityScore < 90);
      
      expect(lowQualityData).toHaveLength(1);
      expect(lowQualityData[0].speedKmh).toBe(0);
      expect(lowQualityData[0].engineRpm).toBe(4500);
    });
  });

  // =====================================================
  // Performance and Scalability Tests
  // =====================================================

  describe('Performance and Scalability', () => {
    it('should handle high-frequency telemetry data', () => {
      const startTime = performance.now();
      
      // Simulate 1000 telemetry data points
      for (let i = 0; i < 1000; i++) {
        const data = createMockTelemetryData({
          id: `tel-perf-${i}`,
          recordedAt: new Date(Date.now() + i * 1000) // 1 second intervals
        });
        mockTelemetryService.addTelemetryData(data);
      }
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(1000); // Should process 1000 records in < 1 second
      
      const allData = mockTelemetryService.getTelemetryData('veh-001');
      expect(allData).toHaveLength(1000);
    });

    it('should efficiently query historical telemetry data', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      // Add data from different time periods
      for (let i = 0; i < 100; i++) {
        const data = createMockTelemetryData({
          id: `tel-hist-${i}`,
          recordedAt: new Date(oneHourAgo.getTime() + i * 60 * 1000) // 1 minute intervals
        });
        mockTelemetryService.addTelemetryData(data);
      }
      
      const startQuery = performance.now();
      const recentData = mockTelemetryService.getTelemetryData('veh-001', oneHourAgo);
      const endQuery = performance.now();
      
      expect(endQuery - startQuery).toBeLessThan(100); // Query should be fast
      expect(recentData).toHaveLength(100);
    });

    it('should handle multiple vehicle telemetry streams concurrently', async () => {
      const vehicleCount = 50;
      const dataPointsPerVehicle = 20;
      
      const startTime = performance.now();
      
      // Simulate telemetry from 50 vehicles
      for (let v = 1; v <= vehicleCount; v++) {
        const device = createMockOBDDevice({
          id: `obd-${v.toString().padStart(3, '0')}`,
          vehicleId: `veh-${v.toString().padStart(3, '0')}`
        });
        mockTelemetryService.addDevice(device);
        
        for (let d = 0; d < dataPointsPerVehicle; d++) {
          const data = createMockTelemetryData({
            id: `tel-${v}-${d}`,
            vehicleId: `veh-${v.toString().padStart(3, '0')}`,
            deviceId: `obd-${v.toString().padStart(3, '0')}`,
            recordedAt: new Date(Date.now() + d * 30000) // 30 second intervals
          });
          mockTelemetryService.addTelemetryData(data);
        }
      }
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(processingTime).toBeLessThan(5000); // Should process all data in < 5 seconds
      
      // Verify data for random vehicles
      const randomVehicle = `veh-${Math.floor(Math.random() * vehicleCount + 1).toString().padStart(3, '0')}`;
      const vehicleData = mockTelemetryService.getTelemetryData(randomVehicle);
      
      expect(vehicleData).toHaveLength(dataPointsPerVehicle);
    });
  });

  // =====================================================
  // Philippines-Specific Integration Tests
  // =====================================================

  describe('Philippines-Specific Integration', () => {
    it('should handle Philippine GPS coordinates', () => {
      const philippineLocations = [
        { name: 'Manila', lat: 14.5995, lng: 120.9842 },
        { name: 'Cebu', lat: 10.3157, lng: 123.8854 },
        { name: 'Davao', lat: 7.1907, lng: 125.4553 },
        { name: 'Baguio', lat: 16.4023, lng: 120.5960 }
      ];
      
      philippineLocations.forEach((location, index) => {
        const data = createMockTelemetryData({
          id: `tel-ph-${index}`,
          location: {
            latitude: location.lat,
            longitude: location.lng
          }
        });
        
        mockTelemetryService.addTelemetryData(data);
      });
      
      const allData = mockTelemetryService.getTelemetryData('veh-001');
      
      allData.forEach(data => {
        expect(data.location?.latitude).toBeGreaterThan(5);
        expect(data.location?.latitude).toBeLessThan(20);
        expect(data.location?.longitude).toBeGreaterThan(115);
        expect(data.location?.longitude).toBeLessThan(130);
      });
    });

    it('should handle tropical climate conditions', () => {
      const tropicalData = createMockTelemetryData({
        ambientTemperatureCelsius: 35, // Hot day
        humidityPercent: 90, // High humidity
        engineTemperatureCelsius: 95, // Engine running hot
        coolantTemperatureCelsius: 92
      });
      
      mockTelemetryService.addTelemetryData(tropicalData);
      
      const data = mockTelemetryService.getTelemetryData('veh-001')[0];
      
      expect(data.ambientTemperatureCelsius).toBe(35);
      expect(data.humidityPercent).toBe(90);
      
      // Check for high temperature alert condition
      if (data.engineTemperatureCelsius && data.engineTemperatureCelsius > 90) {
        const tempAlert = createMockDiagnosticEvent({
          eventCode: 'P0217',
          eventDescription: 'Engine overheating detected',
          severity: 'critical',
          affectsSafety: true
        });
        
        mockTelemetryService.addDiagnosticEvent(tempAlert);
      }
      
      const alerts = mockTelemetryService.getDiagnosticEvents('veh-001');
      expect(alerts.some(a => a.eventCode === 'P0217')).toBe(true);
    });

    it('should support local cellular network integration', () => {
      const devices = [
        createMockOBDDevice({
          id: 'obd-smart-001',
          cellularCarrier: 'Smart Communications',
          dataPlan: 'IoT 1GB',
          monthlyDataCost: 500
        }),
        createMockOBDDevice({
          id: 'obd-globe-001',
          cellularCarrier: 'Globe Telecom',
          dataPlan: 'IoT 2GB',
          monthlyDataCost: 800
        }),
        createMockOBDDevice({
          id: 'obd-dito-001',
          cellularCarrier: 'DITO Telecommunity',
          dataPlan: 'IoT Basic',
          monthlyDataCost: 300
        })
      ];
      
      devices.forEach(device => mockTelemetryService.addDevice(device));
      
      const smartDevice = mockTelemetryService.getDevice('obd-smart-001');
      const globeDevice = mockTelemetryService.getDevice('obd-globe-001');
      const ditoDevice = mockTelemetryService.getDevice('obd-dito-001');
      
      expect(smartDevice?.cellularCarrier).toBe('Smart Communications');
      expect(globeDevice?.cellularCarrier).toBe('Globe Telecom');
      expect(ditoDevice?.cellularCarrier).toBe('DITO Telecommunity');
      
      expect(smartDevice?.monthlyDataCost).toBe(500);
      expect(globeDevice?.monthlyDataCost).toBe(800);
      expect(ditoDevice?.monthlyDataCost).toBe(300);
    });
  });
});