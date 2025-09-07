// =====================================================
// OPERATOR WEBSOCKET EVENTS - Real-time operator updates
// Handles WebSocket events for operator performance, commission, and financial updates
// =====================================================

import { logger } from '@/lib/security/productionLogger';
import { 
  OperatorWebSocketEvent,
  PerformanceUpdateEvent,
  CommissionEarnedEvent,
  TierQualificationEvent,
  CommissionTier
} from '@/types/operators';

// WebSocket connection management (simplified - in production use Socket.IO or similar)
interface WebSocketConnection {
  id: string;
  userId: string;
  permissions: string[];
  allowedRegions: string[];
  subscriptions: string[];
}

class OperatorWebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map();
  private roomSubscriptions: Map<string, Set<string>> = new Map(); // room -> connectionIds

  // =====================================================
  // CONNECTION MANAGEMENT
  // =====================================================

  /**
   * Register a new WebSocket connection
   */
  addConnection(
    connectionId: string, 
    userId: string, 
    permissions: string[], 
    allowedRegions: string[]
  ): void {
    this.connections.set(connectionId, {
      id: connectionId,
      userId,
      permissions,
      allowedRegions,
      subscriptions: []
    });

    logger.info('WebSocket connection registered', { 
      connectionId, 
      userId, 
      permissions: permissions.length,
      regions: allowedRegions.length 
    });
  }

  /**
   * Remove WebSocket connection
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Remove from all room subscriptions
      connection.subscriptions.forEach(room => {
        this.unsubscribeFromRoom(connectionId, room);
      });
      
      this.connections.delete(connectionId);
      
      logger.info('WebSocket connection removed', { 
        connectionId, 
        userId: connection.userId 
      });
    }
  }

  /**
   * Subscribe connection to a room
   */
  subscribeToRoom(connectionId: string, room: string): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      logger.warn('Attempted to subscribe non-existent connection', { connectionId, room });
      return false;
    }

    // Validate subscription permissions
    if (!this.canSubscribeToRoom(connection, room)) {
      logger.warn('Subscription denied - insufficient permissions', { 
        connectionId, 
        room,
        userId: connection.userId,
        permissions: connection.permissions
      });
      return false;
    }

    // Add to room subscription
    if (!this.roomSubscriptions.has(room)) {
      this.roomSubscriptions.set(room, new Set());
    }
    this.roomSubscriptions.get(room)!.add(connectionId);
    
    // Add to connection subscriptions
    connection.subscriptions.push(room);

    logger.info('Subscribed to room', { connectionId, room, userId: connection.userId });
    return true;
  }

  /**
   * Unsubscribe connection from a room
   */
  unsubscribeFromRoom(connectionId: string, room: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.subscriptions = connection.subscriptions.filter(r => r !== room);
    }

    const roomConnections = this.roomSubscriptions.get(room);
    if (roomConnections) {
      roomConnections.delete(connectionId);
      if (roomConnections.size === 0) {
        this.roomSubscriptions.delete(room);
      }
    }

    logger.info('Unsubscribed from room', { connectionId, room });
  }

  // =====================================================
  // EVENT BROADCASTING
  // =====================================================

  /**
   * Broadcast operator performance update
   */
  async broadcastPerformanceUpdate(event: PerformanceUpdateEvent): Promise<void> {
    logger.info('Broadcasting performance update', { 
      operatorId: event.operator_id,
      oldScore: event.old_score,
      newScore: event.new_score,
      tierChange: event.old_tier !== event.new_tier
    });

    // Broadcast to operator-specific room
    await this.broadcastToRoom(`operator:${event.operator_id}`, event);
    
    // Broadcast to performance monitoring room
    await this.broadcastToRoom('performance:updates', event);
    
    // If tier changed, broadcast to commission room
    if (event.old_tier !== event.new_tier) {
      await this.broadcastToRoom('commission:tier-changes', event);
    }

    // Broadcast to regional rooms if applicable
    const operatorRegion = await this.getOperatorRegion(event.operator_id);
    if (operatorRegion) {
      await this.broadcastToRoom(`region:${operatorRegion}`, event);
    }
  }

  /**
   * Broadcast commission earned event
   */
  async broadcastCommissionEarned(event: CommissionEarnedEvent): Promise<void> {
    logger.info('Broadcasting commission earned', { 
      operatorId: event.operator_id,
      amount: event.amount,
      transactionId: event.transaction_id
    });

    // Broadcast to operator-specific room
    await this.broadcastToRoom(`operator:${event.operator_id}`, event);
    
    // Broadcast to financial updates room
    await this.broadcastToRoom('financial:commissions', event);
    
    // Broadcast to analytics room for real-time metrics
    await this.broadcastToRoom('analytics:revenue', event);
  }

  /**
   * Broadcast tier qualification event
   */
  async broadcastTierQualification(event: TierQualificationEvent): Promise<void> {
    logger.info('Broadcasting tier qualification', { 
      operatorId: event.operator_id,
      tier: event.tier,
      qualified: event.qualified
    });

    // Broadcast to operator-specific room
    await this.broadcastToRoom(`operator:${event.operator_id}`, event);
    
    // Broadcast to tier management room
    await this.broadcastToRoom('commission:qualifications', event);
    
    // If qualified, broadcast success; if not, broadcast improvement opportunity
    const targetRoom = event.qualified 
      ? 'tier:qualified' 
      : 'tier:improvement-needed';
    await this.broadcastToRoom(targetRoom, event);
  }

  /**
   * Broadcast generic operator event
   */
  async broadcastOperatorEvent(
    operatorId: string, 
    eventType: string, 
    data: any
  ): Promise<void> {
    const event = {
      type: eventType,
      operator_id: operatorId,
      data,
      timestamp: new Date().toISOString()
    };

    logger.info('Broadcasting operator event', { 
      operatorId, 
      eventType,
      dataKeys: Object.keys(data)
    });

    // Broadcast to operator-specific room
    await this.broadcastToRoom(`operator:${operatorId}`, event);
    
    // Broadcast to general events room
    await this.broadcastToRoom('operators:events', event);
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  /**
   * Broadcast event to a specific room
   */
  private async broadcastToRoom(room: string, event: any): Promise<void> {
    const connections = this.roomSubscriptions.get(room);
    if (!connections || connections.size === 0) {
      logger.debug('No subscribers for room', { room });
      return;
    }

    const promises: Promise<void>[] = [];
    
    for (const connectionId of connections) {
      const connection = this.connections.get(connectionId);
      if (connection) {
        // Additional permission check before sending
        if (this.canReceiveEvent(connection, event)) {
          promises.push(this.sendToConnection(connectionId, event));
        }
      }
    }

    await Promise.allSettled(promises);
    
    logger.debug('Event broadcasted to room', { 
      room, 
      eventType: event.type,
      subscriberCount: connections.size 
    });
  }

  /**
   * Send event to specific connection
   */
  private async sendToConnection(connectionId: string, event: any): Promise<void> {
    try {
      // In production, this would use actual WebSocket connection
      // For now, we'll just log the event
      logger.debug('Sending event to connection', { 
        connectionId, 
        eventType: event.type,
        eventData: JSON.stringify(event).substring(0, 200) + '...'
      });
      
      // Actual WebSocket send would be something like:
      // this.webSocketServer.to(connectionId).emit('operator-event', event);
      
    } catch (error) {
      logger.error('Failed to send event to connection', { 
        error, 
        connectionId, 
        eventType: event.type 
      });
      
      // Remove failed connection
      this.removeConnection(connectionId);
    }
  }

  /**
   * Check if connection can subscribe to a room
   */
  private canSubscribeToRoom(connection: WebSocketConnection, room: string): boolean {
    // Parse room type and identifier
    const [roomType, identifier] = room.split(':');

    switch (roomType) {
      case 'operator':
        // Can subscribe to specific operator if has operator view permissions
        return connection.permissions.includes('view_operators') || 
               connection.permissions.includes('manage_operators');
               
      case 'performance':
        // Can subscribe to performance updates if has performance permissions
        return connection.permissions.includes('view_performance_metrics') ||
               connection.permissions.includes('manage_performance');
               
      case 'financial':
      case 'commission':
        // Can subscribe to financial updates if has financial permissions
        return connection.permissions.includes('view_financial_data') ||
               connection.permissions.includes('manage_commissions');
               
      case 'region':
        // Can subscribe to regional updates if has access to that region
        return connection.allowedRegions.length === 0 || // Admin access
               connection.allowedRegions.includes(identifier);
               
      case 'analytics':
        // Can subscribe to analytics if has analytics permissions
        return connection.permissions.includes('view_analytics') ||
               connection.permissions.includes('view_operators');
               
      case 'tier':
        // Can subscribe to tier updates if has commission management permissions
        return connection.permissions.includes('view_commission_tiers') ||
               connection.permissions.includes('update_commission_tier');
               
      default:
        return false;
    }
  }

  /**
   * Check if connection can receive specific event
   */
  private canReceiveEvent(connection: WebSocketConnection, event: any): boolean {
    // Additional event-specific permission checks
    switch (event.type) {
      case 'performance_update':
      case 'commission_earned':
      case 'tier_qualification':
        // Check regional access for operator events
        return this.hasOperatorAccess(connection, event.operator_id);
        
      default:
        return true; // Default allow for generic events
    }
  }

  /**
   * Check if connection has access to specific operator
   */
  private async hasOperatorAccess(
    connection: WebSocketConnection, 
    operatorId: string
  ): Promise<boolean> {
    try {
      // In production, this would query the database
      const operatorRegion = await this.getOperatorRegion(operatorId);
      
      // Admin users (no regional restrictions) have access to all operators
      if (connection.allowedRegions.length === 0) {
        return true;
      }
      
      // Regional users only have access to operators in their regions
      return operatorRegion ? connection.allowedRegions.includes(operatorRegion) : false;
      
    } catch (error) {
      logger.error('Failed to check operator access', { error, operatorId });
      return false; // Deny access on error
    }
  }

  /**
   * Get operator's primary region
   */
  private async getOperatorRegion(operatorId: string): Promise<string | null> {
    // Mock implementation - in production this would query the database
    logger.debug('Getting operator region', { operatorId });
    return 'region-1'; // Mock region
  }

  // =====================================================
  // SUBSCRIPTION HELPERS
  // =====================================================

  /**
   * Get standard room names for operator subscriptions
   */
  static getOperatorRooms(operatorId: string): string[] {
    return [
      `operator:${operatorId}`,           // Operator-specific events
      'performance:updates',              // Performance updates
      'financial:commissions',            // Commission events
      'commission:tier-changes',          // Tier change notifications
    ];
  }

  /**
   * Get admin room subscriptions
   */
  static getAdminRooms(): string[] {
    return [
      'operators:events',                 // All operator events
      'performance:updates',              // All performance updates
      'financial:commissions',            // All commission events
      'commission:qualifications',        // All tier qualifications
      'analytics:revenue',                // Revenue analytics
      'tier:qualified',                   // Tier qualification successes
      'tier:improvement-needed'           // Tier improvement opportunities
    ];
  }

  /**
   * Get regional manager room subscriptions
   */
  static getRegionalRooms(regionIds: string[]): string[] {
    const rooms: string[] = [
      'performance:updates',              // Performance updates
      'financial:commissions',            // Commission events
    ];
    
    // Add region-specific rooms
    regionIds.forEach(regionId => {
      rooms.push(`region:${regionId}`);
    });
    
    return rooms;
  }

  // =====================================================
  // STATISTICS AND MONITORING
  // =====================================================

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    totalConnections: number;
    totalRooms: number;
    roomStats: Array<{ room: string; subscribers: number }>;
  } {
    const roomStats = Array.from(this.roomSubscriptions.entries()).map(([room, connections]) => ({
      room,
      subscribers: connections.size
    }));

    return {
      totalConnections: this.connections.size,
      totalRooms: this.roomSubscriptions.size,
      roomStats
    };
  }

  /**
   * Get user connection info
   */
  getUserConnections(userId: string): WebSocketConnection[] {
    return Array.from(this.connections.values()).filter(conn => conn.userId === userId);
  }
}

// Singleton instance
export const operatorWebSocketManager = new OperatorWebSocketManager();

// =====================================================
// EVENT HELPER FUNCTIONS
// =====================================================

/**
 * Create performance update event
 */
export function createPerformanceUpdateEvent(
  operatorId: string,
  oldScore: number,
  newScore: number,
  oldTier: CommissionTier,
  newTier: CommissionTier
): PerformanceUpdateEvent {
  return {
    type: 'performance_update',
    operator_id: operatorId,
    old_score: oldScore,
    new_score: newScore,
    old_tier: oldTier,
    new_tier: newTier,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create commission earned event
 */
export function createCommissionEarnedEvent(
  operatorId: string,
  transactionId: string,
  amount: number,
  bookingId: string
): CommissionEarnedEvent {
  return {
    type: 'commission_earned',
    operator_id: operatorId,
    transaction_id: transactionId,
    amount,
    booking_id: bookingId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create tier qualification event
 */
export function createTierQualificationEvent(
  operatorId: string,
  tier: CommissionTier,
  qualified: boolean,
  requirementsMet: Record<string, boolean>
): TierQualificationEvent {
  return {
    type: 'tier_qualification',
    operator_id: operatorId,
    tier,
    qualified,
    requirements_met: requirementsMet,
    timestamp: new Date().toISOString()
  };
}

export default operatorWebSocketManager;