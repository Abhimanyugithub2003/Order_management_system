'use server';

import { query, getClient } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addProductAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const sku = formData.get('sku') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const base_unit = formData.get('base_unit') as string;
  const base_price = parseFloat(formData.get('base_price') as string);
  const stock_quantity = parseFloat(formData.get('stock_quantity') as string);

  if (!sku || !name || !category || !base_unit || isNaN(base_price) || isNaN(stock_quantity)) {
    return { error: 'Please fill in all required fields with valid values.' };
  }

  try {
    await query(
      `INSERT INTO products (sku, name, description, category, base_unit, base_price, stock_quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        sku.toUpperCase().trim(),
        name.trim(),
        description ? description.trim() : null,
        category.trim(),
        base_unit,
        base_price,
        stock_quantity,
      ]
    );
    revalidatePath('/admin');
    revalidatePath('/seller');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to add product:', error);
    if (error.code === '23505') {
      return { error: 'A product with this SKU already exists.' };
    }
    return { error: 'Failed to add product. Please try again.' };
  }
}

export async function editProductAction(productId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const sku = formData.get('sku') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const base_unit = formData.get('base_unit') as string;
  const base_price = parseFloat(formData.get('base_price') as string);
  const stock_quantity = parseFloat(formData.get('stock_quantity') as string);

  if (!sku || !name || !category || !base_unit || isNaN(base_price) || isNaN(stock_quantity)) {
    return { error: 'Please fill in all required fields with valid values.' };
  }

  try {
    await query(
      `UPDATE products 
       SET sku = $1, name = $2, description = $3, category = $4, base_unit = $5, base_price = $6, stock_quantity = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        sku.toUpperCase().trim(),
        name.trim(),
        description ? description.trim() : null,
        category.trim(),
        base_unit,
        base_price,
        stock_quantity,
        productId,
      ]
    );
    revalidatePath('/admin');
    revalidatePath('/seller');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update product:', error);
    if (error.code === '23505') {
      return { error: 'A product with this SKU already exists.' };
    }
    return { error: 'Failed to update product. Please try again.' };
  }
}

export async function deleteProductAction(productId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  try {
    await query('DELETE FROM products WHERE id = $1', [productId]);
    revalidatePath('/admin');
    revalidatePath('/seller');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete product:', error);
    if (error.code === '23503') {
      return { error: 'Cannot delete product: it is associated with existing quotations/orders.' };
    }
    return { error: 'Failed to delete product. Please try again.' };
  }
}

export async function updateOrderStatusAction(orderId: string, status: 'APPROVED' | 'REJECTED') {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Fetch order details
    const orderRes = await client.query('SELECT status FROM orders WHERE id = $1', [orderId]);
    if (orderRes.rows.length === 0) {
      throw new Error('Order not found.');
    }

    const currentStatus = orderRes.rows[0].status;
    if (currentStatus !== 'PENDING') {
      throw new Error(`Order has already been processed (Current Status: ${currentStatus}).`);
    }

    if (status === 'APPROVED') {
      // 1. Fetch order items
      const itemsRes = await client.query(
        `SELECT oi.*, p.name as product_name, p.stock_quantity as current_stock 
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [orderId]
      );

      // 2. Validate inventory limits
      for (const item of itemsRes.rows) {
        if (parseFloat(item.current_stock) < parseFloat(item.base_quantity)) {
          throw new Error(
            `Insufficient stock for "${item.product_name}". ` +
            `Requested: ${parseFloat(item.base_quantity).toFixed(4)} ${item.ordered_unit === 'g' || item.ordered_unit === 'kg' ? 'kg' : item.ordered_unit === 'mL' || item.ordered_unit === 'L' ? 'L' : 'item'}(s) (in base units), ` +
            `Available: ${parseFloat(item.current_stock).toFixed(4)}.`
          );
        }
      }

      // 3. Deduct inventory
      for (const item of itemsRes.rows) {
        await client.query(
          `UPDATE products 
           SET stock_quantity = stock_quantity - $1 
           WHERE id = $2`,
          [item.base_quantity, item.product_id]
        );
      }
    }

    // 4. Update order status
    await client.query(
      `UPDATE orders 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [status, orderId]
    );

    await client.query('COMMIT');
    
    revalidatePath('/admin');
    revalidatePath('/seller');
    
    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to update order status:', error);
    return { error: error.message || 'An error occurred during updating status.' };
  } finally {
    client.release();
  }
}
