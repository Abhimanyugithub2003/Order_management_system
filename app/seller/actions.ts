'use server';

import { query, getClient } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { calculateOrderPrice } from '@/lib/units';
import { revalidatePath } from 'next/cache';

export interface OrderItemInput {
  productId: string;
  orderedQuantity: number;
  orderedUnit: string;
}

export async function placeOrderAction(items: OrderItemInput[]) {
  const user = await getCurrentUser();
  
  if (!user || user.role !== 'SELLER') {
    throw new Error('Unauthorized');
  }

  if (!items || items.length === 0) {
    return { error: 'Your cart is empty.' };
  }

  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // 1. Calculate prices and validate items
    let grandTotal = 0;
    const processedItems = [];

    for (const item of items) {
      if (item.orderedQuantity <= 0) {
        throw new Error('Quantity must be greater than zero.');
      }

      // Fetch product info
      const prodRes = await client.query('SELECT * FROM products WHERE id = $1', [item.productId]);
      if (prodRes.rows.length === 0) {
        throw new Error(`Product not found.`);
      }
      
      const product = prodRes.rows[0];
      
      // Calculate conversion and price
      const calc = calculateOrderPrice(
        item.orderedQuantity,
        item.orderedUnit,
        product.base_unit,
        parseFloat(product.base_price)
      );

      grandTotal += calc.totalPrice;
      processedItems.push({
        productId: product.id,
        orderedQuantity: item.orderedQuantity,
        orderedUnit: item.orderedUnit,
        conversionFactor: calc.conversionFactor,
        baseQuantity: calc.baseQuantity,
        calculatedPrice: calc.totalPrice,
      });
    }

    // 2. Insert order header
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, status, total_price) 
       VALUES ($1, 'PENDING', $2) 
       RETURNING id`,
      [user.id, grandTotal]
    );
    const orderId = orderRes.rows[0].id;

    // 3. Insert order items
    for (const pItem of processedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, ordered_quantity, ordered_unit, conversion_factor, base_quantity, calculated_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          pItem.productId,
          pItem.orderedQuantity,
          pItem.orderedUnit,
          pItem.conversionFactor,
          pItem.baseQuantity,
          pItem.calculatedPrice,
        ]
      );
    }

    await client.query('COMMIT');
    
    revalidatePath('/seller');
    revalidatePath('/admin');
    
    return { success: true };
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to place order:', error);
    return { error: error.message || 'Failed to place order. Please try again.' };
  } finally {
    client.release();
  }
}
