import { beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';

beforeAll(async () => {
  // Clean up database before tests
  await prisma.regionAssignment.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.region.deleteMany();
  await prisma.rideRequest.deleteMany();
});

afterAll(async () => {
  // Cleanup after tests
  await prisma.$disconnect();
});