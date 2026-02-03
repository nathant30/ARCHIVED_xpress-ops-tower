'use client';

import React from 'react';
import { Badge, type BadgeProps } from '@/components/xpress/badge';
import { type CorporateAccountStatus } from '@/types/billing';
import { CheckCircle, PauseCircle, XCircle } from 'lucide-react';

export interface AccountStatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  status: CorporateAccountStatus;
  showIcon?: boolean;
}

const accountStatusConfig: Record<
  CorporateAccountStatus,
  { variant: BadgeProps['variant']; label: string; icon: React.ReactNode }
> = {
  active: {
    variant: 'success',
    label: 'Active',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  suspended: {
    variant: 'warning',
    label: 'Suspended',
    icon: <PauseCircle className="h-3 w-3" />,
  },
  terminated: {
    variant: 'danger',
    label: 'Terminated',
    icon: <XCircle className="h-3 w-3" />,
  },
};

export const AccountStatusBadge = React.forwardRef<HTMLSpanElement, AccountStatusBadgeProps>(
  ({ status, showIcon = true, ...props }, ref) => {
    const config = accountStatusConfig[status] || accountStatusConfig.active;

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        leftIcon={showIcon ? config.icon : undefined}
        dot={status === 'active'}
        {...props}
      >
        {config.label}
      </Badge>
    );
  }
);

AccountStatusBadge.displayName = 'AccountStatusBadge';
