import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'xpress_ops.db');

// GET /api/pricing/tolls - List tolls
export async function GET(request: NextRequest) {
  try {
    const tolls = await new Promise<any[]>((resolve, reject) => {
      const db = new sqlite3.Database(DB_PATH);
      
      db.all(`
        SELECT * FROM tolls
        ORDER BY region_id, name
      `, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
    
    return NextResponse.json(tolls);

  } catch (error) {
    console.error('Tolls GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tolls' },
      { status: 500 }
    );
  }
}

// POST /api/pricing/tolls - Create new toll
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      name,
      route_code,
      amount,
      region_id,
      origin_lat,
      origin_lng,
      destination_lat,
      destination_lng,
      auto_detect = true,
      detection_radius_meters = 500,
      active = true
    } = body;

    if (!name || !route_code || !amount || !region_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, route_code, amount, region_id' },
        { status: 400 }
      );
    }

    const result = await new Promise<any>((resolve, reject) => {
      const db = new sqlite3.Database(DB_PATH);
      
      // Check if route code already exists
      db.get(
        'SELECT id FROM tolls WHERE route_code = ?',
        [route_code],
        (err, existing) => {
          if (err) {
            db.close();
            reject(err);
            return;
          }
          
          if (existing) {
            db.close();
            reject(new Error('Route code already exists'));
            return;
          }
          
          // Create new toll
          db.run(`
            INSERT INTO tolls (
              name, route_code, amount, region_id, origin_lat, origin_lng,
              destination_lat, destination_lng, auto_detect, detection_radius_meters, active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [name, route_code, amount, region_id, origin_lat || null, origin_lng || null, 
              destination_lat || null, destination_lng || null, auto_detect ? 1 : 0, 
              detection_radius_meters, active ? 1 : 0], function(err) {
            db.close();
            if (err) {
              reject(err);
            } else {
              resolve({
                id: this.lastID,
                message: 'Toll created successfully'
              });
            }
          });
        }
      );
    });

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Tolls POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create toll' },
      { status: 500 }
    );
  }
}

