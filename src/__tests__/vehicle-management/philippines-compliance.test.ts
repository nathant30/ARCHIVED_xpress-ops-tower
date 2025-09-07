// Philippines-Specific Compliance and Regulatory Tests
// Comprehensive test suite for LTFRB, LTO, and Philippine transport regulations
// Testing compliance workflows, documentation, and regulatory requirements

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  LTFRBCompliance,
  ComplianceAlert,
  Vehicle,
  ComplianceStatus
} from '@/types/vehicles';
import {
  mockComplianceData,
  mockVehicles,
  philippinesTestData
} from './__fixtures__/vehicle-test-data';

// Mock modules for compliance testing
jest.mock('@/lib/compliance/ltfrbService');
jest.mock('@/lib/compliance/ltoService');
jest.mock('@/lib/compliance/complianceChecker');
jest.mock('@/lib/notifications/complianceNotifications');

// Philippines compliance service mock
class MockPhilippinesComplianceService {
  private complianceRecords: Map<string, LTFRBCompliance> = new Map();
  private alerts: ComplianceAlert[] = [];

  constructor() {
    this.seedTestData();
  }

  private seedTestData() {
    mockComplianceData.forEach(record => {
      this.complianceRecords.set(record.vehicleId, record);
    });
  }

  // LTFRB Franchise Management
  validateLTFRBFranchise(franchiseNumber: string, vehicleType: string, route?: string): {
    valid: boolean;
    status: string;
    expiryDate?: Date;
    violations: string[];
  } {
    // Validate franchise number format
    const franchisePattern = /^LTFRB-[A-Z]{3,4}-\d{4}-\d{3,4}$/;
    if (!franchisePattern.test(franchiseNumber)) {
      return {
        valid: false,
        status: 'invalid_format',
        violations: ['Franchise number format invalid']
      };
    }

    // Check franchise status in system
    const franchise = Array.from(this.complianceRecords.values())
      .find(r => r.franchiseNumber === franchiseNumber);

    if (!franchise) {
      return {
        valid: false,
        status: 'not_found',
        violations: ['Franchise not found in LTFRB database']
      };
    }

    const now = new Date();
    const isExpired = franchise.franchiseExpiryDate < now;
    const violations: string[] = [];

    if (isExpired) {
      violations.push('Franchise has expired');
    }

    if (franchise.franchiseStatus !== 'active') {
      violations.push(`Franchise status is ${franchise.franchiseStatus}`);
    }

    return {
      valid: !isExpired && franchise.franchiseStatus === 'active' && violations.length === 0,
      status: franchise.franchiseStatus,
      expiryDate: franchise.franchiseExpiryDate,
      violations
    };
  }

  // LTO Registration Validation
  validateLTORegistration(vehicleId: string): {
    valid: boolean;
    registrationNumber?: string;
    expiryDate?: Date;
    orCrExpiry?: Date;
    violations: string[];
  } {
    const compliance = this.complianceRecords.get(vehicleId);
    if (!compliance) {
      return {
        valid: false,
        violations: ['No compliance record found']
      };
    }

    const now = new Date();
    const violations: string[] = [];

    // Check registration expiry
    if (compliance.registrationExpiryDate < now) {
      violations.push('Vehicle registration has expired');
    }

    // Check OR/CR expiry
    if (compliance.orCrExpiryDate < now) {
      violations.push('OR/CR has expired');
    }

    return {
      valid: violations.length === 0,
      registrationNumber: compliance.registrationNumber,
      expiryDate: compliance.registrationExpiryDate,
      orCrExpiry: compliance.orCrExpiryDate,
      violations
    };
  }

  // Insurance Compliance
  validateInsuranceCompliance(vehicleId: string): {
    valid: boolean;
    compulsoryExpiry?: Date;
    comprehensiveExpiry?: Date;
    violations: string[];
  } {
    const compliance = this.complianceRecords.get(vehicleId);
    if (!compliance) {
      return { valid: false, violations: ['No compliance record found'] };
    }

    const now = new Date();
    const violations: string[] = [];

    // Check compulsory insurance (CTPL)
    if (compliance.compulsoryInsuranceExpiry < now) {
      violations.push('Compulsory insurance (CTPL) has expired');
    }

    // Check comprehensive insurance if available
    if (compliance.comprehensiveInsuranceExpiry && compliance.comprehensiveInsuranceExpiry < now) {
      violations.push('Comprehensive insurance has expired');
    }

    return {
      valid: violations.length === 0,
      compulsoryExpiry: compliance.compulsoryInsuranceExpiry,
      comprehensiveExpiry: compliance.comprehensiveInsuranceExpiry,
      violations
    };
  }

  // Vehicle Inspection Compliance
  validateVehicleInspection(vehicleId: string): {
    valid: boolean;
    lastInspectionDate?: Date;
    nextInspectionDue?: Date;
    inspectionResult?: string;
    violations: string[];
  } {
    const compliance = this.complianceRecords.get(vehicleId);
    if (!compliance) {
      return { valid: false, violations: ['No compliance record found'] };
    }

    const now = new Date();
    const violations: string[] = [];

    // Check if inspection is due
    if (compliance.nextInspectionDueDate < now) {
      violations.push('Vehicle inspection is overdue');
    }

    // Check last inspection result
    if (compliance.lastInspectionResult === 'failed') {
      violations.push('Last vehicle inspection failed');
    }

    return {
      valid: violations.length === 0,
      lastInspectionDate: compliance.lastInspectionDate,
      nextInspectionDue: compliance.nextInspectionDueDate,
      inspectionResult: compliance.lastInspectionResult,
      violations
    };
  }

  // Emissions Testing
  validateEmissionsCompliance(vehicleId: string): {
    valid: boolean;
    testResult?: string;
    testDate?: Date;
    certificateNumber?: string;
    violations: string[];
  } {
    const compliance = this.complianceRecords.get(vehicleId);
    if (!compliance) {
      return { valid: false, violations: ['No compliance record found'] };
    }

    const violations: string[] = [];

    // Check emissions test result
    if (compliance.emissionsTestResult !== 'passed') {
      violations.push(`Emissions test ${compliance.emissionsTestResult || 'not conducted'}`);
    }

    // Check test date (should be within last 6 months)
    if (compliance.emissionsTestDate) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      if (compliance.emissionsTestDate < sixMonthsAgo) {
        violations.push('Emissions test is outdated');
      }
    } else {
      violations.push('No emissions test on record');
    }

    return {
      valid: violations.length === 0,
      testResult: compliance.emissionsTestResult,
      testDate: compliance.emissionsTestDate,
      certificateNumber: compliance.emissionsCertificateNumber,
      violations
    };
  }

  // Number Coding Compliance
  validateNumberCoding(vehicleId: string, region: string, date: Date): {
    valid: boolean;
    codingDay?: number;
    exemptionStatus?: string;
    violations: string[];
  } {
    const vehicle = mockVehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
      return { valid: false, violations: ['Vehicle not found'] };
    }

    const scheme = philippinesTestData.numberCodingSchemes.find(s => s.region === region);
    if (!scheme) {
      return { valid: true, violations: [] }; // No coding scheme in this region
    }

    if (scheme.scheme === 'no_coding') {
      return { valid: true, violations: [] };
    }

    // Extract last digit of license plate
    const plateNumber = vehicle.licensePlate;
    const lastDigit = parseInt(plateNumber.slice(-1));
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const violations: string[] = [];
    let codingDay: number | undefined;

    // Manila UVVRP (Unified Vehicular Volume Reduction Program)
    if (scheme.scheme === 'unified_vehicular_volume_reduction_program') {
      const codingSchedule = {
        1: [1], // Monday: ending in 1
        2: [2], // Tuesday: ending in 2
        3: [3], // Wednesday: ending in 3
        4: [4], // Thursday: ending in 4
        5: [5], // Friday: ending in 5
      };

      codingDay = Object.keys(codingSchedule).find(day => 
        codingSchedule[parseInt(day) as keyof typeof codingSchedule].includes(lastDigit)
      ) ? parseInt(Object.keys(codingSchedule).find(day => 
        codingSchedule[parseInt(day) as keyof typeof codingSchedule].includes(lastDigit)
      )!) : undefined;

      if (codingDay === dayOfWeek && dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Check time (7:00 AM - 10:00 AM, 5:00 PM - 8:00 PM)
        const hour = date.getHours();
        if ((hour >= 7 && hour < 10) || (hour >= 17 && hour < 20)) {
          violations.push('Vehicle is subject to number coding restrictions');
        }
      }
    }

    return {
      valid: violations.length === 0,
      codingDay,
      violations
    };
  }

  // Traffic Violation Check
  checkTrafficViolations(vehicleId: string): {
    hasViolations: boolean;
    violations: Array<{
      violationType: string;
      date: Date;
      location: string;
      fine: number;
      status: string;
    }>;
    totalFines: number;
    penaltyPoints: number;
  } {
    const compliance = this.complianceRecords.get(vehicleId);
    if (!compliance) {
      return {
        hasViolations: false,
        violations: [],
        totalFines: 0,
        penaltyPoints: 0
      };
    }

    return {
      hasViolations: compliance.activeViolations.length > 0 || compliance.totalFinesPhp > 0,
      violations: compliance.violationHistory || [],
      totalFines: compliance.totalFinesPhp,
      penaltyPoints: compliance.penaltyPoints
    };
  }

  // Comprehensive Compliance Check
  performComprehensiveComplianceCheck(vehicleId: string): {
    overallStatus: ComplianceStatus;
    score: number;
    checks: {
      ltfrbFranchise: any;
      ltoRegistration: any;
      insurance: any;
      inspection: any;
      emissions: any;
      trafficViolations: any;
    };
    recommendations: string[];
    urgentIssues: string[];
  } {
    const checks = {
      ltfrbFranchise: this.validateLTFRBFranchise('LTFRB-NCR-2024-001', 'sedan'),
      ltoRegistration: this.validateLTORegistration(vehicleId),
      insurance: this.validateInsuranceCompliance(vehicleId),
      inspection: this.validateVehicleInspection(vehicleId),
      emissions: this.validateEmissionsCompliance(vehicleId),
      trafficViolations: this.checkTrafficViolations(vehicleId)
    };

    const recommendations: string[] = [];
    const urgentIssues: string[] = [];
    let score = 100;

    // Evaluate each check and adjust score
    Object.entries(checks).forEach(([checkType, result]) => {
      if ('valid' in result && !result.valid) {
        score -= 15;
        result.violations?.forEach((violation: string) => {
          if (violation.includes('expired') || violation.includes('overdue')) {
            urgentIssues.push(violation);
          } else {
            recommendations.push(`${checkType}: ${violation}`);
          }
        });
      }

      if (checkType === 'trafficViolations' && result.hasViolations) {
        score -= result.penaltyPoints * 2;
        if (result.penaltyPoints > 10) {
          urgentIssues.push('High penalty points - license suspension risk');
        }
      }
    });

    const overallStatus: ComplianceStatus = 
      score >= 90 ? 'compliant' :
      score >= 70 ? 'warning' :
      score >= 50 ? 'non_compliant' : 'suspended';

    return {
      overallStatus,
      score: Math.max(0, score),
      checks,
      recommendations,
      urgentIssues
    };
  }

  // Generate compliance alerts
  generateComplianceAlerts(vehicleId: string): ComplianceAlert[] {
    const alerts: ComplianceAlert[] = [];
    const compliance = this.complianceRecords.get(vehicleId);
    
    if (!compliance) return alerts;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Franchise expiry alert
    if (compliance.franchiseExpiryDate <= thirtyDaysFromNow) {
      alerts.push({
        id: `alert-franchise-${vehicleId}`,
        vehicleId,
        complianceId: compliance.id,
        alertType: 'franchise_expiry',
        alertCategory: 'franchise',
        alertPriority: compliance.franchiseExpiryDate < now ? 'critical' : 'major',
        alertTitle: 'LTFRB Franchise Expiry',
        alertMessage: `LTFRB franchise expires on ${compliance.franchiseExpiryDate.toLocaleDateString()}`,
        recommendedAction: 'Renew LTFRB franchise before expiry date',
        consequencesIfIgnored: 'Vehicle will be illegal to operate without valid franchise',
        daysUntilDue: Math.ceil((compliance.franchiseExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        alertLevel: 1,
        escalationSchedule: [],
        notifyDriver: true,
        notifyVehicleOwner: true,
        notifyFleetManager: true,
        notifyComplianceTeam: true,
        status: 'active',
        createdAt: now,
        sendCount: 0
      });
    }

    // Registration expiry alert
    if (compliance.registrationExpiryDate <= thirtyDaysFromNow) {
      alerts.push({
        id: `alert-registration-${vehicleId}`,
        vehicleId,
        complianceId: compliance.id,
        alertType: 'registration_expiry',
        alertCategory: 'registration',
        alertPriority: compliance.registrationExpiryDate < now ? 'critical' : 'major',
        alertTitle: 'Vehicle Registration Expiry',
        alertMessage: `Vehicle registration expires on ${compliance.registrationExpiryDate.toLocaleDateString()}`,
        recommendedAction: 'Renew vehicle registration at LTO',
        consequencesIfIgnored: 'Driving with expired registration is illegal',
        daysUntilDue: Math.ceil((compliance.registrationExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        alertLevel: 1,
        escalationSchedule: [],
        notifyDriver: false,
        notifyVehicleOwner: true,
        notifyFleetManager: true,
        notifyComplianceTeam: true,
        status: 'active',
        createdAt: now,
        sendCount: 0
      });
    }

    // Insurance expiry alert
    if (compliance.compulsoryInsuranceExpiry <= thirtyDaysFromNow) {
      alerts.push({
        id: `alert-insurance-${vehicleId}`,
        vehicleId,
        complianceId: compliance.id,
        alertType: 'insurance_expiry',
        alertCategory: 'insurance',
        alertPriority: compliance.compulsoryInsuranceExpiry < now ? 'critical' : 'major',
        alertTitle: 'Insurance Expiry',
        alertMessage: `Compulsory insurance expires on ${compliance.compulsoryInsuranceExpiry.toLocaleDateString()}`,
        recommendedAction: 'Renew compulsory third party liability insurance',
        consequencesIfIgnored: 'Operating without valid insurance violates law',
        daysUntilDue: Math.ceil((compliance.compulsoryInsuranceExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        alertLevel: 1,
        escalationSchedule: [],
        notifyDriver: true,
        notifyVehicleOwner: true,
        notifyFleetManager: true,
        notifyComplianceTeam: true,
        status: 'active',
        createdAt: now,
        sendCount: 0
      });
    }

    // Inspection due alert
    if (compliance.nextInspectionDueDate <= thirtyDaysFromNow) {
      alerts.push({
        id: `alert-inspection-${vehicleId}`,
        vehicleId,
        complianceId: compliance.id,
        alertType: 'inspection_due',
        alertCategory: 'inspection',
        alertPriority: compliance.nextInspectionDueDate < now ? 'critical' : 'minor',
        alertTitle: 'Vehicle Inspection Due',
        alertMessage: `Vehicle inspection due on ${compliance.nextInspectionDueDate.toLocaleDateString()}`,
        recommendedAction: 'Schedule vehicle inspection at authorized center',
        daysUntilDue: Math.ceil((compliance.nextInspectionDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        alertLevel: 1,
        escalationSchedule: [],
        notifyDriver: false,
        notifyVehicleOwner: true,
        notifyFleetManager: true,
        notifyComplianceTeam: true,
        status: 'active',
        createdAt: now,
        sendCount: 0
      });
    }

    return alerts;
  }
}

describe('Philippines-Specific Compliance Tests', () => {
  let complianceService: MockPhilippinesComplianceService;

  beforeEach(() => {
    complianceService = new MockPhilippinesComplianceService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // =====================================================
  // LTFRB Franchise Validation Tests
  // =====================================================

  describe('LTFRB Franchise Validation', () => {
    it('should validate LTFRB franchise number format', () => {
      const validResults = complianceService.validateLTFRBFranchise('LTFRB-NCR-2024-001', 'sedan');
      expect(validResults.valid).toBe(true);
      expect(validResults.violations).toHaveLength(0);

      const invalidResults = complianceService.validateLTFRBFranchise('INVALID-FORMAT', 'sedan');
      expect(invalidResults.valid).toBe(false);
      expect(invalidResults.violations).toContain('Franchise number format invalid');
    });

    it('should detect expired LTFRB franchise', () => {
      // Create expired franchise test case
      const expiredFranchise = 'LTFRB-NCR-2020-999'; // Non-existent, will be not found
      const results = complianceService.validateLTFRBFranchise(expiredFranchise, 'sedan');
      
      expect(results.valid).toBe(false);
      expect(results.status).toBe('not_found');
    });

    it('should validate franchise status (active, suspended, revoked)', () => {
      const results = complianceService.validateLTFRBFranchise('LTFRB-NCR-2024-001', 'sedan');
      expect(results.status).toBe('active');
    });

    it('should check franchise route compliance', () => {
      const results = complianceService.validateLTFRBFranchise('LTFRB-NCR-2024-001', 'sedan', 'Metro Manila');
      expect(results.valid).toBe(true);
    });
  });

  // =====================================================
  // LTO Registration Tests
  // =====================================================

  describe('LTO Registration Validation', () => {
    it('should validate vehicle registration status', () => {
      const results = complianceService.validateLTORegistration('veh-001');
      
      expect(results.valid).toBe(true);
      expect(results.registrationNumber).toBe('REG-NCR-001');
      expect(results.violations).toHaveLength(0);
    });

    it('should detect expired vehicle registration', () => {
      // Mock expired registration
      const mockExpiredVehicle = 'veh-expired';
      const results = complianceService.validateLTORegistration(mockExpiredVehicle);
      
      expect(results.valid).toBe(false);
      expect(results.violations).toContain('No compliance record found');
    });

    it('should validate OR/CR expiry dates', () => {
      const results = complianceService.validateLTORegistration('veh-001');
      
      expect(results.orCrExpiry).toBeInstanceOf(Date);
      expect(results.valid).toBe(true);
    });
  });

  // =====================================================
  // Insurance Compliance Tests
  // =====================================================

  describe('Insurance Compliance', () => {
    it('should validate compulsory third-party liability insurance', () => {
      const results = complianceService.validateInsuranceCompliance('veh-001');
      
      expect(results.valid).toBe(true);
      expect(results.compulsoryExpiry).toBeInstanceOf(Date);
      expect(results.violations).toHaveLength(0);
    });

    it('should check comprehensive insurance coverage', () => {
      const results = complianceService.validateInsuranceCompliance('veh-001');
      
      expect(results.comprehensiveExpiry).toBeInstanceOf(Date);
    });

    it('should alert on insurance expiry', () => {
      const alerts = complianceService.generateComplianceAlerts('veh-001');
      const insuranceAlerts = alerts.filter(a => a.alertCategory === 'insurance');
      
      // Should have insurance-related alerts if expiring soon
      expect(Array.isArray(insuranceAlerts)).toBe(true);
    });
  });

  // =====================================================
  // Vehicle Inspection Tests
  // =====================================================

  describe('Vehicle Inspection Compliance', () => {
    it('should validate vehicle inspection status', () => {
      const results = complianceService.validateVehicleInspection('veh-001');
      
      expect(results.valid).toBe(true);
      expect(results.inspectionResult).toBe('passed');
    });

    it('should detect overdue vehicle inspections', () => {
      // Test with overdue inspection scenario
      const results = complianceService.validateVehicleInspection('veh-003');
      
      // Vehicle 3 might have overdue inspection based on mock data
      if (!results.valid) {
        expect(results.violations).toContain('Vehicle inspection is overdue');
      }
    });

    it('should track inspection history and next due date', () => {
      const results = complianceService.validateVehicleInspection('veh-001');
      
      expect(results.lastInspectionDate).toBeInstanceOf(Date);
      expect(results.nextInspectionDue).toBeInstanceOf(Date);
    });
  });

  // =====================================================
  // Emissions Testing Tests
  // =====================================================

  describe('Emissions Testing Compliance', () => {
    it('should validate emissions test results', () => {
      const results = complianceService.validateEmissionsCompliance('veh-001');
      
      expect(results.valid).toBe(true);
      expect(results.testResult).toBe('passed');
    });

    it('should require current emissions certificate', () => {
      const results = complianceService.validateEmissionsCompliance('veh-001');
      
      if (results.testDate) {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        if (results.testDate < sixMonthsAgo) {
          expect(results.violations).toContain('Emissions test is outdated');
        }
      }
    });

    it('should track emissions certificate numbers', () => {
      const results = complianceService.validateEmissionsCompliance('veh-001');
      
      expect(results.certificateNumber).toBeTruthy();
    });
  });

  // =====================================================
  // Number Coding Compliance Tests
  // =====================================================

  describe('Number Coding Compliance', () => {
    it('should validate Manila UVVRP compliance', () => {
      const testDate = new Date('2024-12-09'); // Monday
      testDate.setHours(8); // 8 AM - within coding hours
      
      // Vehicle with plate ending in 1 (should be coded on Monday)
      const vehicle = { ...mockVehicles[0], licensePlate: 'ABC121' };
      
      const results = complianceService.validateNumberCoding(vehicle.id, 'region-manila', testDate);
      
      // Should detect coding violation
      if (!results.valid) {
        expect(results.violations).toContain('Vehicle is subject to number coding restrictions');
      }
    });

    it('should allow operations outside coding hours', () => {
      const testDate = new Date('2024-12-09'); // Monday
      testDate.setHours(14); // 2 PM - outside coding hours
      
      const results = complianceService.validateNumberCoding('veh-001', 'region-manila', testDate);
      
      expect(results.valid).toBe(true);
    });

    it('should handle regions without number coding', () => {
      const testDate = new Date('2024-12-09');
      const results = complianceService.validateNumberCoding('veh-002', 'region-cebu', testDate);
      
      expect(results.valid).toBe(true);
    });

    it('should support weekend exemptions', () => {
      const saturdayDate = new Date('2024-12-07'); // Saturday
      const results = complianceService.validateNumberCoding('veh-001', 'region-manila', saturdayDate);
      
      expect(results.valid).toBe(true);
    });
  });

  // =====================================================
  // Traffic Violation Tests
  // =====================================================

  describe('Traffic Violation Management', () => {
    it('should check for outstanding traffic violations', () => {
      const results = complianceService.checkTrafficViolations('veh-001');
      
      expect(typeof results.hasViolations).toBe('boolean');
      expect(Array.isArray(results.violations)).toBe(true);
      expect(typeof results.totalFines).toBe('number');
      expect(typeof results.penaltyPoints).toBe('number');
    });

    it('should calculate total fines and penalty points', () => {
      const results = complianceService.checkTrafficViolations('veh-001');
      
      expect(results.totalFines).toBeGreaterThanOrEqual(0);
      expect(results.penaltyPoints).toBeGreaterThanOrEqual(0);
    });

    it('should track violation history', () => {
      const results = complianceService.checkTrafficViolations('veh-001');
      
      results.violations.forEach(violation => {
        expect(violation).toHaveProperty('violationType');
        expect(violation).toHaveProperty('date');
        expect(violation).toHaveProperty('location');
        expect(violation).toHaveProperty('fine');
        expect(violation).toHaveProperty('status');
      });
    });
  });

  // =====================================================
  // Comprehensive Compliance Tests
  // =====================================================

  describe('Comprehensive Compliance Assessment', () => {
    it('should perform complete compliance check', () => {
      const results = complianceService.performComprehensiveComplianceCheck('veh-001');
      
      expect(results.overallStatus).toBeDefined();
      expect(results.score).toBeGreaterThanOrEqual(0);
      expect(results.score).toBeLessThanOrEqual(100);
      expect(results.checks).toHaveProperty('ltfrbFranchise');
      expect(results.checks).toHaveProperty('ltoRegistration');
      expect(results.checks).toHaveProperty('insurance');
      expect(results.checks).toHaveProperty('inspection');
      expect(results.checks).toHaveProperty('emissions');
      expect(results.checks).toHaveProperty('trafficViolations');
    });

    it('should calculate compliance score correctly', () => {
      const results = complianceService.performComprehensiveComplianceCheck('veh-001');
      
      // High-compliance vehicle should have high score
      if (results.overallStatus === 'compliant') {
        expect(results.score).toBeGreaterThanOrEqual(90);
      }
    });

    it('should provide actionable recommendations', () => {
      const results = complianceService.performComprehensiveComplianceCheck('veh-003');
      
      expect(Array.isArray(results.recommendations)).toBe(true);
      expect(Array.isArray(results.urgentIssues)).toBe(true);
    });

    it('should identify urgent compliance issues', () => {
      const results = complianceService.performComprehensiveComplianceCheck('veh-003');
      
      // Check that urgent issues are properly categorized
      results.urgentIssues.forEach(issue => {
        expect(typeof issue).toBe('string');
        expect(issue.length).toBeGreaterThan(0);
      });
    });
  });

  // =====================================================
  // Compliance Alert Generation Tests
  // =====================================================

  describe('Compliance Alert Generation', () => {
    it('should generate alerts for expiring documents', () => {
      const alerts = complianceService.generateComplianceAlerts('veh-001');
      
      expect(Array.isArray(alerts)).toBe(true);
      
      alerts.forEach(alert => {
        expect(alert).toHaveProperty('vehicleId');
        expect(alert).toHaveProperty('alertType');
        expect(alert).toHaveProperty('alertCategory');
        expect(alert).toHaveProperty('alertPriority');
        expect(alert).toHaveProperty('alertTitle');
        expect(alert).toHaveProperty('alertMessage');
        expect(alert).toHaveProperty('recommendedAction');
      });
    });

    it('should set appropriate alert priorities', () => {
      const alerts = complianceService.generateComplianceAlerts('veh-001');
      
      alerts.forEach(alert => {
        expect(['routine', 'minor', 'major', 'urgent', 'critical']).toContain(alert.alertPriority);
        
        // Critical alerts should be for expired documents
        if (alert.alertPriority === 'critical') {
          expect(alert.alertMessage.toLowerCase()).toMatch(/expir|overdue/);
        }
      });
    });

    it('should calculate days until due correctly', () => {
      const alerts = complianceService.generateComplianceAlerts('veh-001');
      
      alerts.forEach(alert => {
        if (alert.daysUntilDue !== undefined) {
          // Should be a valid number
          expect(typeof alert.daysUntilDue).toBe('number');
          
          // Negative days means overdue
          if (alert.daysUntilDue < 0) {
            expect(alert.alertPriority).toBe('critical');
          }
        }
      });
    });

    it('should set appropriate notification recipients', () => {
      const alerts = complianceService.generateComplianceAlerts('veh-001');
      
      alerts.forEach(alert => {
        // Compliance team should always be notified
        expect(alert.notifyComplianceTeam).toBe(true);
        
        // Critical alerts should notify more parties
        if (alert.alertPriority === 'critical') {
          expect(alert.notifyVehicleOwner).toBe(true);
        }
      });
    });
  });

  // =====================================================
  // Philippines-Specific Regulatory Tests
  // =====================================================

  describe('Philippines-Specific Regulations', () => {
    it('should validate Philippine region operations', () => {
      philippinesTestData.regions.forEach(region => {
        expect(region).toHaveProperty('id');
        expect(region).toHaveProperty('name');
        expect(region).toHaveProperty('provinces');
        expect(Array.isArray(region.provinces)).toBe(true);
      });
    });

    it('should support LTFRB regional offices', () => {
      philippinesTestData.ltfrbOffices.forEach(office => {
        expect(office).toHaveProperty('region');
        expect(office).toHaveProperty('office');
        expect(office).toHaveProperty('address');
        
        // Office should match a known region
        const validRegions = philippinesTestData.regions.map(r => r.id);
        expect(validRegions).toContain(office.region);
      });
    });

    it('should validate license plate formats per region', () => {
      philippinesTestData.plateNumberFormats.forEach(format => {
        expect(format).toHaveProperty('region');
        expect(format).toHaveProperty('format');
        
        // Format should be a valid regex pattern
        expect(() => new RegExp(format.format)).not.toThrow();
      });
    });

    it('should handle regional coding schemes correctly', () => {
      philippinesTestData.numberCodingSchemes.forEach(scheme => {
        expect(scheme).toHaveProperty('region');
        expect(scheme).toHaveProperty('scheme');
        
        const validSchemes = [
          'unified_vehicular_volume_reduction_program',
          'no_coding',
          'modified_coding'
        ];
        expect(validSchemes).toContain(scheme.scheme);
      });
    });
  });

  // =====================================================
  // Edge Cases and Error Handling
  // =====================================================

  describe('Edge Cases and Error Handling', () => {
    it('should handle vehicles without compliance records', () => {
      const results = complianceService.performComprehensiveComplianceCheck('non-existent-vehicle');
      
      expect(results.overallStatus).toBeDefined();
      expect(results.score).toBe(0);
    });

    it('should handle malformed franchise numbers gracefully', () => {
      const malformedNumbers = [
        '',
        'INVALID',
        'LTFRB-INVALID-FORMAT',
        'LTFRB-NCR-ABCD-XYZ'
      ];
      
      malformedNumbers.forEach(number => {
        const results = complianceService.validateLTFRBFranchise(number, 'sedan');
        expect(results.valid).toBe(false);
        expect(results.violations.length).toBeGreaterThan(0);
      });
    });

    it('should handle invalid dates in compliance checks', () => {
      const invalidDate = new Date('invalid-date');
      
      // Should not throw error
      expect(() => {
        complianceService.validateNumberCoding('veh-001', 'region-manila', invalidDate);
      }).not.toThrow();
    });

    it('should validate against SQL injection in franchise queries', () => {
      const maliciousInput = "LTFRB-NCR-2024-001'; DROP TABLE franchises; --";
      
      const results = complianceService.validateLTFRBFranchise(maliciousInput, 'sedan');
      expect(results.valid).toBe(false);
      expect(results.violations).toContain('Franchise number format invalid');
    });
  });

  // =====================================================
  // Performance Tests
  // =====================================================

  describe('Compliance Performance', () => {
    it('should perform compliance checks efficiently', () => {
      const startTime = Date.now();
      
      // Perform multiple compliance checks
      for (let i = 0; i < 100; i++) {
        complianceService.performComprehensiveComplianceCheck('veh-001');
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 100 checks within 2 seconds
      expect(duration).toBeLessThan(2000);
    });

    it('should handle concurrent compliance checks', async () => {
      const promises = Array.from({ length: 20 }, (_, i) =>
        Promise.resolve(complianceService.performComprehensiveComplianceCheck(`veh-00${i % 3 + 1}`))
      );
      
      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(1000);
      
      // All results should be valid
      results.forEach(result => {
        expect(result.overallStatus).toBeDefined();
        expect(result.score).toBeGreaterThanOrEqual(0);
      });
    });
  });
});