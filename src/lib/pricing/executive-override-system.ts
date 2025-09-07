/**
 * Express Ops Tower - Executive Override System
 * Multi-level approval hierarchy for pricing controls
 * Based on PRD v1.0 - September 2025
 */

import { z } from 'zod';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ExecutiveOverride {
  id: string;
  override_type: OverrideType;
  approver_id: string;
  approver_level: ApprovalLevel;
  approver_name: string;
  geographic_scope: GeographicScope;
  service_types: ServiceType[];
  parameters: OverrideParameters;
  reason: string;
  justification?: string;
  start_time: Date;
  end_time?: Date;
  status: OverrideStatus;
  impact_assessment?: ImpactAssessment;
  actual_impact?: ActualImpact;
  created_at: Date;
  updated_at: Date;
}

export type OverrideType = 
  | 'surge_disable' 
  | 'surge_cap' 
  | 'fare_adjustment' 
  | 'service_suspend' 
  | 'emergency_control';

export type ApprovalLevel = 1 | 2 | 3 | 4;

export type ServiceType = 
  | 'tnvs_standard' 
  | 'tnvs_premium' 
  | 'taxi_regular' 
  | 'taxi_premium' 
  | 'mc_taxi'
  | 'all';

export type OverrideStatus = 'active' | 'expired' | 'revoked';

export interface GeographicScope {
  type: 'city' | 'region' | 'zone' | 'point' | 'route';
  city_code?: string;
  region_code?: string;
  zones?: string[];
  center_lat?: number;
  center_lng?: number;
  radius_km?: number;
  route_points?: Array<{ lat: number; lng: number }>;
}

export interface OverrideParameters {
  price_adjustment_pct?: number;
  surge_cap?: number;
  flat_adjustment?: number;
  emergency_multiplier?: number;
  service_suspension_reason?: string;
  custom_parameters?: Record<string, any>;
}

export interface ImpactAssessment {
  estimated_revenue_impact_pct: number;
  estimated_customer_impact: number;
  estimated_driver_impact: number;
  market_share_risk: 'low' | 'medium' | 'high';
  regulatory_risk: 'low' | 'medium' | 'high';
  reputational_risk: 'low' | 'medium' | 'high';
}

export interface ActualImpact {
  actual_revenue_impact_pct: number;
  actual_customer_complaints: number;
  actual_driver_complaints: number;
  trip_volume_change_pct: number;
  measured_at: Date;
}

export interface OverrideRequest {
  override_type: OverrideType;
  geographic_scope: GeographicScope;
  service_types: ServiceType[];
  parameters: OverrideParameters;
  reason: string;
  justification?: string;
  duration_minutes?: number;
  impact_assessment?: ImpactAssessment;
}

export interface ApprovalHierarchy {
  level: ApprovalLevel;
  title: string;
  max_price_adjustment_pct: number;
  can_emergency_control: boolean;
  can_service_suspend: boolean;
  approval_timeout_minutes: number;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GeographicScopeSchema = z.object({
  type: z.enum(['city', 'region', 'zone', 'point', 'route']),
  city_code: z.string().optional(),
  region_code: z.string().optional(),
  zones: z.array(z.string()).optional(),
  center_lat: z.number().min(-90).max(90).optional(),
  center_lng: z.number().min(-180).max(180).optional(),
  radius_km: z.number().min(0).max(1000).optional(),
  route_points: z.array(z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  })).optional()
});

const OverrideRequestSchema = z.object({
  override_type: z.enum(['surge_disable', 'surge_cap', 'fare_adjustment', 'service_suspend', 'emergency_control']),
  geographic_scope: GeographicScopeSchema,
  service_types: z.array(z.enum(['tnvs_standard', 'tnvs_premium', 'taxi_regular', 'taxi_premium', 'mc_taxi', 'all'])),
  parameters: z.object({
    price_adjustment_pct: z.number().optional(),
    surge_cap: z.number().min(1.0).max(10.0).optional(),
    flat_adjustment: z.number().optional(),
    emergency_multiplier: z.number().min(0.1).max(5.0).optional(),
    service_suspension_reason: z.string().optional(),
    custom_parameters: z.record(z.any()).optional()
  }),
  reason: z.string().min(10).max(500),
  justification: z.string().max(1000).optional(),
  duration_minutes: z.number().min(1).max(43200).optional(), // Max 30 days
  impact_assessment: z.object({
    estimated_revenue_impact_pct: z.number(),
    estimated_customer_impact: z.number(),
    estimated_driver_impact: z.number(),
    market_share_risk: z.enum(['low', 'medium', 'high']),
    regulatory_risk: z.enum(['low', 'medium', 'high']),
    reputational_risk: z.enum(['low', 'medium', 'high'])
  }).optional()
});

// ============================================================================
// EXECUTIVE OVERRIDE SYSTEM CLASS
// ============================================================================

export class ExecutiveOverrideSystem {
  private readonly APPROVAL_HIERARCHY: ApprovalHierarchy[] = [
    {
      level: 1,
      title: 'Operations Manager',
      max_price_adjustment_pct: 20,
      can_emergency_control: false,
      can_service_suspend: false,
      approval_timeout_minutes: 30
    },
    {
      level: 2,
      title: 'Head of Operations',
      max_price_adjustment_pct: 50,
      can_emergency_control: false,
      can_service_suspend: true,
      approval_timeout_minutes: 60
    },
    {
      level: 3,
      title: 'VP/C-Suite',
      max_price_adjustment_pct: 100,
      can_emergency_control: true,
      can_service_suspend: true,
      approval_timeout_minutes: 120
    },
    {
      level: 4,
      title: 'CEO/Board',
      max_price_adjustment_pct: Infinity,
      can_emergency_control: true,
      can_service_suspend: true,
      approval_timeout_minutes: 240
    }
  ];

  /**
   * Create a new executive override
   */
  async createOverride(
    request: OverrideRequest,
    approver: { id: string; name: string; level: ApprovalLevel }
  ): Promise<{ success: boolean; override?: ExecutiveOverride; error?: string }> {
    try {
      // Validate request
      const validatedRequest = OverrideRequestSchema.parse(request);
      
      // Check approval authority
      const authorityCheck = this.validateApprovalAuthority(validatedRequest, approver.level);
      if (!authorityCheck.authorized) {
        return { success: false, error: authorityCheck.reason };
      }
      
      // Create override record
      const override: ExecutiveOverride = {
        id: this.generateOverrideId(),
        override_type: validatedRequest.override_type,
        approver_id: approver.id,
        approver_level: approver.level,
        approver_name: approver.name,
        geographic_scope: validatedRequest.geographic_scope,
        service_types: validatedRequest.service_types,
        parameters: validatedRequest.parameters,
        reason: validatedRequest.reason,
        justification: validatedRequest.justification,
        start_time: new Date(),
        end_time: validatedRequest.duration_minutes 
          ? new Date(Date.now() + validatedRequest.duration_minutes * 60000)
          : undefined,
        status: 'active',
        impact_assessment: validatedRequest.impact_assessment,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      // Save to database
      await this.saveOverride(override);
      
      // Apply override to pricing system
      await this.applyOverride(override);
      
      // Send notifications
      await this.sendOverrideNotifications(override);
      
      // Log the action
      await this.logOverrideAction('CREATE', override, approver.id);
      
      return { success: true, override };
      
    } catch (error) {
      console.error('Failed to create override:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Revoke an existing override
   */
  async revokeOverride(
    overrideId: string,
    revoker: { id: string; name: string; level: ApprovalLevel },
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const override = await this.getOverride(overrideId);
      if (!override) {
        return { success: false, error: 'Override not found' };
      }
      
      if (override.status !== 'active') {
        return { success: false, error: 'Override is not active' };
      }
      
      // Check revocation authority (must be same level or higher)
      if (revoker.level < override.approver_level) {
        return { 
          success: false, 
          error: 'Insufficient authority to revoke this override' 
        };
      }
      
      // Update override status
      override.status = 'revoked';
      override.updated_at = new Date();
      
      await this.saveOverride(override);
      
      // Remove override from pricing system
      await this.removeOverride(override);
      
      // Send notifications
      await this.sendRevocationNotifications(override, revoker, reason);
      
      // Log the action
      await this.logOverrideAction('REVOKE', override, revoker.id, { reason });
      
      return { success: true };
      
    } catch (error) {
      console.error('Failed to revoke override:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Get active overrides for a location and service type
   */
  async getActiveOverrides(
    lat: number,
    lng: number,
    serviceType: ServiceType
  ): Promise<ExecutiveOverride[]> {
    try {
      const allActiveOverrides = await this.getAllActiveOverrides();
      
      return allActiveOverrides.filter(override => 
        this.isOverrideApplicable(override, lat, lng, serviceType)
      );
      
    } catch (error) {
      console.error('Failed to get active overrides:', error);
      return [];
    }
  }
  
  /**
   * Get override dashboard data
   */
  async getOverrideDashboard(): Promise<{
    active_overrides: ExecutiveOverride[];
    recent_overrides: ExecutiveOverride[];
    override_stats: OverrideStats;
  }> {
    try {
      const [activeOverrides, recentOverrides, stats] = await Promise.all([
        this.getAllActiveOverrides(),
        this.getRecentOverrides(24), // Last 24 hours
        this.getOverrideStats()
      ]);
      
      return {
        active_overrides: activeOverrides,
        recent_overrides: recentOverrides,
        override_stats: stats
      };
      
    } catch (error) {
      console.error('Failed to get override dashboard:', error);
      return {
        active_overrides: [],
        recent_overrides: [],
        override_stats: {
          total_active: 0,
          total_today: 0,
          avg_duration_minutes: 0,
          most_common_type: 'surge_disable'
        }
      };
    }
  }
  
  /**
   * Validate approval authority
   */
  private validateApprovalAuthority(
    request: z.infer<typeof OverrideRequestSchema>,
    approverLevel: ApprovalLevel
  ): { authorized: boolean; reason?: string } {
    const hierarchy = this.APPROVAL_HIERARCHY.find(h => h.level === approverLevel);
    if (!hierarchy) {
      return { authorized: false, reason: 'Invalid approval level' };
    }
    
    // Check price adjustment authority
    const priceAdjustment = request.parameters.price_adjustment_pct;
    if (priceAdjustment !== undefined && Math.abs(priceAdjustment) > hierarchy.max_price_adjustment_pct) {
      return { 
        authorized: false, 
        reason: `Price adjustment of ${priceAdjustment}% exceeds maximum allowed (${hierarchy.max_price_adjustment_pct}%)` 
      };
    }
    
    // Check emergency control authority
    if (request.override_type === 'emergency_control' && !hierarchy.can_emergency_control) {
      return { 
        authorized: false, 
        reason: 'Insufficient authority for emergency controls' 
      };
    }
    
    // Check service suspension authority
    if (request.override_type === 'service_suspend' && !hierarchy.can_service_suspend) {
      return { 
        authorized: false, 
        reason: 'Insufficient authority for service suspension' 
      };
    }
    
    return { authorized: true };
  }
  
  /**
   * Check if override applies to a specific location and service
   */
  private isOverrideApplicable(
    override: ExecutiveOverride,
    lat: number,
    lng: number,
    serviceType: ServiceType
  ): boolean {
    // Check service type match
    if (!override.service_types.includes('all') && !override.service_types.includes(serviceType)) {
      return false;
    }
    
    // Check geographic scope
    const scope = override.geographic_scope;
    
    switch (scope.type) {
      case 'city':
        // In production, this would check against city boundaries
        return true; // Simplified for demo
        
      case 'region':
        // In production, this would check against region boundaries
        return true; // Simplified for demo
        
      case 'point':
        if (scope.center_lat && scope.center_lng && scope.radius_km) {
          const distance = this.calculateDistance(
            lat, lng, 
            scope.center_lat, scope.center_lng
          );
          return distance <= scope.radius_km;
        }
        return false;
        
      case 'zone':
        // In production, this would check against H3 zones
        return true; // Simplified for demo
        
      case 'route':
        // In production, this would check if point is on route
        return true; // Simplified for demo
        
      default:
        return false;
    }
  }
  
  /**
   * Calculate distance between two points in km
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  /**
   * Generate unique override ID
   */
  private generateOverrideId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `override_${timestamp}_${random}`;
  }
  
  // ============================================================================
  // DATABASE OPERATIONS (MOCK IMPLEMENTATIONS)
  // ============================================================================
  
  private async saveOverride(override: ExecutiveOverride): Promise<void> {
    // In production, this would save to executive_overrides table
    console.log('Override saved:', {
      id: override.id,
      type: override.override_type,
      approver: override.approver_name,
      scope: override.geographic_scope.type
    });
  }
  
  private async getOverride(overrideId: string): Promise<ExecutiveOverride | null> {
    // In production, this would query the database
    return null; // Simplified for demo
  }
  
  private async getAllActiveOverrides(): Promise<ExecutiveOverride[]> {
    // In production, this would query active overrides from database
    return []; // Simplified for demo
  }
  
  private async getRecentOverrides(hours: number): Promise<ExecutiveOverride[]> {
    // In production, this would query recent overrides
    return []; // Simplified for demo
  }
  
  private async getOverrideStats(): Promise<OverrideStats> {
    // In production, this would calculate stats from database
    return {
      total_active: 0,
      total_today: 0,
      avg_duration_minutes: 60,
      most_common_type: 'surge_disable'
    };
  }
  
  // ============================================================================
  // PRICING SYSTEM INTEGRATION
  // ============================================================================
  
  private async applyOverride(override: ExecutiveOverride): Promise<void> {
    // In production, this would update the pricing engine configuration
    console.log('Override applied to pricing system:', override.id);
  }
  
  private async removeOverride(override: ExecutiveOverride): Promise<void> {
    // In production, this would remove override from pricing engine
    console.log('Override removed from pricing system:', override.id);
  }
  
  // ============================================================================
  // NOTIFICATION SYSTEM
  // ============================================================================
  
  private async sendOverrideNotifications(override: ExecutiveOverride): Promise<void> {
    // In production, this would send notifications to relevant stakeholders
    console.log('Override notifications sent for:', override.id);
  }
  
  private async sendRevocationNotifications(
    override: ExecutiveOverride,
    revoker: { id: string; name: string },
    reason: string
  ): Promise<void> {
    // In production, this would send revocation notifications
    console.log('Revocation notifications sent for:', override.id);
  }
  
  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================
  
  private async logOverrideAction(
    action: string,
    override: ExecutiveOverride,
    userId: string,
    metadata?: any
  ): Promise<void> {
    // In production, this would log to audit table
    console.log('Override action logged:', {
      action,
      override_id: override.id,
      user_id: userId,
      timestamp: new Date().toISOString(),
      metadata
    });
  }
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

interface OverrideStats {
  total_active: number;
  total_today: number;
  avg_duration_minutes: number;
  most_common_type: OverrideType;
}

// ============================================================================
// EXPORT DEFAULT INSTANCE
// ============================================================================

export const executiveOverrideSystem = new ExecutiveOverrideSystem();