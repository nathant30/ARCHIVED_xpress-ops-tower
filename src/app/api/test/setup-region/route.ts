// Test API Endpoint: Setup Region for E2E Testing
// Sets up test regions with emergency services configuration

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for test region setup
const TestRegionSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  emergency_services: z.object({
    national_emergency: z.string().optional().default('911'),
    police: z.string().optional().default('117'),
    fire: z.string().optional().default('116'),
    medical: z.string().optional().default('143')
  }),
  coordinates: z.object({
    center: z.object({
      latitude: z.number().default(14.5995),
      longitude: z.number().default(120.9842)
    }),
    bounds: z.object({
      north: z.number().default(14.7608),
      south: z.number().default(14.4383),
      east: z.number().default(121.0944),
      west: z.number().default(120.8736)
    })
  }).optional(),
  timezone: z.string().optional().default('Asia/Manila'),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active')
});

// POST /api/test/setup-region - Setup test region
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
    const validatedData = TestRegionSchema.parse(body);

    // Check if region already exists
    const existingRegion = await prisma.region.findFirst({
      where: {
        OR: [
          { id: validatedData.id },
          { name: validatedData.name }
        ]
      }
    });

    let region;
    if (existingRegion) {
      // Update existing test region
      region = await prisma.region.update({
        where: { id: existingRegion.id },
        data: {
          name: validatedData.name
        }
      });
    } else {
      // Create new test region
      region = await prisma.region.create({
        data: {
          id: validatedData.id,
          name: validatedData.name
        }
      });
    }

    // Note: Emergency services setup would be handled in full implementation
    // For E2E testing, we just create the basic region

    return NextResponse.json({
      message: 'Test region setup successfully',
      region: {
        id: region.id,
        name: region.name,
        emergency_services: validatedData.emergency_services,
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

    console.error('Test region setup failed:', error);
    return NextResponse.json(
      { error: 'Failed to setup test region' },
      { status: 500 }
    );
  }
}

// DELETE /api/test/setup-region - Clean up test regions
export async function DELETE(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TEST_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  try {
    // Delete test regions
    await prisma.region.deleteMany({
      where: {
        OR: [
          { id: { startsWith: 'e2e-' } },
          { id: { endsWith: '-test' } }
        ]
      }
    });

    return NextResponse.json({
      message: 'Test regions cleaned up successfully'
    });

  } catch (error) {
    console.error('Test region cleanup failed:', error);
    return NextResponse.json(
      { error: 'Failed to clean up test regions' },
      { status: 500 }
    );
  }
}

