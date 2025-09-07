// Test API Endpoint: Test Environment Health Check
// Verifies test environment readiness for E2E testing

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database';

// GET /api/test/health - Check test environment health
export async function GET(request: NextRequest) {
  // Only allow in development/test environment
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_TEST_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Test endpoints disabled in production' },
      { status: 403 }
    );
  }

  const healthChecks = {
    database: false,
    webSocket: false,
    mockServices: false,
    testEndpoints: false,
    environment: false
  };

  const details: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    testMode: true
  };

  try {
    // 1. Database connectivity check
    try {
      const db = await getDb();
      const result = await db.query('SELECT 1 as test');
      healthChecks.database = result.rows.length > 0;
      details.database = { status: 'connected', responseTime: Date.now() };
    } catch (error) {
      details.database = { status: 'error', error: (error as Error).message };
    }

    // 2. Environment variables check
    const requiredEnvVars = ['NODE_ENV'];
    const optionalEnvVars = ['DATABASE_URL', 'REDIS_URL', 'ENABLE_TEST_ENDPOINTS'];
    
    details.environment = {
      required: {},
      optional: {},
      testEndpointsEnabled: process.env.ENABLE_TEST_ENDPOINTS || process.env.NODE_ENV !== 'production'
    };

    requiredEnvVars.forEach(envVar => {
      details.environment.required[envVar] = !!process.env[envVar];
    });

    optionalEnvVars.forEach(envVar => {
      details.environment.optional[envVar] = !!process.env[envVar];
    });

    healthChecks.environment = requiredEnvVars.every(envVar => process.env[envVar]);

    // 3. Test endpoints availability check
    try {
      const testEndpoints = [
        '/api/test/create-driver',
        '/api/test/create-operator', 
        '/api/test/setup-region',
        '/api/test/cleanup'
      ];

      healthChecks.testEndpoints = true; // Assume available since we're responding
      details.testEndpoints = {
        available: testEndpoints,
        count: testEndpoints.length
      };
    } catch (error) {
      details.testEndpoints = { status: 'error', error: (error as Error).message };
    }

    // 4. Mock services check (check if ports are available)
    try {
      const mockPorts = [9911, 9117, 9143, 9116, 8080]; // Emergency services + WebSocket
      const portChecks = await Promise.allSettled(
        mockPorts.map(port => checkPortAvailable(port))
      );

      const availablePorts = portChecks.map((result, index) => ({
        port: mockPorts[index],
        available: result.status === 'fulfilled' ? result.value : false,
        service: getServiceForPort(mockPorts[index])
      }));

      healthChecks.mockServices = availablePorts.some(p => p.available);
      details.mockServices = { ports: availablePorts };
    } catch (error) {
      details.mockServices = { status: 'error', error: (error as Error).message };
    }

    // 5. WebSocket connectivity check
    try {
      // Simple check for WebSocket server availability
      const wsPort = 8080;
      const wsAvailable = await checkPortAvailable(wsPort);
      healthChecks.webSocket = wsAvailable;
      details.webSocket = {
        port: wsPort,
        available: wsAvailable,
        endpoint: `ws://localhost:${wsPort}`
      };
    } catch (error) {
      details.webSocket = { status: 'error', error: (error as Error).message };
    }

    // Calculate overall health
    const healthyChecks = Object.values(healthChecks).filter(Boolean).length;
    const totalChecks = Object.keys(healthChecks).length;
    const healthScore = Math.round((healthyChecks / totalChecks) * 100);

    const overallStatus = healthScore >= 80 ? 'healthy' : 
                         healthScore >= 60 ? 'degraded' : 'unhealthy';

    const response = {
      status: overallStatus,
      healthScore,
      checks: healthChecks,
      details,
      recommendations: generateRecommendations(healthChecks, details)
    };

    return NextResponse.json(response, {
      status: overallStatus === 'unhealthy' ? 503 : 200
    });

  } catch (error) {
    console.error('Test health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      details: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

// Helper functions

async function checkPortAvailable(port: number): Promise<boolean> {
  try {
    const net = await import('net');
    
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => {
          resolve(true); // Port is available
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false); // Port is not available (likely in use)
      });
    });
  } catch (error) {
    return false;
  }
}

function getServiceForPort(port: number): string {
  const portServiceMap: Record<number, string> = {
    9911: 'National Emergency (911)',
    9117: 'Police Service (117)',
    9143: 'Medical Service (143)',
    9116: 'Fire Service (116)',
    8080: 'WebSocket Monitor'
  };
  return portServiceMap[port] || `Unknown Service (${port})`;
}

function generateRecommendations(checks: any, details: any): string[] {
  const recommendations: string[] = [];

  if (!checks.database) {
    recommendations.push('Database connection failed - check DATABASE_URL and ensure database is running');
  }

  if (!checks.mockServices) {
    recommendations.push('Mock emergency services are not available - run global setup to start mock servers');
  }

  if (!checks.webSocket) {
    recommendations.push('WebSocket service not available - ensure WebSocket monitor is running on port 8080');
  }

  if (!checks.environment) {
    recommendations.push('Required environment variables missing - check NODE_ENV configuration');
  }

  if (!checks.testEndpoints) {
    recommendations.push('Test endpoints not available - ensure ENABLE_TEST_ENDPOINTS is set or NODE_ENV is development');
  }

  if (recommendations.length === 0) {
    recommendations.push('Test environment is healthy and ready for E2E testing');
  }

  return recommendations;
}