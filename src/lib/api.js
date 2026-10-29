import { supabase, isSupabaseLive } from './supabase';
import { ORDER_STATUS, USER_ROLES } from './constants';

// ============================================================================
// INITIAL DEMO / OFFLINE SEED DATA (Used when live Supabase is not connected)
// ============================================================================
const DEMO_SERVICES = [
  { id: 'srv-1', name: 'Wash & Fold (Regular Laundry)', category: 'Wash & Fold', description: 'Everyday clothes washed, tumbled dried, and neatly folded.', price: 150.00, unit: 'kg', is_active: true },
  { id: 'srv-2', name: 'Wash & Press (Full Service)', category: 'Wash & Iron', description: 'Thorough wash, tumble dry, and crisp steam pressed on hangers.', price: 250.00, unit: 'kg', is_active: true },
  { id: 'srv-3', name: 'Steam Pressing Only (Shirts & Trousers)', category: 'Ironing & Pressing', description: 'Professional wrinkle-free steam ironing for work and formal wear.', price: 80.00, unit: 'item', is_active: true },
  { id: 'srv-4', name: 'Dry Cleaning: 2-Piece Suit', category: 'Dry Cleaning', description: 'Gentle eco-solvent dry clean and deluxe hand finish for suit jacket & trousers.', price: 800.00, unit: 'suit', is_active: true },
  { id: 'srv-5', name: 'Dry Cleaning: Evening Gown / Dress', category: 'Dry Cleaning', description: 'Delicate fabric care, beadwork inspection, and gentle finish.', price: 700.00, unit: 'item', is_active: true },
  { id: 'srv-6', name: 'Dry Cleaning: Winter Coat / Trench', category: 'Dry Cleaning', description: 'Heavy fabric deep clean, stain removal, and structural form press.', price: 600.00, unit: 'item', is_active: true },
  { id: 'srv-7', name: 'Duvet / Comforter (Queen / King)', category: 'Bedding & Linens', description: 'Hypoallergenic deep clean, thermal sanitization, and fluff drying.', price: 1000.00, unit: 'item', is_active: true },
  { id: 'srv-8', name: 'Heavy Wool Blanket / Fleece', category: 'Bedding & Linens', description: 'Soft-touch antibacterial wash and fiber restoration.', price: 600.00, unit: 'item', is_active: true },
  { id: 'srv-9', name: 'Curtains & Drapes Sanitizing', category: 'Home Care', description: 'Dust-mite extraction, steam wash, and odor neutralization.', price: 300.00, unit: 'kg', is_active: true },
  { id: 'srv-10', name: 'Sneaker & Shoe Deep Clean', category: 'Footwear', description: 'Hand scrub of midsoles, uppers, laces wash, and deodorization.', price: 500.00, unit: 'pair', is_active: true }
];

const DEMO_CUSTOMERS = [
  { id: 'cust-1', full_name: 'Grace Wanjiku', phone: '+254712345678', email: 'grace.wanjiku@example.com', address: 'Apartment 4B, Kilimani Gardens, Nairobi', notes: 'Prefers lavender scent softener.', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'cust-2', full_name: 'David Kiprop', phone: '+254722987654', email: 'david.k@example.com', address: 'House 12, Riverside Drive, Nairobi', notes: 'Delivers suits weekly. Always calls before dropoff.', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'cust-3', full_name: 'Amina Mohamed', phone: '+254733456789', email: 'amina.m@example.com', address: 'Block C, Parklands Heights, Nairobi', notes: 'Express pickup requests frequently.', created_at: new Date(Date.now() - 86400000 * 2).toISOString() }
];

const DEMO_ORDERS = [
  {
    id: 'ord-101',
    order_number: 'LP-2610-1001',
    customer_id: 'cust-1',
    customer_name: 'Grace Wanjiku',
    customer_phone: '+254712345678',
    customer_email: 'grace.wanjiku@example.com',
    status: ORDER_STATUS.READY,
    fulfillment_type: 'pickup',
    delivery_address: '',
    priority: 'standard',
    total_amount: 1450.00,
    total_paid: 1450.00,
    balance_due: 0.00,
    payment_status_computed: 'fully_paid',
    notes: 'Please separate whites and colored items.',
    ready_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    created_by_name: 'John Mwangi (Cashier)',
    items: [
      { id: 'oi-1', service_id: 'srv-1', service_name: 'Wash & Fold (Regular Laundry)', item_description: 'Mixed casual clothes (5kg)', quantity: 5, unit_price: 150.00, line_total: 750.00 },
      { id: 'oi-2', service_id: 'srv-5', service_name: 'Dry Cleaning: Evening Gown / Dress', item_description: 'Silk party dress', quantity: 1, unit_price: 700.00, line_total: 700.00 }
    ]
  },
  {
    id: 'ord-102',
    order_number: 'LP-2610-1002',
    customer_id: 'cust-2',
    customer_name: 'David Kiprop',
    customer_phone: '+254722987654',
    customer_email: 'david.k@example.com',
    status: ORDER_STATUS.PROCESSING,
    fulfillment_type: 'pickup',
    delivery_address: '',
    priority: 'express',
    total_amount: 1600.00,
    total_paid: 1000.00,
    balance_due: 600.00,
    payment_status_computed: 'partially_paid',
    notes: 'Extra starch on shirt collars.',
    ready_at: null,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_by_name: 'John Mwangi (Cashier)',
    items: [
      { id: 'oi-3', service_id: 'srv-4', service_name: 'Dry Cleaning: 2-Piece Suit', item_description: 'Navy business suit', quantity: 2, unit_price: 800.00, line_total: 1600.00 }
    ]
  },
  {
    id: 'ord-103',
    order_number: 'LP-2610-1003',
    customer_id: 'cust-3',
    customer_name: 'Amina Mohamed',
    customer_phone: '+254733456789',
    customer_email: 'amina.m@example.com',
    status: ORDER_STATUS.RECEIVED,
    fulfillment_type: 'delivery',
    delivery_address: 'Block C, Parklands Heights, Nairobi',
    priority: 'standard',
    total_amount: 1000.00,
    total_paid: 0.00,
    balance_due: 1000.00,
    payment_status_computed: 'unpaid',
    notes: 'Call 30 mins before dispatching.',
    ready_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_by_name: 'John Mwangi (Cashier)',
    items: [
      { id: 'oi-4', service_id: 'srv-7', service_name: 'Duvet / Comforter (Queen / King)', item_description: 'Down feather duvet', quantity: 1, unit_price: 1000.00, line_total: 1000.00 }
    ]
  }
];

const DEMO_PAYMENTS = [
  {
    id: 'pay-1',
    receipt_number: 'RCT-2610-5001',
    order_id: 'ord-101',
    order_number: 'LP-2610-1001',
    customer_name: 'Grace Wanjiku',
    amount: 1450.00,
    payment_method: 'mobile_money',
    payment_status: 'completed',
    transaction_reference: 'QGK72910KP',
    recorded_by_name: 'John Mwangi (Cashier)',
    created_at: new Date(Date.now() - 86400000 * 1 + 600000).toISOString(),
    notes: 'Paid in full via M-Pesa at dropoff'
  },
  {
    id: 'pay-2',
    receipt_number: 'RCT-2610-5002',
    order_id: 'ord-102',
    order_number: 'LP-2610-1002',
    customer_name: 'David Kiprop',
    amount: 1000.00,
    payment_method: 'cash',
    payment_status: 'completed',
    transaction_reference: 'CASH-DEP-01',
    recorded_by_name: 'John Mwangi (Cashier)',
    created_at: new Date(Date.now() - 3600000 * 5 + 300000).toISOString(),
    notes: 'Initial cash deposit'
  }
];

const DEMO_NOTIFICATIONS = [
  {
    id: 'notif-1',
    recipient_role: 'cashier',
    order_id: 'ord-101',
    order_number: 'LP-2610-1001',
    notification_type: 'order_ready',
    title: 'Order Ready for Handover: LP-2610-1001',
    message: 'Laundry for customer Grace Wanjiku (LP-2610-1001) is clean, pressed, and ready for collection.',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

const DEMO_PROFILES = [
  { id: 'usr-1', full_name: 'Sarah Kimani', phone: '+254700111222', role: USER_ROLES.ADMIN, is_active: true },
  { id: 'usr-2', full_name: 'John Mwangi', phone: '+254700333444', role: USER_ROLES.CASHIER, is_active: true },
  { id: 'usr-3', full_name: 'Peter Omondi', phone: '+254700555666', role: USER_ROLES.LAUNDRY_STAFF, is_active: true },
  { id: 'usr-4', full_name: 'Dennis Mutua', phone: '+254700777888', role: USER_ROLES.DELIVERY_STAFF, is_active: true }
];

// Helper to get or init demo storage
function getDemoDb() {
  const stored = localStorage.getItem('laundrypos_demo_db');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  const initial = {
    services: DEMO_SERVICES,
    customers: DEMO_CUSTOMERS,
    orders: DEMO_ORDERS,
    payments: DEMO_PAYMENTS,
    notifications: DEMO_NOTIFICATIONS,
    profiles: DEMO_PROFILES,
    status_history: [
      { id: 'sh-1', order_id: 'ord-101', previous_status: null, new_status: 'received', changed_by_name: 'John Mwangi', reason: 'Order registered at counter', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 'sh-2', order_id: 'ord-101', previous_status: 'received', new_status: 'processing', changed_by_name: 'Peter Omondi', reason: 'Loaded in wash cycle 2', created_at: new Date(Date.now() - 86400000 + 3600000).toISOString() },
      { id: 'sh-3', order_id: 'ord-101', previous_status: 'processing', new_status: 'ready', changed_by_name: 'Peter Omondi', reason: 'Ironing complete and bagged', created_at: new Date(Date.now() - 3600000 * 4).toISOString() }
    ]
  };
  saveDemoDb(initial);
  return initial;
}

function saveDemoDb(db) {
  localStorage.setItem('laundrypos_demo_db', JSON.stringify(db));
}

// ============================================================================
// API METHODS (Transparently switch between Supabase and Demo DB)
// ============================================================================

// --- CUSTOMERS ---
export async function getCustomers(searchQuery = '') {
  if (isSupabaseLive()) {
    let query = supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (searchQuery) {
      query = query.or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } else {
    const db = getDemoDb();
    if (!searchQuery) return db.customers;
    const q = searchQuery.toLowerCase();
    return db.customers.filter(c => 
      c.full_name.toLowerCase().includes(q) || 
      c.phone.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }
}

export async function createCustomer(customerData) {
  if (isSupabaseLive()) {
    const { data, error } = await supabase.from('customers').insert([customerData]).select().single();
    if (error) throw error;
    return data;
  } else {
    const db = getDemoDb();
    // Check phone uniqueness
    if (db.customers.some(c => c.phone === customerData.phone)) {
      throw new Error(`Customer with phone number ${customerData.phone} already exists.`);
    }
    const newCust = {
      id: `cust-${Date.now()}`,
      ...customerData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.customers.unshift(newCust);
    saveDemoDb(db);
    return newCust;
  }
}

export async function updateCustomer(id, customerData) {
  if (isSupabaseLive()) {
    const { data, error } = await supabase.from('customers').update(customerData).eq('id', id).select().single();
    if (error) throw error;
    return data;
  } else {
    const db = getDemoDb();
    const idx = db.customers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');
    db.customers[idx] = { ...db.customers[idx], ...customerData, updated_at: new Date().toISOString() };
    saveDemoDb(db);
    return db.customers[idx];
  }
}

// --- SERVICES ---
export async function getServices(activeOnly = true) {
  if (isSupabaseLive()) {
    let query = supabase.from('services').select('*').order('category', { ascending: true });
    if (activeOnly) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } else {
    const db = getDemoDb();
    if (activeOnly) return db.services.filter(s => s.is_active);
    return db.services;
  }
}

export async function createService(serviceData) {
  if (isSupabaseLive()) {
    const { data, error } = await supabase.from('services').insert([serviceData]).select().single();
    if (error) throw error;
    return data;
  } else {
    const db = getDemoDb();
    const newService = {
      id: `srv-${Date.now()}`,
      ...serviceData,
      is_active: serviceData.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.services.push(newService);
    saveDemoDb(db);
    return newService;
  }
}

export async function updateService(id, serviceData) {
  if (isSupabaseLive()) {
    const { data, error } = await supabase.from('services').update(serviceData).eq('id', id).select().single();
    if (error) throw error;
    return data;
  } else {
    const db = getDemoDb();
    const idx = db.services.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Service not found');
    db.services[idx] = { ...db.services[idx], ...serviceData, updated_at: new Date().toISOString() };
    saveDemoDb(db);
    return db.services[idx];
  }
}

// --- ORDERS ---
export async function getOrders(filters = {}) {
  if (isSupabaseLive()) {
    let query = supabase.from('orders_overview').select('*').order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.or(`order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`);
    }
    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } else {
    const db = getDemoDb();
    let result = [...db.orders];

    if (filters.status && filters.status !== 'all') {
      result = result.filter(o => o.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(o => 
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.toLowerCase().includes(q)
      );
    }
    if (filters.customerId) {
      result = result.filter(o => o.customer_id === filters.customerId);
    }
    return result;
  }
}

export async function getOrderById(orderId) {
  if (isSupabaseLive()) {
    const { data: order, error: orderErr } = await supabase.from('orders_overview').select('*').eq('id', orderId).single();
    if (orderErr) throw orderErr;

    const { data: items, error: itemsErr } = await supabase.from('order_items').select('*').eq('order_id', orderId);
    if (itemsErr) throw itemsErr;

    const { data: payments, error: payErr } = await supabase.from('payments').select('*, profiles:recorded_by(full_name)').eq('order_id', orderId).order('created_at', { ascending: false });
    if (payErr) throw payErr;

    const { data: history, error: histErr } = await supabase.from('order_status_history').select('*, profiles:changed_by(full_name)').eq('order_id', orderId).order('created_at', { ascending: true });
    if (histErr) throw histErr;

    return {
      ...order,
      items: items || [],
      payments: payments || [],
      history: history || []
    };
  } else {
    const db = getDemoDb();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');
    const payments = db.payments.filter(p => p.order_id === orderId);
    const history = (db.status_history || []).filter(h => h.order_id === orderId);
    return {
      ...order,
      payments,
      history
    };
  }
}

export async function createOrder({ customerId, fulfillmentType, deliveryAddress, priority, notes, items, creatorName = 'Cashier' }) {
  if (isSupabaseLive()) {
    const { data, error } = await supabase.rpc('create_laundry_order', {
      p_customer_id: customerId,
      p_fulfillment_type: fulfillmentType,
      p_delivery_address: deliveryAddress || null,
      p_priority: priority || 'standard',
      p_notes: notes || null,
      p_items: items
    });
    if (error) throw error;
    return data;
  } else {
    const db = getDemoDb();
    const customer = db.customers.find(c => c.id === customerId);
    if (!customer) throw new Error('Customer not found');
    if (!items || items.length === 0) throw new Error('At least one item is required');

    const orderNum = `LP-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth()+1).toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord-${Date.now()}`;

    let totalAmount = 0;
    const processedItems = items.map((item, idx) => {
      const lineTotal = Number(item.quantity) * Number(item.unit_price);
      totalAmount += lineTotal;
      return {
        id: `oi-${Date.now()}-${idx}`,
        order_id: orderId,
        service_id: item.service_id,
        service_name: item.service_name,
        item_description: item.item_description || '',
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        line_total: lineTotal
      };
    });

    const newOrder = {
      id: orderId,
      order_number: orderNum,
      customer_id: customer.id,
      customer_name: customer.full_name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      created_by_name: creatorName,
      status: ORDER_STATUS.RECEIVED,
      fulfillment_type: fulfillmentType,
      delivery_address: deliveryAddress || '',
      priority: priority || 'standard',
      total_amount: totalAmount,
      total_paid: 0.00,
      balance_due: totalAmount,
      payment_status_computed: 'unpaid',
      notes: notes || '',
      ready_at: null,
      collected_at: null,
      delivered_at: null,
      closed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: processedItems
    };

    db.orders.unshift(newOrder);

    // Initial status log
    if (!db.status_history) db.status_history = [];
    db.status_history.push({
      id: `sh-${Date.now()}`,
      order_id: orderId,
      previous_status: null,
      new_status: ORDER_STATUS.RECEIVED,
      changed_by_name: creatorName,
      reason: 'Order created at POS terminal.',
      created_at: new Date().toISOString()
    });

    saveDemoDb(db);
    return { success: true, order_id: orderId, order_number: orderNum, total_amount: totalAmount };
  }
}

export async function updateOrderStatus(orderId, newStatus, reason = '', staffName = 'Staff') {
  if (isSupabaseLive()) {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) throw error;
    return { success: true };
  } else {
    const db = getDemoDb();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const prevStatus = order.status;
    order.status = newStatus;
    order.updated_at = new Date().toISOString();

    if (newStatus === ORDER_STATUS.READY) {
      order.ready_at = new Date().toISOString();
      // create notification for cashiers
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        recipient_role: 'cashier',
        order_id: order.id,
        order_number: order.order_number,
        notification_type: 'order_ready',
        title: `Order Ready: ${order.order_number}`,
        message: `Order for ${order.customer_name} (${order.order_number}) is clean and ready for pickup/delivery.`,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }

    if (!db.status_history) db.status_history = [];
    db.status_history.push({
      id: `sh-${Date.now()}`,
      order_id: orderId,
      previous_status: prevStatus,
      new_status: newStatus,
      changed_by_name: staffName,
      reason: reason || `Status updated to ${newStatus}`,
      created_at: new Date().toISOString()
    });

    saveDemoDb(db);
    return { success: true };
  }
}

// --- PAYMENTS ---
export async function getPayments(filters = {}) {
  if (isSupabaseLive()) {
    let query = supabase.from('payments').select('*, orders(order_number), profiles:recorded_by(full_name)').order('created_at', { ascending: false });
    if (filters.orderId) query = query.eq('order_id', filters.orderId);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(p => ({
      ...p,
      order_number: p.orders?.order_number,
      recorded_by_name: p.profiles?.full_name
    }));
  } else {
    const db = getDemoDb();
    if (filters.orderId) return db.payments.filter(p => p.order_id === filters.orderId);
    return db.payments;
  }
}

export async function recordPayment({ orderId, amount, paymentMethod, transactionReference, notes, recordedByName = 'Cashier' }) {
  const payAmount = Number(amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  if (isSupabaseLive()) {
    const { data, error } = await supabase.rpc('record_order_payment', {
      p_order_id: orderId,
      p_amount: payAmount,
      p_payment_method: paymentMethod,
      p_transaction_reference: transactionReference || null,
      p_notes: notes || null
    });
    if (error) throw error;
    return data;
  } else {
    const db = getDemoDb();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    if (order.status === ORDER_STATUS.CLOSED || order.status === ORDER_STATUS.CANCELLED) {
      throw new Error(`Cannot record payment for a ${order.status} order.`);
    }

    // Verify balance
    if (payAmount > order.balance_due) {
      throw new Error(`Payment amount (KES ${payAmount}) exceeds outstanding balance of KES ${order.balance_due}.`);
    }

    const receiptNum = `RCT-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth()+1).toString().padStart(2,'0')}-${Math.floor(5000 + Math.random() * 5000)}`;
    const paymentId = `pay-${Date.now()}`;

    const newPayment = {
      id: paymentId,
      receipt_number: receiptNum,
      order_id: orderId,
      order_number: order.order_number,
      customer_name: order.customer_name,
      amount: payAmount,
      payment_method: paymentMethod,
      payment_status: 'completed',
      transaction_reference: transactionReference || '',
      recorded_by_name: recordedByName,
      created_at: new Date().toISOString(),
      verified_at: new Date().toISOString(),
      notes: notes || ''
    };

    db.payments.unshift(newPayment);

    // Update order balances
    order.total_paid = Number(order.total_paid) + payAmount;
    order.balance_due = Number(order.total_amount) - order.total_paid;
    order.payment_status_computed = order.balance_due <= 0 ? 'fully_paid' : 'partially_paid';
    order.updated_at = new Date().toISOString();

    saveDemoDb(db);
    return {
      success: true,
      payment_id: paymentId,
      receipt_number: receiptNum,
      amount_paid: payAmount,
      remaining_balance: order.balance_due,
      payment: newPayment
    };
  }
}

// --- HANDOVER & ORDER CLOSURE ---
export async function handoverOrder({ orderId, notes = '' }) {
  if (isSupabaseLive()) {
    const { data, error } = await supabase.rpc('handover_order', {
      p_order_id: orderId,
      p_notes: notes
    });
    if (error) throw error;
    return data;
  } else {
    const db = getDemoDb();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    if (order.status !== ORDER_STATUS.READY && order.status !== ORDER_STATUS.AWAITING_COLLECTION) {
      throw new Error(`Order must be ready before handover. Current status: ${order.status}`);
    }

    if (order.balance_due > 0) {
      throw new Error(`Cannot complete handover: Outstanding balance of KES ${order.balance_due} must be paid in full.`);
    }

    const targetStatus = order.fulfillment_type === 'delivery' ? ORDER_STATUS.DELIVERED : ORDER_STATUS.COLLECTED;
    order.status = targetStatus;
    if (targetStatus === ORDER_STATUS.DELIVERED) {
      order.delivered_at = new Date().toISOString();
    } else {
      order.collected_at = new Date().toISOString();
    }
    if (notes) {
      order.notes = order.notes ? `${order.notes}\nHandover note: ${notes}` : `Handover note: ${notes}`;
    }
    order.updated_at = new Date().toISOString();

    if (!db.status_history) db.status_history = [];
    db.status_history.push({
      id: `sh-${Date.now()}`,
      order_id: orderId,
      previous_status: ORDER_STATUS.READY,
      new_status: targetStatus,
      changed_by_name: 'Cashier / Delivery Staff',
      reason: notes || `Customer ${targetStatus} verified after full payment confirmation.`,
      created_at: new Date().toISOString()
    });

    saveDemoDb(db);
    return { success: true, new_status: targetStatus };
  }
}

export async function closeOrder({ orderId, notes = '', closedByName = 'Cashier' }) {
  if (isSupabaseLive()) {
    const { data, error } = await supabase.rpc('close_order', {
      p_order_id: orderId,
      p_notes: notes
    });
    if (error) throw error;
    return data;
  } else {
    const db = getDemoDb();
    const order = db.orders.find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    if (order.status !== ORDER_STATUS.COLLECTED && order.status !== ORDER_STATUS.DELIVERED) {
      throw new Error(`Order can only be closed after collection or delivery. Current status: ${order.status}`);
    }

    if (order.balance_due > 0) {
      throw new Error(`Cannot close order with an outstanding balance of KES ${order.balance_due}.`);
    }

    order.status = ORDER_STATUS.CLOSED;
    order.closed_at = new Date().toISOString();
    order.closed_by_name = closedByName;
    order.updated_at = new Date().toISOString();

    if (!db.status_history) db.status_history = [];
    db.status_history.push({
      id: `sh-${Date.now()}`,
      order_id: orderId,
      previous_status: ORDER_STATUS.COLLECTED,
      new_status: ORDER_STATUS.CLOSED,
      changed_by_name: closedByName,
      reason: notes || 'Order verified, fulfilled, and permanently closed.',
      created_at: new Date().toISOString()
    });

    saveDemoDb(db);
    return { success: true, status: 'closed' };
  }
}

// --- NOTIFICATIONS ---
export async function getNotifications(userRole = 'all') {
  if (isSupabaseLive()) {
    let query = supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } else {
    const db = getDemoDb();
    return db.notifications || [];
  }
}

export async function markNotificationAsRead(notifId) {
  if (isSupabaseLive()) {
    const { error } = await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', notifId);
    if (error) throw error;
    return true;
  } else {
    const db = getDemoDb();
    const notif = (db.notifications || []).find(n => n.id === notifId);
    if (notif) notif.is_read = true;
    saveDemoDb(db);
    return true;
  }
}

// --- STAFF PROFILES ---
export async function getStaffProfiles() {
  if (isSupabaseLive()) {
    const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
    if (error) throw error;
    return data || [];
  } else {
    const db = getDemoDb();
    return db.profiles || [];
  }
}

export async function updateStaffProfile(userId, updates) {
  if (isSupabaseLive()) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  } else {
    const db = getDemoDb();
    const idx = (db.profiles || []).findIndex(p => p.id === userId);
    if (idx !== -1) {
      db.profiles[idx] = { ...db.profiles[idx], ...updates };
      saveDemoDb(db);
      return db.profiles[idx];
    }
    throw new Error('Staff profile not found');
  }
}

// --- REPORTS & OPERATIONAL SUMMARY ---
export async function getOperationalSummary() {
  const orders = await getOrders();
  const payments = await getPayments();

  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter(o => o.status !== ORDER_STATUS.CLOSED && o.status !== ORDER_STATUS.CANCELLED).length;
  const readyOrdersCount = orders.filter(o => o.status === ORDER_STATUS.READY).length;
  const processingCount = orders.filter(o => o.status === ORDER_STATUS.PROCESSING).length;
  const closedOrdersCount = orders.filter(o => o.status === ORDER_STATUS.CLOSED).length;

  const totalOrderValue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const actualMoneyReceived = payments.filter(p => p.payment_status === 'completed').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalOutstandingBalance = orders
    .filter(o => o.status !== ORDER_STATUS.CANCELLED)
    .reduce((sum, o) => sum + Number(o.balance_due || 0), 0);

  return {
    totalOrdersCount,
    activeOrdersCount,
    readyOrdersCount,
    processingCount,
    closedOrdersCount,
    totalOrderValue,
    actualMoneyReceived,
    totalOutstandingBalance
  };
}
