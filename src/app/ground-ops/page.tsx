'use client';

/**
 * Ground Ops - Depot List Page
 * Overview of all depots with vehicle readiness status
 * Built by Agent 10 - Critical Frontend UI Developer
 */

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Car,
  Users,
  Wrench,
  ChevronRight,
  MapPin,
  Activity,
  Search,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGroundOpsStore, Depot } from '@/stores/groundOpsStore';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useRouter } from 'next/navigation';

// Mock depot data
const MOCK_DEPOTS: Depot[] = [
  {
    id: 'depot-1',
    name: 'Makati Central Depot',
    location: 'Makati City, Metro Manila',
    region: 'District 1',
    status: 'operational',
    vehicleCount: 45,
    availableVehicles: 32,
    maintenanceVehicles: 3,
    supervisorId: 'SUP-001',
    supervisorName: 'Maria Santos',
  },
  {
    id: 'depot-2',
    name: 'BGC Operations Hub',
    location: 'Bonifacio Global City, Taguig',
    region: 'District 1',
    status: 'operational',
    vehicleCount: 38,
    availableVehicles: 28,
    maintenanceVehicles: 2,
    supervisorId: 'SUP-002',
    supervisorName: 'John Cruz',
  },
  {
    id: 'depot-3',
    name: 'Quezon City Depot',
    location: 'Quezon City, Metro Manila',
    region: 'District 2',
    status: 'operational',
    vehicleCount: 52,
    availableVehicles: 41,
    maintenanceVehicles: 5,
    supervisorId: 'SUP-003',
    supervisorName: 'Ana Reyes',
  },
  {
    id: 'depot-4',
    name: 'Pasig Service Center',
    location: 'Pasig City, Metro Manila',
    region: 'District 3',
    status: 'limited',
    vehicleCount: 30,
    availableVehicles: 18,
    maintenanceVehicles: 8,
    supervisorId: 'SUP-004',
    supervisorName: 'Carlos Garcia',
  },
  {
    id: 'depot-5',
    name: 'Manila Bay Depot',
    location: 'Manila, Metro Manila',
    region: 'District 4',
    status: 'operational',
    vehicleCount: 42,
    availableVehicles: 35,
    maintenanceVehicles: 2,
    supervisorId: 'SUP-005',
    supervisorName: 'Lisa Tan',
  },
];

const GroundOpsPage = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'operational' | 'limited' | 'closed'>('all');

  const { depots, setDepots, selectDepot } = useGroundOpsStore();

  // Check feature flag
  useEffect(() => {
    setIsClient(true);
    if (!isFeatureEnabled('groundOps')) {
      router.push('/dashboard');
    }
  }, [router]);

  // Load depot data
  useEffect(() => {
    if (!isClient) return;
    setDepots(MOCK_DEPOTS);
  }, [isClient, setDepots]);

  // Filter depots
  const filteredDepots = depots.filter(depot => {
    const matchesSearch = depot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         depot.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || depot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate totals
  const totalVehicles = depots.reduce((sum, d) => sum + d.vehicleCount, 0);
  const totalAvailable = depots.reduce((sum, d) => sum + d.availableVehicles, 0);
  const totalMaintenance = depots.reduce((sum, d) => sum + d.maintenanceVehicles, 0);
  const overallUtilization = totalVehicles > 0
    ? Math.round((totalAvailable / totalVehicles) * 100)
    : 0;

  const handleDepotClick = (depot: Depot) => {
    selectDepot(depot);
    router.push(`/ground-ops/depot/${depot.id}`);
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
            <Building2 className="h-8 w-8 text-blue-600" />
            Ground Operations
          </h1>
          <p className="text-gray-600 mt-1">
            Depot management and vehicle readiness • {depots.length} depots active
          </p>
        </div>

        <Button
          onClick={() => router.push('/ground-ops/roll-call')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          Roll Call
        </Button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Fleet</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{totalVehicles}</h3>
                <p className="text-sm text-gray-600 mt-1">Across {depots.length} depots</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{totalAvailable}</h3>
                <p className="text-sm text-green-600 mt-1">Ready for dispatch</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Maintenance</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{totalMaintenance}</h3>
                <p className="text-sm text-yellow-600 mt-1">Under repair</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fleet Utilization</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{overallUtilization}%</h3>
                <p className="text-sm text-purple-600 mt-1">Target: 80%</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600" />
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
                placeholder="Search depots by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="operational">Operational</option>
                <option value="limited">Limited</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Depot List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDepots.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No depots found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredDepots.map((depot) => (
            <Card
              key={depot.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleDepotClick(depot)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{depot.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      {depot.location}
                    </div>
                  </div>
                  <Badge
                    variant={
                      depot.status === 'operational'
                        ? 'default'
                        : depot.status === 'limited'
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {depot.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  {/* Vehicle Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-blue-600">{depot.vehicleCount}</p>
                      <p className="text-xs text-gray-600">Total</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-green-600">{depot.availableVehicles}</p>
                      <p className="text-xs text-gray-600">Available</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-2xl font-bold text-yellow-600">{depot.maintenanceVehicles}</p>
                      <p className="text-xs text-gray-600">Maintenance</p>
                    </div>
                  </div>

                  {/* Supervisor */}
                  {depot.supervisorName && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>Supervisor: {depot.supervisorName}</span>
                      </div>
                    </div>
                  )}

                  {/* View Details Button */}
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDepotClick(depot);
                    }}
                  >
                    View Details
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default GroundOpsPage;
