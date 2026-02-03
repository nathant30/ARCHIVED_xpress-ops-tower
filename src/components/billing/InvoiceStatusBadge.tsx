'use client';

import React from 'react';
import { Badge, type BadgeProps } from '@/components/xpress/badge';
import { type InvoiceStatus } from '@/types/billing';
import { FileText, Send, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export interface InvoiceStatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  status: InvoiceStatus;
  showIcon?: boolean;
}

const invoiceStatusConfig: Record<
  InvoiceStatus,
  { variant: BadgeProps['variant']; label: string; icon: React.ReactNode }
> = {
  draft: {
    variant: 'default',
    label: 'Draft',
    icon: <FileText className="h-3 w-3" />,
  },
  sent: {
    variant: 'info',
    label: 'Sent',
    icon: <Send className="h-3 w-3" />,
  },
  paid: {
    variant: 'solid-success',
    label: 'Paid',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  overdue: {
    variant: 'solid-danger',
    label: 'Overdue',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  void: {
    variant: 'secondary',
    label: 'Void',
    icon: <XCircle className="h-3 w-3" />,
  },
};

export const InvoiceStatusBadge = React.forwardRef<HTMLSpanElement, InvoiceStatusBadgeProps>(
  ({ status, showIcon = true, ...props }, ref) => {
    const config = invoiceStatusConfig[status] || invoiceStatusConfig.draft;

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        leftIcon={showIcon ? config.icon : undefined}
        {...props}
      >
        {config.label}
      </Badge>
    );
  }
);

InvoiceStatusBadge.displayName = 'InvoiceStatusBadge';
