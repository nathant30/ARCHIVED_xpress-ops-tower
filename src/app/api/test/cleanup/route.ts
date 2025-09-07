// Test API Endpoint: Comprehensive Test Cleanup
// Cleans up all test data across the system for E2E testing

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/test/cleanup - Clean up all test data
export async function POST(request: NextRequest) {
  // Only allow in development/test environment
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TEST_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  try {
    console.log('🧹 Starting comprehensive test cleanup...');

    let totalRecordsDeleted = 0;

    // Clean up test data from available models
    try {
      // Clean up region assignments first (due to foreign keys)
      const regionAssignments = await prisma.regionAssignment.deleteMany({
        where: {
          OR: [
            { driverId: { startsWith: 'e2e-' } },
            { regionId: { startsWith: 'e2e-' } }
          ]
        }
      });
      totalRecordsDeleted += regionAssignments.count;

      // Clean up drivers
      const drivers = await prisma.driver.deleteMany({
        where: {
          OR: [
            { id: { startsWith: 'e2e-' } },
            { email: { endsWith: 'e2e@test.com' } }
          ]
        }
      });
      totalRecordsDeleted += drivers.count;

      // Clean up regions  
      const regions = await prisma.region.deleteMany({
        where: {
          OR: [
            { id: { startsWith: 'e2e-' } },
            { id: { endsWith: '-test' } }
          ]
        }
      });
      totalRecordsDeleted += regions.count;

      // Clean up ride requests
      const rideRequests = await prisma.rideRequest.deleteMany({
        where: {
          OR: [
            { id: { startsWith: 'e2e-' } },
            { passengerId: { startsWith: 'e2e-' } }
          ]
        }
      });
      totalRecordsDeleted += rideRequests.count;

      // Clean up API events
      const apiEvents = await prisma.apiEvent.deleteMany({
        where: {
          OR: [
            { id: { startsWith: 'e2e-' } },
            { path: { contains: 'test' } }
          ]
        }
      });
      totalRecordsDeleted += apiEvents.count;

    } catch (error) {
      console.warn('Some cleanup operations failed:', (error as Error).message);
    }

    // Clean up any test files or caches
    await cleanupTestFiles();

    console.log(`✅ Test cleanup completed: ${totalRecordsDeleted} records deleted`);

    return NextResponse.json({
      message: 'Test cleanup completed successfully',
      summary: {
        totalRecordsDeleted,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Test cleanup failed:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup test data', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// GET /api/test/cleanup - Get cleanup status and test data count
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TEST_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  try {
    // Count test data across available models
    const testDataCounts = {
      drivers: 0,
      regions: 0,
      regionAssignments: 0,
      rideRequests: 0,
      apiEvents: 0
    };

    try {
      testDataCounts.drivers = await prisma.driver.count({
        where: {
          OR: [
            { id: { startsWith: 'e2e-' } },
            { email: { endsWith: 'e2e@test.com' } }
          ]
        }
      });

      testDataCounts.regions = await prisma.region.count({
        where: {
          OR: [
            { id: { startsWith: 'e2e-' } },
            { id: { endsWith: '-test' } }
          ]
        }
      });

      testDataCounts.regionAssignments = await prisma.regionAssignment.count({
        where: {
          OR: [
            { driverId: { startsWith: 'e2e-' } },
            { regionId: { startsWith: 'e2e-' } }
          ]
        }
      });

      testDataCounts.rideRequests = await prisma.rideRequest.count({
        where: {
          OR: [
            { id: { startsWith: 'e2e-' } },
            { passengerId: { startsWith: 'e2e-' } }
          ]
        }
      });

      testDataCounts.apiEvents = await prisma.apiEvent.count({
        where: {
          OR: [
            { id: { startsWith: 'e2e-' } },
            { path: { contains: 'test' } }
          ]
        }
      });

    } catch (error) {
      console.warn('Could not count test data:', (error as Error).message);
    }

    const hasTestData = Object.values(testDataCounts).some(count => count > 0);

    return NextResponse.json({
      testDataExists: hasTestData,
      counts: testDataCounts,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

  } catch (error) {
    console.error('Failed to get cleanup status:', error);
    return NextResponse.json(
      { error: 'Failed to get cleanup status' },
      { status: 500 }
    );
  }
}

// Helper function to clean up test files
async function cleanupTestFiles() {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');

    const testResultsPath = path.join(process.cwd(), 'test-results');
    const tempTestFiles = [
      'mock-services.json',
      'e2e-test-data.json',
      'emergency-response-log.json'
    ];

    for (const file of tempTestFiles) {
      try {
        const filePath = path.join(testResultsPath, file);
        await fs.unlink(filePath);
        console.log(`Cleaned up test file: ${file}`);
      } catch (error) {
        // File might not exist, continue
      }
    }
  } catch (error) {
    console.warn('Could not cleanup test files:', error);
  }
}