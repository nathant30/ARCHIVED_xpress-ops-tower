import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateParams, validateBody } from '@/lib/validate';
import { RegionParamsSchema, RegionAssignmentSchema } from '@/lib/schemas';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { createVersionedResponse } from '@/middleware/apiVersioning';
import { 
  createApiResponse, 
  createApiError,
  createNotFoundError,
} from '@/lib/api-utils';

const postRegionAssignV1 = withEnhancedAuth({
  requiredPermissions: ['manage_regions', 'assign_driver'],
  dataClass: 'internal'
})(async (request: NextRequest, user, { params }: { params: { id: string } }) => {
  // Validate path parameters
  const paramsValidation = validateParams(RegionParamsSchema, params);
  if (paramsValidation.error) {
    return paramsValidation.error;
  }
  
  const { id } = paramsValidation.data;
  
  // Validate and parse request body
  const bodyData = await validateBody(RegionAssignmentSchema)(request);
  if (bodyData instanceof NextResponse) {
    return bodyData; // Return validation error
  }
  
  const { driverId, assignedBy } = bodyData;
  
  try {
    // Check if region exists
    const region = await prisma.region.findUnique({
      where: { id }
    });
    
    if (!region) {
      return createNotFoundError('Region', `/api/regions/${id}/assign-rm`, 'POST');
    }
    
    // Check if driver exists
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    });
    
    if (!driver) {
      return createApiError(
        'Driver not found',
        'DRIVER_NOT_FOUND',
        404,
        { driverId },
        `/api/regions/${id}/assign-rm`,
        'POST'
      );
    }
    
    // Check if assignment already exists
    const existingAssignment = await prisma.regionAssignment.findFirst({
      where: {
        regionId: id,
        driverId: driverId
      }
    });
    
    if (existingAssignment) {
      return createApiError(
        'Driver is already assigned to this region',
        'ASSIGNMENT_ALREADY_EXISTS',
        409,
        { regionId: id, driverId },
        `/api/regions/${id}/assign-rm`,
        'POST'
      );
    }
    
    // Create the region assignment
    const assignment = await prisma.regionAssignment.create({
      data: {
        regionId: id,
        driverId,
        assignedBy
      },
      include: {
        region: true,
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true
          }
        }
      }
    });
    
    return createVersionedResponse(
      { assignment },
      'v1'
    );
    
  } catch (error) {
    console.error('Error creating region assignment:', error);
    return createApiError(
      'Failed to create region assignment',
      'ASSIGNMENT_FAILED',
      500,
      undefined,
      `/api/regions/${id}/assign-rm`,
      'POST'
    );
  }
});

export const POST = postRegionAssignV1;