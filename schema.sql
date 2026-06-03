-- Drop existing tables to ensure clean schema generation if re-running
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- Enums for role-based access and order states
CREATE TYPE user_role AS ENUM ('ADMIN', 'SELLER');
CREATE TYPE order_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'SELLER',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Products table with high-precision decimal fields
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(255) NOT NULL,
  base_unit VARCHAR(10) NOT NULL, -- 'g', 'kg', 'L', 'mL', 'item'
  base_price NUMERIC(20, 4) NOT NULL, -- rate in INR per base unit
  stock_quantity NUMERIC(20, 8) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'PENDING',
  total_price NUMERIC(20, 4) NOT NULL, -- total in INR
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Items table storing both inputs and audit calculations
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  ordered_quantity NUMERIC(20, 8) NOT NULL,
  ordered_unit VARCHAR(10) NOT NULL,
  conversion_factor NUMERIC(20, 8) NOT NULL,
  base_quantity NUMERIC(20, 8) NOT NULL,
  calculated_price NUMERIC(20, 4) NOT NULL -- item total in INR
);
