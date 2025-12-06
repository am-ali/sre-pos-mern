import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function InventoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', price: 0, quantity: 0 });

  const load = async () => {
    const res = await api.get('/items');
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const addItem = async () => {
    await api.post('/items', form);
    setForm({ name: '', price: 0, quantity: 0 });
    load();
  };

  return (
    <div className="card">
      <div className="flex-between">
        <h2>Inventory</h2>
        <span className="badge">Stock and pricing</span>
      </div>
      {user?.role === 'ADMIN' && (
        <div className="card" style={{ background: '#0f172a', marginBottom: 16 }}>
          <h4>Add item</h4>
          <div className="flex" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <input
              className="input"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="input"
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
            <input
              className="input"
              type="number"
              placeholder="Qty"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            />
            <button className="button" onClick={addItem}>
              Add
            </button>
          </div>
        </div>
      )}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Qty</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it._id}>
              <td>{it.name}</td>
              <td>${it.price.toFixed(2)}</td>
              <td>{it.quantity}</td>
              <td>{it._id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
