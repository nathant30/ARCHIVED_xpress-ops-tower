// =====================================================
// OPERATOR SERVICE - Core CRUD and business logic
// Handles operator management, fleet operations, and basic analytics
// =====================================================

import { 
  Operator, 
  OperatorDriver, 
  OperatorVehicle, 
  OperatorFilters,
  CreateOperatorRequest,
  UpdateOperatorRequest,
  OperatorAnalytics,
  IOperatorService,
  OperatorType,
  OperatorStatus
} from '@/types/operators';
import { logger } from '@/lib/security/productionLogger';
import { v4 as uuidv4 } from 'uuid';

export class OperatorService implements IOperatorService {
  
  // =====================================================
  // CRUD OPERATIONS
  // =====================================================
  
  /**
   * Create a new operator
   */
  async createOperator(data: CreateOperatorRequest): Promise<Operator> {
    try {
      // Validate operator type vehicle limits
      const maxVehicles = this.getMaxVehiclesByType(data.operator_type);
      
      // Generate unique operator code if not provided
      const operatorCode = data.operator_code || await this.generateOperatorCode(data.operator_type);
      
      // Validate unique operator code
      await this.validateOperatorCodeUnique(operatorCode);
      
      const operator: Operator = {
        id: uuidv4(),
        operator_code: operatorCode,
        business_name: data.business_name,
        legal_name: data.legal_name,
        trade_name: data.trade_name,
        operator_type: data.operator_type,
        status: 'pending_approval',
        primary_contact: data.primary_contact,
        business_address: data.business_address,
        mailing_address: data.mailing_address,
        business_registration_number: data.business_registration_number,
        tin: data.tin,
        sec_registration: data.sec_registration,
        ltfrb_authority_number: data.ltfrb_authority_number,
        lto_accreditation: data.lto_accreditation,
        primary_region_id: data.primary_region_id,
        allowed_regions: data.allowed_regions || [],
        max_vehicles: maxVehicles,
        current_vehicle_count: 0,
        performance_score: 0,
        commission_tier: 'tier_1',
        wallet_balance: 0,
        earnings_today: 0,
        earnings_week: 0,
        earnings_month: 0,
        total_commissions_earned: 0,
        insurance_details: data.insurance_details || {} as any,
        certifications: data.certifications || [],
        compliance_documents: {},
        operational_hours: data.operational_hours || { start: '05:00', end: '23:00' },
        service_areas: data.service_areas || [],
        special_permissions: data.special_permissions || {},
        user_id: data.user_id,
        assigned_account_manager: data.assigned_account_manager,
        partnership_start_date: data.partnership_start_date,
        partnership_end_date: data.partnership_end_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: data.user_id,
        is_active: true
      };
      
      // In production, this would insert into the database
      await this.insertOperatorToDatabase(operator);
      
      logger.info('Operator created successfully', { 
        operatorId: operator.id, 
        operatorCode: operator.operator_code,
        businessName: operator.business_name 
      });
      
      return operator;
      
    } catch (error) {
      logger.error('Failed to create operator', { error, data });
      throw error;
    }
  }
  
  /**
   * Get operator by ID
   */
  async getOperator(id: string): Promise<Operator | null> {
    try {
      // In production, this would query the database
      const operator = await this.findOperatorInDatabase(id);
      
      if (!operator) {
        logger.warn('Operator not found', { operatorId: id });
        return null;
      }
      
      return operator;
      
    } catch (error) {
      logger.error('Failed to get operator', { error, operatorId: id });
      throw error;
    }
  }
  
  /**
   * Update existing operator
   */
  async updateOperator(id: string, data: UpdateOperatorRequest): Promise<Operator> {
    try {
      const existingOperator = await this.getOperator(id);
      if (!existingOperator) {
        throw new Error('Operator not found');
      }
      
      // Validate vehicle limit changes
      if (data.operator_type && data.operator_type !== existingOperator.operator_type) {
        const newMaxVehicles = this.getMaxVehiclesByType(data.operator_type);
        if (existingOperator.current_vehicle_count > newMaxVehicles) {
          throw new Error(`Cannot change operator type: current vehicle count (${existingOperator.current_vehicle_count}) exceeds new limit (${newMaxVehicles})`);
        }
        data.max_vehicles = newMaxVehicles;
      }
      
      const updatedOperator: Operator = {
        ...existingOperator,
        ...data,
        id, // Ensure ID cannot be changed
        updated_at: new Date().toISOString()
      };
      
      // In production, this would update the database
      await this.updateOperatorInDatabase(updatedOperator);
      
      logger.info('Operator updated successfully', { 
        operatorId: id,
        updatedFields: Object.keys(data)
      });
      
      return updatedOperator;
      
    } catch (error) {
      logger.error('Failed to update operator', { error, operatorId: id, data });
      throw error;
    }
  }
  
  /**
   * Delete operator (soft delete)
   */
  async deleteOperator(id: string): Promise<void> {
    try {
      const operator = await this.getOperator(id);
      if (!operator) {
        throw new Error('Operator not found');
      }
      
      // Check if operator has active vehicles or drivers
      const activeVehicleCount = await this.getActiveVehicleCount(id);
      const activeDriverCount = await this.getActiveDriverCount(id);
      
      if (activeVehicleCount > 0 || activeDriverCount > 0) {
        throw new Error('Cannot delete operator with active vehicles or drivers');
      }
      
      // Soft delete by setting is_active to false
      await this.updateOperator(id, { 
        is_active: false,
        status: 'decommissioned'
      });
      
      logger.info('Operator deleted successfully', { operatorId: id });
      
    } catch (error) {
      logger.error('Failed to delete operator', { error, operatorId: id });
      throw error;
    }
  }
  
  /**
   * List operators with filtering and pagination
   */
  async listOperators(
    filters?: OperatorFilters, 
    pagination?: { page: number; limit: number }
  ): Promise<{
    data: Operator[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || 10, 100); // Max 100 per page
      
      // In production, this would query the database with filters
      const { operators, total } = await this.queryOperatorsFromDatabase(filters, { page, limit });
      
      return {
        data: operators,
        total,
        page,
        limit
      };
      
    } catch (error) {
      logger.error('Failed to list operators', { error, filters, pagination });
      throw error;
    }
  }
  
  // =====================================================
  // FLEET MANAGEMENT
  // =====================================================
  
  /**
   * Add driver to operator fleet
   */
  async addDriver(
    operatorId: string, 
    driverId: string, 
    assignmentDetails: Partial<OperatorDriver>
  ): Promise<OperatorDriver> {
    try {
      // Validate operator exists
      const operator = await this.getOperator(operatorId);
      if (!operator) {
        throw new Error('Operator not found');
      }
      
      // Validate driver exists (would check drivers table)
      await this.validateDriverExists(driverId);
      
      // Check for existing assignment
      const existingAssignment = await this.findDriverAssignment(operatorId, driverId);
      if (existingAssignment && existingAssignment.is_active) {
        throw new Error('Driver is already assigned to this operator');
      }
      
      const operatorDriver: OperatorDriver = {
        id: uuidv4(),
        operator_id: operatorId,
        driver_id: driverId,
        assignment_type: assignmentDetails.assignment_type || 'employed',
        employment_status: 'active',
        contract_start_date: assignmentDetails.contract_start_date || new Date().toISOString().split('T')[0],
        contract_end_date: assignmentDetails.contract_end_date,
        contract_details: assignmentDetails.contract_details || {},
        driver_performance_score: 0,
        disciplinary_records: [],
        incentive_eligibility: true,
        assigned_location_id: assignmentDetails.assigned_location_id,
        home_base_location: assignmentDetails.home_base_location,
        assigned_at: new Date().toISOString(),
        assigned_by: assignmentDetails.assigned_by,
        updated_at: new Date().toISOString(),
        is_active: true
      };
      
      // In production, this would insert into operator_drivers table
      await this.insertOperatorDriverToDatabase(operatorDriver);
      
      logger.info('Driver added to operator fleet', { 
        operatorId, 
        driverId,
        assignmentType: operatorDriver.assignment_type
      });
      
      return operatorDriver;
      
    } catch (error) {
      logger.error('Failed to add driver to operator', { error, operatorId, driverId });
      throw error;
    }
  }
  
  /**
   * Remove driver from operator fleet
   */
  async removeDriver(operatorId: string, driverId: string): Promise<void> {
    try {
      const assignment = await this.findDriverAssignment(operatorId, driverId);
      if (!assignment || !assignment.is_active) {
        throw new Error('Active driver assignment not found');
      }
      
      // Check for active trips or bookings
      const hasActiveTrips = await this.checkDriverActiveTrips(driverId);
      if (hasActiveTrips) {
        throw new Error('Cannot remove driver with active trips');
      }
      
      // Soft delete the assignment
      await this.updateOperatorDriverAssignment(assignment.id, {
        is_active: false,
        employment_status: 'terminated',
        updated_at: new Date().toISOString()
      });
      
      logger.info('Driver removed from operator fleet', { operatorId, driverId });
      
    } catch (error) {
      logger.error('Failed to remove driver from operator', { error, operatorId, driverId });
      throw error;
    }
  }
  
  /**
   * Add vehicle to operator fleet
   */
  async addVehicle(operatorId: string, vehicleData: Partial<OperatorVehicle>): Promise<OperatorVehicle> {
    try {
      const operator = await this.getOperator(operatorId);
      if (!operator) {
        throw new Error('Operator not found');
      }
      
      // Check vehicle limits
      if (operator.current_vehicle_count >= operator.max_vehicles) {
        throw new Error(`Vehicle limit reached. Maximum ${operator.max_vehicles} vehicles allowed for ${operator.operator_type} operators`);
      }
      
      // Validate unique plate number
      await this.validatePlateNumberUnique(vehicleData.vehicle_plate_number!);
      
      const operatorVehicle: OperatorVehicle = {
        id: uuidv4(),
        operator_id: operatorId,
        vehicle_plate_number: vehicleData.vehicle_plate_number!,
        vehicle_info: vehicleData.vehicle_info!,
        service_type: vehicleData.service_type!,
        vehicle_category: vehicleData.vehicle_category!,
        seating_capacity: vehicleData.seating_capacity!,
        or_number: vehicleData.or_number,
        cr_number: vehicleData.cr_number,
        ltfrb_registration: vehicleData.ltfrb_registration,
        insurance_policy: vehicleData.insurance_policy || {} as any,
        status: 'active',
        assigned_driver_id: vehicleData.assigned_driver_id,
        assigned_location_id: vehicleData.assigned_location_id,
        last_maintenance_date: vehicleData.last_maintenance_date,
        next_maintenance_due: vehicleData.next_maintenance_due,
        last_inspection_date: vehicleData.last_inspection_date,
        next_inspection_due: vehicleData.next_inspection_due,
        maintenance_records: [],
        acquisition_cost: vehicleData.acquisition_cost,
        acquisition_date: vehicleData.acquisition_date,
        depreciation_rate: vehicleData.depreciation_rate,
        current_value: vehicleData.current_value,
        registered_at: new Date().toISOString(),
        registered_by: vehicleData.registered_by,
        updated_at: new Date().toISOString(),
        is_active: true
      };
      
      // In production, this would insert into operator_vehicles table
      await this.insertOperatorVehicleToDatabase(operatorVehicle);
      
      // Update operator vehicle count (trigger would handle this in production)
      await this.updateOperator(operatorId, {
        current_vehicle_count: operator.current_vehicle_count + 1
      });
      
      logger.info('Vehicle added to operator fleet', { 
        operatorId, 
        vehicleId: operatorVehicle.id,
        plateNumber: operatorVehicle.vehicle_plate_number
      });
      
      return operatorVehicle;
      
    } catch (error) {
      logger.error('Failed to add vehicle to operator', { error, operatorId, vehicleData });
      throw error;
    }
  }
  
  /**
   * Remove vehicle from operator fleet
   */
  async removeVehicle(operatorId: string, vehicleId: string): Promise<void> {
    try {
      const vehicle = await this.findOperatorVehicle(operatorId, vehicleId);
      if (!vehicle || !vehicle.is_active) {
        throw new Error('Active vehicle not found in operator fleet');
      }
      
      // Check for active trips or assignments
      const hasActiveTrips = await this.checkVehicleActiveTrips(vehicleId);
      if (hasActiveTrips) {
        throw new Error('Cannot remove vehicle with active trips');
      }
      
      // Soft delete the vehicle
      await this.updateOperatorVehicle(vehicleId, {
        is_active: false,
        status: 'retired',
        updated_at: new Date().toISOString()
      });
      
      // Update operator vehicle count
      const operator = await this.getOperator(operatorId);
      if (operator) {
        await this.updateOperator(operatorId, {
          current_vehicle_count: Math.max(0, operator.current_vehicle_count - 1)
        });
      }
      
      logger.info('Vehicle removed from operator fleet', { operatorId, vehicleId });
      
    } catch (error) {
      logger.error('Failed to remove vehicle from operator', { error, operatorId, vehicleId });
      throw error;
    }
  }
  
  // =====================================================
  // ANALYTICS
  // =====================================================
  
  /**
   * Get operator analytics dashboard data
   */
  async getAnalytics(filters?: OperatorFilters): Promise<OperatorAnalytics> {
    try {
      // In production, these would be complex database queries
      const analytics: OperatorAnalytics = {
        total_operators: await this.countOperators(filters),
        active_operators: await this.countOperators({ ...filters, status: 'active' }),
        pending_approvals: await this.countOperators({ ...filters, status: 'pending_approval' }),
        
        type_distribution: {
          tnvs: await this.countOperators({ ...filters, operator_type: 'tnvs' }),
          general: await this.countOperators({ ...filters, operator_type: 'general' }),
          fleet: await this.countOperators({ ...filters, operator_type: 'fleet' })
        },
        
        tier_distribution: {
          tier_1: await this.countOperatorsByTier('tier_1', filters),
          tier_2: await this.countOperatorsByTier('tier_2', filters),
          tier_3: await this.countOperatorsByTier('tier_3', filters)
        },
        
        regional_stats: await this.getRegionalStats(filters),
        
        total_commissions_paid: await this.getTotalCommissionsPaid(filters),
        total_boundary_fees: await this.getTotalBoundaryFees(filters),
        avg_monthly_revenue_per_operator: await this.getAverageMonthlyRevenue(filters),
        
        new_operators_this_month: await this.getNewOperatorsCount('month'),
        operator_growth_rate: await this.getOperatorGrowthRate(),
        vehicle_utilization_avg: await this.getAverageVehicleUtilization(filters),
        
        avg_performance_score: await this.getAveragePerformanceScore(filters),
        top_performing_operators: await this.getTopPerformingOperators(10, filters)
      };
      
      return analytics;
      
    } catch (error) {
      logger.error('Failed to get operator analytics', { error, filters });
      throw error;
    }
  }
  
  // =====================================================
  // HELPER METHODS
  // =====================================================
  
  private getMaxVehiclesByType(operatorType: OperatorType): number {
    switch (operatorType) {
      case 'tnvs': return 3;
      case 'general': return 10;
      case 'fleet': return 999999; // Unlimited
      default: return 3;
    }
  }
  
  private async generateOperatorCode(operatorType: OperatorType): Promise<string> {
    const prefix = operatorType.toUpperCase().substring(0, 3);
    const count = await this.countOperatorsByType(operatorType);
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }
  
  // =====================================================
  // DATABASE INTERFACE METHODS (Mock implementations)
  // In production, these would interact with PostgreSQL
  // =====================================================
  
  private async validateOperatorCodeUnique(operatorCode: string): Promise<void> {
    // Mock: Check if operator code exists
    const exists = false; // Database query would go here
    if (exists) {
      throw new Error(`Operator code ${operatorCode} already exists`);
    }
  }
  
  private async insertOperatorToDatabase(operator: Operator): Promise<void> {
    // Mock: INSERT INTO operators (...)
    logger.debug('Mock: Inserting operator to database', { operatorId: operator.id });
  }
  
  private async findOperatorInDatabase(id: string): Promise<Operator | null> {
    // Mock: SELECT * FROM operators WHERE id = ?
    logger.debug('Mock: Finding operator in database', { operatorId: id });
    return null; // Would return actual operator data
  }
  
  private async updateOperatorInDatabase(operator: Operator): Promise<void> {
    // Mock: UPDATE operators SET ... WHERE id = ?
    logger.debug('Mock: Updating operator in database', { operatorId: operator.id });
  }
  
  private async queryOperatorsFromDatabase(
    filters?: OperatorFilters, 
    pagination?: { page: number; limit: number }
  ): Promise<{ operators: Operator[]; total: number }> {
    // Mock: Complex query with WHERE clauses, LIMIT, OFFSET
    logger.debug('Mock: Querying operators from database', { filters, pagination });
    return { operators: [], total: 0 };
  }
  
  private async validateDriverExists(driverId: string): Promise<void> {
    // Mock: Check if driver exists in drivers table
    const exists = true; // Database query would go here
    if (!exists) {
      throw new Error(`Driver ${driverId} not found`);
    }
  }
  
  private async findDriverAssignment(operatorId: string, driverId: string): Promise<OperatorDriver | null> {
    // Mock: SELECT * FROM operator_drivers WHERE operator_id = ? AND driver_id = ?
    logger.debug('Mock: Finding driver assignment', { operatorId, driverId });
    return null;
  }
  
  private async insertOperatorDriverToDatabase(operatorDriver: OperatorDriver): Promise<void> {
    // Mock: INSERT INTO operator_drivers (...)
    logger.debug('Mock: Inserting operator driver to database', { 
      operatorId: operatorDriver.operator_id, 
      driverId: operatorDriver.driver_id 
    });
  }
  
  private async updateOperatorDriverAssignment(assignmentId: string, updates: Partial<OperatorDriver>): Promise<void> {
    // Mock: UPDATE operator_drivers SET ... WHERE id = ?
    logger.debug('Mock: Updating operator driver assignment', { assignmentId, updates });
  }
  
  private async checkDriverActiveTrips(driverId: string): Promise<boolean> {
    // Mock: Check for active bookings/trips
    return false;
  }
  
  private async validatePlateNumberUnique(plateNumber: string): Promise<void> {
    // Mock: Check if plate number exists
    const exists = false;
    if (exists) {
      throw new Error(`Plate number ${plateNumber} already registered`);
    }
  }
  
  private async insertOperatorVehicleToDatabase(operatorVehicle: OperatorVehicle): Promise<void> {
    // Mock: INSERT INTO operator_vehicles (...)
    logger.debug('Mock: Inserting operator vehicle to database', { 
      operatorId: operatorVehicle.operator_id,
      plateNumber: operatorVehicle.vehicle_plate_number
    });
  }
  
  private async findOperatorVehicle(operatorId: string, vehicleId: string): Promise<OperatorVehicle | null> {
    // Mock: SELECT * FROM operator_vehicles WHERE operator_id = ? AND id = ?
    logger.debug('Mock: Finding operator vehicle', { operatorId, vehicleId });
    return null;
  }
  
  private async updateOperatorVehicle(vehicleId: string, updates: Partial<OperatorVehicle>): Promise<void> {
    // Mock: UPDATE operator_vehicles SET ... WHERE id = ?
    logger.debug('Mock: Updating operator vehicle', { vehicleId, updates });
  }
  
  private async checkVehicleActiveTrips(vehicleId: string): Promise<boolean> {
    // Mock: Check for active bookings/trips
    return false;
  }
  
  private async getActiveVehicleCount(operatorId: string): Promise<number> {
    // Mock: SELECT COUNT(*) FROM operator_vehicles WHERE operator_id = ? AND is_active = true
    return 0;
  }
  
  private async getActiveDriverCount(operatorId: string): Promise<number> {
    // Mock: SELECT COUNT(*) FROM operator_drivers WHERE operator_id = ? AND is_active = true
    return 0;
  }
  
  private async countOperators(filters?: OperatorFilters): Promise<number> {
    // Mock: SELECT COUNT(*) FROM operators WHERE ...
    return 0;
  }
  
  private async countOperatorsByType(operatorType: OperatorType): Promise<number> {
    // Mock: SELECT COUNT(*) FROM operators WHERE operator_type = ?
    return 0;
  }
  
  private async countOperatorsByTier(tier: string, filters?: OperatorFilters): Promise<number> {
    // Mock: SELECT COUNT(*) FROM operators WHERE commission_tier = ?
    return 0;
  }
  
  private async getRegionalStats(filters?: OperatorFilters): Promise<Array<{
    region_id: string;
    region_name: string;
    operator_count: number;
    avg_performance_score: number;
    total_vehicles: number;
  }>> {
    // Mock: Complex query joining regions table
    return [];
  }
  
  private async getTotalCommissionsPaid(filters?: OperatorFilters): Promise<number> {
    // Mock: SELECT SUM(amount) FROM operator_financial_transactions WHERE transaction_type = 'commission_earned'
    return 0;
  }
  
  private async getTotalBoundaryFees(filters?: OperatorFilters): Promise<number> {
    // Mock: SELECT SUM(total_amount) FROM operator_boundary_fees
    return 0;
  }
  
  private async getAverageMonthlyRevenue(filters?: OperatorFilters): Promise<number> {
    // Mock: Complex query with monthly aggregation
    return 0;
  }
  
  private async getNewOperatorsCount(period: string): Promise<number> {
    // Mock: SELECT COUNT(*) FROM operators WHERE created_at >= ?
    return 0;
  }
  
  private async getOperatorGrowthRate(): Promise<number> {
    // Mock: Calculate growth rate compared to previous period
    return 0;
  }
  
  private async getAverageVehicleUtilization(filters?: OperatorFilters): Promise<number> {
    // Mock: Complex query calculating utilization metrics
    return 0;
  }
  
  private async getAveragePerformanceScore(filters?: OperatorFilters): Promise<number> {
    // Mock: SELECT AVG(performance_score) FROM operators
    return 0;
  }
  
  private async getTopPerformingOperators(limit: number, filters?: OperatorFilters): Promise<Array<{
    operator_id: string;
    business_name: string;
    performance_score: number;
    commission_tier: any;
  }>> {
    // Mock: SELECT ... FROM operators ORDER BY performance_score DESC LIMIT ?
    return [];
  }
}

export const operatorService = new OperatorService();