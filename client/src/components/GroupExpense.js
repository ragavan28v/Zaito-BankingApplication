import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/GroupExpense.css';

const GroupExpense = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [pin, setPin] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    totalAmount: '',
    splitMethod: 'equal',
    members: [{ accountNumber: '', amount: '' }],
    category: 'other'
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('/api/split/expenses');
      setExpenses(response.data);
    } catch (error) {
      setError('Error fetching group expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...formData.members];
    newMembers[index] = {
      ...newMembers[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      members: newMembers
    }));
  };

  const addMember = () => {
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, { accountNumber: '', amount: '' }]
    }));
  };

  const removeMember = (index) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Ensure all members are unique by account number
    let membersList = [...formData.members];
    if (!membersList.some(m => m.accountNumber === user.accountNumber)) {
      membersList.push({ accountNumber: user.accountNumber, amount: '' });
    }

    // Remove duplicates (just in case)
    membersList = membersList.filter((member, idx, arr) =>
      arr.findIndex(m => m.accountNumber === member.accountNumber) === idx
    );

    if (membersList.length < 2) {
      setError('You must add at least one member other than yourself.');
      return;
    }

    try {
      // Calculate equal split amount if split method is equal
      const equalAmount = formData.splitMethod === 'equal'
        ? Number(formData.totalAmount) / membersList.length
        : null;

      // Look up user IDs for each member by account number
      const memberPromises = membersList.map(async (member) => {
        try {
          const res = await axios.get(`/api/accounts/by-account-number/${member.accountNumber}`);
          if (!res.data.userId) {
            throw new Error();
          }
          return {
            userId: res.data.userId,
            amount: formData.splitMethod === 'equal'
              ? equalAmount
              : Number(member.amount),
            isCreator: member.accountNumber === user.accountNumber
          };
        } catch (err) {
          throw new Error(`Account number ${member.accountNumber} not found.`);
        }
      });

      let membersWithIds;
      try {
        membersWithIds = await Promise.all(memberPromises);
      } catch (lookupError) {
        setError(lookupError.message);
        return;
      }

      // Extra check: ensure all user IDs are present and amounts are valid
      if (membersWithIds.some(m => !m.userId || m.amount <= 0)) {
        setError('One or more account numbers could not be resolved to a user or have invalid amounts.');
        return;
      }

      // Build the payload: creator is marked as paid, others as pending
      const payload = {
        ...formData,
        totalAmount: Number(formData.totalAmount),
        members: membersWithIds.map(m => ({
          user: m.userId,
          amount: m.amount,
          status: m.isCreator ? 'paid' : 'pending'
        }))
      };

      // Submit the group expense
      await axios.post('/api/split/expenses', payload);
      setShowCreateModal(false);
      setFormData({
        title: '',
        totalAmount: '',
        splitMethod: 'equal',
        members: [{ accountNumber: '', amount: '' }],
        category: 'other'
      });
      fetchExpenses();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Error creating group expense');
    }
  };

  const handleSettle = async (expenseId) => {
    try {
      await axios.post(`/api/split/expenses/${expenseId}/settle`);
      fetchExpenses();
    } catch (error) {
      setError('Error settling expense');
    }
  };

  const handlePay = async (expense) => {
    setSelectedExpense(expense);
    setShowPinModal(true);
  };

  const handlePinSubmit = async () => {
    if (!selectedExpense) return;

    try {
      // Find the member entry for the current user
      const memberEntry = selectedExpense.members.find(
        m => m.user._id === user.id
      );

      if (!memberEntry) {
        setError('You are not a member of this expense');
        return;
      }

      await axios.post(`/api/split/expenses/${selectedExpense._id}/pay`, {
        pin,
        amount: memberEntry.amount
      });

      setShowPinModal(false);
      setPin('');
      setSelectedExpense(null);
      fetchExpenses();
    } catch (error) {
      setError(error.response?.data?.message || 'Error processing payment');
    }
  };

  if (loading) {
    return <div className="loading">Loading group expenses...</div>;
  }

  return (
    <div className="main-page-wrap">
      <svg className="main-side-svg left" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#e3eafc" fillOpacity="0.35"/>
      </svg>
      <svg className="main-side-svg right" width="120" height="320" viewBox="0 0 120 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="160" rx="60" ry="160" fill="#b6d0ff" fillOpacity="0.25"/>
      </svg>
      <div className="group-expense-container">
        <div className="group-expense-header">
          <h2>Group Expenses</h2>
          <button 
            className="create-expense-button"
            onClick={() => setShowCreateModal(true)}
          >
            Create New Expense
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="expenses-list">
          {expenses.length === 0 ? (
            <p className="no-expenses">No group expenses found</p>
          ) : (
            expenses.map((expense) => (
              <div key={expense._id} className="expense-card">
                <div className="expense-header">
                  <h3>{expense.title}</h3>
                  <span className={`expense-status ${expense.status}`}>
                    {expense.status}
                  </span>
                </div>

                <div className="expense-details">
                  <div className="amount">
                    <span className="label">Total Amount:</span>
                    <span className="value">${expense.totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="split-method">
                    <span className="label">Split Method:</span>
                    <span className="value">{expense.splitMethod}</span>
                  </div>

                  <div className="category">
                    <span className="label">Category:</span>
                    <span className="value">{expense.category}</span>
                  </div>

                  <div className="members">
                    <span className="label">Members:</span>
                    <div className="members-list">
                      {expense.members.map((member, index) => {
                        const displayStatus = member.status;
                        return (
                          <div key={index} className="member-item">
                            <span>{member.user.accountNumber}</span>
                            <span>${member.amount.toFixed(2)}</span>
                            <span className={`status ${displayStatus}`}>
                              {displayStatus}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="expense-actions">
                  {expense.status === 'active' && expense.creator._id === user.id && (
                    <button
                      className="settle-button"
                      onClick={() => handleSettle(expense._id)}
                    >
                      Settle Expense
                    </button>
                  )}
                  
                  {/* Add payment button for members who haven't paid */}
                  {expense.status === 'active' && 
                   expense.members.some(m => m.user._id === user.id && m.status === 'pending') && (
                    <button
                      className="pay-button"
                      onClick={() => handlePay(expense)}
                    >
                      Pay Your Share
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {showCreateModal && (
          <div
            className="content-modal-overlay"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="content-modal"
              onClick={e => e.stopPropagation()}
            >
              <h3>Create Group Expense</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="title">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="totalAmount">Total Amount</label>
                  <input
                    type="number"
                    id="totalAmount"
                    name="totalAmount"
                    value={formData.totalAmount}
                    onChange={handleChange}
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="splitMethod">Split Method</label>
                  <select
                    id="splitMethod"
                    name="splitMethod"
                    value={formData.splitMethod}
                    onChange={handleChange}
                  >
                    <option value="equal">Equal</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="food">Food</option>
                    <option value="travel">Travel</option>
                    <option value="shopping">Shopping</option>
                    <option value="utilities">Utilities</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="members-section">
                  <label>Members</label>
                  {formData.members.map((member, index) => (
                    <div key={index} className="member-input">
                      <input
                        type="text"
                        placeholder="Account Number"
                        value={member.accountNumber}
                        onChange={(e) => handleMemberChange(index, 'accountNumber', e.target.value)}
                        required
                      />
                      {formData.splitMethod === 'custom' && (
                        <input
                          type="number"
                          placeholder="Amount"
                          value={member.amount}
                          onChange={(e) => handleMemberChange(index, 'amount', e.target.value)}
                          required
                          min="0.01"
                          step="0.01"
                        />
                      )}
                      {index > 0 && (
                        <button
                          type="button"
                          className="remove-member"
                          onClick={() => removeMember(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-member"
                    onClick={addMember}
                  >
                    Add Member
                  </button>
                </div>

                <div className="modal-actions">
                  <button type="submit">Create Expense</button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showPinModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Enter PIN to Confirm Payment</h3>
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
                <button onClick={handlePinSubmit}>Confirm Payment</button>
                <button onClick={() => {
                  setShowPinModal(false);
                  setPin('');
                  setSelectedExpense(null);
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

export default GroupExpense; 