import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Transactions.css';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get('/api/accounts/transactions');
        setTransactions(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch transactions');
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="main-page-wrap">
      <svg className="main-side-svg left" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#e3eafc" fillOpacity="0.35"/>
      </svg>
      <svg className="main-side-svg right" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#b6d0ff" fillOpacity="0.25"/>
      </svg>
      <div className="main-card transactions-wide">
        <h2>Transaction History</h2>
        <div className="transaction-list">
          {transactions.length === 0 ? (
            <p>No transactions found</p>
          ) : (
            transactions.map((transaction) => {
              const isSender = transaction.sender._id === user._id;
              const isReceiver = transaction.receiver._id === user._id;
              const amount = parseFloat(transaction.amount).toFixed(2);

              // Determine sign, color, and icon
              let sign = '';
              let amountClass = '';
              let icon = '';
              let badgeClass = '';
              if (transaction.type === 'deposit' && isReceiver) {
                sign = '+';
                amountClass = 'amount-positive';
                icon = '↑';
                badgeClass = 'deposit';
              } else if (transaction.type === 'withdraw' && isSender) {
                sign = '-';
                amountClass = 'amount-negative';
                icon = '↓';
                badgeClass = 'withdraw';
              } else if (transaction.type === 'transfer') {
                icon = '↔';
                badgeClass = 'transfer';
                if (isSender) {
                  sign = '-';
                  amountClass = 'amount-negative';
                } else if (isReceiver) {
                  sign = '+';
                  amountClass = 'amount-positive';
                }
              }

              // Avoid duplicate To/From if sender and receiver are the same
              const showTo = isSender && transaction.receiver._id !== transaction.sender._id;
              const showFrom = isReceiver && transaction.sender._id !== transaction.receiver._id;

              return (
                <div key={transaction._id} className="transaction-card modern">
                  <div className="transaction-type-badge-wrapper">
                    <span className={`transaction-type-badge ${badgeClass}`}>{icon}</span>
                  </div>
                  <div className="transaction-details modern">
                    <div><span className="transaction-label">Type:</span> <span className="transaction-value">{transaction.type}</span></div>
                    <div><span className="transaction-label">Date:</span> <span className="transaction-value">{new Date(transaction.createdAt).toLocaleString()}</span></div>
                    {showTo && (
                      <div><span className="transaction-label">To:</span> <span className="transaction-value">{transaction.receiver.accountNumber}</span></div>
                    )}
                    {showFrom && (
                      <div><span className="transaction-label">From:</span> <span className="transaction-value">{transaction.sender.accountNumber}</span></div>
                    )}
                  </div>
                  <div className={`transaction-amount modern ${amountClass}`}>
                    {sign}<span className="transaction-amount-value">₹{amount}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="main-badge">
          <span className="main-badge-inner">
            <span className="main-badge-icon" role="img" aria-label="shield">🛡️</span>
            Secure History
          </span>
        </div>
      </div>
      <svg className="main-bg-svg" width="100%" height="120" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C480,160 960,0 1440,80 L1440,120 L0,120 Z" fill="#e3eafc"/>
      </svg>
    </div>
  );
};

export default Transactions; 