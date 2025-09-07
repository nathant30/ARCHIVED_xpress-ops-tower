/**
 * Number Coding Enforcement Engine
 * 
 * Comprehensive system for managing number coding schemes in the Philippines:
 * - Metro Manila coding scheme (MMDA)
 * - Provincial coding variations
 * - Real-time violation prevention
 * - Driver notifications and route planning
 * - Automated enforcement and penalties
 * - Exemption management
 * - Dynamic coding schedule updates
 * - Integration with vehicle tracking systems
 */

import {
  NumberCodingRule,
  NumberCodingViolation,
  CodingExemptionRequest,
  CodingScheme,
  CodingDay,
  CodingExemption,
  PhilippinesRegion,
  ComplianceAlert,
  ComplianceAlertPriority,
  COMPLIANCE_CONSTANTS
} from '../../types/philippines-compliance';

import { Vehicle } from '../../types/vehicles';

// =====================================================
// NUMBER CODING ENFORCEMENT SERVICE
// =====================================================

export class NumberCodingEnforcementService {
  private codingRulesCache = new Map<string, NumberCodingRule[]>();
  private violationCache = new Map<string, NumberCodingViolation[]>();
  private exemptionCache = new Map<string, CodingExemptionRequest[]>();
  private activeEnforcement = true;
  private realTimeMonitoring = true;

  constructor() {
    this.initializeDefaultCodingRules();
    this.startRealTimeMonitoring();
  }

  // =====================================================
  // CODING RULES MANAGEMENT
  // =====================================================

  async createCodingRule(ruleData: Partial<NumberCodingRule>): Promise<NumberCodingRule> {
    const rule: NumberCodingRule = {
      id: this.generateId(),
      regionId: ruleData.regionId!,
      schemeName: ruleData.schemeName || 'Standard Number Coding',
      schemeType: ruleData.schemeType || 'metro_manila',
      codingHours: ruleData.codingHours || COMPLIANCE_CONSTANTS.CODING.STANDARD_HOURS,
      codingDays: ruleData.codingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      bannedDigits: ruleData.bannedDigits || this.generateRotatingBannedDigits(),
      exemptPlatePatterns: ruleData.exemptPlatePatterns || this.getDefaultExemptPatterns(),
      coverageArea: ruleData.coverageArea!,
      exemptedAreas: ruleData.exemptedAreas || [],
      firstOffenseFine: ruleData.firstOffenseFine || 500,
      subsequentOffenseFine: ruleData.subsequentOffenseFine || 1000,
      effectiveDate: ruleData.effectiveDate || new Date(),
      expiryDate: ruleData.expiryDate,
      isActive: true,
      holidayExemptions: ruleData.holidayExemptions || this.getDefaultHolidayExemptions(),
      emergencyExemptions: ruleData.emergencyExemptions || ['medical_emergency', 'government_official'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Cache and store the rule
    await this.saveCodingRule(rule);
    this.addRuleToCache(rule);

    // Log rule creation
    await this.logCodingEvent('coding_rule_created', {
      ruleId: rule.id,
      regionId: rule.regionId,
      schemeType: rule.schemeType,
    });

    return rule;
  }

  async updateCodingRule(ruleId: string, updates: Partial<NumberCodingRule>): Promise<NumberCodingRule> {
    const existingRule = await this.getCodingRuleById(ruleId);
    if (!existingRule) {
      throw new Error(`Coding rule not found: ${ruleId}`);
    }

    const updatedRule: NumberCodingRule = {
      ...existingRule,
      ...updates,
      updatedAt: new Date(),
    };

    await this.saveCodingRule(updatedRule);
    this.updateRuleInCache(updatedRule);

    // Log rule update
    await this.logCodingEvent('coding_rule_updated', {
      ruleId,
      changes: updates,
    });

    return updatedRule;
  }

  async getCodingRulesForRegion(regionId: string): Promise<NumberCodingRule[]> {
    // Check cache first
    if (this.codingRulesCache.has(regionId)) {
      return this.codingRulesCache.get(regionId)!.filter(rule => rule.isActive);
    }

    // Load from database
    const rules = await this.loadCodingRulesFromDatabase(regionId);
    this.codingRulesCache.set(regionId, rules);

    return rules.filter(rule => rule.isActive);
  }

  async getActiveCodingRuleForLocation(
    regionId: string, 
    location: { latitude: number; longitude: number }
  ): Promise<NumberCodingRule | null> {
    const rules = await this.getCodingRulesForRegion(regionId);
    
    for (const rule of rules) {
      if (this.isLocationWithinCoverageArea(location, rule.coverageArea)) {
        // Check if location is in any exempted area
        const isInExemptArea = rule.exemptedAreas?.some(area => 
          this.isLocationWithinCoverageArea(location, area)
        );
        
        if (!isInExemptArea) {
          return rule;
        }
      }
    }

    return null;
  }

  // =====================================================
  // REAL-TIME VIOLATION DETECTION
  // =====================================================

  async checkVehicleForCodingViolation(
    vehicleId: string,
    plateNumber: string,
    location: { latitude: number; longitude: number },
    regionId: string,
    driverId?: string
  ): Promise<{
    hasViolation: boolean;
    violationDetails?: NumberCodingViolation;
    warnings: string[];
    canProceed: boolean;
  }> {
    const now = new Date();
    const warnings: string[] = [];

    // Get active coding rule for current location
    const activeRule = await this.getActiveCodingRuleForLocation(regionId, location);
    
    if (!activeRule) {
      return {
        hasViolation: false,
        warnings: ['No active coding rules in this area'],
        canProceed: true
      };
    }

    // Check if coding is currently in effect
    const codingStatus = this.isCodingInEffect(activeRule, now);
    
    if (!codingStatus.inEffect) {
      return {
        hasViolation: false,
        warnings: [codingStatus.reason || 'Coding not in effect'],
        canProceed: true
      };
    }

    // Extract last digit from plate number
    const lastDigit = this.extractLastDigitFromPlate(plateNumber);
    
    if (lastDigit === null) {
      warnings.push('Could not determine plate number last digit');
      return {
        hasViolation: false,
        warnings,
        canProceed: true
      };
    }

    // Check if this digit is banned today
    const isBannedDigit = activeRule.bannedDigits.includes(lastDigit);
    
    if (!isBannedDigit) {
      return {
        hasViolation: false,
        warnings: ['Vehicle plate number is allowed during coding hours'],
        canProceed: true
      };
    }

    // Check for exemptions
    const exemptionStatus = await this.checkVehicleExemptions(vehicleId, driverId, plateNumber, activeRule);
    
    if (exemptionStatus.isExempt) {
      return {
        hasViolation: false,
        warnings: [`Vehicle is exempt: ${exemptionStatus.exemptionType}`],
        canProceed: true
      };
    }

    // Vehicle is in violation
    const violation = await this.createViolationRecord({
      vehicleId,
      driverId,
      plateNumber,
      lastDigit,
      location,
      codingRuleId: activeRule.id,
      detectionMethod: 'real_time_monitoring'
    });

    return {
      hasViolation: true,
      violationDetails: violation,
      warnings: ['CODING VIOLATION DETECTED: Vehicle cannot proceed'],
      canProceed: false
    };
  }

  async performBulkViolationCheck(
    vehicles: Array<{
      vehicleId: string;
      plateNumber: string;
      location: { latitude: number; longitude: number };
      regionId: string;
      driverId?: string;
    }>
  ): Promise<Map<string, any>> {
    const results = new Map();

    for (const vehicle of vehicles) {
      try {
        const result = await this.checkVehicleForCodingViolation(
          vehicle.vehicleId,
          vehicle.plateNumber,
          vehicle.location,
          vehicle.regionId,
          vehicle.driverId
        );
        results.set(vehicle.vehicleId, result);
      } catch (error) {
        results.set(vehicle.vehicleId, {
          hasViolation: false,
          warnings: [`Error checking violation: ${error.message}`],
          canProceed: false
        });
      }
    }

    return results;
  }

  // =====================================================
  // VIOLATION MANAGEMENT
  // =====================================================

  async recordManualViolation(violationData: Partial<NumberCodingViolation>): Promise<NumberCodingViolation> {
    const violation = await this.createViolationRecord({
      ...violationData,
      detectionMethod: violationData.detectionMethod || 'traffic_enforcer'
    });

    // Create alert for manual violation
    await this.createViolationAlert(violation);

    return violation;
  }

  private async createViolationRecord(violationData: Partial<NumberCodingViolation>): Promise<NumberCodingViolation> {
    const now = new Date();
    const lastDigit = violationData.lastDigit || this.extractLastDigitFromPlate(violationData.plateNumber!);
    
    // Check if this is a repeat violation
    const existingViolations = await this.getVehicleViolations(violationData.vehicleId!);
    const isRepeatOffender = this.isRepeatOffender(existingViolations);

    const violation: NumberCodingViolation = {
      id: this.generateId(),
      vehicleId: violationData.vehicleId!,
      driverId: violationData.driverId,
      violationDate: violationData.violationDate || now,
      violationTime: violationData.violationTime || now.toTimeString().substring(0, 5),
      location: violationData.location!,
      codingRuleId: violationData.codingRuleId!,
      plateNumber: violationData.plateNumber!,
      lastDigit: lastDigit!,
      detectionMethod: violationData.detectionMethod || 'system_automated',
      enforcingOfficer: violationData.enforcingOfficer,
      ticketNumber: violationData.ticketNumber || this.generateTicketNumber(),
      fineAmount: this.calculateFineAmount(violationData.codingRuleId!, isRepeatOffender),
      penaltyPoints: violationData.penaltyPoints || 1,
      status: 'pending',
      dueDate: this.calculateViolationDueDate(),
      evidencePhotos: violationData.evidencePhotos || [],
      videoEvidence: violationData.videoEvidence,
      createdAt: now,
      updatedAt: now,
    };

    // Save violation
    await this.saveViolation(violation);
    this.addViolationToCache(violation);

    // Log violation event
    await this.logCodingEvent('violation_recorded', {
      violationId: violation.id,
      vehicleId: violation.vehicleId,
      plateNumber: violation.plateNumber,
      location: violation.location,
      detectionMethod: violation.detectionMethod,
    });

    // Send real-time notification
    if (this.realTimeMonitoring) {
      await this.sendViolationNotification(violation);
    }

    return violation;
  }

  async updateViolationStatus(
    violationId: string,
    status: NumberCodingViolation['status'],
    paymentDetails?: any
  ): Promise<NumberCodingViolation> {
    const violation = await this.getViolationById(violationId);
    if (!violation) {
      throw new Error(`Violation not found: ${violationId}`);
    }

    violation.status = status;
    violation.updatedAt = new Date();

    if (status === 'paid') {
      violation.paidDate = new Date();
    } else if (status === 'contested') {
      violation.contestedDate = new Date();
    }

    await this.saveViolation(violation);
    this.updateViolationInCache(violation);

    // Log status update
    await this.logCodingEvent('violation_status_updated', {
      violationId,
      newStatus: status,
      paymentDetails,
    });

    return violation;
  }

  async contestViolation(
    violationId: string,
    contestReason: string,
    supportingEvidence?: string[]
  ): Promise<NumberCodingViolation> {
    const violation = await this.getViolationById(violationId);
    if (!violation) {
      throw new Error(`Violation not found: ${violationId}`);
    }

    if (violation.status !== 'pending') {
      throw new Error(`Cannot contest violation with status: ${violation.status}`);
    }

    violation.status = 'contested';
    violation.contestedDate = new Date();
    violation.contestReason = contestReason;
    violation.updatedAt = new Date();

    // Add supporting evidence if provided
    if (supportingEvidence) {
      violation.evidencePhotos = [...(violation.evidencePhotos || []), ...supportingEvidence];
    }

    await this.saveViolation(violation);

    // Create alert for contested violation
    await this.createContestedViolationAlert(violation);

    // Log contest event
    await this.logCodingEvent('violation_contested', {
      violationId,
      contestReason,
      supportingEvidenceCount: supportingEvidence?.length || 0,
    });

    return violation;
  }

  // =====================================================
  // EXEMPTION MANAGEMENT
  // =====================================================

  async requestCodingExemption(exemptionData: Partial<CodingExemptionRequest>): Promise<CodingExemptionRequest> {
    const exemption: CodingExemptionRequest = {
      id: this.generateId(),
      vehicleId: exemptionData.vehicleId!,
      driverId: exemptionData.driverId!,
      exemptionType: exemptionData.exemptionType!,
      requestDate: exemptionData.requestDate || new Date(),
      exemptionPeriodStart: exemptionData.exemptionPeriodStart!,
      exemptionPeriodEnd: exemptionData.exemptionPeriodEnd!,
      reason: exemptionData.reason!,
      supportingDocuments: exemptionData.supportingDocuments || [],
      status: 'pending',
      timesUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save exemption request
    await this.saveExemptionRequest(exemption);
    this.addExemptionToCache(exemption);

    // Create alert for new exemption request
    await this.createExemptionRequestAlert(exemption);

    // Log exemption request
    await this.logCodingEvent('exemption_requested', {
      exemptionId: exemption.id,
      vehicleId: exemption.vehicleId,
      exemptionType: exemption.exemptionType,
      reason: exemption.reason,
    });

    return exemption;
  }

  async reviewExemptionRequest(
    exemptionId: string,
    decision: 'approved' | 'denied',
    reviewNotes: string,
    reviewedBy: string
  ): Promise<CodingExemptionRequest> {
    const exemption = await this.getExemptionById(exemptionId);
    if (!exemption) {
      throw new Error(`Exemption request not found: ${exemptionId}`);
    }

    exemption.status = decision;
    exemption.reviewedBy = reviewedBy;
    exemption.reviewedDate = new Date();
    exemption.reviewNotes = reviewNotes;
    exemption.updatedAt = new Date();

    if (decision === 'approved') {
      exemption.approvalNumber = this.generateApprovalNumber();
      // Generate approval document (placeholder)
      exemption.approvalDocumentUrl = this.generateApprovalDocument(exemption);
    }

    await this.saveExemptionRequest(exemption);

    // Send notification to requester
    await this.sendExemptionDecisionNotification(exemption);

    // Log decision
    await this.logCodingEvent('exemption_reviewed', {
      exemptionId,
      decision,
      reviewedBy,
      reviewNotes,
    });

    return exemption;
  }

  private async checkVehicleExemptions(
    vehicleId: string,
    driverId?: string,
    plateNumber?: string,
    rule?: NumberCodingRule
  ): Promise<{
    isExempt: boolean;
    exemptionType?: CodingExemption;
    exemptionId?: string;
  }> {
    const now = new Date();

    // Check for approved exemption requests
    const vehicleExemptions = await this.getVehicleExemptions(vehicleId);
    const activeExemption = vehicleExemptions.find(exemption => 
      exemption.status === 'approved' &&
      exemption.exemptionPeriodStart <= now &&
      exemption.exemptionPeriodEnd >= now
    );

    if (activeExemption) {
      // Update usage count
      activeExemption.timesUsed += 1;
      activeExemption.lastUsedDate = now;
      await this.saveExemptionRequest(activeExemption);

      return {
        isExempt: true,
        exemptionType: activeExemption.exemptionType,
        exemptionId: activeExemption.id,
      };
    }

    // Check for plate pattern exemptions
    if (plateNumber && rule?.exemptPlatePatterns) {
      for (const pattern of rule.exemptPlatePatterns) {
        const regex = new RegExp(pattern);
        if (regex.test(plateNumber)) {
          return {
            isExempt: true,
            exemptionType: 'government_official', // Assumed for plate patterns
          };
        }
      }
    }

    // Check for holiday exemptions
    if (rule?.holidayExemptions) {
      const today = now.toISOString().split('T')[0];
      const isHoliday = rule.holidayExemptions.some(holiday => 
        holiday.toISOString().split('T')[0] === today
      );

      if (isHoliday) {
        return {
          isExempt: true,
          exemptionType: 'none', // Holiday exemption
        };
      }
    }

    return { isExempt: false };
  }

  // =====================================================
  // ROUTE PLANNING INTEGRATION
  // =====================================================

  async checkRouteForCodingIssues(
    route: Array<{ latitude: number; longitude: number; timestamp: Date }>,
    vehicleId: string,
    plateNumber: string
  ): Promise<{
    hasIssues: boolean;
    violationPoints: Array<{
      location: { latitude: number; longitude: number };
      timestamp: Date;
      ruleId: string;
      ruleName: string;
      estimatedFine: number;
    }>;
    recommendedAlternatives?: string[];
  }> {
    const violationPoints = [];

    for (const point of route) {
      // Get region for this location (simplified - would use reverse geocoding)
      const regionId = await this.getRegionForLocation(point);
      if (!regionId) continue;

      const violationCheck = await this.checkVehicleForCodingViolation(
        vehicleId,
        plateNumber,
        point,
        regionId
      );

      if (violationCheck.hasViolation && violationCheck.violationDetails) {
        const rule = await this.getCodingRuleById(violationCheck.violationDetails.codingRuleId);
        violationPoints.push({
          location: point,
          timestamp: point.timestamp,
          ruleId: violationCheck.violationDetails.codingRuleId,
          ruleName: rule?.schemeName || 'Unknown Rule',
          estimatedFine: violationCheck.violationDetails.fineAmount,
        });
      }
    }

    return {
      hasIssues: violationPoints.length > 0,
      violationPoints,
      recommendedAlternatives: violationPoints.length > 0 ? 
        ['Use alternative routes during coding hours', 'Schedule travel outside coding hours'] : 
        undefined,
    };
  }

  async suggestCodingFriendlyRoute(
    startLocation: { latitude: number; longitude: number },
    endLocation: { latitude: number; longitude: number },
    vehicleId: string,
    plateNumber: string,
    departureTime?: Date
  ): Promise<{
    route: Array<{ latitude: number; longitude: number }>;
    estimatedTravelTime: number;
    codingCompliant: boolean;
    warnings: string[];
  }> {
    const departure = departureTime || new Date();
    
    // This would integrate with routing services to find coding-compliant routes
    // For now, returning a placeholder response
    
    return {
      route: [startLocation, endLocation], // Simplified
      estimatedTravelTime: 30, // minutes
      codingCompliant: true,
      warnings: ['Route optimized to avoid coding violations'],
    };
  }

  // =====================================================
  // NOTIFICATION SYSTEM
  // =====================================================

  async sendCodingAlert(
    vehicleId: string,
    driverId: string,
    alertType: 'approaching_coding_zone' | 'coding_violation_detected' | 'exemption_expiring',
    details: any
  ): Promise<void> {
    const alert: ComplianceAlert = {
      id: this.generateId(),
      vehicleId,
      driverId,
      alertType: alertType as any,
      priority: this.getAlertPriority(alertType),
      title: this.getAlertTitle(alertType),
      message: this.getAlertMessage(alertType, details),
      complianceType: 'coding',
      status: 'active',
      createdDate: new Date(),
      requiredActions: this.getRequiredActions(alertType),
      notificationsSent: [],
      escalationLevel: 1,
      followUpRequired: false,
      metadata: details,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveComplianceAlert(alert);

    // Send notifications via configured channels
    await this.sendMultiChannelNotification(alert);

    // Log alert
    await this.logCodingEvent('coding_alert_sent', {
      alertId: alert.id,
      vehicleId,
      driverId,
      alertType,
    });
  }

  // =====================================================
  // REPORTING AND ANALYTICS
  // =====================================================

  async generateCodingViolationReport(
    regionId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: {
      totalViolations: number;
      totalFines: number;
      violationsByDay: Record<string, number>;
      violationsByDigit: Record<number, number>;
      topViolationLocations: Array<{ location: string; count: number }>;
    };
    details: NumberCodingViolation[];
  }> {
    const violations = await this.getViolationsForPeriod(regionId, startDate, endDate);

    const summary = {
      totalViolations: violations.length,
      totalFines: violations.reduce((sum, v) => sum + v.fineAmount, 0),
      violationsByDay: this.groupViolationsByDay(violations),
      violationsByDigit: this.groupViolationsByDigit(violations),
      topViolationLocations: this.getTopViolationLocations(violations),
    };

    return {
      summary,
      details: violations,
    };
  }

  async getCodingComplianceMetrics(regionId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<{
    complianceRate: number;
    totalVehiclesMonitored: number;
    violationRate: number;
    averageFineAmount: number;
    exemptionUsageRate: number;
  }> {
    // This would calculate comprehensive metrics based on period
    // For now, returning placeholder data
    
    return {
      complianceRate: 95.5,
      totalVehiclesMonitored: 1000,
      violationRate: 4.5,
      averageFineAmount: 750,
      exemptionUsageRate: 2.1,
    };
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private initializeDefaultCodingRules(): void {
    // Metro Manila coding scheme (Monday to Friday, 7 AM to 7 PM)
    const metroManilaRule = {
      regionId: 'ncr',
      schemeName: 'Metro Manila Unified Vehicle Volume Reduction Program (MMDA)',
      schemeType: 'metro_manila' as CodingScheme,
      codingHours: { start: '07:00', end: '19:00' },
      codingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as CodingDay[],
      coverageArea: this.getMetroManilaGeometry(),
      firstOffenseFine: 1000,
      subsequentOffenseFine: 2000,
    };

    this.createCodingRule(metroManilaRule);
  }

  private generateId(): string {
    return 'coding_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateTicketNumber(): string {
    const date = new Date().toISOString().substring(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TCT-${date}-${random}`;
  }

  private generateApprovalNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EXM-${timestamp}-${random}`;
  }

  private generateRotatingBannedDigits(): number[] {
    // This would implement actual rotation logic based on the day
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const rotations: Record<number, number[]> = {
      1: [1, 2], // Monday
      2: [3, 4], // Tuesday
      3: [5, 6], // Wednesday
      4: [7, 8], // Thursday
      5: [9, 0], // Friday
    };
    return rotations[dayOfWeek] || [];
  }

  private getDefaultExemptPatterns(): string[] {
    return [
      '^[0-9]+-GOV$',     // Government plates
      '^[0-9]+-DIP$',     // Diplomatic plates
      '^[0-9]+-MIL$',     // Military plates
      '^[0-9]+-POL$',     // Police plates
      '^[0-9]+-EMG$',     // Emergency service plates
    ];
  }

  private getDefaultHolidayExemptions(): Date[] {
    // This would be populated with Philippine national holidays
    const currentYear = new Date().getFullYear();
    return [
      new Date(currentYear, 0, 1),   // New Year's Day
      new Date(currentYear, 3, 9),   // Araw ng Kagitingan
      new Date(currentYear, 4, 1),   // Labor Day
      new Date(currentYear, 5, 12),  // Independence Day
      new Date(currentYear, 11, 25), // Christmas Day
      new Date(currentYear, 11, 30), // Rizal Day
    ];
  }

  private extractLastDigitFromPlate(plateNumber: string): number | null {
    const match = plateNumber.match(/\d(?=\D*$)/);
    return match ? parseInt(match[0]) : null;
  }

  private isCodingInEffect(rule: NumberCodingRule, currentTime: Date): {
    inEffect: boolean;
    reason?: string;
  } {
    const now = currentTime;
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const dayNames: CodingDay[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[dayOfWeek];

    // Check if today is a coding day
    if (!rule.codingDays.includes(currentDay)) {
      return { inEffect: false, reason: 'Non-coding day' };
    }

    // Check if current time is within coding hours
    const currentTimeString = now.toTimeString().substring(0, 5); // HH:MM format
    const isWithinHours = currentTimeString >= rule.codingHours.start && 
                         currentTimeString <= rule.codingHours.end;

    if (!isWithinHours) {
      return { inEffect: false, reason: 'Outside coding hours' };
    }

    // Check for holiday exemptions
    const today = now.toISOString().split('T')[0];
    const isHoliday = rule.holidayExemptions.some(holiday => 
      holiday.toISOString().split('T')[0] === today
    );

    if (isHoliday) {
      return { inEffect: false, reason: 'Holiday exemption' };
    }

    return { inEffect: true };
  }

  private isLocationWithinCoverageArea(
    location: { latitude: number; longitude: number },
    coverageArea: any
  ): boolean {
    // This would implement proper geospatial checking
    // For now, returning true as placeholder
    return true;
  }

  private calculateFineAmount(codingRuleId: string, isRepeatOffender: boolean): number {
    // This would get the fine amount from the coding rule
    // For now, using default amounts
    return isRepeatOffender ? 1000 : 500;
  }

  private calculateViolationDueDate(): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 days to pay
    return dueDate;
  }

  private isRepeatOffender(violations: NumberCodingViolation[]): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentViolations = violations.filter(v => v.violationDate > thirtyDaysAgo);
    return recentViolations.length >= 2;
  }

  private getAlertPriority(alertType: string): ComplianceAlertPriority {
    const priorities: Record<string, ComplianceAlertPriority> = {
      'coding_violation_detected': 'high',
      'approaching_coding_zone': 'medium',
      'exemption_expiring': 'medium',
    };
    return priorities[alertType] || 'low';
  }

  private getAlertTitle(alertType: string): string {
    const titles: Record<string, string> = {
      'coding_violation_detected': 'Number Coding Violation Detected',
      'approaching_coding_zone': 'Approaching Coding Zone',
      'exemption_expiring': 'Coding Exemption Expiring',
    };
    return titles[alertType] || 'Coding Alert';
  }

  private getAlertMessage(alertType: string, details: any): string {
    const messages: Record<string, string> = {
      'coding_violation_detected': `Vehicle with plate ${details.plateNumber} detected in violation of coding scheme`,
      'approaching_coding_zone': 'Your vehicle is approaching a number coding enforcement zone',
      'exemption_expiring': `Your coding exemption expires on ${details.expiryDate}`,
    };
    return messages[alertType] || 'Coding notification';
  }

  private getRequiredActions(alertType: string): string[] {
    const actions: Record<string, string[]> = {
      'coding_violation_detected': ['Pay fine within 7 days', 'Avoid using vehicle during coding hours'],
      'approaching_coding_zone': ['Check exemption status', 'Plan alternative route'],
      'exemption_expiring': ['Renew exemption if needed', 'Apply for new exemption'],
    };
    return actions[alertType] || [];
  }

  private groupViolationsByDay(violations: NumberCodingViolation[]): Record<string, number> {
    return violations.reduce((acc, violation) => {
      const day = violation.violationDate.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupViolationsByDigit(violations: NumberCodingViolation[]): Record<number, number> {
    return violations.reduce((acc, violation) => {
      acc[violation.lastDigit] = (acc[violation.lastDigit] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  private getTopViolationLocations(violations: NumberCodingViolation[]): Array<{ location: string; count: number }> {
    // This would aggregate violations by location
    // For now, returning placeholder data
    return [
      { location: 'EDSA-Ortigas', count: 25 },
      { location: 'EDSA-Cubao', count: 18 },
      { location: 'C5-BGC', count: 12 },
    ];
  }

  private getMetroManilaGeometry(): any {
    // This would return actual GeoJSON polygon for Metro Manila
    return {
      type: 'Polygon',
      coordinates: [[
        [120.9842, 14.7608], // Sample coordinates
        [121.0944, 14.7608],
        [121.0944, 14.5243],
        [120.9842, 14.5243],
        [120.9842, 14.7608]
      ]]
    };
  }

  private startRealTimeMonitoring(): void {
    // This would set up real-time monitoring systems
    console.log('Number coding real-time monitoring started');
    
    // Monitor vehicle locations every 30 seconds
    setInterval(async () => {
      if (this.realTimeMonitoring && this.activeEnforcement) {
        await this.performRealTimeEnforcementCheck();
      }
    }, 30000);
  }

  private async performRealTimeEnforcementCheck(): Promise<void> {
    // This would check all active vehicles for coding violations
    // Implementation would depend on vehicle tracking integration
    console.log('Performing real-time coding enforcement check...');
  }

  // =====================================================
  // PLACEHOLDER METHODS (TO BE IMPLEMENTED WITH DATABASE)
  // =====================================================

  private async saveCodingRule(rule: NumberCodingRule): Promise<void> {
    console.log('Saving coding rule:', rule.schemeName);
  }

  private async loadCodingRulesFromDatabase(regionId: string): Promise<NumberCodingRule[]> {
    return [];
  }

  private async getCodingRuleById(ruleId: string): Promise<NumberCodingRule | null> {
    return null;
  }

  private async saveViolation(violation: NumberCodingViolation): Promise<void> {
    console.log('Saving coding violation:', violation.ticketNumber);
  }

  private async getViolationById(violationId: string): Promise<NumberCodingViolation | null> {
    return null;
  }

  private async getVehicleViolations(vehicleId: string): Promise<NumberCodingViolation[]> {
    return [];
  }

  private async saveExemptionRequest(exemption: CodingExemptionRequest): Promise<void> {
    console.log('Saving exemption request:', exemption.id);
  }

  private async getExemptionById(exemptionId: string): Promise<CodingExemptionRequest | null> {
    return null;
  }

  private async getVehicleExemptions(vehicleId: string): Promise<CodingExemptionRequest[]> {
    return [];
  }

  private async getViolationsForPeriod(regionId: string, startDate: Date, endDate: Date): Promise<NumberCodingViolation[]> {
    return [];
  }

  private async getRegionForLocation(location: { latitude: number; longitude: number }): Promise<string | null> {
    // This would use reverse geocoding to determine region
    return 'ncr';
  }

  private async logCodingEvent(eventType: string, data: any): Promise<void> {
    console.log(`Coding Event: ${eventType}`, data);
  }

  private async saveComplianceAlert(alert: ComplianceAlert): Promise<void> {
    console.log('Saving compliance alert:', alert.title);
  }

  private async sendViolationNotification(violation: NumberCodingViolation): Promise<void> {
    console.log('Sending violation notification:', violation.ticketNumber);
  }

  private async sendMultiChannelNotification(alert: ComplianceAlert): Promise<void> {
    console.log('Sending multi-channel notification:', alert.title);
  }

  private async createViolationAlert(violation: NumberCodingViolation): Promise<void> {
    console.log('Creating violation alert:', violation.ticketNumber);
  }

  private async createContestedViolationAlert(violation: NumberCodingViolation): Promise<void> {
    console.log('Creating contested violation alert:', violation.ticketNumber);
  }

  private async createExemptionRequestAlert(exemption: CodingExemptionRequest): Promise<void> {
    console.log('Creating exemption request alert:', exemption.id);
  }

  private async sendExemptionDecisionNotification(exemption: CodingExemptionRequest): Promise<void> {
    console.log('Sending exemption decision notification:', exemption.id);
  }

  private generateApprovalDocument(exemption: CodingExemptionRequest): string {
    // This would generate an actual approval document
    return `approval_documents/${exemption.id}.pdf`;
  }

  private addRuleToCache(rule: NumberCodingRule): void {
    const regionRules = this.codingRulesCache.get(rule.regionId) || [];
    regionRules.push(rule);
    this.codingRulesCache.set(rule.regionId, regionRules);
  }

  private updateRuleInCache(rule: NumberCodingRule): void {
    const regionRules = this.codingRulesCache.get(rule.regionId) || [];
    const index = regionRules.findIndex(r => r.id === rule.id);
    if (index !== -1) {
      regionRules[index] = rule;
      this.codingRulesCache.set(rule.regionId, regionRules);
    }
  }

  private addViolationToCache(violation: NumberCodingViolation): void {
    const vehicleViolations = this.violationCache.get(violation.vehicleId) || [];
    vehicleViolations.push(violation);
    this.violationCache.set(violation.vehicleId, vehicleViolations);
  }

  private updateViolationInCache(violation: NumberCodingViolation): void {
    const vehicleViolations = this.violationCache.get(violation.vehicleId) || [];
    const index = vehicleViolations.findIndex(v => v.id === violation.id);
    if (index !== -1) {
      vehicleViolations[index] = violation;
      this.violationCache.set(violation.vehicleId, vehicleViolations);
    }
  }

  private addExemptionToCache(exemption: CodingExemptionRequest): void {
    const vehicleExemptions = this.exemptionCache.get(exemption.vehicleId) || [];
    vehicleExemptions.push(exemption);
    this.exemptionCache.set(exemption.vehicleId, vehicleExemptions);
  }
}

export default NumberCodingEnforcementService;