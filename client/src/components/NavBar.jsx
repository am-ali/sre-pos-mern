import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="flex-between">
        <div className="flex" style={{ gap: 8 }}>
          <span className="badge">SRE POS</span>
          <Link to="/" className="badge">
            Cashier
          </Link>
          <Link to="/inventory" className="badge">
            Inventory
          </Link>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="badge">
              Admin
            </Link>
          )}
        </div>
        <div className="flex" style={{ gap: 12 }}>
          {user ? <span className="badge">{user.firstName} {user.lastName} · {user.role}</span> : null}
          {user ? (
            <button className="button secondary" onClick={logout}>
              Logout
            </button>
          ) : (
            <Link className="button secondary" to="/login">
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
