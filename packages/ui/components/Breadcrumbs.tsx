import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const breadcrumbsVariants = cva([
  'flex items-center space-x-1 text-[var(--xp-font-size-body)]',
  'text-[var(--xp-text-secondary)]',
]);

const breadcrumbItemVariants = cva([
  'flex items-center space-x-1',
]);

const breadcrumbLinkVariants = cva([
  'hover:text-[var(--xp-text-primary)]',
  'focus:outline-none focus:ring-[var(--xp-focus-ring-width)] focus:ring-[var(--xp-focus-ring)] focus:ring-offset-[var(--xp-focus-ring-offset)]',
  'transition-colors duration-[var(--xp-duration-fast)]',
  'rounded-[var(--xp-radius-xs)]',
  'px-1 py-0.5',
], {
  variants: {
    variant: {
      link: 'text-[var(--xp-link-default)] hover:underline cursor-pointer',
      button: 'hover:bg-[var(--xp-bg-elevated)] cursor-pointer',
      text: 'cursor-default',
    },
  },
  defaultVariants: {
    variant: 'link',
  },
});

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  current?: boolean;
}

export interface BreadcrumbsProps
  extends React.HTMLAttributes<HTMLNavigationElement>,
    VariantProps<typeof breadcrumbsVariants> {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Custom separator component */
  separator?: React.ReactNode;
  /** Max items to show before truncating */
  maxItems?: number;
}

const Breadcrumbs = React.forwardRef<HTMLNavigationElement, BreadcrumbsProps>(
  ({
    className,
    items,
    separator = <ChevronRight className="h-3 w-3" aria-hidden="true" />,
    maxItems,
    ...props
  }, ref) => {
    // Handle truncation if maxItems is specified
    const displayItems = React.useMemo(() => {
      if (!maxItems || items.length <= maxItems) {
        return items;
      }

      const start = items.slice(0, 1); // Always show first item
      const end = items.slice(-Math.max(1, maxItems - 2)); // Show last few items
      const middle = items.length > maxItems ? [{ label: '...', current: false }] : [];

      return [...start, ...middle, ...end];
    }, [items, maxItems]);

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn(breadcrumbsVariants(), className)}
        {...props}
      >
        <ol className="flex items-center space-x-1">
          {displayItems.map((item, index) => {
            const isLast = index === displayItems.length - 1;
            const isTruncated = item.label === '...';

            return (
              <li key={`${item.label}-${index}`} className={breadcrumbItemVariants()}>
                {/* Breadcrumb Item */}
                {isTruncated ? (
                  <span className="px-1 py-0.5 text-[var(--xp-text-muted)]">
                    {item.label}
                  </span>
                ) : item.href ? (
                  <a
                    href={item.href}
                    className={cn(
                      breadcrumbLinkVariants({ variant: 'link' }),
                      isLast && 'text-[var(--xp-text-primary)] font-medium'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </a>
                ) : item.onClick ? (
                  <button
                    onClick={item.onClick}
                    className={cn(
                      breadcrumbLinkVariants({ variant: 'button' }),
                      isLast && 'text-[var(--xp-text-primary)] font-medium'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span
                    className={cn(
                      breadcrumbLinkVariants({ variant: 'text' }),
                      isLast && 'text-[var(--xp-text-primary)] font-medium'
                    )}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}

                {/* Separator */}
                {!isLast && (
                  <span className="text-[var(--xp-text-muted)] mx-1" aria-hidden="true">
                    {separator}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumbs.displayName = 'Breadcrumbs';

export { Breadcrumbs, breadcrumbsVariants };