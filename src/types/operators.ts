// =====================================================
// OPERATORS MANAGEMENT TYPES
// TypeScript interfaces for comprehensive operators management
// =====================================================

// =====================================================
// CORE OPERATOR TYPES
// =====================================================

export type OperatorType = 'tnvs' | 'general' | 'fleet';

export type OperatorStatus = 
  | 'active' 
  | 'inactive' 
  | 'suspended' 
  | 'pending_approval' 
  | 'under_review' 
  | 'decommissioned';

export type CommissionTier = 'tier_1' | 'tier_2' | 'tier_3';

export type LocationType = 'headquarters' | 'branch' | 'garage' | 'terminal';

export type PerformanceMetricType = 
  | 'vehicle_utilization' 
  | 'driver_management' 
  | 'compliance_safety' 
  | 'platform_contribution';

export type ScoringFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export type TierQualificationStatus = 
  | 'qualified' 
  | 'under_review' 
  | 'disqualified' 
  | 'probationary';

export type FinancialTransactionType = 
  | 'commission_earned'
  | 'boundary_fee'
  | 'incentive_bonus'
  | 'penalty_deduction'
  | 'fuel_subsidy'
  | 'maintenance_subsidy'
  | 'insurance_payment'
  | 'registration_fee'
  | 'adjustment'
  | 'refund'
  | 'withdrawal'
  | 'deposit';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export type FinancialPeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export type CommissionCalculationMethod = 
  | 'percentage'
  | 'fixed_rate'
  | 'tiered'
  | 'performance_based';

// =====================================================
// CORE INTERFACES
// =====================================================

export interface ContactInfo {
  name: string;
  phone: string;
  email: string;
  position: string;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  region: string;
  postal_code: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  color: string;
  type: string;
  vin?: string;
  engine_number?: string;
}

export interface InsuranceDetails {
  provider: string;
  policy_number: string;
  coverage_amount: number;
  effective_date: string;
  expiry_date: string;
  contact_info: ContactInfo;
}

export interface Certification {
  name: string;
  issuing_authority: string;
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'expired' | 'suspended';
}

// =====================================================
// OPERATOR ENTITIES
// =====================================================

export interface Operator {
  id: string;
  
  // Basic information
  operator_code: string;
  business_name: string;
  legal_name: string;
  trade_name?: string;
  
  // Classification
  operator_type: OperatorType;
  status: OperatorStatus;
  
  // Contact information
  primary_contact: ContactInfo;
  business_address: Address;
  mailing_address?: Address;
  
  // Regulatory information
  business_registration_number: string;
  tin?: string;
  sec_registration?: string;
  ltfrb_authority_number?: string;
  lto_accreditation?: string;
  
  // Regional operations
  primary_region_id: string;
  allowed_regions: string[];
  
  // Vehicle limits
  max_vehicles: number;
  current_vehicle_count: number;
  
  // Performance metrics
  performance_score: number;
  commission_tier: CommissionTier;
  tier_qualification_date?: string;
  
  // Financial information
  wallet_balance: number;
  earnings_today: number;
  earnings_week: number;
  earnings_month: number;
  total_commissions_earned: number;
  
  // Insurance and compliance
  insurance_details: InsuranceDetails;
  certifications: Certification[];
  compliance_documents: Record<string, any>;
  
  // Operational settings
  operational_hours: {
    start: string;
    end: string;
  };
  service_areas: any[];
  special_permissions: Record<string, any>;
  
  // Partnership information
  user_id?: string;
  assigned_account_manager?: string;
  partnership_start_date: string;
  partnership_end_date?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active: boolean;
}

export interface OperatorLocation {
  id: string;
  operator_id: string;
  
  // Location details
  location_type: LocationType;
  name: string;
  address: Address;
  contact_info: ContactInfo;
  
  // Geospatial data
  location: {
    latitude: number;
    longitude: number;
  };
  coverage_area?: any; // GeoJSON polygon
  
  // Operational information
  operating_hours: {
    start: string;
    end: string;
  };
  capacity_vehicles: number;
  current_vehicles: number;
  
  // Regional compliance
  region_id: string;
  local_permits: Record<string, any>;
  
  // Status
  is_active: boolean;
  activated_at?: string;
  deactivated_at?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface OperatorDriver {
  id: string;
  operator_id: string;
  driver_id: string;
  
  // Assignment details
  assignment_type: string;
  employment_status: string;
  
  // Contract information
  contract_start_date: string;
  contract_end_date?: string;
  contract_details: Record<string, any>;
  
  // Performance tracking
  driver_performance_score: number;
  disciplinary_records: any[];
  incentive_eligibility: boolean;
  
  // Location assignment
  assigned_location_id?: string;
  home_base_location?: {
    latitude: number;
    longitude: number;
  };
  
  // Metadata
  assigned_at: string;
  assigned_by?: string;
  updated_at: string;
  is_active: boolean;
}

export interface OperatorVehicle {
  id: string;
  operator_id: string;
  
  // Vehicle identification
  vehicle_plate_number: string;
  vehicle_info: VehicleInfo;
  
  // Vehicle classification
  service_type: string;
  vehicle_category: string;
  seating_capacity: number;
  
  // Registration and compliance
  or_number?: string;
  cr_number?: string;
  ltfrb_registration?: string;
  insurance_policy: InsuranceDetails;
  
  // Vehicle status and assignment
  status: string;
  assigned_driver_id?: string;
  assigned_location_id?: string;
  
  // Maintenance and inspection
  last_maintenance_date?: string;
  next_maintenance_due?: string;
  last_inspection_date?: string;
  next_inspection_due?: string;
  maintenance_records: any[];
  
  // Financial information
  acquisition_cost?: number;
  acquisition_date?: string;
  depreciation_rate?: number;
  current_value?: number;
  
  // Metadata
  registered_at: string;
  registered_by?: string;
  updated_at: string;
  is_active: boolean;
}

// =====================================================
// PERFORMANCE SCORING ENTITIES
// =====================================================

export interface PerformanceMetricConfig {
  id: string;
  
  // Metric identification
  metric_name: string;
  display_name: string;
  description?: string;
  
  // Categorization
  metric_type: PerformanceMetricType;
  category_weight: number;
  max_points: number;
  
  // Calculation parameters
  calculation_formula?: string;
  threshold_values: Record<string, any>;
  is_percentage: boolean;
  
  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OperatorPerformanceScore {
  id: string;
  operator_id: string;
  
  // Scoring period
  scoring_period: string;
  scoring_frequency: ScoringFrequency;
  
  // Individual metric scores
  vehicle_utilization_score: number;
  driver_management_score: number;
  compliance_safety_score: number;
  platform_contribution_score: number;
  
  // Calculated total score
  total_score: number;
  
  // Commission tier determination
  commission_tier: CommissionTier;
  tier_qualification_status: TierQualificationStatus;
  tier_calculation_notes?: string;
  
  // Supporting metrics
  metrics_data: Record<string, any>;
  
  // Performance indicators
  improvement_trend?: number;
  peer_ranking?: number;
  peer_percentile?: number;
  
  // Metadata
  calculated_at: string;
  calculated_by: string;
  is_final: boolean;
}

export interface OperatorPerformanceDetails {
  id: string;
  performance_score_id: string;
  
  // Metric identification
  metric_name: string;
  metric_type: PerformanceMetricType;
  
  // Raw values and calculations
  raw_value?: number;
  normalized_value?: number;
  weighted_score: number;
  max_possible_score: number;
  
  // Context and calculation details
  calculation_method: string;
  calculation_parameters: Record<string, any>;
  benchmarks: Record<string, any>;
  
  // Performance bands
  performance_band: string;
  band_threshold_met: boolean;
  
  // Metadata
  calculated_at: string;
}

export interface CommissionTierQualification {
  id: string;
  operator_id: string;
  
  // Target commission tier
  target_tier: CommissionTier;
  qualification_status: TierQualificationStatus;
  
  // Qualification requirements tracking
  score_requirement: number;
  current_score?: number;
  score_qualified: boolean;
  
  tenure_requirement: number;
  current_tenure?: number;
  tenure_qualified: boolean;
  
  payment_consistency_requirement: number;
  current_payment_consistency?: number;
  payment_qualified: boolean;
  
  utilization_requirement?: number;
  current_utilization_percentile?: number;
  utilization_qualified: boolean;
  
  // Additional requirements
  additional_requirements: Record<string, any>;
  requirements_status: Record<string, any>;
  
  // Timeline
  evaluation_date: string;
  qualification_date?: string;
  next_evaluation_date?: string;
  probation_end_date?: string;
  
  // Notes
  qualification_notes?: string;
  disqualification_reasons?: string[];
  
  // Metadata
  created_at: string;
  updated_at: string;
}

// =====================================================
// FINANCIAL ENTITIES
// =====================================================

export interface OperatorFinancialTransaction {
  id: string;
  operator_id: string;
  
  // Transaction details
  transaction_type: FinancialTransactionType;
  amount: number;
  currency: string;
  
  // Transaction context
  reference_number: string;
  description: string;
  external_reference?: string;
  
  // Related entities
  booking_id?: string;
  driver_id?: string;
  region_id?: string;
  
  // Commission calculation details
  base_fare?: number;
  commission_rate?: number;
  commission_tier?: CommissionTier;
  calculation_method?: CommissionCalculationMethod;
  calculation_details: Record<string, any>;
  
  // Payment information
  payment_status: PaymentStatus;
  payment_method?: string;
  payment_processor?: string;
  payment_reference?: string;
  
  // Financial metadata
  transaction_date: string;
  due_date?: string;
  processed_at?: string;
  settlement_date?: string;
  
  // Reconciliation
  reconciled: boolean;
  reconciled_at?: string;
  reconciled_by?: string;
  batch_id?: string;
  
  // Metadata
  created_at: string;
  created_by: string;
  notes?: string;
}

export interface OperatorBoundaryFee {
  id: string;
  operator_id: string;
  driver_id: string;
  
  // Fee details
  fee_date: string;
  base_boundary_fee: number;
  fuel_subsidy: number;
  maintenance_allowance: number;
  other_adjustments: number;
  total_amount: number;
  
  // Vehicle information
  vehicle_plate_number: string;
  service_type: string;
  
  // Performance-based adjustments
  driver_performance_score?: number;
  performance_adjustment: number;
  bonus_earned: number;
  
  // Payment tracking
  payment_status: PaymentStatus;
  payment_method?: string;
  paid_at?: string;
  
  // Operational metrics
  trips_completed: number;
  hours_worked: number;
  distance_covered_km: number;
  
  // Revenue sharing
  driver_gross_earnings: number;
  revenue_share_percentage?: number;
  revenue_share_amount: number;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface CommissionRateConfig {
  id: string;
  
  // Commission tier configuration
  commission_tier: CommissionTier;
  rate_percentage: number;
  
  // Qualification requirements
  min_performance_score: number;
  min_tenure_months: number;
  min_payment_consistency: number;
  min_utilization_percentile?: number;
  
  // Additional requirements
  additional_requirements: Record<string, any>;
  
  // Rate validity
  effective_from: string;
  effective_until?: string;
  
  // Regional variations
  region_id?: string;
  operator_type_override?: OperatorType;
  
  // Metadata
  created_at: string;
  created_by?: string;
  notes?: string;
  is_active: boolean;
}

export interface OperatorFinancialSummary {
  id: string;
  operator_id: string;
  
  // Period information
  period_start: string;
  period_end: string;
  period_type: FinancialPeriodType;
  
  // Revenue streams
  total_commissions_earned: number;
  total_boundary_fees_collected: number;
  total_incentive_bonuses: number;
  total_subsidies_provided: number;
  
  // Deductions and costs
  total_penalties_deducted: number;
  total_refunds_processed: number;
  total_operational_costs: number;
  
  // Net calculations
  gross_revenue: number;
  net_revenue: number;
  profit_margin: number;
  
  // Volume metrics
  total_trips: number;
  total_active_days: number;
  average_daily_revenue: number;
  
  // Performance metrics
  average_commission_rate: number;
  commission_tier_during_period: CommissionTier;
  performance_score_avg: number;
  
  // Payment metrics
  payments_on_time: number;
  payments_late: number;
  payment_consistency_rate: number;
  
  // Growth metrics
  revenue_growth_rate?: number;
  trip_volume_growth_rate?: number;
  
  // Metadata
  calculated_at: string;
  recalculated_at?: string;
  is_final: boolean;
}

export interface OperatorPayout {
  id: string;
  operator_id: string;
  
  // Payout details
  payout_reference: string;
  payout_amount: number;
  currency: string;
  
  // Payout period
  period_start: string;
  period_end: string;
  
  // Breakdown
  commissions_amount: number;
  bonuses_amount: number;
  adjustments_amount: number;
  
  // Deductions
  penalties_deducted: number;
  tax_withheld: number;
  other_deductions: number;
  
  // Payment details
  payment_method: string;
  bank_account_details?: Record<string, any>;
  payment_processor?: string;
  
  // Status tracking
  status: PaymentStatus;
  requested_at: string;
  approved_at?: string;
  processed_at?: string;
  completed_at?: string;
  failed_at?: string;
  
  // Approval workflow
  requested_by?: string;
  approved_by?: string;
  processed_by?: string;
  
  // External references
  bank_transaction_id?: string;
  processor_transaction_id?: string;
  
  // Metadata
  created_at: string;
  notes?: string;
}

// =====================================================
// REQUEST/RESPONSE INTERFACES
// =====================================================

export interface CreateOperatorRequest {
  // Basic information
  operator_code: string;
  business_name: string;
  legal_name: string;
  trade_name?: string;
  
  // Classification
  operator_type: OperatorType;
  
  // Contact information
  primary_contact: ContactInfo;
  business_address: Address;
  mailing_address?: Address;
  
  // Regulatory information
  business_registration_number: string;
  tin?: string;
  sec_registration?: string;
  ltfrb_authority_number?: string;
  lto_accreditation?: string;
  
  // Regional operations
  primary_region_id: string;
  allowed_regions?: string[];
  
  // Vehicle limits (auto-calculated based on type)
  max_vehicles?: number;
  
  // Partnership information
  user_id?: string;
  assigned_account_manager?: string;
  partnership_start_date: string;
  partnership_end_date?: string;
  
  // Operational settings
  operational_hours?: {
    start: string;
    end: string;
  };
  service_areas?: any[];
  special_permissions?: Record<string, any>;
  
  // Insurance and compliance
  insurance_details?: InsuranceDetails;
  certifications?: Certification[];
}

export interface UpdateOperatorRequest extends Partial<CreateOperatorRequest> {
  id: string;
}

export interface OperatorFilters {
  operator_type?: OperatorType;
  status?: OperatorStatus;
  region_id?: string;
  commission_tier?: CommissionTier;
  search?: string;
  performance_score_min?: number;
  performance_score_max?: number;
  created_from?: string;
  created_to?: string;
  account_manager?: string;
}

export interface PerformanceMetricsData {
  // Vehicle Utilization (30 points max)
  daily_vehicle_utilization: number;
  peak_hour_availability: number;
  fleet_efficiency_ratio: number;
  
  // Driver Management (25 points max)
  driver_retention_rate: number;
  driver_performance_avg: number;
  training_completion_rate: number;
  
  // Compliance & Safety (25 points max)
  safety_incident_rate: number;
  regulatory_compliance: number;
  vehicle_maintenance_score: number;
  
  // Platform Contribution (20 points max)
  customer_satisfaction: number;
  service_area_coverage: number;
  technology_adoption: number;
}

export interface OperatorAnalytics {
  // Basic stats
  total_operators: number;
  active_operators: number;
  pending_approvals: number;
  
  // Type distribution
  type_distribution: {
    tnvs: number;
    general: number;
    fleet: number;
  };
  
  // Performance distribution
  tier_distribution: {
    tier_1: number;
    tier_2: number;
    tier_3: number;
  };
  
  // Regional breakdown
  regional_stats: Array<{
    region_id: string;
    region_name: string;
    operator_count: number;
    avg_performance_score: number;
    total_vehicles: number;
  }>;
  
  // Financial metrics
  total_commissions_paid: number;
  total_boundary_fees: number;
  avg_monthly_revenue_per_operator: number;
  
  // Growth metrics
  new_operators_this_month: number;
  operator_growth_rate: number;
  vehicle_utilization_avg: number;
  
  // Performance trends
  avg_performance_score: number;
  top_performing_operators: Array<{
    operator_id: string;
    business_name: string;
    performance_score: number;
    commission_tier: CommissionTier;
  }>;
}

export interface UpdateCommissionTierRequest {
  operator_id: string;
  target_tier: CommissionTier;
  notes?: string;
}

export interface CalculateCommissionRequest {
  operator_id: string;
  booking_id: string;
  base_fare: number;
  period_start?: string;
  period_end?: string;
}

export interface ProcessPayoutRequest {
  operator_id: string;
  period_start: string;
  period_end: string;
  payment_method: string;
  bank_account_details?: Record<string, any>;
  notes?: string;
}

// =====================================================
// WEBSOCKET EVENT TYPES
// =====================================================

export interface PerformanceUpdateEvent {
  type: 'performance_update';
  operator_id: string;
  old_score: number;
  new_score: number;
  old_tier: CommissionTier;
  new_tier: CommissionTier;
  timestamp: string;
}

export interface CommissionEarnedEvent {
  type: 'commission_earned';
  operator_id: string;
  transaction_id: string;
  amount: number;
  booking_id: string;
  timestamp: string;
}

export interface TierQualificationEvent {
  type: 'tier_qualification';
  operator_id: string;
  tier: CommissionTier;
  qualified: boolean;
  requirements_met: Record<string, boolean>;
  timestamp: string;
}

export type OperatorWebSocketEvent = 
  | PerformanceUpdateEvent 
  | CommissionEarnedEvent 
  | TierQualificationEvent;

// =====================================================
// SERVICE INTERFACES
// =====================================================

export interface IOperatorService {
  // CRUD operations
  createOperator(data: CreateOperatorRequest): Promise<Operator>;
  getOperator(id: string): Promise<Operator | null>;
  updateOperator(id: string, data: UpdateOperatorRequest): Promise<Operator>;
  deleteOperator(id: string): Promise<void>;
  listOperators(filters?: OperatorFilters, pagination?: { page: number; limit: number }): Promise<{
    data: Operator[];
    total: number;
    page: number;
    limit: number;
  }>;
  
  // Fleet management
  addDriver(operatorId: string, driverId: string, assignmentDetails: Partial<OperatorDriver>): Promise<OperatorDriver>;
  removeDriver(operatorId: string, driverId: string): Promise<void>;
  addVehicle(operatorId: string, vehicleData: Partial<OperatorVehicle>): Promise<OperatorVehicle>;
  removeVehicle(operatorId: string, vehicleId: string): Promise<void>;
  
  // Analytics
  getAnalytics(filters?: OperatorFilters): Promise<OperatorAnalytics>;
}

export interface IPerformanceService {
  // Score calculations
  calculatePerformanceScore(operatorId: string, period: string, frequency: ScoringFrequency): Promise<OperatorPerformanceScore>;
  getPerformanceHistory(operatorId: string, limit?: number): Promise<OperatorPerformanceScore[]>;
  
  // Commission tier management
  evaluateCommissionTier(operatorId: string): Promise<CommissionTierQualification>;
  updateCommissionTier(request: UpdateCommissionTierRequest): Promise<void>;
  
  // Performance improvement
  createImprovementPlan(operatorId: string, targetScore: number, timelineDays: number): Promise<void>;
}

export interface ICommissionService {
  // Commission calculations
  calculateCommission(request: CalculateCommissionRequest): Promise<OperatorFinancialTransaction>;
  getCommissionHistory(operatorId: string, period?: { start: string; end: string }): Promise<OperatorFinancialTransaction[]>;
  
  // Rate management
  updateCommissionRates(tier: CommissionTier, newRate: number): Promise<void>;
  getActiveRates(): Promise<CommissionRateConfig[]>;
}

export interface IFinancialService {
  // Financial operations
  processBoundaryFee(operatorId: string, driverId: string, feeData: Partial<OperatorBoundaryFee>): Promise<OperatorBoundaryFee>;
  generateFinancialSummary(operatorId: string, period: string, periodType: FinancialPeriodType): Promise<OperatorFinancialSummary>;
  
  // Payouts
  requestPayout(request: ProcessPayoutRequest): Promise<OperatorPayout>;
  approvePayout(payoutId: string, approvedBy: string): Promise<void>;
  processPayouts(): Promise<OperatorPayout[]>;
  
  // Reporting
  getEarningsReport(operatorId: string, period: { start: string; end: string }): Promise<any>;
  getFinancialTransactions(operatorId: string, filters?: any): Promise<OperatorFinancialTransaction[]>;
}

export interface IAnalyticsService {
  // Dashboard analytics
  getDashboardMetrics(operatorId?: string): Promise<OperatorAnalytics>;
  getPerformanceTrends(period: string): Promise<any>;
  getFinancialMetrics(period: string): Promise<any>;
  
  // Reporting
  generateOperatorReport(operatorId: string, reportType: string): Promise<any>;
  exportData(filters: any, format: 'csv' | 'excel' | 'pdf'): Promise<Buffer>;
}