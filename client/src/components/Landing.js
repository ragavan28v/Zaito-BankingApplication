import React from 'react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="main-page-wrap form-page">
      <svg className="main-side-svg left" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#e3eafc" fillOpacity="0.35"/>
      </svg>
      <svg className="main-side-svg right" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#b6d0ff" fillOpacity="0.25"/>
      </svg>
      <div className="main-card landing-card">
        <h2>Welcome to Zaito</h2>
        <p>
          Experience seamless, secure, and modern banking.<br />
          Manage your account, transfer funds, and view transactions with ease.<br />
          <span className="landing-highlight">Your money, your control.</span>
        </p>
        <div className="landing-btn-group">
          <Link to="/login" className="btn-badge">Login</Link>
          <Link to="/register" className="btn-badge btn-badge-alt">Register</Link>
        </div>
        <div className="landing-desc">
          Secure. Fast. User-friendly.<br />
          <span role="img" aria-label="bank">🏦</span>
        </div>
      </div>
      <svg className="main-bg-svg bottom-fixed" width="100%" height="120" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C480,160 960,0 1440,80 L1440,120 L0,120 Z" fill="#e3eafc"/>
      </svg>
    </div>
  );
};

export default Landing; 