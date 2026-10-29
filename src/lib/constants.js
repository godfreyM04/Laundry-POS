// Core System Constants for LaundryPOS

export const USER_ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
  LAUNDRY_STAFF: 'laundry_staff',
  DELIVERY_STAFF: 'delivery_staff'
};

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.CASHIER]: 'Cashier / Front Desk',
  [USER_ROLES.LAUNDRY_STAFF]: 'Laundry Processing Staff',
  [USER_ROLES.DELIVERY_STAFF]: 'Delivery Dispatcher'
};

export const ORDER_STATUS = {
  RECEIVED: 'received',
  PROCESSING: 'processing',
  READY: 'ready',
  AWAITING_COLLECTION: 'awaiting_collection',
  COLLECTED: 'collected',
  DELIVERED: 'delivered',
  CLOSED: 'closed',
  CANCELLED: 'cancelled'
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.RECEIVED]: 'Order Received',
  [ORDER_STATUS.PROCESSING]: 'In Processing',
  [ORDER_STATUS.READY]: 'Ready for Handover',
  [ORDER_STATUS.AWAITING_COLLECTION]: 'Awaiting Collection',
  [ORDER_STATUS.COLLECTED]: 'Collected by Customer',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CLOSED]: 'Order Closed & Finalized',
  [ORDER_STATUS.CANCELLED]: 'Cancelled'
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE_MONEY: 'mobile_money',
  BANK_TRANSFER: 'bank_transfer'
};

export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.CARD]: 'Debit / Credit Card',
  [PAYMENT_METHODS.MOBILE_MONEY]: 'Mobile Money (e.g. M-Pesa)',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Direct Bank Transfer'
};

export const PAYMENT_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const FULFILLMENT_TYPES = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery'
};

export const ORDER_PRIORITIES = {
  STANDARD: 'standard',
  EXPRESS: 'express',
  URGENT: 'urgent'
};
