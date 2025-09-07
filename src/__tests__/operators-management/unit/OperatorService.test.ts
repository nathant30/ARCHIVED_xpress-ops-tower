// =====================================================
// OPERATOR SERVICE UNIT TESTS
// Comprehensive testing of core CRUD operations and business logic
// =====================================================

import { OperatorService } from '@/lib/services/OperatorService';
import { 
  CreateOperatorRequest, 
  UpdateOperatorRequest, 
  OperatorFilters,
  OperatorType,
  OperatorStatus 
} from '@/types/operators';
import { logger } from '@/lib/security/productionLogger';

// Mock dependencies
jest.mock('@/lib/security/productionLogger');

describe('OperatorService', () => {
  let operatorService: OperatorService;

  beforeEach(() => {
    operatorService = new OperatorService();
    jest.clearAllMocks();
  });

  describe('createOperator', () => {
    const mockCreateRequest: CreateOperatorRequest = {
      operator_code: 'TNV001',
      business_name: 'Metro Manila Transport Corp',
      legal_name: 'Metro Manila Transport Corporation',
      trade_name: 'MMTC',
      operator_type: 'tnvs',
      primary_contact: {
        name: 'Juan Dela Cruz',
        phone: '+639171234567',
        email: 'juan@mmtc.ph',
        position: 'General Manager'
      },
      business_address: {
        street: '123 EDSA',
        city: 'Quezon City',
        province: 'Metro Manila',
        region: 'NCR',
        postal_code: '1100',
        country: 'Philippines',
        coordinates: {
          latitude: 14.6760,
          longitude: 121.0437
        }
      },
      business_registration_number: 'DTI-NCR-12345678',
      tin: '123-456-789-000',
      ltfrb_authority_number: 'LTFRB-NCR-2024-001',
      primary_region_id: 'ncr-metro-manila',
      partnership_start_date: '2024-01-01'
    };

    test('should create TNVS operator with correct vehicle limits', async () => {
      // Mock database methods
      jest.spyOn(operatorService as any, 'validateOperatorCodeUnique').mockResolvedValue();
      jest.spyOn(operatorService as any, 'insertOperatorToDatabase').mockResolvedValue();

      const result = await operatorService.createOperator(mockCreateRequest);

      expect(result.operator_type).toBe('tnvs');
      expect(result.max_vehicles).toBe(3);
      expect(result.current_vehicle_count).toBe(0);
      expect(result.status).toBe('pending_approval');
      expect(result.performance_score).toBe(0);
      expect(result.commission_tier).toBe('tier_1');
      expect(result.business_name).toBe(mockCreateRequest.business_name);
      expect(result.primary_contact).toEqual(mockCreateRequest.primary_contact);
    });

    test('should create General operator with correct vehicle limits', async () => {
      const generalRequest = { ...mockCreateRequest, operator_type: 'general' as OperatorType };
      
      jest.spyOn(operatorService as any, 'validateOperatorCodeUnique').mockResolvedValue();
      jest.spyOn(operatorService as any, 'insertOperatorToDatabase').mockResolvedValue();

      const result = await operatorService.createOperator(generalRequest);

      expect(result.operator_type).toBe('general');
      expect(result.max_vehicles).toBe(10);
    });

    test('should create Fleet operator with unlimited vehicle limits', async () => {
      const fleetRequest = { ...mockCreateRequest, operator_type: 'fleet' as OperatorType };
      
      jest.spyOn(operatorService as any, 'validateOperatorCodeUnique').mockResolvedValue();
      jest.spyOn(operatorService as any, 'insertOperatorToDatabase').mockResolvedValue();

      const result = await operatorService.createOperator(fleetRequest);

      expect(result.operator_type).toBe('fleet');
      expect(result.max_vehicles).toBe(999999);
    });

    test('should generate unique operator code when not provided', async () => {
      const requestWithoutCode = { ...mockCreateRequest };
      delete requestWithoutCode.operator_code;

      jest.spyOn(operatorService as any, 'validateOperatorCodeUnique').mockResolvedValue();
      jest.spyOn(operatorService as any, 'insertOperatorToDatabase').mockResolvedValue();
      jest.spyOn(operatorService as any, 'countOperatorsByType').mockResolvedValue(5);

      const result = await operatorService.createOperator(requestWithoutCode);

      expect(result.operator_code).toBe('TNV006'); // TNV prefix + count(5) + 1 = TNV006
    });

    test('should set default operational hours when not provided', async () => {
      jest.spyOn(operatorService as any, 'validateOperatorCodeUnique').mockResolvedValue();
      jest.spyOn(operatorService as any, 'insertOperatorToDatabase').mockResolvedValue();

      const result = await operatorService.createOperator(mockCreateRequest);

      expect(result.operational_hours).toEqual({ start: '05:00', end: '23:00' });
    });

    test('should throw error for duplicate operator code', async () => {
      jest.spyOn(operatorService as any, 'validateOperatorCodeUnique').mockRejectedValue(
        new Error('Operator code TNV001 already exists')
      );

      await expect(operatorService.createOperator(mockCreateRequest))
        .rejects
        .toThrow('Operator code TNV001 already exists');
    });

    test('should log creation success', async () => {
      jest.spyOn(operatorService as any, 'validateOperatorCodeUnique').mockResolvedValue();
      jest.spyOn(operatorService as any, 'insertOperatorToDatabase').mockResolvedValue();

      await operatorService.createOperator(mockCreateRequest);

      expect(logger.info).toHaveBeenCalledWith(
        'Operator created successfully',
        expect.objectContaining({
          operatorId: expect.any(String),
          operatorCode: 'TNV001',
          businessName: 'Metro Manila Transport Corp'
        })
      );
    });

    test('should handle database insertion errors', async () => {
      jest.spyOn(operatorService as any, 'validateOperatorCodeUnique').mockResolvedValue();
      jest.spyOn(operatorService as any, 'insertOperatorToDatabase').mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(operatorService.createOperator(mockCreateRequest))
        .rejects
        .toThrow('Database connection failed');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to create operator',
        expect.objectContaining({
          error: expect.any(Error),
          data: mockCreateRequest
        })
      );
    });
  });

  describe('getOperator', () => {
    const mockOperatorId = 'op-123456';

    test('should return operator when found', async () => {
      const mockOperator = {
        id: mockOperatorId,
        business_name: 'Test Operator',
        operator_type: 'tnvs' as OperatorType,
        status: 'active' as OperatorStatus
      };

      jest.spyOn(operatorService as any, 'findOperatorInDatabase').mockResolvedValue(mockOperator);

      const result = await operatorService.getOperator(mockOperatorId);

      expect(result).toEqual(mockOperator);
      expect(operatorService['findOperatorInDatabase']).toHaveBeenCalledWith(mockOperatorId);
    });

    test('should return null when operator not found', async () => {
      jest.spyOn(operatorService as any, 'findOperatorInDatabase').mockResolvedValue(null);

      const result = await operatorService.getOperator(mockOperatorId);

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith('Operator not found', { operatorId: mockOperatorId });
    });

    test('should handle database query errors', async () => {
      jest.spyOn(operatorService as any, 'findOperatorInDatabase').mockRejectedValue(
        new Error('Database query failed')
      );

      await expect(operatorService.getOperator(mockOperatorId))
        .rejects
        .toThrow('Database query failed');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get operator',
        expect.objectContaining({
          error: expect.any(Error),
          operatorId: mockOperatorId
        })
      );
    });
  });

  describe('updateOperator', () => {
    const mockOperatorId = 'op-123456';
    const mockExistingOperator = {
      id: mockOperatorId,
      operator_code: 'TNV001',
      business_name: 'Original Name',
      operator_type: 'tnvs' as OperatorType,
      current_vehicle_count: 2,
      max_vehicles: 3,
      status: 'active' as OperatorStatus,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_active: true
    };

    test('should update operator with valid changes', async () => {
      const updateRequest: UpdateOperatorRequest = {
        id: mockOperatorId,
        business_name: 'Updated Name',
        trade_name: 'New Trade Name'
      };

      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(mockExistingOperator as any);
      jest.spyOn(operatorService as any, 'updateOperatorInDatabase').mockResolvedValue();

      const result = await operatorService.updateOperator(mockOperatorId, updateRequest);

      expect(result.business_name).toBe('Updated Name');
      expect(result.trade_name).toBe('New Trade Name');
      expect(result.id).toBe(mockOperatorId); // ID should not change
      expect(result.updated_at).not.toBe(mockExistingOperator.updated_at);
      expect(logger.info).toHaveBeenCalledWith(
        'Operator updated successfully',
        expect.objectContaining({
          operatorId: mockOperatorId,
          updatedFields: ['business_name', 'trade_name']
        })
      );
    });

    test('should prevent operator type change if vehicle count exceeds new limit', async () => {
      const updateRequest: UpdateOperatorRequest = {
        id: mockOperatorId,
        operator_type: 'tnvs' // Changing from general (10 max) to tnvs (3 max) with 5 vehicles
      };

      const operatorWithManyVehicles = {
        ...mockExistingOperator,
        operator_type: 'general' as OperatorType,
        current_vehicle_count: 5,
        max_vehicles: 10
      };

      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(operatorWithManyVehicles as any);

      await expect(operatorService.updateOperator(mockOperatorId, updateRequest))
        .rejects
        .toThrow('Cannot change operator type: current vehicle count (5) exceeds new limit (3)');
    });

    test('should allow operator type change if vehicle count is within new limit', async () => {
      const updateRequest: UpdateOperatorRequest = {
        id: mockOperatorId,
        operator_type: 'general' // Changing from tnvs (3 max) to general (10 max)
      };

      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(mockExistingOperator as any);
      jest.spyOn(operatorService as any, 'updateOperatorInDatabase').mockResolvedValue();

      const result = await operatorService.updateOperator(mockOperatorId, updateRequest);

      expect(result.operator_type).toBe('general');
      expect(result.max_vehicles).toBe(10);
    });

    test('should throw error if operator not found', async () => {
      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(null);

      const updateRequest: UpdateOperatorRequest = {
        id: mockOperatorId,
        business_name: 'Updated Name'
      };

      await expect(operatorService.updateOperator(mockOperatorId, updateRequest))
        .rejects
        .toThrow('Operator not found');
    });
  });

  describe('deleteOperator', () => {
    const mockOperatorId = 'op-123456';
    const mockOperator = {
      id: mockOperatorId,
      business_name: 'Test Operator',
      operator_type: 'tnvs' as OperatorType,
      status: 'active' as OperatorStatus
    };

    test('should soft delete operator with no active resources', async () => {
      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(mockOperator as any);
      jest.spyOn(operatorService as any, 'getActiveVehicleCount').mockResolvedValue(0);
      jest.spyOn(operatorService as any, 'getActiveDriverCount').mockResolvedValue(0);
      jest.spyOn(operatorService, 'updateOperator').mockResolvedValue({} as any);

      await operatorService.deleteOperator(mockOperatorId);

      expect(operatorService.updateOperator).toHaveBeenCalledWith(mockOperatorId, {
        is_active: false,
        status: 'decommissioned'
      });
      expect(logger.info).toHaveBeenCalledWith('Operator deleted successfully', { operatorId: mockOperatorId });
    });

    test('should prevent deletion if operator has active vehicles', async () => {
      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(mockOperator as any);
      jest.spyOn(operatorService as any, 'getActiveVehicleCount').mockResolvedValue(2);
      jest.spyOn(operatorService as any, 'getActiveDriverCount').mockResolvedValue(0);

      await expect(operatorService.deleteOperator(mockOperatorId))
        .rejects
        .toThrow('Cannot delete operator with active vehicles or drivers');
    });

    test('should prevent deletion if operator has active drivers', async () => {
      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(mockOperator as any);
      jest.spyOn(operatorService as any, 'getActiveVehicleCount').mockResolvedValue(0);
      jest.spyOn(operatorService as any, 'getActiveDriverCount').mockResolvedValue(3);

      await expect(operatorService.deleteOperator(mockOperatorId))
        .rejects
        .toThrow('Cannot delete operator with active vehicles or drivers');
    });

    test('should throw error if operator not found', async () => {
      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(null);

      await expect(operatorService.deleteOperator(mockOperatorId))
        .rejects
        .toThrow('Operator not found');
    });
  });

  describe('listOperators', () => {
    test('should list operators with default pagination', async () => {
      const mockOperators = [
        { id: 'op-1', business_name: 'Operator 1', operator_type: 'tnvs' },
        { id: 'op-2', business_name: 'Operator 2', operator_type: 'general' }
      ];

      jest.spyOn(operatorService as any, 'queryOperatorsFromDatabase').mockResolvedValue({
        operators: mockOperators,
        total: 2
      });

      const result = await operatorService.listOperators();

      expect(result.data).toEqual(mockOperators);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(operatorService['queryOperatorsFromDatabase']).toHaveBeenCalledWith(
        undefined, 
        { page: 1, limit: 10 }
      );
    });

    test('should apply filters and pagination', async () => {
      const filters: OperatorFilters = {
        operator_type: 'tnvs',
        status: 'active',
        region_id: 'ncr-metro-manila'
      };
      const pagination = { page: 2, limit: 20 };

      jest.spyOn(operatorService as any, 'queryOperatorsFromDatabase').mockResolvedValue({
        operators: [],
        total: 0
      });

      await operatorService.listOperators(filters, pagination);

      expect(operatorService['queryOperatorsFromDatabase']).toHaveBeenCalledWith(
        filters,
        { page: 2, limit: 20 }
      );
    });

    test('should enforce maximum page limit', async () => {
      const pagination = { page: 1, limit: 200 }; // Over the limit of 100

      jest.spyOn(operatorService as any, 'queryOperatorsFromDatabase').mockResolvedValue({
        operators: [],
        total: 0
      });

      await operatorService.listOperators(undefined, pagination);

      expect(operatorService['queryOperatorsFromDatabase']).toHaveBeenCalledWith(
        undefined,
        { page: 1, limit: 100 } // Should be capped at 100
      );
    });
  });

  describe('Fleet Management - addDriver', () => {
    const mockOperatorId = 'op-123456';
    const mockDriverId = 'drv-789012';
    const mockOperator = {
      id: mockOperatorId,
      business_name: 'Test Operator',
      operator_type: 'tnvs' as OperatorType
    };

    test('should add driver to operator fleet successfully', async () => {
      const assignmentDetails = {
        assignment_type: 'employed',
        contract_start_date: '2024-01-01',
        assigned_by: 'manager-123'
      };

      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(mockOperator as any);
      jest.spyOn(operatorService as any, 'validateDriverExists').mockResolvedValue();
      jest.spyOn(operatorService as any, 'findDriverAssignment').mockResolvedValue(null);
      jest.spyOn(operatorService as any, 'insertOperatorDriverToDatabase').mockResolvedValue();

      const result = await operatorService.addDriver(mockOperatorId, mockDriverId, assignmentDetails);

      expect(result.operator_id).toBe(mockOperatorId);
      expect(result.driver_id).toBe(mockDriverId);
      expect(result.assignment_type).toBe('employed');
      expect(result.employment_status).toBe('active');
      expect(result.is_active).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        'Driver added to operator fleet',
        expect.objectContaining({
          operatorId: mockOperatorId,
          driverId: mockDriverId,
          assignmentType: 'employed'
        })
      );
    });

    test('should prevent duplicate driver assignment', async () => {
      const existingAssignment = {
        id: 'assignment-123',
        operator_id: mockOperatorId,
        driver_id: mockDriverId,
        is_active: true
      };

      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(mockOperator as any);
      jest.spyOn(operatorService as any, 'validateDriverExists').mockResolvedValue();
      jest.spyOn(operatorService as any, 'findDriverAssignment').mockResolvedValue(existingAssignment);

      await expect(operatorService.addDriver(mockOperatorId, mockDriverId, {}))
        .rejects
        .toThrow('Driver is already assigned to this operator');
    });

    test('should throw error if operator not found', async () => {
      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(null);

      await expect(operatorService.addDriver(mockOperatorId, mockDriverId, {}))
        .rejects
        .toThrow('Operator not found');
    });

    test('should throw error if driver not found', async () => {
      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(mockOperator as any);
      jest.spyOn(operatorService as any, 'validateDriverExists').mockRejectedValue(
        new Error('Driver drv-789012 not found')
      );

      await expect(operatorService.addDriver(mockOperatorId, mockDriverId, {}))
        .rejects
        .toThrow('Driver drv-789012 not found');
    });
  });

  describe('Fleet Management - removeDriver', () => {
    const mockOperatorId = 'op-123456';
    const mockDriverId = 'drv-789012';

    test('should remove driver from operator fleet successfully', async () => {
      const mockAssignment = {
        id: 'assignment-123',
        operator_id: mockOperatorId,
        driver_id: mockDriverId,
        is_active: true
      };

      jest.spyOn(operatorService as any, 'findDriverAssignment').mockResolvedValue(mockAssignment);
      jest.spyOn(operatorService as any, 'checkDriverActiveTrips').mockResolvedValue(false);
      jest.spyOn(operatorService as any, 'updateOperatorDriverAssignment').mockResolvedValue();

      await operatorService.removeDriver(mockOperatorId, mockDriverId);

      expect(operatorService['updateOperatorDriverAssignment']).toHaveBeenCalledWith(
        'assignment-123',
        expect.objectContaining({
          is_active: false,
          employment_status: 'terminated'
        })
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Driver removed from operator fleet',
        { operatorId: mockOperatorId, driverId: mockDriverId }
      );
    });

    test('should prevent removal if driver has active trips', async () => {
      const mockAssignment = {
        id: 'assignment-123',
        is_active: true
      };

      jest.spyOn(operatorService as any, 'findDriverAssignment').mockResolvedValue(mockAssignment);
      jest.spyOn(operatorService as any, 'checkDriverActiveTrips').mockResolvedValue(true);

      await expect(operatorService.removeDriver(mockOperatorId, mockDriverId))
        .rejects
        .toThrow('Cannot remove driver with active trips');
    });

    test('should throw error if assignment not found', async () => {
      jest.spyOn(operatorService as any, 'findDriverAssignment').mockResolvedValue(null);

      await expect(operatorService.removeDriver(mockOperatorId, mockDriverId))
        .rejects
        .toThrow('Active driver assignment not found');
    });
  });

  describe('Fleet Management - addVehicle', () => {
    const mockOperatorId = 'op-123456';
    const mockOperator = {
      id: mockOperatorId,
      operator_type: 'tnvs' as OperatorType,
      max_vehicles: 3,
      current_vehicle_count: 1
    };

    const mockVehicleData = {
      vehicle_plate_number: 'ABC-1234',
      vehicle_info: {
        make: 'Toyota',
        model: 'Vios',
        year: 2023,
        color: 'White',
        type: 'Sedan'
      },
      service_type: 'TNVS',
      vehicle_category: 'Economy',
      seating_capacity: 4
    };

    test('should add vehicle to operator fleet successfully', async () => {
      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(mockOperator as any);
      jest.spyOn(operatorService as any, 'validatePlateNumberUnique').mockResolvedValue();
      jest.spyOn(operatorService as any, 'insertOperatorVehicleToDatabase').mockResolvedValue();
      jest.spyOn(operatorService, 'updateOperator').mockResolvedValue({} as any);

      const result = await operatorService.addVehicle(mockOperatorId, mockVehicleData);

      expect(result.operator_id).toBe(mockOperatorId);
      expect(result.vehicle_plate_number).toBe('ABC-1234');
      expect(result.status).toBe('active');
      expect(result.is_active).toBe(true);
      expect(operatorService.updateOperator).toHaveBeenCalledWith(mockOperatorId, {
        current_vehicle_count: 2 // 1 + 1
      });
    });

    test('should enforce vehicle limits for TNVS operators', async () => {
      const operatorAtLimit = {
        ...mockOperator,
        current_vehicle_count: 3 // At the limit of 3 vehicles
      };

      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(operatorAtLimit as any);

      await expect(operatorService.addVehicle(mockOperatorId, mockVehicleData))
        .rejects
        .toThrow('Vehicle limit reached. Maximum 3 vehicles allowed for tnvs operators');
    });

    test('should prevent duplicate plate numbers', async () => {
      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(mockOperator as any);
      jest.spyOn(operatorService as any, 'validatePlateNumberUnique').mockRejectedValue(
        new Error('Plate number ABC-1234 already registered')
      );

      await expect(operatorService.addVehicle(mockOperatorId, mockVehicleData))
        .rejects
        .toThrow('Plate number ABC-1234 already registered');
    });

    test('should throw error if operator not found', async () => {
      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(null);

      await expect(operatorService.addVehicle(mockOperatorId, mockVehicleData))
        .rejects
        .toThrow('Operator not found');
    });
  });

  describe('removeVehicle', () => {
    const mockOperatorId = 'op-123456';
    const mockVehicleId = 'veh-789012';
    const mockOperator = {
      id: mockOperatorId,
      current_vehicle_count: 2
    };

    test('should remove vehicle from operator fleet successfully', async () => {
      const mockVehicle = {
        id: mockVehicleId,
        operator_id: mockOperatorId,
        is_active: true,
        status: 'active'
      };

      jest.spyOn(operatorService as any, 'findOperatorVehicle').mockResolvedValue(mockVehicle);
      jest.spyOn(operatorService as any, 'checkVehicleActiveTrips').mockResolvedValue(false);
      jest.spyOn(operatorService as any, 'updateOperatorVehicle').mockResolvedValue();
      jest.spyOn(operatorService, 'getOperator').mockResolvedValue(mockOperator as any);
      jest.spyOn(operatorService, 'updateOperator').mockResolvedValue({} as any);

      await operatorService.removeVehicle(mockOperatorId, mockVehicleId);

      expect(operatorService['updateOperatorVehicle']).toHaveBeenCalledWith(
        mockVehicleId,
        expect.objectContaining({
          is_active: false,
          status: 'retired'
        })
      );
      expect(operatorService.updateOperator).toHaveBeenCalledWith(mockOperatorId, {
        current_vehicle_count: 1 // 2 - 1
      });
    });

    test('should prevent removal if vehicle has active trips', async () => {
      const mockVehicle = { id: mockVehicleId, is_active: true };

      jest.spyOn(operatorService as any, 'findOperatorVehicle').mockResolvedValue(mockVehicle);
      jest.spyOn(operatorService as any, 'checkVehicleActiveTrips').mockResolvedValue(true);

      await expect(operatorService.removeVehicle(mockOperatorId, mockVehicleId))
        .rejects
        .toThrow('Cannot remove vehicle with active trips');
    });
  });

  describe('getAnalytics', () => {
    test('should return comprehensive analytics data', async () => {
      // Mock all analytics methods
      jest.spyOn(operatorService as any, 'countOperators').mockResolvedValue(100);
      jest.spyOn(operatorService as any, 'countOperatorsByTier').mockResolvedValue(30);
      jest.spyOn(operatorService as any, 'getRegionalStats').mockResolvedValue([]);
      jest.spyOn(operatorService as any, 'getTotalCommissionsPaid').mockResolvedValue(1000000);
      jest.spyOn(operatorService as any, 'getTotalBoundaryFees').mockResolvedValue(500000);
      jest.spyOn(operatorService as any, 'getAverageMonthlyRevenue').mockResolvedValue(50000);
      jest.spyOn(operatorService as any, 'getNewOperatorsCount').mockResolvedValue(10);
      jest.spyOn(operatorService as any, 'getOperatorGrowthRate').mockResolvedValue(15.5);
      jest.spyOn(operatorService as any, 'getAverageVehicleUtilization').mockResolvedValue(75.2);
      jest.spyOn(operatorService as any, 'getAveragePerformanceScore').mockResolvedValue(82.7);
      jest.spyOn(operatorService as any, 'getTopPerformingOperators').mockResolvedValue([]);

      const result = await operatorService.getAnalytics();

      expect(result).toEqual(expect.objectContaining({
        total_operators: 100,
        active_operators: 100,
        pending_approvals: 100,
        type_distribution: {
          tnvs: 100,
          general: 100,
          fleet: 100
        },
        tier_distribution: {
          tier_1: 30,
          tier_2: 30,
          tier_3: 30
        },
        total_commissions_paid: 1000000,
        total_boundary_fees: 500000,
        avg_monthly_revenue_per_operator: 50000,
        new_operators_this_month: 10,
        operator_growth_rate: 15.5,
        vehicle_utilization_avg: 75.2,
        avg_performance_score: 82.7
      }));
    });

    test('should handle analytics query errors', async () => {
      jest.spyOn(operatorService as any, 'countOperators').mockRejectedValue(
        new Error('Database query failed')
      );

      await expect(operatorService.getAnalytics())
        .rejects
        .toThrow('Database query failed');

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get operator analytics',
        expect.objectContaining({
          error: expect.any(Error),
          filters: undefined
        })
      );
    });
  });
});