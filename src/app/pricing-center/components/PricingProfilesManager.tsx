'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Car,
  Settings,
  BarChart3,
  Eye,
  Calendar,
  MapPin,
  RefreshCw,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Region {
  id: string;
  name: string;
  code: string;
  status: string;
  country_code: string;
  timezone: string;
  currency: string;
  description?: string;
  cities: string[];
  active_profiles_count: number;
  total_profiles_count: number;
}

interface PricingProfile {
  id: string;
  name: string;
  description?: string;
  serviceKey: string;
  regionId: string;
  region?: Region; // Populated region data
  status: 'draft' | 'active' | 'suspended' | 'expired';
  regulatorStatus?: 'pending' | 'approved' | 'rejected';
  regulatorRef?: string;
  baseFare: number;
  perKm: number;
  perMinute: number;
  bookingFee: number;
  airportSurcharge: number;
  poiSurcharge: number;
  tollPassthrough: boolean;
  driverCommissionPct: number;
  fleetCommissionPct?: number;
  aiHealthScore: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export function PricingProfilesManager() {
  const [profiles, setProfiles] = useState<PricingProfile[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PricingProfile | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serviceKey: 'tnvs',
    regionId: 'NCR',
    baseFare: 50.0,
    perKm: 12.0,
    perMinute: 2.0,
    bookingFee: 10.0,
    airportSurcharge: 0.0,
    poiSurcharge: 0.0,
    tollPassthrough: true,
    driverCommissionPct: 85.0,
    fleetCommissionPct: 15.0
  });

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    if (!regionsLoading && regions.length > 0) {
      fetchProfiles();
    }
  }, [regions, regionsLoading]);

  const fetchRegions = async () => {
    setRegionsLoading(true);
    try {
      const response = await fetch('/api/v1/regions');
      const result = await response.json();
      if (result.success && result.data?.regions) {
        setRegions(result.data.regions);
      } else {
        setRegions([]);
      }
    } catch (error) {
      console.error('Error fetching regions:', error);
      setRegions([]);
    } finally {
      setRegionsLoading(false);
    }
  };

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/pricing/profiles');
      const data = await response.json();
      const profilesArray = Array.isArray(data) ? data : [];
      
      // Enrich profiles with region data
      const enrichedProfiles = profilesArray.map(profile => ({
        ...profile,
        region: regions.find(r => r.id === profile.regionId) || {
          id: profile.regionId,
          name: profile.regionId,
          code: profile.regionId,
          status: 'unknown',
          country_code: 'PH',
          timezone: 'Asia/Manila',
          currency: 'PHP',
          cities: [],
          active_profiles_count: 0,
          total_profiles_count: 0
        }
      }));
      
      setProfiles(enrichedProfiles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async () => {
    try {
      const response = await fetch('/api/v1/pricing/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchProfiles();
        setShowCreateModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(`Error creating profile: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Failed to create profile');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      serviceKey: 'tnvs',
      regionId: 'NCR',
      baseFare: 50.0,
      perKm: 12.0,
      perMinute: 2.0,
      bookingFee: 10.0,
      airportSurcharge: 0.0,
      poiSurcharge: 0.0,
      tollPassthrough: true,
      driverCommissionPct: 85.0,
      fleetCommissionPct: 15.0
    });
  };

  // Filter profiles based on search and filters
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (profile.description && profile.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (profile.region?.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || profile.status === statusFilter;
    const matchesService = serviceFilter === 'all' || profile.serviceKey === serviceFilter;
    const matchesRegion = regionFilter === 'all' || profile.regionId === regionFilter;
    
    return matchesSearch && matchesStatus && matchesService && matchesRegion;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'draft': return 'text-yellow-600 bg-yellow-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getServiceIcon = (serviceKey: string) => {
    switch (serviceKey) {
      case 'tnvs': return <Car className="h-4 w-4" />;
      case 'taxi': return <Car className="h-4 w-4" />;
      case 'special': return <Settings className="h-4 w-4" />;
      default: return <Car className="h-4 w-4" />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pricing Profiles Management</h2>
            <p className="text-gray-600 mt-1">Create and manage service-specific pricing configurations</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={fetchProfiles}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Pricing Profile</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Profile Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., TNVS Standard - Metro Manila"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serviceKey">Service Type</Label>
                      <Select value={formData.serviceKey} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, serviceKey: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tnvs">TNVS (Transport Network Vehicle Service)</SelectItem>
                          <SelectItem value="taxi">Traditional Taxi</SelectItem>
                          <SelectItem value="special">Special Hire Vehicle</SelectItem>
                          <SelectItem value="pop">Public Utility Vehicle</SelectItem>
                          <SelectItem value="twg">Two/Three Wheeler</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this pricing profile's purpose and scope"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="regionId">Region</Label>
                    <Select value={formData.regionId} onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, regionId: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regionsLoading ? (
                          <SelectItem value="loading" disabled>Loading regions...</SelectItem>
                        ) : regions.length === 0 ? (
                          <SelectItem value="no-regions" disabled>No regions available</SelectItem>
                        ) : (
                          regions.map(region => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.name} ({region.code}) - {region.active_profiles_count} active profiles
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {formData.regionId && !regionsLoading && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-md">
                        {(() => {
                          const selectedRegion = regions.find(r => r.id === formData.regionId);
                          return selectedRegion ? (
                            <div className="text-sm">
                              <div className="font-medium text-blue-900">{selectedRegion.name}</div>
                              <div className="text-blue-700">{selectedRegion.description}</div>
                              <div className="text-blue-600 mt-1">
                                <span className="font-medium">Cities:</span> {selectedRegion.cities.slice(0, 3).join(', ')}
                                {selectedRegion.cities.length > 3 && ` +${selectedRegion.cities.length - 3} more`}
                              </div>
                              <div className="text-blue-600 mt-1">
                                <span className="font-medium">Currency:</span> {selectedRegion.currency} | 
                                <span className="font-medium"> Timezone:</span> {selectedRegion.timezone}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Pricing Structure */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Pricing Structure</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="baseFare">Base Fare (₱)</Label>
                        <Input
                          id="baseFare"
                          type="number"
                          step="0.01"
                          value={formData.baseFare}
                          onChange={(e) => setFormData(prev => ({ ...prev, baseFare: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="perKm">Per Kilometer (₱)</Label>
                        <Input
                          id="perKm"
                          type="number"
                          step="0.01"
                          value={formData.perKm}
                          onChange={(e) => setFormData(prev => ({ ...prev, perKm: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="perMinute">Per Minute (₱)</Label>
                        <Input
                          id="perMinute"
                          type="number"
                          step="0.01"
                          value={formData.perMinute}
                          onChange={(e) => setFormData(prev => ({ ...prev, perMinute: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="bookingFee">Booking Fee (₱)</Label>
                        <Input
                          id="bookingFee"
                          type="number"
                          step="0.01"
                          value={formData.bookingFee}
                          onChange={(e) => setFormData(prev => ({ ...prev, bookingFee: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="airportSurcharge">Airport Surcharge (₱)</Label>
                        <Input
                          id="airportSurcharge"
                          type="number"
                          step="0.01"
                          value={formData.airportSurcharge}
                          onChange={(e) => setFormData(prev => ({ ...prev, airportSurcharge: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="poiSurcharge">POI Surcharge (₱)</Label>
                        <Input
                          id="poiSurcharge"
                          type="number"
                          step="0.01"
                          value={formData.poiSurcharge}
                          onChange={(e) => setFormData(prev => ({ ...prev, poiSurcharge: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Revenue Sharing */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Revenue Sharing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="driverCommissionPct">Driver Commission (%)</Label>
                        <Input
                          id="driverCommissionPct"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={formData.driverCommissionPct}
                          onChange={(e) => setFormData(prev => ({ ...prev, driverCommissionPct: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="fleetCommissionPct">Fleet Commission (%)</Label>
                        <Input
                          id="fleetCommissionPct"
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={formData.fleetCommissionPct}
                          onChange={(e) => setFormData(prev => ({ ...prev, fleetCommissionPct: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Additional Settings</h3>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="tollPassthrough"
                        checked={formData.tollPassthrough}
                        onChange={(e) => setFormData(prev => ({ ...prev, tollPassthrough: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="tollPassthrough">Pass through toll charges to passenger</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProfile} disabled={!formData.name}>
                    Create Profile
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search profiles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="tnvs">TNVS</SelectItem>
              <SelectItem value="taxi">Taxi</SelectItem>
              <SelectItem value="special">Special Hire</SelectItem>
              <SelectItem value="pop">PUV</SelectItem>
              <SelectItem value="twg">Two/Three Wheeler</SelectItem>
            </SelectContent>
          </Select>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map(region => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name} ({region.active_profiles_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Profiles List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading profiles...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pricing profiles found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || serviceFilter !== 'all' 
                ? 'No profiles match your current filters.' 
                : 'Get started by creating your first pricing profile.'}
            </p>
            {(!searchTerm && statusFilter === 'all' && serviceFilter === 'all') && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Profile
              </Button>
            )}
          </div>
        ) : (
          filteredProfiles.map((profile) => (
            <div key={profile.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {getServiceIcon(profile.serviceKey)}
                      <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
                    </div>
                    <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(profile.status)}`}>
                      {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                    </Badge>
                    {profile.regulatorStatus === 'approved' && (
                      <Badge className="px-2 py-1 text-xs font-medium rounded-full text-green-600 bg-green-100">
                        <Shield className="h-3 w-3 mr-1" />
                        LTFRB Approved
                      </Badge>
                    )}
                  </div>
                  
                  {profile.description && (
                    <p className="text-gray-600 mb-3">{profile.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-sm">
                      <span className="text-gray-500">Base Fare:</span>
                      <div className="font-semibold text-gray-900">₱{profile.baseFare.toFixed(2)}</div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Per KM:</span>
                      <div className="font-semibold text-gray-900">₱{profile.perKm.toFixed(2)}</div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Per Minute:</span>
                      <div className="font-semibold text-gray-900">₱{profile.perMinute.toFixed(2)}</div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Driver Share:</span>
                      <div className="font-semibold text-gray-900">{profile.driverCommissionPct}%</div>
                    </div>
                  </div>
                  
                  {profile.region && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">{profile.region.name} ({profile.region.code})</span>
                      </div>
                      <div className="text-sm text-blue-700 mb-1">
                        <span className="font-medium">Coverage:</span> {profile.region.cities.slice(0, 4).join(', ')}
                        {profile.region.cities.length > 4 && ` +${profile.region.cities.length - 4} more cities`}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-blue-600">
                        <span>{profile.region.currency} | {profile.region.timezone}</span>
                        <span>{profile.region.active_profiles_count} active profiles in region</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Updated: {new Date(profile.updatedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <BarChart3 className={`h-3 w-3 mr-1 ${getHealthScoreColor(profile.aiHealthScore)}`} />
                      Health Score: {profile.aiHealthScore}%
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total: {profiles.length} profiles</span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Active: {profiles.filter(p => p.status === 'active').length}
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              Draft: {profiles.filter(p => p.status === 'draft').length}
            </span>
            <span className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              Suspended: {profiles.filter(p => p.status === 'suspended').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}