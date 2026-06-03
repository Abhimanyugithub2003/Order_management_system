# AasaMedChem Inventory and Order Management System

A high-fidelity, hackathon-style Next.js application designed to manage chemical products, track stock levels with high decimal precision, handle multi-dimensional unit conversions (weight, volume, count), and orchestrate quotation ordering workflows between Sellers and Admins.

---

## 🚀 Project Overview & Features

This system provides two role-based dashboards:
1. **Seller/User Panel**:
   - Dynamic catalog search by product name, description, and SKU.
   - Category filtering.
   - Interactive order cart builder: select items, input quantities in any compatible unit, and see dynamic pricing automatically calculated in real-time in INR amounts.
   - Quotation tracking history displaying status changes.
2. **Admin Panel**:
   - Full Product CRUD management: SKU, Name, Description, Category, Base Unit, Rate, and Stock level.
   - Visual inventory tracker showing low-stock/out-of-stock highlights.
   - Incoming Quotation auditing panel: shows granular conversion formulas ($Q_{ord} \times F = Q_{base}$) and base rate evaluations to verify calculations.
   - Approve or reject actions (with transactional inventory checking and stock decrementing).

---

## 🛠️ Tech Stack & System Design

- **Frontend**: Next.js 14 App Router, React 18, and CSS Modules (Vanilla CSS custom obsidian theme styling).
- **Backend & API**: Next.js Server Actions (handling login, registration, cart checkout, product CRUD, and order updates securely without boilerplate API route endpoints).
- **Database**: PostgreSQL hosted on Neon (using the `pg` node-postgres pool for fast, secure connections).
- **Authentication**: JWT-based session state stored in secure, HTTP-only cookies.
- **Routing Security**: Dual-layer architecture: Next.js edge-compatible middleware checks for cookie presence, while Node-native layout page routes cryptographically check token signatures and roles before rendering.

---

## 📐 Unit Storage and Conversion Strategy

### 1. Dimension Configuration
We support three physical dimensions and five measurement units:
- **Weight**: Grams (`g`), Kilograms (`kg`)
- **Volume**: Milliliters (`mL`), Liters (`L`)
- **Count**: Items (`item`)

### 2. Database Storage Strategy
- **Product Base Unit**: A product can be configured with *any* of the 5 base units (e.g. `g`, `kg`, `mL`, `L`, `item`).
- **Product Base Price**: Defined as the price in INR per **1 unit** of its configured `base_unit`.
- **Product Stock**: Tracked and stored in terms of its `base_unit`.
- **High Decimal Precision & Large Values**:
  - We use the PostgreSQL `NUMERIC` data type to prevent IEEE 754 floating-point rounding errors.
  - **Base Prices / Calculated Prices**: `NUMERIC(20, 4)` handles values up to 100 quadrillion INR with 4 decimal places (for fractions of paise).
  - **Quantities / Conversion Factors**: `NUMERIC(20, 8)` allows storing quantities up to 1 trillion units with 8 decimal places (necessary for precise scientific measurements, e.g., milligrams of a substance).

### 3. Conversion Formula and Logic
Conversions are computed during:
1. **Dynamic Cart Calculation**: Client-side state changes recalculate price instantly as the seller edits fields.
2. **Order Placement Action**: The server action calculates factors, base quantities, and prices to persist them in `order_items` for audit records.
3. **Inventory Deductions**: When an admin approves an order, the server deducts the pre-computed `base_quantity` from the product's `stock_quantity`.

#### Conversion Factor Table ($U_{ord} \to U_{base}$):
| Ordered ($U_{ord}$) | Base ($U_{base}$) | Factor ($F$) | Formula | Example |
| :--- | :--- | :--- | :--- | :--- |
| `kg` | `g` | `1000.0` | $Q_{base} = Q_{ord} \times 1000$ | 2 kg ordered $\to$ 2000 g |
| `g` | `kg` | `0.001` | $Q_{base} = Q_{ord} \times 0.001$ | 250 g ordered $\to$ 0.25 kg |
| `L` | `mL` | `1000.0` | $Q_{base} = Q_{ord} \times 1000$ | 1.5 L ordered $\to$ 1500 mL |
| `mL` | `L` | `0.001` | $Q_{base} = Q_{ord} \times 0.001$ | 500 mL ordered $\to$ 0.5 L |
| *Identical* | *Identical* | `1.0` | $Q_{base} = Q_{ord} \times 1$ | 10 items ordered $\to$ 10 items |

---

## 🗃️ Database Schema

The following schema is already created in `schema.sql`. You can execute it inside your Neon SQL Console to initialize your tables:

```sql
-- Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'SELLER');
CREATE TYPE order_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'SELLER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(255) NOT NULL,
  base_unit VARCHAR(10) NOT NULL,
  base_price NUMERIC(20, 4) NOT NULL,
  stock_quantity NUMERIC(20, 8) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'PENDING',
  total_price NUMERIC(20, 4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  ordered_quantity NUMERIC(20, 8) NOT NULL,
  ordered_unit VARCHAR(10) NOT NULL,
  conversion_factor NUMERIC(20, 8) NOT NULL,
  base_quantity NUMERIC(20, 8) NOT NULL,
  calculated_price NUMERIC(20, 4) NOT NULL
);
```

---

## ⚙️ Local Setup Instructions

### 1. Install Dependencies
Open your PowerShell window inside `order_management_system` and run:
```powershell
npm install
```

### 2. Setup Environment Variables
Create a file named `.env` in the root of your project directory:
```env
DATABASE_URL=postgresql://[user]:[password]@[neon-host]/neondb?sslmode=require
JWT_SECRET=aasa-medchem-secure-cryptographic-jwt-secret-key-9988
```

### 3. Setup PostgreSQL Database
- Log into your [Neon Console](https://neon.tech) and copy your database connection URL into the `.env` file under `DATABASE_URL`.
- Open the SQL Editor on Neon, copy the contents of `schema.sql` (found in the root folder), and execute it.
- **Dynamic Seeding**: When you launch the server and perform your first request, the database manager automatically hashes default passwords and seeds initial test users and chemical products for instant availability.

### 4. Run the Dev Server
```powershell
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Test Credentials & Usage Walkthrough

### Test Accounts
The database automatically seeds the following credentials:
- 🧑‍💼 **Admin**: `admin@aasamedchem.com` / Password: `admin123`
- 🧑‍🔬 **Seller/User**: `seller@aasamedchem.com` / Password: `seller123`

### Walkthrough of Flows:
1. **Catalog Search and Order Placement**:
   - Log in as the **Seller** (`seller@aasamedchem.com`).
   - Use the search bar to locate `"Acetylsalicylic Acid (Aspirin Powder)"` (which has a base unit of `g` and base rate of `2.50 INR / g`).
   - Click **Add to Order**. In the Order Builder on the right, change the ordered unit to `kg` and input quantity `0.25` (representing 250 g).
   - Notice the dynamic price update instantly computes **`625.00 INR`** ($0.25 \text{ kg} \times 1000 \text{ (Factor)} \times 2.50 \text{ INR/g}$).
   - Click **Submit Quotation**. The order will appear in your history as `PENDING`.
   - Log out.

2. **Quotation Audit & Inventory Update**:
   - Log in as the **Admin** (`admin@aasamedchem.com`).
   - Click on the **Incoming Quotations** tab.
   - Expand the pending quotation. Under **Conversion & Pricing Audit Details**, you will see:
     - Ordered Qty: `0.25 kg`
     - Conversion Formula: `0.25 kg × 1000 = 250.0000 g`
     - Converted Qty: `250.0000 g`
     - Base Rate: `2.5000 INR / g`
     - Calculated Price: `625.0000 INR`
   - Click **Approve & Deduct Stock**.
   - Navigate to the **Inventory Management** tab and verify that the stock for `"Acetylsalicylic Acid"` has dropped by `250.0000 g`.

---

## 🚢 Vercel Deployment Instructions

1. Push this folder to your GitHub account:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit of inventory order system"
   git remote add origin [your-github-repo-url]
   git branch -M main
   git push -u origin main
   ```
2. Open [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository.
4. Add the following **Environment Variables** in the Vercel project configuration:
   - `DATABASE_URL`
   - `JWT_SECRET`
5. Click **Deploy**. Vercel will build the Next.js bundle and give you a live production URL!
