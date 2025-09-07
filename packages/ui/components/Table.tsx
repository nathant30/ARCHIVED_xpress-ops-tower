import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const tableVariants = cva('w-full caption-bottom text-[var(--xp-font-size-body)]');

const tableHeaderVariants = cva(
  [
    'h-[var(--xp-table-headerHeight)]',
    'text-left font-medium text-[var(--xp-text-secondary)]',
    'border-b border-[var(--xp-border-default)]',
    'bg-[var(--xp-bg-elevated)]',
  ]
);

const tableRowVariants = cva(
  [
    'border-b border-[var(--xp-border-default)]',
    'transition-colors duration-[var(--xp-duration-fast)]',
    'hover:bg-[var(--xp-table-row-hover)]',
  ],
  {
    variants: {
      density: {
        compact: 'h-[calc(var(--xp-table-rowHeight)*0.75)]',
        comfortable: 'h-[var(--xp-table-rowHeight)]',
      },
    },
    defaultVariants: {
      density: 'comfortable',
    },
  }
);

const tableCellVariants = cva(
  [
    'align-middle text-[var(--xp-text-primary)]',
  ],
  {
    variants: {
      density: {
        compact: 'px-[var(--xp-spacing-2)] py-[var(--xp-spacing-1)]',
        comfortable: 'px-[var(--xp-spacing-4)] py-[var(--xp-spacing-3)]',
      },
    },
    defaultVariants: {
      density: 'comfortable',
    },
  }
);

export interface TableProps
  extends React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {
  /** Table density affects row height and cell padding */
  density?: 'compact' | 'comfortable';
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, density, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn(tableVariants(), className)}
        data-density={density}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn(tableHeaderVariants(), className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        'border-t border-[var(--xp-border-default)] bg-[var(--xp-bg-elevated)] font-medium',
        className
      )}
      {...props}
    />
  )
);
TableFooter.displayName = 'TableFooter';

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement>,
    VariantProps<typeof tableRowVariants> {}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, density, ...props }, ref) => {
    // Get density from parent table if not explicitly set
    const parentTable = ref?.current?.closest('[data-density]');
    const finalDensity = density || (parentTable?.getAttribute('data-density') as 'compact' | 'comfortable') || 'comfortable';

    return (
      <tr
        ref={ref}
        className={cn(tableRowVariants({ density: finalDensity }), className)}
        {...props}
      />
    );
  }
);
TableRow.displayName = 'TableRow';

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableCellVariants> {}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, density, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          tableCellVariants({ density }),
          'font-medium text-[var(--xp-text-secondary)]',
          className
        )}
        {...props}
      />
    );
  }
);
TableHead.displayName = 'TableHead';

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableCellVariants> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, density, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn(tableCellVariants({ density }), className)}
        {...props}
      />
    );
  }
);
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn(
        'mt-[var(--xp-spacing-4)] text-[var(--xp-font-size-body)] text-[var(--xp-text-muted)]',
        className
      )}
      {...props}
    />
  )
);
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};