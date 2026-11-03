import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const handleLogout = () => {
    logout();
    showToast('You have been logged out successfully', 'info');
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-logo" aria-hidden="true">✓</span>
          <span className="brand-name">TaskFlow</span>
        </div>
        <div className="navbar-user">
          {user && (
            <>
              <div className="user-info">
                <span className="user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                <span className="user-name">{user.name}</span>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm logout-btn"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

