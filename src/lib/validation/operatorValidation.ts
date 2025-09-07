// =====================================================
// OPERATOR VALIDATION - Comprehensive validation functions
// Input validation, business rule validation, and data integrity checks
// =====================================================

import { 
  CreateOperatorRequest,
  UpdateOperatorRequest,
  OperatorType,
  CommissionTier,
  ContactInfo,
  Address,
  Certification,
  InsuranceDetails
} from '@/types/operators';

// =====================================================
// VALIDATION RESULT TYPES
// =====================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  context?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// =====================================================
// CORE VALIDATION FUNCTIONS
// =====================================================

/**
 * Validate create operator request
 */
export function validateCreateOperatorRequest(data: CreateOperatorRequest): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required field validation
  errors.push(...validateRequiredOperatorFields(data));
  
  // Business data validation
  errors.push(...validateOperatorCode(data.operator_code));
  errors.push(...validateOperatorType(data.operator_type));
  errors.push(...validateContactInfo(data.primary_contact, 'primary_contact'));
  errors.push(...validateAddress(data.business_address, 'business_address'));
  errors.push(...validateBusinessRegistration(data.business_registration_number));
  errors.push(...validateDates(data.partnership_start_date, data.partnership_end_date));
  
  // Optional field validation
  if (data.tin) {
    errors.push(...validateTIN(data.tin));
  }
  
  if (data.mailing_address) {
    errors.push(...validateAddress(data.mailing_address, 'mailing_address'));
  }
  
  if (data.ltfrb_authority_number) {
    errors.push(...validateLTFRBNumber(data.ltfrb_authority_number, data.operator_type));
  }
  
  if (data.certifications?.length) {
    errors.push(...validateCertifications(data.certifications));
  }
  
  if (data.insurance_details) {
    errors.push(...validateInsuranceDetails(data.insurance_details));
  }

  // Business rule warnings
  if (data.operator_type === 'tnvs' && !data.ltfrb_authority_number) {
    warnings.push({
      field: 'ltfrb_authority_number',
      message: 'TNVS operators typically require LTFRB authority number',
      code: 'MISSING_RECOMMENDED_FIELD'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate update operator request
 */
export function validateUpdateOperatorRequest(data: UpdateOperatorRequest): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Only validate provided fields for updates
  if (data.operator_code) {
    errors.push(...validateOperatorCode(data.operator_code));
  }
  
  if (data.operator_type) {
    errors.push(...validateOperatorType(data.operator_type));
  }
  
  if (data.primary_contact) {
    errors.push(...validateContactInfo(data.primary_contact, 'primary_contact'));
  }
  
  if (data.business_address) {
    errors.push(...validateAddress(data.business_address, 'business_address'));
  }
  
  if (data.business_registration_number) {
    errors.push(...validateBusinessRegistration(data.business_registration_number));
  }
  
  if (data.tin) {
    errors.push(...validateTIN(data.tin));
  }
  
  if (data.partnership_start_date || data.partnership_end_date) {
    errors.push(...validateDates(data.partnership_start_date, data.partnership_end_date));
  }
  
  if (data.ltfrb_authority_number) {
    errors.push(...validateLTFRBNumber(data.ltfrb_authority_number, data.operator_type));
  }
  
  if (data.certifications?.length) {
    errors.push(...validateCertifications(data.certifications));
  }
  
  if (data.insurance_details) {
    errors.push(...validateInsuranceDetails(data.insurance_details));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate commission tier change
 */
export function validateCommissionTierChange(
  currentTier: CommissionTier,
  targetTier: CommissionTier,
  operatorData: any
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate tier values
  if (!['tier_1', 'tier_2', 'tier_3'].includes(targetTier)) {
    errors.push({
      field: 'target_tier',
      message: 'Invalid commission tier. Must be tier_1, tier_2, or tier_3',
      code: 'INVALID_COMMISSION_TIER'
    });
  }

  // Check if change is meaningful
  if (currentTier === targetTier) {
    errors.push({
      field: 'target_tier',
      message: 'Target tier is the same as current tier',
      code: 'NO_TIER_CHANGE'
    });
  }

  // Validate downgrade business rules
  const tierHierarchy = ['tier_1', 'tier_2', 'tier_3'];
  const currentIndex = tierHierarchy.indexOf(currentTier);
  const targetIndex = tierHierarchy.indexOf(targetTier);
  const isDowngrade = targetIndex < currentIndex;

  if (isDowngrade && targetIndex < currentIndex - 1) {
    warnings.push({
      field: 'target_tier',
      message: 'Skipping tier levels in downgrade - consider gradual tier reduction',
      code: 'TIER_SKIP_WARNING'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate performance score data
 */
export function validatePerformanceScoreData(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate score ranges
  const scoreFields = [
    'vehicle_utilization_score',
    'driver_management_score', 
    'compliance_safety_score',
    'platform_contribution_score',
    'total_score'
  ];

  scoreFields.forEach(field => {
    if (data[field] !== undefined) {
      if (typeof data[field] !== 'number') {
        errors.push({
          field,
          message: `${field} must be a number`,
          code: 'INVALID_TYPE'
        });
      } else if (data[field] < 0 || data[field] > 100) {
        errors.push({
          field,
          message: `${field} must be between 0 and 100`,
          code: 'SCORE_OUT_OF_RANGE'
        });
      }
    }
  });

  // Validate category score limits
  if (data.vehicle_utilization_score > 30) {
    errors.push({
      field: 'vehicle_utilization_score',
      message: 'Vehicle utilization score cannot exceed 30 points',
      code: 'CATEGORY_SCORE_EXCEEDED'
    });
  }

  if (data.driver_management_score > 25) {
    errors.push({
      field: 'driver_management_score',
      message: 'Driver management score cannot exceed 25 points',
      code: 'CATEGORY_SCORE_EXCEEDED'
    });
  }

  if (data.compliance_safety_score > 25) {
    errors.push({
      field: 'compliance_safety_score',
      message: 'Compliance safety score cannot exceed 25 points',
      code: 'CATEGORY_SCORE_EXCEEDED'
    });
  }

  if (data.platform_contribution_score > 20) {
    errors.push({
      field: 'platform_contribution_score',
      message: 'Platform contribution score cannot exceed 20 points',
      code: 'CATEGORY_SCORE_EXCEEDED'
    });
  }

  // Validate total score consistency
  if (data.total_score !== undefined && 
      data.vehicle_utilization_score !== undefined &&
      data.driver_management_score !== undefined &&
      data.compliance_safety_score !== undefined &&
      data.platform_contribution_score !== undefined) {
    
    const calculatedTotal = data.vehicle_utilization_score + 
                           data.driver_management_score +
                           data.compliance_safety_score + 
                           data.platform_contribution_score;
    
    if (Math.abs(data.total_score - calculatedTotal) > 0.01) {
      errors.push({
        field: 'total_score',
        message: 'Total score does not match sum of category scores',
        code: 'SCORE_CALCULATION_ERROR',
        context: { calculated: calculatedTotal, provided: data.total_score }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// =====================================================
// SPECIFIC VALIDATION FUNCTIONS
// =====================================================

function validateRequiredOperatorFields(data: CreateOperatorRequest): ValidationError[] {
  const errors: ValidationError[] = [];
  const requiredFields = [
    'operator_code',
    'business_name',
    'legal_name',
    'operator_type',
    'primary_contact',
    'business_address',
    'business_registration_number',
    'primary_region_id',
    'partnership_start_date'
  ];

  requiredFields.forEach(field => {
    if (!data[field as keyof CreateOperatorRequest]) {
      errors.push({
        field,
        message: `${field} is required`,
        code: 'REQUIRED_FIELD_MISSING'
      });
    }
  });

  return errors;
}

function validateOperatorCode(operatorCode: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!operatorCode || operatorCode.trim().length === 0) {
    return errors; // Handled by required field validation
  }

  // Format: TYPE001, TYPE042, etc.
  const codePattern = /^[A-Z]{2,4}[0-9]{3}$/;
  if (!codePattern.test(operatorCode)) {
    errors.push({
      field: 'operator_code',
      message: 'Operator code must be in format: TYPE001 (2-4 letters followed by 3 digits)',
      code: 'INVALID_OPERATOR_CODE_FORMAT'
    });
  }

  if (operatorCode.length < 5 || operatorCode.length > 7) {
    errors.push({
      field: 'operator_code',
      message: 'Operator code must be 5-7 characters long',
      code: 'INVALID_OPERATOR_CODE_LENGTH'
    });
  }

  return errors;
}

function validateOperatorType(operatorType: OperatorType): ValidationError[] {
  const errors: ValidationError[] = [];
  const validTypes = ['tnvs', 'general', 'fleet'];

  if (!validTypes.includes(operatorType)) {
    errors.push({
      field: 'operator_type',
      message: 'Operator type must be one of: tnvs, general, fleet',
      code: 'INVALID_OPERATOR_TYPE'
    });
  }

  return errors;
}

function validateContactInfo(contactInfo: ContactInfo, fieldPrefix: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!contactInfo) {
    return errors; // Handled by required field validation
  }

  // Required contact fields
  if (!contactInfo.name || contactInfo.name.trim().length === 0) {
    errors.push({
      field: `${fieldPrefix}.name`,
      message: 'Contact name is required',
      code: 'REQUIRED_FIELD_MISSING'
    });
  }

  if (!contactInfo.email || contactInfo.email.trim().length === 0) {
    errors.push({
      field: `${fieldPrefix}.email`,
      message: 'Contact email is required',
      code: 'REQUIRED_FIELD_MISSING'
    });
  } else {
    // Email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(contactInfo.email)) {
      errors.push({
        field: `${fieldPrefix}.email`,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }
  }

  if (!contactInfo.phone || contactInfo.phone.trim().length === 0) {
    errors.push({
      field: `${fieldPrefix}.phone`,
      message: 'Contact phone is required',
      code: 'REQUIRED_FIELD_MISSING'
    });
  } else {
    // Philippine phone number validation
    const phonePattern = /^(\+63|0)[0-9]{10}$/;
    const cleanPhone = contactInfo.phone.replace(/[\s\-\(\)]/g, '');
    if (!phonePattern.test(cleanPhone)) {
      errors.push({
        field: `${fieldPrefix}.phone`,
        message: 'Invalid Philippine phone number format. Use +63XXXXXXXXXX or 0XXXXXXXXXXX',
        code: 'INVALID_PHONE_FORMAT'
      });
    }
  }

  if (!contactInfo.position || contactInfo.position.trim().length === 0) {
    errors.push({
      field: `${fieldPrefix}.position`,
      message: 'Contact position is required',
      code: 'REQUIRED_FIELD_MISSING'
    });
  }

  return errors;
}

function validateAddress(address: Address, fieldPrefix: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!address) {
    return errors; // Handled by required field validation
  }

  const requiredFields = ['street', 'city', 'province', 'region', 'country'];
  
  requiredFields.forEach(field => {
    if (!address[field as keyof Address] || 
        (address[field as keyof Address] as string).trim().length === 0) {
      errors.push({
        field: `${fieldPrefix}.${field}`,
        message: `${field} is required`,
        code: 'REQUIRED_FIELD_MISSING'
      });
    }
  });

  // Postal code validation (Philippine format)
  if (address.postal_code) {
    const postalPattern = /^[0-9]{4}$/;
    if (!postalPattern.test(address.postal_code)) {
      errors.push({
        field: `${fieldPrefix}.postal_code`,
        message: 'Invalid Philippine postal code format (4 digits)',
        code: 'INVALID_POSTAL_CODE'
      });
    }
  }

  // Coordinates validation
  if (address.coordinates) {
    const { latitude, longitude } = address.coordinates;
    
    if (latitude < -90 || latitude > 90) {
      errors.push({
        field: `${fieldPrefix}.coordinates.latitude`,
        message: 'Latitude must be between -90 and 90',
        code: 'INVALID_LATITUDE'
      });
    }
    
    if (longitude < -180 || longitude > 180) {
      errors.push({
        field: `${fieldPrefix}.coordinates.longitude`,
        message: 'Longitude must be between -180 and 180',
        code: 'INVALID_LONGITUDE'
      });
    }
  }

  return errors;
}

function validateBusinessRegistration(regNumber: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!regNumber || regNumber.trim().length === 0) {
    return errors; // Handled by required field validation
  }

  // Philippine business registration formats (simplified)
  if (regNumber.length < 8 || regNumber.length > 20) {
    errors.push({
      field: 'business_registration_number',
      message: 'Business registration number must be 8-20 characters',
      code: 'INVALID_REGISTRATION_LENGTH'
    });
  }

  return errors;
}

function validateTIN(tin: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Philippine TIN format: XXX-XXX-XXX-XXX
  const tinPattern = /^[0-9]{3}-[0-9]{3}-[0-9]{3}-[0-9]{3}$/;
  const cleanTIN = tin.replace(/[\s\-]/g, '');
  
  if (cleanTIN.length !== 12) {
    errors.push({
      field: 'tin',
      message: 'TIN must be 12 digits',
      code: 'INVALID_TIN_LENGTH'
    });
  } else if (!/^[0-9]{12}$/.test(cleanTIN)) {
    errors.push({
      field: 'tin',
      message: 'TIN must contain only digits',
      code: 'INVALID_TIN_FORMAT'
    });
  }

  return errors;
}

function validateLTFRBNumber(ltfrbNumber: string, operatorType?: OperatorType): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!ltfrbNumber || ltfrbNumber.trim().length === 0) {
    return errors;
  }

  // Basic LTFRB authority number validation
  if (ltfrbNumber.length < 5 || ltfrbNumber.length > 20) {
    errors.push({
      field: 'ltfrb_authority_number',
      message: 'LTFRB authority number must be 5-20 characters',
      code: 'INVALID_LTFRB_LENGTH'
    });
  }

  return errors;
}

function validateDates(startDate?: string, endDate?: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push({
      field: 'partnership_start_date',
      message: 'Invalid partnership start date format',
      code: 'INVALID_DATE_FORMAT'
    });
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push({
      field: 'partnership_end_date',
      message: 'Invalid partnership end date format',
      code: 'INVALID_DATE_FORMAT'
    });
  }

  if (startDate && endDate && 
      !isNaN(Date.parse(startDate)) && !isNaN(Date.parse(endDate))) {
    if (new Date(endDate) <= new Date(startDate)) {
      errors.push({
        field: 'partnership_end_date',
        message: 'Partnership end date must be after start date',
        code: 'INVALID_DATE_RANGE'
      });
    }
  }

  return errors;
}

function validateCertifications(certifications: Certification[]): ValidationError[] {
  const errors: ValidationError[] = [];

  certifications.forEach((cert, index) => {
    if (!cert.name || cert.name.trim().length === 0) {
      errors.push({
        field: `certifications.${index}.name`,
        message: 'Certification name is required',
        code: 'REQUIRED_FIELD_MISSING'
      });
    }

    if (!cert.certificate_number || cert.certificate_number.trim().length === 0) {
      errors.push({
        field: `certifications.${index}.certificate_number`,
        message: 'Certificate number is required',
        code: 'REQUIRED_FIELD_MISSING'
      });
    }

    if (cert.issue_date && isNaN(Date.parse(cert.issue_date))) {
      errors.push({
        field: `certifications.${index}.issue_date`,
        message: 'Invalid issue date format',
        code: 'INVALID_DATE_FORMAT'
      });
    }

    if (cert.expiry_date && isNaN(Date.parse(cert.expiry_date))) {
      errors.push({
        field: `certifications.${index}.expiry_date`,
        message: 'Invalid expiry date format',
        code: 'INVALID_DATE_FORMAT'
      });
    }

    if (cert.issue_date && cert.expiry_date && 
        !isNaN(Date.parse(cert.issue_date)) && !isNaN(Date.parse(cert.expiry_date))) {
      if (new Date(cert.expiry_date) <= new Date(cert.issue_date)) {
        errors.push({
          field: `certifications.${index}.expiry_date`,
          message: 'Certificate expiry date must be after issue date',
          code: 'INVALID_DATE_RANGE'
        });
      }
    }
  });

  return errors;
}

function validateInsuranceDetails(insurance: InsuranceDetails): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!insurance.provider || insurance.provider.trim().length === 0) {
    errors.push({
      field: 'insurance_details.provider',
      message: 'Insurance provider is required',
      code: 'REQUIRED_FIELD_MISSING'
    });
  }

  if (!insurance.policy_number || insurance.policy_number.trim().length === 0) {
    errors.push({
      field: 'insurance_details.policy_number',
      message: 'Insurance policy number is required',
      code: 'REQUIRED_FIELD_MISSING'
    });
  }

  if (insurance.coverage_amount <= 0) {
    errors.push({
      field: 'insurance_details.coverage_amount',
      message: 'Insurance coverage amount must be greater than 0',
      code: 'INVALID_COVERAGE_AMOUNT'
    });
  }

  if (insurance.effective_date && isNaN(Date.parse(insurance.effective_date))) {
    errors.push({
      field: 'insurance_details.effective_date',
      message: 'Invalid effective date format',
      code: 'INVALID_DATE_FORMAT'
    });
  }

  if (insurance.expiry_date && isNaN(Date.parse(insurance.expiry_date))) {
    errors.push({
      field: 'insurance_details.expiry_date',
      message: 'Invalid expiry date format',
      code: 'INVALID_DATE_FORMAT'
    });
  }

  if (insurance.effective_date && insurance.expiry_date && 
      !isNaN(Date.parse(insurance.effective_date)) && !isNaN(Date.parse(insurance.expiry_date))) {
    if (new Date(insurance.expiry_date) <= new Date(insurance.effective_date)) {
      errors.push({
        field: 'insurance_details.expiry_date',
        message: 'Insurance expiry date must be after effective date',
        code: 'INVALID_DATE_RANGE'
      });
    }
  }

  return errors;
}

// =====================================================
// BUSINESS RULE VALIDATION
// =====================================================

/**
 * Validate operator type vehicle limits
 */
export function validateOperatorVehicleLimit(
  operatorType: OperatorType,
  currentVehicleCount: number,
  requestedVehicleCount?: number
): ValidationResult {
  const errors: ValidationError[] = [];
  const limits = { tnvs: 3, general: 10, fleet: 999999 };
  const maxVehicles = limits[operatorType];

  const vehicleCount = requestedVehicleCount ?? currentVehicleCount;

  if (vehicleCount > maxVehicles) {
    errors.push({
      field: 'vehicle_count',
      message: `${operatorType.toUpperCase()} operators can have maximum ${maxVehicles} vehicles`,
      code: 'VEHICLE_LIMIT_EXCEEDED',
      context: { operatorType, maxVehicles, requestedCount: vehicleCount }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/**
 * Validate regional access permissions
 */
export function validateRegionalAccess(
  userAllowedRegions: string[],
  requestedRegions: string[]
): ValidationResult {
  const errors: ValidationError[] = [];

  // Admin users (no regional restrictions) can access any region
  if (userAllowedRegions.length === 0) {
    return { isValid: true, errors: [], warnings: [] };
  }

  const invalidRegions = requestedRegions.filter(region => 
    !userAllowedRegions.includes(region)
  );

  if (invalidRegions.length > 0) {
    errors.push({
      field: 'regions',
      message: `Access denied to regions: ${invalidRegions.join(', ')}`,
      code: 'REGION_ACCESS_DENIED',
      context: { 
        userAllowedRegions, 
        requestedRegions, 
        deniedRegions: invalidRegions 
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

export default {
  validateCreateOperatorRequest,
  validateUpdateOperatorRequest,
  validateCommissionTierChange,
  validatePerformanceScoreData,
  validateOperatorVehicleLimit,
  validateRegionalAccess
};