import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  RefreshCw, 
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';

export default function History({ onShowToast }) {
  // Today's formatted date string YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Present, Absent

  const fetchSummary = async (date) => {
    try {
      setLoading(true);
      const res = await api.getAttendanceSummary(date);
      if (res.success) {
        setSummaryData(res);
      }
    } catch (err) {
      console.error('Error fetching attendance summary:', err);
      onShowToast?.({
        type: 'error',
        title: 'Error',
        message: 'Could not load attendance records for selected date.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(selectedDate);
  }, [selectedDate]);

  const records = summaryData?.records || [];

  const filteredRecords = records.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cardUid.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'Present') return item.status === 'Present';
    if (statusFilter === 'Absent') return item.status === 'Absent';
    return true;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Calendar style={{ color: 'var(--accent-cyan)' }} size={28} />
            Attendance History & Reports
          </h1>
          <p className="page-subtitle">
            View student attendance records, daily roll call, and present/absent statistics
          </p>
        </div>

        {/* Date Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
          <button
            className={`btn ${selectedDate === getTodayStr() ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setSelectedDate(getTodayStr())}
          >
            Today
          </button>
          <button
            className={`btn ${selectedDate === getYesterdayStr() ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => setSelectedDate(getYesterdayStr())}
          >
            Yesterday
          </button>

          <input
            type="date"
            className="input-control"
            style={{ width: 'auto', padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <button
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.85rem' }}
            onClick={() => fetchSummary(selectedDate)}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'pulse-dot' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{summaryData?.totalStudents ?? 0}</div>
            <div className="stat-label">Total Registered Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#34d399' }}>
              {summaryData?.presentCount ?? 0}
            </div>
            <div className="stat-label">Present</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185' }}>
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#fb7185' }}>
              {summaryData?.absentCount ?? 0}
            </div>
            <div className="stat-label">Absent</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ color: '#c084fc' }}>
              {summaryData?.attendancePercentage ?? 0}%
            </div>
            <div className="stat-label">Attendance Rate</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-card">
        {/* Table Filters & Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
              Roll Call for {selectedDate}
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Showing {filteredRecords.length} of {records.length} students
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
              {['ALL', 'Present', 'Absent'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    cursor: 'pointer',
                    background: statusFilter === filter ? 'var(--accent-blue)' : 'transparent',
                    color: statusFilter === filter ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-control"
                placeholder="Search students..."
                style={{ paddingLeft: '32px', fontSize: '0.82rem', paddingBottom: '0.5rem', paddingTop: '0.5rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Calendar size={28} />
            </div>
            <div className="empty-state-title">No Records Found</div>
            <p className="empty-state-text">
              {records.length === 0
                ? 'No students are registered in the system yet.'
                : 'No student matches your current search or status filter.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Card UID</th>
                  <th>Status</th>
                  <th>Time Marked</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((item) => (
                  <tr key={item.studentId}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#93c5fd' }}>
                      {item.rollNo}
                    </td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{item.name}</td>
                    <td>
                      <span className="badge-uid">{item.cardUid}</span>
                    </td>
                    <td>
                      {item.status === 'Present' ? (
                        <span className="badge badge-present">
                          <CheckCircle2 size={13} />
                          Present
                        </span>
                      ) : (
                        <span className="badge badge-absent">
                          <XCircle size={13} />
                          Absent
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {item.time ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#34d399' }}>
                          <Clock size={13} />
                          {item.time}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
