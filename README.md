# Order_management_system

# AasaMedChem Inventory & Order Management System

## Overview

This project is a role-based Inventory and Order Management System built using Next.js, Neon PostgreSQL, and Vercel. It allows users to browse products, place quotations/orders, and enables admins to manage inventory and review incoming orders.

## Features

### Seller/User

* User registration and login
* Search and filter products
* View product details and pricing
* Place quotations/orders with different units
* Track order status

### Admin

* Secure admin login
* Manage products (Add, Update, Delete)
* View inventory levels
* Review incoming quotations/orders
* Approve or reject orders

## Tech Stack

* Frontend: Next.js 14, React
* Backend: Next.js Server Actions
* Database: Neon PostgreSQL
* Authentication: JWT + HTTP-only Cookies
* Deployment: Vercel

## Database Design

Main Tables:

* users
* products
* orders
* order_items

Data Types:

* Prices: NUMERIC(20,4)
* Quantities: NUMERIC(20,8)
* IDs: UUID

These types provide high precision and support large values without floating-point errors.

## Unit Conversion Strategy

Supported Units:

* g
* kg
* mL
* L
* item

Conversion Examples:

* 1 kg = 1000 g
* 1 g = 0.001 kg
* 1 L = 1000 mL
* 1 mL = 0.001 L

Conversions are applied during order calculations to ensure accurate pricing and inventory tracking.

## Authentication

The application uses JWT-based authentication with role-based access:

* ADMIN
* SELLER

Protected routes are secured using middleware and JWT verification.

## Setup

1. Install dependencies:
   npm install

2. Create .env file:
   DATABASE_URL=your_neon_database_url
   JWT_SECRET=your_secret_key

3. Run database schema in Neon SQL Editor.

4. Start the application:
   npm run dev

## Deployment

The project is deployed on Vercel.

## Test Accounts

Admin:

* Email: [admin@test.com](mailto:admin@test.com)
* Password: admin123

Seller:

* Email: [seller@test.com](mailto:seller@test.com)
* Password: seller123

## Order Flow

1. Seller searches products.
2. Seller selects quantity and unit.
3. System calculates price automatically.
4. Seller submits quotation/order.
5. Admin reviews the request.
6. Admin approves or rejects the order.

## Author

Abhimanyu Singh Parihar
