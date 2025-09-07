// Theme
export { XpThemeProvider, useTheme, ThemeToggle } from '../theme/XpThemeProvider';
export type { Theme, ResolvedTheme } from '../theme/XpThemeProvider';

// Components
export { Button, buttonVariants } from '../components/Button';
export type { ButtonProps } from '../components/Button';

export { Input, inputVariants } from '../components/Input';
export type { InputProps } from '../components/Input';

export { Select, selectVariants } from '../components/Select';
export type { SelectProps, SelectOption } from '../components/Select';

export { Chip, Badge, chipVariants } from '../components/Chip';
export type { ChipProps } from '../components/Chip';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
} from '../components/Card';
export type { CardProps } from '../components/Card';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../components/Table';
export type { TableProps, TableRowProps, TableHeadProps, TableCellProps } from '../components/Table';

export { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/Tabs';
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps } from '../components/Tabs';

export {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from '../components/Modal';
export type { ModalProps } from '../components/Modal';

export { Toast, ToastProvider, ToastViewport, useToast, feedback, toastVariants } from '../components/Toast';
export type { ToastProps, Toast as ToastType, ToastVariant } from '../components/Toast';

export { Breadcrumbs, breadcrumbsVariants } from '../components/Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem } from '../components/Breadcrumbs';

// Utils
export { cn } from '../utils/cn';