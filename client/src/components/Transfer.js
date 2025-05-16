import React, { useState } from 'react';
import axios from '../config/axios';
import { useNavigate } from 'react-router-dom';
import '../styles/Transfer.css';

const Transfer = () => {
  const [formData, setFormData] = useState({
    receiverAccountNumber: '',
    amount: '',
    pin: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!/^[0-9]{4}$/.test(formData.pin)) {
      setError('Please enter a valid 4-digit PIN');
      return;
    }
    try {
      const response = await axios.post('/api/accounts/transfer', {
        receiverAccountNumber: formData.receiverAccountNumber,
        amount: parseFloat(formData.amount),
        pin: formData.pin,
      });
      setSuccess('Transfer successful!');
      setFormData({ receiverAccountNumber: '', amount: '', pin: '' });
      setTimeout(() => { navigate('/transactions'); }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred during transfer');
    }
  };

  return (
    <div className="main-page-wrap form-page">
      <svg className="main-side-svg left" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#e3eafc" fillOpacity="0.35"/>
      </svg>
      <svg className="main-side-svg right" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#b6d0ff" fillOpacity="0.25"/>
      </svg>
      <div className="main-card">
        <h2>Transfer Money</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="receiverAccountNumber" className="form-label">
              Receiver Account Number
            </label>
            <input
              type="text"
              id="receiverAccountNumber"
              name="receiverAccountNumber"
              className="form-input"
              value={formData.receiverAccountNumber}
              onChange={handleChange}
              required
              placeholder="Enter receiver's account number"
            />
          </div>
          <div className="form-group">
            <label htmlFor="amount" className="form-label">
              Amount (₹)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              className="form-input"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              placeholder="Enter amount to transfer"
            />
          </div>
          <div className="form-group">
            <label htmlFor="pin" className="form-label">
              4-digit PIN
            </label>
            <input
              type="password"
              id="pin"
              name="pin"
              className="form-input"
              value={formData.pin}
              onChange={handleChange}
              required
              pattern="[0-9]{4}"
              maxLength={4}
              inputMode="numeric"
              placeholder="Enter your 4-digit PIN"
            />
          </div>
          <button type="submit" className="btn-badge btn-block">
            Transfer
          </button>
        </form>
      </div>
      <svg className="main-bg-svg bottom-fixed" width="100%" height="120" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C480,160 960,0 1440,80 L1440,120 L0,120 Z" fill="#e3eafc"/>
      </svg>
    </div>
  );
};

export default Transfer; 