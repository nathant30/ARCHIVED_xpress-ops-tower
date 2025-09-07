'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  TrendingUp,
  Star,
  Eye,
  Edit,
  MoreHorizontal,
  Truck,
  Calendar,
  DollarSign
} from 'lucide-react';

import { Operator, OperatorStatus, CommissionTier } from '@/types/operators';

interface OperatorCardProps {
  operator: Operator;
  onClick: (operator: Operator) => void;
  language: 'en' | 'fil';
  showActions?: boolean;
}

const OperatorCard: React.FC<OperatorCardProps> = ({
  operator,
  onClick,
  language,
  showActions = true
}) => {
  // Translations
  const translations = {
    en: {
      vehicles: 'Vehicles',
      performance: 'Performance',
      earnings: 'Monthly Earnings',
      since: 'Partner since',
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
      pending_approval: 'Pending Approval',
      under_review: 'Under Review',
      decommissioned: 'Decommissioned',
      tnvs: 'TNVS',
      general: 'General',
      fleet: 'Fleet',
      tier_1: 'Bronze Tier',
      tier_2: 'Silver Tier',
      tier_3: 'Gold Tier',
      view: 'View Details',
      edit: 'Edit',
      contact: 'Contact'
    },
    fil: {
      vehicles: 'Mga Sasakyan',
      performance: 'Performance',
      earnings: 'Buwanang Kita',
      since: 'Partner mula',
      active: 'Aktibo',
      inactive: 'Hindi Aktibo',
      suspended: 'Nasuspinde',
      pending_approval: 'Naghihintay ng Approval',
      under_review: 'Nasa Review',
      decommissioned: 'Na-decommission',
      tnvs: 'TNVS',
      general: 'General',
      fleet: 'Fleet',
      tier_1: 'Bronze Tier',
      tier_2: 'Silver Tier',
      tier_3: 'Gold Tier',
      view: 'Tingnan ang Detalye',
      edit: 'I-edit',
      contact: 'Makipag-ugnayan'
    }
  };

  const t = translations[language];

  // Status color mapping
  const getStatusColor = (status: OperatorStatus): string => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      suspended: 'bg-red-100 text-red-800 border-red-200',
      pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      under_review: 'bg-blue-100 text-blue-800 border-blue-200',
      decommissioned: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Tier color and icon mapping
  const getTierInfo = (tier: CommissionTier) => {
    const info = {
      tier_1: {
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        name: t.tier_1,
        icon: '🥉'
      },
      tier_2: {
        color: 'bg-slate-100 text-slate-800 border-slate-200', 
        name: t.tier_2,
        icon: '🥈'
      },
      tier_3: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        name: t.tier_3,
        icon: '🥇'
      }
    };
    return info[tier];
  };

  // Performance score color
  const getPerformanceColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(language === 'fil' ? 'tl-PH' : 'en-PH');
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(language === 'fil' ? 'tl-PH' : 'en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const tierInfo = getTierInfo(operator.commission_tier);

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-l-4 border-l-primary/20 hover:border-l-primary"
      onClick={() => onClick(operator)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {operator.business_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {operator.operator_code} • {t[operator.operator_type as keyof typeof t]}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(operator.status)} variant="outline">
              {t[operator.status as keyof typeof t]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{operator.business_address.city}, {operator.business_address.region}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{operator.primary_contact.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{operator.primary_contact.phone}</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t.vehicles}</span>
            </div>
            <p className="text-lg font-semibold">
              {operator.current_vehicle_count}/{operator.max_vehicles}
            </p>
            <div className="w-full bg-muted rounded-full h-1 mt-1">
              <div 
                className="bg-primary h-1 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, (operator.current_vehicle_count / operator.max_vehicles) * 100)}%` 
                }}
              />
            </div>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t.performance}</span>
            </div>
            <p className={`text-lg font-semibold ${getPerformanceColor(operator.performance_score)}`}>
              {operator.performance_score}/100
            </p>
            <div className="w-full bg-muted rounded-full h-1 mt-1">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ${
                  operator.performance_score >= 80 ? 'bg-green-500' :
                  operator.performance_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${operator.performance_score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t.earnings}</span>
          </div>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(operator.earnings_month)}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>Today: {formatCurrency(operator.earnings_today)}</span>
            <span>Week: {formatCurrency(operator.earnings_week)}</span>
          </div>
        </div>

        {/* Commission Tier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{tierInfo.icon}</span>
            <div>
              <Badge className={tierInfo.color} variant="outline">
                {tierInfo.name}
              </Badge>
              {operator.tier_qualification_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  Since {formatDate(operator.tier_qualification_date)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{t.since} {formatDate(operator.partnership_start_date)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onClick(operator);
              }}
            >
              <Eye className="h-4 w-4 mr-1" />
              {t.view}
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                // Handle contact action
                window.location.href = `tel:${operator.primary_contact.phone}`;
              }}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                // Handle email action
                window.location.href = `mailto:${operator.primary_contact.email}`;
              }}
            >
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OperatorCard;