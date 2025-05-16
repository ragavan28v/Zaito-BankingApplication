import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/TransactionNotes.css';

const TransactionNotes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [note, setNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTransactions();
  }, [dateRange]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('/api/transactions/mini-statement', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      setTransactions(response.data);
    } catch (error) {
      setError('Error fetching transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedTransaction || !note.trim()) return;

    try {
      await axios.post(`/api/transactions/${selectedTransaction._id}/notes`, { note });
      setTransactions(transactions.map(t => 
        t._id === selectedTransaction._id 
          ? { ...t, note: note }
          : t
      ));
      setShowNoteModal(false);
      setNote('');
      setSelectedTransaction(null);
    } catch (error) {
      setError('Error adding note');
    }
  };

  const handleDateRangeChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTransactionType = (transaction) => {
    if (transaction.type === 'transfer' && transaction.sender === user.accountNumber) {
      return 'Sent';
    } else if (transaction.type === 'transfer' && transaction.receiver === user.accountNumber) {
      return 'Received';
    }
    return transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
  };

  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!Array.isArray(transactions)) {
    return <div className="error-message">No transactions found.</div>;
  }

  return (
    <div className="transaction-notes-container">
      <div className="transaction-notes-header">
        <h2>Transaction Notes & Mini-Statement</h2>
        <div className="date-range-selector">
          <input
            type="date"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateRangeChange}
            max={dateRange.endDate}
          />
          <span>to</span>
          <input
            type="date"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateRangeChange}
            min={dateRange.startDate}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="transactions-list">
        {Array.isArray(transactions) && transactions.map((transaction) => (
          <div key={transaction._id} className="transaction-card">
            <div className="transaction-info">
              <div className="transaction-header">
                <span className="transaction-type">
                  {getTransactionType(transaction)}
                </span>
                <span className="transaction-date">
                  {new Date(transaction.date).toLocaleDateString()}
                </span>
              </div>
              <div className="transaction-details">
                <span className="transaction-amount">
                  {formatAmount(transaction.amount)}
                </span>
                <span className="transaction-description">
                  {transaction.description}
                </span>
              </div>
              {transaction.note && (
                <div className="transaction-note">
                  <strong>Note:</strong> {transaction.note}
                </div>
              )}
            </div>
            <button
              className="add-note-button"
              onClick={() => {
                setSelectedTransaction(transaction);
                setNote(transaction.note || '');
                setShowNoteModal(true);
              }}
            >
              {transaction.note ? 'Edit Note' : 'Add Note'}
            </button>
          </div>
        ))}
      </div>

      {showNoteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Note</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter your note here..."
              rows="4"
            />
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => {
                  setShowNoteModal(false);
                  setNote('');
                  setSelectedTransaction(null);
                }}
              >
                Cancel
              </button>
              <button
                className="save-button"
                onClick={handleAddNote}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionNotes; 