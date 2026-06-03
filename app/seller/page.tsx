import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import SellerDashboardClient from './SellerDashboardClient';

export const dynamic = 'force-dynamic';

export default async function SellerDashboardPage() {
  const user = await getCurrentUser();

  // If not logged in, middleware handles redirect, but dual-layer auth covers it here
  if (!user) {
    redirect('/login');
  }

  // Admin redirect
  if (user.role === 'ADMIN') {
    redirect('/admin');
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

  // 2. Fetch past orders for this user with grouped items
  const ordersRes = await query(
    `SELECT 
       o.id, 
       o.status, 
       o.total_price, 
       o.created_at,
       COALESCE(
         json_agg(
           json_build_object(
             'item_id', oi.id,
             'product_name', p.name,
             'ordered_quantity', oi.ordered_quantity,
             'ordered_unit', oi.ordered_unit,
             'calculated_price', oi.calculated_price
           )
         ) FILTER (WHERE oi.id IS NOT NULL),
         '[]'::json
       ) as items
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [user.id]
  );

  const orders = ordersRes.rows.map((row) => ({
    id: row.id,
    status: row.status,
    total_price: parseFloat(row.total_price),
    created_at: row.created_at.toISOString(),
    items: row.items,
  }));

  return (
    <SellerDashboardClient
      initialProducts={products}
      initialOrders={orders}
      userName={user.name}
    />
  );
}
