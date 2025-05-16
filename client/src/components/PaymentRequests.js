import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/PaymentRequests.css';

const PaymentRequests = () => {
  const { user } = useAuth();
  const myId = user._id || user.id;
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axios.get('/api/requests');
      setRequests(response.data);
    } catch (error) {
      setError('Error fetching payment requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request) => {
    setSelectedRequest(request);
    setShowPinModal(true);
  };

  const handleDecline = async (requestId) => {
    try {
      await axios.put(`/api/requests/${requestId}/decline`);
      fetchRequests();
    } catch (error) {
      setError('Error declining payment request');
    }
  };

  const handlePinSubmit = async () => {
    if (!selectedRequest) return;

    try {
      await axios.put(`/api/requests/${selectedRequest._id}/accept`, { pin });
      setShowPinModal(false);
      setPin('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      setError(error.response?.data?.message || 'Error accepting payment request');
    }
  };

  const getId = (user) => (typeof user === 'object' && user !== null ? user._id : user);

  if (loading) {
    return <div className="loading">Loading payment requests...</div>;
  }

  return (
    <div className="main-page-wrap">
      <svg className="main-side-svg left" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#e3eafc" fillOpacity="0.35"/>
      </svg>
      <svg className="main-side-svg right" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#b6d0ff" fillOpacity="0.25"/>
      </svg>
      <div className="payment-requests-container">
        <h2>Payment Requests</h2>
        {error && <div className="error-message">{error}</div>}

        {requests.length === 0 ? (
          <p className="no-requests">No payment requests found</p>
        ) : (
          <div className="requests-list">
            {requests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-header">
                  <span className="request-type">
                    {getId(request.sender) === String(myId) ? 'Sent' : 'Received'}
                  </span>
                  <span className={`request-status ${request.status}`}>
                    {request.status}
                  </span>
                </div>

                <div className="request-details">
                  <div className="account-info">
                    {getId(request.sender) === String(myId) ? (
                      <>
                        <span className="label">To:</span>
                        <span className="value">{request.receiver?.accountNumber || getId(request.receiver)}</span>
                      </>
                    ) : (
                      <>
                        <span className="label">From:</span>
                        <span className="value">{request.sender?.accountNumber || getId(request.sender)}</span>
                      </>
                    )}
                  </div>

                  <div className="amount">
                    <span className="label">Amount:</span>
                    <span className="value">${request.amount.toFixed(2)}</span>
                  </div>

                  {request.note && (
                    <div className="note">
                      <span className="label">Note:</span>
                      <span className="value">{request.note}</span>
                    </div>
                  )}

                  <div className="date">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {request.status === 'pending' && String(request.receiver?._id || request.receiver) === String(myId) && (
                  <div className="request-actions">
                    <button
                      className="accept-button"
                      onClick={() => handleAccept(request)}
                    >
                      Accept
                    </button>
                    <button
                      className="decline-button"
                      onClick={() => handleDecline(request._id)}
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showPinModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Enter PIN to Accept Payment</h3>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
                maxLength="4"
                pattern="[0-9]*"
                inputMode="numeric"
              />
              <div className="modal-actions">
                <button onClick={handlePinSubmit}>Confirm</button>
                <button onClick={() => {
                  setShowPinModal(false);
                  setPin('');
                  setSelectedRequest(null);
                }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <svg className="main-bg-svg bottom-fixed" width="100%" height="120" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,80 C480,160 960,0 1440,80 L1440,120 L0,120 Z" fill="#e3eafc"/>
      </svg>
    </div>
  );
};

export default PaymentRequests; 