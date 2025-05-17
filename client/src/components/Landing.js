import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';

const features = [
  {
    icon: '⚡',
    title: 'Instant Transfers',
    desc: 'Send and receive money instantly, anytime.'
  },
  {
    icon: '🔒',
    title: 'Secure Login',
    desc: 'Your data is protected with bank-level security.'
  },
  {
    icon: '📊',
    title: 'Analytics',
    desc: 'Track your spending and savings with smart analytics.'
  },
  {
    icon: '🕑',
    title: '24/7 Support',
    desc: "We're here for you, day and night."
  }
];

const Landing = () => {
  return (
    <div className="main-page-wrap form-page landing-enhanced">
      <div className="landing-top-actions">
        <Link to="/login" className="btn-badge landing-btn-main">Login</Link>
        <Link to="/register" className="btn-badge btn-badge-alt landing-btn-main">Register</Link>
      </div>
      <div className="landing-header">
        <div className="landing-header-inner">
          <span className="landing-logo" role="img" aria-label="bank">🏦</span>
          <span className="landing-title">Zaito</span>
        </div>
        <span className="landing-tagline">Modern Banking, Made Simple</span>
      </div>
      <div className="landing-content-wrapper">
        <h2 className="landing-welcome">Welcome to Zaito</h2>
        <p className="landing-intro">
          Experience seamless, secure, and modern banking.<br />
          Manage your account, transfer funds, and view transactions with ease.<br />
          <span className="landing-highlight">Your money, your control.</span>
        </p>
        <div className="landing-features">
          {features.map((f, i) => (
            <div className="landing-feature" key={i}>
              <span className="feature-icon" role="img" aria-label={f.title}>{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
        <div className="landing-trust">
          <span className="trust-badge">Trusted by 1,000+ users</span>
          <span className="trust-quote">"The best banking experience I've ever had!"</span>
        </div>
      </div>
      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Zaito. All rights reserved.</span>
        <span className="footer-links">
          <a href="#about">About</a> | <a href="#contact">Contact</a> | <a href="#help">Help</a>
        </span>
      </footer>
      <svg className="main-bg-svg bottom-fixed" width="100%" height="120" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C480,160 960,0 1440,80 L1440,120 L0,120 Z" fill="#e3eafc"/>
      </svg>
    </div>
  );
};

export default Landing; 