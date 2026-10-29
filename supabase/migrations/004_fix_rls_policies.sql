-- LaundryPOS: Fix RLS Policies for Customers and Workstation Operations
-- Run this in Supabase SQL Editor to allow customer registration and counter operations

-- ============================================================================
-- 1. CUSTOMERS TABLE (Allow counter intake & lookups for both anon & authenticated)
-- ============================================================================
DROP POLICY IF EXISTS "Customers readable by staff" ON public.customers;
DROP POLICY IF EXISTS "Customers insertable by staff" ON public.customers;
DROP POLICY IF EXISTS "Customers updateable by staff" ON public.customers;
DROP POLICY IF EXISTS "Customers readable by all" ON public.customers;
DROP POLICY IF EXISTS "Customers insertable by all" ON public.customers;
DROP POLICY IF EXISTS "Customers updateable by all" ON public.customers;

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

-- ============================================================================
-- 2. SERVICES TABLE (Allow viewing catalogue by both anon & authenticated)
-- ============================================================================
DROP POLICY IF EXISTS "Services readable by all authenticated" ON public.services;
DROP POLICY IF EXISTS "Services readable by all" ON public.services;

CREATE POLICY "Services readable by all" ON public.services
    FOR SELECT TO anon, authenticated
    USING (true);

-- ============================================================================
-- 3. ORDERS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Orders readable by all staff" ON public.orders;
DROP POLICY IF EXISTS "Orders insertable by cashier or admin" ON public.orders;
DROP POLICY IF EXISTS "Orders updateable by staff according to role" ON public.orders;
DROP POLICY IF EXISTS "Orders readable by all" ON public.orders;
DROP POLICY IF EXISTS "Orders insertable by all" ON public.orders;
DROP POLICY IF EXISTS "Orders updateable by all" ON public.orders;

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

-- ============================================================================
-- 4. ORDER ITEMS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Order items readable by staff" ON public.order_items;
DROP POLICY IF EXISTS "Order items insertable by cashier or admin" ON public.order_items;
DROP POLICY IF EXISTS "Order items readable by all" ON public.order_items;
DROP POLICY IF EXISTS "Order items insertable by all" ON public.order_items;

CREATE POLICY "Order items readable by all" ON public.order_items
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Order items insertable by all" ON public.order_items
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- ============================================================================
-- 5. PAYMENTS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Payments readable by staff" ON public.payments;
DROP POLICY IF EXISTS "Payments insertable by cashier or admin" ON public.payments;
DROP POLICY IF EXISTS "Payments readable by all" ON public.payments;
DROP POLICY IF EXISTS "Payments insertable by all" ON public.payments;

CREATE POLICY "Payments readable by all" ON public.payments
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Payments insertable by all" ON public.payments
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- ============================================================================
-- 6. ORDER STATUS HISTORY TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Status history readable by staff" ON public.order_status_history;
DROP POLICY IF EXISTS "Status history insertable by staff" ON public.order_status_history;
DROP POLICY IF EXISTS "Status history readable by all" ON public.order_status_history;
DROP POLICY IF EXISTS "Status history insertable by all" ON public.order_status_history;

CREATE POLICY "Status history readable by all" ON public.order_status_history
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Status history insertable by all" ON public.order_status_history
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- ============================================================================
-- 7. NOTIFICATIONS TABLE
-- ============================================================================
DROP POLICY IF EXISTS "Notifications readable by target role or recipient" ON public.notifications;
DROP POLICY IF EXISTS "Notifications updateable by recipient" ON public.notifications;
DROP POLICY IF EXISTS "Notifications readable by all" ON public.notifications;
DROP POLICY IF EXISTS "Notifications updateable by all" ON public.notifications;

CREATE POLICY "Notifications readable by all" ON public.notifications
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Notifications updateable by all" ON public.notifications
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);
