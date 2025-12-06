import React, { useMemo, useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const cartTypes = [
  { value: 'sale', label: '🛒 Sale' },
  { value: 'rental', label: '📦 Rental' },
  { value: 'return', label: '↩️ Rental Return' },
  { value: 'unsatisfactory', label: '❌ Unsatisfactory Return' },
];

export default function CashierDashboard() {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [type, setType] = useState('sale');
  const [phone, setPhone] = useState('');
  const [itemEntry, setItemEntry] = useState({ itemId: '', qty: 1 });
  const [coupon, setCoupon] = useState('');
  const [payment, setPayment] = useState({ method: 'cash', cashGiven: 0, cardNumber: '', cashBack: 0 });
  const [message, setMessage] = useState('');
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);

  const totals = useMemo(() => {
    if (!cart) return { subtotal: 0, tax: 0, discount: 0, total: 0 };
    let subtotal = cart.lines.reduce((acc, l) => acc + l.priceAtAdd * l.qty, 0);
    const discount = cart.couponCode ? subtotal * 0.1 : 0;
    subtotal -= discount;
    const tax = subtotal * 0.06;
    return { subtotal: subtotal + discount, discount, tax, total: subtotal + tax };
  }, [cart]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item._id.includes(searchTerm)
    );
  }, [items, searchTerm]);

  useEffect(() => {
    loadItems();
    loadRecentTransactions();
  }, []);

  const loadItems = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load items', err);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setRecentTransactions(res.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load transactions', err);
    }
  };

  const startCart = async () => {
    try {
      const res = await api.post('/carts', { type, phone: phone || undefined });
      setCart(res.data);
      setMessage('Cart started');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not start cart');
    }
  };

  const addLine = async () => {
    if (!cart) return;
    try {
      const res = await api.post(`/carts/${cart._id}/lines`, {
        itemId: itemEntry.itemId,
        qty: Number(itemEntry.qty),
      });
      setCart(res.data);
      setItemEntry({ itemId: '', qty: 1 });
      setSearchTerm('');
      setMessage('✅ Item added to cart');
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Add failed'}`);
    }
  };

  const removeLine = async (itemId) => {
    const res = await api.delete(`/carts/${cart._id}/lines/${itemId}`);
    setCart(res.data);
  };

  const applyCoupon = async () => {
    if (!cart) return;
    try {
      const res = await api.post(`/carts/${cart._id}/coupon`, { code: coupon });
      setCart(res.data);
      setMessage(`✅ Coupon ${coupon} applied! 10% discount`);
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Coupon invalid'}`);
    }
  };

  const validateCard = (cardNumber) => {
    // Luhn Algorithm validation (from legacy spec)
    if (!/^\d{16}$/.test(cardNumber)) return false;
    let sum = 0;
    let isEven = false;
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    return sum % 10 === 0;
  };

  const checkout = async () => {
    if (!cart) return;
    
    // Validate payment (from legacy spec)
    if (payment.method === 'cash' && payment.cashGiven < totals.total) {
      setMessage(`❌ Insufficient cash! Need $${totals.total.toFixed(2)}, gave $${payment.cashGiven}`);
      return;
    }
    
    if (payment.method === 'electronic' && !validateCard(payment.cardNumber)) {
      setMessage('❌ Invalid credit card number (failed Luhn algorithm check)');
      return;
    }
    
    try {
      const res = await api.post(`/transactions/${cart._id}/checkout`, {
        payment,
        cardNumber: payment.cardNumber,
      });
      setLastReceipt(res.data);
      setShowReceipt(true);
      setMessage(`✅ Checkout success: Invoice #${res.data.invoiceId}`);
      setCart(null);
      setCoupon('');
      setPhone('');
      setPayment({ method: 'cash', cashGiven: 0, cardNumber: '', cashBack: 0 });
      loadRecentTransactions();
      loadItems(); // Refresh inventory
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Checkout failed'}`);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex-between">
          <div>
            <h2>🏪 Cashier Point of Sale</h2>
            <p style={{ color: 'var(--muted)', marginTop: 4 }}>
              {user?.firstName} {user?.lastName} · {user?.role}
            </p>
          </div>
          {cart && (
            <div style={{ textAlign: 'right' }}>
              <div className="badge" style={{ fontSize: '1.2rem', padding: '8px 16px' }}>
                Total: ${totals.total.toFixed(2)}
              </div>
              {totals.discount > 0 && (
                <div style={{ color: '#10b981', marginTop: 4, fontSize: '0.9rem' }}>
                  💰 Saved ${totals.discount.toFixed(2)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Main Transaction Panel */}
        <div>
          {/* Cart Controls */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>📋 New Transaction</h3>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
                  Transaction Type
                </label>
                <select className="input" value={type} onChange={(e) => setType(e.target.value)} disabled={!!cart}>
                  {cartTypes.map((ct) => (
                    <option key={ct.value} value={ct.value}>
                      {ct.label}
                    </option>
                  ))}
                </select>
              </div>
              {(type === 'rental' || type === 'return') && (
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
                    Customer Phone (10 digits)
                  </label>
                  <input
                    className="input"
                    placeholder="1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!!cart}
                    maxLength="10"
                  />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="button" onClick={startCart} disabled={!!cart} style={{ width: '100%' }}>
                  {cart ? '✓ Cart Active' : 'Start Cart'}
                </button>
              </div>
            </div>
          </div>

          {/* Item Search & Add */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>🔍 Add Items</h3>
            <input
              className="input"
              placeholder="Search items by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
                  Item ID {itemEntry.itemId && items.find(i => i._id === itemEntry.itemId) && `(${items.find(i => i._id === itemEntry.itemId).name})`}
                </label>
                <input
                  className="input"
                  placeholder="Item ID"
                  value={itemEntry.itemId}
                  onChange={(e) => setItemEntry({ ...itemEntry, itemId: e.target.value })}
                  disabled={!cart}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
                  Quantity
                </label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={itemEntry.qty}
                  onChange={(e) => setItemEntry({ ...itemEntry, qty: e.target.value })}
                  disabled={!cart}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="button" onClick={addLine} disabled={!cart} style={{ width: '100%' }}>
                  + Add
                </button>
              </div>
            </div>
            
            {/* Quick item selection */}
            {searchTerm && filteredItems.length > 0 && (
              <div style={{ marginTop: 12, maxHeight: 200, overflowY: 'auto', border: '1px solid #334155', borderRadius: 8, padding: 8 }}>
                {filteredItems.slice(0, 5).map(item => (
                  <div
                    key={item._id}
                    onClick={() => setItemEntry({ itemId: item._id, qty: 1 })}
                    style={{
                      padding: 8,
                      cursor: 'pointer',
                      borderRadius: 4,
                      marginBottom: 4,
                      background: itemEntry.itemId === item._id ? '#1e40af' : '#1e293b',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{item.name}</span>
                    <span style={{ color: 'var(--muted)' }}>${item.price} · Stock: {item.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <h3>🛒 Cart Items</h3>
              <div>
                <span className="badge" style={{ marginRight: 8 }}>Subtotal: ${totals.subtotal.toFixed(2)}</span>
                {totals.discount > 0 && <span className="badge" style={{ background: '#10b981' }}>-${totals.discount.toFixed(2)}</span>}
              </div>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(cart?.lines || []).length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>
                      Cart is empty. Add items to begin.
                    </td>
                  </tr>
                ) : (
                  (cart?.lines || []).map((l) => (
                    <tr key={l.item._id || l.item}>
                      <td>
                        <strong>{l.item?.name || l.item}</strong>
                        {l.item?.name && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                            ID: {typeof l.item === 'object' ? l.item._id : l.item}
                          </div>
                        )}
                      </td>
                      <td>{l.qty}</td>
                      <td>${l.priceAtAdd.toFixed(2)}</td>
                      <td><strong>${(l.priceAtAdd * l.qty).toFixed(2)}</strong></td>
                      <td>
                        <button
                          className="button secondary"
                          onClick={() => removeLine(typeof l.item === 'object' ? l.item._id : l.item)}
                          style={{ padding: '4px 12px' }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar - Coupon, Payment, Summary */}
        <div>
          {/* Coupon */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h4>🎫 Apply Coupon</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8 }}>
              10% discount
            </p>
            <input
              className="input"
              placeholder="Enter code (e.g., C001)"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              disabled={!cart}
            />
            <button className="button secondary" onClick={applyCoupon} disabled={!cart || !coupon} style={{ marginTop: 8, width: '100%' }}>
              Apply
            </button>
            {cart?.couponCode && (
              <div style={{ marginTop: 8, color: '#10b981', fontSize: '0.9rem' }}>
                ✓ {cart.couponCode} applied
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="card" style={{ marginBottom: 16 }}>
            <h4>💳 Payment Method</h4>
            <select
              className="input"
              value={payment.method}
              onChange={(e) => setPayment({ ...payment, method: e.target.value })}
              disabled={!cart}
            >
              <option value="cash">💵 Cash</option>
              <option value="electronic">💳 Card</option>
            </select>
            {payment.method === 'cash' ? (
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
                  Cash Given
                </label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={payment.cashGiven || ''}
                  onChange={(e) => setPayment({ ...payment, cashGiven: Number(e.target.value) })}
                  disabled={!cart}
                />
                {payment.cashGiven > 0 && totals.total > 0 && (
                  <div style={{ marginTop: 8, padding: 8, background: '#1e293b', borderRadius: 4 }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Change Due:</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: payment.cashGiven >= totals.total ? '#10b981' : '#ef4444' }}>
                      ${Math.max(0, payment.cashGiven - totals.total).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
                  Card Number (16 digits)
                </label>
                <input
                  className="input"
                  placeholder="1234567890123456"
                  value={payment.cardNumber}
                  onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })}
                  disabled={!cart}
                  maxLength="16"
                />
                <label style={{ display: 'block', marginBottom: 4, marginTop: 8, fontSize: '0.9rem', color: 'var(--muted)' }}>
                  Cash Back (optional)
                </label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={payment.cashBack || ''}
                  onChange={(e) => setPayment({ ...payment, cashBack: Number(e.target.value) })}
                  disabled={!cart}
                />
              </div>
            )}
          </div>

          {/* Total Summary */}
          <div className="card" style={{ marginBottom: 16, background: '#1e40af' }}>
            <h4 style={{ marginBottom: 12 }}>💰 Total Summary</h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Subtotal:</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#10b981' }}>
                <span>Discount (10%):</span>
                <span>-${totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Tax (6%):</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '12px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 'bold' }}>
              <span>TOTAL:</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            className="button"
            onClick={checkout}
            disabled={!cart || (cart?.lines || []).length === 0}
            style={{ width: '100%', padding: 16, fontSize: '1.1rem', fontWeight: 'bold' }}
          >
            {cart ? '✓ Complete Checkout' : 'Start a cart first'}
          </button>

          {/* Recent Transactions */}
          <div className="card" style={{ marginTop: 16 }}>
            <h4>📜 Recent Transactions</h4>
            <div style={{ fontSize: '0.85rem' }}>
              {recentTransactions.map((txn, i) => (
                <div
                  key={txn._id}
                  style={{
                    padding: 8,
                    marginTop: i > 0 ? 8 : 0,
                    background: '#1e293b',
                    borderRadius: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => { setLastReceipt(txn); setShowReceipt(true); }}
                >
                  <span>{txn.invoiceId}</span>
                  <span>${txn.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className="card" style={{ marginTop: 16, background: message.includes('✅') ? '#065f46' : message.includes('❌') ? '#7f1d1d' : '#0f172a' }}>
          {message}
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastReceipt && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowReceipt(false)}
        >
          <div className="card" style={{ width: 400, maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h2>🧾 Receipt</h2>
              <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Invoice #{lastReceipt.invoiceId}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                {new Date(lastReceipt.createdAt).toLocaleString()}
              </div>
            </div>
            <div style={{ borderTop: '1px dashed #334155', paddingTop: 12 }}>
              {lastReceipt.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>
                    {item.qty}x {typeof item.item === 'object' ? item.item.name : `Item ${item.item}`}
                    {typeof item.item === 'object' && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        ${item.price.toFixed(2)} each
                      </div>
                    )}
                  </span>
                  <span style={{ fontWeight: 'bold' }}>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px dashed #334155', paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Subtotal:</span>
                <span>${lastReceipt.subtotal.toFixed(2)}</span>
              </div>
              {lastReceipt.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#10b981' }}>
                  <span>Discount:</span>
                  <span>-${lastReceipt.discount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Tax:</span>
                <span>${lastReceipt.tax.toFixed(2)}</span>
              </div>
              {lastReceipt.lateFees > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: '#ef4444' }}>
                  <span>Late Fees:</span>
                  <span>${lastReceipt.lateFees.toFixed(2)}</span>
                </div>
              )}
              <div style={{ borderTop: '1px solid #334155', paddingTop: 8, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  <span>TOTAL:</span>
                  <span>${lastReceipt.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px dashed #334155', paddingTop: 12, marginTop: 12, fontSize: '0.85rem' }}>
              <div>Payment: {lastReceipt.payment?.method === 'cash' ? '💵 Cash' : '💳 Card'}</div>
              {lastReceipt.payment?.method === 'cash' && (
                <>
                  <div>Given: ${lastReceipt.payment.cashGiven?.toFixed(2)}</div>
                  <div>Change: ${lastReceipt.payment.cashBack?.toFixed(2)}</div>
                </>
              )}
              {lastReceipt.payment?.cardLast4 && (
                <div>Card: ****{lastReceipt.payment.cardLast4}</div>
              )}
            </div>
            <button className="button" onClick={() => setShowReceipt(false)} style={{ width: '100%', marginTop: 16 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
