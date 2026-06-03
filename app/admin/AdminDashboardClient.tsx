'use client';

import { useState, useTransition } from 'react';
import { UNITS, formatINR } from '@/lib/units';
import { logoutAction } from '../login/actions';
import {
  addProductAction,
  editProductAction,
  deleteProductAction,
  updateOrderStatusAction
} from './actions';
import styles from './admin.module.css';
import loginStyles from '../login/login.module.css';

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
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  ordered_quantity: number;
  ordered_unit: string;
  conversion_factor: number;
  base_quantity: number;
  calculated_price: number;
  base_unit: string;
  base_price: number;
}

interface Order {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  total_price: number;
  created_at: string;
  seller_name: string;
  seller_email: string;
  items: OrderItem[];
}

interface AdminDashboardClientProps {
  initialProducts: Product[];
  initialOrders: Order[];
  adminName: string;
}

export default function AdminDashboardClient({
  initialProducts,
  initialOrders,
  adminName,
}: AdminDashboardClientProps) {
  const [products] = useState<Product[]>(initialProducts);
  const [orders] = useState<Order[]>(initialOrders);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'products' | 'quotations'>('products');

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Action state
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [actioningOrderId, setActioningOrderId] = useState<string | null>(null);

  // Add Product Submit
  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addProductAction(formData);
      if (res.error) {
        setFormError(res.error);
      } else {
        setShowAddModal(false);
        window.location.reload();
      }
    });
  };

  // Edit Product Submit
  const handleEditProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    setFormError('');
    setFormSuccess('');

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await editProductAction(editingProduct.id, formData);
      if (res.error) {
        setFormError(res.error);
      } else {
        setEditingProduct(null);
        window.location.reload();
      }
    });
  };

  // Delete Product
  const handleDeleteProduct = (productId: string, sku: string) => {
    if (!confirm(`Are you sure you want to delete product with SKU: ${sku}?`)) return;
    setFormError('');
    setFormSuccess('');

    startTransition(async () => {
      const res = await deleteProductAction(productId);
      if (res.error) {
        alert(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  // Process Quotation
  const handleProcessOrder = (orderId: string, status: 'APPROVED' | 'REJECTED') => {
    const confirmationMsg = status === 'APPROVED' 
      ? 'Are you sure you want to APPROVE this quotation and deduct stock?' 
      : 'Are you sure you want to REJECT this quotation?';
      
    if (!confirm(confirmationMsg)) return;

    setFormError('');
    setFormSuccess('');
    setActioningOrderId(orderId);

    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, status);
      setActioningOrderId(null);
      if (res.error) {
        setFormError(res.error);
      } else {
        setFormSuccess(`Order was successfully ${status.toLowerCase()}!`);
        window.location.reload();
      }
    });
  };

  return (
    <div className={styles.dashboard}>
      <header className={loginStyles.navbar || ''} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px',
        background: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'var(--backdrop-blur)', borderBottom: '1px solid var(--border-color)',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'url(#navGradient)' }}>
            <path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5h20c0-2.31-1-4.24-2.5-5.5" />
            <path d="M12 2v14" />
            <path d="M9 12h6" />
            <path d="M12 2a3 3 0 0 1 3 3v2H9V5a3 3 0 0 1 3-3z" />
          </svg>
          <span className="gradient-text">AasaMedChem</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            Role: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{adminName} (Admin)</span>
          </div>
          <button onClick={() => logoutAction()} className={loginStyles.logoutBtn || ''} style={{
            background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--color-danger)',
            padding: '6px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500
          }}>
            Logout
          </button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '32px' }}>
        {/* Navigation Tabs */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'products' ? styles.activeTab : ''}`}
            onClick={() => { setActiveTab('products'); setFormError(''); setFormSuccess(''); }}
            id="admin-products-tab"
          >
            Inventory Management
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'quotations' ? styles.activeTab : ''}`}
            onClick={() => { setActiveTab('quotations'); setFormError(''); setFormSuccess(''); }}
            id="admin-quotations-tab"
          >
            Incoming Quotations
            {orders.filter(o => o.status === 'PENDING').length > 0 && (
              <span style={{ marginLeft: '8px', background: 'var(--color-danger)', color: 'white', padding: '1px 6px', borderRadius: '10px', fontSize: '0.7rem' }}>
                {orders.filter(o => o.status === 'PENDING').length}
              </span>
            )}
          </button>
        </div>

        {formError && (
          <div className={loginStyles.error} style={{ marginBottom: '24px' }} role="alert">
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="badge badge-approved" style={{ display: 'block', padding: '10px 14px', borderRadius: 'var(--radius-sm)', textTransform: 'none', marginBottom: '24px' }}>
            {formSuccess}
          </div>
        )}

        {/* Tab 1: Inventory List */}
        {activeTab === 'products' && (
          <section className="animate-fade-in">
            <div className={styles.actionsRow}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>Chemical Inventory levels</h2>
              <button
                className={styles.addProductBtn}
                onClick={() => setShowAddModal(true)}
                id="add-product-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add New Product
              </button>
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.03)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>SKU</th>
                    <th style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.03)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Product Details</th>
                    <th style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.03)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Category</th>
                    <th style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.03)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Base Rate (INR)</th>
                    <th style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.03)', fontWeight: 600, borderBottom: '1px solid var(--border-color)' }}>Stock Qty</th>
                    <th style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.03)', fontWeight: 600, borderBottom: '1px solid var(--border-color)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No products configured yet. Use the "Add New Product" button above to get started.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const isOutOfStock = product.stock_quantity <= 0;
                      const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 5;
                      
                      return (
                        <tr key={product.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--accent-secondary)' }}>
                            {product.sku}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 600 }}>{product.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {product.description || 'No description'}
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                              {product.category}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                            {formatINR(product.base_price)} / {product.base_unit}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              fontWeight: 600,
                              color: isOutOfStock ? 'var(--color-danger)' : isLowStock ? 'var(--color-warning)' : 'var(--color-success)'
                            }}>
                              {product.stock_quantity.toFixed(4)} {product.base_unit}
                            </span>
                            {isLowStock && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-warning)', marginTop: '2px' }}>Low Stock</div>
                            )}
                            {isOutOfStock && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '2px' }}>Out of Stock</div>
                            )}
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                className={`${styles.iconBtn} ${styles.editBtn}`}
                                onClick={() => setEditingProduct(product)}
                                title="Edit Product"
                                id={`edit-product-${product.sku}`}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path>
                                </svg>
                              </button>
                              <button
                                className={`${styles.iconBtn} ${styles.deleteBtn}`}
                                onClick={() => handleDeleteProduct(product.id, product.sku)}
                                title="Delete Product"
                                id={`delete-product-${product.sku}`}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"></polyline>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Tab 2: Incoming Quotations / Orders */}
        {activeTab === 'quotations' && (
          <section className="animate-fade-in">
            <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '20px' }}>Incoming Quotations</h2>
            {orders.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
                No quotations have been placed by sellers yet.
              </div>
            ) : (
              <div className={styles.quotationsList}>
                {orders.map((order) => {
                  const hasInsufficientStock = order.status === 'PENDING' && order.items.some(
                    (item) => parseFloat(item.base_quantity) > parseFloat(products.find(p => p.id === item.product_id)?.stock_quantity?.toString() || '0')
                  );

                  const badgeClass = order.status === 'APPROVED'
                    ? 'badge-approved'
                    : order.status === 'REJECTED'
                      ? 'badge-rejected'
                      : 'badge-pending';

                  return (
                    <article key={order.id} className={`${styles.quotationCard} glass-panel`}>
                      <div className={styles.quotationHeader}>
                        <div className={styles.sellerMeta}>
                          <h4>Seller: {order.seller_name}</h4>
                          <p>{order.seller_email} • Placed {new Date(order.created_at).toLocaleString('en-IN')}</p>
                        </div>
                        
                        <div className={styles.quotationSummary}>
                          <div className={styles.totalValue}>
                            <h6>Total Quotation</h6>
                            <p>{formatINR(order.total_price)}</p>
                          </div>
                          <div>
                            <span className={`badge ${badgeClass}`}>{order.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Items & Conversion Auditing Details */}
                      <div>
                        <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                          Conversion & Pricing Audit Details
                        </h5>
                        
                        <div style={{ overflowX: 'auto' }}>
                          <table className={styles.auditTable}>
                            <thead>
                              <tr>
                                <th className={styles.auditTh}>Product</th>
                                <th className={styles.auditTh}>Ordered Qty</th>
                                <th className={styles.auditTh}>Unit Conversion Formula</th>
                                <th className={styles.auditTh}>Converted Qty</th>
                                <th className={styles.auditTh}>Base Rate (INR)</th>
                                <th className={styles.auditTh}>Calculated Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item) => {
                                const isCompatible = item.ordered_unit !== item.base_unit;
                                
                                return (
                                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td className={styles.auditTd}>
                                      <div style={{ fontWeight: 600 }}>{item.product_name}</div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {item.sku}</div>
                                    </td>
                                    <td className={styles.auditTd} style={{ fontWeight: 600 }}>
                                      {item.ordered_quantity} {item.ordered_unit}
                                    </td>
                                    <td className={styles.auditTd}>
                                      <div className={styles.formulaBlock}>
                                        {item.ordered_quantity} {item.ordered_unit}
                                        {isCompatible ? ` × ${item.conversion_factor}` : ''}
                                        {` = `}
                                        {parseFloat(item.base_quantity).toFixed(4)} {item.base_unit}
                                      </div>
                                      {isCompatible && (
                                        <div className={styles.conversionSteps}>
                                          (Factor: 1 {item.ordered_unit} = {item.conversion_factor} {item.base_unit})
                                        </div>
                                      )}
                                    </td>
                                    <td className={styles.auditTd}>
                                      {parseFloat(item.base_quantity).toFixed(4)} {item.base_unit}
                                    </td>
                                    <td className={styles.auditTd}>
                                      {formatINR(item.base_price)} / {item.base_unit}
                                    </td>
                                    <td className={styles.auditTd} style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                      {formatINR(item.calculated_price)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Approval control buttons */}
                      {order.status === 'PENDING' && (
                        <div style={{ marginTop: '10px' }}>
                          {hasInsufficientStock && (
                            <div className={styles.noStockAlert}>
                              ⚠️ <strong>Stock Shortage Detected!</strong> One or more items in this quotation exceed current available stock. You cannot approve this quotation until inventory is replenished.
                            </div>
                          )}

                          <div className={styles.controlButtons} style={{ marginTop: '16px' }}>
                            <button
                              className={styles.rejectBtn}
                              onClick={() => handleProcessOrder(order.id, 'REJECTED')}
                              disabled={isPending && actioningOrderId === order.id}
                              id={`reject-btn-${order.id}`}
                            >
                              Reject Quotation
                            </button>
                            <button
                              className={styles.approveBtn}
                              onClick={() => handleProcessOrder(order.id, 'APPROVED')}
                              disabled={hasInsufficientStock || (isPending && actioningOrderId === order.id)}
                              id={`approve-btn-${order.id}`}
                            >
                              {isPending && actioningOrderId === order.id ? 'Processing...' : 'Approve & Deduct Stock'}
                            </button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modal: Add Product */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel`}>
            <h3 className={styles.modalTitle}>Add New Chemical Product</h3>
            <form onSubmit={handleAddProduct}>
              <div className={styles.formGrid}>
                <div className={styles.spanFull}>
                  <label className={loginStyles.label}>Product SKU (Unique ID)</label>
                  <input type="text" name="sku" required className={loginStyles.input} placeholder="e.g. SOD-HYD-500G" />
                </div>
                
                <div className={styles.spanFull}>
                  <label className={loginStyles.label}>Product Name</label>
                  <input type="text" name="name" required className={loginStyles.input} placeholder="e.g. Sodium Hydroxide Pellets" />
                </div>

                <div className={styles.spanFull}>
                  <label className={loginStyles.label}>Description</label>
                  <textarea name="description" className={loginStyles.input} style={{ minHeight: '80px', resize: 'vertical' }} placeholder="e.g. Solid white caustic soda pellets for reagent use..." />
                </div>

                <div>
                  <label className={loginStyles.label}>Category</label>
                  <input type="text" name="category" required className={loginStyles.input} placeholder="e.g. Reagents" />
                </div>

                <div>
                  <label className={loginStyles.label}>Base Dimension Unit</label>
                  <select name="base_unit" required className={loginStyles.input} style={{ cursor: 'pointer' }}>
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={loginStyles.label}>Base Price (INR per unit)</label>
                  <input type="number" step="any" min="0.0001" name="base_price" required className={loginStyles.input} placeholder="e.g. 450.00" />
                </div>

                <div>
                  <label className={loginStyles.label}>Initial Stock Quantity</label>
                  <input type="number" step="any" min="0" name="stock_quantity" required className={loginStyles.input} placeholder="e.g. 25.5" />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className={loginStyles.btn} style={{ marginTop: 0, width: 'auto', padding: '10px 24px' }}>
                  {isPending ? 'Saving...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Product */}
      {editingProduct && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} glass-panel`}>
            <h3 className={styles.modalTitle}>Edit Product: {editingProduct.sku}</h3>
            <form onSubmit={handleEditProduct}>
              <div className={styles.formGrid}>
                <div className={styles.spanFull}>
                  <label className={loginStyles.label}>Product SKU (Unique ID)</label>
                  <input type="text" name="sku" required defaultValue={editingProduct.sku} className={loginStyles.input} />
                </div>
                
                <div className={styles.spanFull}>
                  <label className={loginStyles.label}>Product Name</label>
                  <input type="text" name="name" required defaultValue={editingProduct.name} className={loginStyles.input} />
                </div>

                <div className={styles.spanFull}>
                  <label className={loginStyles.label}>Description</label>
                  <textarea name="description" defaultValue={editingProduct.description} className={loginStyles.input} style={{ minHeight: '80px', resize: 'vertical' }} />
                </div>

                <div>
                  <label className={loginStyles.label}>Category</label>
                  <input type="text" name="category" required defaultValue={editingProduct.category} className={loginStyles.input} />
                </div>

                <div>
                  <label className={loginStyles.label}>Base Dimension Unit</label>
                  <select name="base_unit" required defaultValue={editingProduct.base_unit} className={loginStyles.input} style={{ cursor: 'pointer' }}>
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={loginStyles.label}>Base Price (INR per unit)</label>
                  <input type="number" step="any" min="0.0001" name="base_price" required defaultValue={editingProduct.base_price} className={loginStyles.input} />
                </div>

                <div>
                  <label className={loginStyles.label}>Current Stock Quantity</label>
                  <input type="number" step="any" min="0" name="stock_quantity" required defaultValue={editingProduct.stock_quantity} className={loginStyles.input} />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={isPending} className={loginStyles.btn} style={{ marginTop: 0, width: 'auto', padding: '10px 24px' }}>
                  {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SVG definitions for navigation gradients */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="navGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
