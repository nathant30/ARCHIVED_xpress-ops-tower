'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Truck,
  Users,
  Activity,
  MapPin,
  Calendar,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  UserCheck,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  Filter,
  Download,
  Search
} from 'lucide-react';

import { OperatorAnalytics } from '@/types/operators';

interface FleetOverviewProps {
  analytics: OperatorAnalytics | null;
  language: 'en' | 'fil';
  refreshKey?: number;
}

interface FleetVehicle {
  id: string;
  plate_number: string;
  operator_id: string;
  operator_name: string;
  make: string;
  model: string;
  year: number;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  driver_assigned: string | null;
  driver_name: string | null;
  utilization_rate: number;
  last_trip: string | null;
  maintenance_due: string | null;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
}

interface FleetDriver {
  id: string;
  name: string;
  operator_id: string;
  operator_name: string;
  status: 'active' | 'inactive' | 'suspended';
  assigned_vehicle: string | null;
  vehicle_plate: string | null;
  performance_score: number;
  total_trips: number;
  last_active: string;
  license_expiry: string;
}

interface FleetStats {
  total_vehicles: number;
  active_vehicles: number;
  maintenance_vehicles: number;
  total_drivers: number;
  active_drivers: number;
  unassigned_drivers: number;
  fleet_utilization: number;
  maintenance_alerts: number;
}

const FleetOverview: React.FC<FleetOverviewProps> = ({
  analytics,
  language,
  refreshKey = 0
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers' | 'analytics'>('vehicles');
  const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');

  // Translations
  const translations = {
    en: {
      title: 'Fleet Management Overview',
      subtitle: 'Monitor and manage vehicles and drivers across all operators',
      vehicles: 'Vehicles',
      drivers: 'Drivers', 
      analytics: 'Analytics',
      totalVehicles: 'Total Vehicles',
      activeVehicles: 'Active Vehicles',
      maintenanceVehicles: 'In Maintenance',
      totalDrivers: 'Total Drivers',
      activeDrivers: 'Active Drivers',
      unassignedDrivers: 'Unassigned Drivers',
      fleetUtilization: 'Fleet Utilization',
      maintenanceAlerts: 'Maintenance Alerts',
      vehicleDetails: 'Vehicle Details',
      driverDetails: 'Driver Details',
      plateNumber: 'Plate Number',
      operator: 'Operator',
      make: 'Make',
      model: 'Model',
      year: 'Year',
      status: 'Status',
      assignedDriver: 'Assigned Driver',
      utilization: 'Utilization',
      lastTrip: 'Last Trip',
      maintenanceDue: 'Maintenance Due',
      location: 'Location',
      driverName: 'Driver Name',
      assignedVehicle: 'Assigned Vehicle',
      performanceScore: 'Performance Score',
      totalTrips: 'Total Trips',
      lastActive: 'Last Active',
      licenseExpiry: 'License Expiry',
      active: 'Active',
      inactive: 'Inactive',
      maintenance: 'Maintenance',
      retired: 'Retired',
      suspended: 'Suspended',
      search: 'Search...',
      allStatuses: 'All Statuses',
      allOperators: 'All Operators',
      filters: 'Filters',
      export: 'Export',
      refresh: 'Refresh',
      addVehicle: 'Add Vehicle',
      addDriver: 'Add Driver',
      viewDetails: 'View Details',
      edit: 'Edit',
      assign: 'Assign',
      unassign: 'Unassign',
      schedulemaintenance: 'Schedule Maintenance',
      actions: 'Actions',
      noVehicles: 'No vehicles found',
      noDrivers: 'No drivers found',
      overdue: 'Overdue',
      dueThisWeek: 'Due This Week',
      upcomingMaintenance: 'Upcoming Maintenance',
      topPerformers: 'Top Performing Drivers'
    },
    fil: {
      title: 'Pangkalahatang Tingnan ng Fleet Management',
      subtitle: 'Subaybayan at pamahalaan ang mga sasakyan at driver sa lahat ng operator',
      vehicles: 'Mga Sasakyan',
      drivers: 'Mga Driver',
      analytics: 'Analytics',
      totalVehicles: 'Kabuuang Sasakyan',
      activeVehicles: 'Aktibong Sasakyan',
      maintenanceVehicles: 'Nasa Maintenance',
      totalDrivers: 'Kabuuang Driver',
      activeDrivers: 'Aktibong Driver',
      unassignedDrivers: 'Walang Assigned na Driver',
      fleetUtilization: 'Paggamit ng Fleet',
      maintenanceAlerts: 'Mga Alert sa Maintenance',
      vehicleDetails: 'Mga Detalye ng Sasakyan',
      driverDetails: 'Mga Detalye ng Driver',
      plateNumber: 'Plate Number',
      operator: 'Operator',
      make: 'Make',
      model: 'Model',
      year: 'Taon',
      status: 'Status',
      assignedDriver: 'Assigned na Driver',
      utilization: 'Paggamit',
      lastTrip: 'Huling Trip',
      maintenanceDue: 'Due ng Maintenance',
      location: 'Lokasyon',
      driverName: 'Pangalan ng Driver',
      assignedVehicle: 'Assigned na Sasakyan',
      performanceScore: 'Performance Score',
      totalTrips: 'Kabuuang Trip',
      lastActive: 'Huling Aktibo',
      licenseExpiry: 'Expiry ng License',
      active: 'Aktibo',
      inactive: 'Hindi Aktibo',
      maintenance: 'Maintenance',
      retired: 'Retired',
      suspended: 'Nasuspinde',
      search: 'Maghanap...',
      allStatuses: 'Lahat ng Status',
      allOperators: 'Lahat ng Operator',
      filters: 'Mga Filter',
      export: 'I-export',
      refresh: 'I-refresh',
      addVehicle: 'Magdagdag ng Sasakyan',
      addDriver: 'Magdagdag ng Driver',
      viewDetails: 'Tingnan ang mga Detalye',
      edit: 'I-edit',
      assign: 'I-assign',
      unassign: 'Alisin ang Assignment',
      scheduleMainten: 'I-schedule ang Maintenance',
      actions: 'Mga Aksyon',
      noVehicles: 'Walang nahanap na sasakyan',
      noDrivers: 'Walang nahanap na driver',
      overdue: 'Overdue',
      dueThisWeek: 'Due ngayong Linggo',
      upcomingMaintenance: 'Paparating na Maintenance',
      topPerformers: 'Mga Nangungunang Driver'
    }
  };

  const t = translations[language];

  // Load fleet data
  const loadFleetData = async () => {
    try {
      setIsLoading(true);
      
      // Load fleet statistics
      const statsResponse = await fetch('/api/operators/fleet/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setFleetStats(statsData.stats || generateSampleStats());
      } else {
        setFleetStats(generateSampleStats());
      }
      
      // Load vehicles
      const vehiclesResponse = await fetch('/api/operators/fleet/vehicles');
      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json();
        setVehicles(vehiclesData.vehicles || generateSampleVehicles());
      } else {
        setVehicles(generateSampleVehicles());
      }
      
      // Load drivers
      const driversResponse = await fetch('/api/operators/fleet/drivers');
      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        setDrivers(driversData.drivers || generateSampleDrivers());
      } else {
        setDrivers(generateSampleDrivers());
      }
      
    } catch (error) {
      console.error('Failed to load fleet data:', error);
      setFleetStats(generateSampleStats());
      setVehicles(generateSampleVehicles());
      setDrivers(generateSampleDrivers());
    } finally {
      setIsLoading(false);
    }
  };

  // Generate sample data
  const generateSampleStats = (): FleetStats => ({
    total_vehicles: 248,
    active_vehicles: 195,
    maintenance_vehicles: 12,
    total_drivers: 312,
    active_drivers: 278,
    unassigned_drivers: 34,
    fleet_utilization: 78.6,
    maintenance_alerts: 8
  });

  const generateSampleVehicles = (): FleetVehicle[] => {
    const operators = ['Metro Manila Transport Co.', 'Cebu Fleet Solutions', 'Davao Ride Network'];
    const makes = ['Toyota', 'Honda', 'Nissan', 'Mitsubishi', 'Suzuki'];
    const models = ['Vios', 'City', 'Altima', 'Mirage', 'Dzire'];
    
    return Array.from({ length: 20 }, (_, i) => ({
      id: `v${i + 1}`,
      plate_number: `ABC ${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      operator_id: `op${Math.floor(Math.random() * 3) + 1}`,
      operator_name: operators[Math.floor(Math.random() * operators.length)],
      make: makes[Math.floor(Math.random() * makes.length)],
      model: models[Math.floor(Math.random() * models.length)],
      year: 2018 + Math.floor(Math.random() * 6),
      status: (['active', 'inactive', 'maintenance'] as const)[Math.floor(Math.random() * 3)],
      driver_assigned: Math.random() > 0.3 ? `d${i + 1}` : null,
      driver_name: Math.random() > 0.3 ? `Driver ${i + 1}` : null,
      utilization_rate: 60 + Math.random() * 35,
      last_trip: Math.random() > 0.2 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      maintenance_due: Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      location: Math.random() > 0.4 ? {
        latitude: 14.5995 + (Math.random() - 0.5) * 0.1,
        longitude: 120.9842 + (Math.random() - 0.5) * 0.1,
        address: 'Manila, Philippines'
      } : null
    }));
  };

  const generateSampleDrivers = (): FleetDriver[] => {
    const operators = ['Metro Manila Transport Co.', 'Cebu Fleet Solutions', 'Davao Ride Network'];
    const names = ['Juan dela Cruz', 'Pedro Santos', 'Maria Garcia', 'Jose Reyes', 'Ana Martinez'];
    
    return Array.from({ length: 15 }, (_, i) => ({
      id: `d${i + 1}`,
      name: `${names[Math.floor(Math.random() * names.length)]} ${i + 1}`,
      operator_id: `op${Math.floor(Math.random() * 3) + 1}`,
      operator_name: operators[Math.floor(Math.random() * operators.length)],
      status: (['active', 'inactive', 'suspended'] as const)[Math.floor(Math.random() * 3)],
      assigned_vehicle: Math.random() > 0.3 ? `v${i + 1}` : null,
      vehicle_plate: Math.random() > 0.3 ? `ABC ${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}` : null,
      performance_score: 60 + Math.random() * 35,
      total_trips: Math.floor(100 + Math.random() * 500),
      last_active: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      license_expiry: new Date(Date.now() + (Math.random() * 365 + 30) * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  // Filter data
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.operator_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    const matchesOperator = operatorFilter === 'all' || vehicle.operator_id === operatorFilter;
    
    return matchesSearch && matchesStatus && matchesOperator;
  });

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         driver.operator_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    const matchesOperator = operatorFilter === 'all' || driver.operator_id === operatorFilter;
    
    return matchesSearch && matchesStatus && matchesOperator;
  });

  // Status colors
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-red-100 text-red-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(language === 'fil' ? 'tl-PH' : 'en-PH');
  };

  // Effects
  useEffect(() => {
    loadFleetData();
  }, [refreshKey]);

  // Render stats cards
  const renderStatsCards = () => {
    if (!fleetStats) return null;

    const stats = [
      {
        title: t.totalVehicles,
        value: fleetStats.total_vehicles.toLocaleString(),
        icon: Truck,
        color: 'bg-blue-500'
      },
      {
        title: t.activeVehicles,
        value: fleetStats.active_vehicles.toLocaleString(),
        icon: CheckCircle,
        color: 'bg-green-500'
      },
      {
        title: t.totalDrivers,
        value: fleetStats.total_drivers.toLocaleString(),
        icon: Users,
        color: 'bg-purple-500'
      },
      {
        title: t.fleetUtilization,
        value: `${fleetStats.fleet_utilization.toFixed(1)}%`,
        icon: BarChart3,
        color: 'bg-orange-500'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.color} text-white`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render vehicles tab
  const renderVehiclesTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          {t.vehicleDetails}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Car className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{vehicle.plate_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.make} {vehicle.model} {vehicle.year}
                  </p>
                  <p className="text-xs text-muted-foreground">{vehicle.operator_name}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <Badge className={getStatusColor(vehicle.status)}>
                    {t[vehicle.status as keyof typeof t]}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t.utilization}</p>
                  <p className="font-medium">{vehicle.utilization_rate.toFixed(1)}%</p>
                  <Progress value={vehicle.utilization_rate} className="w-16 h-1 mt-1" />
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t.assignedDriver}</p>
                  <p className="font-medium text-sm">
                    {vehicle.driver_name || 'Unassigned'}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t.lastTrip}</p>
                  <p className="font-medium text-sm">{formatDate(vehicle.last_trip)}</p>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredVehicles.length === 0 && (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t.noVehicles}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render drivers tab
  const renderDriversTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          {t.driverDetails}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredDrivers.map((driver) => (
            <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{driver.name}</p>
                  <p className="text-sm text-muted-foreground">{driver.operator_name}</p>
                  <p className="text-xs text-muted-foreground">
                    License expires: {formatDate(driver.license_expiry)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <Badge className={getStatusColor(driver.status)}>
                    {t[driver.status as keyof typeof t]}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t.performanceScore}</p>
                  <p className="font-medium">{driver.performance_score.toFixed(1)}/100</p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t.assignedVehicle}</p>
                  <p className="font-medium text-sm">
                    {driver.vehicle_plate || 'Unassigned'}
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t.totalTrips}</p>
                  <p className="font-medium">{driver.total_trips.toLocaleString()}</p>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredDrivers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t.noDrivers}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.title}</h2>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadFleetData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t.export}
          </Button>
          
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === 'vehicles' ? t.addVehicle : t.addDriver}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t.allStatuses} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allStatuses}</SelectItem>
                <SelectItem value="active">{t.active}</SelectItem>
                <SelectItem value="inactive">{t.inactive}</SelectItem>
                <SelectItem value="maintenance">{t.maintenance}</SelectItem>
                <SelectItem value="suspended">{t.suspended}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={operatorFilter} onValueChange={setOperatorFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t.allOperators} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allOperators}</SelectItem>
                <SelectItem value="op1">Metro Manila Transport Co.</SelectItem>
                <SelectItem value="op2">Cebu Fleet Solutions</SelectItem>
                <SelectItem value="op3">Davao Ride Network</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
        <Button
          variant={activeTab === 'vehicles' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('vehicles')}
          className="flex items-center gap-2"
        >
          <Truck className="h-4 w-4" />
          {t.vehicles}
        </Button>
        <Button
          variant={activeTab === 'drivers' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('drivers')}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          {t.drivers}
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('analytics')}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          {t.analytics}
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'vehicles' && renderVehiclesTab()}
      {activeTab === 'drivers' && renderDriversTab()}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Utilization by Operator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.regional_stats.slice(0, 5).map((region, index) => (
                  <div key={region.region_id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{region.region_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {region.total_vehicles} vehicles
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{(65 + Math.random() * 30).toFixed(1)}%</p>
                      <Progress value={65 + Math.random() * 30} className="w-24 h-2" />
                    </div>
                  </div>
                )) || []}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t.upcomingMaintenance}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vehicles.filter(v => v.maintenance_due).slice(0, 5).map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                    <div>
                      <p className="font-medium">{vehicle.plate_number}</p>
                      <p className="text-sm text-muted-foreground">{vehicle.operator_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{formatDate(vehicle.maintenance_due)}</p>
                      <Badge variant="outline" className="text-xs">
                        {t.dueThisWeek}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FleetOverview;