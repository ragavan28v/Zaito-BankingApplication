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
  { to: '/request-payment', label: 'Request Payment', icon: '📨' },
  { to: '/payment-requests', label: 'Payment Requests', icon: '📋' },
  { to: '/group-expense', label: 'Group Expense', icon: '👥' },
  { to: '/analytics', label: 'Analytics', icon: '📊' },
  { to: '/transaction-notes', label: 'Transaction Notes', icon: '📝' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

const Sidebar = ({ isOpen, onOpen, onClose, isMobile }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const sidebarRef = useRef();

  const handleLogout = () => {
    logout();
    navigate('/');
    if (onClose) onClose();
  };

  // Close on Esc key for accessibility
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('sidebar-mobile-backdrop')) {
      onClose && onClose();
    }
  };

  return (
    <>
      {isMobile && !isOpen && (
        <button
          className="sidebar-toggle-btn"
          aria-label="Open sidebar"
          onClick={onOpen}
        >
          <span style={{ fontSize: 24 }}>☰</span>
        </button>
      )}
      {isMobile && isOpen && (
        <div 
          className="sidebar-mobile-backdrop open"
          onClick={handleBackdropClick}
          aria-hidden={!isOpen}
        />
      )}
      {(!isMobile || isOpen) && (
      <aside
          className={`sidebar${isMobile ? ' mobile-overlay' : ''}${isOpen ? ' open' : ''}`}
        ref={sidebarRef}
        aria-label="Sidebar navigation"
        tabIndex={-1}
      >
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">🏦</span>
          <span className="sidebar-logo-text">Zaito</span>
        </div>
          <div className="user-info">
            <div className="user-avatar">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="user-details">
              <div className="user-name">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="account-number">
                {user?.accountNumber}
              </div>
            </div>
          </div>
        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' active' : '')
              }
                onClick={isMobile ? onClose : undefined}
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
      )}
    </>
  );
};

export default Sidebar; 