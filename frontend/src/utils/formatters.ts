import { format, parseISO } from 'date-fns';

/**
 * Format a number as Indian Rupees (INR)
 */
export const formatCurrency = (amount: number | string | undefined | null): string => {
  if (amount === undefined || amount === null) return '₹0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format date string to standard readable format
 */
export const formatDate = (dateString: string | Date | undefined | null, pattern: string = 'dd MMM yyyy'): string => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, pattern);
  } catch (e) {
    return '-';
  }
};

/**
 * Format date string to include date and time
 */
export const formatDateTime = (dateString: string | Date | undefined | null): string => {
  return formatDate(dateString, 'dd MMM yyyy hh:mm a');
};

/**
 * Format numbers with thousands separators
 */
export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};
