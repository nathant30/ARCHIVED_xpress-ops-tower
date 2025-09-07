import React, { createContext, useContext } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

// Tabs Context
interface TabsContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
};

// Tabs Root
export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The controlled value of the tab to activate */
  value?: string;
  /** The value of the tab to activate by default */
  defaultValue?: string;
  /** Callback when the value changes */
  onValueChange?: (value: string) => void;
  /** The orientation of the tabs */
  orientation?: 'horizontal' | 'vertical';
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value, defaultValue, onValueChange, orientation = 'horizontal', ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const handleValueChange = (newValue: string) => {
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    const contextValue: TabsContextValue = {
      value: currentValue,
      onValueChange: handleValueChange,
    };

    return (
      <TabsContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn('w-full', className)}
          data-orientation={orientation}
          {...props}
        />
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

// Tabs List
const tabsListVariants = cva(
  [
    'inline-flex items-center justify-center',
    'bg-[var(--xp-bg-elevated)]',
    'border-b border-[var(--xp-border-default)]',
    'text-[var(--xp-text-secondary)]',
  ],
  {
    variants: {
      variant: {
        default: '',
        pills: [
          'bg-transparent border-0 gap-[var(--xp-spacing-1)]',
          'p-[var(--xp-spacing-1)]',
          'rounded-[var(--xp-radius-md)]',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(tabsListVariants({ variant }), className)}
      role="tablist"
      {...props}
    />
  )
);
TabsList.displayName = 'TabsList';

// Tabs Trigger
const tabsTriggerVariants = cva(
  [
    'inline-flex items-center justify-center whitespace-nowrap',
    'px-[var(--xp-spacing-4)] py-[var(--xp-spacing-2)]',
    'text-[var(--xp-font-size-body)] font-medium',
    'transition-all duration-[var(--xp-duration-fast)]',
    'focus:outline-none focus:ring-[var(--xp-focus-ring-width)] focus:ring-[var(--xp-focus-ring)] focus:ring-offset-[var(--xp-focus-ring-offset)]',
    'disabled:pointer-events-none disabled:opacity-[var(--xp-opacity-disabled)]',
    'cursor-pointer',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-b-2 border-transparent',
          'hover:text-[var(--xp-text-primary)]',
          'data-[state=active]:text-[var(--xp-brand-primary)]',
          'data-[state=active]:border-[var(--xp-brand-primary)]',
        ],
        pills: [
          'rounded-[var(--xp-radius-sm)]',
          'hover:bg-[var(--xp-bg-elevated)] hover:text-[var(--xp-text-primary)]',
          'data-[state=active]:bg-[var(--xp-bg-card)] data-[state=active]:text-[var(--xp-text-primary)]',
          'data-[state=active]:shadow-[var(--xp-elevation-1)]',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabsTriggerVariants> {
  /** The value of the tab */
  value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, variant, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useTabsContext();
    const isActive = selectedValue === value;

    return (
      <button
        ref={ref}
        className={cn(tabsTriggerVariants({ variant }), className)}
        role="tab"
        aria-selected={isActive}
        data-state={isActive ? 'active' : 'inactive'}
        onClick={() => onValueChange?.(value)}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

// Tabs Content
export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The value of the tab content */
  value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();
    const isActive = selectedValue === value;

    if (!isActive) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'mt-[var(--xp-spacing-4)] ring-offset-background',
          'focus:outline-none focus:ring-[var(--xp-focus-ring-width)] focus:ring-[var(--xp-focus-ring)] focus:ring-offset-[var(--xp-focus-ring-offset)]',
          className
        )}
        role="tabpanel"
        data-state={isActive ? 'active' : 'inactive'}
        tabIndex={0}
        {...props}
      />
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };