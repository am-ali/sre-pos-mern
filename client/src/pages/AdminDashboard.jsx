import React, { useEffect, useState } from 'react';
import api from '../api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', role: 'CASHIER' });
  const [message, setMessage] = useState('');

  const load = async () => {
    const res = await api.get('/users');
    setUsers(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    try {
      await api.post('/users', form);
      setForm({ firstName: '', lastName: '', password: '', role: 'CASHIER' });
      setMessage('User created');
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Create failed');
    }
  };

  const remove = async (id) => {
    await api.delete(`/users/${id}`);
    load();
  };

  return (
    <div className="card">
      <h2>Employee Admin</h2>
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <div className="card" style={{ background: '#0f172a' }}>
          <h4>Add user</h4>
          <input
            className="input"
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <input
            className="input"
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            style={{ marginTop: 8 }}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={{ marginTop: 8 }}
          />
          <select
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={{ marginTop: 8 }}
          >
            <option value="ADMIN">Admin</option>
            <option value="CASHIER">Cashier</option>
          </select>
          <button className="button" style={{ marginTop: 12 }} onClick={create}>
            Save
          </button>
          {message && <div style={{ marginTop: 8, color: 'var(--muted)' }}>{message}</div>}
        </div>

        <div className="card" style={{ background: '#0f172a' }}>
          <h4>Employees</h4>
          <table className="table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.employeeId}</td>
                  <td>{u.firstName} {u.lastName}</td>
                  <td>{u.username}</td>
                  <td>{u.role}</td>
                  <td>
                    <button className="button secondary" onClick={() => remove(u._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
