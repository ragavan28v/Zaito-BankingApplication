import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning ☀️';
  if (hour < 18) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
};

const Dashboard = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [balanceAnim, setBalanceAnim] = useState(false);
  const intervalRef = useRef();

  useEffect(() => {
    let interval;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [balRes, txRes] = await Promise.all([
          axios.get('/api/accounts/balance'),
          axios.get('/api/accounts/transactions'),
        ]);
        if (balRes.data.balance !== balance) {
          setBalanceAnim(true);
          setTimeout(() => setBalanceAnim(false), 700);
        }
        setBalance(balRes.data.balance);
        setRecentTransactions(txRes.data.slice(0, 5));
        setError('');
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    interval = setInterval(fetchData, 10000);
    intervalRef.current = interval;
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-bg-wrap">
      <div className="dashboard-welcome">
        <span>{getGreeting()}</span>
      </div>
      <div className="dashboard-cards-wrap">
        <div className="dashboard-modern-v2">
          <div className="dashboard-hero-card">
            <div className="dashboard-hero-row">
              <div className="dashboard-avatar">
                <span role="img" aria-label="avatar">{user?.firstName?.[0]?.toUpperCase() || 'U'}</span>
              </div>
              <div className="dashboard-hero-info">
                <span className="dashboard-hero-label">Available Balance</span>
                <span className={`dashboard-hero-balance${balanceAnim ? ' anim' : ''}`}>₹{balance.toLocaleString()}</span>
                <div className="dashboard-hero-user-details">
                  <span className="dashboard-hero-name">{user?.firstName} {user?.lastName}</span>
                  <span className="dashboard-hero-email">{user?.email}</span>
                  <span className="dashboard-hero-account">{user?.accountNumber} • {user?.accountType || 'Savings'}</span>
                </div>
              </div>
            </div>
            <div className="dashboard-hero-actions">
              <Link to="/deposit" className="dashboard-hero-action-btn"><span className="dashboard-hero-action-icon deposit">↑</span></Link>
              <Link to="/withdraw" className="dashboard-hero-action-btn"><span className="dashboard-hero-action-icon withdraw">↓</span></Link>
              <Link to="/transfer" className="dashboard-hero-action-btn"><span className="dashboard-hero-action-icon transfer">↗</span></Link>
            </div>
            <div className="dashboard-hero-extra">
              <span className="dashboard-hero-badge">
                <span className="dashboard-hero-badge-icon" role="img" aria-label="shield">🛡️</span>
                Bank-level Security
              </span>
            </div>
          </div>
          <div className="dashboard-accent-bar"></div>
          <div className="dashboard-rt-card">
            <div className="dashboard-rt-header">
              <span>Recent Transactions</span>
              <Link to="/transactions" className="dashboard-rt-viewall">View All</Link>
            </div>
            <div className="dashboard-rt-list">
              {recentTransactions.length === 0 ? (
                <div className="dashboard-rt-empty">No recent transactions.</div>
              ) : (
                recentTransactions.map((tx, idx) => {
                  // Color coding logic
                  let amountClass = '';
                  let sign = '';
                  const userId = user?._id;
                  if (tx.type.toLowerCase() === 'deposit' && tx.receiver && tx.receiver._id === userId) {
                    amountClass = 'credit';
                    sign = '+';
                  } else if (tx.type.toLowerCase() === 'withdraw' && tx.sender && tx.sender._id === userId) {
                    amountClass = 'debit';
                    sign = '-';
                  } else if (tx.type.toLowerCase() === 'transfer') {
                    if (tx.sender && tx.sender._id === userId) {
                      amountClass = 'debit';
                      sign = '-';
                    } else if (tx.receiver && tx.receiver._id === userId) {
                      amountClass = 'credit';
                      sign = '+';
                    }
                  }
                  return (
                    <div className="dashboard-rt-item" key={idx}>
                      <span className={`dashboard-rt-type ${tx.type.toLowerCase()}`}>{
                        tx.type === 'Deposit' ? '↑' : tx.type === 'Withdraw' ? '↓' : '↗'
                      }</span>
                      <span className="dashboard-rt-title">{tx.type}</span>
                      <span className="dashboard-rt-date">{tx.date || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : '')}</span>
                      <span className={`dashboard-rt-amount ${amountClass}`}>{sign}₹{tx.amount.toLocaleString()}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <svg className="dashboard-bg-svg" width="100vw" height="220" viewBox="0 0 1440 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,160 C480,240 960,80 1440,160 L1440,220 L0,220 Z" fill="#e3eafc"/>
        </svg>
      </div>
    </div>
  );
};

export default Dashboard; 