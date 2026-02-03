'use client';

import React from 'react';
import {
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/xpress/badge';
import type { PayoutStatus } from './types';

export interface PayoutStatusBadgeProps {
  status: PayoutStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
}

const PayoutStatusBadge: React.FC<PayoutStatusBadgeProps> = ({
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
      case 'processing':
        return {
          variant: 'info' as const,
          label: 'Processing',
          icon: Loader2,
        };
      case 'completed':
        return {
          variant: 'success' as const,
          label: 'Completed',
          icon: CheckCircle,
        };
      case 'failed':
        return {
          variant: 'danger' as const,
          label: 'Failed',
          icon: XCircle,
        };
      default:
        return {
          variant: 'default' as const,
          label: 'Unknown',
          icon: AlertCircle,
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

export default PayoutStatusBadge;
