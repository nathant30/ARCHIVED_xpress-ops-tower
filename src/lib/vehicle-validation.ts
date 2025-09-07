// Vehicle Management Validation Library
// Comprehensive validation utilities for vehicle management API endpoints

import { 
  VehicleOwnershipType, 
  VehicleStatus, 
  VehicleCondition,
  MaintenancePriority,
  AssignmentType,
  VehicleCategory,
  FuelType 
} from '@/types/vehicles';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

// Vehicle validation rules
export class VehicleValidator {
  
  // Validate vehicle creation data
  static validateVehicleCreation(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required fields validation
    const requiredFields = [
      'vehicleCode', 'licensePlate', 'make', 'model', 'year', 'color',
      'category', 'fuelType', 'seatingCapacity', 'ownershipType', 'regionId',
      'serviceTypes', 'registrationExpiry'
    ];

    for (const field of requiredFields) {
      if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED_FIELD_MISSING',
          value: data[field]
        });
      }
    }

    // Vehicle code validation
    if (data.vehicleCode) {
      if (!/^[A-Z0-9-]{3,20}$/.test(data.vehicleCode)) {
        errors.push({
          field: 'vehicleCode',
          message: 'Vehicle code must be 3-20 characters, alphanumeric with hyphens only',
          code: 'INVALID_VEHICLE_CODE_FORMAT',
          value: data.vehicleCode
        });
      }
    }

    // License plate validation (Philippines format)
    if (data.licensePlate) {
      if (!/^[A-Z0-9]{3}[0-9]{3}$|^[A-Z]{3}[0-9]{4}$|^[0-9]{3}[A-Z]{3}$/.test(data.licensePlate.replace(/[\s-]/g, ''))) {
        errors.push({
          field: 'licensePlate',
          message: 'Invalid Philippines license plate format',
          code: 'INVALID_LICENSE_PLATE_FORMAT',
          value: data.licensePlate
        });
      }
    }

    // Year validation
    if (data.year) {
      const currentYear = new Date().getFullYear();
      if (data.year < 1990 || data.year > currentYear + 2) {
        errors.push({
          field: 'year',
          message: `Year must be between 1990 and ${currentYear + 2}`,
          code: 'INVALID_YEAR_RANGE',
          value: data.year
        });
      }

      // Warn about very old vehicles
      if (data.year < currentYear - 15) {
        warnings.push({
          field: 'year',
          message: 'Vehicle is more than 15 years old, may have higher maintenance costs',
          code: 'OLD_VEHICLE_WARNING',
          value: data.year
        });
      }
    }

    // Seating capacity validation
    if (data.seatingCapacity) {
      if (data.seatingCapacity < 1 || data.seatingCapacity > 50) {
        errors.push({
          field: 'seatingCapacity',
          message: 'Seating capacity must be between 1 and 50',
          code: 'INVALID_SEATING_CAPACITY',
          value: data.seatingCapacity
        });
      }
    }

    // Ownership type validation
    if (data.ownershipType) {
      const validOwnershipTypes: VehicleOwnershipType[] = ['xpress_owned', 'fleet_owned', 'operator_owned', 'driver_owned'];
      if (!validOwnershipTypes.includes(data.ownershipType)) {
        errors.push({
          field: 'ownershipType',
          message: `Ownership type must be one of: ${validOwnershipTypes.join(', ')}`,
          code: 'INVALID_OWNERSHIP_TYPE',
          value: data.ownershipType
        });
      }

      // Ownership-specific validations
      if (data.ownershipType === 'fleet_owned' && !data.fleetOwnerName) {
        errors.push({
          field: 'fleetOwnerName',
          message: 'Fleet owner name is required for fleet-owned vehicles',
          code: 'REQUIRED_FOR_FLEET_OWNED',
          value: data.fleetOwnerName
        });
      }

      if (data.ownershipType === 'operator_owned' && !data.operatorOwnerName) {
        errors.push({
          field: 'operatorOwnerName',
          message: 'Operator owner name is required for operator-owned vehicles',
          code: 'REQUIRED_FOR_OPERATOR_OWNED',
          value: data.operatorOwnerName
        });
      }

      if (data.ownershipType === 'xpress_owned' && data.acquisitionCost && data.acquisitionCost <= 0) {
        errors.push({
          field: 'acquisitionCost',
          message: 'Acquisition cost must be greater than 0 for Xpress-owned vehicles',
          code: 'INVALID_ACQUISITION_COST',
          value: data.acquisitionCost
        });
      }
    }

    // Category validation
    if (data.category) {
      const validCategories: VehicleCategory[] = [
        'sedan', 'hatchback', 'suv', 'mpv', 'van', 'motorcycle', 'tricycle', 'jeepney', 'e_jeepney', 'bus'
      ];
      if (!validCategories.includes(data.category)) {
        errors.push({
          field: 'category',
          message: `Vehicle category must be one of: ${validCategories.join(', ')}`,
          code: 'INVALID_VEHICLE_CATEGORY',
          value: data.category
        });
      }
    }

    // Fuel type validation
    if (data.fuelType) {
      const validFuelTypes: FuelType[] = ['gasoline', 'diesel', 'lpg', 'electric', 'hybrid_gas', 'hybrid_diesel'];
      if (!validFuelTypes.includes(data.fuelType)) {
        errors.push({
          field: 'fuelType',
          message: `Fuel type must be one of: ${validFuelTypes.join(', ')}`,
          code: 'INVALID_FUEL_TYPE',
          value: data.fuelType
        });
      }
    }

    // Registration expiry validation
    if (data.registrationExpiry) {
      const expiryDate = new Date(data.registrationExpiry);
      if (isNaN(expiryDate.getTime())) {
        errors.push({
          field: 'registrationExpiry',
          message: 'Invalid registration expiry date format',
          code: 'INVALID_DATE_FORMAT',
          value: data.registrationExpiry
        });
      } else if (expiryDate < new Date()) {
        errors.push({
          field: 'registrationExpiry',
          message: 'Registration expiry date cannot be in the past',
          code: 'PAST_EXPIRY_DATE',
          value: data.registrationExpiry
        });
      } else if (expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
        warnings.push({
          field: 'registrationExpiry',
          message: 'Registration expires within 30 days',
          code: 'EXPIRY_WARNING',
          value: data.registrationExpiry
        });
      }
    }

    // Service types validation
    if (data.serviceTypes) {
      const validServiceTypes = ['ride_4w', 'ride_2w', 'delivery', 'rental', 'shuttle'];
      const invalidServices = data.serviceTypes.filter((type: string) => !validServiceTypes.includes(type));
      if (invalidServices.length > 0) {
        errors.push({
          field: 'serviceTypes',
          message: `Invalid service types: ${invalidServices.join(', ')}`,
          code: 'INVALID_SERVICE_TYPES',
          value: invalidServices
        });
      }
    }

    // Engine displacement validation (if provided)
    if (data.engineDisplacement !== undefined) {
      if (data.engineDisplacement < 50 || data.engineDisplacement > 8000) {
        errors.push({
          field: 'engineDisplacement',
          message: 'Engine displacement must be between 50cc and 8000cc',
          code: 'INVALID_ENGINE_DISPLACEMENT',
          value: data.engineDisplacement
        });
      }
    }

    // VIN validation (if provided)
    if (data.vin) {
      if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(data.vin)) {
        errors.push({
          field: 'vin',
          message: 'VIN must be exactly 17 characters (excluding I, O, Q)',
          code: 'INVALID_VIN_FORMAT',
          value: data.vin
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate vehicle update data
  static validateVehicleUpdate(data: any, existingVehicle: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Status validation
    if (data.status) {
      const validStatuses: VehicleStatus[] = [
        'active', 'in_service', 'maintenance', 'inspection', 'inactive', 'decommissioned', 'impounded'
      ];
      if (!validStatuses.includes(data.status)) {
        errors.push({
          field: 'status',
          message: `Vehicle status must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_VEHICLE_STATUS',
          value: data.status
        });
      }

      // Status transition validation
      const validTransitions: Record<VehicleStatus, VehicleStatus[]> = {
        'active': ['in_service', 'maintenance', 'inspection', 'inactive', 'impounded'],
        'in_service': ['active', 'maintenance', 'inspection', 'inactive'],
        'maintenance': ['active', 'inactive', 'decommissioned'],
        'inspection': ['active', 'maintenance', 'inactive'],
        'inactive': ['active', 'maintenance', 'inspection', 'decommissioned'],
        'decommissioned': [], // Cannot transition from decommissioned
        'impounded': ['active', 'inactive'] // Can return from impounded
      };

      if (existingVehicle && existingVehicle.status !== data.status) {
        const allowedTransitions = validTransitions[existingVehicle.status as VehicleStatus] || [];
        if (!allowedTransitions.includes(data.status)) {
          errors.push({
            field: 'status',
            message: `Cannot transition from ${existingVehicle.status} to ${data.status}`,
            code: 'INVALID_STATUS_TRANSITION',
            value: { from: existingVehicle.status, to: data.status }
          });
        }
      }
    }

    // Condition rating validation
    if (data.conditionRating) {
      const validConditions: VehicleCondition[] = ['excellent', 'good', 'fair', 'poor', 'critical'];
      if (!validConditions.includes(data.conditionRating)) {
        errors.push({
          field: 'conditionRating',
          message: `Condition rating must be one of: ${validConditions.join(', ')}`,
          code: 'INVALID_CONDITION_RATING',
          value: data.conditionRating
        });
      }
    }

    // Condition score validation
    if (data.conditionScore !== undefined) {
      if (data.conditionScore < 0 || data.conditionScore > 100) {
        errors.push({
          field: 'conditionScore',
          message: 'Condition score must be between 0 and 100',
          code: 'INVALID_CONDITION_SCORE',
          value: data.conditionScore
        });
      }

      // Warn about critical condition
      if (data.conditionScore < 60) {
        warnings.push({
          field: 'conditionScore',
          message: 'Vehicle condition is below acceptable threshold (60%)',
          code: 'CRITICAL_CONDITION_WARNING',
          value: data.conditionScore
        });
      }
    }

    // Financial validations
    const financialFields = ['acquisitionCost', 'currentMarketValue', 'insuranceValue'];
    for (const field of financialFields) {
      if (data[field] !== undefined && data[field] < 0) {
        errors.push({
          field,
          message: `${field} cannot be negative`,
          code: 'NEGATIVE_FINANCIAL_VALUE',
          value: data[field]
        });
      }
    }

    // Utilization rate validation
    if (data.utilizationRate !== undefined) {
      if (data.utilizationRate < 0 || data.utilizationRate > 100) {
        errors.push({
          field: 'utilizationRate',
          message: 'Utilization rate must be between 0 and 100',
          code: 'INVALID_UTILIZATION_RATE',
          value: data.utilizationRate
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate driver assignment data
  static validateDriverAssignment(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required fields
    const requiredFields = ['driverId', 'assignmentType'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED_FIELD_MISSING',
          value: data[field]
        });
      }
    }

    // Assignment type validation
    if (data.assignmentType) {
      const validTypes: AssignmentType[] = ['primary', 'secondary', 'temporary'];
      if (!validTypes.includes(data.assignmentType)) {
        errors.push({
          field: 'assignmentType',
          message: `Assignment type must be one of: ${validTypes.join(', ')}`,
          code: 'INVALID_ASSIGNMENT_TYPE',
          value: data.assignmentType
        });
      }
    }

    // Date validations
    if (data.validFrom && data.validUntil) {
      const fromDate = new Date(data.validFrom);
      const untilDate = new Date(data.validUntil);

      if (isNaN(fromDate.getTime()) || isNaN(untilDate.getTime())) {
        errors.push({
          field: 'dateRange',
          message: 'Invalid date format in validity period',
          code: 'INVALID_DATE_FORMAT',
          value: { validFrom: data.validFrom, validUntil: data.validUntil }
        });
      } else if (fromDate >= untilDate) {
        errors.push({
          field: 'validUntil',
          message: 'Valid until date must be after valid from date',
          code: 'INVALID_DATE_RANGE',
          value: { validFrom: data.validFrom, validUntil: data.validUntil }
        });
      }

      // Warn about short assignments
      if (fromDate.getTime() && untilDate.getTime()) {
        const daysDiff = (untilDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff < 7) {
          warnings.push({
            field: 'dateRange',
            message: 'Assignment duration is less than 7 days',
            code: 'SHORT_ASSIGNMENT_WARNING',
            value: Math.round(daysDiff)
          });
        }
      }
    }

    // Rental fee validation
    if (data.dailyRentalFee !== undefined) {
      if (data.dailyRentalFee < 0) {
        errors.push({
          field: 'dailyRentalFee',
          message: 'Daily rental fee cannot be negative',
          code: 'NEGATIVE_RENTAL_FEE',
          value: data.dailyRentalFee
        });
      }

      // Warn about high rental fees
      if (data.dailyRentalFee > 2000) {
        warnings.push({
          field: 'dailyRentalFee',
          message: 'Daily rental fee is unusually high (>₱2000)',
          code: 'HIGH_RENTAL_FEE_WARNING',
          value: data.dailyRentalFee
        });
      }
    }

    // Responsibility validation
    const responsibilityFields = ['fuelResponsibility', 'maintenanceResponsibility'];
    for (const field of responsibilityFields) {
      if (data[field] && !['driver', 'owner', 'shared'].includes(data[field])) {
        errors.push({
          field,
          message: `${field} must be one of: driver, owner, shared`,
          code: 'INVALID_RESPONSIBILITY_TYPE',
          value: data[field]
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate maintenance data
  static validateMaintenance(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required fields
    const requiredFields = ['maintenanceType', 'priority', 'scheduledDate', 'description'];
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push({
          field,
          message: `${field} is required`,
          code: 'REQUIRED_FIELD_MISSING',
          value: data[field]
        });
      }
    }

    // Priority validation
    if (data.priority) {
      const validPriorities: MaintenancePriority[] = ['routine', 'minor', 'major', 'urgent', 'critical'];
      if (!validPriorities.includes(data.priority)) {
        errors.push({
          field: 'priority',
          message: `Priority must be one of: ${validPriorities.join(', ')}`,
          code: 'INVALID_MAINTENANCE_PRIORITY',
          value: data.priority
        });
      }
    }

    // Date validations
    if (data.scheduledDate) {
      const scheduledDate = new Date(data.scheduledDate);
      if (isNaN(scheduledDate.getTime())) {
        errors.push({
          field: 'scheduledDate',
          message: 'Invalid scheduled date format',
          code: 'INVALID_DATE_FORMAT',
          value: data.scheduledDate
        });
      } else if (scheduledDate < new Date()) {
        errors.push({
          field: 'scheduledDate',
          message: 'Scheduled date cannot be in the past',
          code: 'PAST_SCHEDULED_DATE',
          value: data.scheduledDate
        });
      }
    }

    // Cost validations
    const costFields = ['partsCost', 'laborCost', 'otherCosts', 'totalCost'];
    for (const field of costFields) {
      if (data[field] !== undefined && data[field] < 0) {
        errors.push({
          field,
          message: `${field} cannot be negative`,
          code: 'NEGATIVE_COST',
          value: data[field]
        });
      }
    }

    // Duration validations
    if (data.estimatedDurationHours !== undefined) {
      if (data.estimatedDurationHours <= 0 || data.estimatedDurationHours > 24) {
        errors.push({
          field: 'estimatedDurationHours',
          message: 'Estimated duration must be between 0 and 24 hours',
          code: 'INVALID_DURATION',
          value: data.estimatedDurationHours
        });
      }
    }

    if (data.laborHours !== undefined) {
      if (data.laborHours < 0 || data.laborHours > 24) {
        errors.push({
          field: 'laborHours',
          message: 'Labor hours must be between 0 and 24',
          code: 'INVALID_LABOR_HOURS',
          value: data.laborHours
        });
      }
    }

    // Quality rating validation
    if (data.qualityRating !== undefined) {
      if (data.qualityRating < 1 || data.qualityRating > 5) {
        errors.push({
          field: 'qualityRating',
          message: 'Quality rating must be between 1 and 5',
          code: 'INVALID_QUALITY_RATING',
          value: data.qualityRating
        });
      }
    }

    // Warn about high-cost maintenance
    if (data.totalCost && data.totalCost > 50000) {
      warnings.push({
        field: 'totalCost',
        message: 'Maintenance cost is unusually high (>₱50,000)',
        code: 'HIGH_MAINTENANCE_COST_WARNING',
        value: data.totalCost
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Business rule validations
  static validateBusinessRules(action: string, data: any, context: any = {}): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    switch (action) {
      case 'vehicle_deletion':
        // Cannot delete vehicle in service
        if (context.vehicle?.status === 'in_service') {
          errors.push({
            field: 'status',
            message: 'Cannot delete vehicle currently in service',
            code: 'VEHICLE_IN_SERVICE',
            value: context.vehicle.status
          });
        }
        
        // Cannot delete if has active trips
        if (context.hasActiveTrips) {
          errors.push({
            field: 'activeTrips',
            message: 'Cannot delete vehicle with active trips',
            code: 'VEHICLE_HAS_ACTIVE_TRIPS',
            value: context.hasActiveTrips
          });
        }
        break;

      case 'primary_assignment':
        // Cannot assign primary driver if vehicle already has one
        if (context.existingPrimaryAssignment) {
          errors.push({
            field: 'assignmentType',
            message: 'Vehicle already has an active primary driver assignment',
            code: 'EXISTING_PRIMARY_ASSIGNMENT',
            value: context.existingPrimaryAssignment
          });
        }
        
        // Cannot assign driver who already has primary assignment
        if (context.driverHasPrimaryAssignment) {
          errors.push({
            field: 'driverId',
            message: 'Driver already has an active primary vehicle assignment',
            code: 'DRIVER_ALREADY_ASSIGNED',
            value: context.driverHasPrimaryAssignment
          });
        }
        break;

      case 'maintenance_completion':
        // Required fields for completion
        if (!data.workPerformed) {
          errors.push({
            field: 'workPerformed',
            message: 'Work performed description is required for completion',
            code: 'REQUIRED_FOR_COMPLETION',
            value: data.workPerformed
          });
        }
        
        if (!data.actualCompletionTime) {
          errors.push({
            field: 'actualCompletionTime',
            message: 'Actual completion time is required for completion',
            code: 'REQUIRED_FOR_COMPLETION',
            value: data.actualCompletionTime
          });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate compliance data
  static validateCompliance(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Philippines-specific validations
    if (data.franchiseNumber && !/^[A-Z0-9-]{5,20}$/.test(data.franchiseNumber)) {
      errors.push({
        field: 'franchiseNumber',
        message: 'Invalid LTFRB franchise number format',
        code: 'INVALID_FRANCHISE_NUMBER',
        value: data.franchiseNumber
      });
    }

    if (data.registrationNumber && !/^[A-Z0-9-]{5,15}$/.test(data.registrationNumber)) {
      errors.push({
        field: 'registrationNumber',
        message: 'Invalid vehicle registration number format',
        code: 'INVALID_REGISTRATION_NUMBER',
        value: data.registrationNumber
      });
    }

    // Date validations for compliance documents
    const dateFields = [
      'franchiseExpiryDate', 'registrationExpiryDate', 'nextInspectionDueDate',
      'compulsoryInsuranceExpiry', 'comprehensiveInsuranceExpiry'
    ];

    const today = new Date();
    for (const field of dateFields) {
      if (data[field]) {
        const date = new Date(data[field]);
        if (isNaN(date.getTime())) {
          errors.push({
            field,
            message: `Invalid date format for ${field}`,
            code: 'INVALID_DATE_FORMAT',
            value: data[field]
          });
        } else if (date <= today) {
          const severity = field.includes('franchise') || field.includes('insurance') ? 'error' : 'warning';
          const errorObj = {
            field,
            message: `${field} has expired or expires today`,
            code: 'EXPIRED_DOCUMENT',
            value: data[field]
          };
          
          if (severity === 'error') {
            errors.push(errorObj);
          } else {
            warnings.push(errorObj);
          }
        } else if (date <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
          warnings.push({
            field,
            message: `${field} expires within 30 days`,
            code: 'EXPIRY_WARNING',
            value: data[field]
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Utility function to format validation errors for API responses
export function formatValidationErrors(errors: ValidationError[]): any[] {
  return errors.map(error => ({
    field: error.field,
    message: error.message,
    code: error.code,
    ...(error.value !== undefined && { value: error.value })
  }));
}