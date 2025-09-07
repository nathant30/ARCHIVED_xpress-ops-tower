'use client';

import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Save, 
  X, 
  AlertTriangle,
  Users,
  Shield,
  Building,
  Calendar,
  MapPin,
  Fuel,
  Settings,
  FileText
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import type { 
  CreateVehicleRequest, 
  UpdateVehicleRequest,
  Vehicle,
  VehicleOwnershipType,
  VehicleCategory,
  FuelType
} from '@/types/vehicles';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  vehicle?: Vehicle | null; // null for create, Vehicle for edit
  mode: 'create' | 'edit';
}

interface FormData extends CreateVehicleRequest {
  // Add any additional form-specific fields
}

interface FormErrors {
  [key: string]: string;
}

const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vehicle,
  mode
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    vehicleCode: '',
    licensePlate: '',
    vin: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    category: 'sedan' as VehicleCategory,
    fuelType: 'gasoline' as FuelType,
    engineDisplacement: undefined,
    seatingCapacity: 4,
    cargoCapacityKg: undefined,
    ownershipType: 'xpress_owned' as VehicleOwnershipType,
    fleetOwnerName: '',
    operatorOwnerName: '',
    regionId: '',
    serviceTypes: ['ride_4w'],
    registrationExpiry: new Date(),
    insuranceExpiry: undefined,
    acquisitionCost: undefined,
    obdDeviceInstalled: false
  });

  // Initialize form data when editing
  useEffect(() => {
    if (mode === 'edit' && vehicle) {
      setFormData({
        vehicleCode: vehicle.vehicleCode,
        licensePlate: vehicle.licensePlate,
        vin: vehicle.vin || '',
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        category: vehicle.category,
        fuelType: vehicle.fuelType,
        engineDisplacement: vehicle.engineDisplacement,
        seatingCapacity: vehicle.seatingCapacity,
        cargoCapacityKg: vehicle.cargoCapacityKg,
        ownershipType: vehicle.ownershipType,
        fleetOwnerName: vehicle.fleetOwnerName || '',
        operatorOwnerName: vehicle.operatorOwnerName || '',
        regionId: vehicle.regionId,
        serviceTypes: vehicle.serviceTypes,
        registrationExpiry: new Date(vehicle.registrationExpiry),
        insuranceExpiry: vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry) : undefined,
        acquisitionCost: vehicle.acquisitionCost,
        obdDeviceInstalled: vehicle.obdDeviceInstalled
      });
    } else {
      // Reset form for create mode
      setFormData({
        vehicleCode: '',
        licensePlate: '',
        vin: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        category: 'sedan' as VehicleCategory,
        fuelType: 'gasoline' as FuelType,
        engineDisplacement: undefined,
        seatingCapacity: 4,
        cargoCapacityKg: undefined,
        ownershipType: 'xpress_owned' as VehicleOwnershipType,
        fleetOwnerName: '',
        operatorOwnerName: '',
        regionId: '',
        serviceTypes: ['ride_4w'],
        registrationExpiry: new Date(),
        insuranceExpiry: undefined,
        acquisitionCost: undefined,
        obdDeviceInstalled: false
      });
    }
    setCurrentStep(1);
    setErrors({});
  }, [mode, vehicle, isOpen]);

  // Handle form field changes
  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle service type changes
  const handleServiceTypeChange = (serviceType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      serviceTypes: checked 
        ? [...prev.serviceTypes, serviceType]
        : prev.serviceTypes.filter(type => type !== serviceType)
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Basic validation
    if (!formData.vehicleCode.trim()) {
      newErrors.vehicleCode = 'Vehicle code is required';
    }
    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'License plate is required';
    }
    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    if (!formData.color.trim()) {
      newErrors.color = 'Color is required';
    }
    if (!formData.regionId) {
      newErrors.regionId = 'Region is required';
    }
    if (formData.serviceTypes.length === 0) {
      newErrors.serviceTypes = 'At least one service type is required';
    }

    // Year validation - FIXED: Restrict to reasonable future years
    // Prevent vehicles from being registered with years beyond next model year
    const currentYear = new Date().getFullYear();
    const maxAllowedYear = currentYear + 1; // Only allow current and next model year
    
    if (formData.year < 1990 || formData.year > maxAllowedYear) {
      newErrors.year = `Year must be between 1990 and ${maxAllowedYear}. Vehicles cannot be registered more than 1 year in advance.`;
    }

    // Seating capacity validation
    if (formData.seatingCapacity < 1 || formData.seatingCapacity > 50) {
      newErrors.seatingCapacity = 'Seating capacity must be between 1 and 50';
    }

    // Ownership-specific validation
    if (formData.ownershipType === 'fleet_owned' && !formData.fleetOwnerName.trim()) {
      newErrors.fleetOwnerName = 'Fleet owner name is required for fleet-owned vehicles';
    }
    if (formData.ownershipType === 'operator_owned' && !formData.operatorOwnerName.trim()) {
      newErrors.operatorOwnerName = 'Operator owner name is required for operator-owned vehicles';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const url = mode === 'create' ? '/api/vehicles' : `/api/vehicles/${vehicle?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.();
        onClose();
      } else {
        // Handle API errors
        if (data.errors) {
          const apiErrors: FormErrors = {};
          data.errors.forEach((error: any) => {
            apiErrors[error.field] = error.message;
          });
          setErrors(apiErrors);
        } else {
          // Handle known API error codes with user-friendly messages
          const errorMessages: Record<string, string> = {
            'DUPLICATE_VEHICLE_CODE': 'This vehicle code is already in use. Please choose a different code.',
            'DUPLICATE_LICENSE_PLATE': 'This license plate is already registered. Please check the plate number.',
            'REGION_ACCESS_DENIED': 'You don\'t have permission to register vehicles in this region.',
            'INVALID_YEAR_RANGE': 'Please enter a valid manufacturing year between 1990 and next year.',
            'VALIDATION_ERROR': 'Please check the form for missing or invalid information.',
            'INSUFFICIENT_PERMISSIONS': 'You don\'t have permission to perform this action.',
            'VEHICLE_NOT_FOUND': 'The vehicle you\'re trying to update no longer exists.'
          };
          
          const friendlyMessage = errorMessages[data.code] || data.message || 
            `Unable to ${mode} vehicle. Please check your information and try again.`;
            
          setErrors({
            general: friendlyMessage
          });
        }
      }
    } catch (error) {
      console.error(`Failed to ${mode} vehicle:`, error);
      
      // Provide specific error messages based on common network/server issues
      let errorMessage = `Unable to ${mode} vehicle. `;
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else if (error instanceof Error && error.message.includes('timeout')) {
        errorMessage += 'The request timed out. Please try again.';
      } else if (error instanceof Error && error.message.includes('JSON')) {
        errorMessage += 'There was a problem processing the server response. Please contact support.';
      } else {
        errorMessage += 'An unexpected error occurred. Please try again or contact support if the problem persists.';
      }
      
      setErrors({
        general: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Step validation
  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return !!(formData.vehicleCode && formData.licensePlate && formData.make && formData.model && formData.year);
      case 3:
        return !!(formData.ownershipType && formData.regionId);
      default:
        return true;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfoStep();
      case 2:
        return renderSpecificationsStep();
      case 3:
        return renderOwnershipStep();
      case 4:
        return renderRegistrationStep();
      default:
        return null;
    }
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Basic Vehicle Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Code *
              </label>
              <input
                type="text"
                value={formData.vehicleCode}
                onChange={(e) => handleFieldChange('vehicleCode', e.target.value)}
                placeholder="e.g., XOT-001"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.vehicleCode ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.vehicleCode && (
                <p className="text-red-600 text-xs mt-1">{errors.vehicleCode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Plate *
              </label>
              <input
                type="text"
                value={formData.licensePlate}
                onChange={(e) => handleFieldChange('licensePlate', e.target.value.toUpperCase())}
                placeholder="e.g., ABC123"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.licensePlate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.licensePlate && (
                <p className="text-red-600 text-xs mt-1">{errors.licensePlate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Make *
              </label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => handleFieldChange('make', e.target.value)}
                placeholder="e.g., Toyota"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.make ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.make && (
                <p className="text-red-600 text-xs mt-1">{errors.make}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model *
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleFieldChange('model', e.target.value)}
                placeholder="e.g., Vios"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.model ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.model && (
                <p className="text-red-600 text-xs mt-1">{errors.model}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleFieldChange('year', parseInt(e.target.value))}
                min="1990"
                max={new Date().getFullYear() + 1}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.year ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.year && (
                <p className="text-red-600 text-xs mt-1">{errors.year}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color *
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => handleFieldChange('color', e.target.value)}
                placeholder="e.g., White"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.color ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.color && (
                <p className="text-red-600 text-xs mt-1">{errors.color}</p>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VIN (Optional)
              </label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => handleFieldChange('vin', e.target.value.toUpperCase())}
                placeholder="Vehicle Identification Number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSpecificationsStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Vehicle Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleFieldChange('category', e.target.value as VehicleCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sedan">Sedan</option>
                <option value="hatchback">Hatchback</option>
                <option value="suv">SUV</option>
                <option value="mpv">MPV</option>
                <option value="van">Van</option>
                <option value="motorcycle">Motorcycle</option>
                <option value="tricycle">Tricycle</option>
                <option value="jeepney">Jeepney</option>
                <option value="e_jeepney">E-Jeepney</option>
                <option value="bus">Bus</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fuel Type *
              </label>
              <select
                value={formData.fuelType}
                onChange={(e) => handleFieldChange('fuelType', e.target.value as FuelType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="gasoline">Gasoline</option>
                <option value="diesel">Diesel</option>
                <option value="lpg">LPG</option>
                <option value="electric">Electric</option>
                <option value="hybrid_gas">Hybrid (Gasoline)</option>
                <option value="hybrid_diesel">Hybrid (Diesel)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seating Capacity *
              </label>
              <input
                type="number"
                value={formData.seatingCapacity}
                onChange={(e) => handleFieldChange('seatingCapacity', parseInt(e.target.value))}
                min="1"
                max="50"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.seatingCapacity ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.seatingCapacity && (
                <p className="text-red-600 text-xs mt-1">{errors.seatingCapacity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Engine Displacement (cc)
              </label>
              <input
                type="number"
                value={formData.engineDisplacement || ''}
                onChange={(e) => handleFieldChange('engineDisplacement', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 1500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo Capacity (kg)
              </label>
              <input
                type="number"
                value={formData.cargoCapacityKg || ''}
                onChange={(e) => handleFieldChange('cargoCapacityKg', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acquisition Cost (₱)
              </label>
              <input
                type="number"
                value={formData.acquisitionCost || ''}
                onChange={(e) => handleFieldChange('acquisitionCost', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 800000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Service Types *
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { value: 'ride_4w', label: '4-Wheeler Ride' },
                { value: 'ride_2w', label: '2-Wheeler Ride' },
                { value: 'delivery', label: 'Delivery Service' },
                { value: 'food_delivery', label: 'Food Delivery' },
                { value: 'package_delivery', label: 'Package Delivery' },
                { value: 'shuttle', label: 'Shuttle Service' }
              ].map((service) => (
                <label key={service.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.serviceTypes.includes(service.value)}
                    onChange={(e) => handleServiceTypeChange(service.value, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{service.label}</span>
                </label>
              ))}
            </div>
            {errors.serviceTypes && (
              <p className="text-red-600 text-xs mt-2">{errors.serviceTypes}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="obdDevice"
              checked={formData.obdDeviceInstalled}
              onChange={(e) => handleFieldChange('obdDeviceInstalled', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="obdDevice" className="text-sm text-gray-700">
              OBD device installed
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOwnershipStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Ownership & Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ownership Type *
            </label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {[
                { 
                  value: 'xpress_owned', 
                  label: 'Xpress Owned', 
                  description: 'Owned and operated by Xpress',
                  icon: <Car className="w-4 h-4" />
                },
                { 
                  value: 'fleet_owned', 
                  label: 'Fleet Owned', 
                  description: 'Third-party fleet operator',
                  icon: <Building className="w-4 h-4" />
                },
                { 
                  value: 'operator_owned', 
                  label: 'Operator Owned', 
                  description: 'Independent operator vehicle',
                  icon: <Users className="w-4 h-4" />
                },
                { 
                  value: 'driver_owned', 
                  label: 'Driver Owned', 
                  description: 'Driver-owned vehicle',
                  icon: <Users className="w-4 h-4" />
                }
              ].map((ownership) => (
                <label key={ownership.value} className="relative">
                  <input
                    type="radio"
                    name="ownershipType"
                    value={ownership.value}
                    checked={formData.ownershipType === ownership.value}
                    onChange={(e) => handleFieldChange('ownershipType', e.target.value as VehicleOwnershipType)}
                    className="sr-only"
                  />
                  <div className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.ownershipType === ownership.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        formData.ownershipType === ownership.value
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {ownership.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{ownership.label}</h4>
                        <p className="text-sm text-gray-600">{ownership.description}</p>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {formData.ownershipType === 'fleet_owned' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fleet Owner Name *
              </label>
              <input
                type="text"
                value={formData.fleetOwnerName}
                onChange={(e) => handleFieldChange('fleetOwnerName', e.target.value)}
                placeholder="e.g., Metro Fleet Services"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fleetOwnerName ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.fleetOwnerName && (
                <p className="text-red-600 text-xs mt-1">{errors.fleetOwnerName}</p>
              )}
            </div>
          )}

          {formData.ownershipType === 'operator_owned' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operator Owner Name *
              </label>
              <input
                type="text"
                value={formData.operatorOwnerName}
                onChange={(e) => handleFieldChange('operatorOwnerName', e.target.value)}
                placeholder="e.g., Juan dela Cruz"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.operatorOwnerName ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.operatorOwnerName && (
                <p className="text-red-600 text-xs mt-1">{errors.operatorOwnerName}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Operating Region *
            </label>
            <select
              value={formData.regionId}
              onChange={(e) => handleFieldChange('regionId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.regionId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select Region</option>
              <option value="region-manila">Metro Manila</option>
              <option value="region-cebu">Cebu</option>
              <option value="region-davao">Davao</option>
              <option value="region-baguio">Baguio</option>
              <option value="region-iloilo">Iloilo</option>
            </select>
            {errors.regionId && (
              <p className="text-red-600 text-xs mt-1">{errors.regionId}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRegistrationStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Registration & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Expiry *
              </label>
              <input
                type="date"
                value={formData.registrationExpiry.toISOString().split('T')[0]}
                onChange={(e) => handleFieldChange('registrationExpiry', new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Insurance Expiry
              </label>
              <input
                type="date"
                value={formData.insuranceExpiry ? formData.insuranceExpiry.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFieldChange('insuranceExpiry', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-900">Additional Documentation Required</h4>
                <p className="text-sm text-amber-700 mt-1">
                  After creating this vehicle, you'll need to upload additional documents including:
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• LTFRB Franchise Certificate</li>
                  <li>• OR/CR Documents</li>
                  <li>• Insurance Policy</li>
                  <li>• Emissions Test Certificate</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <Car className="w-6 h-6 text-blue-600" />
            {mode === 'create' ? 'Add New Vehicle' : 'Edit Vehicle'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-4 flex-shrink-0">
          {[
            { step: 1, title: 'Basic Info' },
            { step: 2, title: 'Specifications' },
            { step: 3, title: 'Ownership' },
            { step: 4, title: 'Registration' }
          ].map((item) => (
            <div
              key={item.step}
              className={`flex items-center ${item.step < 4 ? 'flex-1' : ''}`}
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
              {item.step < 4 && (
                <div className={`flex-1 h-1 mx-4 rounded ${
                  currentStep > item.step ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto">
          {renderStepContent()}
          
          {errors.general && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{errors.general}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
          <div>
            {currentStep > 1 && (
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
            {currentStep < 4 ? (
              <Button
                variant="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToStep(currentStep + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
                leftIcon={<Save className="w-4 h-4" />}
              >
                {mode === 'create' ? 'Create Vehicle' : 'Update Vehicle'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleFormModal;