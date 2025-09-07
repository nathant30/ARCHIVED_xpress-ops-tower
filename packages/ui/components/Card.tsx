import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const cardVariants = cva(
  [
    'bg-[var(--xp-bg-card)]',
    'border border-[var(--xp-border-default)]',
    'rounded-[var(--xp-card-radius)]',
    'shadow-[var(--xp-card-shadow)]',
  ],
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-[calc(var(--xp-card-padding)*0.75)]',
        md: 'p-[var(--xp-card-padding)]',
        lg: 'p-[calc(var(--xp-card-padding)*1.5)]',
      },
      variant: {
        default: '',
        elevated: 'shadow-[var(--xp-elevation-2)]',
        outline: 'border-2',
      },
    },
    defaultVariants: {
      padding: 'md',
      variant: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ padding, variant }), className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

// Card sub-components
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5 pb-[var(--xp-spacing-4)]',
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-[var(--xp-font-size-h3)] font-semibold leading-none tracking-tight text-[var(--xp-text-primary)]',
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'text-[var(--xp-font-size-body)] text-[var(--xp-text-secondary)]',
        className
      )}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-[var(--xp-text-primary)]', className)}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center pt-[var(--xp-spacing-4)]',
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
};