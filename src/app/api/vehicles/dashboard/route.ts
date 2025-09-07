// Simple development API for vehicle dashboard data
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For development, return mock data that matches the expected structure
    const mockSummary = {
      totalVehicles: 5,
      activeVehicles: 4,
      vehiclesInService: 4,
      vehiclesInMaintenance: 1,
      overdueMaintenance: 0,
      activeAlerts: 2,
      avgUtilization: 75.5,
      totalRevenue30d: 125000
    };

    const mockVehicles = [
      {
        id: 'VEH001',
        code: 'VEH001',
        plateNumber: 'ABC 1234',
        make: 'Toyota',
        model: 'Vios',
        year: 2020,
        ownershipType: 'xpress_owned',
        status: 'active',
        category: 'sedan',
        fuelType: 'gasoline',
        currentDriver: 'Carlos Rodriguez',
        assignedDriversCount: 2,
        currentLocation: 'Makati CBD',
        avgUtilization30d: 85,
        monthlyRevenue: 24500,
        totalTrips: 1247,
        avgRating: 4.8,
        lastMaintenanceDate: '2024-11-15',
        nextMaintenanceDue: '2025-02-15',
        maintenanceStatus: 'current',
        hasActiveAlerts: false,
        carbonFootprint30d: 2.1
      },
      {
        id: 'VEH002',
        code: 'VEH002',
        plateNumber: 'XYZ 5678',
        make: 'Honda',
        model: 'City',
        year: 2019,
        ownershipType: 'operator_owned',
        status: 'active',
        category: 'sedan',
        fuelType: 'gasoline',
        currentDriver: 'Juan Dela Cruz',
        assignedDriversCount: 1,
        currentLocation: 'BGC',
        avgUtilization30d: 72,
        monthlyRevenue: 18900,
        totalTrips: 892,
        avgRating: 4.6,
        lastMaintenanceDate: null,
        nextMaintenanceDue: 'Contact Owner',
        maintenanceStatus: 'external',
        hasActiveAlerts: true,
        carbonFootprint30d: 2.3
      },
      {
        id: 'VEH003',
        code: 'VEH003',
        plateNumber: 'EV 9999',
        make: 'Nissan',
        model: 'Leaf',
        year: 2021,
        ownershipType: 'fleet_owned',
        status: 'active',
        category: 'sedan',
        fuelType: 'electric',
        currentDriver: 'Ana Rodriguez',
        assignedDriversCount: 3,
        currentLocation: 'Ortigas',
        avgUtilization30d: 90,
        monthlyRevenue: 27800,
        totalTrips: 1456,
        avgRating: 4.9,
        lastMaintenanceDate: '2024-12-01',
        nextMaintenanceDue: '2025-03-01',
        maintenanceStatus: 'current',
        hasActiveAlerts: false,
        carbonFootprint30d: 0.0
      },
      {
        id: 'VEH004',
        code: 'VEH004',
        plateNumber: 'MC 1122',
        make: 'Yamaha',
        model: 'NMAX',
        year: 2022,
        ownershipType: 'driver_owned',
        status: 'inactive',
        category: 'motorcycle',
        fuelType: 'gasoline',
        currentDriver: 'Pedro Miguel',
        assignedDriversCount: 1,
        currentLocation: 'Quezon City',
        avgUtilization30d: 45,
        monthlyRevenue: 6500,
        totalTrips: 234,
        avgRating: 4.3,
        lastMaintenanceDate: null,
        nextMaintenanceDue: 'Driver Responsibility',
        maintenanceStatus: 'external',
        hasActiveAlerts: false,
        carbonFootprint30d: 0.8
      },
      {
        id: 'VEH005',
        code: 'VEH005',
        plateNumber: 'VAN 123',
        make: 'Toyota',
        model: 'Hiace',
        year: 2018,
        ownershipType: 'fleet_owned',
        status: 'maintenance',
        category: 'van',
        fuelType: 'diesel',
        currentDriver: null,
        assignedDriversCount: 4,
        currentLocation: 'Service Center',
        avgUtilization30d: 0,
        monthlyRevenue: 0,
        totalTrips: 2156,
        avgRating: 4.7,
        lastMaintenanceDate: '2024-12-03',
        nextMaintenanceDue: '2024-12-15',
        maintenanceStatus: 'in_progress',
        hasActiveAlerts: true,
        carbonFootprint30d: 3.2
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        summary: mockSummary,
        vehicles: mockVehicles
      },
      meta: {
        total: mockVehicles.length,
        page: 1,
        limit: 10,
        hasNext: false
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch vehicle data'
      }
    }, { status: 500 });
  }
}