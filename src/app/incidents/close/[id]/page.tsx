'use client';

/**
 * Incident Close Page
 * Dynamic checklist based on incident type from INCIDENT-RACI-MATRIX.md
 * Built by Agent 10 - Critical Frontend UI Developer
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileCheck,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIncidentsStore, ChecklistItem } from '@/stores/incidentsStore';
import { useRouter } from 'next/navigation';

// Checklists from INCIDENT-RACI-MATRIX.md
const INCIDENT_CHECKLISTS = {
  safety: {
    critical: [
      { id: 'saf-1', label: 'Emergency services dispatched (if injuries)', required: true },
      { id: 'saf-2', label: 'Police report filed (if required by jurisdiction)', required: true },
      { id: 'saf-3', label: 'All injured parties received medical evaluation', required: true },
      { id: 'saf-4', label: 'Vehicle inspected by mechanic (if drivable) or towed (if not)', required: true },
      { id: 'saf-5', label: 'Insurance notified within 24 hours', required: true },
      { id: 'saf-6', label: 'Driver drug/alcohol test completed (if company policy requires)', required: true },
      { id: 'saf-7', label: 'Witness statements collected and documented', required: true },
      { id: 'saf-8', label: 'Photos of scene, vehicle damage, and injuries (if visible) taken', required: true },
      { id: 'saf-9', label: 'Internal incident report completed in system', required: true },
      { id: 'saf-10', label: 'Safety Officer investigation complete with root cause analysis', required: true },
      { id: 'saf-11', label: 'Corrective actions identified and assigned', required: true },
      { id: 'saf-12', label: 'Legal review complete (if >$10K damage or serious injury)', required: false },
      { id: 'saf-13', label: 'Driver status determined (return to work, suspended, terminated)', required: true },
      { id: 'saf-14', label: 'Vehicle status determined (return to fleet, repair, total loss)', required: true },
      { id: 'saf-15', label: 'Final approval from Safety Officer (A)', required: true },
    ],
    high: [
      { id: 'saf-1', label: 'Emergency services dispatched (if injuries)', required: true },
      { id: 'saf-2', label: 'Police report filed (if required by jurisdiction)', required: true },
      { id: 'saf-3', label: 'All injured parties received medical evaluation', required: true },
      { id: 'saf-4', label: 'Vehicle inspected by mechanic (if drivable) or towed (if not)', required: true },
      { id: 'saf-5', label: 'Insurance notified within 24 hours', required: true },
      { id: 'saf-7', label: 'Witness statements collected and documented', required: true },
      { id: 'saf-8', label: 'Photos of scene, vehicle damage, and injuries (if visible) taken', required: true },
      { id: 'saf-9', label: 'Internal incident report completed in system', required: true },
      { id: 'saf-10', label: 'Safety Officer investigation complete with root cause analysis', required: true },
      { id: 'saf-13', label: 'Driver status determined (return to work, suspended, terminated)', required: true },
      { id: 'saf-14', label: 'Vehicle status determined (return to fleet, repair, total loss)', required: true },
      { id: 'saf-15', label: 'Final approval from Safety Officer (A)', required: true },
    ],
  },
  driver: [
    { id: 'drv-1', label: 'Incident reported in system with all details', required: true },
    { id: 'drv-2', label: 'Driver notified of complaint/investigation', required: true },
    { id: 'drv-3', label: 'Driver provided opportunity to respond (within 48 hours)', required: true },
    { id: 'drv-4', label: 'Evidence collected (GPS logs, dashcam, customer statements, driver statements)', required: true },
    { id: 'drv-5', label: 'Field Supervisor investigation complete with findings', required: true },
    { id: 'drv-6', label: 'HR consulted if discipline or termination recommended', required: false },
    { id: 'drv-7', label: 'Legal consulted if termination for cause or lawsuit risk', required: false },
    { id: 'drv-8', label: 'Operations Manager decision documented: [Continue | Suspend | Terminate]', required: true },
    { id: 'drv-9', label: 'Driver notified of decision in writing', required: true },
    { id: 'drv-10', label: 'If suspension: Return-to-work conditions defined and communicated', required: false },
    { id: 'drv-11', label: 'If termination: Final paycheck processed, access revoked, company property returned', required: false },
    { id: 'drv-12', label: 'Customer notified of resolution (if customer complaint)', required: false },
    { id: 'drv-13', label: 'Corrective actions identified to prevent recurrence', required: true },
    { id: 'drv-14', label: 'Final approval from Operations Manager (A)', required: true },
  ],
  vehicle: [
    { id: 'veh-1', label: 'Vehicle location and status documented', required: true },
    { id: 'veh-2', label: 'Driver safely reassigned or provided alternate vehicle', required: true },
    { id: 'veh-3', label: 'Photos of damage/issue taken from multiple angles', required: true },
    { id: 'veh-4', label: 'Cause of incident documented (driver error, mechanical failure, external)', required: true },
    { id: 'veh-5', label: 'Fleet Manager inspection complete with diagnosis', required: true },
    { id: 'veh-6', label: 'Repair estimate obtained (if repairable)', required: true },
    { id: 'veh-7', label: 'Approval for repair obtained (Fleet Manager if <$5K, Finance if >$5K)', required: true },
    { id: 'veh-8', label: 'Repairs completed by certified mechanic', required: true },
    { id: 'veh-9', label: 'Post-repair inspection passed (safety checklist)', required: true },
    { id: 'veh-10', label: 'Test drive completed successfully', required: true },
    { id: 'veh-11', label: 'Vehicle cleaning completed (if required)', required: false },
    { id: 'veh-12', label: 'Vehicle returned to AVAILABLE status in system', required: true },
    { id: 'veh-13', label: 'Driver notified vehicle is ready (if their assigned vehicle)', required: false },
    { id: 'veh-14', label: 'If total loss: Insurance claim filed, replacement vehicle sourced', required: false },
    { id: 'veh-15', label: 'Maintenance records updated in fleet management system', required: true },
    { id: 'veh-16', label: 'Final approval from Fleet Manager (A)', required: true },
  ],
  financial: [
    { id: 'fin-1', label: 'Incident scope identified (number of affected transactions, total $ amount)', required: true },
    { id: 'fin-2', label: 'All affected customers identified', required: true },
    { id: 'fin-3', label: 'All affected drivers identified', required: true },
    { id: 'fin-4', label: 'Root cause determined (system bug, human error, fraud, integration failure)', required: true },
    { id: 'fin-5', label: 'Financial impact calculated (company loss, customer overcharges, driver underpayments)', required: true },
    { id: 'fin-6', label: 'If system bug: Engineering ticket created and prioritized', required: false },
    { id: 'fin-7', label: 'If fraud: Evidence documented, law enforcement notified if >$10K', required: false },
    { id: 'fin-8', label: 'If human error: Process gap identified, training/controls updated', required: false },
    { id: 'fin-9', label: 'Correction plan approved by Finance Manager', required: true },
    { id: 'fin-10', label: 'Customer refunds/credits processed (if overcharged)', required: false },
    { id: 'fin-11', label: 'Driver make-up payments processed (if underpaid)', required: false },
    { id: 'fin-12', label: 'All affected parties notified of resolution', required: true },
    { id: 'fin-13', label: 'Accounting entries corrected in financial system', required: true },
    { id: 'fin-14', label: 'Month-end reconciliation confirms correction', required: true },
    { id: 'fin-15', label: 'Preventive controls implemented to prevent recurrence', required: true },
    { id: 'fin-16', label: 'If fraud: Driver/customer account suspended, recovery action initiated', required: false },
    { id: 'fin-17', label: 'Final approval from Finance Manager (A)', required: true },
  ],
  system: [
    { id: 'sys-1', label: 'Incident detected and alert triggered', required: true },
    { id: 'sys-2', label: 'Engineering on-call acknowledged within SLA', required: true },
    { id: 'sys-3', label: 'Severity level assigned based on impact', required: true },
    { id: 'sys-4', label: 'Incident channel created (Slack #incident-YYYY-MM-DD-NNN)', required: false },
    { id: 'sys-5', label: 'Initial assessment complete (affected systems, user impact, estimated duration)', required: true },
    { id: 'sys-6', label: 'Mitigation actions identified and prioritized', required: true },
    { id: 'sys-7', label: 'Status page updated (if customer-facing)', required: false },
    { id: 'sys-8', label: 'Manual workarounds communicated to Operations (if available)', required: false },
    { id: 'sys-9', label: 'Root cause identified', required: true },
    { id: 'sys-10', label: 'Fix implemented and tested in staging', required: true },
    { id: 'sys-11', label: 'Fix deployed to production', required: true },
    { id: 'sys-12', label: 'Monitoring confirms issue resolved (15-minute observation period)', required: true },
    { id: 'sys-13', label: 'Post-incident monitoring enabled (24-hour enhanced monitoring)', required: true },
    { id: 'sys-14', label: 'All affected systems returned to normal operation', required: true },
    { id: 'sys-15', label: 'Incident timeline documented', required: true },
    { id: 'sys-16', label: 'Customer communication sent (if external impact)', required: false },
    { id: 'sys-17', label: 'Post-mortem scheduled (within 3 business days)', required: true },
    { id: 'sys-18', label: 'Action items from post-mortem created and assigned', required: true },
    { id: 'sys-19', label: 'Final approval from Engineering Lead (A)', required: true },
  ],
};

const IncidentClosePage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [closureReason, setClosureReason] = useState('');
  const [closureNotes, setClosureNotes] = useState('');

  const {
    selectedIncident,
    setCloseChecklist,
    toggleChecklistItem,
    closeIncident,
  } = useIncidentsStore();

  const incident = selectedIncident;

  // Load checklist on mount
  useEffect(() => {
    setIsClient(true);

    if (incident && !incident.closeChecklist) {
      let checklist: ChecklistItem[] = [];

      if (incident.type === 'safety') {
        const severityChecklist = INCIDENT_CHECKLISTS.safety[incident.severity === 'critical' || incident.severity === 'high' ? incident.severity : 'high'];
        checklist = severityChecklist.map(item => ({
          ...item,
          completed: false,
        }));
      } else if (incident.type === 'driver') {
        checklist = INCIDENT_CHECKLISTS.driver.map(item => ({
          ...item,
          completed: false,
        }));
      } else if (incident.type === 'vehicle') {
        checklist = INCIDENT_CHECKLISTS.vehicle.map(item => ({
          ...item,
          completed: false,
        }));
      } else if (incident.type === 'financial') {
        checklist = INCIDENT_CHECKLISTS.financial.map(item => ({
          ...item,
          completed: false,
        }));
      } else if (incident.type === 'system') {
        checklist = INCIDENT_CHECKLISTS.system.map(item => ({
          ...item,
          completed: false,
        }));
      }

      setCloseChecklist(incident.id, checklist);
    }
  }, [incident, setCloseChecklist]);

  // Check if can close
  const canClose = () => {
    if (!incident?.closeChecklist) return false;

    const requiredItems = incident.closeChecklist.filter(item => item.required);
    const completedRequired = requiredItems.filter(item => item.completed);

    return completedRequired.length === requiredItems.length &&
           closureReason.trim() !== '' &&
           closureNotes.trim() !== '';
  };

  // Handle close
  const handleClose = () => {
    if (!incident || !canClose()) return;

    closeIncident(incident.id, {
      reason: closureReason,
      notes: closureNotes,
      closedBy: 'Current User',
    });

    router.push('/incidents');
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Incident Not Found</h2>
        <Button onClick={() => router.push('/incidents')}>
          Back to Incidents
        </Button>
      </div>
    );
  }

  if (incident.status === 'closed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Incident Already Closed</h2>
        <p className="text-gray-600 mb-4">This incident was closed on {new Date(incident.closedAt!).toLocaleString()}</p>
        <Button onClick={() => router.push(`/incidents/${incident.id}`)}>
          View Incident Details
        </Button>
      </div>
    );
  }

  const checklist = incident.closeChecklist || [];
  const requiredItems = checklist.filter(item => item.required);
  const optionalItems = checklist.filter(item => !item.required);
  const completedRequired = requiredItems.filter(item => item.completed).length;
  const progress = requiredItems.length > 0
    ? Math.round((completedRequired / requiredItems.length) * 100)
    : 0;

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Close Incident</h1>
              <Badge variant="outline">{incident.id}</Badge>
            </div>
            <p className="text-gray-600">{incident.title}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-600 mb-1">Completion Progress</p>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${progress === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900">{progress}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {completedRequired} of {requiredItems.length} required items
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Checklist */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Closure Checklist ({incident.type} - {incident.severity})
              </CardTitle>
              <p className="text-sm text-gray-600">
                Complete all required items before closing this incident
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Required Items */}
              {requiredItems.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-600" />
                    Required ({completedRequired}/{requiredItems.length})
                  </h3>
                  <div className="space-y-2">
                    {requiredItems.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          item.completed
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(incident.id, item.id)}
                          className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className={`text-sm ${item.completed ? 'text-gray-600 line-through' : 'text-gray-900 font-medium'}`}>
                            {item.label}
                          </span>
                          {item.completed && item.completedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Completed {new Date(item.completedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {item.completed && (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Items */}
              {optionalItems.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Optional ({optionalItems.filter(i => i.completed).length}/{optionalItems.length})
                  </h3>
                  <div className="space-y-2">
                    {optionalItems.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          item.completed
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(incident.id, item.id)}
                          className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className={`text-sm ${item.completed ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
                            {item.label}
                          </span>
                          {item.completed && item.completedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              Completed {new Date(item.completedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {item.completed && (
                          <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Closure Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Closure Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closure Reason <span className="text-red-600">*</span>
                </label>
                <select
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select reason...</option>
                  <option value="resolved">Issue Resolved</option>
                  <option value="duplicate">Duplicate Report</option>
                  <option value="false_alarm">False Alarm</option>
                  <option value="no_action_required">No Action Required</option>
                  <option value="transferred">Transferred to Another System</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Closure Notes <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={closureNotes}
                  onChange={(e) => setClosureNotes(e.target.value)}
                  placeholder="Provide detailed closure notes..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 20 characters ({closureNotes.length}/20)
                </p>
              </div>

              {/* Approval Required */}
              {incident.requiresApproval && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900">Approval Required</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        This incident requires final approval from {
                          incident.type === 'safety' ? 'Safety Officer' :
                          incident.type === 'driver' ? 'Operations Manager' :
                          incident.type === 'vehicle' ? 'Fleet Manager' :
                          incident.type === 'financial' ? 'Finance Manager' :
                          'Engineering Lead'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Messages */}
              {!canClose() && (
                <div className="space-y-2">
                  {completedRequired < requiredItems.length && (
                    <div className="flex items-start gap-2 text-sm text-red-600">
                      <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>Complete all required checklist items</span>
                    </div>
                  )}
                  {!closureReason && (
                    <div className="flex items-start gap-2 text-sm text-red-600">
                      <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>Select a closure reason</span>
                    </div>
                  )}
                  {closureNotes.length < 20 && (
                    <div className="flex items-start gap-2 text-sm text-red-600">
                      <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>Provide detailed closure notes (min 20 characters)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Close Button */}
              <Button
                onClick={handleClose}
                disabled={!canClose()}
                className="w-full"
                size="lg"
              >
                {canClose() ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Close Incident
                  </>
                ) : (
                  'Complete Requirements to Close'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IncidentClosePage;
