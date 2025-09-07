import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const inputVariants = cva(
  [
    'flex w-full',
    'bg-[var(--xp-input-bg)] border border-[var(--xp-input-border)]',
    'text-[var(--xp-text-primary)] placeholder:text-[var(--xp-input-placeholder)]',
    'rounded-[var(--xp-input-radius)]',
    'px-[var(--xp-input-paddingX)]',
    'focus:outline-none focus:ring-[var(--xp-focus-ring-width)] focus:ring-[var(--xp-focus-ring)] focus:border-[var(--xp-focus-ring)]',
    'disabled:opacity-[var(--xp-opacity-disabled)] disabled:cursor-not-allowed',
    'transition-colors duration-[var(--xp-duration-fast)]',
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
        success: 'border-[var(--xp-status-success)] focus:ring-[var(--xp-status-success)] focus:border-[var(--xp-status-success)]',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  /** Error message to display */
  error?: string;
  /** Helper text to display */
  helperText?: string;
  /** Icon to display before the input */
  leftIcon?: React.ReactNode;
  /** Icon to display after the input */
  rightIcon?: React.ReactNode;
  /** Label for the input */
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    size,
    variant,
    error,
    helperText,
    leftIcon,
    rightIcon,
    label,
    id,
    ...props
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(7)}`;
    const hasError = Boolean(error);
    const finalVariant = hasError ? 'error' : variant;

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-[var(--xp-font-size-body)] font-medium text-[var(--xp-text-primary)] mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-[var(--xp-text-muted)] h-4 w-4">
                {leftIcon}
              </span>
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ size, variant: finalVariant }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-[var(--xp-text-muted)] h-4 w-4">
                {rightIcon}
              </span>
            </div>
          )}
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

Input.displayName = 'Input';

export { Input, inputVariants };