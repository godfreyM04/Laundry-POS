// Formatting utilities for LaundryPOS (Currency, Dates, Time, Phone Numbers)

const CURRENCY = import.meta.env.VITE_BUSINESS_CURRENCY || 'KES';

/**
 * Format numeric amount into currency representation (e.g., KES 1,250.00)
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `${CURRENCY} ${num.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Format ISO datetime string to readable local display
 */
export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '—';
  }
}

/**
 * Format ISO date string to readable date display (no time)
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

/**
 * Validate customer phone number (supports local 07xx, 01xx or international +254xx)
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  return clean.length >= 9 && clean.length <= 15 && /^(\+?\d+)$/.test(clean);
}

/**
 * Format phone number cleanly
 */
export function formatPhone(phone) {
  if (!phone) return '—';
  return phone.trim();
}
