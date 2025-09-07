import { clsx, type ClassValue } from 'clsx';

/**
 * Combines class names using clsx
 * Note: We intentionally don't use tailwind-merge here as this component library
 * uses CSS variables instead of Tailwind utility classes
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}