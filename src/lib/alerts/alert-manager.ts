// Alert Manager - Comprehensive Alert Generation and Management System
// Handles maintenance alerts, compliance notifications, and safety warnings

import { 
  MaintenanceAlert, 
  ComplianceAlert, 
  VehicleTelemetryData, 
  VehicleDiagnosticEvent,
  AlertStatus,
  MaintenancePriority
} from '@/types/vehicles';
import { AnomalyDetectionResult, PredictiveMaintenanceAlert } from '@/lib/analytics/data-processing-engine';
import { auditLogger, AuditEventType, SecurityLevel } from '@/lib/security/auditLogger';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'maintenance' | 'compliance' | 'safety' | 'performance' | 'diagnostic';
  priority: MaintenancePriority;
  conditions: AlertCondition[];
  actions: AlertAction[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'contains' | 'exists';
  value: any;
  threshold?: number;
  timeWindow?: number; // minutes
}

export interface AlertAction {
  type: 'notify_driver' | 'notify_owner' | 'notify_ops' | 'notify_compliance' | 'create_maintenance' | 'log_event';
  target?: string;
  template?: string;
  parameters?: Record<string, any>;
}

export interface AlertNotification {
  id: string;
  alertId: string;
  vehicleId: string;
  recipientType: 'driver' | 'owner' | 'operator' | 'compliance_team' | 'maintenance_team';
  recipientId: string;
  channel: 'app' | 'sms' | 'email' | 'push';
  title: string;
  message: string;
  priority: MaintenancePriority;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface AlertMetrics {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  criticalAlerts: number;
  alertsByType: Record<string, number>;
  alertsByVehicle: Record<string, number>;
  averageResolutionTime: number; // hours
  escalatedAlerts: number;
  lastProcessingTime: Date;
}

export class AlertManager {
  private static instance: AlertManager;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, MaintenanceAlert | ComplianceAlert> = new Map();
  private alertHistory: Map<string, (MaintenanceAlert | ComplianceAlert)[]> = new Map();
  private notificationQueue: AlertNotification[] = [];
  private metrics: AlertMetrics;
  private processingInterval: NodeJS.Timeout | null = null;

  // Philippines-specific alert configurations
  private philippinesAlertConfig = {
    ltfrbCompliance: {
      franchiseExpiryWarning: 60, // days
      franchiseExpiryUrgent: 30,
      franchiseExpiryCritical: 7,
      inspectionDueWarning: 30,
      inspectionDueUrgent: 14,
      inspectionOverdue: 1
    },
    maintenance: {
      oilChangeInterval: 5000, // km
      tireRotationInterval: 10000,
      generalInspectionInterval: 90, // days
      airFilterInterval: 15000, // km
      sparkPlugInterval: 20000
    },
    safety: {
      maxEngineTemp: 105, // °C
      minOilPressure: 200, // kPa
      minBatteryVoltage: 11.5, // V
      maxSpeed: 100, // km/h for urban areas
      maxSpeedHighway: 120 // km/h for highways
    }
  };

  private constructor() {
    this.initializeMetrics();
    this.initializeDefaultRules();
    this.startAlertProcessing();
  }

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  // Alert Rule Management
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertRule> {
    const alertRule: AlertRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.alertRules.set(alertRule.id, alertRule);

    await auditLogger.logEvent(
      AuditEventType.SYSTEM_EVENT,
      SecurityLevel.LOW,
      'SUCCESS',
      {
        action: 'alert_rule_created',
        ruleId: alertRule.id,
        name: alertRule.name,
        type: alertRule.type,
        priority: alertRule.priority
      },
      {
        userId: 'system',
        resource: 'alert_rule',
        action: 'create',
        ipAddress: 'internal'
      }
    );

    return alertRule;
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<boolean> {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    Object.assign(rule, updates, { updatedAt: new Date() });
    this.alertRules.set(ruleId, rule);

    await auditLogger.logEvent(
      AuditEventType.SYSTEM_EVENT,
      SecurityLevel.LOW,
      'SUCCESS',
      {
        action: 'alert_rule_updated',
        ruleId,
        updates: Object.keys(updates)
      },
      {
        userId: 'system',
        resource: 'alert_rule',
        action: 'update',
        ipAddress: 'internal'
      }
    );

    return true;
  }

  async deleteAlertRule(ruleId: string): Promise<boolean> {
    const deleted = this.alertRules.delete(ruleId);
    
    if (deleted) {
      await auditLogger.logEvent(
        AuditEventType.SYSTEM_EVENT,
        SecurityLevel.LOW,
        'SUCCESS',
        {
          action: 'alert_rule_deleted',
          ruleId
        },
        {
          userId: 'system',
          resource: 'alert_rule',
          action: 'delete',
          ipAddress: 'internal'
        }
      );
    }

    return deleted;
  }

  // Alert Processing from Various Sources
  async processAnomalyAlert(anomaly: AnomalyDetectionResult): Promise<string[]> {
    const alertIds: string[] = [];

    // Create maintenance alert for anomaly
    const maintenanceAlert = await this.createMaintenanceAlert({
      vehicleId: anomaly.vehicleId,
      alertType: `anomaly_${anomaly.anomalyType}`,
      alertSource: 'obd',
      triggerCondition: anomaly.description,
      triggerValue: anomaly.detectedValue.toString(),
      currentValue: anomaly.detectedValue.toString(),
      thresholdValue: `${anomaly.expectedRange[0]}-${anomaly.expectedRange[1]}`,
      alertTitle: `${anomaly.anomalyType.replace('_', ' ').toUpperCase()} Detected`,
      alertDescription: anomaly.description,
      recommendedAction: anomaly.recommendations.join('; '),
      urgencyLevel: this.mapSeverityToPriority(anomaly.severity),
      notifyDriver: true,
      notifyOwner: anomaly.affectsSafety,
      notifyOpsTeam: anomaly.requiresImmediateAction
    });

    alertIds.push(maintenanceAlert.id);

    // Create additional safety alert if necessary
    if (anomaly.affectsSafety && anomaly.requiresImmediateAction) {
      const safetyAlert = await this.createMaintenanceAlert({
        vehicleId: anomaly.vehicleId,
        alertType: 'safety_critical',
        alertSource: 'system',
        triggerCondition: 'Safety critical anomaly detected',
        alertTitle: 'SAFETY ALERT: Immediate Action Required',
        alertDescription: `Critical safety issue detected: ${anomaly.description}. Vehicle should be stopped immediately.`,
        recommendedAction: 'Stop vehicle safely and contact maintenance team immediately',
        urgencyLevel: 'critical',
        notifyDriver: true,
        notifyOwner: true,
        notifyOpsTeam: true
      });

      alertIds.push(safetyAlert.id);
    }

    return alertIds;
  }

  async processPredictiveMaintenanceAlert(prediction: PredictiveMaintenanceAlert): Promise<string> {
    const alert = await this.createMaintenanceAlert({
      vehicleId: prediction.vehicleId,
      alertType: 'predictive_maintenance',
      alertSource: 'system',
      triggerCondition: `Predicted failure of ${prediction.componentType}`,
      triggerValue: prediction.currentCondition.toString(),
      currentValue: `${prediction.currentCondition}% condition`,
      thresholdValue: 'maintenance_recommended',
      alertTitle: `Predictive Maintenance: ${prediction.componentType.replace('_', ' ').toUpperCase()}`,
      alertDescription: `Component predicted to fail in ${prediction.daysUntilFailure} days. Current condition: ${prediction.currentCondition}%`,
      recommendedAction: prediction.recommendedActions.join('; '),
      urgencyLevel: this.mapRiskToPriority(prediction.riskLevel),
      notifyDriver: true,
      notifyOwner: true,
      notifyOpsTeam: prediction.riskLevel === 'critical'
    });

    return alert.id;
  }

  async processTelemetryAlert(data: VehicleTelemetryData): Promise<string[]> {
    const alertIds: string[] = [];

    // Check telemetry data against alert rules
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      const shouldAlert = await this.evaluateRule(rule, data);
      if (shouldAlert) {
        const alert = await this.executeRuleActions(rule, data);
        if (alert) alertIds.push(alert);
      }
    }

    return alertIds;
  }

  async processDiagnosticAlert(event: VehicleDiagnosticEvent): Promise<string> {
    const alert = await this.createMaintenanceAlert({
      vehicleId: event.vehicleId,
      alertType: 'diagnostic_code',
      alertSource: 'obd',
      triggerCondition: `Diagnostic trouble code: ${event.eventCode}`,
      triggerValue: event.eventCode,
      alertTitle: `Diagnostic Code: ${event.eventCode}`,
      alertDescription: event.eventDescription,
      recommendedAction: event.recommendedAction || 'Have vehicle diagnosed by qualified technician',
      urgencyLevel: this.mapSeverityToPriority(event.severity),
      notifyDriver: true,
      notifyOwner: event.affectsSafety,
      notifyOpsTeam: event.affectsSafety
    });

    return alert.id;
  }

  // Philippines-specific Compliance Alerts
  async checkLTFRBComplianceAlerts(vehicleId: string): Promise<string[]> {
    const alertIds: string[] = [];
    
    // In a real implementation, this would query the database for compliance data
    // For now, we'll create sample compliance checks

    // Franchise expiry check
    const franchiseAlert = await this.checkFranchiseExpiry(vehicleId);
    if (franchiseAlert) alertIds.push(franchiseAlert);

    // Vehicle inspection due check
    const inspectionAlert = await this.checkInspectionDue(vehicleId);
    if (inspectionAlert) alertIds.push(inspectionAlert);

    // Insurance expiry check
    const insuranceAlert = await this.checkInsuranceExpiry(vehicleId);
    if (insuranceAlert) alertIds.push(insuranceAlert);

    return alertIds;
  }

  private async checkFranchiseExpiry(vehicleId: string): Promise<string | null> {
    // Mock franchise expiry check
    const expiryDate = new Date('2025-06-15'); // Sample expiry date
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const config = this.philippinesAlertConfig.ltfrbCompliance;

    let priority: MaintenancePriority = 'routine';
    let alertType = 'franchise_expiry_reminder';

    if (daysUntilExpiry <= config.franchiseExpiryCritical) {
      priority = 'critical';
      alertType = 'franchise_expiry_critical';
    } else if (daysUntilExpiry <= config.franchiseExpiryUrgent) {
      priority = 'urgent';
      alertType = 'franchise_expiry_urgent';
    } else if (daysUntilExpiry <= config.franchiseExpiryWarning) {
      priority = 'minor';
    } else {
      return null; // No alert needed
    }

    const alert = await this.createComplianceAlert({
      vehicleId,
      complianceId: `ltfrb_franchise_${vehicleId}`,
      alertType,
      alertCategory: 'franchise',
      alertPriority: priority,
      alertTitle: 'LTFRB Franchise Renewal Required',
      alertMessage: `Your LTFRB franchise expires in ${daysUntilExpiry} days. Please begin renewal process.`,
      recommendedAction: 'Contact LTFRB office to initiate franchise renewal process',
      consequencesIfIgnored: 'Vehicle will not be authorized to operate commercially',
      daysUntilDue: daysUntilExpiry,
      notifyDriver: true,
      notifyVehicleOwner: true,
      notifyComplianceTeam: priority === 'critical'
    });

    return alert.id;
  }

  private async checkInspectionDue(vehicleId: string): Promise<string | null> {
    // Mock inspection due check
    const inspectionDate = new Date('2025-04-30'); // Sample inspection due date
    const today = new Date();
    const daysUntilDue = Math.floor((inspectionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const config = this.philippinesAlertConfig.ltfrbCompliance;

    let priority: MaintenancePriority = 'routine';
    let alertType = 'inspection_due_reminder';

    if (daysUntilDue < 0) {
      priority = 'critical';
      alertType = 'inspection_overdue';
    } else if (daysUntilDue <= config.inspectionDueUrgent) {
      priority = 'urgent';
      alertType = 'inspection_due_urgent';
    } else if (daysUntilDue <= config.inspectionDueWarning) {
      priority = 'minor';
    } else {
      return null;
    }

    const alert = await this.createComplianceAlert({
      vehicleId,
      complianceId: `lto_inspection_${vehicleId}`,
      alertType,
      alertCategory: 'inspection',
      alertPriority: priority,
      alertTitle: 'Vehicle Inspection Required',
      alertMessage: daysUntilDue < 0 
        ? `Vehicle inspection is ${Math.abs(daysUntilDue)} days overdue`
        : `Vehicle inspection due in ${daysUntilDue} days`,
      recommendedAction: 'Schedule vehicle inspection at authorized LTO center',
      consequencesIfIgnored: 'Vehicle registration may be suspended',
      daysUntilDue: Math.max(0, daysUntilDue),
      notifyDriver: true,
      notifyVehicleOwner: true,
      notifyComplianceTeam: priority === 'critical'
    });

    return alert.id;
  }

  private async checkInsuranceExpiry(vehicleId: string): Promise<string | null> {
    // Mock insurance expiry check
    const expiryDate = new Date('2025-03-20'); // Sample expiry date
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry > 30) return null; // No alert needed yet

    let priority: MaintenancePriority = daysUntilExpiry <= 7 ? 'critical' : 'urgent';

    const alert = await this.createComplianceAlert({
      vehicleId,
      complianceId: `insurance_${vehicleId}`,
      alertType: 'insurance_expiry',
      alertCategory: 'insurance',
      alertPriority: priority,
      alertTitle: 'Insurance Renewal Required',
      alertMessage: `Vehicle insurance expires in ${daysUntilExpiry} days`,
      recommendedAction: 'Contact insurance provider to renew policy',
      consequencesIfIgnored: 'Vehicle cannot legally operate without insurance',
      daysUntilDue: daysUntilExpiry,
      notifyDriver: true,
      notifyVehicleOwner: true,
      notifyComplianceTeam: false
    });

    return alert.id;
  }

  // Alert Creation Methods
  private async createMaintenanceAlert(alertData: Partial<MaintenanceAlert>): Promise<MaintenanceAlert> {
    const alert: MaintenanceAlert = {
      id: `maint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vehicleId: alertData.vehicleId!,
      alertType: alertData.alertType!,
      alertSource: alertData.alertSource || 'system',
      triggerCondition: alertData.triggerCondition!,
      triggerValue: alertData.triggerValue,
      currentValue: alertData.currentValue,
      thresholdValue: alertData.thresholdValue,
      alertTitle: alertData.alertTitle!,
      alertDescription: alertData.alertDescription!,
      recommendedAction: alertData.recommendedAction,
      urgencyLevel: alertData.urgencyLevel!,
      notifyDriver: alertData.notifyDriver || false,
      notifyOwner: alertData.notifyOwner || false,
      notifyOpsTeam: alertData.notifyOpsTeam || false,
      notificationChannels: ['app', 'sms'],
      status: 'active',
      createdAt: new Date(),
      escalationLevel: 0
    };

    this.activeAlerts.set(alert.id, alert);
    this.updateMetrics('maintenance', 'created');

    // Queue notifications
    await this.queueNotifications(alert);

    // Log alert creation
    await auditLogger.logEvent(
      AuditEventType.SYSTEM_ALERT,
      alert.urgencyLevel === 'critical' ? SecurityLevel.HIGH : SecurityLevel.MEDIUM,
      'WARNING',
      {
        action: 'maintenance_alert_created',
        vehicleId: alert.vehicleId,
        alertType: alert.alertType,
        urgencyLevel: alert.urgencyLevel
      },
      {
        userId: 'system',
        resource: 'maintenance_alert',
        action: 'create',
        ipAddress: 'internal'
      }
    );

    return alert;
  }

  private async createComplianceAlert(alertData: Partial<ComplianceAlert>): Promise<ComplianceAlert> {
    const alert: ComplianceAlert = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vehicleId: alertData.vehicleId!,
      complianceId: alertData.complianceId!,
      alertType: alertData.alertType!,
      alertCategory: alertData.alertCategory!,
      alertPriority: alertData.alertPriority!,
      alertTitle: alertData.alertTitle!,
      alertMessage: alertData.alertMessage!,
      recommendedAction: alertData.recommendedAction,
      consequencesIfIgnored: alertData.consequencesIfIgnored,
      daysUntilDue: alertData.daysUntilDue,
      alertLevel: 1,
      escalationSchedule: [],
      notifyDriver: alertData.notifyDriver || false,
      notifyVehicleOwner: alertData.notifyVehicleOwner || false,
      notifyFleetManager: alertData.notifyFleetManager || false,
      notifyComplianceTeam: alertData.notifyComplianceTeam || false,
      status: 'active',
      createdAt: new Date(),
      sendCount: 0
    };

    this.activeAlerts.set(alert.id, alert);
    this.updateMetrics('compliance', 'created');

    // Queue notifications
    await this.queueNotifications(alert);

    // Log alert creation
    await auditLogger.logEvent(
      AuditEventType.SYSTEM_ALERT,
      alert.alertPriority === 'critical' ? SecurityLevel.HIGH : SecurityLevel.MEDIUM,
      'WARNING',
      {
        action: 'compliance_alert_created',
        vehicleId: alert.vehicleId,
        alertType: alert.alertType,
        alertCategory: alert.alertCategory,
        priority: alert.alertPriority
      },
      {
        userId: 'system',
        resource: 'compliance_alert',
        action: 'create',
        ipAddress: 'internal'
      }
    );

    return alert;
  }

  // Notification Management
  private async queueNotifications(alert: MaintenanceAlert | ComplianceAlert): Promise<void> {
    const notifications: AlertNotification[] = [];

    // Determine recipients based on alert type and settings
    if ('notifyDriver' in alert && alert.notifyDriver) {
      notifications.push(this.createNotification(alert, 'driver'));
    }

    if ('notifyOwner' in alert && alert.notifyOwner) {
      notifications.push(this.createNotification(alert, 'owner'));
    }

    if ('notifyOpsTeam' in alert && alert.notifyOpsTeam) {
      notifications.push(this.createNotification(alert, 'operator'));
    }

    if ('notifyComplianceTeam' in alert && alert.notifyComplianceTeam) {
      notifications.push(this.createNotification(alert, 'compliance_team'));
    }

    // Add to notification queue
    this.notificationQueue.push(...notifications);
  }

  private createNotification(
    alert: MaintenanceAlert | ComplianceAlert, 
    recipientType: 'driver' | 'owner' | 'operator' | 'compliance_team'
  ): AlertNotification {
    const priority = 'urgencyLevel' in alert ? alert.urgencyLevel : alert.alertPriority;
    const title = 'alertTitle' in alert ? alert.alertTitle : alert.alertTitle;
    const message = 'alertDescription' in alert ? alert.alertDescription : alert.alertMessage;

    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alertId: alert.id,
      vehicleId: alert.vehicleId,
      recipientType,
      recipientId: this.getRecipientId(alert.vehicleId, recipientType),
      channel: this.selectOptimalChannel(recipientType, priority),
      title,
      message,
      priority,
      status: 'pending',
      createdAt: new Date()
    };
  }

  // Rule Evaluation and Execution
  private async evaluateRule(rule: AlertRule, data: VehicleTelemetryData): Promise<boolean> {
    for (const condition of rule.conditions) {
      const fieldValue = (data as any)[condition.field];
      
      if (!this.evaluateCondition(condition, fieldValue)) {
        return false; // All conditions must be met
      }
    }
    return true;
  }

  private evaluateCondition(condition: AlertCondition, value: any): boolean {
    if (value === undefined || value === null) {
      return condition.operator === 'exists' ? false : true;
    }

    switch (condition.operator) {
      case 'gt':
        return value > condition.value;
      case 'lt':
        return value < condition.value;
      case 'eq':
        return value === condition.value;
      case 'gte':
        return value >= condition.value;
      case 'lte':
        return value <= condition.value;
      case 'between':
        return Array.isArray(condition.value) && 
               value >= condition.value[0] && 
               value <= condition.value[1];
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value);
      case 'exists':
        return true;
      default:
        return false;
    }
  }

  private async executeRuleActions(rule: AlertRule, data: VehicleTelemetryData): Promise<string | null> {
    let alertId: string | null = null;

    for (const action of rule.actions) {
      switch (action.type) {
        case 'create_maintenance':
          // Create maintenance alert based on rule
          const alert = await this.createMaintenanceAlert({
            vehicleId: data.vehicleId,
            alertType: rule.name.toLowerCase().replace(/\s+/g, '_'),
            alertSource: 'system',
            triggerCondition: rule.description,
            alertTitle: rule.name,
            alertDescription: rule.description,
            urgencyLevel: rule.priority,
            notifyDriver: true,
            notifyOwner: rule.priority === 'critical',
            notifyOpsTeam: rule.priority === 'critical'
          });
          alertId = alert.id;
          break;

        case 'log_event':
          await auditLogger.logEvent(
            AuditEventType.SYSTEM_EVENT,
            SecurityLevel.LOW,
            'INFO',
            {
              action: 'rule_triggered',
              ruleId: rule.id,
              ruleName: rule.name,
              vehicleId: data.vehicleId
            },
            {
              userId: 'system',
              resource: 'alert_rule',
              action: 'trigger',
              ipAddress: 'internal'
            }
          );
          break;
      }
    }

    return alertId;
  }

  // Alert Management
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    await auditLogger.logEvent(
      AuditEventType.SYSTEM_EVENT,
      SecurityLevel.LOW,
      'SUCCESS',
      {
        action: 'alert_acknowledged',
        alertId,
        acknowledgedBy
      },
      {
        userId: acknowledgedBy,
        resource: 'alert',
        action: 'acknowledge',
        ipAddress: 'internal'
      }
    );

    return true;
  }

  async resolveAlert(alertId: string, resolvedBy: string, resolutionNotes?: string): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    if ('resolutionNotes' in alert) {
      alert.resolutionNotes = resolutionNotes;
    }

    // Move to history
    const vehicleHistory = this.alertHistory.get(alert.vehicleId) || [];
    vehicleHistory.push(alert);
    this.alertHistory.set(alert.vehicleId, vehicleHistory);

    // Remove from active alerts
    this.activeAlerts.delete(alertId);
    this.updateMetrics(alert.id.startsWith('maint_') ? 'maintenance' : 'compliance', 'resolved');

    await auditLogger.logEvent(
      AuditEventType.SYSTEM_EVENT,
      SecurityLevel.LOW,
      'SUCCESS',
      {
        action: 'alert_resolved',
        alertId,
        resolvedBy,
        resolutionNotes
      },
      {
        userId: resolvedBy,
        resource: 'alert',
        action: 'resolve',
        ipAddress: 'internal'
      }
    );

    return true;
  }

  // Helper Methods
  private mapSeverityToPriority(severity: 'info' | 'warning' | 'error' | 'critical' | 'low' | 'medium' | 'high'): MaintenancePriority {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'critical';
      case 'error':
        return 'urgent';
      case 'warning':
      case 'medium':
        return 'major';
      case 'info':
      case 'low':
      default:
        return 'minor';
    }
  }

  private mapRiskToPriority(risk: 'low' | 'medium' | 'high' | 'critical'): MaintenancePriority {
    switch (risk) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'urgent';
      case 'medium':
        return 'major';
      case 'low':
      default:
        return 'minor';
    }
  }

  private getRecipientId(vehicleId: string, recipientType: string): string {
    // In a real implementation, this would query the database for the appropriate recipient
    return `${recipientType}_${vehicleId}`;
  }

  private selectOptimalChannel(recipientType: string, priority: MaintenancePriority): 'app' | 'sms' | 'email' | 'push' {
    if (priority === 'critical') return 'sms';
    if (priority === 'urgent') return 'push';
    return 'app';
  }

  private updateMetrics(type: string, action: string): void {
    this.metrics.totalAlerts++;
    
    if (action === 'created') {
      this.metrics.activeAlerts++;
      this.metrics.alertsByType[type] = (this.metrics.alertsByType[type] || 0) + 1;
    } else if (action === 'resolved') {
      this.metrics.activeAlerts--;
      this.metrics.resolvedAlerts++;
    }

    this.metrics.lastProcessingTime = new Date();
  }

  private initializeMetrics(): void {
    this.metrics = {
      totalAlerts: 0,
      activeAlerts: 0,
      resolvedAlerts: 0,
      criticalAlerts: 0,
      alertsByType: {},
      alertsByVehicle: {},
      averageResolutionTime: 0,
      escalatedAlerts: 0,
      lastProcessingTime: new Date()
    };
  }

  private initializeDefaultRules(): void {
    // Initialize default alert rules for Philippines operations
    const defaultRules: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Engine Overheating',
        description: 'Alert when engine temperature exceeds safe limits',
        type: 'safety',
        priority: 'critical',
        conditions: [{
          field: 'engineTemperatureCelsius',
          operator: 'gt',
          value: this.philippinesAlertConfig.safety.maxEngineTemp
        }],
        actions: [
          { type: 'create_maintenance' },
          { type: 'notify_driver' },
          { type: 'notify_ops' }
        ],
        enabled: true
      },
      {
        name: 'Low Oil Pressure',
        description: 'Alert when oil pressure drops below safe levels',
        type: 'maintenance',
        priority: 'urgent',
        conditions: [{
          field: 'oilPressureKpa',
          operator: 'lt',
          value: this.philippinesAlertConfig.safety.minOilPressure
        }],
        actions: [
          { type: 'create_maintenance' },
          { type: 'notify_driver' }
        ],
        enabled: true
      },
      {
        name: 'Low Battery Voltage',
        description: 'Alert when battery voltage is critically low',
        type: 'maintenance',
        priority: 'major',
        conditions: [{
          field: 'batteryVoltage',
          operator: 'lt',
          value: this.philippinesAlertConfig.safety.minBatteryVoltage
        }],
        actions: [
          { type: 'create_maintenance' },
          { type: 'notify_driver' }
        ],
        enabled: true
      }
    ];

    for (const ruleData of defaultRules) {
      this.createAlertRule(ruleData);
    }
  }

  private startAlertProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processNotificationQueue();
      this.checkAlertEscalations();
    }, 30000); // Process every 30 seconds

    console.log('Alert management system started');
  }

  private async processNotificationQueue(): Promise<void> {
    const batchSize = 10;
    const batch = this.notificationQueue.splice(0, batchSize);

    for (const notification of batch) {
      try {
        // Simulate sending notification
        await this.sendNotification(notification);
        notification.status = 'sent';
        notification.sentAt = new Date();
      } catch (error) {
        notification.status = 'failed';
        console.error(`Failed to send notification ${notification.id}:`, error);
      }
    }
  }

  private async sendNotification(notification: AlertNotification): Promise<void> {
    // In a real implementation, this would send notifications via various channels
    console.log(`Sending ${notification.channel} notification to ${notification.recipientType}: ${notification.title}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private checkAlertEscalations(): void {
    const now = new Date();
    
    for (const alert of this.activeAlerts.values()) {
      if (alert.status !== 'active') continue;

      // Check if alert needs escalation (e.g., after 2 hours without acknowledgment)
      const hoursActive = (now.getTime() - alert.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursActive > 2 && alert.escalationLevel === 0) {
        this.escalateAlert(alert);
      }
    }
  }

  private async escalateAlert(alert: MaintenanceAlert | ComplianceAlert): Promise<void> {
    alert.escalationLevel = (alert.escalationLevel || 0) + 1;
    alert.lastEscalationAt = new Date();
    
    this.metrics.escalatedAlerts++;

    await auditLogger.logEvent(
      AuditEventType.SYSTEM_ALERT,
      SecurityLevel.MEDIUM,
      'WARNING',
      {
        action: 'alert_escalated',
        alertId: alert.id,
        vehicleId: alert.vehicleId,
        escalationLevel: alert.escalationLevel
      },
      {
        userId: 'system',
        resource: 'alert',
        action: 'escalate',
        ipAddress: 'internal'
      }
    );
  }

  // Public Getters
  public getActiveAlerts(): (MaintenanceAlert | ComplianceAlert)[] {
    return Array.from(this.activeAlerts.values());
  }

  public getActiveAlertsByVehicle(vehicleId: string): (MaintenanceAlert | ComplianceAlert)[] {
    return Array.from(this.activeAlerts.values()).filter(alert => alert.vehicleId === vehicleId);
  }

  public getAlertHistory(vehicleId: string): (MaintenanceAlert | ComplianceAlert)[] {
    return this.alertHistory.get(vehicleId) || [];
  }

  public getAlertMetrics(): AlertMetrics {
    return { ...this.metrics };
  }

  public getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }
}

export default AlertManager;