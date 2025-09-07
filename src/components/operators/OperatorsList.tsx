'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { 
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Users,
  TrendingUp,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

import { Operator, OperatorFilters, OperatorType, OperatorStatus, CommissionTier } from '@/types/operators';
import { useAuth } from '@/hooks/useAuth';
import OperatorCard from './shared/OperatorCard';

interface OperatorsListProps {
  onOperatorSelect: (operator: Operator) => void;
  refreshKey: number;
  language: 'en' | 'fil';
}

interface SortConfig {
  key: keyof Operator | null;
  direction: 'asc' | 'desc';
}

const OperatorsList: React.FC<OperatorsListProps> = ({
  onOperatorSelect,
  refreshKey,
  language
}) => {
  // State management
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  
  // Filter state
  const [filters, setFilters] = useState<OperatorFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { user } = useAuth();
  const itemsPerPage = 20;

  // Translations
  const translations = {
    en: {
      title: 'Operators Management',
      subtitle: 'Manage and monitor all operators in the system',
      search: 'Search operators...',
      filters: 'Filters',
      advancedFilters: 'Advanced Filters',
      allTypes: 'All Types',
      allStatuses: 'All Statuses',
      allTiers: 'All Tiers',
      allRegions: 'All Regions',
      export: 'Export',
      viewCards: 'Cards View',
      viewTable: 'Table View',
      operatorCode: 'Code',
      businessName: 'Business Name',
      type: 'Type',
      status: 'Status',
      region: 'Region',
      vehicles: 'Vehicles',
      performance: 'Performance',
      tier: 'Commission Tier',
      earnings: 'Earnings',
      actions: 'Actions',
      view: 'View',
      edit: 'Edit',
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      pending_approval: 'Pending Approval',
      under_review: 'Under Review',
      decommissioned: 'Decommissioned',
      tnvs: 'TNVS',
      general: 'General',
      fleet: 'Fleet',
      tier_1: 'Tier 1',
      tier_2: 'Tier 2', 
      tier_3: 'Tier 3',
      loading: 'Loading operators...',
      noResults: 'No operators found',
      showing: 'Showing',
      of: 'of',
      results: 'results',
      prev: 'Previous',
      next: 'Next'
    },
    fil: {
      title: 'Pamamahala ng mga Operator',
      subtitle: 'Pamahalaan at subaybayan ang lahat ng operator sa sistema',
      search: 'Maghanap ng mga operator...',
      filters: 'Mga Filter',
      advancedFilters: 'Advanced na Mga Filter',
      allTypes: 'Lahat ng Uri',
      allStatuses: 'Lahat ng Status',
      allTiers: 'Lahat ng Tier',
      allRegions: 'Lahat ng Rehiyon',
      export: 'I-export',
      viewCards: 'Cards View',
      viewTable: 'Table View',
      operatorCode: 'Code',
      businessName: 'Pangalan ng Negosyo',
      type: 'Uri',
      status: 'Status',
      region: 'Rehiyon',
      vehicles: 'Mga Sasakyan',
      performance: 'Performance',
      tier: 'Tier ng Komisyon',
      earnings: 'Kita',
      actions: 'Mga Aksyon',
      view: 'Tingnan',
      edit: 'I-edit',
      active: 'Aktibo',
      inactive: 'Hindi Aktibo',
      suspended: 'Nasuspinde',
      pending_approval: 'Naghihintay ng Approval',
      under_review: 'Nasa Review',
      decommissioned: 'Na-decommission',
      tnvs: 'TNVS',
      general: 'General',
      fleet: 'Fleet',
      tier_1: 'Tier 1',
      tier_2: 'Tier 2',
      tier_3: 'Tier 3',
      loading: 'Naglo-load ng mga operator...',
      noResults: 'Walang nahanap na operator',
      showing: 'Nagpapakita ng',
      of: 'sa',
      results: 'mga resulta',
      prev: 'Nakaraan',
      next: 'Susunod'
    }
  };

  const t = translations[language];

  // Load operators data
  const loadOperators = async () => {
    try {
      setIsLoading(true);
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', itemsPerPage.toString());
      
      if (searchQuery) queryParams.append('search', searchQuery);
      if (filters.operator_type) queryParams.append('operator_type', filters.operator_type);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.region_id) queryParams.append('region', filters.region_id);
      if (filters.commission_tier) queryParams.append('commission_tier', filters.commission_tier);
      if (filters.performance_score_min) queryParams.append('performance_score_min', filters.performance_score_min.toString());
      if (filters.performance_score_max) queryParams.append('performance_score_max', filters.performance_score_max.toString());

      const response = await fetch(`/api/operators?${queryParams.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setOperators(data.operators);
        setTotalCount(data.pagination.total);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to load operators:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort handlers
  const handleSort = (key: keyof Operator) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting to operators
  const sortedOperators = useMemo(() => {
    if (!sortConfig.key) return operators;
    
    const sorted = [...operators].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });
    
    return sorted;
  }, [operators, sortConfig]);

  // Filter change handlers
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof OperatorFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
    setCurrentPage(1);
  };

  // Export functionality
  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await fetch(`/api/operators/export?${queryParams.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `operators-${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Status badge color mapping
  const getStatusColor = (status: OperatorStatus) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-blue-100 text-blue-800',
      decommissioned: 'bg-slate-100 text-slate-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Tier badge color mapping
  const getTierColor = (tier: CommissionTier) => {
    const colors = {
      tier_1: 'bg-bronze-100 text-bronze-800',
      tier_2: 'bg-silver-100 text-silver-800',
      tier_3: 'bg-gold-100 text-gold-800'
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  // Effects
  useEffect(() => {
    loadOperators();
  }, [currentPage, filters, searchQuery, refreshKey]);

  // Render table view
  const renderTableView = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('operator_code')}
                >
                  <div className="flex items-center gap-2">
                    {t.operatorCode}
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('business_name')}
                >
                  <div className="flex items-center gap-2">
                    {t.businessName}
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>{t.type}</TableHead>
                <TableHead>{t.status}</TableHead>
                <TableHead>{t.region}</TableHead>
                <TableHead className="text-right">{t.vehicles}</TableHead>
                <TableHead className="text-right">{t.performance}</TableHead>
                <TableHead>{t.tier}</TableHead>
                <TableHead className="text-right">{t.earnings}</TableHead>
                <TableHead className="w-[100px]">{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOperators.map((operator) => (
                <TableRow 
                  key={operator.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onOperatorSelect(operator)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      {operator.operator_code}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{operator.business_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {operator.primary_contact.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {t[operator.operator_type as keyof typeof t]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(operator.status)}>
                      {t[operator.status as keyof typeof t]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" />
                      {operator.business_address.region}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {operator.current_vehicle_count}/{operator.max_vehicles}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{operator.performance_score}/100</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTierColor(operator.commission_tier)}>
                      {t[operator.commission_tier as keyof typeof t]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-medium">
                      ₱{operator.earnings_month.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      this month
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOperatorSelect(operator);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  // Render cards view
  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedOperators.map((operator) => (
        <OperatorCard
          key={operator.id}
          operator={operator}
          onClick={onOperatorSelect}
          language={language}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.title}</h2>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 w-[300px]"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {t.filters}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t.export}
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select
                  value={filters.operator_type || 'all'}
                  onValueChange={(value) => handleFilterChange('operator_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.allTypes} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allTypes}</SelectItem>
                    <SelectItem value="tnvs">{t.tnvs}</SelectItem>
                    <SelectItem value="general">{t.general}</SelectItem>
                    <SelectItem value="fleet">{t.fleet}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.allStatuses} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allStatuses}</SelectItem>
                    <SelectItem value="active">{t.active}</SelectItem>
                    <SelectItem value="inactive">{t.inactive}</SelectItem>
                    <SelectItem value="suspended">{t.suspended}</SelectItem>
                    <SelectItem value="pending_approval">{t.pending_approval}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Commission Tier</label>
                <Select
                  value={filters.commission_tier || 'all'}
                  onValueChange={(value) => handleFilterChange('commission_tier', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.allTiers} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allTiers}</SelectItem>
                    <SelectItem value="tier_1">{t.tier_1}</SelectItem>
                    <SelectItem value="tier_2">{t.tier_2}</SelectItem>
                    <SelectItem value="tier_3">{t.tier_3}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">View Mode</label>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="flex-1"
                  >
                    {t.viewTable}
                  </Button>
                  <Button
                    variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="flex-1"
                  >
                    {t.viewCards}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t.loading}</p>
          </CardContent>
        </Card>
      )}

      {/* Data Display */}
      {!isLoading && operators.length > 0 && (
        <>
          {viewMode === 'table' ? renderTableView() : renderCardsView()}
          
          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {t.showing} {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} {t.of} {totalCount} {t.results}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                {t.prev}
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + Math.max(1, currentPage - 2);
                  return page <= totalPages ? (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ) : null;
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                {t.next}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && operators.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t.noResults}</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OperatorsList;