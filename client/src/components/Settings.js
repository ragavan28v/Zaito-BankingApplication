import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isPinSetup = new URLSearchParams(location.search).get('pinSetup') === '1';
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    pin: '',
    newPin: '',
    confirmNewPin: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isPinSetup) {
      setMessage('Please set up your 4-digit PIN to continue using the banking system.');
    }
  }, [isPinSetup]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUserUpdate = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const res = await axios.put('/api/auth/me', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });
      setUser(res.data);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating profile');
    }
  };

  const handlePinUpdate = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    setLoading(true);
    
    if (!/^[0-9]{4}$/.test(formData.newPin)) {
      setError('PIN must be exactly 4 digits');
      setLoading(false);
      return;
    }
    if (formData.newPin !== formData.confirmNewPin) {
      setError('PINs do not match');
      setLoading(false);
      return;
    }
    
    try {
      const endpoint = user.pin ? '/api/auth/pin' : '/api/auth/pin/setup';
      const payload = user.pin 
        ? { pin: formData.newPin, oldPin: formData.pin }
        : { pin: formData.newPin };
      
      console.log('Sending PIN update request:', { endpoint, payload });
      const response = await axios.put(endpoint, payload);
      console.log('PIN update response:', response.data);
      
      // Update user state with the response data
      if (response.data.user) {
        setUser(response.data.user);
        setMessage(response.data.message || 'PIN updated successfully!');
        setFormData({ ...formData, pin: '', newPin: '', confirmNewPin: '' });
        
        // If this was a PIN setup, redirect to dashboard after a short delay
        if (isPinSetup) {
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      } else {
        throw new Error('No user data in response');
      }
    } catch (err) {
      console.error('PIN update error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        endpoint: user.pin ? '/api/auth/pin' : '/api/auth/pin/setup'
      });
      setError(err.response?.data?.message || 'Error updating PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-page-wrap form-page">
      <div className="main-card" style={{ maxWidth: 420 }}>
        <h2>Settings</h2>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
        
        {!isPinSetup && (
          <form onSubmit={handleUserUpdate} style={{ marginBottom: 24 }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" name="firstName" className="form-input" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" name="lastName" className="form-input" value={formData.lastName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn-badge btn-block">Update Profile</button>
          </form>
        )}
        
        <form onSubmit={handlePinUpdate}>
          <h3 style={{ marginBottom: 16 }}>{user.pin ? 'Change PIN' : 'Set Up PIN'}</h3>
          {user.pin && (
            <div className="form-group">
              <label className="form-label">Current PIN</label>
              <input 
                type="password" 
                name="pin" 
                className="form-input" 
                value={formData.pin} 
                onChange={handleChange} 
                maxLength={4} 
                inputMode="numeric" 
                placeholder="Enter current PIN" 
                required
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{user.pin ? 'New PIN' : 'PIN'}</label>
            <input 
              type="password" 
              name="newPin" 
              className="form-input" 
              value={formData.newPin} 
              onChange={handleChange} 
              required 
              maxLength={4} 
              inputMode="numeric" 
              placeholder={`Enter ${user.pin ? 'new' : ''} 4-digit PIN`} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm {user.pin ? 'New ' : ''}PIN</label>
            <input 
              type="password" 
              name="confirmNewPin" 
              className="form-input" 
              value={formData.confirmNewPin} 
              onChange={handleChange} 
              required 
              maxLength={4} 
              inputMode="numeric" 
              placeholder={`Confirm ${user.pin ? 'new' : ''} PIN`} 
            />
          </div>
          <button type="submit" className="btn-badge btn-block" disabled={loading}>
            {loading ? 'Processing...' : (user.pin ? 'Update PIN' : 'Set PIN')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings; 