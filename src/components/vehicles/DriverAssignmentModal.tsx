'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Calendar, 
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Fuel,
  Wrench,
  Clock,
  Star,
  Car
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/xpress/table';

import type { 
  AssignDriverRequest,
  BulkAssignDriverRequest,
  AssignmentType,
  VehicleDriverAssignment
} from '@/types/vehicles';

// Driver interface for selection
interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phoneNumber: string;
  rating: number;
  totalTrips: number;
  status: 'available' | 'assigned' | 'on_trip' | 'offline' | 'suspended';
  profilePicture?: string;
  currentVehicleId?: string;
  currentVehicleCode?: string;
  experience: {
    yearsOfExperience: number;
    vehicleTypesExperience: string[];
  };
  documents: {
    licenseExpiry: Date;
    medicalCertificateExpiry: Date;
    seminarsCompleted: boolean;
  };
  performance: {
    acceptanceRate: number;
    completionRate: number;
    cancelationRate: number;
    averageRating: number;
  };
  lastActiveAt: Date;
}

interface DriverAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  vehicleId: string;
  vehicleCode: string;
  currentAssignment?: VehicleDriverAssignment | null;
  mode: 'assign' | 'reassign' | 'bulk';
  vehicleIds?: string[]; // For bulk assignment
}

const DriverAssignmentModal: React.FC<DriverAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  vehicleId,
  vehicleCode,
  currentAssignment,
  mode,
  vehicleIds = []
}) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [assignmentData, setAssignmentData] = useState<AssignDriverRequest>({
    driverId: '',
    assignmentType: 'primary',
    validFrom: new Date(),
    validUntil: undefined,
    dailyRentalFee: undefined,
    fuelResponsibility: 'driver',
    maintenanceResponsibility: 'owner',
    notes: ''
  });

  // Load available drivers
  useEffect(() => {
    if (isOpen) {
      fetchAvailableDrivers();
    }
  }, [isOpen]);

  const fetchAvailableDrivers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/drivers/available');
      const data = await response.json();
      
      if (data.success) {
        setAvailableDrivers(data.data.drivers || []);
      }
    } catch (error) {
      console.error('Failed to fetch available drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter drivers based on search
  const filteredDrivers = availableDrivers.filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phoneNumber.includes(searchTerm)
  );

  // Handle assignment form changes
  const handleAssignmentChange = (field: keyof AssignDriverRequest, value: any) => {
    setAssignmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle driver selection
  const handleDriverSelect = (driver: Driver) => {
    setSelectedDriver(driver);
    setAssignmentData(prev => ({
      ...prev,
      driverId: driver.id
    }));
  };

  // Validate assignment
  const validateAssignment = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!selectedDriver) {
      errors.push('Please select a driver');
    }

    if (assignmentData.validUntil && assignmentData.validUntil <= assignmentData.validFrom) {
      errors.push('End date must be after start date');
    }

    if (assignmentData.dailyRentalFee && assignmentData.dailyRentalFee < 0) {
      errors.push('Daily rental fee must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Handle assignment submission
  const handleSubmit = async () => {
    const validation = validateAssignment();
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    try {
      setLoading(true);

      if (mode === 'bulk') {
        // Bulk assignment
        const bulkData: BulkAssignDriverRequest = {
          assignments: vehicleIds.map(vId => ({
            vehicleId: vId,
            driverId: assignmentData.driverId,
            assignmentType: assignmentData.assignmentType,
            validFrom: assignmentData.validFrom,
            validUntil: assignmentData.validUntil,
            dailyRentalFee: assignmentData.dailyRentalFee
          }))
        };

        const response = await fetch('/api/vehicles/assignments/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bulkData)
        });

        const data = await response.json();
        if (data.success) {
          onSuccess?.();
          onClose();
        }
      } else {
        // Single assignment
        const response = await fetch(`/api/vehicles/${vehicleId}/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(assignmentData)
        });

        const data = await response.json();
        if (data.success) {
          onSuccess?.();
          onClose();
        }
      }
    } catch (error) {
      console.error('Failed to assign driver:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get status color for driver
  const getDriverStatusColor = (status: string) => {
    const colors = {
      'available': 'success',
      'assigned': 'warning',
      'on_trip': 'info',
      'offline': 'default',
      'suspended': 'error'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <span>
                {mode === 'assign' && 'Assign Driver'}
                {mode === 'reassign' && 'Reassign Driver'}
                {mode === 'bulk' && `Bulk Assign Driver (${vehicleIds.length} vehicles)`}
              </span>
              {mode !== 'bulk' && (
                <span className="text-lg text-gray-600 ml-2">• {vehicleCode}</span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Current Assignment Info (for reassign mode) */}
          {mode === 'reassign' && currentAssignment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Current Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{currentAssignment.driverName}</p>
                    <p className="text-sm text-gray-600">Driver ID: {currentAssignment.driverId}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge 
                      status={currentAssignment.assignmentType.toUpperCase()}
                      variant="default"
                    />
                    <p className="text-sm text-gray-600">
                      Since: {new Date(currentAssignment.validFrom).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Driver Search and Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Select Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search drivers by name, license, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Driver List */}
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredDrivers.map((driver) => (
                    <div
                      key={driver.id}
                      onClick={() => handleDriverSelect(driver)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-blue-300 ${
                        selectedDriver?.id === driver.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{driver.name}</h4>
                              <StatusBadge 
                                status={driver.status.replace('_', ' ').toUpperCase()}
                                variant={getDriverStatusColor(driver.status) as any}
                              />
                            </div>
                            <p className="text-sm text-gray-600">
                              License: {driver.licenseNumber} • Phone: {driver.phoneNumber}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span>{driver.rating.toFixed(1)}</span>
                              </div>
                              <span>{driver.totalTrips} trips</span>
                              <span>{driver.experience.yearsOfExperience} years exp.</span>
                            </div>
                          </div>
                        </div>
                        
                        {selectedDriver?.id === driver.id && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>

                      {driver.currentVehicleId && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                          <div className="flex items-center gap-1 text-amber-700">
                            <AlertTriangle className="w-3 h-3" />
                            Currently assigned to vehicle {driver.currentVehicleCode}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {filteredDrivers.length === 0 && !loading && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No drivers found</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment Configuration */}
          {selectedDriver && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Assignment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignment Type
                    </label>
                    <select
                      value={assignmentData.assignmentType}
                      onChange={(e) => handleAssignmentChange('assignmentType', e.target.value as AssignmentType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="primary">Primary Driver</option>
                      <option value="secondary">Secondary Driver</option>
                      <option value="temporary">Temporary Assignment</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Rental Fee (₱)
                    </label>
                    <input
                      type="number"
                      value={assignmentData.dailyRentalFee || ''}
                      onChange={(e) => handleAssignmentChange('dailyRentalFee', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignment Start Date
                    </label>
                    <input
                      type="date"
                      value={assignmentData.validFrom.toISOString().split('T')[0]}
                      onChange={(e) => handleAssignmentChange('validFrom', new Date(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignment End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={assignmentData.validUntil ? assignmentData.validUntil.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleAssignmentChange('validUntil', e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuel Responsibility
                    </label>
                    <select
                      value={assignmentData.fuelResponsibility}
                      onChange={(e) => handleAssignmentChange('fuelResponsibility', e.target.value as 'driver' | 'owner' | 'shared')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="driver">Driver Responsibility</option>
                      <option value="owner">Owner Responsibility</option>
                      <option value="shared">Shared Responsibility</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maintenance Responsibility
                    </label>
                    <select
                      value={assignmentData.maintenanceResponsibility}
                      onChange={(e) => handleAssignmentChange('maintenanceResponsibility', e.target.value as 'driver' | 'owner' | 'shared')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="driver">Driver Responsibility</option>
                      <option value="owner">Owner Responsibility</option>
                      <option value="shared">Shared Responsibility</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assignment Notes
                  </label>
                  <textarea
                    value={assignmentData.notes}
                    onChange={(e) => handleAssignmentChange('notes', e.target.value)}
                    placeholder="Optional notes about this assignment..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Driver Performance (when selected) */}
          {selectedDriver && (
            <Card>
              <CardHeader>
                <CardTitle>Driver Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedDriver.performance.acceptanceRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Acceptance Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedDriver.performance.completionRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-600">
                      {selectedDriver.performance.cancelationRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Cancellation Rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedDriver.performance.averageRating.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-600">Average Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
          <Button variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={!selectedDriver}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            {mode === 'assign' && 'Assign Driver'}
            {mode === 'reassign' && 'Reassign Driver'}
            {mode === 'bulk' && `Assign to ${vehicleIds.length} Vehicles`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DriverAssignmentModal;