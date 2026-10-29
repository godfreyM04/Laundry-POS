-- LaundryPOS: Fix for Auth User Creation Trigger & Search Path
-- Run this in Supabase SQL Editor to resolve: "type 'user_role' does not exist"

-- 1. Ensure public.user_role enum exists with explicit public schema qualification
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'cashier', 'laundry_staff', 'delivery_staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update the auth trigger function to explicitly set search_path to public
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

-- 3. Re-attach trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Fix get_auth_role() helper to have explicit search_path and schema-qualified return type
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
