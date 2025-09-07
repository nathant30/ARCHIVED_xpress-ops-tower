import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const modalVariants = cva(
  [
    'fixed inset-0 z-[var(--xp-z-index-modal)]',
    'flex items-center justify-center',
    'p-[var(--xp-spacing-4)]',
  ]
);

const modalOverlayVariants = cva([
  'fixed inset-0',
  'bg-black/[var(--xp-opacity-overlay)]',
  'backdrop-blur-sm',
]);

const modalContentVariants = cva(
  [
    'relative',
    'bg-[var(--xp-bg-card)]',
    'border border-[var(--xp-border-default)]',
    'rounded-[var(--xp-modal-radius)]',
    'shadow-[var(--xp-elevation-3)]',
    'w-full max-h-[90vh] overflow-auto',
    'focus:outline-none',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-[var(--xp-modal-maxWidth-sm)]',
        md: 'max-w-[var(--xp-modal-maxWidth-md)]',
        lg: 'max-w-[var(--xp-modal-maxWidth-lg)]',
        full: 'max-w-[95vw] max-h-[95vh]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalContentVariants> {
  /** Whether the modal is open */
  open?: boolean;
  /** Callback when the modal should close */
  onClose?: () => void;
  /** Whether clicking the overlay should close the modal */
  closeOnOverlayClick?: boolean;
  /** Whether pressing Escape should close the modal */
  closeOnEscape?: boolean;
  /** Whether to show the close button */
  showCloseButton?: boolean;
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({
    children,
    className,
    size,
    open = false,
    onClose,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    ...props
  }, ref) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Focus management
    useEffect(() => {
      if (open) {
        previousFocusRef.current = document.activeElement as HTMLElement;
        modalRef.current?.focus();
        
        // Trap focus within modal
        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key !== 'Tab') return;
          
          const modal = modalRef.current;
          if (!modal) return;
          
          const focusableElements = modal.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
          );
          
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        };
        
        document.addEventListener('keydown', handleTabKey);
        return () => document.removeEventListener('keydown', handleTabKey);
      } else {
        // Restore focus when modal closes
        previousFocusRef.current?.focus();
      }
    }, [open]);

    // Handle Escape key
    useEffect(() => {
      if (!open || !closeOnEscape) return;
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose?.();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, closeOnEscape, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (open) {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = originalStyle;
        };
      }
    }, [open]);

    if (!open) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        onClose?.();
      }
    };

    return (
      <div className={modalVariants()}>
        {/* Overlay */}
        <div 
          className={modalOverlayVariants()} 
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
        
        {/* Content */}
        <div
          ref={modalRef}
          className={cn(modalContentVariants({ size }), className)}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          {...props}
        >
          {showCloseButton && (
            <button
              onClick={onClose}
              className={cn(
                'absolute top-[var(--xp-spacing-4)] right-[var(--xp-spacing-4)]',
                'p-1 rounded-[var(--xp-radius-sm)]',
                'text-[var(--xp-text-muted)] hover:text-[var(--xp-text-primary)]',
                'hover:bg-[var(--xp-bg-elevated)]',
                'focus:outline-none focus:ring-[var(--xp-focus-ring-width)] focus:ring-[var(--xp-focus-ring)]',
                'transition-colors duration-[var(--xp-duration-fast)]'
              )}
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {children}
        </div>
      </div>
    );
  }
);

Modal.displayName = 'Modal';

// Modal sub-components
const ModalHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5 p-[var(--xp-spacing-6)]',
        'border-b border-[var(--xp-border-default)]',
        className
      )}
      {...props}
    />
  )
);
ModalHeader.displayName = 'ModalHeader';

const ModalTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        'text-[var(--xp-font-size-h2)] font-semibold leading-none tracking-tight text-[var(--xp-text-primary)]',
        className
      )}
      {...props}
    />
  )
);
ModalTitle.displayName = 'ModalTitle';

const ModalDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
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
ModalDescription.displayName = 'ModalDescription';

const ModalContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-[var(--xp-spacing-6)]', className)}
      {...props}
    />
  )
);
ModalContent.displayName = 'ModalContent';

const ModalFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        'p-[var(--xp-spacing-6)]',
        'border-t border-[var(--xp-border-default)]',
        className
      )}
      {...props}
    />
  )
);
ModalFooter.displayName = 'ModalFooter';

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
};