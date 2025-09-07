import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { logger } from '@/lib/security/productionLogger';
import { MockDataService } from '@/lib/mockData';
import { authManager } from '@/lib/auth';
import { rbacEngine } from '@/lib/auth/rbac-engine';
import { 
  EnhancedUser, 
  AuthenticationRequest, 
  AuthenticationResponse,
  PIIScope 
} from '@/types/rbac-abac';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mfaCode: z.string().optional()
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, mfaCode } = loginSchema.parse(body);

    // Get user by email using mock data service
    const user = MockDataService.getUserByEmail(email);
    
    if (!user) {
      logger.warn('Login attempt failed - user not found', { email });
      return NextResponse.json(
        { error: { message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn('Login attempt failed - account deactivated', { email });
      return NextResponse.json(
        { error: { message: 'Account is deactivated' } },
        { status: 403 }
      );
    }

    // Verify password using auth manager
    const isPasswordValid = await authManager.verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      logger.warn('Login attempt failed - invalid password', { email });
      return NextResponse.json(
        { error: { message: 'Invalid email or password' } },
        { status: 401 }
      );
    }

    // Check MFA if enabled
    if (user.mfaEnabled && !mfaCode) {
      logger.info('MFA required for login', { userId: user.id });
      return NextResponse.json(
        { requiresMFA: true, message: 'MFA code required' },
        { status: 202 }
      );
    }

    if (user.mfaEnabled && mfaCode) {
      // Verify MFA code using mock data service
      const isMfaValid = MockDataService.verifyMfaCode(user.id, mfaCode);
      
      if (!isMfaValid) {
        logger.warn('Login attempt failed - invalid MFA code', { email });
        return NextResponse.json(
          { error: { message: 'Invalid MFA code' } },
          { status: 401 }
        );
      }
    }

    // Build enhanced user object from mock data
    const enhancedUser: EnhancedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      mfaEnabled: user.mfaEnabled,
      roles: [{
        id: 'role-1',
        role: {
          name: user.role,
          description: `${user.role} role`,
          level: 1
        },
        isActive: true,
        assignedAt: new Date(),
        assignedBy: 'system'
      }],
      permissions: user.permissions || [],
      allowedRegions: user.regionId ? [user.regionId] : [],
      piiScope: 'full' as PIIScope, // Default to full access for demo
      lastLogin: user.lastLogin ? new Date(user.lastLogin) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      temporaryAccess: []
    };

    // Generate tokens
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tokenPayload = {
      sub: user.id,
      sessionId,
      roles: [user.role],
      permissions: user.permissions || [],
      allowedRegions: user.regionId ? [user.regionId] : [],
      piiScope: enhancedUser.piiScope
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ sub: user.id, sessionId }, REFRESH_SECRET, { expiresIn: '7d' });

    // Update last login using mock data service
    MockDataService.updateUserLastLogin(user.id);

    const authResponse: AuthenticationResponse = {
      user: enhancedUser,
      tokens: {
        accessToken,
        refreshToken
      },
      sessionId
    };

    logger.info('Enhanced login successful', {
      userId: user.id,
      email: user.email,
      sessionId,
      mfaUsed: Boolean(mfaCode)
    });

    return NextResponse.json({
      success: true,
      data: authResponse
    });

  } catch (error) {
    logger.error('Enhanced login error:', error);
    return NextResponse.json(
      { error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}