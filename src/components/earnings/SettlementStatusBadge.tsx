'use client';

import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/xpress/badge';
import type { SettlementStatus } from './types';

export interface SettlementStatusBadgeProps {
  status: SettlementStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
}

const SettlementStatusBadge: React.FC<SettlementStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const config = React.useMemo(() => {
    switch (status) {
      case 'pending':
        return {
          variant: 'warning' as const,
          label: 'Pending',
          icon: Clock,
        };
      case 'completed':
        return {
          variant: 'success' as const,
          label: 'Completed',
          icon: CheckCircle,
        };
      default:
        return {
          variant: 'default' as const,
          label: 'Unknown',
          icon: Clock,
        };
    }
  }, [status]);

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} size={size}>
      {showIcon && <Icon className="w-3 h-3" />}
      <span>{config.label}</span>
    </Badge>
  );
};

export default SettlementStatusBadge;
