import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', role: 'CASHIER' });
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [stats, setStats] = useState({ totalEmployees: 0, admins: 0, cashiers: 0 });

  const load = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
      const admins = res.data.filter(u => u.role === 'ADMIN').length;
      const cashiers = res.data.filter(u => u.role === 'CASHIER').length;
      setStats({ totalEmployees: res.data.length, admins, cashiers });
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Failed to load users'}`);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      if (!form.firstName || !form.lastName || !form.password) {
        setMessage('❌ All fields are required');
        return;
      }
      await api.post('/users', form);
      setForm({ firstName: '', lastName: '', password: '', role: 'CASHIER' });
      setMessage('✅ User created successfully');
      load();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Create failed'}`);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/users/${id}`);
      setMessage('✅ User deleted');
      load();
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.message || 'Delete failed'}`);
    }
  };

  return (
    <div>
      {/* Header with Stats */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex-between">
          <div>
            <h2>👥 Employee Management</h2>
            <p style={{ color: 'var(--muted)', marginTop: 4 }}>
              Manage system users and permissions
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="card" style={{ background: '#1e40af', padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalEmployees}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Total</div>
            </div>
            <div className="card" style={{ background: '#0f766e', padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.admins}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Admins</div>
            </div>
            <div className="card" style={{ background: '#7c2d12', padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.cashiers}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Cashiers</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start', gap: 16 }}>
        {/* Add User Form */}
        <div className="card">
          <h3>➕ Add New Employee</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: 12 }}>
            Create a new system user account
          </p>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
              First Name
            </label>
            <input
              className="input"
              placeholder="John"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
              Last Name
            </label>
            <input
              className="input"
              placeholder="Doe"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
              Password
            </label>
            <input
              className="input"
              type="password"
              placeholder="Secure password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--muted)' }}>
              Role
            </label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="ADMIN">🔑 Admin (Full Access)</option>
              <option value="CASHIER">🏪 Cashier (POS Only)</option>
            </select>
          </div>
          <button className="button" style={{ marginTop: 16, width: '100%' }} onClick={create}>
            Create Employee
          </button>
          {message && (
            <div
              style={{
                marginTop: 12,
                padding: 8,
                borderRadius: 4,
                background: message.includes('✅') ? '#065f46' : '#7f1d1d',
                fontSize: '0.9rem'
              }}
            >
              {message}
            </div>
          )}
        </div>

        {/* Employee List */}
        <div className="card">
          <h3>📋 Employee Directory</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: 12 }}>
            All system users · Click to view details
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                      No employees found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id}>
                      <td><span className="badge">{u.employeeId}</span></td>
                      <td>{u.firstName} {u.lastName}</td>
                      <td>{u.username}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background: u.role === 'ADMIN' ? '#1e40af' : '#7c2d12'
                          }}
                        >
                          {u.role === 'ADMIN' ? '🔑 Admin' : '🏪 Cashier'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="button secondary"
                          onClick={() => remove(u._id)}
                          disabled={u._id === user?._id}
                          style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                        >
                          {u._id === user?._id ? '🔒 You' : '🗑️ Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
