import React, { useMemo, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const cartTypes = [
  { value: 'sale', label: 'Sale' },
  { value: 'rental', label: 'Rental' },
  { value: 'return', label: 'Rental Return' },
  { value: 'unsatisfactory', label: 'Unsatisfactory Return' },
];

export default function CashierDashboard() {
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [type, setType] = useState('sale');
  const [phone, setPhone] = useState('');
  const [itemEntry, setItemEntry] = useState({ itemId: '', qty: 1 });
  const [coupon, setCoupon] = useState('');
  const [payment, setPayment] = useState({ method: 'cash', cashGiven: 0, cardNumber: '' });
  const [message, setMessage] = useState('');

  const totals = useMemo(() => {
    if (!cart) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = cart.lines.reduce((acc, l) => acc + l.priceAtAdd * l.qty, 0);
    const tax = subtotal * 0.06;
    return { subtotal, tax, total: subtotal + tax };
  }, [cart]);

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
      setMessage('Item added');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Add failed');
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
      setMessage('Coupon applied');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Coupon invalid');
    }
  };

  const checkout = async () => {
    if (!cart) return;
    try {
      const res = await api.post(`/transactions/${cart._id}/checkout`, {
        payment,
        cardNumber: payment.cardNumber,
      });
      setMessage(`Checkout success: ${res.data.invoiceId}`);
      setCart(null);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Checkout failed');
    }
  };

  return (
    <div className="card">
      <div className="flex-between">
        <h2>Cashier Console</h2>
        <span className="badge">{user?.role}</span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="card" style={{ background: '#0f172a' }}>
          <h4>Cart type</h4>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {cartTypes.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </select>
          {(type === 'rental' || type === 'return') && (
            <input
              className="input"
              placeholder="Customer phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ marginTop: 8 }}
            />
          )}
          <button className="button" style={{ marginTop: 12 }} onClick={startCart}>
            Start cart
          </button>
          {cart && <span className="badge" style={{ marginTop: 8 }}>Cart #{cart._id}</span>}
        </div>

        <div className="card" style={{ background: '#0f172a' }}>
          <h4>Add item</h4>
          <input
            className="input"
            placeholder="Item ID"
            value={itemEntry.itemId}
            onChange={(e) => setItemEntry({ ...itemEntry, itemId: e.target.value })}
          />
          <input
            className="input"
            type="number"
            min="1"
            value={itemEntry.qty}
            onChange={(e) => setItemEntry({ ...itemEntry, qty: e.target.value })}
            style={{ marginTop: 8 }}
          />
          <button className="button" style={{ marginTop: 12 }} onClick={addLine} disabled={!cart}>
            Add to cart
          </button>
        </div>

        <div className="card" style={{ background: '#0f172a' }}>
          <h4>Coupon</h4>
          <input className="input" placeholder="TENOFF" value={coupon} onChange={(e) => setCoupon(e.target.value)} />
          <button className="button secondary" style={{ marginTop: 10 }} onClick={applyCoupon} disabled={!cart}>
            Apply coupon
          </button>
        </div>

        <div className="card" style={{ background: '#0f172a' }}>
          <h4>Payment</h4>
          <select
            className="input"
            value={payment.method}
            onChange={(e) => setPayment({ ...payment, method: e.target.value })}
          >
            <option value="cash">Cash</option>
            <option value="electronic">Electronic</option>
          </select>
          {payment.method === 'cash' ? (
            <input
              className="input"
              type="number"
              placeholder="Cash given"
              value={payment.cashGiven}
              onChange={(e) => setPayment({ ...payment, cashGiven: Number(e.target.value) })}
              style={{ marginTop: 8 }}
            />
          ) : (
            <>
              <input
                className="input"
                placeholder="16-digit card"
                value={payment.cardNumber}
                onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })}
                style={{ marginTop: 8 }}
              />
              <input
                className="input"
                type="number"
                placeholder="Cashback (optional)"
                value={payment.cashBack || ''}
                onChange={(e) => setPayment({ ...payment, cashBack: Number(e.target.value) })}
                style={{ marginTop: 8 }}
              />
            </>
          )}
          <button className="button" style={{ marginTop: 12 }} onClick={checkout} disabled={!cart}>
            Checkout
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="flex-between">
          <h4>Lines</h4>
          <div>
            <span className="badge">Subtotal ${totals.subtotal.toFixed(2)}</span>
            <span className="badge" style={{ marginLeft: 8 }}>
              Est. Total ${totals.total.toFixed(2)}
            </span>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(cart?.lines || []).map((l) => (
              <tr key={l.item}>
                <td>{l.item}</td>
                <td>{l.qty}</td>
                <td>${l.priceAtAdd.toFixed(2)}</td>
                <td>
                  <button className="button secondary" onClick={() => removeLine(l.item)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && <div style={{ marginTop: 12, color: 'var(--muted)' }}>{message}</div>}
    </div>
  );
}
