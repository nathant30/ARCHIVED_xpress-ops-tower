// /api/vehicles - Vehicle Management API
// Comprehensive CRUD operations for vehicle lifecycle management
// Supports 4 ownership models with RBAC-enforced data access

import { NextRequest } from 'next/server';
import { 
  createApiResponse, 
  createApiError,
  createValidationError,
  createNotFoundError,
  parseQueryParams,
  parsePaginationParams,
  applyPagination,
  validateRequiredFields,
  checkRateLimit,
  asyncHandler,
  handleOptionsRequest
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { withVehicleAuth, VehicleAuthConfigs, maskVehicleData } from '@/middleware/vehicleRbacMiddleware';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';
import { versionedApiRoute, createVersionedResponse } from '@/middleware/apiVersioning';
import database from '@/lib/database';
import { 
  Vehicle, 
  CreateVehicleRequest, 
  UpdateVehicleRequest, 
  VehicleFilterParams,
  VehicleDashboardItem 
} from '@/types/vehicles';

/**
 * Database-backed vehicle service with optimized queries to prevent N+1 patterns.
 * Provides comprehensive CRUD operations for vehicle lifecycle management with 
 * RBAC-enforced data access across 4 ownership models.
 */
class VehicleService {

  /**
   * Retrieves vehicles with advanced filtering and security enforcement.
   * 
   * @description Fetches vehicles from the database with comprehensive filtering capabilities.
   * Uses parameterized queries to prevent SQL injection and optimized WHERE clauses for performance.
   * Supports complex search patterns across multiple vehicle attributes.
   * 
   * @param {VehicleFilterParams} filters - Filtering criteria for vehicles
   * @param {VehicleOwnershipType} [filters.ownershipType] - Filter by vehicle ownership model
   * @param {VehicleStatus} [filters.status] - Filter by operational status
   * @param {string} [filters.regionId] - Filter by operating region
   * @param {VehicleCategory} [filters.category] - Filter by vehicle type/category
   * @param {FuelType} [filters.fuelType] - Filter by fuel/energy source
   * @param {string} [filters.make] - Filter by vehicle manufacturer (partial match)
   * @param {string} [filters.search] - Global search across code, plate, make, model
   * @param {boolean} [filters.hasActiveAlerts] - Filter vehicles with maintenance alerts
   * 
   * @returns {Promise<Vehicle[]>} Array of vehicles matching the filter criteria
   * 
   * @throws {Error} When database query fails or connection issues occur
   * 
   * @example
   * ```typescript
   * // Get all active vehicles in Metro Manila
   * const vehicles = await VehicleService.getVehicles({
   *   status: 'active',
   *   regionId: 'region-manila'
   * });
   * 
   * // Search for Toyota vehicles with alerts
   * const alertVehicles = await VehicleService.getVehicles({
   *   make: 'toyota',
   *   hasActiveAlerts: true
   * });
   * ```
   * 
   * @security SQL injection prevention through parameterized queries
   * @performance Optimized WHERE clause construction, indexed column filtering
   */
  static async getVehicles(filters: VehicleFilterParams = {}): Promise<Vehicle[]> {
    try {
      // Build WHERE clause with parameterized queries to prevent SQL injection
      const whereConditions: string[] = ['v.is_active = TRUE'];
      const params: any[] = [];
      let paramCount = 0;

      if (filters.ownershipType) {
        whereConditions.push(`v.ownership_type = $${++paramCount}`);
        params.push(filters.ownershipType);
      }

      if (filters.status) {
        whereConditions.push(`v.status = $${++paramCount}`);
        params.push(filters.status);
      }

      if (filters.regionId) {
        whereConditions.push(`v.region_id = $${++paramCount}`);
        params.push(filters.regionId);
      }

      if (filters.category) {
        whereConditions.push(`v.category = $${++paramCount}`);
        params.push(filters.category);
      }

      if (filters.fuelType) {
        whereConditions.push(`v.fuel_type = $${++paramCount}`);
        params.push(filters.fuelType);
      }

      if (filters.make) {
        whereConditions.push(`LOWER(v.make) LIKE LOWER($${++paramCount})`);
        params.push(`%${filters.make}%`);
      }

      if (filters.search) {
        whereConditions.push(`(
          LOWER(v.vehicle_code) LIKE LOWER($${++paramCount}) OR
          LOWER(v.license_plate) LIKE LOWER($${paramCount}) OR
          LOWER(v.make) LIKE LOWER($${paramCount}) OR
          LOWER(v.model) LIKE LOWER($${paramCount})
        )`);
        params.push(`%${filters.search}%`);
      }

      if (filters.hasActiveAlerts) {
        whereConditions.push(`v.maintenance_alerts_count > 0`);
      }

      const whereClause = whereConditions.join(' AND ');
      
      const query = `
        SELECT 
          v.id,
          v.vehicle_code as "vehicleCode",
          v.license_plate as "licensePlate",
          v.vin,
          v.make,
          v.model,
          v.year,
          v.color,
          v.category,
          v.fuel_type as "fuelType",
          v.engine_displacement as "engineDisplacement",
          v.seating_capacity as "seatingCapacity",
          v.cargo_capacity_kg as "cargoCapacityKg",
          v.ownership_type as "ownershipType",
          v.fleet_owner_name as "fleetOwnerName",
          v.operator_owner_name as "operatorOwnerName",
          v.status,
          v.condition_rating as "conditionRating",
          v.condition_score as "conditionScore",
          v.region_id as "regionId",
          v.acquisition_cost as "acquisitionCost",
          v.current_market_value as "currentMarketValue",
          v.monthly_depreciation as "monthlyDepreciation",
          v.insurance_value as "insuranceValue",
          v.or_number as "orNumber",
          v.cr_number as "crNumber",
          v.registration_expiry as "registrationExpiry",
          v.ltfrb_franchise_number as "ltfrbFranchiseNumber",
          v.ltfrb_franchise_expiry as "ltfrbFranchiseExpiry",
          v.insurance_provider as "insuranceProvider",
          v.insurance_policy_number as "insurancePolicyNumber",
          v.insurance_expiry as "insuranceExpiry",
          v.insurance_coverage_amount as "insuranceCoverageAmount",
          v.obd_device_installed as "obdDeviceInstalled",
          v.obd_device_serial as "obdDeviceSerial",
          v.telematics_provider as "telematicsProvider",
          v.telematics_plan as "telematicsPlan",
          v.service_types as "serviceTypes",
          v.max_trip_distance_km as "maxTripDistanceKm",
          v.last_maintenance_date as "lastMaintenanceDate",
          v.next_maintenance_due as "nextMaintenanceDue",
          v.total_maintenance_cost as "totalMaintenanceCost",
          v.maintenance_alerts_count as "maintenanceAlertsCount",
          v.total_distance_km as "totalDistanceKm",
          v.total_trips as "totalTrips",
          v.average_rating as "averageRating",
          v.fuel_efficiency_kmpl as "fuelEfficiencyKmpl",
          v.carbon_emissions_kg as "carbonEmissionsKg",
          v.daily_operating_hours as "dailyOperatingHours",
          v.utilization_rate as "utilizationRate",
          v.availability_score as "availabilityScore",
          v.emergency_contacts as "emergencyContacts",
          v.safety_features as "safetyFeatures",
          v.accident_count as "accidentCount",
          v.created_at as "createdAt",
          v.updated_at as "updatedAt",
          v.created_by as "createdBy",
          v.updated_by as "updatedBy",
          v.is_active as "isActive"
        FROM vehicles v
        WHERE ${whereClause}
        ORDER BY v.updated_at DESC
      `;

      const result = await database.query(query, params, { 
        operation: 'getVehicles',
        skipSanitization: true // Query is already parameterized
      });
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw new Error('Failed to fetch vehicles');
    }
  }

  static async getVehicleById(id: string): Promise<Vehicle | null> {
    try {
      const query = `
        SELECT 
          v.id,
          v.vehicle_code as "vehicleCode",
          v.license_plate as "licensePlate",
          v.vin,
          v.make,
          v.model,
          v.year,
          v.color,
          v.category,
          v.fuel_type as "fuelType",
          v.engine_displacement as "engineDisplacement",
          v.seating_capacity as "seatingCapacity",
          v.cargo_capacity_kg as "cargoCapacityKg",
          v.ownership_type as "ownershipType",
          v.fleet_owner_name as "fleetOwnerName",
          v.operator_owner_name as "operatorOwnerName",
          v.status,
          v.condition_rating as "conditionRating",
          v.condition_score as "conditionScore",
          v.region_id as "regionId",
          v.acquisition_cost as "acquisitionCost",
          v.current_market_value as "currentMarketValue",
          v.monthly_depreciation as "monthlyDepreciation",
          v.insurance_value as "insuranceValue",
          v.or_number as "orNumber",
          v.cr_number as "crNumber",
          v.registration_expiry as "registrationExpiry",
          v.ltfrb_franchise_number as "ltfrbFranchiseNumber",
          v.ltfrb_franchise_expiry as "ltfrbFranchiseExpiry",
          v.insurance_provider as "insuranceProvider",
          v.insurance_policy_number as "insurancePolicyNumber",
          v.insurance_expiry as "insuranceExpiry",
          v.insurance_coverage_amount as "insuranceCoverageAmount",
          v.obd_device_installed as "obdDeviceInstalled",
          v.obd_device_serial as "obdDeviceSerial",
          v.telematics_provider as "telematicsProvider",
          v.telematics_plan as "telematicsPlan",
          v.service_types as "serviceTypes",
          v.max_trip_distance_km as "maxTripDistanceKm",
          v.last_maintenance_date as "lastMaintenanceDate",
          v.next_maintenance_due as "nextMaintenanceDue",
          v.total_maintenance_cost as "totalMaintenanceCost",
          v.maintenance_alerts_count as "maintenanceAlertsCount",
          v.total_distance_km as "totalDistanceKm",
          v.total_trips as "totalTrips",
          v.average_rating as "averageRating",
          v.fuel_efficiency_kmpl as "fuelEfficiencyKmpl",
          v.carbon_emissions_kg as "carbonEmissionsKg",
          v.daily_operating_hours as "dailyOperatingHours",
          v.utilization_rate as "utilizationRate",
          v.availability_score as "availabilityScore",
          v.emergency_contacts as "emergencyContacts",
          v.safety_features as "safetyFeatures",
          v.accident_count as "accidentCount",
          v.created_at as "createdAt",
          v.updated_at as "updatedAt",
          v.created_by as "createdBy",
          v.updated_by as "updatedBy",
          v.is_active as "isActive"
        FROM vehicles v
        WHERE v.id = $1 AND v.is_active = TRUE
      `;

      const result = await database.query(query, [id], { 
        operation: 'getVehicleById',
        skipSanitization: true
      });
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching vehicle by ID:', error);
      throw new Error('Failed to fetch vehicle');
    }
  }

  static async createVehicle(data: CreateVehicleRequest, createdBy: string): Promise<Vehicle> {
    try {
      const query = `
        INSERT INTO vehicles (
          vehicle_code, license_plate, vin, make, model, year, color, category, fuel_type,
          engine_displacement, seating_capacity, cargo_capacity_kg, ownership_type,
          fleet_owner_name, operator_owner_name, status, condition_rating, condition_score,
          region_id, acquisition_cost, registration_expiry, insurance_expiry,
          obd_device_installed, service_types, max_trip_distance_km,
          total_maintenance_cost, maintenance_alerts_count, total_distance_km,
          total_trips, average_rating, carbon_emissions_kg, daily_operating_hours,
          utilization_rate, availability_score, emergency_contacts, safety_features,
          accident_count, created_by, is_active
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
          $35, $36, $37, $38, $39, $40
        )
        RETURNING 
          id,
          vehicle_code as "vehicleCode",
          license_plate as "licensePlate",
          vin,
          make,
          model,
          year,
          color,
          category,
          fuel_type as "fuelType",
          engine_displacement as "engineDisplacement",
          seating_capacity as "seatingCapacity",
          cargo_capacity_kg as "cargoCapacityKg",
          ownership_type as "ownershipType",
          fleet_owner_name as "fleetOwnerName",
          operator_owner_name as "operatorOwnerName",
          status,
          condition_rating as "conditionRating",
          condition_score as "conditionScore",
          region_id as "regionId",
          acquisition_cost as "acquisitionCost",
          registration_expiry as "registrationExpiry",
          insurance_expiry as "insuranceExpiry",
          obd_device_installed as "obdDeviceInstalled",
          service_types as "serviceTypes",
          max_trip_distance_km as "maxTripDistanceKm",
          total_maintenance_cost as "totalMaintenanceCost",
          maintenance_alerts_count as "maintenanceAlertsCount",
          total_distance_km as "totalDistanceKm",
          total_trips as "totalTrips",
          average_rating as "averageRating",
          carbon_emissions_kg as "carbonEmissionsKg",
          daily_operating_hours as "dailyOperatingHours",
          utilization_rate as "utilizationRate",
          availability_score as "availabilityScore",
          emergency_contacts as "emergencyContacts",
          safety_features as "safetyFeatures",
          accident_count as "accidentCount",
          created_at as "createdAt",
          updated_at as "updatedAt",
          created_by as "createdBy",
          is_active as "isActive"
      `;

      const params = [
        data.vehicleCode,
        data.licensePlate,
        data.vin || null,
        data.make,
        data.model,
        data.year,
        data.color,
        data.category,
        data.fuelType,
        data.engineDisplacement || null,
        data.seatingCapacity,
        data.cargoCapacityKg || null,
        data.ownershipType,
        data.fleetOwnerName || null,
        data.operatorOwnerName || null,
        'inactive', // New vehicles start inactive until inspection
        'good',
        85.0,
        data.regionId,
        data.acquisitionCost || null,
        data.registrationExpiry,
        data.insuranceExpiry || null,
        data.obdDeviceInstalled || false,
        data.serviceTypes,
        100, // Default max trip distance
        0, // Default total maintenance cost
        0, // Default maintenance alerts count
        0, // Default total distance
        0, // Default total trips
        5.0, // Default average rating
        0, // Default carbon emissions
        12, // Default daily operating hours
        0, // Default utilization rate
        100.0, // Default availability score
        JSON.stringify([]), // Empty emergency contacts array
        JSON.stringify({}), // Empty safety features object
        0, // Default accident count
        createdBy,
        true // is_active
      ];

      const result = await database.query(query, params, { 
        operation: 'createVehicle',
        skipSanitization: true
      });
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw new Error('Failed to create vehicle');
    }
  }

  static async updateVehicle(id: string, data: UpdateVehicleRequest, updatedBy: string): Promise<Vehicle | null> {
    try {
      // Build SET clause dynamically based on provided data
      const setFields: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      // Only update fields that are provided
      const fieldMap = {
        vehicleCode: 'vehicle_code',
        licensePlate: 'license_plate', 
        vin: 'vin',
        make: 'make',
        model: 'model',
        year: 'year',
        color: 'color',
        category: 'category',
        fuelType: 'fuel_type',
        engineDisplacement: 'engine_displacement',
        seatingCapacity: 'seating_capacity',
        cargoCapacityKg: 'cargo_capacity_kg',
        ownershipType: 'ownership_type',
        fleetOwnerName: 'fleet_owner_name',
        operatorOwnerName: 'operator_owner_name',
        status: 'status',
        conditionRating: 'condition_rating',
        conditionScore: 'condition_score',
        regionId: 'region_id',
        acquisitionCost: 'acquisition_cost',
        registrationExpiry: 'registration_expiry',
        insuranceExpiry: 'insurance_expiry',
        obdDeviceInstalled: 'obd_device_installed',
        serviceTypes: 'service_types',
        nextMaintenanceDue: 'next_maintenance_due'
      };

      Object.entries(fieldMap).forEach(([jsField, dbField]) => {
        if ((data as any)[jsField] !== undefined) {
          setFields.push(`${dbField} = $${++paramCount}`);
          params.push((data as any)[jsField]);
        }
      });

      if (setFields.length === 0) {
        // No fields to update, just return the existing vehicle
        return await this.getVehicleById(id);
      }

      // Always update the updated_at and updated_by fields
      setFields.push(`updated_at = NOW()`);
      setFields.push(`updated_by = $${++paramCount}`);
      params.push(updatedBy);

      // Add the id parameter for the WHERE clause
      params.push(id);
      const idParamIndex = params.length;

      const query = `
        UPDATE vehicles 
        SET ${setFields.join(', ')}
        WHERE id = $${idParamIndex} AND is_active = TRUE
        RETURNING 
          id,
          vehicle_code as "vehicleCode",
          license_plate as "licensePlate",
          vin,
          make,
          model,
          year,
          color,
          category,
          fuel_type as "fuelType",
          engine_displacement as "engineDisplacement",
          seating_capacity as "seatingCapacity",
          cargo_capacity_kg as "cargoCapacityKg",
          ownership_type as "ownershipType",
          fleet_owner_name as "fleetOwnerName",
          operator_owner_name as "operatorOwnerName",
          status,
          condition_rating as "conditionRating",
          condition_score as "conditionScore",
          region_id as "regionId",
          acquisition_cost as "acquisitionCost",
          registration_expiry as "registrationExpiry",
          insurance_expiry as "insuranceExpiry",
          obd_device_installed as "obdDeviceInstalled",
          service_types as "serviceTypes",
          max_trip_distance_km as "maxTripDistanceKm",
          next_maintenance_due as "nextMaintenanceDue",
          total_maintenance_cost as "totalMaintenanceCost",
          maintenance_alerts_count as "maintenanceAlertsCount",
          total_distance_km as "totalDistanceKm",
          total_trips as "totalTrips",
          average_rating as "averageRating",
          fuel_efficiency_kmpl as "fuelEfficiencyKmpl",
          carbon_emissions_kg as "carbonEmissionsKg",
          daily_operating_hours as "dailyOperatingHours",
          utilization_rate as "utilizationRate",
          availability_score as "availabilityScore",
          emergency_contacts as "emergencyContacts",
          safety_features as "safetyFeatures",
          accident_count as "accidentCount",
          created_at as "createdAt",
          updated_at as "updatedAt",
          created_by as "createdBy",
          updated_by as "updatedBy",
          is_active as "isActive"
      `;

      const result = await database.query(query, params, { 
        operation: 'updateVehicle',
        skipSanitization: true
      });
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw new Error('Failed to update vehicle');
    }
  }

  static async deleteVehicle(id: string): Promise<boolean> {
    try {
      const query = `
        UPDATE vehicles 
        SET 
          is_active = FALSE,
          status = 'decommissioned',
          updated_at = NOW()
        WHERE id = $1 AND is_active = TRUE
      `;

      const result = await database.query(query, [id], { 
        operation: 'deleteVehicle',
        skipSanitization: true
      });
      
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw new Error('Failed to delete vehicle');
    }
  }

  /**
   * Retrieves optimized dashboard data for vehicle fleet management.
   * 
   * @description PERFORMANCE OPTIMIZED: Fixes N+1 query pattern by using a single 
   * JOIN-based query through the `v_vehicle_dashboard` view. This eliminates the need 
   * for separate driver queries per vehicle and consolidates all dashboard metrics 
   * into one efficient database call.
   * 
   * The dashboard view pre-calculates:
   * - 30-day performance metrics (trips, revenue, utilization)
   * - Current driver assignments with assignment types
   * - Maintenance status and upcoming due dates
   * - Active alerts (maintenance + compliance)
   * - OBD device connectivity status
   * - Compliance status including franchise expiry dates
   * 
   * @param {string} [regionId] - Optional region filter to limit results to specific region
   * 
   * @returns {Promise<VehicleDashboardItem[]>} Array of dashboard items with pre-calculated metrics
   * 
   * @throws {Error} When database view query fails or access is denied
   * 
   * @example
   * ```typescript
   * // Get dashboard data for all regions
   * const allVehicles = await VehicleService.getDashboardData();
   * 
   * // Get dashboard data for Metro Manila only
   * const manilaVehicles = await VehicleService.getDashboardData('region-manila');
   * ```
   * 
   * @performance Uses optimized database view with pre-joined tables
   * @security Region-based filtering enforced at query level
   * @analytics Provides real-time operational metrics for fleet management
   */
  static async getDashboardData(regionId?: string): Promise<VehicleDashboardItem[]> {
    try {
      // Use the optimized dashboard view that joins all necessary tables in one query
      let query = `
        SELECT 
          vd.id,
          vd.vehicle_code as "vehicleCode",
          vd.license_plate as "licensePlate",
          vd.make,
          vd.model,
          vd.year,
          vd.ownership_type as "ownershipType",
          vd.status,
          vd.condition_rating as "conditionRating",
          vd.region_id as "regionId",
          vd.region_name as "regionName",
          vd.current_driver_id as "currentDriverId",
          vd.current_driver_name as "currentDriverName",
          vd.assignment_type as "assignmentType",
          vd.total_trips_30d as "totalTrips30d",
          vd.avg_utilization_30d as "avgUtilization30d",
          vd.avg_fuel_efficiency_30d as "avgFuelEfficiency30d",
          vd.total_revenue_30d as "totalRevenue30d",
          vd.next_maintenance_due as "nextMaintenanceDue",
          vd.maintenance_status as "maintenanceStatus",
          vd.active_maintenance_alerts as "activeMaintenanceAlerts",
          vd.active_compliance_alerts as "activeComplianceAlerts",
          vd.obd_status as "obdStatus",
          vd.obd_last_connection as "obdLastConnection",
          vd.overall_compliance_status as "overallComplianceStatus",
          vd.franchise_expiry_date as "franchiseExpiryDate",
          vd.last_updated as "lastUpdated"
        FROM v_vehicle_dashboard vd
      `;
      
      const params: any[] = [];
      
      if (regionId) {
        query += ' WHERE vd.region_id = $1';
        params.push(regionId);
      }
      
      query += ' ORDER BY vd.last_updated DESC';

      const result = await database.query(query, params, { 
        operation: 'getDashboardData',
        skipSanitization: true // Query is parameterized and uses database view
      });
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error('Failed to fetch dashboard data');
    }
  }

  // These helper methods are no longer needed since the database view handles the logic
  // All calculations are now performed efficiently at the database level
}

// GET /api/vehicles - List all vehicles with filtering and pagination
const getVehiclesV1 = withVehicleAuth(VehicleAuthConfigs.viewBasic)(
  async (request: NextRequest, user, vehicleContext) => {
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limiting
  const rateLimitKey = `vehicles-get-${user.id}-${clientIP}`;
  const rateLimit = checkRateLimit(rateLimitKey, 100, 60 * 1000); // 100 requests per minute
  
  if (!rateLimit.allowed) {
    return createApiError(
      'Rate limit exceeded',
      'RATE_LIMIT_EXCEEDED',
      429,
      { resetTime: rateLimit.resetTime },
      '/api/vehicles',
      'GET'
    );
  }

  const queryParams = parseQueryParams(request) as VehicleFilterParams;
  const paginationParams = parsePaginationParams(request);
  
  // Apply regional filtering for users with regional restrictions
  const userRegions = user.allowedRegions || [];
  if (userRegions.length > 0 && userRegions[0] !== '*') {
    if (!queryParams.regionId || !userRegions.includes(queryParams.regionId)) {
      queryParams.regionId = userRegions[0]; // Use first allowed region
    }
  }
  
  // Get vehicles with filters
  const vehicles = await VehicleService.getVehicles(queryParams);
  
  // Apply sorting
  let sortedVehicles = [...vehicles];
  if (paginationParams.sortBy) {
    sortedVehicles.sort((a, b) => {
      const aValue = (a as any)[paginationParams.sortBy!];
      const bValue = (b as any)[paginationParams.sortBy!];
      
      if (aValue < bValue) return paginationParams.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return paginationParams.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  // Apply pagination
  const paginatedResult = applyPagination(
    sortedVehicles,
    paginationParams.page,
    paginationParams.limit
  );

  // Apply data masking based on user permissions
  const maskedFields = (request as any).__maskedFields || [];
  if (maskedFields.length > 0) {
    paginatedResult.data = paginatedResult.data.map(vehicle => 
      maskVehicleData(vehicle, maskedFields)
    );
  }
  
  // Audit successful access
  await auditLogger.logEvent(
    AuditEventType.DATA_ACCESS,
    SecurityLevel.LOW,
    'SUCCESS',
    { 
      resource: 'vehicles',
      action: 'list',
      filters: queryParams,
      resultCount: paginatedResult.data.length,
      regionAccess: vehicleContext.regionId,
      maskedFields
    },
    { 
      userId: user.id,
      resource: 'vehicles',
      action: 'view',
      ipAddress: clientIP
    }
  );
  
  return createVersionedResponse(paginatedResult, 'v1');
});

// GET /api/vehicles/dashboard - Dashboard view with summary data
const getDashboardV1 = withVehicleAuth({
  ...VehicleAuthConfigs.viewDetailed,
  requiredPermissions: ['view_vehicle_dashboard', 'view_vehicles_detailed']
})(async (request: NextRequest, user, vehicleContext) => {
  const queryParams = parseQueryParams(request);
  
  // Apply regional filtering
  const userRegions = user.allowedRegions || [];
  let regionFilter = queryParams.region as string;
  
  if (userRegions.length > 0 && userRegions[0] !== '*') {
    if (!regionFilter || !userRegions.includes(regionFilter)) {
      regionFilter = userRegions[0];
    }
  }
  
  const dashboardData = await VehicleService.getDashboardData(regionFilter);
  
  // Calculate summary statistics
  const summary = {
    totalVehicles: dashboardData.length,
    activeVehicles: dashboardData.filter(v => v.status === 'active').length,
    vehiclesInService: dashboardData.filter(v => v.status === 'in_service').length,
    vehiclesInMaintenance: dashboardData.filter(v => v.status === 'maintenance').length,
    overdueMaintenance: dashboardData.filter(v => v.maintenanceStatus === 'overdue').length,
    activeAlerts: dashboardData.reduce((sum, v) => sum + v.activeMaintenanceAlerts + v.activeComplianceAlerts, 0),
    avgUtilization: dashboardData.reduce((sum, v) => sum + v.avgUtilization30d, 0) / dashboardData.length || 0,
    totalRevenue30d: dashboardData.reduce((sum, v) => sum + v.totalRevenue30d, 0)
  };
  
  return createVersionedResponse({
    vehicles: dashboardData,
    summary
  }, 'v1');
});

// POST /api/vehicles - Create a new vehicle
const postVehiclesV1 = withVehicleAuth({
  requiredPermissions: ['create_vehicles'],
  dataClass: 'confidential',
  requireMFA: true,
  auditRequired: true
})(async (request: NextRequest, user, vehicleContext) => {
  let body: CreateVehicleRequest;
  
  try {
    body = await request.json() as CreateVehicleRequest;
  } catch (error) {
    return createApiError(
      'Invalid JSON in request body',
      'INVALID_JSON',
      400,
      undefined,
      '/api/vehicles',
      'POST'
    );
  }
  
  // Validate required fields
  const requiredFields = [
    'vehicleCode', 
    'licensePlate', 
    'make', 
    'model', 
    'year', 
    'color',
    'category',
    'fuelType',
    'seatingCapacity',
    'ownershipType',
    'regionId',
    'serviceTypes',
    'registrationExpiry'
  ];
  
  const validationErrors = validateRequiredFields(body, requiredFields);
  
  // Additional validation - FIXED: Restrict future years to current year + 1 (not +2)
  // This prevents registering vehicles with unrealistic future years beyond next model year
  const currentYear = new Date().getFullYear();
  const maxAllowedYear = currentYear + 1; // Only allow current year and next year
  
  if (body.year < 1990 || body.year > maxAllowedYear) {
    validationErrors.push({
      field: 'year',
      message: `Year must be between 1990 and ${maxAllowedYear}. Vehicles cannot be registered more than 1 year in advance.`,
      code: 'INVALID_YEAR_RANGE',
    });
  }
  
  if (body.seatingCapacity < 1 || body.seatingCapacity > 50) {
    validationErrors.push({
      field: 'seatingCapacity',
      message: 'Seating capacity must be between 1 and 50',
      code: 'INVALID_SEATING_CAPACITY',
    });
  }
  
  if (body.ownershipType === 'fleet_owned' && !body.fleetOwnerName) {
    validationErrors.push({
      field: 'fleetOwnerName',
      message: 'Fleet owner name is required for fleet-owned vehicles',
      code: 'REQUIRED_FOR_FLEET_OWNED',
    });
  }
  
  if (body.ownershipType === 'operator_owned' && !body.operatorOwnerName) {
    validationErrors.push({
      field: 'operatorOwnerName',
      message: 'Operator owner name is required for operator-owned vehicles',
      code: 'REQUIRED_FOR_OPERATOR_OWNED',
    });
  }
  
  if (validationErrors.length > 0) {
    return createValidationError(validationErrors, '/api/vehicles', 'POST');
  }
  
  // Check if vehicle code already exists
  const existingVehicles = await VehicleService.getVehicles({ search: body.vehicleCode });
  const existingVehicle = existingVehicles.find(v => v.vehicleCode === body.vehicleCode);
  
  if (existingVehicle) {
    return createApiError(
      'Vehicle code already exists',
      'DUPLICATE_VEHICLE_CODE',
      409,
      { vehicleCode: body.vehicleCode },
      '/api/vehicles',
      'POST'
    );
  }
  
  // Check license plate uniqueness
  const existingPlateVehicles = await VehicleService.getVehicles({ search: body.licensePlate });
  const existingPlate = existingPlateVehicles.find(v => v.licensePlate === body.licensePlate);
  
  if (existingPlate) {
    return createApiError(
      'License plate already exists',
      'DUPLICATE_LICENSE_PLATE',
      409,
      { licensePlate: body.licensePlate },
      '/api/vehicles',
      'POST'
    );
  }
  
  // Validate user has access to the specified region
  const userRegions = user.allowedRegions || [];
  if (userRegions.length > 0 && userRegions[0] !== '*' && !userRegions.includes(body.regionId)) {
    return createApiError(
      'Access denied to specified region',
      'REGION_ACCESS_DENIED',
      403,
      { regionId: body.regionId },
      '/api/vehicles',
      'POST'
    );
  }
  
  const newVehicle = await VehicleService.createVehicle(body, user.id);
  
  // Audit vehicle creation
  await auditLogger.logEvent(
    AuditEventType.RESOURCE_CREATION,
    SecurityLevel.MEDIUM,
    'SUCCESS',
    { 
      resource: 'vehicle',
      vehicleId: newVehicle.id,
      vehicleCode: newVehicle.vehicleCode,
      ownershipType: newVehicle.ownershipType
    },
    { 
      userId: user.id,
      resource: 'vehicles',
      action: 'create',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    }
  );
  
  return createVersionedResponse({ vehicle: newVehicle }, 'v1');
});

// Development bypass wrapper
const withDevAuth = (handler: any) => {
  return async (request: NextRequest) => {
    // In development mode, bypass RBAC and provide mock user context
    if (process.env.NODE_ENV === 'development') {
      const mockUser = {
        id: 'demo-admin-001',
        email: 'admin@xpressops.demo', 
        name: 'Demo Admin',
        roles: ['super_admin'],
        permissions: ['*'],
        allowedRegions: ['*'],
        piiScope: 'unrestricted'
      };
      
      const mockVehicleContext = {
        regionId: null,
        ownershipType: null,
        dataClass: 'internal'
      };

      return handler(request, mockUser, mockVehicleContext);
    }
    
    // Production mode - use full RBAC
    return handler(request);
  };
};

export const GET = versionedApiRoute({
  v1: async (request: NextRequest) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/dashboard')) {
      return withDevAuth(getDashboardV1)(request);
    }
    return withDevAuth(getVehiclesV1)(request);
  }
});

export const POST = versionedApiRoute({
  v1: postVehiclesV1
});

// OPTIONS handler for CORS
export const OPTIONS = handleOptionsRequest;