import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { 
  Radio, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  AlertCircle,
  Play,
  Pause,
  Send,
  Zap,
  Tag
} from 'lucide-react';

export default function TodayAttendance({ onShowToast }) {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());
  const [countdown, setCountdown] = useState(5);
  const [testUid, setTestUid] = useState('');
  const [simulating, setSimulating] = useState(false);
  
  // Previous count to detect new scans
  const prevCountRef = useRef(0);

  const fetchTodayData = async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const res = await api.getAttendance(); // defaults to today
      if (res.success) {
        setAttendances(res.data);
        setLastRefreshedAt(new Date());
        
        // Notify if a new scan arrived while auto-refreshing
        if (!isManual && res.data.length > prevCountRef.current && prevCountRef.current > 0) {
          const newest = res.data[0];
          onShowToast?.({
            type: 'success',
            title: 'New Scan Detected!',
            message: `${newest.student?.name || 'Student'} marked attendance at ${newest.time}`,
          });
        }
        prevCountRef.current = res.data.length;
      }
    } catch (err) {
      console.error('Failed to load today attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayData(true);
  }, []);

  // 5-second interval auto-refresh as required in plan.md Section 10
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchTodayData(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh]);

  const handleSimulateScan = async (uidToScan) => {
    const uid = (uidToScan || testUid).trim().toUpperCase();
    if (!uid) {
      onShowToast?.({ type: 'error', title: 'UID Required', message: 'Enter a valid RFID UID' });
      return;
    }

    setSimulating(true);
    try {
      const res = await api.simulateScan(uid);
      if (res.status === 'marked') {
        onShowToast?.({
          type: 'success',
          title: 'Card Marked',
          message: `${res.name} (${res.rollNo}) recorded successfully!`,
        });
        fetchTodayData(false);
      } else if (res.status === 'duplicate') {
        onShowToast?.({
          type: 'info',
          title: 'Already Marked',
          message: `${res.name} (${res.rollNo}) already marked for today.`,
        });
      }
      setTestUid('');
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 404) {
        onShowToast?.({
          type: 'error',
          title: 'Unknown Card (404)',
          message: `UID ${uid} is unregistered. Go to "Students" to assign it.`,
        });
      } else if (err.response?.status === 401) {
        onShowToast?.({
          type: 'error',
          title: 'Unauthorized (401)',
          message: 'Invalid Device Key.',
        });
      } else {
        onShowToast?.({
          type: 'error',
          title: 'Connection Error',
          message: err.message || 'Cannot reach server',
        });
      }
    } finally {
      setSimulating(false);
    }
  };

  const todayDateString = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Radio style={{ color: 'var(--accent-blue)' }} size={28} />
            Today's Live Attendance
          </h1>
          <p className="page-subtitle">
            {todayDateString} &bull; Real-time feed from NodeMCU ESP8266
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className={`btn ${autoRefresh ? 'btn-emerald' : 'btn-secondary'}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? "Pause 5-second polling" : "Resume 5-second polling"}
          >
            {autoRefresh ? (
              <>
                <Pause size={16} />
                <span>Auto-refresh ({countdown}s)</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Auto-refresh Paused</span>
              </>
            )}
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={() => { fetchTodayData(true); setCountdown(5); }}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'pulse-dot' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{attendances.length}</div>
            <div className="stat-label">Students Present Today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {attendances.length > 0 ? attendances[0].time : '--:--'}
            </div>
            <div className="stat-label">Latest Scan Time</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa' }}>
            <Zap size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: '1.25rem', color: '#a78bfa' }}>
              Live Polling
            </div>
            <div className="stat-label">
              Updated {lastRefreshedAt.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Attendance Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
            Scanned Records ({attendances.length})
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Auto-synced with MongoDB
          </span>
        </div>

        {attendances.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Radio size={28} />
            </div>
            <div className="empty-state-title">No Scans Recorded Yet Today</div>
            <p className="empty-state-text">
              Tap an RFID card on the NodeMCU reader, or use the Simulator below to test the end-to-end flow.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Card UID</th>
                  <th>Scan Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map((item, index) => (
                  <tr key={item._id || index}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{index + 1}</td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>
                      {item.student?.name || 'Unknown Student'}
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#93c5fd', fontWeight: 500 }}>
                        {item.student?.rollNo || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="badge-uid">
                        {item.student?.cardUid || 'N/A'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                        {item.time}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-present">
                        <CheckCircle2 size={13} />
                        Present
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RFID Hardware Simulator (For Testing and Instant Demo) */}
      <div className="simulator-drawer">
        <div className="simulator-header">
          <div className="simulator-title">
            <Zap size={16} />
            <span>Hardware Simulation & Quick Test</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Simulates NodeMCU HTTP POST to /api/scan
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flex: '1', minWidth: '260px' }}>
            <input
              type="text"
              className="input-control mono"
              placeholder="Enter Card UID (e.g. A1B2C3D4)"
              value={testUid}
              onChange={(e) => setTestUid(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSimulateScan()}
            />
            <button
              className="btn btn-primary"
              onClick={() => handleSimulateScan()}
              disabled={simulating || !testUid.trim()}
            >
              <Send size={15} />
              <span>Simulate Scan</span>
            </button>
          </div>

          {/* Quick preset cards */}
          <div className="simulator-pills">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presets:</span>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => handleSimulateScan('A1B2C3D4')}
            >
              <Tag size={12} /> Rahul (A1B2C3D4)
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => handleSimulateScan('E5F6A7B8')}
            >
              <Tag size={12} /> Priya (E5F6A7B8)
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => handleSimulateScan('99887766')}
            >
              <Tag size={12} /> Amit (99887766)
            </button>
            <button
              className="btn btn-amber"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
              onClick={() => handleSimulateScan('UNKNOWN_CARD_99')}
              title="Test unknown card scan (should trigger 404 and store UID)"
            >
              <AlertCircle size={12} /> Unknown Test Card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
