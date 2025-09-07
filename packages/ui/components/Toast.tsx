import React, { createContext, useContext, useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

// Toast Types
export type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  dismissible?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Toast Context
interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      duration: 3500, // Default from design tokens
      dismissible: true,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const clearToasts = () => {
    setToasts([]);
  };

  // Helper functions with voice integration
  const showToast = {
    default: (message: string, options?: Partial<Toast>) =>
      addToast({ message: message || 'Something looks off.', variant: 'default', ...options }),
    
    success: (message: string, options?: Partial<Toast>) =>
      addToast({ message, variant: 'success', ...options }),
    
    warning: (message: string, options?: Partial<Toast>) =>
      addToast({ message, variant: 'warning', ...options }),
    
    error: (message: string, options?: Partial<Toast>) =>
      addToast({ message: message || 'Something looks off.', variant: 'error', ...options }),
    
    critical: (message: string, options?: Partial<Toast>) =>
      addToast({ message: message || 'Critical Alert.', variant: 'error', ...options }),
    
    info: (message: string, options?: Partial<Toast>) =>
      addToast({ message, variant: 'info', ...options }),
  };

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    ...showToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
}

// Toast Component Variants
const toastVariants = cva(
  [
    'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden',
    'bg-[var(--xp-toast-bg)] text-[var(--xp-toast-text)]',
    'rounded-[var(--xp-toast-radius)]',
    'border border-[var(--xp-border-default)]',
    'p-[var(--xp-spacing-4)]',
    'shadow-[var(--xp-elevation-2)]',
    'transition-all duration-[var(--xp-duration-base)]',
    'data-[swipe=cancel]:translate-x-0',
    'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
    'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
    'data-[swipe=move]:transition-none',
    'data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full data-[state=open]:fade-in-0',
    'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full data-[state=closed]:fade-out-0',
  ],
  {
    variants: {
      variant: {
        default: '',
        success: 'border-[var(--xp-status-success)]',
        warning: 'border-[var(--xp-status-warning)]',
        error: 'border-[var(--xp-status-critical)]',
        info: 'border-[var(--xp-status-info)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// Toast Component
export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastComponent = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, toast, onRemove, ...props }, ref) => {
    const getIcon = () => {
      switch (variant || toast.variant) {
        case 'success':
          return <CheckCircle className="h-4 w-4 text-[var(--xp-status-success)]" />;
        case 'warning':
          return <AlertTriangle className="h-4 w-4 text-[var(--xp-status-warning)]" />;
        case 'error':
          return <AlertCircle className="h-4 w-4 text-[var(--xp-status-critical)]" />;
        case 'info':
          return <Info className="h-4 w-4 text-[var(--xp-status-info)]" />;
        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant: variant || toast.variant }), className)}
        {...props}
      >
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1 space-y-1">
            {toast.title && (
              <div className="text-sm font-medium">
                {toast.title}
              </div>
            )}
            <div className="text-sm opacity-90">
              {toast.message}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {toast.action.label}
            </button>
          )}
          
          {toast.dismissible && (
            <button
              onClick={() => onRemove(toast.id)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent bg-transparent text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

ToastComponent.displayName = 'Toast';

// Toast Viewport (renders all toasts)
function ToastViewport() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 right-0 z-[var(--xp-z-index-toast)] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
          className="mb-2 last:mb-0"
        />
      ))}
    </div>
  );
}

// Feedback utilities with voice integration
export const feedback = {
  /**
   * Default feedback message: "Something looks off."
   */
  default: (message?: string, options?: Partial<Toast>) => {
    const context = React.useContext(ToastContext);
    return context?.addToast({
      message: message || 'Something looks off.',
      variant: 'default',
      ...options,
    });
  },

  /**
   * Critical alert message: "Critical Alert." by default
   */
  critical: (message?: string, options?: Partial<Toast>) => {
    const context = React.useContext(ToastContext);
    return context?.addToast({
      message: message || 'Critical Alert.',
      variant: 'error',
      duration: 0, // Don't auto-dismiss critical alerts
      ...options,
    });
  },

  success: (message: string, options?: Partial<Toast>) => {
    const context = React.useContext(ToastContext);
    return context?.addToast({
      message,
      variant: 'success',
      ...options,
    });
  },

  warning: (message: string, options?: Partial<Toast>) => {
    const context = React.useContext(ToastContext);
    return context?.addToast({
      message,
      variant: 'warning',
      ...options,
    });
  },

  info: (message: string, options?: Partial<Toast>) => {
    const context = React.useContext(ToastContext);
    return context?.addToast({
      message,
      variant: 'info',
      ...options,
    });
  },
};

export { ToastComponent as Toast, ToastViewport, toastVariants };