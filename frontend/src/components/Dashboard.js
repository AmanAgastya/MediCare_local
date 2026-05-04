import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, Bell, FlaskConical, Edit2, Trash2, Plus, Save, X, 
  AlertTriangle, Heart, Pill, Phone, RefreshCw, Droplet, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import './Dashboard.css';

const API     = 'http://localhost:5000/api/auth';
const DON_API = 'http://localhost:5000/api/donations';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [orders, setOrders] = useState([]);

  // Edit states
  const [editingAppt, setEditingAppt] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [editingLabTest, setEditingLabTest] = useState(null);
  const [showAddLabTest, setShowAddLabTest] = useState(false);
  const [newLabTest, setNewLabTest] = useState({ testName: '', testDate: '', labName: '', result: '', notes: '' });
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');
  const [medicationInput, setMedicationInput] = useState('');
  const [myDonations, setMyDonations]   = useState([]);
  const [donLoading, setDonLoading]     = useState(false);
  const [donError, setDonError]         = useState('');
  const [donSuccess, setDonSuccess]     = useState('');
  const [showBloodForm, setShowBloodForm]     = useState(false);
  const [showOrganForm, setShowOrganForm]     = useState(false);
  const [showFinanceForm, setShowFinanceForm] = useState(false);
  const [bloodForm, setBloodForm] = useState({ donorName:'', donorPhone:'', bloodGroup:'', unitsOffered:1, urgency:'normal', notes:'' });
  const [organForm, setOrganForm] = useState({ donorName:'', donorPhone:'', organType:'', donorAlive:true, notes:'' });
  const [finForm, setFinForm]     = useState({ donorName:'', amountOffered:'', paymentMode:'', purpose:'', notes:'' });

  const token = localStorage.getItem('token');
  const authH = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500); };

  const fetchAll = useCallback(async () => {
    if (!token) { navigate('/user-login'); return; }
    setLoading(true);
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    try {
      const [profRes, apptRes, notifRes] = await Promise.all([
        fetch(`${API}/profile`, { headers }),
        fetch(`${API}/my-appointments`, { headers }),
        fetch(`${API}/notifications`, { headers }),
      ]);
      if (!profRes.ok) throw new Error('Not authenticated');
      const profData = await profRes.json();
      const apptData = apptRes.ok ? await apptRes.json() : [];
      const notifData = notifRes.ok ? await notifRes.json() : [];
      setProfile(profData);
      setProfileForm({ ...profData, allergies: profData.allergies || [], chronicConditions: profData.chronicConditions || [], currentMedications: profData.currentMedications || [] });
      setAppointments(apptData);
      setNotifications(notifData.filter(n => n.queueToken || n.bedAllocated));
      setLabTests(profData.labTests || []);
      // fetch donations for this user
      const donRes = await fetch(`${DON_API}/my-donations`, { headers });
      if (donRes.ok) setMyDonations(await donRes.json());
    } catch (err) {
      setError(err.message);
      if (err.message === 'Not authenticated') navigate('/user-login');
    } finally { setLoading(false); }
  }, [token, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/order/my-orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch (err) {
        // Non-fatal: orders section shows empty state instead of crashing
        console.warn("Could not fetch orders:", err.message);
        setOrders([]);
      }
    };

    if (token) fetchOrders();   // FIX: only fetch if authenticated
  }, [token]);

  // ── Profile ───────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    try {
      const res = await fetch(`${API}/profile`, {
        method: 'PUT', headers: authH,
        body: JSON.stringify({
          phone: profileForm.phone,
          bloodGroup: profileForm.bloodGroup,
          dateOfBirth: profileForm.dateOfBirth,
          gender: profileForm.gender,
          address: profileForm.address,
          allergies: profileForm.allergies,
          chronicConditions: profileForm.chronicConditions,
          currentMedications: profileForm.currentMedications,
          emergencyContact: profileForm.emergencyContact
        })
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updated = await res.json();
      setProfile(updated);
      setProfileForm({ ...updated });
      setEditingProfile(false);
      flash('✅ Profile updated successfully!');
    } catch (err) { setError(err.message); }
  };

  const addToList = (field, value, setter) => {
    if (!value.trim()) return;
    setProfileForm(p => ({ ...p, [field]: [...(p[field] || []), value.trim()] }));
    setter('');
  };
  const removeFromList = (field, index) => {
    setProfileForm(p => ({ ...p, [field]: p[field].filter((_, i) => i !== index) }));
  };

  // ── Appointments ──────────────────────────────────────────────────────────
  const cancelAppointment = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    try {
      const res = await fetch(`${API}/my-appointments/${id}`, { method: 'DELETE', headers: authH });
      if (!res.ok) throw new Error('Failed to cancel appointment');
      setAppointments(p => p.filter(a => a._id !== id));
      flash('✅ Appointment cancelled.');
    } catch (err) { setError(err.message); }
  };

  const saveApptEdit = async () => {
    try {
      const res = await fetch(`${API}/my-appointments/${editingAppt._id}`, {
        method: 'PUT', headers: authH,
        body: JSON.stringify({ date: editingAppt.date, time: editingAppt.time, additionalMessage: editingAppt.additionalMessage, needsBed: editingAppt.needsBed })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed to update'); }
      const updated = await res.json();
      setAppointments(p => p.map(a => a._id === updated._id ? { ...a, ...updated } : a));
      setEditingAppt(null);
      flash('✅ Appointment updated.');
    } catch (err) { setError(err.message); }
  };

  // ── Lab Tests ─────────────────────────────────────────────────────────────
  const addLabTest = async () => {
    if (!newLabTest.testName || !newLabTest.testDate) { setError('Test name and date are required'); return; }
    try {
      const res = await fetch(`${API}/lab-tests`, { method: 'POST', headers: authH, body: JSON.stringify(newLabTest) });
      if (!res.ok) throw new Error('Failed to add lab test');
      const tests = await res.json();
      setLabTests(tests);
      setNewLabTest({ testName: '', testDate: '', labName: '', result: '', notes: '' });
      setShowAddLabTest(false);
      flash('✅ Lab test added.');
    } catch (err) { setError(err.message); }
  };

  const saveLabTestEdit = async () => {
    try {
      const res = await fetch(`${API}/lab-tests/${editingLabTest._id}`, {
        method: 'PUT', headers: authH, body: JSON.stringify(editingLabTest)
      });
      if (!res.ok) throw new Error('Failed to update');
      const tests = await res.json();
      setLabTests(tests);
      setEditingLabTest(null);
      flash('✅ Lab test updated.');
    } catch (err) { setError(err.message); }
  };

  const deleteLabTest = async (id) => {
    if (!window.confirm('Delete this lab test record?')) return;
    try {
      const res = await fetch(`${API}/lab-tests/${id}`, { method: 'DELETE', headers: authH });
      if (!res.ok) throw new Error('Failed to delete');
      const tests = await res.json();
      setLabTests(tests);
      flash('✅ Lab test deleted.');
    } catch (err) { setError(err.message); }
  };

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner"/>
      <p>Loading your dashboard…</p>
    </div>
  );

  const tabs = [
    { id: 'appointments', label: '📅 Appointments', badge: appointments.filter(a => a.status === 'Pending').length },
    { id: 'notifications', label: '🔔 Notifications', badge: notifications.length },
    { id: 'profile', label: '👤 Health Profile' },
    { id: 'labtests', label: '🧪 Lab Tests' },
    { id: 'donations', label: '🩸 Donations', badge: myDonations.filter(d => d.status === 'pending').length },
    { id: 'orders', label: `💊 Medicine Orders ${orders.length > 0 ? `(${orders.length})` : "" }`},
  ];

  const statusColor = { Pending: '#f59e0b', Accepted: '#10b981', Denied: '#ef4444', Cancelled: '#9ca3af' };

  return (
    <div className="dash-container">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1>👋 My Dashboard</h1>
          <p>Welcome back, {profile?.name}</p>
        </div>
        <button className="dash-refresh-btn" onClick={fetchAll} title="Refresh"><RefreshCw size={16}/></button>
      </div>

      {/* Summary pills */}
      <div className="dash-summary">
        <div className="dash-sum-pill">📅 <strong>{appointments.filter(a => a.status==='Accepted').length}</strong> Active Appts</div>
        <div className="dash-sum-pill">⏳ <strong>{appointments.filter(a => a.status==='Pending').length}</strong> Pending</div>
        <div className="dash-sum-pill">🔔 <strong>{notifications.length}</strong> Notifications</div>
        <div className="dash-sum-pill">🧪 <strong>{labTests.length}</strong> Lab Records</div>
        <div className="dash-sum-pill">🩸 <strong>{myDonations.length}</strong> Donations</div>
        {profile?.bloodGroup && profile.bloodGroup !== 'Unknown' && (
          <div className="dash-sum-pill blood">🩸 Blood: <strong>{profile.bloodGroup}</strong></div>
        )}
      </div>

      {error && (
        <div className="dash-error">⚠ {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      {successMsg && <div className="dash-success">{successMsg}</div>}

      {/* Tabs */}
      <div className="dash-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`dash-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}>
            {t.label}
            {t.badge > 0 && <span className="dash-tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── APPOINTMENTS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <div className="dash-section">
          <div className="dash-section-header">
            <h2>My Appointments</h2>
            <a href="/appointment-booking" className="dash-add-btn"><Plus size={16}/> Book New</a>
          </div>
          {appointments.length === 0 ? (
            <div className="dash-empty">
              <Calendar size={48} color="#d1d5db"/>
              <p>No appointments yet.</p>
              <a href="/appointment-booking" className="dash-add-btn">Book Your First Appointment</a>
            </div>
          ) : (
            <div className="dash-appt-list">
              {appointments.map(appt => (
                <div key={appt._id} className="dash-appt-card">
                  {/* Status stripe */}
                  <div className="dash-appt-stripe" style={{ background: statusColor[appt.status] || '#9ca3af' }}/>
                  <div className="dash-appt-body">
                    <div className="dash-appt-top">
                      <div>
                        <h3>{appt.hospital?.hospitalName || 'Hospital'}</h3>
                        <p className="dash-appt-doctor">Dr. {appt.doctor?.name}</p>
                      </div>
                      <span className="dash-status-badge" style={{ background: statusColor[appt.status] + '22', color: statusColor[appt.status], border: `1px solid ${statusColor[appt.status]}` }}>
                        {appt.status}
                      </span>
                    </div>
                    <div className="dash-appt-meta">
                      <span><Calendar size={14}/> {new Date(appt.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                      <span><Clock size={14}/> {appt.time}</span>
                      {appt.queueToken && <span className="dash-token-badge">🎫 Queue Token #{appt.queueToken}</span>}
                      {appt.bedAllocated && <span className="dash-bed-badge">🛏 Bed Allocated</span>}
                    </div>
                    {appt.additionalMessage && <p className="dash-appt-note">📝 {appt.additionalMessage}</p>}

                    {/* Edit form inline */}
                    {editingAppt?._id === appt._id ? (
                      <div className="dash-edit-appt">
                        <div className="dash-edit-row">
                          <div className="dash-field">
                            <label>Date</label>
                            <input type="date" value={editingAppt.date?.split('T')[0] || ''} min={new Date().toISOString().split('T')[0]}
                              onChange={e => setEditingAppt(p => ({ ...p, date: e.target.value }))} />
                          </div>
                          <div className="dash-field">
                            <label>Time</label>
                            <input type="time" value={editingAppt.time || ''}
                              onChange={e => setEditingAppt(p => ({ ...p, time: e.target.value }))} />
                          </div>
                        </div>
                        <div className="dash-field">
                          <label>Additional Notes</label>
                          <textarea rows={2} value={editingAppt.additionalMessage || ''}
                            onChange={e => setEditingAppt(p => ({ ...p, additionalMessage: e.target.value }))}
                            placeholder="Any message for the hospital…"/>
                        </div>
                        <label className="dash-checkbox-label">
                          <input type="checkbox" checked={editingAppt.needsBed || false}
                            onChange={e => setEditingAppt(p => ({ ...p, needsBed: e.target.checked }))}/>
                          🛏 I need a bed allocated
                        </label>
                        <div className="dash-edit-actions">
                          <button className="dash-btn dash-btn-primary" onClick={saveApptEdit}><Save size={14}/> Save</button>
                          <button className="dash-btn dash-btn-ghost" onClick={() => setEditingAppt(null)}><X size={14}/> Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="dash-appt-actions">
                        {appt.status === 'Pending' && (
                          <button className="dash-btn dash-btn-outline" onClick={() => setEditingAppt({ ...appt })}>
                            <Edit2 size={14}/> Edit
                          </button>
                        )}
                        {['Pending', 'Accepted'].includes(appt.status) && (
                          <button className="dash-btn dash-btn-danger" onClick={() => cancelAppointment(appt._id)}>
                            <X size={14}/> Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="dash-section">
          <h2>🔔 Notifications</h2>
          {notifications.length === 0 ? (
            <div className="dash-empty">
              <Bell size={48} color="#d1d5db"/>
              <p>No notifications yet. You'll be notified when a bed is allocated or queue token is issued.</p>
            </div>
          ) : (
            <div className="dash-notif-list">
              {notifications.map(n => (
                <div key={n._id} className="dash-notif-card">
                  <div className="dash-notif-icon">
                    {n.bedAllocated ? '🛏' : '🎫'}
                  </div>
                  <div className="dash-notif-body">
                    <h3>{n.hospital?.hospitalName}</h3>
                    <p>
                      {n.queueToken && <span className="dash-notif-token">Queue Token: <strong>#{n.queueToken}</strong> — </span>}
                      {n.bedAllocated && <span className="dash-notif-bed">✅ Bed has been allocated for you — </span>}
                      <span>Dr. {n.doctor?.name} · {new Date(n.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} at {n.time}</span>
                    </p>
                    <span className={`dash-status-badge`} style={{ background: '#d1fae522', color: '#065f46', border:'1px solid #10b981' }}>
                      {n.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HEALTH PROFILE TAB ────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="dash-section">
          <div className="dash-section-header">
            <h2>👤 Health Profile</h2>
            {!editingProfile ? (
              <button className="dash-btn dash-btn-outline" onClick={() => setEditingProfile(true)}><Edit2 size={14}/> Edit Profile</button>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <button className="dash-btn dash-btn-primary" onClick={saveProfile}><Save size={14}/> Save</button>
                <button className="dash-btn dash-btn-ghost" onClick={() => { setEditingProfile(false); setProfileForm({ ...profile }); }}><X size={14}/> Cancel</button>
              </div>
            )}
          </div>

          <div className="dash-profile-grid">
            {/* Basic Info */}
            <div className="dash-profile-card">
              <h3><User size={16}/> Basic Information</h3>
              <div className="dash-field-group">
                <div className="dash-field">
                  <label>Full Name</label>
                  <div className="dash-field-value">{profile?.name}</div>
                </div>
                <div className="dash-field">
                  <label>Email</label>
                  <div className="dash-field-value">{profile?.email}</div>
                </div>
                <div className="dash-field">
                  <label>Phone</label>
                  {editingProfile
                    ? <input value={profileForm.phone || ''} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                    : <div className="dash-field-value">{profile?.phone || '—'}</div>}
                </div>
                <div className="dash-field">
                  <label>Gender</label>
                  {editingProfile
                    ? <select value={profileForm.gender || ''} onChange={e => setProfileForm(p => ({ ...p, gender: e.target.value }))}>
                        <option value="">Select</option>
                        {['Male','Female','Other'].map(g => <option key={g}>{g}</option>)}
                      </select>
                    : <div className="dash-field-value">{profile?.gender || '—'}</div>}
                </div>
                <div className="dash-field">
                  <label>Date of Birth</label>
                  {editingProfile
                    ? <input type="date" value={profileForm.dateOfBirth?.split('T')[0] || ''} onChange={e => setProfileForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
                    : <div className="dash-field-value">{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : '—'}</div>}
                </div>
                <div className="dash-field">
                  <label>Blood Group</label>
                  {editingProfile
                    ? <select value={profileForm.bloodGroup || 'Unknown'} onChange={e => setProfileForm(p => ({ ...p, bloodGroup: e.target.value }))}>
                        {['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'].map(g => <option key={g}>{g}</option>)}
                      </select>
                    : <div className="dash-field-value">{profile?.bloodGroup || 'Unknown'}</div>}
                </div>
                <div className="dash-field full">
                  <label>Address</label>
                  {editingProfile
                    ? <textarea rows={2} value={profileForm.address || ''} onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))} placeholder="Your address…"/>
                    : <div className="dash-field-value">{profile?.address || '—'}</div>}
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="dash-profile-card">
              <h3><AlertTriangle size={16}/> Allergies</h3>
              <div className="dash-tag-list">
                {(editingProfile ? profileForm.allergies : profile?.allergies || []).map((a, i) => (
                  <span key={i} className="dash-tag dash-tag-allergy">
                    {a}
                    {editingProfile && <button onClick={() => removeFromList('allergies', i)}>×</button>}
                  </span>
                ))}
                {(editingProfile ? profileForm.allergies : profile?.allergies || []).length === 0 && <span className="dash-no-data">None recorded</span>}
              </div>
              {editingProfile && (
                <div className="dash-add-tag">
                  <input placeholder="Add allergy…" value={allergyInput}
                    onChange={e => setAllergyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addToList('allergies', allergyInput, setAllergyInput)} />
                  <button onClick={() => addToList('allergies', allergyInput, setAllergyInput)}><Plus size={14}/></button>
                </div>
              )}
            </div>

            <div className="dash-profile-card">
              <h3><Heart size={16}/> Chronic Conditions</h3>
              <div className="dash-tag-list">
                {(editingProfile ? profileForm.chronicConditions : profile?.chronicConditions || []).map((c, i) => (
                  <span key={i} className="dash-tag dash-tag-condition">
                    {c}
                    {editingProfile && <button onClick={() => removeFromList('chronicConditions', i)}>×</button>}
                  </span>
                ))}
                {(editingProfile ? profileForm.chronicConditions : profile?.chronicConditions || []).length === 0 && <span className="dash-no-data">None recorded</span>}
              </div>
              {editingProfile && (
                <div className="dash-add-tag">
                  <input placeholder="Add condition…" value={conditionInput}
                    onChange={e => setConditionInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addToList('chronicConditions', conditionInput, setConditionInput)} />
                  <button onClick={() => addToList('chronicConditions', conditionInput, setConditionInput)}><Plus size={14}/></button>
                </div>
              )}
            </div>

            <div className="dash-profile-card">
              <h3><Pill size={16}/> Current Medications</h3>
              <div className="dash-tag-list">
                {(editingProfile ? profileForm.currentMedications : profile?.currentMedications || []).map((m, i) => (
                  <span key={i} className="dash-tag dash-tag-medication">
                    {m}
                    {editingProfile && <button onClick={() => removeFromList('currentMedications', i)}>×</button>}
                  </span>
                ))}
                {(editingProfile ? profileForm.currentMedications : profile?.currentMedications || []).length === 0 && <span className="dash-no-data">None recorded</span>}
              </div>
              {editingProfile && (
                <div className="dash-add-tag">
                  <input placeholder="Add medication…" value={medicationInput}
                    onChange={e => setMedicationInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addToList('currentMedications', medicationInput, setMedicationInput)} />
                  <button onClick={() => addToList('currentMedications', medicationInput, setMedicationInput)}><Plus size={14}/></button>
                </div>
              )}
            </div>

            {/* Emergency Contact */}
            <div className="dash-profile-card full">
              <h3><Phone size={16}/> Emergency Contact</h3>
              <div className="dash-field-group three-col">
                {[
                  { key: 'name', label: 'Contact Name' },
                  { key: 'phone', label: 'Phone Number' },
                  { key: 'relation', label: 'Relation' }
                ].map(({ key, label }) => (
                  <div key={key} className="dash-field">
                    <label>{label}</label>
                    {editingProfile
                      ? <input value={profileForm.emergencyContact?.[key] || ''}
                          onChange={e => setProfileForm(p => ({ ...p, emergencyContact: { ...p.emergencyContact, [key]: e.target.value } }))} />
                      : <div className="dash-field-value">{profile?.emergencyContact?.[key] || '—'}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LAB TESTS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'labtests' && (
        <div className="dash-section">
          <div className="dash-section-header">
            <h2>🧪 Lab Test Records</h2>
            <button className="dash-add-btn" onClick={() => setShowAddLabTest(s => !s)}>
              {showAddLabTest ? <><X size={14}/> Cancel</> : <><Plus size={14}/> Add Test</>}
            </button>
          </div>

          {/* Add form */}
          {showAddLabTest && (
            <div className="dash-lab-form">
              <h3>Add New Lab Test</h3>
              <div className="dash-edit-row">
                <div className="dash-field">
                  <label>Test Name *</label>
                  <input placeholder="e.g. CBC, HbA1c, Lipid Profile…" value={newLabTest.testName}
                    onChange={e => setNewLabTest(p => ({ ...p, testName: e.target.value }))} />
                </div>
                <div className="dash-field">
                  <label>Test Date *</label>
                  <input type="date" max={new Date().toISOString().split('T')[0]} value={newLabTest.testDate}
                    onChange={e => setNewLabTest(p => ({ ...p, testDate: e.target.value }))} />
                </div>
                <div className="dash-field">
                  <label>Lab / Hospital Name</label>
                  <input placeholder="Where was the test done?" value={newLabTest.labName}
                    onChange={e => setNewLabTest(p => ({ ...p, labName: e.target.value }))} />
                </div>
              </div>
              <div className="dash-edit-row">
                <div className="dash-field">
                  <label>Result / Values</label>
                  <input placeholder="e.g. HbA1c: 5.8%, Normal" value={newLabTest.result}
                    onChange={e => setNewLabTest(p => ({ ...p, result: e.target.value }))} />
                </div>
                <div className="dash-field">
                  <label>Notes</label>
                  <input placeholder="Doctor's advice, follow-up…" value={newLabTest.notes}
                    onChange={e => setNewLabTest(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <button className="dash-btn dash-btn-primary" onClick={addLabTest}><Plus size={14}/> Add Record</button>
            </div>
          )}

          {labTests.length === 0 && !showAddLabTest ? (
            <div className="dash-empty">
              <FlaskConical size={48} color="#d1d5db"/>
              <p>No lab test records yet. Add your first test result to keep track of your health.</p>
            </div>
          ) : (
            <div className="dash-lab-list">
              {labTests.map(test => (
                <div key={test._id} className="dash-lab-card">
                  {editingLabTest?._id === test._id ? (
                    <div className="dash-lab-edit">
                      <div className="dash-edit-row">
                        <div className="dash-field">
                          <label>Test Name</label>
                          <input value={editingLabTest.testName} onChange={e => setEditingLabTest(p => ({ ...p, testName: e.target.value }))} />
                        </div>
                        <div className="dash-field">
                          <label>Date</label>
                          <input type="date" value={editingLabTest.testDate?.split('T')[0] || ''} onChange={e => setEditingLabTest(p => ({ ...p, testDate: e.target.value }))} />
                        </div>
                        <div className="dash-field">
                          <label>Lab Name</label>
                          <input value={editingLabTest.labName || ''} onChange={e => setEditingLabTest(p => ({ ...p, labName: e.target.value }))} />
                        </div>
                      </div>
                      <div className="dash-edit-row">
                        <div className="dash-field">
                          <label>Result</label>
                          <input value={editingLabTest.result || ''} onChange={e => setEditingLabTest(p => ({ ...p, result: e.target.value }))} />
                        </div>
                        <div className="dash-field">
                          <label>Notes</label>
                          <input value={editingLabTest.notes || ''} onChange={e => setEditingLabTest(p => ({ ...p, notes: e.target.value }))} />
                        </div>
                      </div>
                      <div className="dash-edit-actions">
                        <button className="dash-btn dash-btn-primary" onClick={saveLabTestEdit}><Save size={14}/> Save</button>
                        <button className="dash-btn dash-btn-ghost" onClick={() => setEditingLabTest(null)}><X size={14}/> Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="dash-lab-icon"><FlaskConical size={24} color="#8b5cf6"/></div>
                      <div className="dash-lab-info">
                        <h3>{test.testName}</h3>
                        <div className="dash-lab-meta">
                          <span>📅 {new Date(test.testDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                          {test.labName && <span>🏥 {test.labName}</span>}
                          {test.result && <span className="dash-lab-result">📊 {test.result}</span>}
                        </div>
                        {test.notes && <p className="dash-lab-notes">📝 {test.notes}</p>}
                      </div>
                      <div className="dash-lab-actions">
                        <button className="dash-btn dash-btn-outline" onClick={() => setEditingLabTest({ ...test })}><Edit2 size={14}/></button>
                        <button className="dash-btn dash-btn-danger" onClick={() => deleteLabTest(test._id)}><Trash2 size={14}/></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── DONATIONS TAB ──────────────────────────────────────────────── */}
      {activeTab === 'donations' && (
        <div className="dash-section">
          <div className="dash-section-header">
            <h2>🩸 My Donations &amp; Requests</h2>
            <a href="/donation-dashboard" className="dash-add-btn"><Plus size={14}/> New Donation</a>
          </div>

          {donError && <div className="dash-error">⚠ {donError}<button onClick={()=>setDonError('')}>×</button></div>}
          {donSuccess && <div className="dash-success">{donSuccess}</div>}

          {/* Quick submit forms */}
          <div style={{display:'flex',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
            <button className="dash-btn dash-btn-outline" style={{borderColor:'#ef4444',color:'#ef4444'}}
              onClick={()=>{setShowBloodForm(s=>!s);setShowOrganForm(false);setShowFinanceForm(false);}}>
              <Droplet size={14}/> {showBloodForm ? 'Cancel' : 'Donate Blood'}
            </button>
            <button className="dash-btn dash-btn-outline" style={{borderColor:'#8b5cf6',color:'#8b5cf6'}}
              onClick={()=>{setShowOrganForm(s=>!s);setShowBloodForm(false);setShowFinanceForm(false);}}>
              <Heart size={14}/> {showOrganForm ? 'Cancel' : 'Pledge Organ'}
            </button>
            <button className="dash-btn dash-btn-outline" style={{borderColor:'#10b981',color:'#10b981'}}
              onClick={()=>{setShowFinanceForm(s=>!s);setShowBloodForm(false);setShowOrganForm(false);}}>
              <IndianRupee size={14}/> {showFinanceForm ? 'Cancel' : 'Financial Aid'}
            </button>
          </div>

          {/* Blood quick form */}
          {showBloodForm && (
            <div className="dash-lab-form" style={{marginBottom:'20px'}}>
              <h3 style={{color:'#ef4444',marginBottom:'12px'}}>🩸 Donate Blood</h3>
              <div className="dash-edit-row">
                <div className="dash-field">
                  <label>Your Name *</label>
                  <input value={bloodForm.donorName} onChange={e=>setBloodForm(f=>({...f,donorName:e.target.value}))} placeholder="Full name"/>
                </div>
                <div className="dash-field">
                  <label>Phone *</label>
                  <input value={bloodForm.donorPhone} onChange={e=>setBloodForm(f=>({...f,donorPhone:e.target.value}))} placeholder="Contact number"/>
                </div>
                <div className="dash-field">
                  <label>Blood Group *</label>
                  <select value={bloodForm.bloodGroup} onChange={e=>setBloodForm(f=>({...f,bloodGroup:e.target.value}))}>
                    <option value="">Select</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg=><option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className="dash-field">
                  <label>Units</label>
                  <input type="number" min="1" max="5" value={bloodForm.unitsOffered} onChange={e=>setBloodForm(f=>({...f,unitsOffered:e.target.value}))}/>
                </div>
              </div>
              <div className="dash-edit-row">
                <div className="dash-field">
                  <label>Urgency</label>
                  <select value={bloodForm.urgency} onChange={e=>setBloodForm(f=>({...f,urgency:e.target.value}))}>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="dash-field" style={{flex:2}}>
                  <label>Notes</label>
                  <input value={bloodForm.notes} onChange={e=>setBloodForm(f=>({...f,notes:e.target.value}))} placeholder="Any additional notes"/>
                </div>
              </div>
              <button className="dash-btn dash-btn-primary" disabled={donLoading} onClick={async()=>{
                if(!bloodForm.donorName||!bloodForm.donorPhone||!bloodForm.bloodGroup){setDonError('Name, phone and blood group are required');return;}
                setDonLoading(true);setDonError('');setDonSuccess('');
                try{
                  const res=await fetch(`${DON_API}/donor-offer`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
                    body:JSON.stringify({donationType:'blood',donorName:bloodForm.donorName,donorPhone:bloodForm.donorPhone,donorEmail:localStorage.getItem('userEmail')||'',bloodGroup:bloodForm.bloodGroup,unitsOffered:Number(bloodForm.unitsOffered),urgency:bloodForm.urgency,notes:bloodForm.notes})});
                  const d=await res.json();
                  if(!res.ok) throw new Error(d.message||'Failed');
                  setDonSuccess('✅ Blood donation registered! Admin will review and contact you.');
                  setShowBloodForm(false);
                  setBloodForm({donorName:'',donorPhone:'',bloodGroup:'',unitsOffered:1,urgency:'normal',notes:''});
                  const donRes=await fetch(`${DON_API}/my-donations`,{headers:{Authorization:`Bearer ${token}`}});
                  if(donRes.ok) setMyDonations(await donRes.json());
                }catch(e){setDonError(e.message);}
                finally{setDonLoading(false);}
              }}>{donLoading?'Submitting…':'Submit Blood Donation'}</button>
            </div>
          )}

          {/* Organ quick form */}
          {showOrganForm && (
            <div className="dash-lab-form" style={{marginBottom:'20px'}}>
              <h3 style={{color:'#8b5cf6',marginBottom:'12px'}}>🫀 Pledge Organ Donation</h3>
              <div className="dash-edit-row">
                <div className="dash-field">
                  <label>Your Name *</label>
                  <input value={organForm.donorName} onChange={e=>setOrganForm(f=>({...f,donorName:e.target.value}))} placeholder="Full name"/>
                </div>
                <div className="dash-field">
                  <label>Phone *</label>
                  <input value={organForm.donorPhone} onChange={e=>setOrganForm(f=>({...f,donorPhone:e.target.value}))} placeholder="Contact number"/>
                </div>
                <div className="dash-field">
                  <label>Organ *</label>
                  <select value={organForm.organType} onChange={e=>setOrganForm(f=>({...f,organType:e.target.value}))}>
                    <option value="">Select organ</option>
                    {['kidney','liver','heart','lungs','cornea','bone_marrow','pancreas','other'].map(o=><option key={o} value={o}>{o.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div className="dash-field">
                  <label>Donor Type</label>
                  <select value={String(organForm.donorAlive)} onChange={e=>setOrganForm(f=>({...f,donorAlive:e.target.value==='true'}))}>
                    <option value="true">Living donor</option>
                    <option value="false">Posthumous pledge</option>
                  </select>
                </div>
              </div>
              <div className="dash-field">
                <label>Notes</label>
                <input value={organForm.notes} onChange={e=>setOrganForm(f=>({...f,notes:e.target.value}))} placeholder="Any conditions or notes"/>
              </div>
              <button className="dash-btn dash-btn-primary" style={{marginTop:'10px',background:'#8b5cf6'}} disabled={donLoading} onClick={async()=>{
                if(!organForm.donorName||!organForm.donorPhone||!organForm.organType){setDonError('Name, phone and organ type are required');return;}
                setDonLoading(true);setDonError('');setDonSuccess('');
                try{
                  const res=await fetch(`${DON_API}/donor-offer`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
                    body:JSON.stringify({donationType:'organ',donorName:organForm.donorName,donorPhone:organForm.donorPhone,donorEmail:localStorage.getItem('userEmail')||'',organType:organForm.organType,donorAlive:organForm.donorAlive,urgency:'normal',notes:organForm.notes})});
                  const d=await res.json();
                  if(!res.ok) throw new Error(d.message||'Failed');
                  setDonSuccess('✅ Organ pledge registered! Thank you for your generosity. Admin will contact you.');
                  setShowOrganForm(false);
                  setOrganForm({donorName:'',donorPhone:'',organType:'',donorAlive:true,notes:''});
                  const donRes=await fetch(`${DON_API}/my-donations`,{headers:{Authorization:`Bearer ${token}`}});
                  if(donRes.ok) setMyDonations(await donRes.json());
                }catch(e){setDonError(e.message);}
                finally{setDonLoading(false);}
              }}>{donLoading?'Submitting…':'Submit Organ Pledge'}</button>
            </div>
          )}

          {/* Financial quick form */}
          {showFinanceForm && (
            <div className="dash-lab-form" style={{marginBottom:'20px'}}>
              <h3 style={{color:'#10b981',marginBottom:'12px'}}>💰 Financial Aid</h3>
              <div className="dash-edit-row">
                <div className="dash-field">
                  <label>Your Name *</label>
                  <input value={finForm.donorName} onChange={e=>setFinForm(f=>({...f,donorName:e.target.value}))} placeholder="Full name"/>
                </div>
                <div className="dash-field">
                  <label>Amount (₹) *</label>
                  <input type="number" min="1" value={finForm.amountOffered} onChange={e=>setFinForm(f=>({...f,amountOffered:e.target.value}))} placeholder="e.g. 1000"/>
                </div>
                <div className="dash-field">
                  <label>Payment Mode *</label>
                  <select value={finForm.paymentMode} onChange={e=>setFinForm(f=>({...f,paymentMode:e.target.value}))}>
                    <option value="">Select</option>
                    {['UPI','Net Banking','Credit Card','Debit Card','Cash'].map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="dash-field">
                <label>Purpose / Notes</label>
                <input value={finForm.notes} onChange={e=>setFinForm(f=>({...f,notes:e.target.value}))} placeholder="What this aid is for"/>
              </div>
              <button className="dash-btn dash-btn-primary" style={{marginTop:'10px',background:'#10b981'}} disabled={donLoading} onClick={async()=>{
                if(!finForm.donorName||!finForm.amountOffered||!finForm.paymentMode){setDonError('Name, amount and payment mode are required');return;}
                setDonLoading(true);setDonError('');setDonSuccess('');
                try{
                  const res=await fetch(`${DON_API}/donor-offer`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
                    body:JSON.stringify({donationType:'financial',donorName:finForm.donorName,donorEmail:localStorage.getItem('userEmail')||'',amountOffered:Number(finForm.amountOffered),paymentMode:finForm.paymentMode,urgency:'normal',notes:finForm.notes})});
                  const d=await res.json();
                  if(!res.ok) throw new Error(d.message||'Failed');
                  setDonSuccess(`✅ Financial donation of ₹${finForm.amountOffered} registered! Admin will process and allocate it.`);
                  setShowFinanceForm(false);
                  setFinForm({donorName:'',amountOffered:'',paymentMode:'',purpose:'',notes:''});
                  const donRes=await fetch(`${DON_API}/my-donations`,{headers:{Authorization:`Bearer ${token}`}});
                  if(donRes.ok) setMyDonations(await donRes.json());
                }catch(e){setDonError(e.message);}
                finally{setDonLoading(false);}
              }}>{donLoading?'Submitting…':'Submit Financial Aid'}</button>
            </div>
          )}

          {/* Donation history list */}
          {myDonations.length === 0 ? (
            <div className="dash-empty">
              <Heart size={48} color="#d1d5db"/>
              <p>No donation history yet. Use the buttons above to donate blood, pledge an organ, or contribute financially.</p>
              <a href="/donation-dashboard" className="dash-add-btn" style={{display:'inline-flex',marginTop:'10px'}}>View Donation Portal</a>
            </div>
          ) : (
            <div className="dash-lab-list">
              {myDonations.map(d => {
                const typeIco  = {blood:'🩸',organ:'🫀',financial:'💰'}[d.donationType]||'📦';
                const typeClr  = {blood:'#ef4444',organ:'#8b5cf6',financial:'#10b981'}[d.donationType]||'#6b7280';
                const stClr    = {pending:'#f59e0b',approved:'#10b981',rejected:'#ef4444',matched:'#8b5cf6',fulfilled:'#3b82f6'}[d.status]||'#9ca3af';
                const stLabel  = {pending:'⏳ Pending Review',approved:'✅ Approved',rejected:'❌ Rejected',matched:'🔗 Matched',fulfilled:'🎉 Fulfilled'}[d.status]||d.status;
                let detail = '';
                if(d.donationType==='blood') detail = `${d.bloodGroup||'—'} · ${d.unitsOffered||d.unitsRequired||1} unit(s)`;
                if(d.donationType==='organ') detail = `${(d.organType||'').replace('_',' ')} · ${d.donorAlive?'Living donor':'Posthumous'}`;
                if(d.donationType==='financial') detail = d.amountOffered ? `₹${d.amountOffered} offered` : `₹${d.amountRequired} requested`;
                return (
                  <div key={d._id} className="dash-lab-card">
                    <div className="dash-lab-icon" style={{background:typeClr+'18',borderRadius:'10px',padding:'8px',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <span style={{fontSize:'22px'}}>{typeIco}</span>
                    </div>
                    <div className="dash-lab-info">
                      <h3 style={{textTransform:'capitalize'}}>{d.donationType} {d.requestType==='donor_offer'?'Donation':'Request'}</h3>
                      <div className="dash-lab-meta">
                        <span>{detail}</span>
                        <span>📅 {new Date(d.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                        {d.urgency && d.urgency!=='normal' && <span style={{color:'#f59e0b',fontWeight:600}}>⚠ {d.urgency.toUpperCase()}</span>}
                      </div>
                      {d.adminNote && <p className="dash-lab-notes" style={{color:'#3b82f6'}}>📝 Admin note: {d.adminNote}</p>}
                      {d.notes && <p className="dash-lab-notes">Notes: {d.notes}</p>}
                    </div>
                    <div className="dash-lab-actions">
                      <span style={{padding:'4px 10px',borderRadius:'99px',fontSize:'11px',fontWeight:700,background:stClr+'22',color:stClr,border:`1px solid ${stClr}44`,whiteSpace:'nowrap'}}>
                        {stLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

{/* ── ORDERS MEDICINE TAB */}
    {activeTab === 'orders' && (
    <div className="dash-section">
      <h2 className="dash-section-title">
        🧾 My Medicine Orders
      </h2>

      {orders.length === 0 ? (
        <div className="dash-empty">
          <p>You have not placed any medicine orders yet.</p>
          <button onClick={() => navigate('/medstore')} className="dash-btn dash-btn-primary">
            Browse Medicine Store
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-card-header">
                <span className="order-id">Order #{order._id.slice(-8).toUpperCase()}</span>
                <span
                  className="order-status-badge"
                  style={{
                    background:
                      order.orderStatus === 'Delivered' ? '#d1fae5' :
                      order.orderStatus === 'Shipped'   ? '#dbeafe' : '#fef3c7',
                    color:
                      order.orderStatus === 'Delivered' ? '#065f46' :
                      order.orderStatus === 'Shipped'   ? '#1e40af' : '#92400e',
                  }}
                >
                  {order.orderStatus}
                </span>
              </div>

              <div className="order-items-list">
                {order.items.map((item, i) => (
                  <div key={i} className="order-item-row">
                    <span>{item.name}</span>
                    <span>{item.quantity} × ₹{item.price}</span>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <span>Total: <strong>₹{order.totalAmount}</strong></span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )}

    </div>
  );
};

export default Dashboard;