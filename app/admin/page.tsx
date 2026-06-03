import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  // Redirect if not logged in
  if (!user) {
    redirect('/login');
  }

  // Seller redirect
  if (user.role !== 'ADMIN') {
    redirect('/');
  }

  // 1. Fetch products
  const productsRes = await query('SELECT * FROM products ORDER BY name ASC');
  const products = productsRes.rows.map((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description || '',
    category: row.category,
    base_unit: row.base_unit,
    base_price: parseFloat(row.base_price),
    stock_quantity: parseFloat(row.stock_quantity),
  }));

  // 2. Fetch all orders with grouped items and seller meta
  const ordersRes = await query(
    `SELECT 
       o.id, 
       o.status, 
       o.total_price, 
       o.created_at,
       u.name as seller_name,
       u.email as seller_email,
       COALESCE(
         json_agg(
           json_build_object(
             'id', oi.id,
             'product_id', oi.product_id,
             'product_name', p.name,
             'sku', p.sku,
             'ordered_quantity', oi.ordered_quantity,
             'ordered_unit', oi.ordered_unit,
             'conversion_factor', oi.conversion_factor,
             'base_quantity', oi.base_quantity,
             'calculated_price', oi.calculated_price,
             'base_unit', p.base_unit,
             'base_price', p.base_price
           )
         ) FILTER (WHERE oi.id IS NOT NULL),
         '[]'::json
       ) as items
     FROM orders o
     JOIN users u ON o.user_id = u.id
     LEFT JOIN order_items oi ON o.id = oi.order_id
     LEFT JOIN products p ON oi.product_id = p.id
     GROUP BY o.id, u.name, u.email
     ORDER BY o.created_at DESC`
  );

  const orders = ordersRes.rows.map((row) => ({
    id: row.id,
    status: row.status,
    total_price: parseFloat(row.total_price),
    created_at: row.created_at.toISOString(),
    seller_name: row.seller_name,
    seller_email: row.seller_email,
    items: row.items,
  }));

  return (
    <AdminDashboardClient
      initialProducts={products}
      initialOrders={orders}
      adminName={user.name}
    />
  );
}
