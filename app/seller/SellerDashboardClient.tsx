'use client';

import { useState, useTransition } from 'react';
import { UNITS, getCompatibleUnits, calculateOrderPrice, formatINR } from '@/lib/units';
import { logoutAction } from '../login/actions';
import { placeOrderAction } from './actions';
import styles from './seller.module.css';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  base_unit: string;
  base_price: number;
  stock_quantity: number;
}

interface OrderItem {
  item_id: string;
  product_name: string;
  ordered_quantity: number;
  ordered_unit: string;
  calculated_price: number;
}

interface Order {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  total_price: number;
  created_at: string;
  items: OrderItem[];
}

interface SellerDashboardClientProps {
  initialProducts: Product[];
  initialOrders: Order[];
  userName: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  unit: string; // Ordered Unit
  calculatedPrice: number;
  error?: string;
}

export default function SellerDashboardClient({
  initialProducts,
  initialOrders,
  userName,
}: SellerDashboardClientProps) {
  const [products] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Cart State
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  
  // Transitions
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Extract Categories
  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filter Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart Helpers
  const addToCart = (product: Product) => {
    if (cart[product.id]) return; // Already in cart

    const compatibleUnits = getCompatibleUnits(product.base_unit);
    const defaultUnit = compatibleUnits.includes(product.base_unit as any)
      ? product.base_unit
      : compatibleUnits[0] || product.base_unit;

    const defaultQty = 1;
    const calc = calculateOrderPrice(defaultQty, defaultUnit, product.base_unit, product.base_price);

    setCart((prev) => ({
      ...prev,
      [product.id]: {
        product,
        quantity: defaultQty,
        unit: defaultUnit,
        calculatedPrice: calc.totalPrice,
      },
    }));
    setFormSuccess('');
    setFormError('');
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  const updateCartItem = (productId: string, quantity: number, unit: string) => {
    setCart((prev) => {
      const item = prev[productId];
      if (!item) return prev;

      let errMessage = '';
      if (quantity <= 0 || isNaN(quantity)) {
        errMessage = 'Enter a valid quantity';
      }

      let computedPrice = 0;
      try {
        const calc = calculateOrderPrice(
          quantity <= 0 ? 0 : quantity,
          unit,
          item.product.base_unit,
          item.product.base_price
        );
        computedPrice = calc.totalPrice;
      } catch (e: any) {
        errMessage = e.message;
      }

      return {
        ...prev,
        [productId]: {
          ...item,
          quantity,
          unit,
          calculatedPrice: computedPrice,
          error: errMessage,
        },
      };
    });
  };

  // Cart Stats
  const cartItemsArray = Object.values(cart);
  const cartTotal = cartItemsArray.reduce((sum, item) => sum + (item.error ? 0 : item.calculatedPrice), 0);
  const isCartValid = cartItemsArray.length > 0 && cartItemsArray.every((item) => !item.error && item.quantity > 0);

  // Place Order Action
  const handlePlaceOrder = () => {
    if (!isCartValid) return;
    
    setFormError('');
    setFormSuccess('');

    const payload = cartItemsArray.map((item) => ({
      productId: item.product.id,
      orderedQuantity: item.quantity,
      orderedUnit: item.unit,
    }));

    startTransition(async () => {
      const res = await placeOrderAction(payload);
      if (res.error) {
        setFormError(res.error);
      } else {
        setFormSuccess('Your quotation has been successfully placed!');
        setCart({});
        // Reload orders
        window.location.reload();
      }
    });
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.navbar}>
        <div className={styles.navBrand}>
          <svg className={styles.navBrandIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5h20c0-2.31-1-4.24-2.5-5.5" />
            <path d="M12 2v14" />
            <path d="M9 12h6" />
            <path d="M12 2a3 3 0 0 1 3 3v2H9V5a3 3 0 0 1 3-3z" />
          </svg>
          <span className="gradient-text">AasaMedChem</span>
        </div>
        
        <div className={styles.userInfo}>
          <div className={styles.userBadge}>
            Role: <span>{userName} (Seller)</span>
          </div>
          <button onClick={() => logoutAction()} className={styles.logoutBtn} id="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.leftCol}>
          {/* Search, Filter bar */}
          <section className={`${styles.filterBar} glass-panel`}>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search products by name, SKU, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="product-search-input"
              />
            </div>
            
            <select
              className={styles.categorySelect}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              id="category-filter-select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </section>

          {/* Product Catalog Grid */}
          <section>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px', fontWeight: 600 }}>Product Catalog</h2>
            {filteredProducts.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No products found matching your search criteria.
              </div>
            ) : (
              <div className={styles.catalogGrid}>
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock_quantity <= 0;
                  const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 5;
                  const stockClass = isOutOfStock 
                    ? styles.outOfStock 
                    : isLowStock 
                      ? styles.lowStock 
                      : styles.inStock;
                  
                  return (
                    <article key={product.id} className={`${styles.productCard} glass-panel`}>
                      <div className={styles.cardHeader}>
                        <span className={styles.sku}>{product.sku}</span>
                        <span className={styles.categoryBadge}>{product.category}</span>
                      </div>
                      <h3 className={styles.productTitle}>{product.name}</h3>
                      <p className={styles.description}>{product.description || 'No description provided.'}</p>
                      
                      <div className={styles.priceStockRow}>
                        <div className={styles.priceBlock}>
                          <h6>Base Rate</h6>
                          <p>{formatINR(product.base_price)} / {product.base_unit}</p>
                        </div>
                        <div className={styles.stockBlock}>
                          <h6>Available Stock</h6>
                          <p className={stockClass}>
                            {product.stock_quantity.toFixed(2)} {product.base_unit}
                          </p>
                        </div>
                      </div>

                      <button
                        className={styles.addToCartBtn}
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock || !!cart[product.id]}
                        id={`add-to-cart-${product.sku}`}
                      >
                        {cart[product.id] ? 'Added to Cart' : isOutOfStock ? 'Out of Stock' : 'Add to Order'}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Order / Quotations History */}
          <section className={styles.historySection}>
            <h2 className={styles.historyTitle}>Quotation & Order History</h2>
            {orders.length === 0 ? (
              <div className={styles.noOrders}>
                No quotations placed yet. Use the catalog above and order builder on the right to place a quotation.
              </div>
            ) : (
              <div className={`${styles.tableWrapper} glass-panel`}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Order ID</th>
                      <th className={styles.th}>Date Placed</th>
                      <th className={styles.th}>Products</th>
                      <th className={styles.th}>Total Value (INR)</th>
                      <th className={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const badgeClass = order.status === 'APPROVED'
                        ? 'badge-approved'
                        : order.status === 'REJECTED'
                          ? 'badge-rejected'
                          : 'badge-pending';
                      
                      return (
                        <tr key={order.id} className={styles.tr}>
                          <td className={styles.td} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {order.id.slice(0, 8)}...
                          </td>
                          <td className={styles.td}>
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className={styles.td}>
                            <div className={styles.orderItemsSummary}>
                              {order.items.map((item, idx) => (
                                <div key={item.item_id || idx}>
                                  • {item.product_name} ({item.ordered_quantity} {item.ordered_unit})
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className={styles.td} style={{ fontWeight: 600 }}>
                            {formatINR(order.total_price)}
                          </td>
                          <td className={styles.td}>
                            <span className={`badge ${badgeClass}`}>{order.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Order Builder */}
        <aside className={styles.cartCol}>
          <div className={`${styles.cartCard} glass-panel`}>
            <div className={styles.cartTitle}>
              <span>Order Builder</span>
              {cartItemsArray.length > 0 && (
                <span className={styles.itemCountBadge}>{cartItemsArray.length} items</span>
              )}
            </div>

            {formError && (
              <div className={styles.error} style={{ margin: '0 0 20px 0' }} role="alert">
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="badge badge-approved" style={{ display: 'block', padding: '10px 14px', borderRadius: 'var(--radius-sm)', textTransform: 'none', marginBottom: '20px' }}>
                {formSuccess}
              </div>
            )}

            <div className={styles.cartItemsList}>
              {cartItemsArray.length === 0 ? (
                <div className={styles.emptyCart}>
                  <svg className={styles.emptyCartSvg} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <p>Order is empty.</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Add products from the catalog to build a quotation.</p>
                </div>
              ) : (
                cartItemsArray.map(({ product, quantity, unit, calculatedPrice, error }) => {
                  const compatibleUnits = getCompatibleUnits(product.base_unit);
                  
                  return (
                    <div key={product.id} className={styles.cartItem}>
                      <button
                        className={styles.removeCartItem}
                        onClick={() => removeFromCart(product.id)}
                        title="Remove item"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>

                      <div className={styles.cartItemName}>{product.name}</div>
                      <div className={styles.cartItemSubInfo}>
                        Rate: {formatINR(product.base_price)} per {product.base_unit}
                      </div>

                      <div className={styles.cartInputsRow}>
                        <input
                          type="number"
                          step="any"
                          className={styles.cartQtyInput}
                          value={quantity}
                          min="0.00000001"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            updateCartItem(product.id, isNaN(val) ? 0 : val, unit);
                          }}
                          placeholder="Qty"
                        />
                        
                        <select
                          className={styles.cartUnitSelect}
                          value={unit}
                          onChange={(e) => updateCartItem(product.id, quantity, e.target.value)}
                        >
                          {compatibleUnits.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>

                      {error ? (
                        <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '4px' }}>
                          {error}
                        </div>
                      ) : (
                        <div className={styles.cartItemPriceRow}>
                          <span>Dynamic Pricing:</span>
                          <span>{formatINR(calculatedPrice)}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {cartItemsArray.length > 0 && (
              <div className={styles.cartSummary}>
                <div className={styles.totalRow}>
                  <span>Total Value:</span>
                  <span>{formatINR(cartTotal)}</span>
                </div>

                <button
                  className={`${styles.addToCartBtn} pulse-glow`}
                  style={{ background: 'var(--accent-gradient)', borderColor: 'transparent', width: '100%', padding: '12px' }}
                  onClick={handlePlaceOrder}
                  disabled={isPending || !isCartValid}
                  id="place-order-btn"
                >
                  {isPending ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }}>
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M4 12a8 8 0 018-8V4a10 10 0 00-10 10h2z" />
                      </svg>
                      Placing Quotation...
                    </>
                  ) : (
                    'Submit Quotation'
                  )}
                </button>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
