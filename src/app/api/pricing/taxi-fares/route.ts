import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'xpress_ops.db');

// GET /api/pricing/taxi-fares - List taxi fares
export async function GET(request: NextRequest) {
  try {
    const fares = await new Promise<any[]>((resolve, reject) => {
      const db = new sqlite3.Database(DB_PATH);
      
      db.all(`
        SELECT 
          tf.*,
          pp.name as profile_name,
          pp.region_id,
          pp.status as profile_status
        FROM taxi_fares tf
        JOIN pricing_profiles pp ON tf.profile_id = pp.id
        ORDER BY pp.region_id
      `, (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
    
    return NextResponse.json(fares);

  } catch (error) {
    console.error('Taxi fares GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch taxi fares' },
      { status: 500 }
    );
  }
}

// POST /api/pricing/taxi-fares - Create or update taxi fare
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      profile_id,
      flagdown,
      per_km,
      per_min,
      night_surcharge_pct = 0,
      airport_surcharge = 0,
      event_surcharge = 0,
      holiday_surcharge = 0,
      xpress_booking_fee_flat = 69.00,
      xpress_booking_fee_pct = 0,
      ltfrb_compliant = 1,
      surge_blocked = 1,
      other_surcharges = '{}'
    } = body;

    if (!profile_id || !flagdown || !per_km || !per_min) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await new Promise<any>((resolve, reject) => {
      const db = new sqlite3.Database(DB_PATH);
      
      // Check if fare already exists for this profile
      db.get(
        'SELECT id FROM taxi_fares WHERE profile_id = ?',
        [profile_id],
        (err, existing) => {
          if (err) {
            db.close();
            reject(err);
            return;
          }
          
          if (existing) {
            // Update existing fare
            db.run(`
              UPDATE taxi_fares 
              SET flagdown = ?, per_km = ?, per_min = ?, night_surcharge_pct = ?, airport_surcharge = ?,
                  event_surcharge = ?, holiday_surcharge = ?, xpress_booking_fee_flat = ?, 
                  xpress_booking_fee_pct = ?, ltfrb_compliant = ?, surge_blocked = ?, other_surcharges = ?
              WHERE id = ?
            `, [flagdown, per_km, per_min, night_surcharge_pct, airport_surcharge, event_surcharge, 
                holiday_surcharge, xpress_booking_fee_flat, xpress_booking_fee_pct, ltfrb_compliant, 
                surge_blocked, other_surcharges, existing.id], (err) => {
              db.close();
              if (err) {
                reject(err);
              } else {
                resolve({ message: 'Taxi fare updated successfully' });
              }
            });
          } else {
            // Create new fare
            db.run(`
              INSERT INTO taxi_fares (
                profile_id, flagdown, per_km, per_min, night_surcharge_pct, airport_surcharge,
                event_surcharge, holiday_surcharge, xpress_booking_fee_flat, xpress_booking_fee_pct,
                ltfrb_compliant, surge_blocked, other_surcharges
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [profile_id, flagdown, per_km, per_min, night_surcharge_pct, airport_surcharge, 
                event_surcharge, holiday_surcharge, xpress_booking_fee_flat, xpress_booking_fee_pct,
                ltfrb_compliant, surge_blocked, other_surcharges], function(err) {
              db.close();
              if (err) {
                reject(err);
              } else {
                resolve({
                  id: this.lastID,
                  message: 'Taxi fare created successfully'
                });
              }
            });
          }
        }
      );
    });

    return NextResponse.json(result, { status: result.id ? 201 : 200 });

  } catch (error) {
    console.error('Taxi fares POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create/update taxi fare' },
      { status: 500 }
    );
  }
}