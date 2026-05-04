import React, { useState, useEffect, useCallback } from 'react';
import { Hospital, Mail, Phone, MapPin, User, AlertCircle, Activity, Users, Calendar, Bed, Stethoscope, 
  PlusCircle, Check, X, ClipboardList, RefreshCw, Trash2, KeyRound } from 'lucide-react';
import './HospitalDashboard.css';

const API = 'http://localhost:5000/api/auth/hospital';

const SPECIALIZATIONS = [
  "Cardiologist","Dermatologist","Endocrinologist","Gastroenterologist", "General Physician",
  "Gynecologist","Nephrologist","Neurologist","Orthopedic Surgeon", "Otolaryngologist (ENT)",
  "Pediatrician","Psychiatrist","General Surgeon","Urologist","Dentist","Physiotherapist"
];

const HospitalDashboard = () => {
  const [hospitalData, setHospitalData]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [activeTab, setActiveTab]         = useState('overview');
  const [editMode, setEditMode]           = useState(false);
  const [editedStats, setEditedStats]     = useState({});
  const [doctors, setDoctors]             = useState([]);
  const [newDoctor, setNewDoctor]         = useState({ name: '', specialization: '', username: '', password: '' });
  const [specSuggestions, setSpecSuggestions] = useState([]);
  const [showLoginFields, setShowLoginFields] = useState(false);
  const [appointments, setAppointments]   = useState([]);
  const [appointmentMsg, setAppointmentMsg] = useState('');
  const [queue, setQueue]                 = useState([]);
  const [newQueueEntry, setNewQueueEntry] = useState({ patientName: '', patientPhone: '', doctorName: '' });
  const [queueMsg, setQueueMsg]           = useState('');
  const [saveLoading, setSaveLoading]     = useState(false);

  const token = () => localStorage.getItem('hospitalToken');

  const authHeaders = (extra = {}) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token()}`,
    ...extra
  });

  const fetchHospitalData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/dashboard`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch hospital data');
      const data = await res.json();
      setHospitalData(data);
      setEditedStats({
        totalPatients: data.totalPatients,
        appointmentsToday: data.appointmentsToday,
        availableBeds: data.availableBeds,
        totalBeds: data.totalBeds || 0,
        doctorsOnDuty: data.doctorsOnDuty
      });
      setDoctors(data.doctors || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch(`${API}/appointments`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch appointments');
      setAppointments(await res.json());
    } catch (err) {
      setError(err.message);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchQueue = useCallback(async () => {
    if (!hospitalData?._id) return;
    try {
      const res = await fetch(`${API}/queue/${hospitalData._id}`);
      if (!res.ok) throw new Error('Failed to fetch queue');
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (err) {
      setError(err.message);
    }
  }, [hospitalData?._id]);

  useEffect(() => { fetchHospitalData(); fetchAppointments(); }, [fetchHospitalData, fetchAppointments]);
  useEffect(() => { if (activeTab === 'queue') fetchQueue(); }, [activeTab, fetchQueue]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const handleSaveStats = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch(`${API}/update-stats`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(editedStats)
      });
      if (!res.ok) throw new Error('Failed to update stats');
      const updated = await res.json();
      setHospitalData(updated);
      setEditMode(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Doctors ───────────────────────────────────────────────────────────────
  const handleSpecializationChange = (value) => {
    setNewDoctor(p => ({ ...p, specialization: value }));
    if (value.length > 0) {
      setSpecSuggestions(SPECIALIZATIONS.filter(s => s.toLowerCase().includes(value.toLowerCase())));
    } else {
      setSpecSuggestions([]);
    }
  };

  const handleAddDoctor = async () => {
    if (!newDoctor.name || !newDoctor.specialization) {
      setError('Doctor name and specialization are required'); return;
    }
    if (showLoginFields && (!newDoctor.username || !newDoctor.password)) {
      setError('Username and password are required when enabling doctor login'); return;
    }
    try {
      const endpoint = showLoginFields ? `${API}/add-doctor-with-login` : `${API}/add-doctor`;
      const body = showLoginFields
        ? { name: newDoctor.name, specialization: newDoctor.specialization, username: newDoctor.username, password: newDoctor.password }
        : { name: newDoctor.name, specialization: newDoctor.specialization };
      const res = await fetch(endpoint, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body)
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed to add doctor'); }
      const updated = await res.json();
      setDoctors(updated.doctors);
      setNewDoctor({ name: '', specialization: '', username: '', password: '' });
      setSpecSuggestions([]);
      setShowLoginFields(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveDoctor = async (doctorId) => {
    if (!window.confirm('Remove this doctor?')) return;
    try {
      const res = await fetch(`${API}/remove-doctor/${doctorId}`, {
        method: 'DELETE', headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to remove doctor');
      const updated = await res.json();
      setDoctors(updated.doctors);
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Appointments ──────────────────────────────────────────────────────────
  const handleAppointmentAction = async (id, action) => {
    try {
      const res = await fetch(`${API}/appointments/${id}/${action}`, {
        method: 'PUT', headers: authHeaders()
      });
      if (!res.ok) throw new Error(`Failed to ${action} appointment`);
      setAppointmentMsg(`Appointment ${action === 'accept' ? 'Accepted ✓' : 'Denied ✗'}`);
      setTimeout(() => setAppointmentMsg(''), 3000);
      fetchAppointments();
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Queue ─────────────────────────────────────────────────────────────────
  const handleAddToQueue = async () => {
    if (!newQueueEntry.patientName || !newQueueEntry.doctorName) {
      setError('Patient name and doctor name are required'); return;
    }
    try {
      const res = await fetch(`${API}/queue/add`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newQueueEntry)
      });
      if (!res.ok) throw new Error('Failed to add to queue');
      const data = await res.json();
      setQueue(data.queue);
      setQueueMsg(`Token #${data.tokenNumber} issued to ${newQueueEntry.patientName}`);
      setTimeout(() => setQueueMsg(''), 4000);
      setNewQueueEntry({ patientName: '', patientPhone: '', doctorName: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQueueStatusChange = async (entryId, status) => {
    try {
      const res = await fetch(`${API}/queue/${entryId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update queue entry');
      const data = await res.json();
      setQueue(data.queue);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveFromQueue = async (entryId) => {
    try {
      const res = await fetch(`${API}/queue/${entryId}`, {
        method: 'DELETE', headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to remove queue entry');
      const data = await res.json();
      setQueue(data.queue);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearQueue = async () => {
    if (!window.confirm('Clear all Done/Skipped entries?')) return;
    try {
      const res = await fetch(`${API}/queue-clear`, {
        method: 'DELETE', headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to clear queue');
      const data = await res.json();
      setQueue(data.queue);
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Status badge colour ───────────────────────────────────────────────────
  const queueStatusColor = { Waiting: '#f57f17', 'In Progress': '#1565c0', Done: '#2e7d32', Skipped: '#888' };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) return <div className="hd-loading"><div className="hd-spinner"></div><p>Loading…</p></div>;

  if (!hospitalData || !hospitalData.accepted) {
    return (
      <div className="hd-pending">
        <AlertCircle size={64} color="#4a90e2" />
        <h2>Application Pending</h2>
        <p>Our team will review your registration and contact you shortly.<br />We are eager to have you on board!</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview',      label: 'Overview',      icon: <Activity size={16} /> },
    { id: 'doctors',       label: 'Doctors',        icon: <Stethoscope size={16} /> },
    { id: 'appointments',  label: 'Appointments',   icon: <Calendar size={16} /> },
    { id: 'queue',         label: 'Queue',          icon: <ClipboardList size={16} /> },
    { id: 'beds',          label: 'Bed Availability', icon: <Bed size={16} /> },
  ];

  return (
    <div className="hd-container">
    <br/>
      <div className="hd-header">
        <div>
          <h1 className="hd-title">Welcome, {hospitalData.hospitalName}</h1>
          <p className="hd-subtitle">{hospitalData.city}, {hospitalData.state}</p>
        </div>
        <div className="hd-header-badge">✓ Approved</div>
      </div>

      {error && (
        <div className="hd-error-banner">
          ⚠ {error}
          <button onClick={() => setError(null)} className="hd-error-close">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="hd-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`hd-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="hd-content">
          {/* Hospital Info */}
          <div className="hd-card">
            <h2 className="hd-card-title">Hospital Information</h2>
            {[
              { icon: <Hospital size={18} />, val: hospitalData.hospitalName },
              { icon: <Mail size={18} />,     val: hospitalData.email },
              { icon: <Phone size={18} />,    val: hospitalData.phone },
              { icon: <MapPin size={18} />,   val: `${hospitalData.address}, ${hospitalData.city}, ${hospitalData.state}` },
              { icon: <User size={18} />,     val: `Admin: ${hospitalData.adminName}` },
            ].map((item, i) => (
              <div key={i} className="hd-info-item">
                <span className="hd-info-icon">{item.icon}</span>
                <span>{item.val}</span>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="hd-card">
            <div className="hd-card-title-row">
              <h2 className="hd-card-title">Quick Stats</h2>
              <div className="hd-stat-btns">
                <button className="hd-btn hd-btn-outline" onClick={() => setEditMode(!editMode)}>
                  {editMode ? 'Cancel' : 'Edit Stats'}
                </button>
                {editMode && (
                  <button className="hd-btn hd-btn-primary" onClick={handleSaveStats} disabled={saveLoading}>
                    {saveLoading ? 'Saving…' : 'Save'}
                  </button>
                )}
              </div>
            </div>
            <div className="hd-stat-grid">
              {[
                { key: 'totalPatients',     label: 'Total Patients',     icon: <Users size={22} color="#4a90e2" /> },
                { key: 'appointmentsToday', label: 'Appointments Today', icon: <Calendar size={22} color="#27ae60" /> },
                { key: 'availableBeds',     label: 'Available Beds',     icon: <Bed size={22} color="#e67e22" /> },
                { key: 'totalBeds',         label: 'Total Beds',         icon: <Bed size={22} color="#8e44ad" /> },
                { key: 'doctorsOnDuty',     label: 'Doctors On Duty',    icon: <Stethoscope size={22} color="#e74c3c" /> },
              ].map(s => (
                <div key={s.key} className="hd-stat-item">
                  {s.icon}
                  <p className="hd-stat-label">{s.label}</p>
                  {editMode ? (
                    <input
                      className="hd-stat-input"
                      type="number"
                      min="0"
                      value={editedStats[s.key] ?? 0}
                      onChange={e => setEditedStats(p => ({ ...p, [s.key]: Number(e.target.value) }))}
                    />
                  ) : (
                    <p className="hd-stat-value">{hospitalData[s.key] ?? 0}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DOCTORS ──────────────────────────────────────────────────────── */}
      {activeTab === 'doctors' && (
        <div className="hd-card">
          <h2 className="hd-card-title">Doctors ({doctors.length})</h2>
          <div className="hd-doctors-list">
            {doctors.length === 0 && <p className="hd-empty">No doctors added yet.</p>}
            {doctors.map((doc, i) => (
              <div key={doc._id || i} className="hd-doctor-row">
                <Stethoscope size={18} color="#4a90e2" />
                <span className="hd-doctor-name">{doc.name}</span>
                <span className="hd-doctor-spec">{doc.specialization}</span>
                {doc.canLogin && <span className="hd-doctor-login-badge">🔑 Can Login</span>}
                <button className="hd-icon-btn hd-icon-btn-danger" onClick={() => handleRemoveDoctor(doc._id)} title="Remove">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          <div className="hd-add-doctor-box">
            <h3 style={{ marginBottom: 14, fontSize: '1rem' }}>Add New Doctor</h3>
            <div className="hd-add-row">
              <input
                className="hd-input"
                placeholder="Doctor Name *"
                value={newDoctor.name}
                onChange={e => setNewDoctor(p => ({ ...p, name: e.target.value }))}
              />
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  className="hd-input"
                  placeholder="Specialization *"
                  value={newDoctor.specialization}
                  onChange={e => handleSpecializationChange(e.target.value)}
                  autoComplete="off"
                />
                {specSuggestions.length > 0 && (
                  <div className="hd-spec-suggestions">
                    {specSuggestions.map((s, i) => (
                      <div key={i} className="hd-spec-suggestion"
                        onClick={() => { setNewDoctor(p => ({ ...p, specialization: s })); setSpecSuggestions([]); }}>
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="hd-login-toggle">
              <label className="hd-toggle-label">
                <input type="checkbox" checked={showLoginFields}
                  onChange={e => setShowLoginFields(e.target.checked)} />
                <KeyRound size={15} style={{ marginLeft: 8 }} />
                Enable Doctor Login (doctor can log in with username & password)
              </label>
            </div>

            {showLoginFields && (
              <div className="hd-add-row" style={{ marginTop: 12 }}>
                <input className="hd-input" placeholder="Username for doctor *"
                  value={newDoctor.username}
                  onChange={e => setNewDoctor(p => ({ ...p, username: e.target.value }))} />
                <input className="hd-input" type="password" placeholder="Password for doctor *"
                  value={newDoctor.password}
                  onChange={e => setNewDoctor(p => ({ ...p, password: e.target.value }))} />
              </div>
            )}

            <button className="hd-btn hd-btn-primary" style={{ marginTop: 14 }} onClick={handleAddDoctor}>
              <PlusCircle size={16} /> Add Doctor
            </button>
          </div>
        </div>
      )}

      {/* ── APPOINTMENTS ─────────────────────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <div className="hd-card">
          <div className="hd-card-title-row">
            <h2 className="hd-card-title">Appointments ({appointments.length})</h2>
            <button className="hd-btn hd-btn-outline" onClick={fetchAppointments}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          {appointmentMsg && <div className="hd-flash">{appointmentMsg}</div>}
          {appointments.length === 0 ? (
            <p className="hd-empty">No appointments yet.</p>
          ) : (
            <div className="hd-appt-list">
              {appointments.map(appt => (
                <div key={appt._id} className="hd-appt-row">
                  <div className="hd-appt-info">
                    <strong>{appt.fullName}</strong>
                    <span>{new Date(appt.date).toLocaleDateString()} at {appt.time}</span>
                    <span>Dr. {appt.doctor?.name}</span>
                    <span className={`hd-appt-status hd-appt-${appt.status?.toLowerCase()}`}>{appt.status}</span>
                  </div>
                  {appt.status === 'Pending' && (
                    <div className="hd-appt-actions">
                      <button className="hd-icon-btn hd-icon-btn-success" onClick={() => handleAppointmentAction(appt._id, 'accept')} title="Accept">
                        <Check size={16} />
                      </button>
                      <button className="hd-icon-btn hd-icon-btn-danger" onClick={() => handleAppointmentAction(appt._id, 'deny')} title="Deny">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── QUEUE ────────────────────────────────────────────────────────── */}
      {activeTab === 'queue' && (
        <div className="hd-card">
          <div className="hd-card-title-row">
            <h2 className="hd-card-title">Patient Queue ({queue.filter(e => e.status === 'Waiting').length} waiting)</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="hd-btn hd-btn-outline" onClick={fetchQueue}><RefreshCw size={14} /> Refresh</button>
              <button className="hd-btn hd-btn-danger-outline" onClick={handleClearQueue}><Trash2 size={14} /> Clear Done</button>
            </div>
          </div>

          {queueMsg && <div className="hd-flash">{queueMsg}</div>}

          {/* Add to queue */}
          <div className="hd-queue-add-box">
            <h3>Add Patient to Queue</h3>
            <div className="hd-add-row">
              <input
                className="hd-input"
                placeholder="Patient Name *"
                value={newQueueEntry.patientName}
                onChange={e => setNewQueueEntry(p => ({ ...p, patientName: e.target.value }))}
              />
              <input
                className="hd-input"
                placeholder="Phone (optional)"
                value={newQueueEntry.patientPhone}
                onChange={e => setNewQueueEntry(p => ({ ...p, patientPhone: e.target.value }))}
              />
              <select
                className="hd-input"
                value={newQueueEntry.doctorName}
                onChange={e => setNewQueueEntry(p => ({ ...p, doctorName: e.target.value }))}
              >
                <option value="">Select Doctor *</option>
                {doctors.map((d, i) => (
                  <option key={d._id || i} value={d.name}>{d.name} — {d.specialization}</option>
                ))}
              </select>
              <button className="hd-btn hd-btn-primary" onClick={handleAddToQueue}>
                <PlusCircle size={16} /> Issue Token
              </button>
            </div>
          </div>

          {/* Queue list */}
          {queue.length === 0 ? (
            <p className="hd-empty">Queue is empty.</p>
          ) : (
            <div className="hd-queue-list">
              {queue.map(entry => (
                <div key={entry._id} className="hd-queue-row">
                  <div className="hd-token-badge">#{entry.tokenNumber}</div>
                  <div className="hd-queue-info">
                    <strong>{entry.patientName}</strong>
                    {entry.patientPhone && <span className="hd-queue-phone">{entry.patientPhone}</span>}
                    <span className="hd-queue-doctor">Dr. {entry.doctorName}</span>
                  </div>
                  <select
                    className="hd-queue-status-select"
                    value={entry.status}
                    style={{ borderColor: queueStatusColor[entry.status] }}
                    onChange={e => handleQueueStatusChange(entry._id, e.target.value)}
                  >
                    {['Waiting', 'In Progress', 'Done', 'Skipped'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button className="hd-icon-btn hd-icon-btn-danger" onClick={() => handleRemoveFromQueue(entry._id)} title="Remove">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BED AVAILABILITY ─────────────────────────────────────────────── */}
      {activeTab === 'beds' && (
        <div className="hd-card">
          <div className="hd-card-title-row">
            <h2 className="hd-card-title">Bed Availability</h2>
            <div className="hd-stat-btns">
              <button className="hd-btn hd-btn-outline" onClick={() => setEditMode(!editMode)}>
                {editMode ? 'Cancel' : 'Update Beds'}
              </button>
              {editMode && (
                <button className="hd-btn hd-btn-primary" onClick={handleSaveStats} disabled={saveLoading}>
                  {saveLoading ? 'Saving…' : 'Save'}
                </button>
              )}
            </div>
          </div>

          {/* Visual bed meter */}
          <div className="hd-bed-visual">
            <div className="hd-bed-numbers">
              <div className="hd-bed-num hd-bed-available">
                <Bed size={36} color="#27ae60" />
                <span className="hd-bed-big">{hospitalData.availableBeds}</span>
                <span className="hd-bed-sub">Available</span>
              </div>
              <div className="hd-bed-divider">/</div>
              <div className="hd-bed-num">
                <Bed size={36} color="#888" />
                <span className="hd-bed-big">{hospitalData.totalBeds || 0}</span>
                <span className="hd-bed-sub">Total</span>
              </div>
              <div className="hd-bed-divider">|</div>
              <div className="hd-bed-num hd-bed-occupied">
                <Bed size={36} color="#e74c3c" />
                <span className="hd-bed-big">{(hospitalData.totalBeds || 0) - (hospitalData.availableBeds || 0)}</span>
                <span className="hd-bed-sub">Occupied</span>
              </div>
            </div>

            {hospitalData.totalBeds > 0 && (
              <div className="hd-bed-bar-wrap">
                <div
                  className="hd-bed-bar-fill"
                  style={{ width: `${Math.round((hospitalData.availableBeds / hospitalData.totalBeds) * 100)}%` }}
                />
                <span className="hd-bed-bar-label">
                  {Math.round((hospitalData.availableBeds / hospitalData.totalBeds) * 100)}% Available
                </span>
              </div>
            )}
          </div>

          {editMode && (
            <div className="hd-bed-edit">
              <label>Available Beds
                <input
                  className="hd-input"
                  type="number" min="0"
                  value={editedStats.availableBeds ?? 0}
                  onChange={e => setEditedStats(p => ({ ...p, availableBeds: Number(e.target.value) }))}
                />
              </label>
              <label>Total Beds
                <input
                  className="hd-input"
                  type="number" min="0"
                  value={editedStats.totalBeds ?? 0}
                  onChange={e => setEditedStats(p => ({ ...p, totalBeds: Number(e.target.value) }))}
                />
              </label>
            </div>
          )}

          <p className="hd-beds-note">
            ℹ Bed availability is publicly visible so patients can check before visiting.
          </p>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;