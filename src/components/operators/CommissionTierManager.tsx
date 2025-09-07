'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Award,
  TrendingUp,
  Users,
  Target,
  Star,
  Crown,
  Medal,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Edit,
  Save,
  X
} from 'lucide-react';

import { OperatorAnalytics, CommissionTier, TierQualificationStatus } from '@/types/operators';

interface CommissionTierManagerProps {
  analytics: OperatorAnalytics | null;
  language: 'en' | 'fil';
  refreshKey?: number;
}

interface TierRequirement {
  id: string;
  tier: CommissionTier;
  min_performance_score: number;
  min_tenure_months: number;
  min_payment_consistency: number;
  min_utilization_percentile: number;
  rate_percentage: number;
  benefits: string[];
}

interface OperatorTierStatus {
  operator_id: string;
  business_name: string;
  current_tier: CommissionTier;
  performance_score: number;
  tenure_months: number;
  payment_consistency: number;
  utilization_percentile: number;
  qualification_status: TierQualificationStatus;
  next_tier_requirements: Record<string, boolean>;
  potential_tier: CommissionTier | null;
}

const CommissionTierManager: React.FC<CommissionTierManagerProps> = ({
  analytics,
  language,
  refreshKey = 0
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingRequirements, setIsEditingRequirements] = useState(false);
  const [tierRequirements, setTierRequirements] = useState<TierRequirement[]>([]);
  const [operatorStatuses, setOperatorStatuses] = useState<OperatorTierStatus[]>([]);
  const [selectedTier, setSelectedTier] = useState<CommissionTier>('tier_1');

  // Translations
  const translations = {
    en: {
      title: 'Commission Tier Management',
      subtitle: 'Manage tier requirements and operator progression',
      tierRequirements: 'Tier Requirements',
      operatorProgression: 'Operator Progression',
      tierDistribution: 'Tier Distribution',
      tier_1: 'Bronze Tier',
      tier_2: 'Silver Tier',
      tier_3: 'Gold Tier',
      performanceScore: 'Performance Score',
      tenure: 'Tenure (Months)',
      paymentConsistency: 'Payment Consistency',
      utilizationPercentile: 'Utilization Percentile',
      commissionRate: 'Commission Rate',
      requirements: 'Requirements',
      benefits: 'Benefits',
      qualified: 'Qualified',
      under_review: 'Under Review',
      disqualified: 'Disqualified',
      probationary: 'Probationary',
      eligibleForUpgrade: 'Eligible for Upgrade',
      atRisk: 'At Risk of Downgrade',
      maintaining: 'Maintaining Tier',
      edit: 'Edit Requirements',
      save: 'Save Changes',
      cancel: 'Cancel',
      refresh: 'Refresh',
      updateTier: 'Update Tier',
      viewDetails: 'View Details',
      operators: 'Operators',
      avgScore: 'Avg Score',
      minRequirement: 'Min Requirement',
      currentValue: 'Current Value',
      status: 'Status',
      businessName: 'Business Name',
      currentTier: 'Current Tier',
      nextTier: 'Next Tier',
      progress: 'Progress',
      actions: 'Actions'
    },
    fil: {
      title: 'Pamamahala ng Commission Tier',
      subtitle: 'Pamahalaan ang mga requirement ng tier at progression ng operator',
      tierRequirements: 'Mga Requirement ng Tier',
      operatorProgression: 'Progression ng Operator',
      tierDistribution: 'Distribusyon ng Tier',
      tier_1: 'Bronze Tier',
      tier_2: 'Silver Tier', 
      tier_3: 'Gold Tier',
      performanceScore: 'Performance Score',
      tenure: 'Tenure (Buwan)',
      paymentConsistency: 'Consistency ng Pagbabayad',
      utilizationPercentile: 'Utilization Percentile',
      commissionRate: 'Rate ng Komisyon',
      requirements: 'Mga Requirement',
      benefits: 'Mga Benepisyo',
      qualified: 'Qualified',
      under_review: 'Nasa Review',
      disqualified: 'Hindi Qualified',
      probationary: 'Probationary',
      eligibleForUpgrade: 'Eligible para sa Upgrade',
      atRisk: 'May Panganib na Ma-downgrade',
      maintaining: 'Pinapanatili ang Tier',
      edit: 'I-edit ang mga Requirement',
      save: 'I-save ang mga Pagbabago',
      cancel: 'Kanselahin',
      refresh: 'I-refresh',
      updateTier: 'I-update ang Tier',
      viewDetails: 'Tingnan ang mga Detalye',
      operators: 'Mga Operator',
      avgScore: 'Average na Score',
      minRequirement: 'Minimum na Requirement',
      currentValue: 'Kasalukuyang Value',
      status: 'Status',
      businessName: 'Pangalan ng Negosyo',
      currentTier: 'Kasalukuyang Tier',
      nextTier: 'Susunod na Tier',
      progress: 'Progress',
      actions: 'Mga Aksyon'
    }
  };

  const t = translations[language];

  // Load tier management data
  const loadTierData = async () => {
    try {
      setIsLoading(true);
      
      // Load tier requirements
      const requirementsResponse = await fetch('/api/operators/tiers/requirements');
      if (requirementsResponse.ok) {
        const requirementsData = await requirementsResponse.json();
        setTierRequirements(requirementsData.requirements || getDefaultTierRequirements());
      } else {
        setTierRequirements(getDefaultTierRequirements());
      }
      
      // Load operator statuses
      const statusesResponse = await fetch('/api/operators/tiers/statuses');
      if (statusesResponse.ok) {
        const statusesData = await statusesResponse.json();
        setOperatorStatuses(statusesData.statuses || generateSampleOperatorStatuses());
      } else {
        setOperatorStatuses(generateSampleOperatorStatuses());
      }
      
    } catch (error) {
      console.error('Failed to load tier data:', error);
      setTierRequirements(getDefaultTierRequirements());
      setOperatorStatuses(generateSampleOperatorStatuses());
    } finally {
      setIsLoading(false);
    }
  };

  // Default tier requirements
  const getDefaultTierRequirements = (): TierRequirement[] => [
    {
      id: '1',
      tier: 'tier_1',
      min_performance_score: 60,
      min_tenure_months: 1,
      min_payment_consistency: 80,
      min_utilization_percentile: 40,
      rate_percentage: 15,
      benefits: ['Basic commission rate', 'Standard support', 'Performance tracking']
    },
    {
      id: '2', 
      tier: 'tier_2',
      min_performance_score: 75,
      min_tenure_months: 6,
      min_payment_consistency: 90,
      min_utilization_percentile: 60,
      rate_percentage: 18,
      benefits: ['Higher commission rate', 'Priority support', 'Performance bonuses', 'Marketing assistance']
    },
    {
      id: '3',
      tier: 'tier_3', 
      min_performance_score: 85,
      min_tenure_months: 12,
      min_payment_consistency: 95,
      min_utilization_percentile: 80,
      rate_percentage: 22,
      benefits: ['Premium commission rate', 'Dedicated account manager', 'Exclusive bonuses', 'Marketing co-op', 'Priority dispatch']
    }
  ];

  // Generate sample operator statuses
  const generateSampleOperatorStatuses = (): OperatorTierStatus[] => {
    const names = [
      'Metro Manila Transport Co.',
      'Cebu Fleet Solutions',
      'Davao Ride Network',
      'Baguio Mountain Express',
      'Iloilo City Transport',
      'Bacolod Urban Transport',
      'Cagayan Valley Express',
      'Leyte Island Transport'
    ];

    return names.map((name, i) => {
      const currentTier: CommissionTier = (['tier_1', 'tier_2', 'tier_3'] as CommissionTier[])[Math.floor(Math.random() * 3)];
      const performanceScore = 60 + Math.random() * 35;
      const tenureMonths = Math.floor(1 + Math.random() * 24);
      const paymentConsistency = 75 + Math.random() * 25;
      const utilizationPercentile = 30 + Math.random() * 60;
      
      return {
        operator_id: `OP${String(i + 1).padStart(3, '0')}`,
        business_name: name,
        current_tier: currentTier,
        performance_score: performanceScore,
        tenure_months: tenureMonths,
        payment_consistency: paymentConsistency,
        utilization_percentile: utilizationPercentile,
        qualification_status: (['qualified', 'under_review', 'probationary'] as TierQualificationStatus[])[Math.floor(Math.random() * 3)],
        next_tier_requirements: {
          performance: performanceScore >= 75,
          tenure: tenureMonths >= 6,
          payment: paymentConsistency >= 90,
          utilization: utilizationPercentile >= 60
        },
        potential_tier: currentTier === 'tier_3' ? null : (currentTier === 'tier_2' ? 'tier_3' : 'tier_2')
      };
    });
  };

  // Get tier info
  const getTierInfo = (tier: CommissionTier) => {
    const info = {
      tier_1: {
        name: t.tier_1,
        icon: Medal,
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        bgColor: 'bg-amber-50'
      },
      tier_2: {
        name: t.tier_2,
        icon: Award,
        color: 'bg-slate-100 text-slate-800 border-slate-200',
        bgColor: 'bg-slate-50'
      },
      tier_3: {
        name: t.tier_3,
        icon: Crown,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        bgColor: 'bg-yellow-50'
      }
    };
    return info[tier];
  };

  // Get status color
  const getStatusColor = (status: TierQualificationStatus) => {
    const colors = {
      qualified: 'bg-green-100 text-green-800',
      under_review: 'bg-blue-100 text-blue-800',
      disqualified: 'bg-red-100 text-red-800',
      probationary: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status];
  };

  // Calculate tier distribution
  const tierDistribution = tierRequirements.map(tier => ({
    tier: tier.tier,
    name: getTierInfo(tier.tier).name,
    count: operatorStatuses.filter(op => op.current_tier === tier.tier).length,
    percentage: operatorStatuses.length > 0 
      ? (operatorStatuses.filter(op => op.current_tier === tier.tier).length / operatorStatuses.length) * 100
      : 0,
    color: getTierInfo(tier.tier).color
  }));

  // Effects
  useEffect(() => {
    loadTierData();
  }, [refreshKey]);

  // Render tier requirements
  const renderTierRequirements = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tierRequirements.map((tier) => {
        const tierInfo = getTierInfo(tier.tier);
        const Icon = tierInfo.icon;
        
        return (
          <Card key={tier.id} className={`border-l-4 ${tierInfo.bgColor}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {tierInfo.name}
                <Badge variant="outline" className="ml-auto">
                  {tier.rate_percentage}% commission
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t.performanceScore}</span>
                  <span className="font-medium">{tier.min_performance_score}/100</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t.tenure}</span>
                  <span className="font-medium">{tier.min_tenure_months} months</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t.paymentConsistency}</span>
                  <span className="font-medium">{tier.min_payment_consistency}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t.utilizationPercentile}</span>
                  <span className="font-medium">{tier.min_utilization_percentile}%</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">{t.benefits}:</p>
                <ul className="text-sm space-y-1">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {tierDistribution.find(d => d.tier === tier.tier)?.count || 0} {t.operators}
                  </span>
                  <span className="font-medium">
                    {tierDistribution.find(d => d.tier === tier.tier)?.percentage.toFixed(1) || 0}%
                  </span>
                </div>
                <Progress 
                  value={tierDistribution.find(d => d.tier === tier.tier)?.percentage || 0}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Render operator progression
  const renderOperatorProgression = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.operatorProgression}
          </div>
          <Select value={selectedTier} onValueChange={(value) => setSelectedTier(value as CommissionTier)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tier_1">{t.tier_1}</SelectItem>
              <SelectItem value="tier_2">{t.tier_2}</SelectItem>
              <SelectItem value="tier_3">{t.tier_3}</SelectItem>
            </SelectContent>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {operatorStatuses
            .filter(op => selectedTier === 'all' || op.current_tier === selectedTier)
            .map((operator, index) => {
              const tierInfo = getTierInfo(operator.current_tier);
              const nextTierInfo = operator.potential_tier ? getTierInfo(operator.potential_tier) : null;
              
              return (
                <div key={operator.operator_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-primary">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{operator.business_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={tierInfo.color} variant="outline">
                          {tierInfo.name}
                        </Badge>
                        <Badge className={getStatusColor(operator.qualification_status)}>
                          {t[operator.qualification_status]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{t.performanceScore}</p>
                      <p className="font-bold">{operator.performance_score.toFixed(1)}/100</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{t.tenure}</p>
                      <p className="font-bold">{operator.tenure_months} months</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{t.paymentConsistency}</p>
                      <p className="font-bold">{operator.payment_consistency.toFixed(1)}%</p>
                    </div>
                    
                    {nextTierInfo && (
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-4 w-4 text-green-500" />
                        <Badge className={nextTierInfo.color} variant="outline">
                          {nextTierInfo.name}
                        </Badge>
                      </div>
                    )}
                    
                    <Button size="sm" variant="outline">
                      {t.viewDetails}
                    </Button>
                  </div>
                </div>
              );
            })}
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
            onClick={loadTierData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t.refresh}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingRequirements(!isEditingRequirements)}
          >
            {isEditingRequirements ? (
              <>
                <X className="h-4 w-4 mr-2" />
                {t.cancel}
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                {t.edit}
              </>
            )}
          </Button>
          
          {isEditingRequirements && (
            <Button size="sm">
              <Save className="h-4 w-4 mr-2" />
              {t.save}
            </Button>
          )}
        </div>
      </div>

      {/* Tier Distribution Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tierDistribution.map((tier) => {
          const tierInfo = getTierInfo(tier.tier);
          const Icon = tierInfo.icon;
          
          return (
            <Card key={tier.tier}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tier.name}</p>
                    <p className="text-3xl font-bold">{tier.count}</p>
                    <p className="text-sm text-muted-foreground">{tier.percentage.toFixed(1)}% of operators</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-full">
                    <Icon className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tier Requirements */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t.tierRequirements}</h3>
        {renderTierRequirements()}
      </div>

      {/* Operator Progression */}
      {renderOperatorProgression()}
    </div>
  );
};

export default CommissionTierManager;