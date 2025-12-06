import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: '80px auto' }}>
      <h2>Welcome back</h2>
      <p style={{ color: 'var(--muted)' }}>Sign in to run transactions or manage staff.</p>
      <form className="grid" style={{ marginTop: 12 }} onSubmit={submit}>
        <input
          className="input"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <span style={{ color: 'var(--danger)' }}>{error}</span>}
        <button className="button" type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
