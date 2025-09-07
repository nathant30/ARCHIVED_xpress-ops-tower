import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { prisma } from '@/lib/prisma';

// Mock Next.js server for testing
const testServer = 'http://localhost:4000';

describe('Drivers API', () => {
  let testDriver: any;
  let testRegion: any;

  beforeEach(async () => {
    // Clean up
    await prisma.regionAssignment.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.region.deleteMany();
    
    // Create test data
    testRegion = await prisma.region.create({
      data: {
        name: 'Test Region',
      },
    });

    testDriver = await prisma.driver.create({
      data: {
        name: 'Test Driver',
        email: 'test@example.com',
        phone: '+639123456789',
        status: 'active',
        rating: 4.5,
      },
    });
  });

  describe('GET /api/drivers', () => {
    it('should return drivers list with pagination', async () => {
      // Note: This test will require authentication in the real app
      // For now, we're just testing the schema validation
      const response = await request(testServer)
        .get('/api/drivers?limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('drivers');
      expect(Array.isArray(response.body.drivers)).toBe(true);
    });

    it('should validate query parameters', async () => {
      const response = await request(testServer)
        .get('/api/drivers?limit=invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid query parameters');
    });
  });

  describe('PATCH /api/drivers/{id}', () => {
    it('should update driver successfully', async () => {
      const updateData = {
        name: 'Updated Driver Name',
        status: 'inactive' as const,
      };

      const response = await request(testServer)
        .patch(`/api/drivers/${testDriver.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('driver');
      expect(response.body.driver.name).toBe(updateData.name);
      expect(response.body.driver.status).toBe(updateData.status);
    });

    it('should return 404 for non-existent driver', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(testServer)
        .patch(`/api/drivers/${fakeId}`)
        .send({ name: 'Test' })
        .expect(404);

      expect(response.body.error).toBe('Driver not found');
    });

    it('should validate request body', async () => {
      const response = await request(testServer)
        .patch(`/api/drivers/${testDriver.id}`)
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/regions/{id}/assign-rm', () => {
    it('should create region assignment successfully', async () => {
      const assignmentData = {
        driverId: testDriver.id,
        assignedBy: 'admin-user-id',
      };

      const response = await request(testServer)
        .post(`/api/regions/${testRegion.id}/assign-rm`)
        .send(assignmentData)
        .expect(200);

      expect(response.body).toHaveProperty('assignment');
      expect(response.body.assignment.driverId).toBe(testDriver.id);
      expect(response.body.assignment.regionId).toBe(testRegion.id);
    });

    it('should prevent duplicate assignments', async () => {
      // Create initial assignment
      await prisma.regionAssignment.create({
        data: {
          regionId: testRegion.id,
          driverId: testDriver.id,
          assignedBy: 'admin-user-id',
        },
      });

      const assignmentData = {
        driverId: testDriver.id,
        assignedBy: 'admin-user-id',
      };

      const response = await request(testServer)
        .post(`/api/regions/${testRegion.id}/assign-rm`)
        .send(assignmentData)
        .expect(409);

      expect(response.body.error).toBe('Driver is already assigned to this region');
    });

    it('should return 404 for non-existent region', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await request(testServer)
        .post(`/api/regions/${fakeId}/assign-rm`)
        .send({
          driverId: testDriver.id,
          assignedBy: 'admin-user-id',
        })
        .expect(404);

      expect(response.body.error).toBe('Region not found');
    });
  });
});