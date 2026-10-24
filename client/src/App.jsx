import React, { useState, useEffect } from 'react';
import TodayAttendance from './pages/TodayAttendance';
import Students from './pages/Students';
import History from './pages/History';
import { api } from './api';
import { 
  Radio, 
  Users, 
  Calendar, 
  Wifi, 
  WifiOff, 
  Cpu, 
  CheckCircle2, 
  XCircle, 
  Info,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('today'); // 'today' | 'students' | 'history'
  const [toasts, setToasts] = useState([]);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [serverInfo, setServerInfo] = useState(null);

  // Check backend health periodically
  useEffect(() => {
    const checkServer = async () => {
      try {
        const data = await api.getHealth();
        if (data.status === 'online') {
          setBackendStatus('online');
          setServerInfo(data);
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 10000);
    return () => clearInterval(interval);
  }, []);

  const showToast = ({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="nav-inner">
          <div className="brand-section">
            <div className="brand-icon-box">
              <Cpu size={22} />
            </div>
            <div>
              <div className="brand-title">
                Smart Attendance
                <span className="brand-badge">v1.0 POC</span>
              </div>
              <div className="brand-subtitle">
                NodeMCU ESP8266 + MERN Stack
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="nav-links">
            <button
              className={`nav-item ${currentPage === 'today' ? 'active' : ''}`}
              onClick={() => setCurrentPage('today')}
            >
              <Radio size={16} />
              <span>Today Live</span>
            </button>
            <button
              className={`nav-item ${currentPage === 'students' ? 'active' : ''}`}
              onClick={() => setCurrentPage('students')}
            >
              <Users size={16} />
              <span>Students</span>
            </button>
            <button
              className={`nav-item ${currentPage === 'history' ? 'active' : ''}`}
              onClick={() => setCurrentPage('history')}
            >
              <Calendar size={16} />
              <span>History</span>
            </button>
          </div>

          {/* Connection Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {backendStatus === 'online' ? (
              <div className="nav-status-badge" title="Express Server Connected">
                <span className="pulse-dot"></span>
                <span>Server Online</span>
              </div>
            ) : (
              <div 
                className="nav-status-badge" 
                style={{ 
                  background: 'rgba(244, 63, 94, 0.1)', 
                  color: 'var(--accent-rose)', 
                  borderColor: 'rgba(244, 63, 94, 0.25)' 
                }}
                title="Cannot connect to Express backend at port 5000"
              >
                <WifiOff size={13} />
                <span>Backend Offline</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Page Content */}
      <main className="main-content">
        {currentPage === 'today' && <TodayAttendance onShowToast={showToast} />}
        {currentPage === 'students' && <Students onShowToast={showToast} />}
        {currentPage === 'history' && <History onShowToast={showToast} />}
      </main>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`toast toast-${toast.type}`}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)', flexShrink: 0, marginTop: '2px' }} />}
            {toast.type === 'error' && <XCircle size={18} style={{ color: 'var(--accent-rose)', flexShrink: 0, marginTop: '2px' }} />}
            {toast.type === 'info' && <Info size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '2px' }} />}
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {toast.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
