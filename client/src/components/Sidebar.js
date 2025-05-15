import React, { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/deposit', label: 'Deposit', icon: '⬆️' },
  { to: '/withdraw', label: 'Withdraw', icon: '⬇️' },
  { to: '/transfer', label: 'Transfer', icon: '🔄' },
  { to: '/transactions', label: 'Transactions', icon: '📄' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

const Sidebar = ({ mobileOverlay, open, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const sidebarRef = useRef();

  const handleLogout = () => {
    logout();
    navigate('/');
    if (onClose) onClose();
  };

  // Close on Esc key for accessibility
  useEffect(() => {
    if (!mobileOverlay || !open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOverlay, open, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('sidebar-mobile-backdrop')) {
      onClose && onClose();
    }
  };

  return (
    <>
      {mobileOverlay && (
        <button
          className="sidebar-toggle-btn"
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          onClick={onClose}
        >
          <span style={{ fontSize: 24 }}>{open ? '×' : '☰'}</span>
        </button>
      )}
      {mobileOverlay && (
        <div 
          className={`sidebar-mobile-backdrop${open ? ' open' : ''}`}
          onClick={handleBackdropClick}
          aria-hidden={!open}
        />
      )}
      <aside
        className={`sidebar${mobileOverlay ? ' mobile-overlay' : ''}${open ? ' open' : ''}`}
        ref={sidebarRef}
        aria-label="Sidebar navigation"
        tabIndex={-1}
      >
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🏦</span>
          <span className="sidebar-logo-text">Zaito</span>
        </div>
        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' active' : '')
              }
              onClick={mobileOverlay ? onClose : undefined}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              <span className="sidebar-link-label">{link.label}</span>
              <span className="sidebar-link-highlight" />
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>
          <span className="sidebar-link-icon">🚪</span>
          <span className="sidebar-link-label">Logout</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar; 