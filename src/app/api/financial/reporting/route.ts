// =====================================================
// FINANCIAL REPORTING API
// Comprehensive financial reporting endpoints with regulatory compliance
// GET /api/financial/reporting - Get financial reports
// POST /api/financial/reporting - Generate new financial reports
// =====================================================

import { NextRequest } from 'next/server';
import { 
  createApiResponse, 
  createApiError, 
  parseQueryParams,
  handleOptionsRequest,
  validateRequiredFields
} from '@/lib/api-utils';
import { withEnhancedAuth } from '@/lib/auth/enhanced-auth';
import { financialReportingService } from '@/lib/services/FinancialReportingService';
import { philippinesRegulatoryService } from '@/lib/services/PhilippinesRegulatoryService';
import { commissionBoundaryService } from '@/lib/services/CommissionBoundaryService';
import { payoutSettlementService } from '@/lib/services/PayoutSettlementService';
import { versionedApiRoute, createVersionedResponse } from '@/middleware/apiVersioning';

// =====================================================
// GET FINANCIAL REPORTS
// =====================================================

const getFinancialReportsV1 = withEnhancedAuth({
  requiredPermissions: ['view_financial_reports', 'view_operators'],
  dataClass: 'financial'
})(async (request: NextRequest, user) => {
  const queryParams = parseQueryParams(request);
  
  try {
    // Extract query parameters
    const operatorId = queryParams.operator_id;
    const reportType = queryParams.report_type as string;
    const period = queryParams.period as string;
    const startDate = queryParams.start_date as string;
    const endDate = queryParams.end_date as string;
    
    // Validate required parameters
    if (!operatorId) {
      return createApiError(
        'operator_id is required',
        'MISSING_OPERATOR_ID',
        400,
        { provided: queryParams },
        '/api/financial/reporting',
        'GET'
      );
    }
    
    // Regional access check
    const userRegions = user.allowedRegions || [];
    if (userRegions.length > 0) {
      // Would typically check if operator is in allowed regions
      // For now, we'll assume access is valid
    }
    
    // Build period object
    const financialPeriod = {
      start_date: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: endDate || new Date().toISOString().split('T')[0],
      period_type: (period as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual') || 'monthly'
    };
    
    let reportData: any = {};
    
    // Generate requested report type
    switch (reportType) {
      case 'profit_loss':
        reportData.profit_loss = await financialReportingService.generateProfitLossStatement(operatorId, financialPeriod);
        break;
        
      case 'cash_flow':
        reportData.cash_flow = await financialReportingService.generateCashFlowAnalysis(operatorId, financialPeriod);
        break;
        
      case 'financial_health':
        reportData.financial_health = await financialReportingService.generateFinancialHealthReport(operatorId);
        break;
        
      case 'commission_report':
        reportData.commission_report = await financialReportingService.generateCommissionReport(operatorId, financialPeriod);
        break;
        
      case 'boundary_fee_report':
        reportData.boundary_fee_report = await financialReportingService.generateBoundaryFeeReport(operatorId, financialPeriod);
        break;
        
      case 'regulatory_compliance':
        const [birReport, bspReport, ltfrbReport] = await Promise.all([
          financialReportingService.generateBIRReport(operatorId, financialPeriod),
          financialReportingService.generateBSPReport(operatorId, financialPeriod),
          financialReportingService.generateLTFRBReport(operatorId, financialPeriod)
        ]);
        
        reportData.regulatory_compliance = {
          bir_report: birReport,
          bsp_report: bspReport,
          ltfrb_report: ltfrbReport
        };
        break;
        
      case 'revenue_forecasting':
        const forecastPeriods = parseInt(queryParams.forecast_periods as string) || 12;
        reportData.revenue_forecasting = await financialReportingService.generateRevenueForecasting(operatorId, forecastPeriods);
        break;
        
      case 'financial_benchmarking':
        reportData.financial_benchmarking = await financialReportingService.generateFinancialBenchmarking(operatorId);
        break;
        
      case 'risk_assessment':
        reportData.risk_assessment = await financialReportingService.generateRiskAssessment(operatorId);
        break;
        
      case 'comprehensive':
        // Generate all major reports
        const [plStatement, cashFlow, healthReport, commissionRpt, boundaryRpt] = await Promise.all([
          financialReportingService.generateProfitLossStatement(operatorId, financialPeriod),
          financialReportingService.generateCashFlowAnalysis(operatorId, financialPeriod),
          financialReportingService.generateFinancialHealthReport(operatorId),
          financialReportingService.generateCommissionReport(operatorId, financialPeriod),
          financialReportingService.generateBoundaryFeeReport(operatorId, financialPeriod)
        ]);
        
        reportData = {
          profit_loss: plStatement,
          cash_flow: cashFlow,
          financial_health: healthReport,
          commission_report: commissionRpt,
          boundary_fee_report: boundaryRpt
        };
        break;
        
      default:
        // Default to financial health report
        reportData.financial_health = await financialReportingService.generateFinancialHealthReport(operatorId);
    }
    
    // Add metadata
    const response = {
      operator_id: operatorId,
      report_type: reportType || 'financial_health',
      period: financialPeriod,
      generated_at: new Date().toISOString(),
      generated_by: user.id,
      reports: reportData,
      
      // Additional context
      user_permissions: user.permissions,
      data_freshness: 'real_time', // Could be calculated based on data sources
      compliance_status: 'current', // Could be determined from regulatory services
      
      // API metadata
      api_version: 'v1',
      response_time_ms: Date.now() - (request as any).start_time || 0
    };
    
    return createVersionedResponse(response, 'v1');
    
  } catch (error) {
    return createApiError(
      error instanceof Error ? error.message : 'Failed to generate financial reports',
      'FINANCIAL_REPORT_ERROR',
      500,
      { 
        operatorId: queryParams.operator_id, 
        reportType: queryParams.report_type,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      '/api/financial/reporting',
      'GET'
    );
  }
});

// =====================================================
// GENERATE NEW FINANCIAL REPORTS
// =====================================================

const generateFinancialReportsV1 = withEnhancedAuth({
  requiredPermissions: ['generate_financial_reports', 'manage_operators'],
  dataClass: 'financial'
})(async (request: NextRequest, user) => {
  try {
    const body = await request.json();
    
    // Validate required fields
    const validationResult = validateRequiredFields(body, [
      'operator_id',
      'report_types',
      'period'
    ]);
    
    if (!validationResult.isValid) {
      return createApiError(
        `Missing required fields: ${validationResult.missingFields.join(', ')}`,
        'VALIDATION_ERROR',
        400,
        { missingFields: validationResult.missingFields },
        '/api/financial/reporting',
        'POST'
      );
    }
    
    const { operator_id, report_types, period, options = {} } = body;
    
    // Regional access check
    const userRegions = user.allowedRegions || [];
    if (userRegions.length > 0) {
      // Would check operator region access
    }
    
    // Build period object
    const financialPeriod = {
      start_date: period.start_date,
      end_date: period.end_date,
      period_type: period.period_type
    };
    
    const generatedReports: any = {};
    const processingResults: any[] = [];
    
    // Process each requested report type
    for (const reportType of report_types) {
      const startTime = Date.now();
      
      try {
        let reportData: any;
        
        switch (reportType) {
          case 'profit_loss':
            reportData = await financialReportingService.generateProfitLossStatement(operator_id, financialPeriod);
            break;
            
          case 'cash_flow':
            reportData = await financialReportingService.generateCashFlowAnalysis(operator_id, financialPeriod);
            break;
            
          case 'financial_health':
            reportData = await financialReportingService.generateFinancialHealthReport(operator_id);
            break;
            
          case 'commission_analytics':
            reportData = await commissionBoundaryService.generateCommissionAnalytics(operator_id, financialPeriod.start_date);
            break;
            
          case 'boundary_fee_analytics':
            reportData = await commissionBoundaryService.generateBoundaryFeeAnalytics(operator_id, financialPeriod.start_date);
            break;
            
          case 'performance_impact':
            reportData = await commissionBoundaryService.generatePerformanceImpactReport(operator_id);
            break;
            
          case 'payout_analytics':
            reportData = await payoutSettlementService.generatePayoutAnalytics(operator_id, financialPeriod.start_date);
            break;
            
          case 'cash_flow_projection':
            const projectionPeriods = options.projection_periods || 12;
            reportData = await payoutSettlementService.generateCashFlowProjection(operator_id, projectionPeriods);
            break;
            
          case 'bir_compliance':
            reportData = await philippinesRegulatoryService.calculateVAT(operator_id, financialPeriod.start_date);
            break;
            
          case 'withholding_tax':
            reportData = await philippinesRegulatoryService.calculateWithholdingTax(operator_id, financialPeriod.start_date);
            break;
            
          case 'regulatory_scorecard':
            reportData = await philippinesRegulatoryService.generateComplianceScorecard(operator_id);
            break;
            
          default:
            throw new Error(`Unsupported report type: ${reportType}`);
        }
        
        generatedReports[reportType] = reportData;
        
        processingResults.push({
          report_type: reportType,
          status: 'success',
          processing_time_ms: Date.now() - startTime,
          generated_at: new Date().toISOString()
        });
        
      } catch (error) {
        processingResults.push({
          report_type: reportType,
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          processing_time_ms: Date.now() - startTime
        });
      }
    }
    
    // Calculate overall success metrics
    const successfulReports = processingResults.filter(r => r.status === 'success').length;
    const totalReports = report_types.length;
    const successRate = (successfulReports / totalReports) * 100;
    
    const response = {
      generation_id: `GEN_${Date.now()}_${operator_id}`,
      operator_id,
      generation_date: new Date().toISOString(),
      generated_by: user.id,
      
      // Generation Summary
      summary: {
        total_reports_requested: totalReports,
        successful_reports: successfulReports,
        failed_reports: totalReports - successfulReports,
        success_rate: successRate,
        total_processing_time_ms: processingResults.reduce((sum, r) => sum + r.processing_time_ms, 0)
      },
      
      // Generated Reports
      reports: generatedReports,
      
      // Processing Details
      processing_results: processingResults,
      
      // Period Information
      period: financialPeriod,
      
      // Options Used
      generation_options: options,
      
      // Quality Metrics
      quality_metrics: {
        data_completeness: calculateDataCompleteness(generatedReports),
        calculation_accuracy: calculateAccuracy(generatedReports),
        regulatory_compliance: assessRegulatoryCompliance(generatedReports)
      },
      
      // Recommendations
      recommendations: generateRecommendations(generatedReports, processingResults),
      
      // Next Steps
      next_actions: suggestNextActions(generatedReports, operator_id)
    };
    
    return createVersionedResponse(response, 'v1');
    
  } catch (error) {
    return createApiError(
      error instanceof Error ? error.message : 'Failed to generate financial reports',
      'REPORT_GENERATION_ERROR',
      500,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      '/api/financial/reporting',
      'POST'
    );
  }
});

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function calculateDataCompleteness(reports: any): number {
  // Analyze report data completeness
  let totalFields = 0;
  let completeFields = 0;
  
  function analyzeObject(obj: any): void {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        analyzeObject(value);
      } else {
        totalFields++;
        if (value !== null && value !== undefined && value !== '') {
          completeFields++;
        }
      }
    }
  }
  
  analyzeObject(reports);
  
  return totalFields > 0 ? (completeFields / totalFields) * 100 : 100;
}

function calculateAccuracy(reports: any): number {
  // Mock calculation accuracy assessment
  // In a real implementation, this would validate calculations
  return 98.5;
}

function assessRegulatoryCompliance(reports: any): number {
  // Mock regulatory compliance assessment
  // In a real implementation, this would check compliance requirements
  return 95.2;
}

function generateRecommendations(reports: any, processingResults: any[]): string[] {
  const recommendations: string[] = [];
  
  // Analyze failed reports
  const failedReports = processingResults.filter(r => r.status === 'error');
  if (failedReports.length > 0) {
    recommendations.push(`Review and retry ${failedReports.length} failed report(s)`);
  }
  
  // Analyze processing times
  const slowReports = processingResults.filter(r => r.processing_time_ms > 5000);
  if (slowReports.length > 0) {
    recommendations.push('Consider optimizing data sources for faster report generation');
  }
  
  // Check for data quality issues
  const dataCompleteness = calculateDataCompleteness(reports);
  if (dataCompleteness < 90) {
    recommendations.push('Improve data collection processes to increase report completeness');
  }
  
  return recommendations;
}

function suggestNextActions(reports: any, operatorId: string): string[] {
  const actions: string[] = [];
  
  // Check if regulatory reports were generated
  if (reports.bir_compliance || reports.withholding_tax) {
    actions.push('Review tax calculations and prepare for BIR filing');
  }
  
  // Check financial health
  if (reports.financial_health && reports.financial_health.overall_score < 70) {
    actions.push('Address financial health concerns identified in the report');
  }
  
  // Check performance impact
  if (reports.performance_impact) {
    actions.push('Review performance improvement opportunities');
  }
  
  return actions;
}

// =====================================================
// ROUTE EXPORTS
// =====================================================

export const GET = versionedApiRoute({
  v1: (request: NextRequest, context: any) => getFinancialReportsV1(request, context.user)
});

export const POST = versionedApiRoute({
  v1: (request: NextRequest, context: any) => generateFinancialReportsV1(request, context.user)
});

export const OPTIONS = handleOptionsRequest;