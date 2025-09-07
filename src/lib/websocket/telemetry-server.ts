// WebSocket Server for Real-time Telemetry Updates
// Handles real-time streaming of vehicle telemetry data to connected clients

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { VehicleTelemetryData, VehicleDiagnosticEvent } from '@/types/vehicles';
import TelemetryDataCollector from '@/lib/telemetry/data-collector';
import OBDDeviceManager from '@/lib/obd/device-manager';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';

export interface TelemetryClient {
  id: string;
  socket: WebSocket;
  userId: string;
  subscribedVehicles: Set<string>;
  subscribedDataTypes: Set<string>;
  connectedAt: Date;
  lastActivity: Date;
  permissions: string[];
}

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'request' | 'ping' | 'auth';
  payload: any;
  messageId?: string;
  timestamp?: Date;
}

export interface TelemetryBroadcast {
  type: 'telemetry' | 'diagnostic' | 'alert' | 'device_status' | 'system' | 'pong';
  vehicleId?: string;
  deviceId?: string;
  data: any;
  timestamp: Date;
  messageId: string;
}

export interface SubscriptionFilter {
  vehicleIds?: string[];
  dataTypes?: string[];
  updateFrequency?: number; // milliseconds
  qualityThreshold?: number; // minimum data quality
}

export class TelemetryWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, TelemetryClient> = new Map();
  private telemetryCollector: TelemetryDataCollector;
  private deviceManager: OBDDeviceManager;
  private broadcastInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });
    this.telemetryCollector = TelemetryDataCollector.getInstance();
    this.deviceManager = OBDDeviceManager.getInstance();
    
    this.initializeServer();
    this.startBroadcastService();
    this.startHeartbeat();
  }

  private initializeServer(): void {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    this.wss.on('error', (error: Error) => {
      console.error('WebSocket server error:', error);
      auditLogger.logEvent(
        AuditEventType.SYSTEM_ERROR,
        SecurityLevel.HIGH,
        'FAILURE',
        {
          action: 'websocket_server_error',
          error: error.message
        },
        {
          userId: 'system',
          resource: 'websocket',
          action: 'server_error',
          ipAddress: 'internal'
        }
      );
    });

    console.log(`Telemetry WebSocket server listening on port ${this.wss.options.port}`);
  }

  private async handleConnection(ws: WebSocket, request: IncomingMessage): Promise<void> {
    const clientId = this.generateClientId();
    const clientIP = request.socket.remoteAddress || 'unknown';

    // Create client record (will be updated after authentication)
    const client: TelemetryClient = {
      id: clientId,
      socket: ws,
      userId: 'unauthenticated',
      subscribedVehicles: new Set(),
      subscribedDataTypes: new Set(),
      connectedAt: new Date(),
      lastActivity: new Date(),
      permissions: []
    };

    this.clients.set(clientId, client);

    // Set up event handlers
    ws.on('message', (data: string) => {
      this.handleMessage(clientId, data);
    });

    ws.on('close', (code: number, reason: Buffer) => {
      this.handleDisconnection(clientId, code, reason.toString());
    });

    ws.on('error', (error: Error) => {
      console.error(`WebSocket client error (${clientId}):`, error);
      this.handleClientError(clientId, error);
    });

    // Send welcome message
    this.sendMessage(client, {
      type: 'system',
      data: {
        message: 'Connected to Xpress Ops Tower Telemetry Service',
        clientId,
        serverTime: new Date(),
        authRequired: true
      },
      timestamp: new Date(),
      messageId: this.generateMessageId()
    });

    // Log connection
    await auditLogger.logEvent(
      AuditEventType.SESSION_START,
      SecurityLevel.LOW,
      'SUCCESS',
      {
        action: 'websocket_client_connected',
        clientId,
        clientIP
      },
      {
        userId: 'unauthenticated',
        resource: 'websocket',
        action: 'connect',
        ipAddress: clientIP
      }
    );
  }

  private async handleMessage(clientId: string, data: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message: WebSocketMessage = JSON.parse(data);
      client.lastActivity = new Date();

      switch (message.type) {
        case 'auth':
          await this.handleAuthentication(client, message);
          break;
        case 'subscribe':
          await this.handleSubscription(client, message);
          break;
        case 'unsubscribe':
          await this.handleUnsubscription(client, message);
          break;
        case 'request':
          await this.handleDataRequest(client, message);
          break;
        case 'ping':
          await this.handlePing(client, message);
          break;
        default:
          this.sendError(client, `Unknown message type: ${message.type}`, message.messageId);
      }
    } catch (error) {
      console.error(`Error handling message from client ${clientId}:`, error);
      this.sendError(client, 'Invalid message format', undefined);
    }
  }

  private async handleAuthentication(client: TelemetryClient, message: WebSocketMessage): Promise<void> {
    try {
      const { token, userId } = message.payload;
      
      // In a real implementation, validate the JWT token
      // For now, we'll simulate authentication
      const isValid = await this.validateAuthToken(token, userId);
      
      if (isValid) {
        client.userId = userId;
        client.permissions = await this.getUserPermissions(userId);
        
        this.sendMessage(client, {
          type: 'system',
          data: {
            authenticated: true,
            userId,
            permissions: client.permissions,
            message: 'Authentication successful'
          },
          timestamp: new Date(),
          messageId: this.generateMessageId()
        });

        // Log successful authentication
        await auditLogger.logEvent(
          AuditEventType.LOGIN,
          SecurityLevel.LOW,
          'SUCCESS',
          {
            action: 'websocket_authentication',
            clientId: client.id,
            userId
          },
          {
            userId,
            resource: 'websocket',
            action: 'authenticate',
            ipAddress: 'websocket_client'
          }
        );
      } else {
        this.sendError(client, 'Authentication failed', message.messageId);
        client.socket.close(1008, 'Authentication failed');
      }
    } catch (error) {
      this.sendError(client, 'Authentication error', message.messageId);
    }
  }

  private async handleSubscription(client: TelemetryClient, message: WebSocketMessage): Promise<void> {
    if (client.userId === 'unauthenticated') {
      this.sendError(client, 'Authentication required', message.messageId);
      return;
    }

    try {
      const { vehicleIds, dataTypes, filter } = message.payload as {
        vehicleIds: string[],
        dataTypes: string[],
        filter?: SubscriptionFilter
      };

      // Check permissions for each vehicle
      for (const vehicleId of vehicleIds || []) {
        if (!await this.checkVehicleAccess(client.userId, vehicleId)) {
          this.sendError(client, `Access denied for vehicle ${vehicleId}`, message.messageId);
          return;
        }
        client.subscribedVehicles.add(vehicleId);
      }

      // Add data type subscriptions
      for (const dataType of dataTypes || []) {
        if (this.isValidDataType(dataType)) {
          client.subscribedDataTypes.add(dataType);
        }
      }

      this.sendMessage(client, {
        type: 'system',
        data: {
          subscribed: true,
          vehicleIds: Array.from(client.subscribedVehicles),
          dataTypes: Array.from(client.subscribedDataTypes),
          message: 'Subscription successful'
        },
        timestamp: new Date(),
        messageId: this.generateMessageId()
      });

      // Log subscription
      await auditLogger.logEvent(
        AuditEventType.DATA_ACCESS,
        SecurityLevel.LOW,
        'SUCCESS',
        {
          action: 'websocket_subscription',
          clientId: client.id,
          vehicleIds,
          dataTypes
        },
        {
          userId: client.userId,
          resource: 'telemetry',
          action: 'subscribe',
          ipAddress: 'websocket_client'
        }
      );
    } catch (error) {
      this.sendError(client, 'Subscription failed', message.messageId);
    }
  }

  private async handleUnsubscription(client: TelemetryClient, message: WebSocketMessage): Promise<void> {
    try {
      const { vehicleIds, dataTypes } = message.payload;

      // Remove vehicle subscriptions
      for (const vehicleId of vehicleIds || []) {
        client.subscribedVehicles.delete(vehicleId);
      }

      // Remove data type subscriptions
      for (const dataType of dataTypes || []) {
        client.subscribedDataTypes.delete(dataType);
      }

      this.sendMessage(client, {
        type: 'system',
        data: {
          unsubscribed: true,
          message: 'Unsubscription successful'
        },
        timestamp: new Date(),
        messageId: this.generateMessageId()
      });
    } catch (error) {
      this.sendError(client, 'Unsubscription failed', message.messageId);
    }
  }

  private async handleDataRequest(client: TelemetryClient, message: WebSocketMessage): Promise<void> {
    if (client.userId === 'unauthenticated') {
      this.sendError(client, 'Authentication required', message.messageId);
      return;
    }

    try {
      const { requestType, vehicleId, timeRange } = message.payload;

      if (!await this.checkVehicleAccess(client.userId, vehicleId)) {
        this.sendError(client, `Access denied for vehicle ${vehicleId}`, message.messageId);
        return;
      }

      let responseData: any = null;

      switch (requestType) {
        case 'latest_telemetry':
          responseData = await this.getLatestTelemetry(vehicleId);
          break;
        case 'device_status':
          responseData = await this.getDeviceStatus(vehicleId);
          break;
        case 'historical_data':
          responseData = await this.getHistoricalData(vehicleId, timeRange);
          break;
        default:
          this.sendError(client, `Unknown request type: ${requestType}`, message.messageId);
          return;
      }

      this.sendMessage(client, {
        type: 'response',
        vehicleId,
        data: responseData,
        timestamp: new Date(),
        messageId: message.messageId || this.generateMessageId()
      });
    } catch (error) {
      this.sendError(client, 'Data request failed', message.messageId);
    }
  }

  private async handlePing(client: TelemetryClient, message: WebSocketMessage): Promise<void> {
    this.sendMessage(client, {
      type: 'pong',
      data: { timestamp: new Date() },
      timestamp: new Date(),
      messageId: message.messageId || this.generateMessageId()
    });
  }

  private handleDisconnection(clientId: string, code: number, reason: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      auditLogger.logEvent(
        AuditEventType.SESSION_END,
        SecurityLevel.LOW,
        'SUCCESS',
        {
          action: 'websocket_client_disconnected',
          clientId,
          userId: client.userId,
          code,
          reason
        },
        {
          userId: client.userId,
          resource: 'websocket',
          action: 'disconnect',
          ipAddress: 'websocket_client'
        }
      );
    }
    
    this.clients.delete(clientId);
    console.log(`Client ${clientId} disconnected: ${code} - ${reason}`);
  }

  private handleClientError(clientId: string, error: Error): void {
    console.error(`Client ${clientId} error:`, error);
    auditLogger.logEvent(
      AuditEventType.SYSTEM_ERROR,
      SecurityLevel.MEDIUM,
      'FAILURE',
      {
        action: 'websocket_client_error',
        clientId,
        error: error.message
      },
      {
        userId: 'system',
        resource: 'websocket',
        action: 'client_error',
        ipAddress: 'websocket_client'
      }
    );
  }

  // Broadcasting methods
  private startBroadcastService(): void {
    // Broadcast telemetry data every 5 seconds
    this.broadcastInterval = setInterval(() => {
      this.broadcastTelemetryUpdates();
    }, 5000);

    console.log('Telemetry broadcast service started');
  }

  private async broadcastTelemetryUpdates(): Promise<void> {
    if (this.clients.size === 0) return;

    // Get all subscribed vehicles
    const subscribedVehicles = new Set<string>();
    for (const client of this.clients.values()) {
      for (const vehicleId of client.subscribedVehicles) {
        subscribedVehicles.add(vehicleId);
      }
    }

    // Generate mock real-time data for subscribed vehicles
    for (const vehicleId of subscribedVehicles) {
      const telemetryData = await this.generateMockTelemetryData(vehicleId);
      
      if (telemetryData) {
        this.broadcastToSubscribers('telemetry', vehicleId, telemetryData);
      }
    }
  }

  public broadcastTelemetryData(data: VehicleTelemetryData): void {
    this.broadcastToSubscribers('telemetry', data.vehicleId, data);
  }

  public broadcastDiagnosticEvent(event: VehicleDiagnosticEvent): void {
    this.broadcastToSubscribers('diagnostic', event.vehicleId, event);
  }

  public broadcastDeviceStatusUpdate(deviceId: string, vehicleId: string, status: any): void {
    this.broadcastToSubscribers('device_status', vehicleId, { deviceId, status });
  }

  public broadcastAlert(vehicleId: string, alert: any): void {
    this.broadcastToSubscribers('alert', vehicleId, alert);
  }

  private broadcastToSubscribers(type: string, vehicleId: string, data: any): void {
    const broadcast: TelemetryBroadcast = {
      type: type as any,
      vehicleId,
      data,
      timestamp: new Date(),
      messageId: this.generateMessageId()
    };

    for (const client of this.clients.values()) {
      if (client.subscribedVehicles.has(vehicleId) && 
          (client.subscribedDataTypes.has(type) || client.subscribedDataTypes.size === 0)) {
        this.sendMessage(client, broadcast);
      }
    }
  }

  // Heartbeat and connection management
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, 30000); // Every 30 seconds
  }

  private performHeartbeat(): void {
    const now = new Date();
    const timeout = 60000; // 1 minute timeout

    for (const [clientId, client] of this.clients.entries()) {
      const timeSinceActivity = now.getTime() - client.lastActivity.getTime();
      
      if (timeSinceActivity > timeout) {
        console.log(`Client ${clientId} timed out, closing connection`);
        client.socket.close(1000, 'Connection timeout');
        this.clients.delete(clientId);
      }
    }
  }

  // Helper methods
  private sendMessage(client: TelemetryClient, message: TelemetryBroadcast | any): void {
    if (client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Failed to send message to client ${client.id}:`, error);
      }
    }
  }

  private sendError(client: TelemetryClient, error: string, messageId?: string): void {
    this.sendMessage(client, {
      type: 'error',
      data: { error, messageId },
      timestamp: new Date(),
      messageId: this.generateMessageId()
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Authentication and authorization methods
  private async validateAuthToken(token: string, userId: string): Promise<boolean> {
    // In a real implementation, validate JWT token
    // For now, simulate validation
    return token && userId && token.length > 10;
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    // In a real implementation, fetch from database
    return ['view_vehicle_telemetry', 'view_live_data', 'view_diagnostics'];
  }

  private async checkVehicleAccess(userId: string, vehicleId: string): Promise<boolean> {
    // In a real implementation, check user permissions for specific vehicle
    return true;
  }

  private isValidDataType(dataType: string): boolean {
    const validTypes = ['telemetry', 'diagnostic', 'alert', 'device_status', 'system'];
    return validTypes.includes(dataType);
  }

  // Data retrieval methods
  private async getLatestTelemetry(vehicleId: string): Promise<any> {
    // Get latest telemetry data for vehicle
    const bufferedData = this.telemetryCollector.getBufferedData(vehicleId);
    return bufferedData.slice(-1)[0] || null;
  }

  private async getDeviceStatus(vehicleId: string): Promise<any> {
    const devices = await this.deviceManager.getDevicesByVehicle(vehicleId);
    const deviceStatuses = [];

    for (const device of devices) {
      const health = await this.deviceManager.getDeviceHealth(device.id);
      deviceStatuses.push({
        deviceId: device.id,
        status: device.status,
        health
      });
    }

    return deviceStatuses;
  }

  private async getHistoricalData(vehicleId: string, timeRange: any): Promise<any> {
    // In a real implementation, query database for historical data
    return { message: 'Historical data feature not implemented yet' };
  }

  private async generateMockTelemetryData(vehicleId: string): Promise<VehicleTelemetryData | null> {
    // Generate mock real-time telemetry data
    const now = new Date();
    
    return {
      id: `telem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vehicleId,
      deviceId: `obd_${vehicleId}`,
      location: {
        latitude: 14.5995 + (Math.random() - 0.5) * 0.01,
        longitude: 120.9842 + (Math.random() - 0.5) * 0.01
      },
      speedKmh: Math.random() * 60,
      heading: Math.floor(Math.random() * 360),
      altitudeMeters: 50 + Math.random() * 100,
      gpsAccuracyMeters: 3 + Math.random() * 2,
      engineRpm: 800 + Math.random() * 3000,
      engineLoadPercent: Math.random() * 80,
      throttlePositionPercent: Math.random() * 60,
      engineTemperatureCelsius: 85 + Math.random() * 15,
      coolantTemperatureCelsius: 82 + Math.random() * 12,
      fuelLevelPercent: 30 + Math.random() * 60,
      instantaneousFuelConsumptionLph: 2 + Math.random() * 8,
      fuelTrimPercent: -5 + Math.random() * 10,
      batteryVoltage: 12.0 + Math.random() * 2,
      oilPressureKpa: 250 + Math.random() * 150,
      intakeAirTemperatureCelsius: 25 + Math.random() * 15,
      massAirFlowGps: 5 + Math.random() * 10,
      harshAccelerationCount: 0,
      harshBrakingCount: 0,
      harshCorneringCount: 0,
      idleTimeMinutes: 0,
      ambientTemperatureCelsius: 28 + Math.random() * 8,
      humidityPercent: 60 + Math.random() * 30,
      barometricPressureKpa: 100 + Math.random() * 3,
      activeDtcCodes: [],
      pendingDtcCodes: [],
      dataQualityScore: 0.95 + Math.random() * 0.05,
      dataSource: 'obd',
      recordedAt: now,
      receivedAt: new Date(now.getTime() + 1000),
      recordedDate: new Date(now.toDateString())
    };
  }

  // Server management
  public getConnectedClients(): TelemetryClient[] {
    return Array.from(this.clients.values());
  }

  public getClientCount(): number {
    return this.clients.size;
  }

  public close(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.wss.close();
    console.log('Telemetry WebSocket server closed');
  }
}

export default TelemetryWebSocketServer;