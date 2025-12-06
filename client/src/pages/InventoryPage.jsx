import React, { useEffect, useState, useMemo } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', price: 0, quantity: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const lowStock = items.filter(item => item.quantity < 10).length;
    const outOfStock = items.filter(item => item.quantity === 0).length;
    return { totalItems, totalValue, lowStock, outOfStock };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item._id.includes(searchTerm)
    );
  }, [items, searchTerm]);

  const load = async () => {
    try {
      const res = await api.get('/items');
      setItems(res.data);
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Failed to load items'}`);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addItem = async () => {
    if (!form.name || form.price <= 0 || form.quantity < 0) {
      setMessage('❌ Please fill all fields correctly');
      return;
    }
    try {
      await api.post('/items', form);
      setForm({ name: '', price: 0, quantity: 0 });
      setMessage('✅ Item added successfully');
      load();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Add failed'}`);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/items/${id}`);
      setMessage('✅ Item deleted');
      load();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Delete failed'}`);
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: '⚠️ Out of Stock', color: '#7f1d1d' };
    if (quantity < 10) return { label: '⚡ Low Stock', color: '#7c2d12' };
    if (quantity < 50) return { label: '✓ In Stock', color: '#065f46' };
    return { label: '✓ Well Stocked', color: '#0f766e' };
  };

  return (
    <div>
      {/* Header with Stats */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex-between">
          <div>
            <h2>📦 Inventory Management</h2>
            <p style={{ color: 'var(--muted)', marginTop: 4 }}>
              Monitor stock levels and manage products
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="card" style={{ background: '#1e40af', padding: 12, textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalItems}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Items</div>
            </div>
            <div className="card" style={{ background: '#0f766e', padding: 12, textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${stats.totalValue.toFixed(0)}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Value</div>
            </div>
            <div className="card" style={{ background: '#7c2d12', padding: 12, textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.lowStock}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Low Stock</div>
            </div>
            {stats.outOfStock > 0 && (
              <div className="card" style={{ background: '#7f1d1d', padding: 12, textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.outOfStock}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Out</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Item Form - Admin Only */}
      {user?.role === 'ADMIN' && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>➕ Add New Item</h3>
          <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
                Item Name
              </label>
              <input
                className="input"
                placeholder="Product name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
                Price ($)
              </label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.price || ''}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
                Quantity
              </label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="0"
                value={form.quantity || ''}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </div>
            <button className="button" onClick={addItem}>
              Add Item
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="card" style={{ marginBottom: 16 }}>
        <input
          className="input"
          placeholder="🔍 Search items by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Items Table */}
      <div className="card">
        <h3>📋 All Items ({filteredItems.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Item ID</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Value</th>
                {user?.role === 'ADMIN' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'ADMIN' ? '7' : '6'} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                    {searchTerm ? 'No items match your search' : 'No items in inventory'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const status = getStockStatus(item.quantity);
                  return (
                    <tr key={item._id}>
                      <td><strong>{item.name}</strong></td>
                      <td>
                        <span className="badge" style={{ fontSize: '0.75rem', background: '#334155' }}>
                          {item._id}
                        </span>
                      </td>
                      <td>${item.price.toFixed(2)}</td>
                      <td><strong>{item.quantity}</strong></td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: status.color,
                            fontSize: '0.75rem'
                          }}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                      {user?.role === 'ADMIN' && (
                        <td>
                          <button
                            className="button secondary"
                            onClick={() => deleteItem(item._id)}
                            style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className="card"
          style={{
            marginTop: 16,
            background: message.includes('✅') ? '#065f46' : '#7f1d1d'
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
