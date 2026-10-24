import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Users, 
  UserPlus, 
  CreditCard, 
  Trash2, 
  Search, 
  Sparkles, 
  RefreshCw,
  Hash,
  User,
  AlertCircle
} from 'lucide-react';

export default function Students({ onShowToast }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Registration Form State
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [cardUid, setCardUid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingUnknown, setFetchingUnknown] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.getStudents();
      if (res.success) {
        setStudents(res.data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      onShowToast?.({
        type: 'error',
        title: 'Error',
        message: 'Failed to load registered students.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // "Use last scanned card" feature from plan.md Section 10
  const handleUseLastScannedCard = async () => {
    setFetchingUnknown(true);
    try {
      const res = await api.getLastUnknownScan();
      if (res.success && res.data?.uid) {
        setCardUid(res.data.uid);
        onShowToast?.({
          type: 'success',
          title: 'Card UID Retrieved',
          message: `Auto-filled card UID: ${res.data.uid}`,
        });
      } else {
        onShowToast?.({
          type: 'info',
          title: 'No Unknown Card Found',
          message: 'Tap an unregistered card on the RFID reader first!',
        });
      }
    } catch (err) {
      console.error('Error fetching last unknown scan:', err);
      onShowToast?.({
        type: 'error',
        title: 'Network Error',
        message: 'Could not fetch last scanned card.',
      });
    } finally {
      setFetchingUnknown(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !rollNo.trim() || !cardUid.trim()) {
      onShowToast?.({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please provide Name, Roll Number, and Card UID.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createStudent({
        name: name.trim(),
        rollNo: rollNo.trim().toUpperCase(),
        cardUid: cardUid.trim().toUpperCase(),
      });

      if (res.success) {
        onShowToast?.({
          type: 'success',
          title: 'Student Registered',
          message: `${res.data.name} (${res.data.rollNo}) has been added successfully!`,
        });
        // Reset form
        setName('');
        setRollNo('');
        setCardUid('');
        fetchStudents();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to register student';
      onShowToast?.({
        type: 'error',
        title: 'Registration Failed',
        message: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, studentName) => {
    if (!window.confirm(`Are you sure you want to remove "${studentName}"?`)) {
      return;
    }

    try {
      const res = await api.deleteStudent(id);
      if (res.success) {
        onShowToast?.({
          type: 'info',
          title: 'Student Removed',
          message: `${studentName} was removed.`,
        });
        fetchStudents();
      }
    } catch (err) {
      console.error('Error deleting student:', err);
      onShowToast?.({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.message || 'Could not delete student.',
      });
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cardUid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users style={{ color: 'var(--accent-purple)' }} size={28} />
            Student Management
          </h1>
          <p className="page-subtitle">
            Register students and link RFID card UIDs to their profiles
          </p>
        </div>

        <button 
          className="btn btn-secondary" 
          onClick={fetchStudents}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'pulse-dot' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Register Student Card */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={18} style={{ color: 'var(--accent-blue)' }} />
            Register Student
          </h2>

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">
                <User size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Student Full Name
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Hash size={13} style={{ display: 'inline', marginRight: '4px' }} />
                Roll Number / ID
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="e.g. CS-101"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">
                  <CreditCard size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  RFID Card UID
                </label>
                <button
                  type="button"
                  onClick={handleUseLastScannedCard}
                  disabled={fetchingUnknown}
                  className="btn btn-emerald"
                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)' }}
                  title="Fills UID from the last card tapped on the reader"
                >
                  <Sparkles size={12} />
                  <span>Use last scanned card</span>
                </button>
              </div>

              <input
                type="text"
                className="input-control mono"
                placeholder="e.g. A1B2C3D4"
                value={cardUid}
                onChange={(e) => setCardUid(e.target.value.toUpperCase())}
                required
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Hexadecimal string from RC522 reader
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={submitting}
            >
              <UserPlus size={16} />
              <span>{submitting ? 'Registering...' : 'Register Student'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Registered Students List */}
        <div className="glass-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                Registered Students ({students.length})
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                All active RFID profiles in database
              </span>
            </div>

            {/* Search Box */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-control"
                placeholder="Search name/roll/UID..."
                style={{ paddingLeft: '32px', fontSize: '0.82rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users size={28} />
              </div>
              <div className="empty-state-title">No Students Found</div>
              <p className="empty-state-text">
                {searchTerm ? 'No student matches your search query.' : 'Register students using the form on the left.'}
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
                    <th>Registered</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#93c5fd' }}>
                        {s.rollNo}
                      </td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{s.name}</td>
                      <td>
                        <span className="badge-uid">{s.cardUid}</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          onClick={() => handleDelete(s._id, s.name)}
                          title="Remove student"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
