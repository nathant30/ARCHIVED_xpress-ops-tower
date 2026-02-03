'use client';

/**
 * Incidents List Page
 * Enhanced with SLA countdown timers, color coding, filters
 * Built by Agent 10 - Critical Frontend UI Developer
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  ChevronRight,
  User,
  Car,
  DollarSign,
  Wifi,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIncidentsStore, Incident, SLA_TIMERS } from '@/stores/incidentsStore';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useRouter } from 'next/navigation';

// Mock incidents data
const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-001',
    type: 'safety',
    severity: 'critical',
    status: 'in_progress',
    title: 'Driver SOS Alert - Emergency',
    description: 'Driver D-0234 activated SOS button. Location: Makati CBD',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    createdBy: 'System',
    assignedTo: 'Safety Officer',
    driverId: 'D-0234',
    location: {
      latitude: 14.5547,
      longitude: 121.0244,
      address: 'Ayala Avenue, Makati City',
    },
    evidence: [],
    timeline: [],
    requiresApproval: true,
    slaBreached: false,
  },
  {
    id: 'INC-2026-002',
    type: 'vehicle',
    severity: 'high',
    status: 'open',
    title: 'Vehicle Breakdown - Engine Failure',
    description: 'Vehicle V-098 reported engine failure with passenger on board',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    createdBy: 'Driver',
    assignedTo: 'Fleet Manager',
    vehicleId: 'V-098',
    driverId: 'D-0445',
    evidence: [],
    timeline: [],
    requiresApproval: true,
    slaBreached: false,
  },
  {
    id: 'INC-2026-003',
    type: 'driver',
    severity: 'medium',
    status: 'acknowledged',
    title: 'Driver Conduct Complaint',
    description: 'Customer complaint about driver behavior during ride',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdBy: 'Customer Support',
    assignedTo: 'Operations Manager',
    driverId: 'D-0789',
    bookingId: 'BKG-12345',
    customerId: 'CUST-5678',
    evidence: [],
    timeline: [],
    requiresApproval: true,
    slaBreached: false,
  },
  {
    id: 'INC-2026-004',
    type: 'financial',
    severity: 'high',
    status: 'in_progress',
    title: 'Payment Fraud Detection',
    description: 'Suspicious payment activity detected on multiple accounts',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    createdBy: 'System',
    assignedTo: 'Finance Manager',
    evidence: [],
    timeline: [],
    requiresApproval: true,
    slaBreached: false,
  },
  {
    id: 'INC-2026-005',
    type: 'system',
    severity: 'medium',
    status: 'resolved',
    title: 'GPS System Degraded Performance',
    description: 'GPS accuracy below threshold in District 3',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdBy: 'System',
    assignedTo: 'Engineering Lead',
    evidence: [],
    timeline: [],
    requiresApproval: false,
    slaBreached: false,
  },
  {
    id: 'INC-2026-006',
    type: 'safety',
    severity: 'low',
    status: 'closed',
    title: 'Minor Vehicle Damage Report',
    description: 'Small dent on vehicle parked at depot',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 'Depot Supervisor',
    assignedTo: 'Fleet Manager',
    vehicleId: 'V-234',
    evidence: [],
    timeline: [],
    closedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    closedBy: 'Fleet Manager',
    requiresApproval: false,
    slaBreached: false,
  },
];

const IncidentsListPage = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const {
    incidents,
    statusFilter,
    severityFilter,
    typeFilter,
    searchTerm,
    setIncidents,
    selectIncident,
    setStatusFilter,
    setSeverityFilter,
    setTypeFilter,
    setSearchTerm,
    clearFilters,
  } = useIncidentsStore();

  useEffect(() => {
    setIsClient(true);
    if (!isFeatureEnabled('incidents')) {
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (!isClient) return;
    setIncidents(MOCK_INCIDENTS);
  }, [isClient, setIncidents]);

  // Calculate SLA time remaining
  const getSLATimeRemaining = (incident: Incident): { minutes: number; label: string; color: string } => {
    const createdAt = new Date(incident.createdAt);
    const now = new Date();
    const elapsedMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 60000);

    const slaMinutes = incident.status === 'open'
      ? SLA_TIMERS[incident.severity].response
      : SLA_TIMERS[incident.severity].closure;

    const remaining = slaMinutes - elapsedMinutes;

    let color = 'text-green-600';
    if (remaining < 0) {
      color = 'text-red-600 font-bold';
    } else if (remaining < slaMinutes * 0.2) {
      color = 'text-red-600 font-semibold';
    } else if (remaining < slaMinutes * 0.5) {
      color = 'text-yellow-600 font-semibold';
    }

    const formatTime = (mins: number): string => {
      const absMins = Math.abs(mins);
      if (absMins < 60) return `${absMins}m`;
      const hours = Math.floor(absMins / 60);
      if (hours < 24) return `${hours}h`;
      const days = Math.floor(hours / 24);
      return `${days}d`;
    };

    return {
      minutes: remaining,
      label: remaining < 0 ? `OVERDUE ${formatTime(remaining)}` : formatTime(remaining),
      color,
    };
  };

  // Get incident icon
  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'safety': return Shield;
      case 'driver': return User;
      case 'vehicle': return Car;
      case 'financial': return DollarSign;
      case 'system': return Wifi;
      default: return AlertTriangle;
    }
  };

  // Filter incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || incident.severity === severityFilter;
      const matchesType = typeFilter === 'all' || incident.type === typeFilter;
      const matchesSearch = searchTerm === '' ||
        incident.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSeverity && matchesType && matchesSearch;
    });
  }, [incidents, statusFilter, severityFilter, typeFilter, searchTerm]);

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      open: incidents.filter(i => i.status === 'open').length,
      in_progress: incidents.filter(i => i.status === 'in_progress').length,
      resolved: incidents.filter(i => i.status === 'resolved').length,
      closed: incidents.filter(i => i.status === 'closed').length,
    };
  }, [incidents]);

  const handleIncidentClick = (incident: Incident) => {
    selectIncident(incident);
    router.push(`/incidents/${incident.id}`);
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-600" />
            Incidents Management
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage operational incidents • {incidents.length} total
          </p>
        </div>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg" onClick={() => setStatusFilter('open')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <h3 className="text-3xl font-bold text-red-600 mt-2">{statusCounts.open}</h3>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg" onClick={() => setStatusFilter('in_progress')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <h3 className="text-3xl font-bold text-yellow-600 mt-2">{statusCounts.in_progress}</h3>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg" onClick={() => setStatusFilter('resolved')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <h3 className="text-3xl font-bold text-blue-600 mt-2">{statusCounts.resolved}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg" onClick={() => setStatusFilter('closed')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <h3 className="text-3xl font-bold text-green-600 mt-2">{statusCounts.closed}</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ID, title, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-gray-600" />

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="safety">Safety</option>
                <option value="driver">Driver</option>
                <option value="vehicle">Vehicle</option>
                <option value="financial">Financial</option>
                <option value="system">System</option>
              </select>

              {(statusFilter !== 'all' || severityFilter !== 'all' || typeFilter !== 'all' || searchTerm !== '') && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Incidents ({filteredIncidents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No incidents found</h3>
                <p className="text-gray-600">Try adjusting your filters</p>
              </div>
            ) : (
              filteredIncidents.map((incident) => {
                const Icon = getIncidentIcon(incident.type);
                const sla = getSLATimeRemaining(incident);

                return (
                  <div
                    key={incident.id}
                    onClick={() => handleIncidentClick(incident)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Icon and Details */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          incident.severity === 'critical' ? 'bg-red-100' :
                          incident.severity === 'high' ? 'bg-orange-100' :
                          incident.severity === 'medium' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            incident.severity === 'critical' ? 'text-red-600' :
                            incident.severity === 'high' ? 'text-orange-600' :
                            incident.severity === 'medium' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono font-semibold text-gray-900">{incident.id}</span>
                            <Badge
                              variant={
                                incident.severity === 'critical' ? 'destructive' :
                                incident.severity === 'high' ? 'default' :
                                'secondary'
                              }
                            >
                              {incident.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">
                              {incident.type}
                            </Badge>
                            <Badge
                              variant={
                                incident.status === 'open' ? 'destructive' :
                                incident.status === 'closed' ? 'default' :
                                'secondary'
                              }
                            >
                              {incident.status.replace('_', ' ')}
                            </Badge>
                          </div>

                          <h3 className="font-semibold text-gray-900 mb-1">{incident.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{incident.description}</p>

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Created: {new Date(incident.createdAt).toLocaleString()}</span>
                            {incident.assignedTo && <span>Assigned: {incident.assignedTo}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: SLA Timer */}
                      <div className="flex flex-col items-end gap-2">
                        <div className={`text-right ${sla.color}`}>
                          <Clock className="h-4 w-4 inline mr-1" />
                          <span className="font-mono text-sm font-semibold">{sla.label}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentsListPage;
