-- LaundryPOS: Initial Schema Migration
-- Designed for Supabase PostgreSQL
-- Version: 1.0.1 (Schema Qualified Types & Search Path Hardening)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. SEQUENCES FOR HUMAN-READABLE ORDER & RECEIPT REFERENCES
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START WITH 5001;

-- ============================================================================
-- 2. CORE ENUMS & TYPES (Explicitly in public schema)
-- ============================================================================
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'cashier', 'laundry_staff', 'delivery_staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM (
        'received',
        'processing',
        'ready',
        'awaiting_collection',
        'collected',
        'delivered',
        'closed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.fulfillment_type AS ENUM ('pickup', 'delivery');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_priority AS ENUM ('standard', 'express', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'mobile_money', 'bank_transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('completed', 'pending', 'failed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 3. PROFILES TABLE (Associated with Supabase Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role public.user_role NOT NULL DEFAULT 'cashier'::public.user_role,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- ============================================================================
-- 4. CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_full_name ON public.customers(full_name);

-- ============================================================================
-- 5. SERVICES TABLE (Pricing & Catalogue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Wash & Fold',
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    unit TEXT NOT NULL DEFAULT 'kg', -- 'kg', 'item', 'pair', 'suit', etc.
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

-- ============================================================================
-- 6. ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status public.order_status NOT NULL DEFAULT 'received'::public.order_status,
    fulfillment_type public.fulfillment_type NOT NULL DEFAULT 'pickup'::public.fulfillment_type,
    delivery_address TEXT,
    assigned_delivery_staff UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    priority public.order_priority NOT NULL DEFAULT 'standard'::public.order_priority,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    notes TEXT,
    ready_at TIMESTAMPTZ,
    collected_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- ============================================================================
-- 7. ORDER ITEMS TABLE (Line Items with Unit Price Snapshot)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT,
    service_name TEXT NOT NULL,
    item_description TEXT,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ============================================================================
-- 8. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method public.payment_method NOT NULL DEFAULT 'cash'::public.payment_method,
    payment_status public.payment_status NOT NULL DEFAULT 'completed'::public.payment_status,
    transaction_reference TEXT,
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    verified_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- ============================================================================
-- 9. ORDER STATUS HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status public.order_status,
    new_status public.order_status NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

-- ============================================================================
-- 10. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_role public.user_role,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_role ON public.notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ============================================================================
-- 11. HELPER FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_prefix TEXT;
    v_seq_val BIGINT;
BEGIN
    v_prefix := 'LP-' || to_char(now(), 'YYMM') || '-';
    v_seq_val := nextval('order_number_seq');
    RETURN v_prefix || lpad(v_seq_val::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_prefix TEXT;
    v_seq_val BIGINT;
BEGIN
    v_prefix := 'RCT-' || to_char(now(), 'YYMM') || '-';
    v_seq_val := nextval('receipt_number_seq');
    RETURN v_prefix || lpad(v_seq_val::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- 12. ORDER STATUS CHANGE & NOTIFICATION TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_customer_name TEXT;
    v_changed_by UUID;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        v_changed_by := auth.uid();

        INSERT INTO public.order_status_history (
            order_id,
            previous_status,
            new_status,
            changed_by,
            reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            v_changed_by,
            'Status updated to ' || NEW.status::text
        );

        IF NEW.status = 'ready' THEN
            NEW.ready_at := timezone('utc', now());

            SELECT full_name INTO v_customer_name FROM public.customers WHERE id = NEW.customer_id;

            INSERT INTO public.notifications (
                recipient_role,
                order_id,
                notification_type,
                title,
                message
            ) VALUES (
                'cashier'::public.user_role,
                NEW.id,
                'order_ready',
                'Order Ready for Handover: ' || NEW.order_number,
                'Laundry for customer ' || coalesce(v_customer_name, 'Unknown') || ' (' || NEW.order_number || ') is now clean, pressed, and ready for collection/delivery.'
            );
        END IF;

        IF NEW.status = 'collected' THEN
            NEW.collected_at := timezone('utc', now());
        ELSIF NEW.status = 'delivered' THEN
            NEW.delivered_at := timezone('utc', now());
        ELSIF NEW.status = 'closed' THEN
            NEW.closed_at := timezone('utc', now());
            NEW.closed_by := v_changed_by;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_change ON public.orders;
CREATE TRIGGER trg_order_status_change
BEFORE UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION handle_order_status_change();

-- ============================================================================
-- 13. AUTH USER SYNC TRIGGER (Hardened Search Path & Explicit Public Schema)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
        NEW.id,
        coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Staff Member'),
        NEW.raw_user_meta_data->>'phone',
        coalesce((NEW.raw_user_meta_data->>'role')::public.user_role, 'cashier'::public.user_role)
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        phone = coalesce(EXCLUDED.phone, public.profiles.phone);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- 14. COMPREHENSIVE VIEW: orders_overview
-- ============================================================================
CREATE OR REPLACE VIEW public.orders_overview AS
SELECT
    o.id,
    o.order_number,
    o.customer_id,
    c.full_name AS customer_name,
    c.phone AS customer_phone,
    c.email AS customer_email,
    o.created_by,
    p_creator.full_name AS created_by_name,
    o.status,
    o.fulfillment_type,
    o.delivery_address,
    o.assigned_delivery_staff,
    p_delivery.full_name AS delivery_staff_name,
    o.priority,
    o.total_amount,
    COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'completed'), 0.00)::NUMERIC(12,2) AS total_paid,
    (o.total_amount - COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'completed'), 0.00))::NUMERIC(12,2) AS balance_due,
    CASE 
        WHEN COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'completed'), 0.00) = 0 THEN 'unpaid'
        WHEN COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'completed'), 0.00) < o.total_amount THEN 'partially_paid'
        ELSE 'fully_paid'
    END AS payment_status_computed,
    COUNT(DISTINCT oi.id) AS item_count,
    o.notes,
    o.ready_at,
    o.collected_at,
    o.delivered_at,
    o.closed_at,
    o.closed_by,
    p_closer.full_name AS closed_by_name,
    o.created_at,
    o.updated_at
FROM public.orders o
JOIN public.customers c ON o.customer_id = c.id
LEFT JOIN public.profiles p_creator ON o.created_by = p_creator.id
LEFT JOIN public.profiles p_delivery ON o.assigned_delivery_staff = p_delivery.id
LEFT JOIN public.profiles p_closer ON o.closed_by = p_closer.id
LEFT JOIN public.order_items oi ON o.id = oi.order_id
LEFT JOIN public.payments p ON o.id = p.order_id
GROUP BY
    o.id,
    o.order_number,
    o.customer_id,
    c.full_name,
    c.phone,
    c.email,
    o.created_by,
    p_creator.full_name,
    o.status,
    o.fulfillment_type,
    o.delivery_address,
    o.assigned_delivery_staff,
    p_delivery.full_name,
    o.priority,
    o.total_amount,
    o.notes,
    o.ready_at,
    o.collected_at,
    o.delivered_at,
    o.closed_at,
    o.closed_by,
    p_closer.full_name,
    o.created_at,
    o.updated_at;

-- ============================================================================
-- 15. ATOMIC BUSINESS OPERATIONS (SECURE RPC FUNCTIONS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_laundry_order(
    p_customer_id UUID,
    p_fulfillment_type public.fulfillment_type,
    p_delivery_address TEXT,
    p_priority public.order_priority,
    p_notes TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_total_amount NUMERIC(12,2) := 0.00;
    v_item JSONB;
    v_qty NUMERIC(10,2);
    v_unit_price NUMERIC(12,2);
    v_line_total NUMERIC(12,2);
    v_service_id UUID;
    v_service_name TEXT;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();
    
    IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = p_customer_id) THEN
        RAISE EXCEPTION 'Customer not found.';
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one line item.';
    END IF;

    v_order_number := generate_order_number();

    INSERT INTO public.orders (
        order_number,
        customer_id,
        created_by,
        status,
        fulfillment_type,
        delivery_address,
        priority,
        total_amount,
        notes
    ) VALUES (
        v_order_number,
        p_customer_id,
        v_caller_id,
        'received'::public.order_status,
        p_fulfillment_type,
        p_delivery_address,
        p_priority,
        0.00,
        p_notes
    ) RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_service_id := (v_item->>'service_id')::UUID;
        v_qty := (v_item->>'quantity')::NUMERIC(10,2);
        
        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Item quantity must be greater than zero.';
        END IF;

        SELECT name, price INTO v_service_name, v_unit_price
        FROM public.services
        WHERE id = v_service_id AND is_active = true;

        IF v_service_name IS NULL THEN
            v_service_name := coalesce(v_item->>'service_name', 'Custom Laundry Service');
            v_unit_price := (v_item->>'unit_price')::NUMERIC(12,2);
        END IF;

        IF v_unit_price < 0 THEN
            RAISE EXCEPTION 'Item price cannot be negative.';
        END IF;

        v_line_total := ROUND(v_qty * v_unit_price, 2);
        v_total_amount := v_total_amount + v_line_total;

        INSERT INTO public.order_items (
            order_id,
            service_id,
            service_name,
            item_description,
            quantity,
            unit_price,
            line_total
        ) VALUES (
            v_order_id,
            v_service_id,
            v_service_name,
            v_item->>'item_description',
            v_qty,
            v_unit_price,
            v_line_total
        );
    END LOOP;

    UPDATE public.orders
    SET total_amount = v_total_amount
    WHERE id = v_order_id;

    INSERT INTO public.order_status_history (
        order_id,
        previous_status,
        new_status,
        changed_by,
        reason
    ) VALUES (
        v_order_id,
        null,
        'received'::public.order_status,
        v_caller_id,
        'Order created at cashier POS counter.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_total_amount
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_order_payment(
    p_order_id UUID,
    p_amount NUMERIC(12,2),
    p_payment_method public.payment_method,
    p_transaction_reference TEXT,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_total_paid NUMERIC(12,2);
    v_outstanding NUMERIC(12,2);
    v_receipt_number TEXT;
    v_payment_id UUID;
    v_caller_id UUID;
BEGIN
    v_caller_id := auth.uid();

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Payment amount must be greater than zero.';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    IF v_order.status = 'closed' OR v_order.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot record payment for a closed or cancelled order.';
    END IF;

    SELECT COALESCE(SUM(amount), 0.00) INTO v_total_paid
    FROM public.payments
    WHERE order_id = p_order_id AND payment_status = 'completed';

    v_outstanding := v_order.total_amount - v_total_paid;

    IF p_amount > v_outstanding THEN
        RAISE EXCEPTION 'Payment of % exceeds outstanding balance of %.', p_amount, v_outstanding;
    END IF;

    v_receipt_number := generate_receipt_number();

    INSERT INTO public.payments (
        receipt_number,
        order_id,
        amount,
        payment_method,
        payment_status,
        transaction_reference,
        recorded_by,
        notes,
        verified_at
    ) VALUES (
        v_receipt_number,
        p_order_id,
        p_amount,
        p_payment_method,
        'completed'::public.payment_status,
        p_transaction_reference,
        v_caller_id,
        p_notes,
        timezone('utc', now())
    ) RETURNING id INTO v_payment_id;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', v_payment_id,
        'receipt_number', v_receipt_number,
        'amount_paid', p_amount,
        'remaining_balance', (v_outstanding - p_amount)
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.handover_order(
    p_order_id UUID,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_total_paid NUMERIC(12,2);
    v_balance NUMERIC(12,2);
    v_target_status public.order_status;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    IF v_order.status != 'ready' AND v_order.status != 'awaiting_collection' THEN
        RAISE EXCEPTION 'Order must be ready before handover. Current status: %', v_order.status;
    END IF;

    SELECT COALESCE(SUM(amount), 0.00) INTO v_total_paid
    FROM public.payments
    WHERE order_id = p_order_id AND payment_status = 'completed';

    v_balance := v_order.total_amount - v_total_paid;

    IF v_balance > 0 THEN
        RAISE EXCEPTION 'Cannot complete handover: Order has an outstanding balance of KES %.', v_balance;
    END IF;

    IF v_order.fulfillment_type = 'delivery' THEN
        v_target_status := 'delivered'::public.order_status;
    ELSE
        v_target_status := 'collected'::public.order_status;
    END IF;

    UPDATE public.orders
    SET
        status = v_target_status,
        notes = CASE 
            WHEN p_notes IS NOT NULL AND p_notes <> '' THEN coalesce(notes || E'\nHandover note: ' || p_notes, p_notes)
            ELSE notes
        END
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'new_status', v_target_status
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.close_order(
    p_order_id UUID,
    p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_total_paid NUMERIC(12,2);
    v_balance NUMERIC(12,2);
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

    IF v_order.id IS NULL THEN
        RAISE EXCEPTION 'Order not found.';
    END IF;

    IF v_order.status != 'collected' AND v_order.status != 'delivered' THEN
        RAISE EXCEPTION 'Order can only be closed after collection or delivery. Current status: %', v_order.status;
    END IF;

    SELECT COALESCE(SUM(amount), 0.00) INTO v_total_paid
    FROM public.payments
    WHERE order_id = p_order_id AND payment_status = 'completed';

    v_balance := v_order.total_amount - v_total_paid;

    IF v_balance > 0 THEN
        RAISE EXCEPTION 'Cannot close order with an outstanding balance of KES %.', v_balance;
    END IF;

    UPDATE public.orders
    SET
        status = 'closed'::public.order_status,
        closed_by = auth.uid(),
        closed_at = timezone('utc', now())
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'status', 'closed'
    );
END;
$$;

-- ============================================================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE POLICY "Profiles readable by authenticated staff" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Profiles updateable by user themselves or admin" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id OR public.get_auth_role() = 'admin'::public.user_role)
    WITH CHECK (auth.uid() = id OR public.get_auth_role() = 'admin'::public.user_role);

CREATE POLICY "Profiles insertable by authenticated users" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id OR public.get_auth_role() = 'admin'::public.user_role);

CREATE POLICY "Customers readable by all" ON public.customers
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Customers insertable by all" ON public.customers
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Customers updateable by all" ON public.customers
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Services readable by all" ON public.services
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Services manageable by admin" ON public.services
    FOR ALL TO authenticated
    USING (public.get_auth_role() = 'admin'::public.user_role)
    WITH CHECK (public.get_auth_role() = 'admin'::public.user_role);

CREATE POLICY "Orders readable by all" ON public.orders
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Orders insertable by all" ON public.orders
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Orders updateable by all" ON public.orders
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Order items readable by all" ON public.order_items
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Order items insertable by all" ON public.order_items
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Payments readable by all" ON public.payments
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Payments insertable by all" ON public.payments
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Status history readable by all" ON public.order_status_history
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Status history insertable by all" ON public.order_status_history
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Notifications readable by all" ON public.notifications
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Notifications updateable by all" ON public.notifications
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);
