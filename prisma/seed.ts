import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');
  
  // Create regions
  const regions = await Promise.all([
    prisma.region.upsert({
      where: { name: 'Metro Manila' },
      update: {},
      create: {
        name: 'Metro Manila',
      },
    }),
    prisma.region.upsert({
      where: { name: 'Cebu' },
      update: {},
      create: {
        name: 'Cebu',
      },
    }),
    prisma.region.upsert({
      where: { name: 'Davao' },
      update: {},
      create: {
        name: 'Davao',
      },
    }),
  ]);
  
  console.log('✅ Created regions:', regions.map(r => r.name));
  
  // Create drivers
  const drivers = await Promise.all([
    prisma.driver.upsert({
      where: { email: 'juan.delacruz@email.com' },
      update: {},
      create: {
        name: 'Juan Dela Cruz',
        email: 'juan.delacruz@email.com',
        phone: '+639123456789',
        status: 'active',
        rating: 4.8,
      },
    }),
    prisma.driver.upsert({
      where: { email: 'maria.santos@email.com' },
      update: {},
      create: {
        name: 'Maria Santos',
        email: 'maria.santos@email.com', 
        phone: '+639987654321',
        status: 'active',
        rating: 4.9,
      },
    }),
    prisma.driver.upsert({
      where: { email: 'jose.rizal@email.com' },
      update: {},
      create: {
        name: 'Jose Rizal',
        email: 'jose.rizal@email.com',
        phone: '+639111222333',
        status: 'inactive',
        rating: 4.5,
      },
    }),
  ]);
  
  console.log('✅ Created drivers:', drivers.map(d => d.name));
  
  // Create some ride requests
  const rideRequests = await Promise.all([
    prisma.rideRequest.create({
      data: {
        passengerId: 'passenger-1',
        pickup: 'Makati CBD, Metro Manila',
        dropoff: 'BGC, Taguig City',
        status: 'pending',
      },
    }),
    prisma.rideRequest.create({
      data: {
        passengerId: 'passenger-2',
        pickup: 'Ayala Center, Cebu City',
        dropoff: 'IT Park, Cebu City',
        status: 'completed',
      },
    }),
  ]);
  
  console.log('✅ Created ride requests:', rideRequests.length);
  
  // Create region assignments
  const assignments = await Promise.all([
    prisma.regionAssignment.create({
      data: {
        regionId: regions[0].id, // Metro Manila
        driverId: drivers[0].id,  // Juan
        assignedBy: 'admin-user-id',
      },
    }),
    prisma.regionAssignment.create({
      data: {
        regionId: regions[1].id, // Cebu
        driverId: drivers[1].id,  // Maria
        assignedBy: 'admin-user-id',
      },
    }),
  ]);
  
  console.log('✅ Created region assignments:', assignments.length);
  
  console.log('🎉 Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });