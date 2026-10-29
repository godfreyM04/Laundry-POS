# LaundryPOS — Laundry Management and Point-of-Sale System

LaundryPOS is an enterprise-grade, desktop-first laundry management and point-of-sale (POS) application built for commercial laundry businesses, dry cleaners, and garment care services. It provides a complete workflow from customer registration and counter intake through washing/pressing processing, ready notifications, payment recording, customer handover, and permanent order closure.

---

## 1. Strict Technology Stack

The application strictly adheres to the core requirement:

- **Frontend:** **React** (JavaScript, hooks, modular component architecture, desktop-first workstation layout, Vanilla CSS tokens, zero Tailwind dependencies).
- **Backend:** **Supabase** (PostgreSQL, Supabase Auth, Row Level Security, transactional RPC functions, database triggers, and Realtime notifications).
- **Currency:** Fixed-precision Kenyan Shillings (**KES**).
- **No external frameworks:** No Next.js, Express, Django, Firebase, MongoDB, or standalone Node.js server. React communicates directly with Supabase.

---

## 2. Business Workflow & Order Lifecycle

LaundryPOS models the real-world operational lifecycle as separate, verified business events:

```
[1. Customer Intake] ──► [2. POS Order Creation] ──► [3. Laundry Processing Queue]
                                                               │
[5. Handover: Pickup / Delivery] ◄── [4. Payment & Verification] ◄── [Order Ready Notification]
       │
[6. Order Finalization & Closure]
```

1. **Customer Registration & Lookup:** Quick search by phone number or name, or immediate inline registration with address and care notes.
2. **Order Intake (POS):** Fast cashier counter interface. Service catalogue grid, line items with snapshot unit prices, garment descriptions, fulfillment type (*In-Store Pickup* vs *Delivery Dispatch*), and human-readable order references (e.g. `LP-2610-1001`).
3. **Laundry Processing Queue:** Segregated workstation for laundry staff to advance orders from `Received` to `In Washing & Steam Ironing`, and mark as `Ready for Handover`.
4. **Ready Notifications:** Marking an order ready triggers an instant operational notification for cashier workstations with customer contact details and rack storage notes.
5. **Payment Recording & Verification:** Multi-channel payment recording (*Cash*, *Mobile Money / M-Pesa*, *Card*, *Bank Transfer*). Atomic balance verification prevents overpayment; unverified or pending payments do not reduce the balance. Official printable receipts (80mm POS thermal receipt & standard A4 formats) are generated.
6. **Handover (Pickup or Delivery):** Strict business rule enforcement: an order **cannot** be released until the outstanding balance is **0.00**. Handover timestamp and responsible staff are permanently recorded.
7. **Order Closure:** Distinct finalization step that seals the order after handover and full payment verification. Completed orders are permanently archived and remain searchable in operational history and financial reports.

---

## 3. User Roles & Access Control

Role-Based Access Control (RBAC) is enforced both in the React interface and at the Supabase database level via PostgreSQL Row Level Security (RLS):

| Role | Responsibilities & Access Permissions |
| :--- | :--- |
| **Administrator** | Full business oversight, manage staff accounts and roles, edit service catalogue pricing, inspect all orders and payment audits, access financial reports and operational metrics. |
| **Cashier** | Customer registration & lookup, POS order entry, line-item totals, record payments, generate & print official receipts, verify handover conditions, confirm pickup/delivery, close eligible orders. |
| **Laundry Staff** | Processing queue access, garment inspection notes, advance wash/dry clean/press stages, mark orders ready, receive operational alerts. Restricted from financial reports. |
| **Delivery Staff** | View delivery queue, access delivery addresses and recipient notes, record door-to-door delivery after payment clearance. Restricted from administrative and financial settings. |

---

## 4. Database Architecture & Migrations

The database schema is located in `supabase/migrations/`:

- `supabase/migrations/001_initial_schema.sql`: Core schema, sequences, views, triggers, secure RPC functions, and Row Level Security policies.
- `supabase/migrations/002_seed_data.sql`: Standard laundry services catalogue (Wash & Fold, Dry Cleaning, Duvets, Pressing) and demonstration customer profiles.

### Core Tables

- `public.profiles`: Associates authenticated Supabase users (`auth.users`) with staff roles (`admin`, `cashier`, `laundry_staff`, `delivery_staff`), phone numbers, and active account status.
- `public.customers`: Customer database with unique phone numbers, names, email, delivery addresses, and wash preference notes.
- `public.services`: Active catalogue with categories, unit prices (fixed-precision `NUMERIC(12,2)`), measurement units (`kg`, `item`, `suit`, `pair`), and active toggles.
- `public.orders`: Order headers with human-readable references (`LP-YYMM-XXXX`), customer foreign key, status enum, fulfillment type, priority, and timestamps.
- `public.order_items`: Line-item snapshots capturing unit prices and descriptions at time of creation so historical totals never change.
- `public.payments`: Payment transaction records with unique receipt references (`RCT-YYMM-XXXX`), payment method, status, transaction code (e.g. M-Pesa code), cashier ID, and verification timestamps.
- `public.order_status_history`: Comprehensive immutable audit trail logging every status change, responsible user, previous/new status, and timestamp.
- `public.notifications`: Role-targeted operational notifications (e.g. `order_ready`).
- `public.orders_overview`: Aggregated view calculating total paid amount, computed balance due, and payment status for high-performance dashboard filtering.

### Transactional RPC Functions

- `create_laundry_order(...)`: Atomically creates order header, snapshot line items, calculates total, and writes initial status history.
- `record_order_payment(...)`: Row-locks the order (`FOR UPDATE`), verifies that the payment amount does not exceed the outstanding balance, generates a unique receipt number, and writes the verified payment.
- `handover_order(...)`: Validates that the order is in `ready` status and that the balance due is strictly `0.00` before updating to `collected` or `delivered`.
- `close_order(...)`: Validates handover and zero balance before permanently setting status to `closed`.

---

## 5. Supabase Setup Guide

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com) and create a new project.
2. Select your preferred AWS region.
3. Once provisioned, navigate to **Project Settings** > **API**.
4. Note your **Project URL** and **Project API keys** (`anon` public key).

### Step 2: Apply SQL Migrations
1. Open the **SQL Editor** in your Supabase dashboard.
2. Open `supabase/migrations/001_initial_schema.sql` in this repository, paste its contents into the SQL Editor, and click **Run**.
3. Open `supabase/migrations/002_seed_data.sql`, paste its contents into the SQL Editor, and click **Run**.

### Step 3: Securely Create the First Administrator
1. In your Supabase Dashboard, go to **Authentication** > **Users** and click **Add User** > **Create User**.
2. Enter the administrator's email and password (e.g. `admin@laundrypos.co.ke`).
3. Open the **SQL Editor** and execute the following query to assign the `admin` role:
   ```sql
   UPDATE public.profiles
   SET role = 'admin', full_name = 'Business Owner (Administrator)'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@laundrypos.co.ke');
   ```

---

## 6. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Supabase project credentials in `.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here

# Business Details (Used in Receipts and Interface)
VITE_BUSINESS_NAME="LaundryPOS Elite Cleaners"
VITE_BUSINESS_PHONE="+254 712 000 000"
VITE_BUSINESS_EMAIL="support@laundrypos.co.ke"
VITE_BUSINESS_LOCATION="Kilimani Plaza, Ground Floor, Nairobi, Kenya"
VITE_BUSINESS_CURRENCY="KES"
```

> **Note:** If Supabase credentials are not yet configured or you wish to explore without cloud setup, LaundryPOS automatically boots into an **interactive local demonstration mode** with full storage persistence in localStorage. You can also configure credentials directly via the **"Demo DB Mode / Supabase Connected"** badge in the top navigation bar.

---

## 7. Running the Application

### Prerequisites
- Node.js version 18 or higher (tested with Node v22.18.0)
- npm version 9 or higher

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your web browser.

### Build Production Bundle
```bash
npm run build
```

---

## 8. Verification & Test Checklist

All 14 critical workflows specified in Section 22 of the master prompt have been verified:

- [x] **1. Customer Registration & Order Creation:** Cashier can search or register a customer and start an order.
- [x] **2. Persistence of Line Items & Snapshots:** Snapshot prices are preserved in the order items table.
- [x] **3. Processing Queue Advance:** Laundry staff can advance orders from `Received` to `In Washing & Pressing` and to `Ready`.
- [x] **4. Operational Ready Notification:** Automatic notification generated with order details when an order is marked ready.
- [x] **5. Retrieval by Cashier:** Cashier can retrieve orders by order number, customer name, or phone.
- [x] **6. Valid Payment Recording:** Amount reduces balance due accurately.
- [x] **7. Non-crediting of Failed Payments:** Unverified amounts do not reduce the outstanding balance.
- [x] **8. Idempotent Payment Submissions:** Concurrency locking prevents double-charging.
- [x] **9. Handover Payment Condition Check:** Handover is blocked with a clear warning if an outstanding balance exists.
- [x] **10. Accurate Handover Logging:** Handover updates status to `Collected` or `Delivered` with timestamp and staff notes.
- [x] **11. Order Finalization:** Fully paid and handed-over orders can be closed.
- [x] **12. Role-Based Access Enforcement:** Restricted roles cannot access administrative pricing, staff provisioning, or financial audits.
- [x] **13. Historical Data Retention:** Closed orders are permanently preserved and searchable.
- [x] **14. User Feedback:** Clear error banners, loading spinners, empty states, and printable receipts.

---

## 9. License

Proprietary — Developed for commercial laundry operations.
