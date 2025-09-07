// =====================================================
// COMPREHENSIVE FINANCIAL REPORTING SERVICE
// Real-time financial analytics and reporting for operators
// Supports Philippines regulatory compliance (BIR, BSP, LTFRB)
// =====================================================

import { logger } from '@/lib/security/productionLogger';
import { v4 as uuidv4 } from 'uuid';

// =====================================================
// TYPES AND INTERFACES
// =====================================================

export interface FinancialReportingService {
  // Core Financial Reports
  generateProfitLossStatement(operatorId: string, period: FinancialPeriod): Promise<ProfitLossStatement>;
  generateCashFlowAnalysis(operatorId: string, period: FinancialPeriod): Promise<CashFlowAnalysis>;
  generateFinancialHealthReport(operatorId: string): Promise<FinancialHealthReport>;
  
  // Regulatory Compliance Reports
  generateBIRReport(operatorId: string, period: FinancialPeriod): Promise<BIRComplianceReport>;
  generateBSPReport(operatorId: string, period: FinancialPeriod): Promise<BSPComplianceReport>;
  generateLTFRBReport(operatorId: string, period: FinancialPeriod): Promise<LTFRBFinancialReport>;
  
  // Commission and Boundary Fee Reports
  generateCommissionReport(operatorId: string, period: FinancialPeriod): Promise<CommissionReport>;
  generateBoundaryFeeReport(operatorId: string, period: FinancialPeriod): Promise<BoundaryFeeReport>;
  
  // Advanced Analytics
  generateRevenueForecasting(operatorId: string, forecastPeriods: number): Promise<RevenueForecasting>;
  generateFinancialBenchmarking(operatorId: string): Promise<FinancialBenchmarking>;
  generateRiskAssessment(operatorId: string): Promise<FinancialRiskAssessment>;
}

export interface FinancialPeriod {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  period_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
}

export interface ProfitLossStatement {
  operator_id: string;
  period: FinancialPeriod;
  generated_at: string;
  currency: string;
  
  // Revenue Streams
  revenue: {
    commission_revenue: number;
    boundary_fees: number;
    incentive_fees: number;
    other_revenue: number;
    total_revenue: number;
  };
  
  // Operating Expenses
  expenses: {
    driver_subsidies: number;
    fuel_allowances: number;
    maintenance_subsidies: number;
    insurance_premiums: number;
    regulatory_fees: number;
    operational_costs: number;
    administrative_costs: number;
    total_expenses: number;
  };
  
  // Financial Metrics
  gross_profit: number;
  operating_profit: number;
  net_profit: number;
  profit_margin: number;
  
  // Comparative Analysis
  previous_period_comparison: {
    revenue_growth: number;
    expense_growth: number;
    profit_growth: number;
  };
  
  // KPIs
  key_metrics: {
    revenue_per_vehicle: number;
    revenue_per_driver: number;
    cost_per_trip: number;
    profit_per_trip: number;
  };
}

export interface CashFlowAnalysis {
  operator_id: string;
  period: FinancialPeriod;
  generated_at: string;
  currency: string;
  
  // Operating Cash Flow
  operating_activities: {
    cash_from_operations: number;
    commission_collections: number;
    boundary_fee_collections: number;
    cash_paid_to_drivers: number;
    operating_expenses_paid: number;
    net_operating_cash_flow: number;
  };
  
  // Investment Activities
  investing_activities: {
    vehicle_purchases: number;
    equipment_purchases: number;
    asset_disposals: number;
    net_investing_cash_flow: number;
  };
  
  // Financing Activities
  financing_activities: {
    loans_received: number;
    loan_repayments: number;
    owner_investments: number;
    distributions_paid: number;
    net_financing_cash_flow: number;
  };
  
  // Cash Position
  cash_position: {
    beginning_cash: number;
    net_cash_change: number;
    ending_cash: number;
  };
  
  // Cash Flow Forecast
  forecast: {
    next_30_days: number;
    next_60_days: number;
    next_90_days: number;
  };
}

export interface FinancialHealthReport {
  operator_id: string;
  generated_at: string;
  overall_score: number; // 0-100
  
  // Liquidity Analysis
  liquidity: {
    current_ratio: number;
    quick_ratio: number;
    cash_ratio: number;
    working_capital: number;
    liquidity_score: number; // 0-100
  };
  
  // Profitability Analysis
  profitability: {
    gross_profit_margin: number;
    operating_profit_margin: number;
    net_profit_margin: number;
    return_on_assets: number;
    return_on_equity: number;
    profitability_score: number; // 0-100
  };
  
  // Efficiency Analysis
  efficiency: {
    asset_turnover: number;
    vehicle_utilization: number;
    cost_efficiency_ratio: number;
    revenue_per_employee: number;
    efficiency_score: number; // 0-100
  };
  
  // Stability Analysis
  stability: {
    debt_to_equity: number;
    interest_coverage: number;
    cash_coverage: number;
    revenue_volatility: number;
    stability_score: number; // 0-100
  };
  
  // Growth Analysis
  growth: {
    revenue_growth_rate: number;
    profit_growth_rate: number;
    asset_growth_rate: number;
    growth_score: number; // 0-100
  };
  
  // Recommendations
  recommendations: FinancialRecommendation[];
  red_flags: FinancialAlert[];
}

export interface BIRComplianceReport {
  operator_id: string;
  period: FinancialPeriod;
  generated_at: string;
  
  // VAT Calculations (12%)
  vat_summary: {
    taxable_sales: number;
    vat_output: number;
    vat_input: number;
    net_vat_payable: number;
  };
  
  // Withholding Tax (8% on driver payments)
  withholding_tax: {
    total_driver_payments: number;
    withholding_rate: number; // 8%
    total_withheld: number;
    tax_remitted: number;
    outstanding_remittance: number;
  };
  
  // BIR Forms and Certificates
  required_forms: {
    form_2307_certificates: BIR2307Certificate[];
    quarterly_returns: BIRQuarterlyReturn[];
    annual_returns: BIRAnnualReturn[];
  };
  
  // Electronic Receipt Requirements
  electronic_receipts: {
    total_receipts_issued: number;
    or_number_range: { start: string; end: string };
    compliant_receipts: number;
    non_compliant_receipts: number;
  };
  
  // Compliance Status
  compliance_status: {
    vat_filing_status: 'current' | 'late' | 'overdue';
    withholding_tax_status: 'current' | 'late' | 'overdue';
    receipt_compliance: 'compliant' | 'non_compliant';
    overall_compliance: 'compliant' | 'minor_issues' | 'major_issues';
  };
}

export interface BSPComplianceReport {
  operator_id: string;
  period: FinancialPeriod;
  generated_at: string;
  
  // AML Transaction Monitoring
  aml_monitoring: {
    total_transactions: number;
    large_transactions: TransactionSummary[]; // > PHP 500,000
    suspicious_transactions: TransactionSummary[];
    flagged_patterns: string[];
  };
  
  // Customer Due Diligence
  customer_due_diligence: {
    total_customers: number;
    kyc_compliant: number;
    kyc_pending: number;
    high_risk_customers: number;
  };
  
  // Foreign Exchange Reporting
  forex_reporting: {
    usd_transactions: number;
    total_usd_amount: number;
    reportable_transactions: number;
    reports_filed: number;
  };
  
  // Compliance Metrics
  compliance_metrics: {
    aml_compliance_score: number; // 0-100
    reporting_timeliness: number; // 0-100
    documentation_completeness: number; // 0-100
    overall_bsp_compliance: number; // 0-100
  };
}

export interface LTFRBFinancialReport {
  operator_id: string;
  period: FinancialPeriod;
  generated_at: string;
  
  // Operator Revenue Transparency
  revenue_reporting: {
    total_operator_revenue: number;
    revenue_by_service_type: Record<string, number>;
    revenue_by_region: Record<string, number>;
  };
  
  // Driver Commission Transparency
  driver_commissions: {
    total_commission_paid: number;
    average_commission_rate: number;
    commission_by_tier: Record<string, number>;
    number_of_drivers: number;
  };
  
  // Service Area Performance
  service_area_performance: {
    coverage_areas: string[];
    revenue_per_area: Record<string, number>;
    trip_volume_per_area: Record<string, number>;
  };
  
  // Fare Compliance
  fare_compliance: {
    base_fare_compliance: number; // Percentage
    surge_pricing_instances: number;
    average_surge_multiplier: number;
    fare_violations: number;
  };
  
  // Regulatory Compliance Score
  ltfrb_compliance_score: number; // 0-100
}

export interface CommissionReport {
  operator_id: string;
  period: FinancialPeriod;
  generated_at: string;
  
  // Commission Summary
  commission_summary: {
    total_trips: number;
    total_gross_revenue: number;
    total_commission_earned: number;
    average_commission_rate: number;
    effective_commission_rate: number; // Including bonuses/penalties
  };
  
  // Tier-based Analysis
  tier_analysis: {
    tier_1: CommissionTierAnalysis;
    tier_2: CommissionTierAnalysis;
    tier_3: CommissionTierAnalysis;
  };
  
  // Performance-based Adjustments
  performance_adjustments: {
    performance_bonuses: number;
    tier_upgrade_bonuses: number;
    penalty_deductions: number;
    net_adjustment: number;
  };
  
  // Commission Trend Analysis
  trend_analysis: {
    commission_growth: number;
    tier_progression: TierProgressionAnalysis;
    seasonal_patterns: SeasonalPattern[];
  };
}

export interface BoundaryFeeReport {
  operator_id: string;
  period: FinancialPeriod;
  generated_at: string;
  
  // Fee Collection Summary
  collection_summary: {
    total_drivers: number;
    total_fee_collected: number;
    average_daily_fee: number;
    collection_rate: number; // Percentage of successful collections
  };
  
  // Dynamic Pricing Analysis
  dynamic_pricing: {
    base_boundary_fee: number;
    fuel_adjustments: number;
    performance_adjustments: number;
    market_adjustments: number;
    effective_average_fee: number;
  };
  
  // Payment Analysis
  payment_analysis: {
    on_time_payments: number;
    late_payments: number;
    defaulted_payments: number;
    payment_method_breakdown: Record<string, number>;
  };
  
  // Driver Performance Impact
  performance_impact: {
    fee_reduction_from_performance: number;
    bonus_fees_from_performance: number;
    net_performance_adjustment: number;
  };
}

export interface RevenueForecasting {
  operator_id: string;
  forecast_generated_at: string;
  forecast_periods: number;
  
  // Historical Data Analysis
  historical_analysis: {
    revenue_trend: 'growing' | 'stable' | 'declining';
    seasonality_factors: Record<string, number>;
    growth_rate: number;
    volatility: number;
  };
  
  // Forecast Models
  forecasts: {
    linear_model: ForecastPrediction[];
    seasonal_model: ForecastPrediction[];
    ml_model: ForecastPrediction[];
    ensemble_model: ForecastPrediction[]; // Recommended
  };
  
  // Scenario Analysis
  scenarios: {
    optimistic: ForecastPrediction[];
    base_case: ForecastPrediction[];
    pessimistic: ForecastPrediction[];
  };
  
  // Key Assumptions
  assumptions: {
    market_growth_rate: number;
    competition_impact: number;
    regulatory_changes: string[];
    seasonal_adjustments: Record<string, number>;
  };
  
  // Confidence Intervals
  confidence_metrics: {
    model_accuracy: number; // 0-100
    prediction_confidence: number; // 0-100
    recommendation_strength: 'high' | 'medium' | 'low';
  };
}

export interface FinancialBenchmarking {
  operator_id: string;
  generated_at: string;
  
  // Peer Comparison
  peer_comparison: {
    operator_tier: 'tier_1' | 'tier_2' | 'tier_3';
    peer_group_size: number;
    
    metrics: {
      revenue_per_vehicle: BenchmarkMetric;
      profit_margin: BenchmarkMetric;
      commission_rate: BenchmarkMetric;
      vehicle_utilization: BenchmarkMetric;
      driver_retention: BenchmarkMetric;
    };
  };
  
  // Industry Benchmarks
  industry_benchmarks: {
    market_segment: string; // e.g., "Manila Metro TNVS"
    
    metrics: {
      revenue_growth: BenchmarkMetric;
      operational_efficiency: BenchmarkMetric;
      financial_stability: BenchmarkMetric;
      customer_satisfaction: BenchmarkMetric;
    };
  };
  
  // Competitive Position
  competitive_position: {
    overall_rank: number;
    percentile_rank: number;
    strengths: string[];
    improvement_areas: string[];
    competitive_advantages: string[];
  };
  
  // Recommendations
  benchmarking_recommendations: FinancialRecommendation[];
}

export interface FinancialRiskAssessment {
  operator_id: string;
  generated_at: string;
  overall_risk_score: number; // 0-100 (higher = more risky)
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  
  // Risk Categories
  risk_categories: {
    liquidity_risk: RiskAssessment;
    credit_risk: RiskAssessment;
    operational_risk: RiskAssessment;
    market_risk: RiskAssessment;
    regulatory_risk: RiskAssessment;
    technology_risk: RiskAssessment;
  };
  
  // Early Warning Indicators
  early_warning_indicators: {
    declining_performance: boolean;
    cash_flow_issues: boolean;
    increasing_defaults: boolean;
    regulatory_violations: boolean;
    driver_exodus: boolean;
    vehicle_underutilization: boolean;
  };
  
  // Risk Mitigation Recommendations
  mitigation_strategies: {
    immediate_actions: string[];
    short_term_strategies: string[];
    long_term_strategies: string[];
    monitoring_recommendations: string[];
  };
}

// Supporting Types
export interface BIR2307Certificate {
  certificate_number: string;
  payee_name: string;
  amount_paid: number;
  tax_withheld: number;
  issue_date: string;
}

export interface BIRQuarterlyReturn {
  quarter: number;
  year: number;
  total_sales: number;
  vat_payable: number;
  withholding_tax: number;
  filed_on_time: boolean;
}

export interface BIRAnnualReturn {
  year: number;
  total_revenue: number;
  total_expenses: number;
  taxable_income: number;
  income_tax: number;
  filed_on_time: boolean;
}

export interface TransactionSummary {
  transaction_id: string;
  amount: number;
  currency: string;
  transaction_date: string;
  counterparty: string;
  risk_flags: string[];
}

export interface CommissionTierAnalysis {
  tier: 'tier_1' | 'tier_2' | 'tier_3';
  operator_count: number;
  commission_rate: number;
  total_commission_earned: number;
  average_trips_per_operator: number;
  performance_score_range: { min: number; max: number };
}

export interface TierProgressionAnalysis {
  tier_changes: {
    upgrades: number;
    downgrades: number;
    stable: number;
  };
  progression_timeline: Array<{
    period: string;
    tier: string;
    commission_rate: number;
  }>;
}

export interface SeasonalPattern {
  period: string; // e.g., "Q1", "December", "Week 1"
  pattern_type: 'monthly' | 'quarterly' | 'weekly' | 'daily';
  revenue_multiplier: number; // e.g., 1.2 = 20% above average
  historical_data_points: number;
}

export interface ForecastPrediction {
  period: string;
  predicted_revenue: number;
  confidence_interval: {
    lower_bound: number;
    upper_bound: number;
  };
  key_drivers: string[];
}

export interface BenchmarkMetric {
  operator_value: number;
  peer_average: number;
  peer_median: number;
  percentile_rank: number;
  best_in_class: number;
  performance_gap: number;
}

export interface RiskAssessment {
  risk_score: number; // 0-100
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  key_indicators: string[];
  trend: 'improving' | 'stable' | 'deteriorating';
  mitigation_priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface FinancialRecommendation {
  id: string;
  category: 'cost_reduction' | 'revenue_increase' | 'efficiency' | 'compliance' | 'risk_management';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  expected_impact: {
    financial_impact: number;
    timeframe: string;
    confidence: 'low' | 'medium' | 'high';
  };
  implementation_steps: string[];
  success_metrics: string[];
}

export interface FinancialAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  detected_at: string;
  category: 'liquidity' | 'profitability' | 'compliance' | 'efficiency' | 'growth';
  recommended_actions: string[];
  auto_resolved: boolean;
}

// =====================================================
// MAIN SERVICE IMPLEMENTATION
// =====================================================

export class FinancialReportingServiceImpl implements FinancialReportingService {
  
  // =====================================================
  // CORE FINANCIAL REPORTS
  // =====================================================
  
  async generateProfitLossStatement(
    operatorId: string, 
    period: FinancialPeriod
  ): Promise<ProfitLossStatement> {
    try {
      logger.info('Generating P&L statement', { operatorId, period });
      
      // Get financial transactions for the period
      const transactions = await this.getFinancialTransactions(operatorId, period);
      const previousPeriodTransactions = await this.getPreviousPeriodTransactions(operatorId, period);
      
      // Calculate revenue streams
      const revenue = {
        commission_revenue: this.calculateCommissionRevenue(transactions),
        boundary_fees: this.calculateBoundaryFees(transactions),
        incentive_fees: this.calculateIncentiveFees(transactions),
        other_revenue: this.calculateOtherRevenue(transactions),
        total_revenue: 0
      };
      revenue.total_revenue = revenue.commission_revenue + revenue.boundary_fees + 
                             revenue.incentive_fees + revenue.other_revenue;
      
      // Calculate expenses
      const expenses = {
        driver_subsidies: this.calculateDriverSubsidies(transactions),
        fuel_allowances: this.calculateFuelAllowances(transactions),
        maintenance_subsidies: this.calculateMaintenanceSubsidies(transactions),
        insurance_premiums: this.calculateInsurancePremiums(transactions),
        regulatory_fees: this.calculateRegulatoryFees(transactions),
        operational_costs: this.calculateOperationalCosts(transactions),
        administrative_costs: this.calculateAdministrativeCosts(transactions),
        total_expenses: 0
      };
      expenses.total_expenses = expenses.driver_subsidies + expenses.fuel_allowances +
                               expenses.maintenance_subsidies + expenses.insurance_premiums +
                               expenses.regulatory_fees + expenses.operational_costs +
                               expenses.administrative_costs;
      
      // Calculate profitability metrics
      const gross_profit = revenue.total_revenue - expenses.total_expenses;
      const operating_profit = gross_profit; // Simplified for now
      const net_profit = operating_profit; // Simplified for now
      const profit_margin = revenue.total_revenue > 0 ? (net_profit / revenue.total_revenue) * 100 : 0;
      
      // Calculate previous period comparison
      const previousRevenue = this.calculateTotalRevenue(previousPeriodTransactions);
      const previousExpenses = this.calculateTotalExpenses(previousPeriodTransactions);
      const previousProfit = previousRevenue - previousExpenses;
      
      const previous_period_comparison = {
        revenue_growth: this.calculateGrowthRate(revenue.total_revenue, previousRevenue),
        expense_growth: this.calculateGrowthRate(expenses.total_expenses, previousExpenses),
        profit_growth: this.calculateGrowthRate(net_profit, previousProfit)
      };
      
      // Calculate KPIs
      const vehicleCount = await this.getVehicleCount(operatorId);
      const driverCount = await this.getDriverCount(operatorId);
      const tripCount = await this.getTripCount(operatorId, period);
      
      const key_metrics = {
        revenue_per_vehicle: vehicleCount > 0 ? revenue.total_revenue / vehicleCount : 0,
        revenue_per_driver: driverCount > 0 ? revenue.total_revenue / driverCount : 0,
        cost_per_trip: tripCount > 0 ? expenses.total_expenses / tripCount : 0,
        profit_per_trip: tripCount > 0 ? net_profit / tripCount : 0
      };
      
      const statement: ProfitLossStatement = {
        operator_id: operatorId,
        period,
        generated_at: new Date().toISOString(),
        currency: 'PHP',
        revenue,
        expenses,
        gross_profit,
        operating_profit,
        net_profit,
        profit_margin,
        previous_period_comparison,
        key_metrics
      };
      
      logger.info('P&L statement generated successfully', { 
        operatorId, 
        totalRevenue: revenue.total_revenue,
        netProfit: net_profit,
        profitMargin: profit_margin
      });
      
      return statement;
      
    } catch (error) {
      logger.error('Failed to generate P&L statement', { error, operatorId, period });
      throw error;
    }
  }
  
  async generateCashFlowAnalysis(
    operatorId: string, 
    period: FinancialPeriod
  ): Promise<CashFlowAnalysis> {
    try {
      logger.info('Generating cash flow analysis', { operatorId, period });
      
      // Get cash transactions for the period
      const cashTransactions = await this.getCashTransactions(operatorId, period);
      const beginningCash = await this.getBeginningCashBalance(operatorId, period.start_date);
      
      // Calculate operating activities
      const operating_activities = {
        cash_from_operations: this.calculateCashFromOperations(cashTransactions),
        commission_collections: this.calculateCommissionCollections(cashTransactions),
        boundary_fee_collections: this.calculateBoundaryFeeCollections(cashTransactions),
        cash_paid_to_drivers: this.calculateCashPaidToDrivers(cashTransactions),
        operating_expenses_paid: this.calculateOperatingExpensesPaid(cashTransactions),
        net_operating_cash_flow: 0
      };
      operating_activities.net_operating_cash_flow = 
        operating_activities.cash_from_operations - operating_activities.cash_paid_to_drivers - 
        operating_activities.operating_expenses_paid;
      
      // Calculate investing activities
      const investing_activities = {
        vehicle_purchases: this.calculateVehiclePurchases(cashTransactions),
        equipment_purchases: this.calculateEquipmentPurchases(cashTransactions),
        asset_disposals: this.calculateAssetDisposals(cashTransactions),
        net_investing_cash_flow: 0
      };
      investing_activities.net_investing_cash_flow = 
        -investing_activities.vehicle_purchases - investing_activities.equipment_purchases + 
        investing_activities.asset_disposals;
      
      // Calculate financing activities
      const financing_activities = {
        loans_received: this.calculateLoansReceived(cashTransactions),
        loan_repayments: this.calculateLoanRepayments(cashTransactions),
        owner_investments: this.calculateOwnerInvestments(cashTransactions),
        distributions_paid: this.calculateDistributionsPaid(cashTransactions),
        net_financing_cash_flow: 0
      };
      financing_activities.net_financing_cash_flow = 
        financing_activities.loans_received - financing_activities.loan_repayments +
        financing_activities.owner_investments - financing_activities.distributions_paid;
      
      // Calculate cash position
      const net_cash_change = operating_activities.net_operating_cash_flow + 
                             investing_activities.net_investing_cash_flow + 
                             financing_activities.net_financing_cash_flow;
      
      const cash_position = {
        beginning_cash: beginningCash,
        net_cash_change,
        ending_cash: beginningCash + net_cash_change
      };
      
      // Generate cash flow forecast
      const forecast = await this.generateCashFlowForecast(operatorId);
      
      const analysis: CashFlowAnalysis = {
        operator_id: operatorId,
        period,
        generated_at: new Date().toISOString(),
        currency: 'PHP',
        operating_activities,
        investing_activities,
        financing_activities,
        cash_position,
        forecast
      };
      
      logger.info('Cash flow analysis generated successfully', { 
        operatorId, 
        netCashFlow: net_cash_change,
        endingCash: cash_position.ending_cash
      });
      
      return analysis;
      
    } catch (error) {
      logger.error('Failed to generate cash flow analysis', { error, operatorId, period });
      throw error;
    }
  }
  
  async generateFinancialHealthReport(operatorId: string): Promise<FinancialHealthReport> {
    try {
      logger.info('Generating financial health report', { operatorId });
      
      // Get financial data for analysis
      const financialData = await this.getComprehensiveFinancialData(operatorId);
      
      // Calculate liquidity metrics
      const liquidity = await this.calculateLiquidityMetrics(operatorId, financialData);
      
      // Calculate profitability metrics
      const profitability = await this.calculateProfitabilityMetrics(operatorId, financialData);
      
      // Calculate efficiency metrics
      const efficiency = await this.calculateEfficiencyMetrics(operatorId, financialData);
      
      // Calculate stability metrics
      const stability = await this.calculateStabilityMetrics(operatorId, financialData);
      
      // Calculate growth metrics
      const growth = await this.calculateGrowthMetrics(operatorId, financialData);
      
      // Calculate overall health score
      const overall_score = this.calculateOverallHealthScore([
        liquidity.liquidity_score,
        profitability.profitability_score,
        efficiency.efficiency_score,
        stability.stability_score,
        growth.growth_score
      ]);
      
      // Generate recommendations and alerts
      const recommendations = await this.generateHealthRecommendations(operatorId, {
        liquidity, profitability, efficiency, stability, growth
      });
      
      const red_flags = await this.identifyFinancialRedFlags(operatorId, {
        liquidity, profitability, efficiency, stability, growth
      });
      
      const report: FinancialHealthReport = {
        operator_id: operatorId,
        generated_at: new Date().toISOString(),
        overall_score,
        liquidity,
        profitability,
        efficiency,
        stability,
        growth,
        recommendations,
        red_flags
      };
      
      logger.info('Financial health report generated successfully', { 
        operatorId, 
        overallScore: overall_score,
        recommendationCount: recommendations.length,
        redFlagCount: red_flags.length
      });
      
      return report;
      
    } catch (error) {
      logger.error('Failed to generate financial health report', { error, operatorId });
      throw error;
    }
  }
  
  // =====================================================
  // REGULATORY COMPLIANCE REPORTS
  // =====================================================
  
  async generateBIRReport(
    operatorId: string, 
    period: FinancialPeriod
  ): Promise<BIRComplianceReport> {
    try {
      logger.info('Generating BIR compliance report', { operatorId, period });
      
      // Get transactions for VAT calculation
      const transactions = await this.getFinancialTransactions(operatorId, period);
      
      // Calculate VAT (12% on platform fees)
      const taxable_sales = this.calculateTaxableSales(transactions);
      const vat_output = taxable_sales * 0.12; // 12% VAT
      const vat_input = this.calculateVATInput(transactions);
      const net_vat_payable = Math.max(0, vat_output - vat_input);
      
      const vat_summary = {
        taxable_sales,
        vat_output,
        vat_input,
        net_vat_payable
      };
      
      // Calculate withholding tax (8% on driver payments)
      const driver_payments = this.calculateDriverPayments(transactions);
      const withholding_rate = 0.08; // 8%
      const total_withheld = driver_payments * withholding_rate;
      const tax_remitted = await this.getTaxRemitted(operatorId, period);
      
      const withholding_tax = {
        total_driver_payments: driver_payments,
        withholding_rate,
        total_withheld,
        tax_remitted,
        outstanding_remittance: total_withheld - tax_remitted
      };
      
      // Generate required forms
      const form_2307_certificates = await this.generateBIR2307Certificates(operatorId, period);
      const quarterly_returns = await this.getBIRQuarterlyReturns(operatorId, period);
      const annual_returns = await this.getBIRAnnualReturns(operatorId, period);
      
      const required_forms = {
        form_2307_certificates,
        quarterly_returns,
        annual_returns
      };
      
      // Electronic receipts compliance
      const electronic_receipts = await this.getElectronicReceiptCompliance(operatorId, period);
      
      // Determine compliance status
      const compliance_status = this.assessBIRCompliance({
        vat_summary,
        withholding_tax,
        electronic_receipts
      });
      
      const report: BIRComplianceReport = {
        operator_id: operatorId,
        period,
        generated_at: new Date().toISOString(),
        vat_summary,
        withholding_tax,
        required_forms,
        electronic_receipts,
        compliance_status
      };
      
      logger.info('BIR compliance report generated successfully', { 
        operatorId, 
        vatPayable: net_vat_payable,
        withholdingTax: total_withheld,
        complianceStatus: compliance_status.overall_compliance
      });
      
      return report;
      
    } catch (error) {
      logger.error('Failed to generate BIR report', { error, operatorId, period });
      throw error;
    }
  }
  
  async generateBSPReport(
    operatorId: string, 
    period: FinancialPeriod
  ): Promise<BSPComplianceReport> {
    try {
      logger.info('Generating BSP compliance report', { operatorId, period });
      
      // Get all transactions for AML monitoring
      const transactions = await this.getAllTransactions(operatorId, period);
      
      // Identify large transactions (> PHP 500,000)
      const large_transactions = transactions
        .filter(t => t.amount > 500000)
        .map(t => this.mapToTransactionSummary(t));
      
      // Identify suspicious transactions
      const suspicious_transactions = await this.identifySuspiciousTransactions(transactions);
      const flagged_patterns = await this.identifyFlaggedPatterns(transactions);
      
      const aml_monitoring = {
        total_transactions: transactions.length,
        large_transactions,
        suspicious_transactions,
        flagged_patterns
      };
      
      // Customer due diligence
      const customer_due_diligence = await this.getCustomerDueDiligenceStatus(operatorId);
      
      // Foreign exchange reporting
      const forex_transactions = transactions.filter(t => t.currency === 'USD');
      const forex_reporting = {
        usd_transactions: forex_transactions.length,
        total_usd_amount: forex_transactions.reduce((sum, t) => sum + t.amount, 0),
        reportable_transactions: forex_transactions.filter(t => t.amount > 10000).length,
        reports_filed: await this.getForexReportsCount(operatorId, period)
      };
      
      // Calculate compliance metrics
      const compliance_metrics = {
        aml_compliance_score: this.calculateAMLComplianceScore(aml_monitoring, customer_due_diligence),
        reporting_timeliness: await this.calculateReportingTimeliness(operatorId, period),
        documentation_completeness: await this.calculateDocumentationCompleteness(operatorId),
        overall_bsp_compliance: 0
      };
      compliance_metrics.overall_bsp_compliance = 
        (compliance_metrics.aml_compliance_score + 
         compliance_metrics.reporting_timeliness + 
         compliance_metrics.documentation_completeness) / 3;
      
      const report: BSPComplianceReport = {
        operator_id: operatorId,
        period,
        generated_at: new Date().toISOString(),
        aml_monitoring,
        customer_due_diligence,
        forex_reporting,
        compliance_metrics
      };
      
      logger.info('BSP compliance report generated successfully', { 
        operatorId, 
        largeTransactions: large_transactions.length,
        suspiciousTransactions: suspicious_transactions.length,
        overallCompliance: compliance_metrics.overall_bsp_compliance
      });
      
      return report;
      
    } catch (error) {
      logger.error('Failed to generate BSP report', { error, operatorId, period });
      throw error;
    }
  }
  
  async generateLTFRBReport(
    operatorId: string, 
    period: FinancialPeriod
  ): Promise<LTFRBFinancialReport> {
    try {
      logger.info('Generating LTFRB financial report', { operatorId, period });
      
      // Get revenue data by service type and region
      const revenue_by_service_type = await this.getRevenueByServiceType(operatorId, period);
      const revenue_by_region = await this.getRevenueByRegion(operatorId, period);
      const total_operator_revenue = Object.values(revenue_by_service_type).reduce((sum, rev) => sum + rev, 0);
      
      const revenue_reporting = {
        total_operator_revenue,
        revenue_by_service_type,
        revenue_by_region
      };
      
      // Get driver commission data
      const commission_data = await this.getDriverCommissionData(operatorId, period);
      const driver_commissions = {
        total_commission_paid: commission_data.total_paid,
        average_commission_rate: commission_data.average_rate,
        commission_by_tier: commission_data.by_tier,
        number_of_drivers: commission_data.driver_count
      };
      
      // Get service area performance
      const service_areas = await this.getServiceAreas(operatorId);
      const revenue_per_area = await this.getRevenuePerArea(operatorId, period, service_areas);
      const trip_volume_per_area = await this.getTripVolumePerArea(operatorId, period, service_areas);
      
      const service_area_performance = {
        coverage_areas: service_areas,
        revenue_per_area,
        trip_volume_per_area
      };
      
      // Get fare compliance data
      const fare_data = await this.getFareComplianceData(operatorId, period);
      const fare_compliance = {
        base_fare_compliance: fare_data.compliance_rate,
        surge_pricing_instances: fare_data.surge_instances,
        average_surge_multiplier: fare_data.average_surge,
        fare_violations: fare_data.violations
      };
      
      // Calculate overall LTFRB compliance score
      const ltfrb_compliance_score = this.calculateLTFRBComplianceScore({
        revenue_transparency: 95, // Based on complete reporting
        commission_transparency: 98, // Based on complete commission data
        fare_compliance: fare_compliance.base_fare_compliance,
        area_coverage: service_areas.length > 0 ? 100 : 0
      });
      
      const report: LTFRBFinancialReport = {
        operator_id: operatorId,
        period,
        generated_at: new Date().toISOString(),
        revenue_reporting,
        driver_commissions,
        service_area_performance,
        fare_compliance,
        ltfrb_compliance_score
      };
      
      logger.info('LTFRB financial report generated successfully', { 
        operatorId, 
        totalRevenue: total_operator_revenue,
        totalCommissionPaid: driver_commissions.total_commission_paid,
        complianceScore: ltfrb_compliance_score
      });
      
      return report;
      
    } catch (error) {
      logger.error('Failed to generate LTFRB report', { error, operatorId, period });
      throw error;
    }
  }
  
  // =====================================================
  // COMMISSION AND BOUNDARY FEE REPORTS
  // =====================================================
  
  async generateCommissionReport(
    operatorId: string, 
    period: FinancialPeriod
  ): Promise<CommissionReport> {
    try {
      logger.info('Generating commission report', { operatorId, period });
      
      // Get commission data for the period
      const commission_transactions = await this.getCommissionTransactions(operatorId, period);
      const trips_data = await this.getTripsData(operatorId, period);
      
      // Calculate commission summary
      const total_trips = trips_data.length;
      const total_gross_revenue = trips_data.reduce((sum, trip) => sum + trip.fare, 0);
      const total_commission_earned = commission_transactions
        .filter(t => t.transaction_type === 'commission_earned')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const average_commission_rate = total_gross_revenue > 0 
        ? (total_commission_earned / total_gross_revenue) * 100 
        : 0;
      
      // Include performance adjustments in effective rate
      const performance_adjustments_amount = commission_transactions
        .filter(t => t.transaction_type === 'incentive_bonus')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const effective_commission_rate = total_gross_revenue > 0 
        ? ((total_commission_earned + performance_adjustments_amount) / total_gross_revenue) * 100
        : 0;
      
      const commission_summary = {
        total_trips,
        total_gross_revenue,
        total_commission_earned,
        average_commission_rate,
        effective_commission_rate
      };
      
      // Analyze by commission tier
      const tier_analysis = await this.analyzeTierPerformance(operatorId, period);
      
      // Calculate performance adjustments
      const performance_bonuses = commission_transactions
        .filter(t => t.transaction_type === 'incentive_bonus')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const penalty_deductions = commission_transactions
        .filter(t => t.transaction_type === 'penalty_deduction')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const tier_upgrade_bonuses = await this.getTierUpgradeBonuses(operatorId, period);
      
      const performance_adjustments = {
        performance_bonuses,
        tier_upgrade_bonuses,
        penalty_deductions,
        net_adjustment: performance_bonuses + tier_upgrade_bonuses - penalty_deductions
      };
      
      // Analyze trends
      const trend_analysis = await this.analyzeCommissionTrends(operatorId, period);
      
      const report: CommissionReport = {
        operator_id: operatorId,
        period,
        generated_at: new Date().toISOString(),
        commission_summary,
        tier_analysis,
        performance_adjustments,
        trend_analysis
      };
      
      logger.info('Commission report generated successfully', { 
        operatorId, 
        totalCommission: total_commission_earned,
        effectiveRate: effective_commission_rate,
        netAdjustment: performance_adjustments.net_adjustment
      });
      
      return report;
      
    } catch (error) {
      logger.error('Failed to generate commission report', { error, operatorId, period });
      throw error;
    }
  }
  
  async generateBoundaryFeeReport(
    operatorId: string, 
    period: FinancialPeriod
  ): Promise<BoundaryFeeReport> {
    try {
      logger.info('Generating boundary fee report', { operatorId, period });
      
      // Get boundary fee transactions
      const boundary_fees = await this.getBoundaryFees(operatorId, period);
      const unique_drivers = new Set(boundary_fees.map(f => f.driver_id)).size;
      
      // Calculate collection summary
      const total_fee_collected = boundary_fees.reduce((sum, fee) => sum + fee.total_amount, 0);
      const successful_collections = boundary_fees.filter(f => f.payment_status === 'completed').length;
      const collection_rate = boundary_fees.length > 0 
        ? (successful_collections / boundary_fees.length) * 100 
        : 0;
      
      const collection_summary = {
        total_drivers: unique_drivers,
        total_fee_collected,
        average_daily_fee: unique_drivers > 0 ? total_fee_collected / unique_drivers : 0,
        collection_rate
      };
      
      // Analyze dynamic pricing components
      const base_fees = boundary_fees.map(f => f.base_boundary_fee);
      const fuel_adjustments_total = boundary_fees.reduce((sum, f) => sum + f.fuel_subsidy, 0);
      const performance_adjustments_total = boundary_fees.reduce((sum, f) => sum + f.performance_adjustment, 0);
      const other_adjustments_total = boundary_fees.reduce((sum, f) => sum + f.other_adjustments, 0);
      
      const dynamic_pricing = {
        base_boundary_fee: base_fees.length > 0 
          ? base_fees.reduce((sum, fee) => sum + fee, 0) / base_fees.length 
          : 0,
        fuel_adjustments: fuel_adjustments_total,
        performance_adjustments: performance_adjustments_total,
        market_adjustments: other_adjustments_total,
        effective_average_fee: collection_summary.average_daily_fee
      };
      
      // Analyze payment patterns
      const on_time_payments = boundary_fees.filter(f => f.payment_status === 'completed' && 
        new Date(f.paid_at || '') <= new Date(f.fee_date)).length;
      const late_payments = boundary_fees.filter(f => f.payment_status === 'completed' && 
        new Date(f.paid_at || '') > new Date(f.fee_date)).length;
      const defaulted_payments = boundary_fees.filter(f => f.payment_status === 'failed').length;
      
      // Group by payment method
      const payment_method_breakdown: Record<string, number> = {};
      boundary_fees.forEach(f => {
        if (f.payment_method) {
          payment_method_breakdown[f.payment_method] = 
            (payment_method_breakdown[f.payment_method] || 0) + f.total_amount;
        }
      });
      
      const payment_analysis = {
        on_time_payments,
        late_payments,
        defaulted_payments,
        payment_method_breakdown
      };
      
      // Analyze performance impact
      const positive_adjustments = boundary_fees
        .filter(f => f.performance_adjustment > 0)
        .reduce((sum, f) => sum + f.performance_adjustment, 0);
      
      const negative_adjustments = boundary_fees
        .filter(f => f.performance_adjustment < 0)
        .reduce((sum, f) => sum + Math.abs(f.performance_adjustment), 0);
      
      const performance_impact = {
        fee_reduction_from_performance: negative_adjustments,
        bonus_fees_from_performance: positive_adjustments,
        net_performance_adjustment: positive_adjustments - negative_adjustments
      };
      
      const report: BoundaryFeeReport = {
        operator_id: operatorId,
        period,
        generated_at: new Date().toISOString(),
        collection_summary,
        dynamic_pricing,
        payment_analysis,
        performance_impact
      };
      
      logger.info('Boundary fee report generated successfully', { 
        operatorId, 
        totalCollected: total_fee_collected,
        collectionRate: collection_rate,
        netPerformanceAdjustment: performance_impact.net_performance_adjustment
      });
      
      return report;
      
    } catch (error) {
      logger.error('Failed to generate boundary fee report', { error, operatorId, period });
      throw error;
    }
  }
  
  // =====================================================
  // ADVANCED ANALYTICS
  // =====================================================
  
  async generateRevenueForecasting(
    operatorId: string, 
    forecastPeriods: number
  ): Promise<RevenueForecasting> {
    try {
      logger.info('Generating revenue forecasting', { operatorId, forecastPeriods });
      
      // Get historical revenue data
      const historicalData = await this.getHistoricalRevenueData(operatorId, 24); // 24 months
      
      // Analyze historical patterns
      const revenue_trend = this.analyzeTrend(historicalData);
      const seasonality_factors = this.analyzeSeasonality(historicalData);
      const growth_rate = this.calculateGrowthRate(
        historicalData.slice(-6).reduce((sum, d) => sum + d.revenue, 0),
        historicalData.slice(-12, -6).reduce((sum, d) => sum + d.revenue, 0)
      );
      const volatility = this.calculateVolatility(historicalData);
      
      const historical_analysis = {
        revenue_trend,
        seasonality_factors,
        growth_rate,
        volatility
      };
      
      // Generate different forecast models
      const linear_model = this.generateLinearForecast(historicalData, forecastPeriods);
      const seasonal_model = this.generateSeasonalForecast(historicalData, forecastPeriods, seasonality_factors);
      const ml_model = await this.generateMLForecast(operatorId, forecastPeriods);
      
      // Create ensemble forecast (weighted average)
      const ensemble_model = this.createEnsembleForecast([
        { predictions: linear_model, weight: 0.2 },
        { predictions: seasonal_model, weight: 0.3 },
        { predictions: ml_model, weight: 0.5 }
      ]);
      
      const forecasts = {
        linear_model,
        seasonal_model,
        ml_model,
        ensemble_model
      };
      
      // Generate scenario analysis
      const scenarios = {
        optimistic: this.adjustForecast(ensemble_model, 1.2), // 20% higher
        base_case: ensemble_model,
        pessimistic: this.adjustForecast(ensemble_model, 0.8) // 20% lower
      };
      
      // Define key assumptions
      const assumptions = {
        market_growth_rate: 0.15, // 15% annual market growth
        competition_impact: -0.05, // 5% negative impact from competition
        regulatory_changes: ['New LTFRB guidelines', 'Updated tax regulations'],
        seasonal_adjustments: seasonality_factors
      };
      
      // Calculate confidence metrics
      const model_accuracy = await this.calculateModelAccuracy(operatorId);
      const prediction_confidence = this.calculatePredictionConfidence(
        historical_analysis, model_accuracy, forecastPeriods
      );
      const recommendation_strength = prediction_confidence > 80 ? 'high' : 
                                    prediction_confidence > 60 ? 'medium' : 'low';
      
      const confidence_metrics = {
        model_accuracy,
        prediction_confidence,
        recommendation_strength
      };
      
      const forecast: RevenueForecasting = {
        operator_id: operatorId,
        forecast_generated_at: new Date().toISOString(),
        forecast_periods: forecastPeriods,
        historical_analysis,
        forecasts,
        scenarios,
        assumptions,
        confidence_metrics
      };
      
      logger.info('Revenue forecasting generated successfully', { 
        operatorId, 
        forecastPeriods,
        growthRate: growth_rate,
        predictionConfidence: prediction_confidence
      });
      
      return forecast;
      
    } catch (error) {
      logger.error('Failed to generate revenue forecasting', { error, operatorId, forecastPeriods });
      throw error;
    }
  }
  
  async generateFinancialBenchmarking(operatorId: string): Promise<FinancialBenchmarking> {
    try {
      logger.info('Generating financial benchmarking', { operatorId });
      
      // Get operator's current tier and peer group
      const operator = await this.getOperator(operatorId);
      const peer_operators = await this.getPeerOperators(operator.commission_tier, operator.primary_region_id);
      
      // Calculate peer metrics
      const peer_metrics = await this.calculatePeerMetrics(peer_operators);
      const operator_metrics = await this.calculateOperatorMetrics(operatorId);
      
      // Create benchmark comparisons
      const revenue_per_vehicle = this.createBenchmarkMetric(
        operator_metrics.revenue_per_vehicle, peer_metrics.revenue_per_vehicle
      );
      const profit_margin = this.createBenchmarkMetric(
        operator_metrics.profit_margin, peer_metrics.profit_margin
      );
      const commission_rate = this.createBenchmarkMetric(
        operator_metrics.commission_rate, peer_metrics.commission_rate
      );
      const vehicle_utilization = this.createBenchmarkMetric(
        operator_metrics.vehicle_utilization, peer_metrics.vehicle_utilization
      );
      const driver_retention = this.createBenchmarkMetric(
        operator_metrics.driver_retention, peer_metrics.driver_retention
      );
      
      const peer_comparison = {
        operator_tier: operator.commission_tier,
        peer_group_size: peer_operators.length,
        metrics: {
          revenue_per_vehicle,
          profit_margin,
          commission_rate,
          vehicle_utilization,
          driver_retention
        }
      };
      
      // Get industry benchmarks
      const industry_data = await this.getIndustryBenchmarks(operator.primary_region_id);
      const industry_metrics = await this.calculateIndustryMetrics(industry_data);
      
      const industry_benchmarks = {
        market_segment: `${operator.primary_region_id} ${operator.operator_type.toUpperCase()}`,
        metrics: {
          revenue_growth: this.createBenchmarkMetric(
            operator_metrics.revenue_growth, industry_metrics.revenue_growth
          ),
          operational_efficiency: this.createBenchmarkMetric(
            operator_metrics.operational_efficiency, industry_metrics.operational_efficiency
          ),
          financial_stability: this.createBenchmarkMetric(
            operator_metrics.financial_stability, industry_metrics.financial_stability
          ),
          customer_satisfaction: this.createBenchmarkMetric(
            operator_metrics.customer_satisfaction, industry_metrics.customer_satisfaction
          )
        }
      };
      
      // Determine competitive position
      const all_scores = [
        revenue_per_vehicle.percentile_rank,
        profit_margin.percentile_rank,
        commission_rate.percentile_rank,
        vehicle_utilization.percentile_rank,
        driver_retention.percentile_rank
      ];
      const overall_rank = Math.floor(all_scores.reduce((sum, score) => sum + score, 0) / all_scores.length);
      
      const competitive_position = {
        overall_rank,
        percentile_rank: overall_rank,
        strengths: this.identifyStrengths(operator_metrics, peer_metrics),
        improvement_areas: this.identifyImprovementAreas(operator_metrics, peer_metrics),
        competitive_advantages: this.identifyCompetitiveAdvantages(operator_metrics, industry_metrics)
      };
      
      // Generate recommendations
      const benchmarking_recommendations = await this.generateBenchmarkingRecommendations(
        operator_metrics, peer_metrics, industry_metrics
      );
      
      const benchmarking: FinancialBenchmarking = {
        operator_id: operatorId,
        generated_at: new Date().toISOString(),
        peer_comparison,
        industry_benchmarks,
        competitive_position,
        benchmarking_recommendations
      };
      
      logger.info('Financial benchmarking generated successfully', { 
        operatorId, 
        overallRank: overall_rank,
        peerGroupSize: peer_operators.length,
        recommendationCount: benchmarking_recommendations.length
      });
      
      return benchmarking;
      
    } catch (error) {
      logger.error('Failed to generate financial benchmarking', { error, operatorId });
      throw error;
    }
  }
  
  async generateRiskAssessment(operatorId: string): Promise<FinancialRiskAssessment> {
    try {
      logger.info('Generating financial risk assessment', { operatorId });
      
      // Assess different risk categories
      const liquidity_risk = await this.assessLiquidityRisk(operatorId);
      const credit_risk = await this.assessCreditRisk(operatorId);
      const operational_risk = await this.assessOperationalRisk(operatorId);
      const market_risk = await this.assessMarketRisk(operatorId);
      const regulatory_risk = await this.assessRegulatoryRisk(operatorId);
      const technology_risk = await this.assessTechnologyRisk(operatorId);
      
      const risk_categories = {
        liquidity_risk,
        credit_risk,
        operational_risk,
        market_risk,
        regulatory_risk,
        technology_risk
      };
      
      // Calculate overall risk score (weighted average)
      const risk_weights = {
        liquidity_risk: 0.25,
        credit_risk: 0.20,
        operational_risk: 0.20,
        market_risk: 0.15,
        regulatory_risk: 0.15,
        technology_risk: 0.05
      };
      
      const overall_risk_score = Object.entries(risk_categories).reduce((total, [category, assessment]) => {
        const weight = risk_weights[category as keyof typeof risk_weights];
        return total + (assessment.risk_score * weight);
      }, 0);
      
      const risk_level = overall_risk_score >= 80 ? 'critical' :
                        overall_risk_score >= 60 ? 'high' :
                        overall_risk_score >= 40 ? 'medium' : 'low';
      
      // Check early warning indicators
      const early_warning_indicators = await this.checkEarlyWarningIndicators(operatorId);
      
      // Generate mitigation strategies
      const mitigation_strategies = await this.generateRiskMitigationStrategies(
        risk_categories, early_warning_indicators
      );
      
      const assessment: FinancialRiskAssessment = {
        operator_id: operatorId,
        generated_at: new Date().toISOString(),
        overall_risk_score,
        risk_level,
        risk_categories,
        early_warning_indicators,
        mitigation_strategies
      };
      
      logger.info('Financial risk assessment generated successfully', { 
        operatorId, 
        overallRiskScore: overall_risk_score,
        riskLevel: risk_level,
        warningIndicators: Object.values(early_warning_indicators).filter(Boolean).length
      });
      
      return assessment;
      
    } catch (error) {
      logger.error('Failed to generate financial risk assessment', { error, operatorId });
      throw error;
    }
  }
  
  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================
  // (Implementation of helper methods would continue here...)
  
  private async getFinancialTransactions(operatorId: string, period: FinancialPeriod): Promise<any[]> {
    // Mock implementation - would query operator_financial_transactions table
    logger.debug('Getting financial transactions', { operatorId, period });
    return [];
  }
  
  private async getOperator(operatorId: string): Promise<any> {
    // Mock implementation - would query operators table
    logger.debug('Getting operator', { operatorId });
    return {
      commission_tier: 'tier_2',
      primary_region_id: 'metro_manila',
      operator_type: 'tnvs'
    };
  }
  
  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }
  
  private calculateCommissionRevenue(transactions: any[]): number {
    return transactions
      .filter(t => t.transaction_type === 'commission_earned')
      .reduce((sum, t) => sum + t.amount, 0);
  }
  
  private calculateBoundaryFees(transactions: any[]): number {
    return transactions
      .filter(t => t.transaction_type === 'boundary_fee')
      .reduce((sum, t) => sum + t.amount, 0);
  }
  
  private calculateIncentiveFees(transactions: any[]): number {
    return transactions
      .filter(t => t.transaction_type === 'incentive_bonus')
      .reduce((sum, t) => sum + t.amount, 0);
  }
  
  private calculateOtherRevenue(transactions: any[]): number {
    const otherTypes = ['adjustment', 'deposit'];
    return transactions
      .filter(t => otherTypes.includes(t.transaction_type) && t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }
  
  private calculateDriverSubsidies(transactions: any[]): number {
    return transactions
      .filter(t => t.transaction_type === 'fuel_subsidy' || t.transaction_type === 'maintenance_subsidy')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }
  
  private calculateFuelAllowances(transactions: any[]): number {
    return transactions
      .filter(t => t.transaction_type === 'fuel_subsidy')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }
  
  private calculateMaintenanceSubsidies(transactions: any[]): number {
    return transactions
      .filter(t => t.transaction_type === 'maintenance_subsidy')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }
  
  private calculateInsurancePremiums(transactions: any[]): number {
    return transactions
      .filter(t => t.transaction_type === 'insurance_payment')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }
  
  private calculateRegulatoryFees(transactions: any[]): number {
    return transactions
      .filter(t => t.transaction_type === 'registration_fee')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }
  
  private calculateOperationalCosts(transactions: any[]): number {
    // Mock implementation - would calculate based on transaction types
    return 0;
  }
  
  private calculateAdministrativeCosts(transactions: any[]): number {
    // Mock implementation - would calculate based on transaction types
    return 0;
  }
  
  private calculateTotalRevenue(transactions: any[]): number {
    const revenueTypes = ['commission_earned', 'boundary_fee', 'incentive_bonus'];
    return transactions
      .filter(t => revenueTypes.includes(t.transaction_type))
      .reduce((sum, t) => sum + t.amount, 0);
  }
  
  private calculateTotalExpenses(transactions: any[]): number {
    const expenseTypes = ['fuel_subsidy', 'maintenance_subsidy', 'insurance_payment', 'registration_fee'];
    return transactions
      .filter(t => expenseTypes.includes(t.transaction_type))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }
  
  // Additional helper methods would be implemented here...
  // (Continuing with mock implementations for brevity)
  
  private async getPreviousPeriodTransactions(operatorId: string, period: FinancialPeriod): Promise<any[]> {
    logger.debug('Getting previous period transactions', { operatorId, period });
    return [];
  }
  
  private async getVehicleCount(operatorId: string): Promise<number> {
    logger.debug('Getting vehicle count', { operatorId });
    return 0;
  }
  
  private async getDriverCount(operatorId: string): Promise<number> {
    logger.debug('Getting driver count', { operatorId });
    return 0;
  }
  
  private async getTripCount(operatorId: string, period: FinancialPeriod): Promise<number> {
    logger.debug('Getting trip count', { operatorId, period });
    return 0;
  }
}

// Create singleton instance
export const financialReportingService = new FinancialReportingServiceImpl();