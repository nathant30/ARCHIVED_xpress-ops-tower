// Test API Endpoint: Create Driver for E2E Testing
// Creates test drivers for emergency workflow testing

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for test driver creation
const TestDriverSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  phone: z.string(),
  license: z.string(),
  vehicle: z.object({
    plateNumber: z.string(),
    type: z.string(),
    color: z.string()
  }),
  location: z.object({
    latitude: z.number(),
    longitude: z.number()
  }),
  status: z.enum(['active', 'inactive', 'suspended']).default('active')
});

// POST /api/test/create-driver - Create test driver
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
    const validatedData = TestDriverSchema.parse(body);

    // Check if driver already exists
    const existingDriver = await prisma.driver.findFirst({
      where: {
        OR: [
          { id: validatedData.id },
          { email: validatedData.email }
        ]
      }
    });

    if (existingDriver) {
      // Update existing test driver
      const updatedDriver = await prisma.driver.update({
        where: { id: existingDriver.id },
        data: {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          status: validatedData.status,
        }
      });
    } else {
      // Create new test driver
      const newDriver = await prisma.driver.create({
        data: {
          id: validatedData.id,
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          status: validatedData.status,
        }
      });
    }

    // Note: Authentication and location tracking handled separately in real implementation
    // For test purposes, we only create the driver record

    return NextResponse.json({
      message: 'Test driver created successfully',
      driver: {
        id: validatedData.id,
        name: validatedData.name,
        email: validatedData.email,
        status: validatedData.status
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Test driver creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create test driver' },
      { status: 500 }
    );
  }
}

// Simple password hashing for test environment
async function hashPassword(password: string): Promise<string> {
  // In a real environment, use bcrypt or similar
  // For testing, use a simple hash
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(password + 'test-salt').digest('hex');
}

// DELETE /api/test/create-driver - Clean up test drivers
export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TEST_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  try {
    // Delete test drivers (those with e2e prefix)
    await prisma.driver.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'e2e-' } },
          { email: { endsWith: 'e2e@test.com' } }
        ]
      }
    });

    return NextResponse.json({
      message: 'Test drivers cleaned up successfully'
    });

  } catch (error) {
    console.error('Test driver cleanup failed:', error);
    return NextResponse.json(
      { error: 'Failed to clean up test drivers' },
      { status: 500 }
    );
  }
}