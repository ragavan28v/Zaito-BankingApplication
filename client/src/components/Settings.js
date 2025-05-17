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
    // If user already has a PIN and is trying to access PIN setup, redirect to dashboard
    if (isPinSetup && user?.pin) {
      navigate('/dashboard', { replace: true });
    } else if (isPinSetup) {
      setMessage('Please set up your 4-digit PIN to continue using the banking system.');
    }
  }, [isPinSetup, user?.pin, navigate]);

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
        // First update the user state
        await setUser(response.data.user);
        setMessage(response.data.message || 'PIN updated successfully!');
        setFormData({ ...formData, pin: '', newPin: '', confirmNewPin: '' });
        
        // If this was a PIN setup, wait for state to update before redirecting
        if (isPinSetup) {
          // Add a small delay to ensure state updates are processed
          await new Promise(resolve => setTimeout(resolve, 100));
          navigate('/dashboard', { replace: true });
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

  // If user has a PIN and is in PIN setup mode, don't render the form
  if (user?.pin && isPinSetup) {
    return null;
  }

  return (
    <div className="main-page-wrap form-page">
      <svg className="main-side-svg left" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#e3eafc" fillOpacity="0.35"/>
      </svg>
      <svg className="main-side-svg right" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#b6d0ff" fillOpacity="0.25"/>
      </svg>
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
        
        {(!user?.pin || !isPinSetup) && (
          <form onSubmit={handlePinUpdate}>
            <h3 style={{ marginBottom: 16 }}>{user?.pin ? 'Change PIN' : 'Set Up PIN'}</h3>
            {user?.pin && (
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
              <label className="form-label">{user?.pin ? 'New PIN' : 'PIN'}</label>
              <input 
                type="password" 
                name="newPin" 
                className="form-input" 
                value={formData.newPin} 
                onChange={handleChange} 
                required 
                maxLength={4} 
                inputMode="numeric" 
                placeholder={`Enter ${user?.pin ? 'new' : ''} 4-digit PIN`} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm {user?.pin ? 'New ' : ''}PIN</label>
              <input 
                type="password" 
                name="confirmNewPin" 
                className="form-input" 
                value={formData.confirmNewPin} 
                onChange={handleChange} 
                required 
                maxLength={4} 
                inputMode="numeric" 
                placeholder={`Confirm ${user?.pin ? 'new' : ''} PIN`} 
              />
            </div>
            <button type="submit" className="btn-badge btn-block" disabled={loading}>
              {loading ? 'Processing...' : (user?.pin ? 'Update PIN' : 'Set PIN')}
            </button>
          </form>
        )}
      </div>
      <svg className="main-bg-svg bottom-fixed" width="100%" height="120" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C480,160 960,0 1440,80 L1440,120 L0,120 Z" fill="#e3eafc"/>
      </svg>
    </div>
  );
};

export default Settings; 