import { format, parseISO } from 'date-fns';

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
};

// Format date with time
export const formatDateTime = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy h:mm a');
  } catch (error) {
    return 'Invalid date';
  }
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  // Basic formatting, can be adjusted based on country code requirements
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Calculate loan repayment amount (simple interest)
export const calculateLoanRepayment = (
  principal: number,
  interestRate: number,
  tenure: number
): number => {
  // Simple interest calculation
  const interest = (principal * interestRate * tenure) / 100;
  const totalAmount = principal + interest;
  const monthlyPayment = totalAmount / tenure;
  return monthlyPayment;
};