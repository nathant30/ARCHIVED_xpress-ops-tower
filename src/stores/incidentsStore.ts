/**
 * Incidents Zustand Store
 * State management for incident tracking, evidence, and closure workflows
 * Based on INCIDENT-RACI-MATRIX.md governance
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Incident Types from governance
export type IncidentType =
  | 'safety'
  | 'driver'
  | 'vehicle'
  | 'financial'
  | 'system';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export type IncidentStatus =
  | 'open'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'closed';

// SLA Timers (in minutes)
export const SLA_TIMERS = {
  critical: {
    response: 5,
    sceneSecured: 20,
    investigationStarted: 120,
    closure: 10080, // 7 days
  },
  high: {
    response: 15,
    sceneSecured: 60,
    investigationStarted: 240,
    closure: 20160, // 14 days
  },
  medium: {
    response: 60,
    investigationStarted: 1440,
    closure: 43200, // 30 days
  },
  low: {
    response: 240,
    investigationStarted: 4320,
    closure: 86400, // 60 days
  },
};

export interface Evidence {
  id: string;
  type: 'photo' | 'document' | 'video';
  filename: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
  metadata?: Record<string, unknown>;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  description: string;
  createdAt: string;
  createdBy: string;
  assignedTo?: string;

  // Related entities
  driverId?: string;
  vehicleId?: string;
  bookingId?: string;
  customerId?: string;

  // Location
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };

  // Evidence
  evidence: Evidence[];

  // Timeline
  timeline: TimelineEvent[];

  // Closure
  closeChecklist?: ChecklistItem[];
  closureReason?: string;
  closureNotes?: string;
  closedAt?: string;
  closedBy?: string;

  // Approvals
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: string;

  // SLA tracking
  slaResponse?: string;
  slaResolution?: string;
  slaBreached: boolean;
}

interface IncidentsState {
  // Incidents
  incidents: Incident[];
  selectedIncident: Incident | null;

  // Filters
  statusFilter: IncidentStatus | 'all';
  severityFilter: IncidentSeverity | 'all';
  typeFilter: IncidentType | 'all';
  searchTerm: string;

  // Actions - Incidents
  setIncidents: (incidents: Incident[]) => void;
  addIncident: (incident: Incident) => void;
  selectIncident: (incident: Incident | null) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;

  // Actions - Evidence
  addEvidence: (incidentId: string, evidence: Evidence) => void;
  removeEvidence: (incidentId: string, evidenceId: string) => void;

  // Actions - Timeline
  addTimelineEvent: (incidentId: string, event: TimelineEvent) => void;

  // Actions - Closure
  setCloseChecklist: (incidentId: string, checklist: ChecklistItem[]) => void;
  toggleChecklistItem: (incidentId: string, itemId: string) => void;
  closeIncident: (incidentId: string, closureData: {
    reason: string;
    notes: string;
    closedBy: string;
  }) => void;

  // Actions - Filters
  setStatusFilter: (status: IncidentStatus | 'all') => void;
  setSeverityFilter: (severity: IncidentSeverity | 'all') => void;
  setTypeFilter: (type: IncidentType | 'all') => void;
  setSearchTerm: (term: string) => void;
  clearFilters: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  incidents: [],
  selectedIncident: null,
  statusFilter: 'all' as const,
  severityFilter: 'all' as const,
  typeFilter: 'all' as const,
  searchTerm: '',
};

export const useIncidentsStore = create<IncidentsState>()(
  devtools(
    (set) => ({
      ...initialState,

      setIncidents: (incidents) => set({ incidents }, false, 'setIncidents'),

      addIncident: (incident) => set((state) => ({
        incidents: [incident, ...state.incidents],
      }), false, 'addIncident'),

      selectIncident: (incident) => set({ selectedIncident: incident }, false, 'selectIncident'),

      updateIncident: (id, updates) => set((state) => ({
        incidents: state.incidents.map(inc =>
          inc.id === id ? { ...inc, ...updates } : inc
        ),
        selectedIncident: state.selectedIncident?.id === id
          ? { ...state.selectedIncident, ...updates }
          : state.selectedIncident,
      }), false, 'updateIncident'),

      addEvidence: (incidentId, evidence) => set((state) => ({
        incidents: state.incidents.map(inc =>
          inc.id === incidentId
            ? { ...inc, evidence: [...inc.evidence, evidence] }
            : inc
        ),
        selectedIncident: state.selectedIncident?.id === incidentId
          ? { ...state.selectedIncident, evidence: [...state.selectedIncident.evidence, evidence] }
          : state.selectedIncident,
      }), false, 'addEvidence'),

      removeEvidence: (incidentId, evidenceId) => set((state) => ({
        incidents: state.incidents.map(inc =>
          inc.id === incidentId
            ? { ...inc, evidence: inc.evidence.filter(e => e.id !== evidenceId) }
            : inc
        ),
        selectedIncident: state.selectedIncident?.id === incidentId
          ? { ...state.selectedIncident, evidence: state.selectedIncident.evidence.filter(e => e.id !== evidenceId) }
          : state.selectedIncident,
      }), false, 'removeEvidence'),

      addTimelineEvent: (incidentId, event) => set((state) => ({
        incidents: state.incidents.map(inc =>
          inc.id === incidentId
            ? { ...inc, timeline: [event, ...inc.timeline] }
            : inc
        ),
        selectedIncident: state.selectedIncident?.id === incidentId
          ? { ...state.selectedIncident, timeline: [event, ...state.selectedIncident.timeline] }
          : state.selectedIncident,
      }), false, 'addTimelineEvent'),

      setCloseChecklist: (incidentId, checklist) => set((state) => ({
        incidents: state.incidents.map(inc =>
          inc.id === incidentId ? { ...inc, closeChecklist: checklist } : inc
        ),
        selectedIncident: state.selectedIncident?.id === incidentId
          ? { ...state.selectedIncident, closeChecklist: checklist }
          : state.selectedIncident,
      }), false, 'setCloseChecklist'),

      toggleChecklistItem: (incidentId, itemId) => set((state) => ({
        incidents: state.incidents.map(inc =>
          inc.id === incidentId
            ? {
                ...inc,
                closeChecklist: inc.closeChecklist?.map(item =>
                  item.id === itemId
                    ? {
                        ...item,
                        completed: !item.completed,
                        completedAt: !item.completed ? new Date().toISOString() : undefined,
                      }
                    : item
                ),
              }
            : inc
        ),
        selectedIncident: state.selectedIncident?.id === incidentId && state.selectedIncident.closeChecklist
          ? {
              ...state.selectedIncident,
              closeChecklist: state.selectedIncident.closeChecklist.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      completed: !item.completed,
                      completedAt: !item.completed ? new Date().toISOString() : undefined,
                    }
                  : item
              ),
            }
          : state.selectedIncident,
      }), false, 'toggleChecklistItem'),

      closeIncident: (incidentId, closureData) => set((state) => ({
        incidents: state.incidents.map(inc =>
          inc.id === incidentId
            ? {
                ...inc,
                status: 'closed' as IncidentStatus,
                closureReason: closureData.reason,
                closureNotes: closureData.notes,
                closedAt: new Date().toISOString(),
                closedBy: closureData.closedBy,
              }
            : inc
        ),
        selectedIncident: state.selectedIncident?.id === incidentId
          ? {
              ...state.selectedIncident,
              status: 'closed' as IncidentStatus,
              closureReason: closureData.reason,
              closureNotes: closureData.notes,
              closedAt: new Date().toISOString(),
              closedBy: closureData.closedBy,
            }
          : state.selectedIncident,
      }), false, 'closeIncident'),

      setStatusFilter: (status) => set({ statusFilter: status }, false, 'setStatusFilter'),

      setSeverityFilter: (severity) => set({ severityFilter: severity }, false, 'setSeverityFilter'),

      setTypeFilter: (type) => set({ typeFilter: type }, false, 'setTypeFilter'),

      setSearchTerm: (term) => set({ searchTerm: term }, false, 'setSearchTerm'),

      clearFilters: () => set({
        statusFilter: 'all',
        severityFilter: 'all',
        typeFilter: 'all',
        searchTerm: '',
      }, false, 'clearFilters'),

      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'IncidentsStore' }
  )
);
