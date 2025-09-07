'use client';

/**
 * Executive Override Panel - Real-time pricing controls
 * Interactive component for C-suite pricing decisions
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { 
  Settings, 
  AlertTriangle, 
  Clock, 
  MapPin,
  Zap,
  Ban,
  TrendingUp,
  Users,
  X,
  Plus,
  Eye,
  RefreshCw
} from 'lucide-react';

interface Override {
  id: string;
  override_type: string;
  approver_name: string;
  reason: string;
  geographic_scope: any;
  service_types: string[];
  parameters: any;
  start_time: string;
  end_time?: string;
  status: string;
  estimated_impact?: {
    affected_trips: number;
    revenue_impact: number;
  };
}

interface ExecutiveOverridePanelProps {
  initialOverrides: { count: number; overrides: Override[] };
}

export function ExecutiveOverridePanel({ initialOverrides }: ExecutiveOverridePanelProps) {
  const [overrides, setOverrides] = useState<Override[]>(initialOverrides.overrides);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedOverride, setSelectedOverride] = useState<Override | null>(null);
  
  // Form state for new override
  const [formData, setFormData] = useState({
    override_type: '',
    geographic_scope: {
      type: 'city',
      city_code: 'MNL'
    },
    service_types: ['all'],
    parameters: {
      price_adjustment_pct: 0,
      surge_cap: 2.0,
      emergency_multiplier: 1.0
    },
    reason: '',
    justification: '',
    duration_minutes: 60
  });

  // Simulated executive user (in production, would come from auth)
  const executiveUser = {
    name: 'John Executive',
    level: 3,
    title: 'VP Operations',
    max_adjustment: 100
  };

  const refreshOverrides = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from API
      // const response = await fetch('/api/v1/pricing/override');
      // const data = await response.json();
      // setOverrides(data.active_overrides);
    } catch (error) {
      console.error('Failed to refresh overrides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOverride = async () => {
    setLoading(true);
    try {
      // In production, this would call the API
      // const response = await fetch('/api/v1/pricing/override', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      // Mock successful creation
      const newOverride: Override = {
        id: `override_${Date.now()}`,
        override_type: formData.override_type,
        approver_name: executiveUser.name,
        reason: formData.reason,
        geographic_scope: formData.geographic_scope,
        service_types: formData.service_types,
        parameters: formData.parameters,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + formData.duration_minutes * 60000).toISOString(),
        status: 'active',
        estimated_impact: {
          affected_trips: Math.floor(Math.random() * 1000) + 500,
          revenue_impact: Math.floor(Math.random() * 100000) + 50000
        }
      };
      
      setOverrides(prev => [newOverride, ...prev]);
      setShowCreateModal(false);
      resetForm();
      
    } catch (error) {
      console.error('Failed to create override:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeOverride = async (overrideId: string, reason: string) => {
    try {
      // In production, this would call the API
      // await fetch('/api/v1/pricing/override', {
      //   method: 'DELETE',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ override_id: overrideId, reason })
      // });
      
      setOverrides(prev => prev.filter(o => o.id !== overrideId));
    } catch (error) {
      console.error('Failed to revoke override:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      override_type: '',
      geographic_scope: { type: 'city', city_code: 'MNL' },
      service_types: ['all'],
      parameters: {
        price_adjustment_pct: 0,
        surge_cap: 2.0,
        emergency_multiplier: 1.0
      },
      reason: '',
      justification: '',
      duration_minutes: 60
    });
  };

  const getOverrideTypeIcon = (type: string) => {
    switch (type) {
      case 'surge_disable': return <Ban className="h-4 w-4" />;
      case 'surge_cap': return <TrendingUp className="h-4 w-4" />;
      case 'fare_adjustment': return <Settings className="h-4 w-4" />;
      case 'emergency_control': return <AlertTriangle className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getOverrideTypeBadge = (type: string) => {
    const configs = {
      surge_disable: { variant: 'destructive' as const, label: 'Surge Disabled' },
      surge_cap: { variant: 'secondary' as const, label: 'Surge Capped' },
      fare_adjustment: { variant: 'default' as const, label: 'Fare Adjusted' },
      emergency_control: { variant: 'destructive' as const, label: 'Emergency Control' },
      service_suspend: { variant: 'destructive' as const, label: 'Service Suspended' }
    };
    
    const config = configs[type as keyof typeof configs] || { variant: 'secondary' as const, label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Executive Override System</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Level {executiveUser.level} Authority • {executiveUser.title}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={refreshOverrides} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Override
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  Create Executive Override
                </DialogTitle>
                <DialogDescription>
                  This action requires Level {executiveUser.level} authority and will immediately affect pricing across the selected scope.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Override Type */}
                <div className="space-y-2">
                  <Label htmlFor="override_type">Override Type</Label>
                  <Select value={formData.override_type} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, override_type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select override type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="surge_disable">Disable Surge Pricing</SelectItem>
                      <SelectItem value="surge_cap">Cap Surge Multiplier</SelectItem>
                      <SelectItem value="fare_adjustment">Adjust Base Fares</SelectItem>
                      <SelectItem value="emergency_control">Emergency Control</SelectItem>
                      {executiveUser.level >= 3 && (
                        <SelectItem value="service_suspend">Suspend Service</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Geographic Scope */}
                <div className="space-y-2">
                  <Label>Geographic Scope</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={formData.geographic_scope.type} onValueChange={(value) =>
                      setFormData(prev => ({ 
                        ...prev, 
                        geographic_scope: { ...prev.geographic_scope, type: value }
                      }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="city">Entire City</SelectItem>
                        <SelectItem value="region">Region</SelectItem>
                        <SelectItem value="zone">Specific Zones</SelectItem>
                        <SelectItem value="point">Point + Radius</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={formData.geographic_scope.city_code} onValueChange={(value) =>
                      setFormData(prev => ({ 
                        ...prev, 
                        geographic_scope: { ...prev.geographic_scope, city_code: value }
                      }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MNL">Metro Manila</SelectItem>
                        <SelectItem value="BGC">BGC</SelectItem>
                        <SelectItem value="MKT">Makati</SelectItem>
                        <SelectItem value="QC">Quezon City</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Parameters based on override type */}
                {formData.override_type === 'surge_cap' && (
                  <div className="space-y-2">
                    <Label htmlFor="surge_cap">Maximum Surge Multiplier</Label>
                    <Input
                      id="surge_cap"
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      value={formData.parameters.surge_cap}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        parameters: { ...prev.parameters, surge_cap: parseFloat(e.target.value) }
                      }))}
                    />
                  </div>
                )}

                {formData.override_type === 'fare_adjustment' && (
                  <div className="space-y-2">
                    <Label htmlFor="price_adjustment">Price Adjustment (%)</Label>
                    <Input
                      id="price_adjustment"
                      type="number"
                      step="1"
                      min={-executiveUser.max_adjustment}
                      max={executiveUser.max_adjustment}
                      value={formData.parameters.price_adjustment_pct}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        parameters: { ...prev.parameters, price_adjustment_pct: parseInt(e.target.value) }
                      }))}
                    />
                    <p className="text-xs text-slate-500">
                      Your authority level allows adjustments up to ±{executiveUser.max_adjustment}%
                    </p>
                  </div>
                )}

                {/* Duration */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select value={formData.duration_minutes.toString()} onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="240">4 hours</SelectItem>
                      <SelectItem value="480">8 hours</SelectItem>
                      <SelectItem value="1440">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Required)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Explain the business justification for this override..."
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateOverride}
                  disabled={loading || !formData.override_type || !formData.reason}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Creating...' : 'Create Override'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alert for Emergency Situations */}
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Executive Authority Active</AlertTitle>
        <AlertDescription>
          You have Level {executiveUser.level} override authority. All actions are logged and subject to audit.
          For emergency situations requiring immediate response, use the Emergency Control override type.
        </AlertDescription>
      </Alert>

      {/* Active Overrides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Active Overrides ({overrides.length})
            </span>
            {overrides.length > 0 && (
              <Badge variant="destructive">
                {overrides.length} Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overrides.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <Settings className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No Active Overrides</p>
              <p className="text-sm">All pricing systems operating normally</p>
            </div>
          ) : (
            <div className="space-y-4">
              {overrides.map((override) => (
                <div
                  key={override.id}
                  className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center text-slate-700 dark:text-slate-300">
                          {getOverrideTypeIcon(override.override_type)}
                        </div>
                        {getOverrideTypeBadge(override.override_type)}
                        <Badge variant="outline" className="text-xs">
                          {override.geographic_scope.type}: {override.geographic_scope.city_code}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-900 dark:text-white font-medium mb-1">
                        {override.reason}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {override.approver_name}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Started {new Date(override.start_time).toLocaleTimeString()}
                        </span>
                        {override.end_time && (
                          <span className="flex items-center">
                            Expires {new Date(override.end_time).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      
                      {override.estimated_impact && (
                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                          Impact: ~{override.estimated_impact.affected_trips.toLocaleString()} trips, 
                          ₱{override.estimated_impact.revenue_impact.toLocaleString()} revenue
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOverride(override)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const reason = prompt('Enter reason for revocation:');
                          if (reason) handleRevokeOverride(override.id, reason);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Override History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Override History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center space-x-3">
                <Badge variant="secondary">Surge Disabled</Badge>
                <span className="text-sm">BGC area surge disabled due to heavy traffic</span>
              </div>
              <span className="text-xs text-slate-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center space-x-3">
                <Badge variant="outline">Fare Adjusted</Badge>
                <span className="text-sm">Airport surcharge reduced by 20%</span>
              </div>
              <span className="text-xs text-slate-500">1 day ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Badge variant="destructive">Emergency Control</Badge>
                <span className="text-sm">All services suspended - Typhoon warning</span>
              </div>
              <span className="text-xs text-slate-500">3 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}