'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Car, 
  Plus, 
  Search, 
  Download, 
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  Settings,
  Activity,
  Fuel,
  Wrench,
  MapPin,
  Users,
  TrendingUp,
  Battery,
  Shield,
  Calendar,
  MoreVertical
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/xpress/card';
import { Button } from '@/components/xpress/button';
import { 
  Table, 
  TableColumn, 
  StatusBadge
} from '@/components/xpress/table';
import VehicleDetailModal from '@/components/vehicles/VehicleDetailModal';
import VehicleFormModal from '@/components/vehicles/VehicleFormModal';
import { 
  VehiclePermissionGate, 
  VehicleActionButton, 
  VehicleAccessLevel,
  VehicleMFAChallenge
} from '@/components/rbac/VehiclePermissionGate';

import type { 
  Vehicle, 
  VehicleDashboardItem, 
  VehicleOwnershipType, 
  VehicleStatus,
  VehicleCategory,
  FuelType,
  VehicleFilterParams
} from '@/types/vehicles';

// Vehicle Dashboard Summary Interface
interface VehicleDashboardSummary {
  totalVehicles: number;
  activeVehicles: number;
  vehiclesInService: number;
  vehiclesInMaintenance: number;
  overdueMaintenance: number;
  activeAlerts: number;
  avgUtilization: number;
  totalRevenue30d: number;
}

// Enhanced Vehicle Dashboard Item with display helpers
interface EnhancedVehicleDashboardItem extends VehicleDashboardItem {
  statusColor: string;
  ownershipTypeLabel: string;
  maintenanceStatusColor: string;
  utilizationStatus: 'excellent' | 'good' | 'fair' | 'poor';
}

const VehicleManagementPage = () => {
  // State management
  const [vehicles, setVehicles] = useState<EnhancedVehicleDashboardItem[]>([]);
  const [summary, setSummary] = useState<VehicleDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showVehicleDetailModal, setShowVehicleDetailModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showEditVehicleModal, setShowEditVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<EnhancedVehicleDashboardItem | null>(null);
  const [showMFAChallenge, setShowMFAChallenge] = useState(false);
  const [mfaOperation, setMFAOperation] = useState<string>('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'all'>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<VehicleOwnershipType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<VehicleCategory | 'all'>('all');
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState<'current' | 'due_soon' | 'overdue' | 'all'>('all');

  // Load vehicle data
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        
        const filters: VehicleFilterParams = {};
        if (statusFilter !== 'all') filters.status = statusFilter;
        if (ownershipFilter !== 'all') filters.ownershipType = ownershipFilter;
        if (categoryFilter !== 'all') filters.category = categoryFilter;
        if (maintenanceStatusFilter !== 'all') filters.maintenanceStatus = maintenanceStatusFilter;
        if (searchTerm.trim()) filters.search = searchTerm.trim();

        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });

        const response = await fetch(`/api/vehicles/dashboard?${queryParams}`);
        const data = await response.json();

        if (data.success) {
          const enhancedVehicles = data.data.vehicles.map((vehicle: VehicleDashboardItem): EnhancedVehicleDashboardItem => ({
            ...vehicle,
            statusColor: getStatusColor(vehicle.status),
            ownershipTypeLabel: getOwnershipTypeLabel(vehicle.ownershipType),
            maintenanceStatusColor: getMaintenanceStatusColor(vehicle.maintenanceStatus),
            utilizationStatus: getUtilizationStatus(vehicle.avgUtilization30d)
          }));

          setVehicles(enhancedVehicles);
          setSummary(data.data.summary);
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [searchTerm, statusFilter, ownershipFilter, categoryFilter, maintenanceStatusFilter]);

  // Helper functions
  const getStatusColor = (status: VehicleStatus): string => {
    const colors = {
      'active': 'success',
      'in_service': 'success', 
      'maintenance': 'warning',
      'inspection': 'warning',
      'inactive': 'default',
      'decommissioned': 'error',
      'impounded': 'error'
    };
    return colors[status] || 'default';
  };

  const getOwnershipTypeLabel = (type: VehicleOwnershipType): string => {
    const labels = {
      'xpress_owned': 'Xpress Owned',
      'fleet_owned': 'Fleet Owned', 
      'operator_owned': 'Operator Owned',
      'driver_owned': 'Driver Owned'
    };
    return labels[type] || type;
  };

  const getMaintenanceStatusColor = (status: 'current' | 'due_soon' | 'overdue'): string => {
    const colors = {
      'current': 'success',
      'due_soon': 'warning', 
      'overdue': 'error'
    };
    return colors[status] || 'default';
  };

  const getUtilizationStatus = (utilization: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (utilization >= 80) return 'excellent';
    if (utilization >= 65) return 'good';
    if (utilization >= 50) return 'fair';
    return 'poor';
  };

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.vehicleCode.toLowerCase().includes(search) ||
        vehicle.licensePlate.toLowerCase().includes(search) ||
        vehicle.make.toLowerCase().includes(search) ||
        vehicle.model.toLowerCase().includes(search) ||
        (vehicle.currentDriverName && vehicle.currentDriverName.toLowerCase().includes(search))
      );
    }

    return filtered;
  }, [vehicles, searchTerm]);

  // Table configuration
  const columns: TableColumn<EnhancedVehicleDashboardItem>[] = [
    {
      key: 'vehicleInfo',
      title: 'Vehicle',
      render: (_, vehicle) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Car className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {vehicle.vehicleCode} • {vehicle.licensePlate}
            </div>
            <div className="text-sm text-gray-500">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'ownershipType',
      title: 'Ownership',
      render: (_, vehicle) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{vehicle.ownershipTypeLabel}</div>
          <div className="text-gray-500">{vehicle.regionName}</div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      render: (_, vehicle) => (
        <div className="space-y-1">
          <StatusBadge 
            status={vehicle.status.replace('_', ' ').toUpperCase()} 
            variant={vehicle.statusColor as any}
          />
          {vehicle.currentDriverName && (
            <div className="text-xs text-gray-500 flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {vehicle.currentDriverName}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'performance',
      title: 'Performance (30d)',
      render: (_, vehicle) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="font-medium">{vehicle.totalTrips30d} trips</span>
          </div>
          <div className="text-xs text-gray-500">
            {vehicle.avgUtilization30d.toFixed(1)}% utilization
          </div>
        </div>
      )
    },
    {
      key: 'maintenance',
      title: 'Maintenance',
      render: (_, vehicle) => (
        <div className="space-y-1">
          <StatusBadge 
            status={vehicle.maintenanceStatus.replace('_', ' ').toUpperCase()}
            variant={vehicle.maintenanceStatusColor as any}
          />
          {vehicle.nextMaintenanceDue && (
            <div className="text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(vehicle.nextMaintenanceDue).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'alerts',
      title: 'Alerts',
      render: (_, vehicle) => {
        const totalAlerts = vehicle.activeMaintenanceAlerts + vehicle.activeComplianceAlerts;
        if (totalAlerts === 0) {
          return <span className="text-gray-400">None</span>;
        }
        return (
          <div className="flex items-center space-x-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="font-medium text-amber-700">{totalAlerts}</span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_, vehicle) => (
        <div className="flex items-center space-x-2">
          <VehicleActionButton
            permissions="view_vehicles_detailed"
            config={{ vehicleId: vehicle.id, ownershipType: vehicle.ownershipType }}
            onClick={() => {
              setSelectedVehicleId(vehicle.id);
              setShowVehicleDetailModal(true);
            }}
            variant="secondary"
            size="sm"
            className="p-2"
            showPermissionIcon={false}
          >
            <Eye className="w-4 h-4" />
          </VehicleActionButton>
          
          <VehicleActionButton
            permissions="update_vehicle_details"
            config={{ vehicleId: vehicle.id, ownershipType: vehicle.ownershipType }}
            onClick={() => {
              setEditingVehicle(vehicle);
              setShowEditVehicleModal(true);
            }}
            onMFARequired={() => {
              setMFAOperation(`Edit Vehicle ${vehicle.vehicleCode}`);
              setShowMFAChallenge(true);
            }}
            variant="secondary"
            size="sm"
            className="p-2"
            showPermissionIcon={false}
          >
            <Edit2 className="w-4 h-4" />
          </VehicleActionButton>
          
          <VehiclePermissionGate 
            permissions="delete_vehicles"
            config={{ vehicleId: vehicle.id, ownershipType: vehicle.ownershipType }}
          >
            <button
              onClick={() => {
                // Handle delete with confirmation
                if (confirm(`Are you sure you want to delete ${vehicle.vehicleCode}?`)) {
                  console.log('Delete vehicle:', vehicle.id);
                }
              }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Vehicle"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </VehiclePermissionGate>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600">Monitor and manage your fleet of vehicles</p>
        </div>
        <div className="flex items-center space-x-3">
          <VehicleAccessLevel 
            config={{ dataClass: 'internal' }}
            showDetails={false}
          />
          
          <Button 
            variant="secondary" 
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          
          <VehiclePermissionGate permissions="export_vehicle_data_anonymized">
            <Button 
              variant="secondary" 
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export
            </Button>
          </VehiclePermissionGate>
          
          <VehicleActionButton
            permissions="create_vehicles"
            config={{ dataClass: 'confidential' }}
            onClick={() => setShowAddVehicleModal(true)}
            onMFARequired={() => {
              setMFAOperation('Create Vehicle');
              setShowMFAChallenge(true);
            }}
            variant="primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </VehicleActionButton>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Vehicles</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalVehicles}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Vehicles</p>
                  <p className="text-3xl font-bold text-green-600">{summary.activeVehicles}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Maintenance</p>
                  <p className="text-3xl font-bold text-amber-600">{summary.vehiclesInMaintenance}</p>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <Wrench className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Alerts</p>
                  <p className="text-3xl font-bold text-red-600">{summary.activeAlerts}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vehicles, license plates, drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="in_service">In Service</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={ownershipFilter}
              onChange={(e) => setOwnershipFilter(e.target.value as VehicleOwnershipType | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Ownership Types</option>
              <option value="xpress_owned">Xpress Owned</option>
              <option value="fleet_owned">Fleet Owned</option>
              <option value="operator_owned">Operator Owned</option>
              <option value="driver_owned">Driver Owned</option>
            </select>

            <select
              value={maintenanceStatusFilter}
              onChange={(e) => setMaintenanceStatusFilter(e.target.value as 'current' | 'due_soon' | 'overdue' | 'all')}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Maintenance Status</option>
              <option value="current">Current</option>
              <option value="due_soon">Due Soon</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={filteredVehicles}
            loading={loading}
            searchPlaceholder="Search vehicles..."
            emptyState={{
              title: "No vehicles found",
              description: "No vehicles match your current filters. Try adjusting your search criteria.",
            }}
          />
        </CardContent>
      </Card>

      {/* Vehicle Detail Modal */}
      <VehicleDetailModal
        vehicleId={selectedVehicleId}
        isOpen={showVehicleDetailModal}
        onClose={() => {
          setShowVehicleDetailModal(false);
          setSelectedVehicleId(null);
        }}
        onEdit={(vehicleId) => {
          const vehicle = vehicles.find(v => v.id === vehicleId);
          if (vehicle) {
            setEditingVehicle(vehicle);
            setShowEditVehicleModal(true);
            setShowVehicleDetailModal(false);
          }
        }}
      />

      {/* Add Vehicle Modal */}
      <VehicleFormModal
        isOpen={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        onSuccess={() => {
          // Refresh the vehicle list
          window.location.reload();
        }}
        mode="create"
      />

      {/* Edit Vehicle Modal */}
      <VehicleFormModal
        isOpen={showEditVehicleModal}
        onClose={() => {
          setShowEditVehicleModal(false);
          setEditingVehicle(null);
        }}
        onSuccess={() => {
          // Refresh the vehicle list
          window.location.reload();
        }}
        mode="edit"
        vehicle={editingVehicle}
      />

      {/* MFA Challenge Modal */}
      <VehicleMFAChallenge
        isOpen={showMFAChallenge}
        onClose={() => {
          setShowMFAChallenge(false);
          setMFAOperation('');
        }}
        onSuccess={() => {
          setShowMFAChallenge(false);
          // Continue with the operation
          if (mfaOperation.includes('Create')) {
            setShowAddVehicleModal(true);
          }
        }}
        operation={mfaOperation}
        vehicleId={editingVehicle?.id}
      />
    </div>
  );
};

export default VehicleManagementPage;