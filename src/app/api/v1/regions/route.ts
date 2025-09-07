import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

interface Region {
  id: string;
  name: string;
  code: string;
  status: string;
  country_code: string;
  timezone: string;
  currency: string;
  description?: string;
  geographic_bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  cities: string[];
  active_profiles_count: number;
  total_profiles_count: number;
}

// GET /api/v1/regions - List all regions with pricing profile counts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    const db = getDatabase();
    
    // Get regions with profile counts
    let query = `
      SELECT 
        r.region_id as id,
        r.name,
        r.region_code as code,
        r.region_state as status,
        r.country_code,
        r.timezone,
        r.currency_code as currency,
        r.description,
        r.geographic_bounds,
        r.cities,
        COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active_profiles_count,
        COUNT(p.id) as total_profiles_count
      FROM regions r
      LEFT JOIN pricing_profiles_v4 p ON r.region_id = p.region_id
    `;
    
    if (!includeInactive) {
      query += ` WHERE r.region_state = 'active'`;
    }
    
    query += `
      GROUP BY r.region_id, r.name, r.region_code, r.region_state, r.country_code, 
               r.timezone, r.currency_code, r.description, r.geographic_bounds, r.cities
      ORDER BY r.name
    `;

    const regions = await db.all(query);
    
    // Transform the data
    const transformedRegions = regions.map(region => ({
      ...region,
      geographic_bounds: region.geographic_bounds ? JSON.parse(region.geographic_bounds) : null,
      cities: region.cities ? JSON.parse(region.cities) : [],
      active_profiles_count: Number(region.active_profiles_count) || 0,
      total_profiles_count: Number(region.total_profiles_count) || 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        regions: transformedRegions,
        total: transformedRegions.length,
        metadata: {
          total_active_profiles: transformedRegions.reduce((sum, r) => sum + r.active_profiles_count, 0),
          total_all_profiles: transformedRegions.reduce((sum, r) => sum + r.total_profiles_count, 0)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching regions:', error);
    
    // Fallback to mock data if database fails
    const mockRegions = [
      {
        id: 'NCR',
        name: 'National Capital Region',
        code: 'NCR',
        status: 'active',
        country_code: 'PH',
        timezone: 'Asia/Manila',
        currency: 'PHP',
        description: 'Metro Manila and surrounding areas',
        geographic_bounds: {
          north: 14.7642,
          south: 14.4896,
          east: 121.1300,
          west: 120.9620
        },
        cities: ['Manila', 'Quezon City', 'Makati', 'Taguig', 'Pasig', 'Mandaluyong', 'BGC', 'Ortigas'],
        active_profiles_count: 3,
        total_profiles_count: 5
      },
      {
        id: 'R3',
        name: 'Central Luzon',
        code: 'R3',
        status: 'active',
        country_code: 'PH',
        timezone: 'Asia/Manila',
        currency: 'PHP',
        description: 'Central Luzon provinces including Pampanga, Bulacan',
        geographic_bounds: {
          north: 16.0000,
          south: 14.5000,
          east: 121.5000,
          west: 119.5000
        },
        cities: ['Clark', 'Angeles', 'San Fernando', 'Malolos', 'Cabanatuan'],
        active_profiles_count: 2,
        total_profiles_count: 3
      },
      {
        id: 'R4A',
        name: 'CALABARZON',
        code: 'R4A',
        status: 'active',
        country_code: 'PH',
        timezone: 'Asia/Manila',
        currency: 'PHP',
        description: 'Cavite, Laguna, Batangas, Rizal, Quezon provinces',
        geographic_bounds: {
          north: 15.0000,
          south: 13.0000,
          east: 122.0000,
          west: 120.5000
        },
        cities: ['Antipolo', 'Dasmarinas', 'Bacoor', 'Santa Rosa', 'Batangas City'],
        active_profiles_count: 1,
        total_profiles_count: 2
      },
      {
        id: 'R7',
        name: 'Central Visayas',
        code: 'R7',
        status: 'active',
        country_code: 'PH',
        timezone: 'Asia/Manila',
        currency: 'PHP',
        description: 'Cebu, Bohol, Negros Oriental, Siquijor',
        geographic_bounds: {
          north: 11.5000,
          south: 8.5000,
          east: 125.0000,
          west: 123.0000
        },
        cities: ['Cebu City', 'Lapu-Lapu', 'Mandaue', 'Talisay', 'Dumaguete'],
        active_profiles_count: 2,
        total_profiles_count: 4
      },
      {
        id: 'R11',
        name: 'Davao Region',
        code: 'R11',
        status: 'active',
        country_code: 'PH',
        timezone: 'Asia/Manila',
        currency: 'PHP',
        description: 'Davao provinces in Mindanao',
        geographic_bounds: {
          north: 8.0000,
          south: 5.0000,
          east: 126.5000,
          west: 124.5000
        },
        cities: ['Davao City', 'Tagum', 'Panabo', 'Samal', 'Digos'],
        active_profiles_count: 1,
        total_profiles_count: 2
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        regions: mockRegions,
        total: mockRegions.length,
        metadata: {
          total_active_profiles: mockRegions.reduce((sum, r) => sum + r.active_profiles_count, 0),
          total_all_profiles: mockRegions.reduce((sum, r) => sum + r.total_profiles_count, 0)
        }
      }
    });
  }
}

// POST /api/v1/regions - Create new region (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      country_code = 'PH',
      timezone = 'Asia/Manila',
      currency = 'PHP',
      description,
      geographic_bounds,
      cities = []
    } = body;

    if (!name || !code) {
      return NextResponse.json({
        success: false,
        error: 'Name and code are required'
      }, { status: 400 });
    }

    const db = getDatabase();
    
    // Check if region already exists
    const existing = await db.get(`
      SELECT region_id FROM regions WHERE region_code = ? OR name = ?
    `, [code, name]);

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Region with this code or name already exists'
      }, { status: 409 });
    }

    // Create new region
    const result = await db.run(`
      INSERT INTO regions (
        region_id, name, region_code, region_state, country_code,
        timezone, currency_code, description, geographic_bounds, cities
      ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)
    `, [
      code,
      name,
      code,
      country_code,
      timezone,
      currency,
      description,
      geographic_bounds ? JSON.stringify(geographic_bounds) : null,
      JSON.stringify(cities)
    ]);

    const newRegion = await db.get(`
      SELECT 
        region_id as id, name, region_code as code, region_state as status,
        country_code, timezone, currency_code as currency, description,
        geographic_bounds, cities
      FROM regions WHERE rowid = ?
    `, [result.lastID]);

    return NextResponse.json({
      success: true,
      data: {
        region: {
          ...newRegion,
          geographic_bounds: newRegion.geographic_bounds ? JSON.parse(newRegion.geographic_bounds) : null,
          cities: newRegion.cities ? JSON.parse(newRegion.cities) : [],
          active_profiles_count: 0,
          total_profiles_count: 0
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating region:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create region'
    }, { status: 500 });
  }
}