'use client';

/**
 * Dashcam Footage Viewer Page
 * View and manage dashcam footage with incident linking
 * Built by Agent 14 - Remaining UI Modules Developer
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Video,
  Car,
  User,
  Clock,
  Download,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  Play,
  Eye,
  Link2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useRouter } from 'next/navigation';

interface DashcamFootage {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId: string;
  driverName: string;
  timestamp: string;
  duration: number; // in seconds
  fileSize: number; // in MB
  incidentId?: string;
  location: string;
  type: 'routine' | 'incident' | 'emergency';
  videoUrl?: string;
  thumbnailUrl?: string;
}

// Mock dashcam footage data
const MOCK_FOOTAGE: DashcamFootage[] = [
  {
    id: 'CAM-2026-001',
    vehicleId: 'V-098',
    vehiclePlate: 'ABC 1234',
    driverId: 'D-0234',
    driverName: 'Juan dela Cruz',
    timestamp: '2026-02-03T14:30:00',
    duration: 180,
    fileSize: 245,
    type: 'routine',
    location: 'EDSA, Makati City',
    videoUrl: '#',
    thumbnailUrl: '#',
  },
  {
    id: 'CAM-2026-002',
    vehicleId: 'V-125',
    vehiclePlate: 'XYZ 5678',
    driverId: 'D-0445',
    driverName: 'Maria Santos',
    timestamp: '2026-02-03T10:15:00',
    duration: 120,
    fileSize: 165,
    incidentId: 'INC-2026-045',
    type: 'incident',
    location: 'Ayala Avenue, Makati City',
    videoUrl: '#',
    thumbnailUrl: '#',
  },
  {
    id: 'CAM-2026-003',
    vehicleId: 'V-234',
    vehiclePlate: 'DEF 9012',
    driverId: 'D-0789',
    driverName: 'Pedro Reyes',
    timestamp: '2026-02-02T16:45:00',
    duration: 300,
    fileSize: 420,
    type: 'routine',
    location: 'BGC, Taguig City',
    videoUrl: '#',
    thumbnailUrl: '#',
  },
  {
    id: 'CAM-2026-004',
    vehicleId: 'V-098',
    vehiclePlate: 'ABC 1234',
    driverId: 'D-0234',
    driverName: 'Juan dela Cruz',
    timestamp: '2026-02-02T09:20:00',
    duration: 60,
    fileSize: 85,
    incidentId: 'INC-2026-023',
    type: 'emergency',
    location: 'Roxas Boulevard, Manila',
    videoUrl: '#',
    thumbnailUrl: '#',
  },
  {
    id: 'CAM-2026-005',
    vehicleId: 'V-456',
    vehiclePlate: 'GHI 3456',
    driverId: 'D-1023',
    driverName: 'Ana Garcia',
    timestamp: '2026-02-01T18:30:00',
    duration: 240,
    fileSize: 330,
    type: 'routine',
    location: 'Quezon Avenue, Quezon City',
    videoUrl: '#',
    thumbnailUrl: '#',
  },
  {
    id: 'CAM-2026-006',
    vehicleId: 'V-567',
    vehiclePlate: 'JKL 7890',
    driverId: 'D-1156',
    driverName: 'Carlos Mendoza',
    timestamp: '2026-02-01T12:00:00',
    duration: 150,
    fileSize: 205,
    incidentId: 'INC-2026-012',
    type: 'incident',
    location: 'Commonwealth Avenue, Quezon City',
    videoUrl: '#',
    thumbnailUrl: '#',
  },
];

const DashcamFootagePage = () => {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [footage, setFootage] = useState<DashcamFootage[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | DashcamFootage['type']>('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedFootage, setSelectedFootage] = useState<DashcamFootage | null>(null);

  useEffect(() => {
    setIsClient(true);
    if (!isFeatureEnabled('dashcam')) {
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (!isClient) return;
    setFootage(MOCK_FOOTAGE);
  }, [isClient]);

  // Get unique vehicles and drivers for filters
  const vehicles = useMemo(() => {
    return Array.from(new Set(footage.map(f => `${f.vehicleId}|${f.vehiclePlate}`))).map(v => {
      const [id, plate] = v.split('|');
      return { id, plate };
    });
  }, [footage]);

  const drivers = useMemo(() => {
    return Array.from(new Set(footage.map(f => `${f.driverId}|${f.driverName}`))).map(d => {
      const [id, name] = d.split('|');
      return { id, name };
    });
  }, [footage]);

  // Filter footage
  const filteredFootage = useMemo(() => {
    return footage.filter(item => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesVehicle = vehicleFilter === 'all' || item.vehicleId === vehicleFilter;
      const matchesDriver = driverFilter === 'all' || item.driverId === driverFilter;
      const matchesSearch = searchTerm === '' ||
        item.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesDateRange = true;
      if (dateRange.start) {
        matchesDateRange = matchesDateRange && item.timestamp >= dateRange.start;
      }
      if (dateRange.end) {
        matchesDateRange = matchesDateRange && item.timestamp <= dateRange.end;
      }

      return matchesType && matchesVehicle && matchesDriver && matchesSearch && matchesDateRange;
    });
  }, [footage, typeFilter, vehicleFilter, driverFilter, searchTerm, dateRange]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalFootage: footage.length,
      routine: footage.filter(f => f.type === 'routine').length,
      incident: footage.filter(f => f.type === 'incident').length,
      emergency: footage.filter(f => f.type === 'emergency').length,
      totalSize: footage.reduce((sum, f) => sum + f.fileSize, 0),
      linkedToIncidents: footage.filter(f => f.incidentId).length,
    };
  }, [footage]);

  const clearFilters = () => {
    setTypeFilter('all');
    setVehicleFilter('all');
    setDriverFilter('all');
    setSearchTerm('');
    setDateRange({ start: '', end: '' });
  };

  const getTypeBadge = (type: DashcamFootage['type']) => {
    switch (type) {
      case 'routine':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Routine</Badge>;
      case 'incident':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Incident</Badge>;
      case 'emergency':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Emergency</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadFootage = (footageId: string) => {
    console.log('Download footage:', footageId);
    // In a real app, this would trigger a download
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
            <Video className="h-8 w-8 text-red-600" />
            Dashcam Footage
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage dashcam recordings • {footage.length} total recordings
          </p>
        </div>
      </div>

      {/* Stats KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Footage</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.totalFootage}</h3>
              </div>
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Video className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Routine</p>
                <h3 className="text-2xl font-bold text-blue-600 mt-2">{stats.routine}</h3>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Incident</p>
                <h3 className="text-2xl font-bold text-yellow-600 mt-2">{stats.incident}</h3>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Emergency</p>
                <h3 className="text-2xl font-bold text-red-600 mt-2">{stats.emergency}</h3>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Size</p>
                <h3 className="text-2xl font-bold text-purple-600 mt-2">{(stats.totalSize / 1024).toFixed(1)} GB</h3>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Video className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Linked</p>
                <h3 className="text-2xl font-bold text-green-600 mt-2">{stats.linkedToIncidents}</h3>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Link2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by vehicle, driver, location, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-gray-600" />

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="routine">Routine</option>
                  <option value="incident">Incident</option>
                  <option value="emergency">Emergency</option>
                </select>

                <select
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Vehicles</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate}</option>
                  ))}
                </select>

                <select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Drivers</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>

                {(typeFilter !== 'all' || vehicleFilter !== 'all' || driverFilter !== 'all' || searchTerm !== '' || dateRange.start || dateRange.end) && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">Date Range:</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-600">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footage Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dashcam Recordings ({filteredFootage.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFootage.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No footage found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Vehicle</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Driver</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date/Time</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Duration</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Type</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Incident</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFootage.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <span className="font-mono font-semibold text-gray-900">{item.id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{item.vehiclePlate}</p>
                            <p className="text-xs text-gray-500">{item.vehicleId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{item.driverName}</p>
                            <p className="text-xs text-gray-500">{item.driverId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{formatDateTime(item.timestamp)}</p>
                          <p className="text-xs text-gray-500">{item.location}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="font-mono text-sm text-gray-900">{formatDuration(item.duration)}</span>
                        </div>
                        <p className="text-xs text-gray-500">{item.fileSize} MB</p>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getTypeBadge(item.type)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {item.incidentId ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => router.push(`/incidents/${item.incidentId}`)}
                          >
                            <Link2 className="h-3 w-3" />
                            {item.incidentId}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => setSelectedFootage(item)}
                          >
                            <Play className="h-3 w-3" />
                            Play
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-2"
                            onClick={() => downloadFootage(item.id)}
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      {selectedFootage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Video Player - {selectedFootage.id}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setSelectedFootage(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-900 aspect-video rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Video Player Component</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {selectedFootage.vehiclePlate} • {selectedFootage.driverName}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatDateTime(selectedFootage.timestamp)} • {formatDuration(selectedFootage.duration)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Location: {selectedFootage.location}</p>
                    {selectedFootage.incidentId && (
                      <p className="text-sm text-gray-600">Incident: {selectedFootage.incidentId}</p>
                    )}
                  </div>
                  <Button onClick={() => downloadFootage(selectedFootage.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashcamFootagePage;
