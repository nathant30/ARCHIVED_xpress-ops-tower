import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const selectVariants = cva(
  [
    'flex w-full appearance-none',
    'bg-[var(--xp-input-bg)] border border-[var(--xp-input-border)]',
    'text-[var(--xp-text-primary)]',
    'rounded-[var(--xp-input-radius)]',
    'px-[var(--xp-input-paddingX)] pr-10',
    'focus:outline-none focus:ring-[var(--xp-focus-ring-width)] focus:ring-[var(--xp-focus-ring)] focus:border-[var(--xp-focus-ring)]',
    'disabled:opacity-[var(--xp-opacity-disabled)] disabled:cursor-not-allowed',
    'transition-colors duration-[var(--xp-duration-fast)]',
    'cursor-pointer',
  ],
  {
    variants: {
      size: {
        sm: [
          'h-[calc(var(--xp-input-height)*0.8)]',
          'text-[var(--xp-font-size-caption)]',
        ],
        md: [
          'h-[var(--xp-input-height)]',
          'text-[var(--xp-font-size-body)]',
        ],
        lg: [
          'h-[calc(var(--xp-input-height)*1.2)]',
          'text-[var(--xp-font-size-bodyLg)]',
        ],
      },
      variant: {
        default: '',
        error: 'border-[var(--xp-status-critical)] focus:ring-[var(--xp-status-critical)] focus:border-[var(--xp-status-critical)]',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  /** Options to display in the select */
  options: SelectOption[];
  /** Error message to display */
  error?: string;
  /** Helper text to display */
  helperText?: string;
  /** Label for the select */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    size,
    variant,
    options,
    error,
    helperText,
    label,
    placeholder,
    id,
    ...props
  }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substring(7)}`;
    const hasError = Boolean(error);
    const finalVariant = hasError ? 'error' : variant;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-[var(--xp-font-size-body)] font-medium text-[var(--xp-text-primary)] mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(selectVariants({ size, variant: finalVariant }), className)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="h-4 w-4 text-[var(--xp-text-muted)]" />
          </div>
        </div>
        
        {(error || helperText) && (
          <p className={cn(
            "mt-1 text-[var(--xp-font-size-caption)]",
            hasError ? "text-[var(--xp-status-critical)]" : "text-[var(--xp-text-muted)]"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select, selectVariants };