import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  // Base styles using CSS variables
  [
    'inline-flex items-center justify-center',
    'font-medium transition-colors duration-[var(--xp-duration-fast)]',
    'focus:outline-none focus:ring-[var(--xp-focus-ring-width)] focus:ring-[var(--xp-focus-ring)] focus:ring-offset-[var(--xp-focus-ring-offset)]',
    'disabled:opacity-[var(--xp-opacity-disabled)] disabled:cursor-not-allowed',
    'select-none whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--xp-button-primary-bg)] text-[var(--xp-button-primary-text)]',
          'hover:bg-[var(--xp-button-primary-hover)]',
          'border border-transparent',
        ],
        secondary: [
          'bg-[var(--xp-button-secondary-bg)] text-[var(--xp-button-secondary-text)]',
          'border border-[var(--xp-button-secondary-border)]',
          'hover:bg-[var(--xp-bg-elevated)]',
        ],
        tertiary: [
          'bg-transparent text-[var(--xp-text-primary)]',
          'border border-transparent',
          'hover:bg-[var(--xp-bg-elevated)]',
        ],
        danger: [
          'bg-[var(--xp-status-critical)] text-white',
          'border border-transparent',
          'hover:opacity-90',
        ],
        success: [
          'bg-[var(--xp-status-success)] text-white',
          'border border-transparent',
          'hover:opacity-90',
        ],
        warning: [
          'bg-[var(--xp-status-warning)] text-white',
          'border border-transparent',
          'hover:opacity-90',
        ],
      },
      size: {
        sm: [
          'h-[calc(var(--xp-button-height)*0.8)]',
          'px-[var(--xp-spacing-3)]',
          'text-[var(--xp-font-size-caption)]',
          'rounded-[var(--xp-button-radius)]',
        ],
        md: [
          'h-[var(--xp-button-height)]',
          'px-[var(--xp-button-paddingX)]',
          'text-[var(--xp-font-size-body)]',
          'rounded-[var(--xp-button-radius)]',
        ],
        lg: [
          'h-[calc(var(--xp-button-height)*1.2)]',
          'px-[calc(var(--xp-button-paddingX)*1.5)]',
          'text-[var(--xp-font-size-bodyLg)]',
          'rounded-[var(--xp-button-radius)]',
        ],
      },
      density: {
        compact: 'py-1',
        comfortable: 'py-2',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      density: 'comfortable',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Icon to display before the button text */
  leftIcon?: React.ReactNode;
  /** Icon to display after the button text */
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    className,
    variant,
    size,
    density,
    fullWidth,
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    type = 'button',
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, density, fullWidth }), className)}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && (
          <span className="flex-shrink-0 mr-2" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span className="truncate">
          {children}
        </span>
        {!loading && rightIcon && (
          <span className="flex-shrink-0 ml-2" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };