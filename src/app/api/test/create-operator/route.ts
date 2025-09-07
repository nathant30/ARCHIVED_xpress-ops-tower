// Test API Endpoint: Create Operator for E2E Testing
// Creates test operators for emergency workflow testing

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for test operator creation
const TestOperatorSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  role: z.enum(['operator', 'supervisor', 'admin']).default('operator'),
  regionId: z.string(),
  permissions: z.array(z.string()).optional().default([
    'drivers:read',
    'bookings:write',
    'incidents:write',
    'emergency:handle'
  ])
});

// POST /api/test/create-operator - Create test operator
export async function POST(request: NextRequest) {
  // Only allow in development/test environment
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TEST_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = TestOperatorSchema.parse(body);

    // Mock operator creation for E2E testing
    // Note: In full implementation, this would interact with user management system
    const sessionToken = generateSessionToken();

    return NextResponse.json({
      message: 'Test operator created successfully',
      operator: {
        id: validatedData.id,
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
        regionId: validatedData.regionId,
        sessionToken // For E2E authentication
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Test operator creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create test operator' },
      { status: 500 }
    );
  }
}

// DELETE /api/test/create-operator - Clean up test operators
export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TEST_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  try {
    // Mock cleanup for E2E testing
    // Note: In full implementation, this would clean up user management system
    
    return NextResponse.json({
      message: 'Test operators cleaned up successfully'
    });

  } catch (error) {
    console.error('Test operator cleanup failed:', error);
    return NextResponse.json(
      { error: 'Failed to clean up test operators' },
      { status: 500 }
    );
  }
}

// Helper functions

// Simple password hashing for test environment
async function hashPassword(password: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(password + 'test-salt').digest('hex');
}

// Generate session token for test authentication
function generateSessionToken(): string {
  const crypto = require('crypto');
  return 'test-session-' + crypto.randomBytes(16).toString('hex');
}