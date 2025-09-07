/**
 * Express Ops Tower - Executive Override API
 * POST/GET /api/v1/pricing/override - Executive pricing controls
 * Based on PRD v1.0 - September 2025
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  executiveOverrideSystem, 
  type OverrideRequest, 
  type ApprovalLevel 
} from '@/lib/pricing/executive-override-system';

// ============================================================================
// REQUEST VALIDATION SCHEMAS
// ============================================================================

const CreateOverrideSchema = z.object({
  override_type: z.enum(['surge_disable', 'surge_cap', 'fare_adjustment', 'service_suspend', 'emergency_control']),
  geographic_scope: z.object({
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
  }),
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
  duration_minutes: z.number().min(1).max(43200).optional(),
  impact_assessment: z.object({
    estimated_revenue_impact_pct: z.number(),
    estimated_customer_impact: z.number(),
    estimated_driver_impact: z.number(),
    market_share_risk: z.enum(['low', 'medium', 'high']),
    regulatory_risk: z.enum(['low', 'medium', 'high']),
    reputational_risk: z.enum(['low', 'medium', 'high'])
  }).optional()
});

const RevokeOverrideSchema = z.object({
  override_id: z.string(),
  reason: z.string().min(5).max(300)
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/pricing/override - Create executive override
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication and authorization check
    const authResult = await authenticateExecutive(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }
    
    const executive = authResult.user!;
    
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = CreateOverrideSchema.parse(body);
    
    // Check for emergency situation requiring immediate action
    const isEmergency = validatedRequest.override_type === 'emergency_control';
    if (isEmergency) {
      // Log emergency action
      await logEmergencyAction(executive, validatedRequest);
    }
    
    // Create override request
    const overrideRequest: OverrideRequest = {
      override_type: validatedRequest.override_type,
      geographic_scope: validatedRequest.geographic_scope,
      service_types: validatedRequest.service_types,
      parameters: validatedRequest.parameters,
      reason: validatedRequest.reason,
      justification: validatedRequest.justification,
      duration_minutes: validatedRequest.duration_minutes,
      impact_assessment: validatedRequest.impact_assessment
    };
    
    // Create override
    const result = await executiveOverrideSystem.createOverride(
      overrideRequest,
      {
        id: executive.id,
        name: executive.name,
        level: executive.approval_level
      }
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    // Calculate estimated impact
    const impactMetrics = await calculateImpactMetrics(result.override!);
    
    // Return success response
    return NextResponse.json({
      success: true,
      override: result.override,
      impact_metrics: impactMetrics,
      warnings: generateWarnings(result.override!),
      next_steps: generateNextSteps(result.override!)
    }, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    console.error('Override creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create override' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/pricing/override - Get override dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await authenticateExecutive(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'dashboard';
    
    switch (view) {
      case 'dashboard':
        const dashboard = await executiveOverrideSystem.getOverrideDashboard();
        return NextResponse.json({
          ...dashboard,
          user_permissions: getUserPermissions(authResult.user!)
        });
        
      case 'active':
        const activeOverrides = await executiveOverrideSystem.getAllActiveOverrides();
        return NextResponse.json({ active_overrides: activeOverrides });
        
      case 'history':
        const days = parseInt(searchParams.get('days') || '7');
        const history = await getOverrideHistory(days);
        return NextResponse.json({ history });
        
      default:
        return NextResponse.json(
          { error: 'Invalid view parameter' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Override dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch override data' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/pricing/override - Revoke existing override
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentication check
    const authResult = await authenticateExecutive(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }
    
    const executive = authResult.user!;
    
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = RevokeOverrideSchema.parse(body);
    
    // Revoke override
    const result = await executiveOverrideSystem.revokeOverride(
      validatedRequest.override_id,
      {
        id: executive.id,
        name: executive.name,
        level: executive.approval_level
      },
      validatedRequest.reason
    );
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Override revoked successfully',
      revoked_at: new Date().toISOString(),
      revoked_by: executive.name
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    console.error('Override revocation error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke override' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Authenticate executive user
 */
async function authenticateExecutive(request: NextRequest): Promise<{
  success: boolean;
  user?: ExecutiveUser;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' };
    }
    
    const token = authHeader.substring(7);
    
    // In production, this would validate JWT token and get user from database
    // For demo, return mock executive user
    const mockExecutive: ExecutiveUser = {
      id: 'exec_001',
      name: 'John Executive',
      email: 'john@xpress.com',
      title: 'VP Operations',
      approval_level: 3,
      permissions: ['surge_control', 'emergency_override', 'service_suspend'],
      department: 'Operations',
      last_login: new Date()
    };
    
    return { success: true, user: mockExecutive };
    
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Calculate impact metrics for override
 */
async function calculateImpactMetrics(override: any): Promise<ImpactMetrics> {
  // In production, this would perform complex impact analysis
  return {
    estimated_affected_trips: Math.floor(Math.random() * 1000) + 500,
    estimated_revenue_impact_php: Math.floor(Math.random() * 100000) + 50000,
    estimated_customer_reach: Math.floor(Math.random() * 5000) + 2000,
    estimated_driver_impact: Math.floor(Math.random() * 300) + 150,
    market_response_probability: Math.random() * 0.3 + 0.1, // 10-40%
    regulatory_attention_risk: Math.random() < 0.2 ? 'high' : 'low'
  };
}

/**
 * Generate warnings for override
 */
function generateWarnings(override: any): string[] {
  const warnings: string[] = [];
  
  if (override.override_type === 'surge_disable') {
    warnings.push('Disabling surge may lead to supply shortages during peak demand');
  }
  
  if (override.parameters.price_adjustment_pct && Math.abs(override.parameters.price_adjustment_pct) > 25) {
    warnings.push('Large price adjustments may affect customer satisfaction');
  }
  
  if (override.service_types.includes('all')) {
    warnings.push('Override affects all service types - consider more targeted approach');
  }
  
  if (!override.end_time) {
    warnings.push('Open-ended override - remember to set expiration or monitor closely');
  }
  
  return warnings;
}

/**
 * Generate next steps for override
 */
function generateNextSteps(override: any): string[] {
  const steps: string[] = [
    'Monitor real-time metrics for impact assessment',
    'Prepare stakeholder communication if needed',
    'Set calendar reminder for override review'
  ];
  
  if (override.override_type === 'emergency_control') {
    steps.unshift('Alert crisis management team');
    steps.push('Schedule post-incident review meeting');
  }
  
  if (override.parameters.price_adjustment_pct && Math.abs(override.parameters.price_adjustment_pct) > 50) {
    steps.push('Prepare regulatory filing if required');
  }
  
  return steps;
}

/**
 * Get user permissions based on approval level
 */
function getUserPermissions(user: ExecutiveUser): UserPermissions {
  const basePermissions = ['view_overrides', 'view_analytics'];
  
  switch (user.approval_level) {
    case 1:
      return {
        level: 1,
        permissions: [...basePermissions, 'create_minor_override'],
        max_adjustment_pct: 20
      };
      
    case 2:
      return {
        level: 2,
        permissions: [...basePermissions, 'create_minor_override', 'create_major_override', 'service_suspend'],
        max_adjustment_pct: 50
      };
      
    case 3:
    case 4:
      return {
        level: user.approval_level,
        permissions: [...basePermissions, 'create_minor_override', 'create_major_override', 'service_suspend', 'emergency_control'],
        max_adjustment_pct: Infinity
      };
      
    default:
      return {
        level: 0,
        permissions: basePermissions,
        max_adjustment_pct: 0
      };
  }
}

/**
 * Get override history
 */
async function getOverrideHistory(days: number): Promise<any[]> {
  // In production, this would query the database
  return []; // Simplified for demo
}

/**
 * Log emergency action
 */
async function logEmergencyAction(executive: ExecutiveUser, request: any): Promise<void> {
  console.log('EMERGENCY ACTION LOGGED:', {
    executive_id: executive.id,
    executive_name: executive.name,
    action_type: request.override_type,
    reason: request.reason,
    timestamp: new Date().toISOString()
  });
  
  // In production, this would:
  // 1. Send immediate alerts to crisis management team
  // 2. Log to high-priority audit trail
  // 3. Trigger automated notifications
  // 4. Create incident tracking record
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

interface ExecutiveUser {
  id: string;
  name: string;
  email: string;
  title: string;
  approval_level: ApprovalLevel;
  permissions: string[];
  department: string;
  last_login: Date;
}

interface ImpactMetrics {
  estimated_affected_trips: number;
  estimated_revenue_impact_php: number;
  estimated_customer_reach: number;
  estimated_driver_impact: number;
  market_response_probability: number;
  regulatory_attention_risk: 'low' | 'medium' | 'high';
}

interface UserPermissions {
  level: number;
  permissions: string[];
  max_adjustment_pct: number;
}