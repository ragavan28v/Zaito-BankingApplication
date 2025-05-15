import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Zaito</Link>
      </div>
      <div className="navbar-menu">
        {user ? (
          <>
            <Link to="/dashboard" className="navbar-item">Dashboard</Link>
            <Link to="/deposit" className="navbar-item">Deposit</Link>
            <Link to="/withdraw" className="navbar-item">Withdraw</Link>
            <Link to="/transfer" className="navbar-item">Transfer</Link>
            <Link to="/transactions" className="navbar-item">Transactions</Link>
            <button onClick={handleLogout} className="navbar-item logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar-item">Login</Link>
            <Link to="/register" className="navbar-item">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 