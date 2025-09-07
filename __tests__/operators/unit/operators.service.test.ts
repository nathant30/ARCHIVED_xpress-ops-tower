// =====================================================
// OPERATORS SERVICE UNIT TESTS
// Comprehensive unit tests for operators service business logic
// =====================================================

import { jest } from '@jest/globals';
import { 
  Operator, 
  CreateOperatorRequest,
  UpdateOperatorRequest,
  OperatorFilters,
  OperatorType,
  OperatorStatus,
  CommissionTier 
} from '@/types/operators';

// Mock the database service
jest.mock('@/lib/services/DatabaseService');
jest.mock('@/lib/services/PerformanceService');
jest.mock('@/lib/services/CommissionService');

// Import after mocking
import { operatorService } from '@/lib/services/OperatorService';

describe('OperatorService', () => {
  
  // =====================================================
  // TEST DATA SETUP
  // =====================================================
  
  const mockOperatorData: CreateOperatorRequest = {
    operator_code: 'OPR-TEST-001',
    business_name: 'Test Transport Inc.',
    legal_name: 'Test Transport Incorporated',
    trade_name: 'TestTrans',
    operator_type: 'tnvs',
    primary_contact: {
      name: 'Juan Dela Cruz',
      phone: '+639123456789',
      email: 'juan@testtransport.com',
      position: 'General Manager'
    },
    business_address: {
      street: '123 EDSA Highway',
      city: 'Makati',
      province: 'Metro Manila',
      region: 'NCR',
      postal_code: '1226',
      country: 'Philippines'
    },
    business_registration_number: 'DTI-12345678',
    tin: '123-456-789-000',
    primary_region_id: 'ncr-001',
    partnership_start_date: '2024-01-01T00:00:00.000Z'
  };

  const mockOperator: Operator = {
    id: 'op-test-001',
    operator_code: 'OPR-TEST-001',
    business_name: 'Test Transport Inc.',
    legal_name: 'Test Transport Incorporated',
    trade_name: 'TestTrans',
    operator_type: 'tnvs',
    status: 'active',
    primary_contact: {
      name: 'Juan Dela Cruz',
      phone: '+639123456789',
      email: 'juan@testtransport.com',
      position: 'General Manager'
    },
    business_address: {
      street: '123 EDSA Highway',
      city: 'Makati',
      province: 'Metro Manila',
      region: 'NCR',
      postal_code: '1226',
      country: 'Philippines'
    },
    business_registration_number: 'DTI-12345678',
    tin: '123-456-789-000',
    primary_region_id: 'ncr-001',
    allowed_regions: ['ncr-001'],
    max_vehicles: 3,
    current_vehicle_count: 0,
    performance_score: 0,
    commission_tier: 'tier_1',
    wallet_balance: 0,
    earnings_today: 0,
    earnings_week: 0,
    earnings_month: 0,
    total_commissions_earned: 0,
    insurance_details: {
      provider: 'Test Insurance',
      policy_number: 'POL-123',
      coverage_amount: 1000000,
      effective_date: '2024-01-01',
      expiry_date: '2024-12-31',
      contact_info: {
        name: 'Insurance Agent',
        phone: '+639123456789',
        email: 'agent@testinsurance.com',
        position: 'Agent'
      }
    },
    certifications: [],
    compliance_documents: {},
    operational_hours: {
      start: '06:00',
      end: '22:00'
    },
    service_areas: [],
    special_permissions: {},
    partnership_start_date: '2024-01-01T00:00:00.000Z',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    is_active: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =====================================================
  // CREATE OPERATOR TESTS
  // =====================================================

  describe('createOperator', () => {
    
    it('should create a new TNVS operator with correct vehicle limits', async () => {
      // Arrange
      const mockDbResponse = { ...mockOperator };
      jest.spyOn(operatorService as any, 'validateOperatorData').mockResolvedValue(true);
      jest.spyOn(operatorService as any, 'insertOperator').mockResolvedValue(mockDbResponse);
      
      // Act
      const result = await operatorService.createOperator(mockOperatorData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.operator_type).toBe('tnvs');
      expect(result.max_vehicles).toBe(3); // TNVS limit
      expect(result.status).toBe('active');
    });

    it('should create a general operator with correct vehicle limits', async () => {
      // Arrange
      const generalOperatorData = {
        ...mockOperatorData,
        operator_type: 'general' as OperatorType
      };
      const mockGeneralOperator = {
        ...mockOperator,
        operator_type: 'general' as OperatorType,
        max_vehicles: 10
      };
      
      jest.spyOn(operatorService as any, 'validateOperatorData').mockResolvedValue(true);
      jest.spyOn(operatorService as any, 'insertOperator').mockResolvedValue(mockGeneralOperator);
      
      // Act
      const result = await operatorService.createOperator(generalOperatorData);
      
      // Assert
      expect(result.operator_type).toBe('general');
      expect(result.max_vehicles).toBe(10); // General operator limit
    });

    it('should validate required fields', async () => {
      // Arrange
      const incompleteData = {
        ...mockOperatorData,
        business_name: undefined as any
      };
      
      // Act & Assert
      await expect(operatorService.createOperator(incompleteData)).rejects.toThrow('Business name is required');
    });

    it('should validate Philippine phone number format', async () => {
      // Arrange
      const invalidPhoneData = {
        ...mockOperatorData,
        primary_contact: {
          ...mockOperatorData.primary_contact,
          phone: '123-456-7890' // Invalid format
        }
      };
      
      // Act & Assert
      await expect(operatorService.createOperator(invalidPhoneData)).rejects.toThrow('Invalid Philippine phone number format');
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidEmailData = {
        ...mockOperatorData,
        primary_contact: {
          ...mockOperatorData.primary_contact,
          email: 'invalid-email'
        }
      };
      
      // Act & Assert
      await expect(operatorService.createOperator(invalidEmailData)).rejects.toThrow('Invalid email format');
    });

    it('should prevent duplicate operator codes', async () => {
      // Arrange
      jest.spyOn(operatorService as any, 'checkOperatorCodeExists').mockResolvedValue(true);
      
      // Act & Assert
      await expect(operatorService.createOperator(mockOperatorData)).rejects.toThrow('Operator code already exists');
    });

  });

  // =====================================================
  // GET OPERATOR TESTS
  // =====================================================

  describe('getOperator', () => {
    
    it('should return operator by ID', async () => {
      // Arrange
      jest.spyOn(operatorService as any, 'findOperatorById').mockResolvedValue(mockOperator);
      
      // Act
      const result = await operatorService.getOperator('op-test-001');
      
      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('op-test-001');
      expect(result?.business_name).toBe('Test Transport Inc.');
    });

    it('should return null for non-existent operator', async () => {
      // Arrange
      jest.spyOn(operatorService as any, 'findOperatorById').mockResolvedValue(null);
      
      // Act
      const result = await operatorService.getOperator('non-existent');
      
      // Assert
      expect(result).toBeNull();
    });

  });

  // =====================================================
  // UPDATE OPERATOR TESTS
  // =====================================================

  describe('updateOperator', () => {
    
    it('should update operator details', async () => {
      // Arrange
      const updateData: UpdateOperatorRequest = {
        id: 'op-test-001',
        business_name: 'Updated Transport Inc.'
      };
      const updatedOperator = {
        ...mockOperator,
        business_name: 'Updated Transport Inc.',
        updated_at: '2024-01-02T00:00:00.000Z'
      };
      
      jest.spyOn(operatorService as any, 'findOperatorById').mockResolvedValue(mockOperator);
      jest.spyOn(operatorService as any, 'updateOperatorInDb').mockResolvedValue(updatedOperator);
      
      // Act
      const result = await operatorService.updateOperator('op-test-001', updateData);
      
      // Assert
      expect(result.business_name).toBe('Updated Transport Inc.');
      expect(result.updated_at).toBe('2024-01-02T00:00:00.000Z');
    });

    it('should not allow updating operator type if vehicles are assigned', async () => {
      // Arrange
      const operatorWithVehicles = {
        ...mockOperator,
        current_vehicle_count: 2
      };
      const updateData: UpdateOperatorRequest = {
        id: 'op-test-001',
        operator_type: 'general'
      };
      
      jest.spyOn(operatorService as any, 'findOperatorById').mockResolvedValue(operatorWithVehicles);
      
      // Act & Assert
      await expect(operatorService.updateOperator('op-test-001', updateData)).rejects.toThrow('Cannot change operator type when vehicles are assigned');
    });

  });

  // =====================================================
  // LIST OPERATORS TESTS
  // =====================================================

  describe('listOperators', () => {
    
    it('should list operators with default pagination', async () => {
      // Arrange
      const mockOperators = [mockOperator];
      const mockResult = {
        data: mockOperators,
        total: 1,
        page: 1,
        limit: 20
      };
      
      jest.spyOn(operatorService as any, 'queryOperators').mockResolvedValue(mockResult);
      
      // Act
      const result = await operatorService.listOperators();
      
      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should filter operators by type', async () => {
      // Arrange
      const filters: OperatorFilters = {
        operator_type: 'tnvs'
      };
      const mockResult = {
        data: [mockOperator],
        total: 1,
        page: 1,
        limit: 20
      };
      
      jest.spyOn(operatorService as any, 'queryOperators').mockResolvedValue(mockResult);
      
      // Act
      const result = await operatorService.listOperators(filters);
      
      // Assert
      expect(result.data[0].operator_type).toBe('tnvs');
    });

    it('should filter operators by status', async () => {
      // Arrange
      const filters: OperatorFilters = {
        status: 'active'
      };
      const mockResult = {
        data: [mockOperator],
        total: 1,
        page: 1,
        limit: 20
      };
      
      jest.spyOn(operatorService as any, 'queryOperators').mockResolvedValue(mockResult);
      
      // Act
      const result = await operatorService.listOperators(filters);
      
      // Assert
      expect(result.data[0].status).toBe('active');
    });

    it('should filter operators by performance score range', async () => {
      // Arrange
      const filters: OperatorFilters = {
        performance_score_min: 70,
        performance_score_max: 90
      };
      const highPerformanceOperator = {
        ...mockOperator,
        performance_score: 85
      };
      const mockResult = {
        data: [highPerformanceOperator],
        total: 1,
        page: 1,
        limit: 20
      };
      
      jest.spyOn(operatorService as any, 'queryOperators').mockResolvedValue(mockResult);
      
      // Act
      const result = await operatorService.listOperators(filters);
      
      // Assert
      expect(result.data[0].performance_score).toBe(85);
    });

    it('should search operators by business name', async () => {
      // Arrange
      const filters: OperatorFilters = {
        search: 'Test Transport'
      };
      const mockResult = {
        data: [mockOperator],
        total: 1,
        page: 1,
        limit: 20
      };
      
      jest.spyOn(operatorService as any, 'queryOperators').mockResolvedValue(mockResult);
      
      // Act
      const result = await operatorService.listOperators(filters);
      
      // Assert
      expect(result.data[0].business_name).toBe('Test Transport Inc.');
    });

  });

  // =====================================================
  // FLEET MANAGEMENT TESTS
  // =====================================================

  describe('Fleet Management', () => {
    
    describe('addVehicle', () => {
      
      it('should add vehicle to operator fleet', async () => {
        // Arrange
        const vehicleData = {
          vehicle_plate_number: 'ABC-1234',
          vehicle_info: {
            make: 'Toyota',
            model: 'Vios',
            year: 2023,
            color: 'White',
            type: 'Sedan'
          },
          service_type: 'TNVS',
          vehicle_category: 'Sedan',
          seating_capacity: 5
        };
        
        jest.spyOn(operatorService as any, 'findOperatorById').mockResolvedValue(mockOperator);
        jest.spyOn(operatorService as any, 'addVehicleToDb').mockResolvedValue({
          id: 'veh-001',
          operator_id: 'op-test-001',
          ...vehicleData,
          status: 'active',
          registered_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
          is_active: true
        });
        
        // Act
        const result = await operatorService.addVehicle('op-test-001', vehicleData);
        
        // Assert
        expect(result).toBeDefined();
        expect(result.vehicle_plate_number).toBe('ABC-1234');
        expect(result.operator_id).toBe('op-test-001');
      });

      it('should enforce TNVS vehicle limit', async () => {
        // Arrange
        const operatorAtLimit = {
          ...mockOperator,
          current_vehicle_count: 3 // At TNVS limit
        };
        const vehicleData = {
          vehicle_plate_number: 'ABC-1234',
          vehicle_info: {
            make: 'Toyota',
            model: 'Vios',
            year: 2023,
            color: 'White',
            type: 'Sedan'
          },
          service_type: 'TNVS',
          vehicle_category: 'Sedan',
          seating_capacity: 5
        };
        
        jest.spyOn(operatorService as any, 'findOperatorById').mockResolvedValue(operatorAtLimit);
        
        // Act & Assert
        await expect(operatorService.addVehicle('op-test-001', vehicleData)).rejects.toThrow('Vehicle limit exceeded for TNVS operator');
      });

      it('should enforce general operator vehicle limit', async () => {
        // Arrange
        const generalOperatorAtLimit = {
          ...mockOperator,
          operator_type: 'general' as OperatorType,
          max_vehicles: 10,
          current_vehicle_count: 10 // At General limit
        };
        const vehicleData = {
          vehicle_plate_number: 'ABC-1234',
          vehicle_info: {
            make: 'Toyota',
            model: 'Vios',
            year: 2023,
            color: 'White',
            type: 'Sedan'
          },
          service_type: 'General',
          vehicle_category: 'Sedan',
          seating_capacity: 5
        };
        
        jest.spyOn(operatorService as any, 'findOperatorById').mockResolvedValue(generalOperatorAtLimit);
        
        // Act & Assert
        await expect(operatorService.addVehicle('op-test-001', vehicleData)).rejects.toThrow('Vehicle limit exceeded for general operator');
      });

    });

    describe('removeVehicle', () => {
      
      it('should remove vehicle from operator fleet', async () => {
        // Arrange
        jest.spyOn(operatorService as any, 'findOperatorById').mockResolvedValue(mockOperator);
        jest.spyOn(operatorService as any, 'removeVehicleFromDb').mockResolvedValue(true);
        
        // Act
        await operatorService.removeVehicle('op-test-001', 'veh-001');
        
        // Assert - Should complete without throwing
        expect(true).toBe(true);
      });

      it('should prevent removing assigned vehicle', async () => {
        // Arrange
        jest.spyOn(operatorService as any, 'findOperatorById').mockResolvedValue(mockOperator);
        jest.spyOn(operatorService as any, 'isVehicleAssigned').mockResolvedValue(true);
        
        // Act & Assert
        await expect(operatorService.removeVehicle('op-test-001', 'veh-001')).rejects.toThrow('Cannot remove vehicle that is assigned to a driver');
      });

    });

  });

  // =====================================================
  // BUSINESS LOGIC VALIDATION TESTS
  // =====================================================

  describe('Business Logic Validation', () => {
    
    it('should validate TIN format', () => {
      // Arrange
      const validTins = ['123-456-789-000', '987-654-321-001'];
      const invalidTins = ['123456789', '123-456-78', '123-456-789-00a'];
      
      validTins.forEach(tin => {
        expect((operatorService as any).validateTinFormat(tin)).toBe(true);
      });
      
      invalidTins.forEach(tin => {
        expect((operatorService as any).validateTinFormat(tin)).toBe(false);
      });
    });

    it('should validate Philippine address format', () => {
      // Arrange
      const validAddress = {
        street: '123 EDSA Highway',
        city: 'Makati',
        province: 'Metro Manila',
        region: 'NCR',
        postal_code: '1226',
        country: 'Philippines'
      };
      
      const invalidAddress = {
        street: '',
        city: 'Makati',
        province: 'Metro Manila',
        region: 'NCR',
        postal_code: '1226',
        country: 'Philippines'
      };
      
      // Act & Assert
      expect((operatorService as any).validateAddressFormat(validAddress)).toBe(true);
      expect((operatorService as any).validateAddressFormat(invalidAddress)).toBe(false);
    });

    it('should calculate performance score correctly', () => {
      // Arrange
      const metricsData = {
        daily_vehicle_utilization: 0.85,
        peak_hour_availability: 0.90,
        fleet_efficiency_ratio: 0.80,
        driver_retention_rate: 0.95,
        driver_performance_avg: 0.88,
        training_completion_rate: 1.0,
        safety_incident_rate: 0.02,
        regulatory_compliance: 1.0,
        vehicle_maintenance_score: 0.92,
        customer_satisfaction: 4.5,
        service_area_coverage: 0.75,
        technology_adoption: 0.85
      };
      
      // Act
      const score = (operatorService as any).calculatePerformanceScore(metricsData);
      
      // Assert
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should determine commission tier based on performance score', () => {
      // Test tier 1 (70-79)
      expect((operatorService as any).determineCommissionTier(75)).toBe('tier_1');
      
      // Test tier 2 (80-89)
      expect((operatorService as any).determineCommissionTier(85)).toBe('tier_2');
      
      // Test tier 3 (90+)
      expect((operatorService as any).determineCommissionTier(95)).toBe('tier_3');
      
      // Test below threshold
      expect((operatorService as any).determineCommissionTier(65)).toBe('tier_1');
    });

  });

  // =====================================================
  // ERROR HANDLING TESTS
  // =====================================================

  describe('Error Handling', () => {
    
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      jest.spyOn(operatorService as any, 'queryOperators').mockRejectedValue(new Error('Database connection failed'));
      
      // Act & Assert
      await expect(operatorService.listOperators()).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid operator ID format', async () => {
      // Act & Assert
      await expect(operatorService.getOperator('')).rejects.toThrow('Invalid operator ID format');
      await expect(operatorService.getOperator(null as any)).rejects.toThrow('Invalid operator ID format');
    });

    it('should handle malformed request data', async () => {
      // Arrange
      const malformedData = {
        operator_code: null,
        business_name: '',
        // Missing required fields
      } as any;
      
      // Act & Assert
      await expect(operatorService.createOperator(malformedData)).rejects.toThrow();
    });

  });

});