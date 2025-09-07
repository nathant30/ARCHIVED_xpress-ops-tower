'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Calendar, 
  Clock, 
  DollarSign,
  AlertTriangle,
  User,
  MapPin,
  FileText,
  CheckCircle,
  Settings,
  Tool,
  Shield
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/xpress/table';

import type { 
  ScheduleMaintenanceRequest,
  UpdateMaintenanceRequest,
  MaintenancePriority,
  VehicleMaintenance,
  MaintenanceStatus
} from '@/types/vehicles';

interface MaintenanceScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  vehicleId: string;
  vehicleCode: string;
  maintenance?: VehicleMaintenance | null; // null for schedule, VehicleMaintenance for update
  mode: 'schedule' | 'update';
}

interface ServiceProvider {
  id: string;
  name: string;
  location: string;
  contact: string;
  specialties: string[];
  rating: number;
  averageCost: number;
  isPreferred: boolean;
}

const MaintenanceScheduleModal: React.FC<MaintenanceScheduleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vehicleId,
  vehicleCode,
  maintenance,
  mode
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);

  // Form data for scheduling
  const [scheduleData, setScheduleData] = useState<ScheduleMaintenanceRequest>({
    maintenanceType: '',
    priority: 'routine',
    scheduledDate: new Date(),
    scheduledStartTime: '09:00',
    description: '',
    serviceProvider: '',
    serviceLocation: '',
    estimatedDurationHours: 2,
    estimatedCost: undefined
  });

  // Form data for updating
  const [updateData, setUpdateData] = useState<UpdateMaintenanceRequest>({
    status: 'scheduled',
    actualStartTime: undefined,
    actualCompletionTime: undefined,
    workPerformed: '',
    partsReplaced: [],
    partsCost: 0,
    laborCost: 0,
    otherCosts: 0,
    qualityRating: undefined,
    inspectionPassed: undefined,
    inspectorNotes: ''
  });

  // Initialize form data
  useEffect(() => {
    if (mode === 'update' && maintenance) {
      setUpdateData({
        status: maintenance.status,
        actualStartTime: maintenance.actualStartTime,
        actualCompletionTime: maintenance.actualCompletionTime,
        workPerformed: maintenance.workPerformed || '',
        partsReplaced: maintenance.partsReplaced || [],
        partsCost: maintenance.partsCost,
        laborCost: maintenance.laborCost,
        otherCosts: maintenance.otherCosts,
        qualityRating: maintenance.qualityRating,
        inspectionPassed: maintenance.inspectionPassed,
        inspectorNotes: maintenance.inspectorNotes || ''
      });
    }
  }, [mode, maintenance]);

  // Load service providers
  useEffect(() => {
    if (isOpen && mode === 'schedule') {
      fetchServiceProviders();
    }
  }, [isOpen, mode]);

  const fetchServiceProviders = async () => {
    try {
      // Mock service providers - in production this would be an API call
      const mockProviders: ServiceProvider[] = [
        {
          id: 'sp-001',
          name: 'AutoServe Manila',
          location: 'Makati City',
          contact: '+63 2 8123-4567',
          specialties: ['Oil Change', 'Brake Service', 'General Maintenance'],
          rating: 4.8,
          averageCost: 2500,
          isPreferred: true
        },
        {
          id: 'sp-002',
          name: 'QuickFix Garage',
          location: 'Quezon City',
          contact: '+63 2 8765-4321',
          specialties: ['Engine Repair', 'Transmission', 'Electrical'],
          rating: 4.5,
          averageCost: 3200,
          isPreferred: false
        },
        {
          id: 'sp-003',
          name: 'Metro Car Care',
          location: 'Pasig City',
          contact: '+63 2 8456-7890',
          specialties: ['Tire Service', 'Battery Replacement', 'AC Service'],
          rating: 4.6,
          averageCost: 2800,
          isPreferred: true
        }
      ];
      setServiceProviders(mockProviders);
    } catch (error) {
      console.error('Failed to fetch service providers:', error);
    }
  };

  // Handle form field changes
  const handleScheduleChange = (field: keyof ScheduleMaintenanceRequest, value: any) => {
    setScheduleData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateChange = (field: keyof UpdateMaintenanceRequest, value: any) => {
    setUpdateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle service provider selection
  const handleProviderSelect = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setScheduleData(prev => ({
      ...prev,
      serviceProvider: provider.name,
      serviceLocation: provider.location,
      estimatedCost: provider.averageCost
    }));
  };

  // Calculate total costs for update
  const getTotalCost = (): number => {
    return (updateData.partsCost || 0) + (updateData.laborCost || 0) + (updateData.otherCosts || 0);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (mode === 'schedule') {
        const response = await fetch(`/api/vehicles/${vehicleId}/maintenance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleData)
        });

        const data = await response.json();
        if (data.success) {
          onSuccess?.();
          onClose();
        }
      } else {
        const response = await fetch(`/api/vehicles/${vehicleId}/maintenance/${maintenance?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        const data = await response.json();
        if (data.success) {
          onSuccess?.();
          onClose();
        }
      }
    } catch (error) {
      console.error(`Failed to ${mode} maintenance:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Render maintenance type selection
  const renderMaintenanceTypeStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tool className="w-5 h-5" />
          Maintenance Type & Priority
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Maintenance Type *
          </label>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[
              { value: 'oil_change', label: 'Oil Change', icon: '🛢️' },
              { value: 'brake_service', label: 'Brake Service', icon: '🛑' },
              { value: 'tire_rotation', label: 'Tire Rotation', icon: '🔄' },
              { value: 'engine_tune_up', label: 'Engine Tune-up', icon: '⚙️' },
              { value: 'transmission_service', label: 'Transmission Service', icon: '🔧' },
              { value: 'electrical_repair', label: 'Electrical Repair', icon: '⚡' },
              { value: 'ac_service', label: 'A/C Service', icon: '❄️' },
              { value: 'general_inspection', label: 'General Inspection', icon: '🔍' },
              { value: 'bodywork', label: 'Bodywork', icon: '🎨' },
              { value: 'other', label: 'Other', icon: '🔧' }
            ].map((type) => (
              <label key={type.value} className="relative">
                <input
                  type="radio"
                  name="maintenanceType"
                  value={type.value}
                  checked={scheduleData.maintenanceType === type.value}
                  onChange={(e) => handleScheduleChange('maintenanceType', e.target.value)}
                  className="sr-only"
                />
                <div className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  scheduleData.maintenanceType === type.value
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <span className="font-medium text-gray-900">{type.label}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority Level *
          </label>
          <select
            value={scheduleData.priority}
            onChange={(e) => handleScheduleChange('priority', e.target.value as MaintenancePriority)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="routine">Routine Maintenance</option>
            <option value="minor">Minor Issue</option>
            <option value="major">Major Issue</option>
            <option value="urgent">Urgent Repair</option>
            <option value="critical">Critical/Emergency</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={scheduleData.description}
            onChange={(e) => handleScheduleChange('description', e.target.value)}
            placeholder="Describe the maintenance work needed..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </CardContent>
    </Card>
  );

  // Render service provider selection
  const renderServiceProviderStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Select Service Provider
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {serviceProviders.map((provider) => (
            <div
              key={provider.id}
              onClick={() => handleProviderSelect(provider)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedProvider?.id === provider.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{provider.name}</h4>
                      {provider.isPreferred && (
                        <StatusBadge status="PREFERRED" variant="success" />
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{provider.location}</span>
                      </div>
                      <div>★ {provider.rating.toFixed(1)}</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Specialties: {provider.specialties.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₱{provider.averageCost.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Avg. Cost</p>
                  {selectedProvider?.id === provider.id && (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedProvider && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Contact Information</h4>
            <p className="text-sm text-blue-800">{selectedProvider.contact}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render scheduling details
  const renderScheduleDetailsStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Schedule Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheduled Date *
            </label>
            <input
              type="date"
              value={scheduleData.scheduledDate.toISOString().split('T')[0]}
              onChange={(e) => handleScheduleChange('scheduledDate', new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={scheduleData.scheduledStartTime}
              onChange={(e) => handleScheduleChange('scheduledStartTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Duration (hours)
            </label>
            <input
              type="number"
              value={scheduleData.estimatedDurationHours}
              onChange={(e) => handleScheduleChange('estimatedDurationHours', parseFloat(e.target.value))}
              min="0.5"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Cost (₱)
            </label>
            <input
              type="number"
              value={scheduleData.estimatedCost || ''}
              onChange={(e) => handleScheduleChange('estimatedCost', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {scheduleData.priority === 'critical' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-900">Critical Priority Alert</h4>
                <p className="text-sm text-red-700 mt-1">
                  This maintenance has been marked as critical. The vehicle should be taken off the road immediately for safety reasons.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render update form
  const renderUpdateForm = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Maintenance Status Update
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={updateData.status}
                onChange={(e) => handleUpdateChange('status', e.target.value as MaintenanceStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="deferred">Deferred</option>
              </select>
            </div>

            {updateData.status === 'in_progress' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Start Time
                </label>
                <input
                  type="datetime-local"
                  value={updateData.actualStartTime ? 
                    new Date(updateData.actualStartTime).toISOString().slice(0, 16) : ''
                  }
                  onChange={(e) => handleUpdateChange('actualStartTime', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {updateData.status === 'completed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Time
                </label>
                <input
                  type="datetime-local"
                  value={updateData.actualCompletionTime ? 
                    new Date(updateData.actualCompletionTime).toISOString().slice(0, 16) : ''
                  }
                  onChange={(e) => handleUpdateChange('actualCompletionTime', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Performed
            </label>
            <textarea
              value={updateData.workPerformed}
              onChange={(e) => handleUpdateChange('workPerformed', e.target.value)}
              placeholder="Describe the work that was performed..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {(updateData.status === 'completed' || updateData.status === 'in_progress') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parts Cost (₱)
                </label>
                <input
                  type="number"
                  value={updateData.partsCost || ''}
                  onChange={(e) => handleUpdateChange('partsCost', e.target.value ? parseFloat(e.target.value) : 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Labor Cost (₱)
                </label>
                <input
                  type="number"
                  value={updateData.laborCost || ''}
                  onChange={(e) => handleUpdateChange('laborCost', e.target.value ? parseFloat(e.target.value) : 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Costs (₱)
                </label>
                <input
                  type="number"
                  value={updateData.otherCosts || ''}
                  onChange={(e) => handleUpdateChange('otherCosts', e.target.value ? parseFloat(e.target.value) : 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-blue-900">Total Cost:</span>
                <span className="text-xl font-bold text-blue-900">₱{getTotalCost().toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {updateData.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Quality & Inspection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality Rating (1-5)
                </label>
                <select
                  value={updateData.qualityRating || ''}
                  onChange={(e) => handleUpdateChange('qualityRating', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Rating</option>
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Fair</option>
                  <option value="3">3 - Good</option>
                  <option value="4">4 - Very Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspection Status
                </label>
                <select
                  value={updateData.inspectionPassed === undefined ? '' : updateData.inspectionPassed ? 'passed' : 'failed'}
                  onChange={(e) => handleUpdateChange('inspectionPassed', e.target.value === '' ? undefined : e.target.value === 'passed')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Not Inspected</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspector Notes
              </label>
              <textarea
                value={updateData.inspectorNotes}
                onChange={(e) => handleUpdateChange('inspectorNotes', e.target.value)}
                placeholder="Additional notes from the inspector..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <Wrench className="w-6 h-6 text-blue-600" />
            <div>
              <span>
                {mode === 'schedule' ? 'Schedule Maintenance' : 'Update Maintenance'}
              </span>
              <span className="text-lg text-gray-600 ml-2">• {vehicleCode}</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        {mode === 'schedule' && (
          <>
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-6 px-4 flex-shrink-0">
              {[
                { step: 1, title: 'Type & Priority' },
                { step: 2, title: 'Service Provider' },
                { step: 3, title: 'Schedule Details' }
              ].map((item) => (
                <div
                  key={item.step}
                  className={`flex items-center ${item.step < 3 ? 'flex-1' : ''}`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep === item.step
                      ? 'bg-blue-600 text-white'
                      : currentStep > item.step
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {item.step}
                  </div>
                  <span className={`ml-2 text-sm ${
                    currentStep >= item.step ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {item.title}
                  </span>
                  {item.step < 3 && (
                    <div className={`flex-1 h-1 mx-4 rounded ${
                      currentStep > item.step ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {mode === 'schedule' && (
            <>
              {currentStep === 1 && renderMaintenanceTypeStep()}
              {currentStep === 2 && renderServiceProviderStep()}
              {currentStep === 3 && renderScheduleDetailsStep()}
            </>
          )}
          {mode === 'update' && renderUpdateForm()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
          <div>
            {mode === 'schedule' && currentStep > 1 && (
              <Button
                variant="secondary"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Previous
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="tertiary" onClick={onClose}>
              Cancel
            </Button>
            {mode === 'schedule' && currentStep < 3 ? (
              <Button
                variant="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 && !scheduleData.maintenanceType) ||
                  (currentStep === 2 && !selectedProvider)
                }
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
                leftIcon={<CheckCircle className="w-4 h-4" />}
              >
                {mode === 'schedule' ? 'Schedule Maintenance' : 'Update Maintenance'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceScheduleModal;