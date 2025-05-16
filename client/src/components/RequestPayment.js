import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/RequestPayment.css';

const RequestPayment = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    receiverAccountNumber: '',
    amount: '',
    note: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post('/api/requests', formData);
      setSuccess('Payment request sent successfully!');
      setFormData({
        receiverAccountNumber: '',
        amount: '',
        note: ''
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Error sending payment request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-page-wrap">
      <svg className="main-side-svg left" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#e3eafc" fillOpacity="0.35"/>
      </svg>
      <svg className="main-side-svg right" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#b6d0ff" fillOpacity="0.25"/>
      </svg>
      <div className="request-payment-container">
        <h2>Request Payment</h2>
        <form onSubmit={handleSubmit} className="request-payment-form">
          <div className="form-group">
            <label htmlFor="receiverAccountNumber">Receiver's Account Number</label>
            <input
              type="text"
              id="receiverAccountNumber"
              name="receiverAccountNumber"
              value={formData.receiverAccountNumber}
              onChange={handleChange}
              required
              placeholder="Enter account number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              placeholder="Enter amount"
            />
          </div>

          <div className="form-group">
            <label htmlFor="note">Note (Optional)</label>
            <textarea
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Add a note for the receiver"
              maxLength="200"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </form>
      </div>
      <svg className="main-bg-svg bottom-fixed" width="100%" height="120" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C480,160 960,0 1440,80 L1440,120 L0,120 Z" fill="#e3eafc"/>
      </svg>
    </div>
  );
};

export default RequestPayment; 