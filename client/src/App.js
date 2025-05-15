import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Transfer from './components/Transfer';
import Transactions from './components/Transactions';
import Deposit from './components/Deposit';
import Withdraw from './components/Withdraw';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Landing from './components/Landing';
import Settings from './components/Settings';
import './styles/main.css';

function AppContent() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarToggle = () => setSidebarOpen((open) => !open);
  const handleSidebarClose = () => setSidebarOpen(false);

  if (loading) return null;
  return (
    <>
      {user && (
        <>
          {isMobile && !sidebarOpen && (
            <button
              className="sidebar-toggle-btn"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              onClick={handleSidebarToggle}
              style={{ position: 'fixed', top: 18, left: 18, zIndex: 400 }}
            >
              <span style={{ fontSize: 24 }}>&#9776;</span>
            </button>
          )}
          {isMobile && sidebarOpen && (
            <div
              className={`sidebar-mobile-backdrop open`}
              onClick={handleSidebarClose}
              tabIndex={-1}
              aria-label="Close sidebar"
              style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(44,62,80,0.13)', zIndex: 350 }}
            />
          )}
          {(sidebarOpen && isMobile) || !isMobile ? (
            <Sidebar
              mobileOverlay={isMobile}
              open={sidebarOpen || !isMobile}
              onClose={handleSidebarClose}
            />
          ) : null}
        </>
      )}
      {user ? (
        <div className="main-content">
          <div className="App">
            <div className="container">
              <Routes>
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/transfer" element={<PrivateRoute><Transfer /></PrivateRoute>} />
                <Route path="/deposit" element={<PrivateRoute><Deposit /></PrivateRoute>} />
                <Route path="/withdraw" element={<PrivateRoute><Withdraw /></PrivateRoute>} />
                <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
