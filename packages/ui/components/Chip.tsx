import React from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const chipVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-medium',
    'rounded-[var(--xp-chip-radius)]',
    'px-[var(--xp-chip-paddingX)]',
    'h-[var(--xp-chip-height)]',
    'text-[var(--xp-font-size-caption)]',
    'transition-colors duration-[var(--xp-duration-fast)]',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[var(--xp-bg-elevated)]',
          'text-[var(--xp-text-primary)]',
          'border border-[var(--xp-border-default)]',
        ],
        success: [
          'bg-[var(--xp-chip-bg-success)]',
          'text-[var(--xp-status-success)]',
          'border border-[var(--xp-status-success)]',
        ],
        warning: [
          'bg-[var(--xp-chip-bg-warning)]',
          'text-[var(--xp-status-warning)]',
          'border border-[var(--xp-status-warning)]',
        ],
        info: [
          'bg-[var(--xp-chip-bg-info)]',
          'text-[var(--xp-status-info)]',
          'border border-[var(--xp-status-info)]',
        ],
        critical: [
          'bg-[var(--xp-chip-bg-critical)]',
          'text-[var(--xp-status-critical)]',
          'border border-[var(--xp-status-critical)]',
        ],
      },
      size: {
        sm: [
          'h-[calc(var(--xp-chip-height)*0.8)]',
          'px-[calc(var(--xp-chip-paddingX)*0.8)]',
          'text-xs',
        ],
        md: [
          'h-[var(--xp-chip-height)]',
          'px-[var(--xp-chip-paddingX)]',
          'text-[var(--xp-font-size-caption)]',
        ],
        lg: [
          'h-[calc(var(--xp-chip-height)*1.2)]',
          'px-[calc(var(--xp-chip-paddingX)*1.2)]',
          'text-[var(--xp-font-size-body)]',
        ],
      },
      tone: {
        default: '',
        success: '',
        warning: '',
        info: '',
        critical: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      tone: 'default',
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  /** Whether the chip can be dismissed */
  dismissible?: boolean;
  /** Callback when the chip is dismissed */
  onDismiss?: () => void;
  /** Icon to display before the chip text */
  icon?: React.ReactNode;
  /** Override the dismiss icon */
  dismissIcon?: React.ReactNode;
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({
    children,
    className,
    variant,
    size,
    tone,
    dismissible = false,
    onDismiss,
    icon,
    dismissIcon,
    ...props
  }, ref) => {
    // Map tone to variant if variant is not explicitly set
    const finalVariant = variant || tone;

    return (
      <div
        ref={ref}
        className={cn(chipVariants({ variant: finalVariant, size }), className)}
        {...props}
      >
        {icon && (
          <span className="flex-shrink-0 mr-1 h-3 w-3" aria-hidden="true">
            {icon}
          </span>
        )}
        
        <span className="truncate">
          {children}
        </span>
        
        {dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 ml-1 -mr-1 p-0.5 rounded-full hover:bg-black/10 focus:outline-none focus:bg-black/10 transition-colors"
            aria-label="Remove"
            type="button"
          >
            {dismissIcon || <X className="h-3 w-3" />}
          </button>
        )}
      </div>
    );
  }
);

Chip.displayName = 'Chip';

// Badge alias for compatibility
const Badge = Chip;

export { Chip, Badge, chipVariants };