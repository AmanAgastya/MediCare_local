import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Calendar, Pill, AlertCircle, CheckCircle,
  Edit2, Save, X, User, Droplets, Phone, RefreshCw,
  Stethoscope, FlaskConical, Activity
} from 'lucide-react';
import './MedicalHistory.css';

const API = 'http://localhost:5000/api/auth';

const BLOOD_GROUPS    = ['Unknown','A+','A-','B+','B-','AB+','AB-','O+','O-'];
const GENDER_OPTIONS  = ['','Male','Female','Other'];

const MedicalHistory = () => {
  const navigate = useNavigate();

  const [profile,      setProfile]      = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [labTests,     setLabTests]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [successMsg,   setSuccessMsg]   = useState('');
  const [activeTab,    setActiveTab]    = useState('profile'); // profile | diagnosis | treatments | labs
  const [editMode,     setEditMode]     = useState(false);
  const [form,         setForm]         = useState({});
  const [allergyInput,    setAllergyInput]    = useState('');
  const [conditionInput,  setConditionInput]  = useState('');
  const [medicationInput, setMedicationInput] = useState('');

  const token = localStorage.getItem('token');
  const authH = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const flash = (msg, isErr = false) => {
    if (isErr) { setError(msg); setTimeout(() => setError(''), 4000); }
    else        { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500); }
  };

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!token) { navigate('/user-login'); return; }
    setLoading(true);
    try {
      const [profRes, apptRes] = await Promise.all([
        fetch(`${API}/profile`,         { headers: authH }),
        fetch(`${API}/my-appointments`, { headers: authH }),
      ]);
      if (!profRes.ok) throw new Error('Not authenticated');
      const prof = await profRes.json();
      const appts = apptRes.ok ? await apptRes.json() : [];
      setProfile(prof);
      setForm({
        ...prof,
        allergies:           prof.allergies           || [],
        chronicConditions:   prof.chronicConditions   || [],
        currentMedications:  prof.currentMedications  || [],
        emergencyContact:    prof.emergencyContact     || { name: '', phone: '', relation: '' },
      });
      setAppointments(appts);
      setLabTests(prof.labTests || []);
    } catch (err) {
      if (err.message === 'Not authenticated') navigate('/user-login');
      else flash(err.message, true);
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Save Profile ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      const body = {
        phone:               form.phone,
        bloodGroup:          form.bloodGroup,
        dateOfBirth:         form.dateOfBirth,
        gender:              form.gender,
        address:             form.address,
        allergies:           form.allergies,
        chronicConditions:   form.chronicConditions,
        currentMedications:  form.currentMedications,
        emergencyContact:    form.emergencyContact,
      };
      const res = await fetch(`${API}/profile`, { method: 'PUT', headers: authH, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Failed to save profile');
      const updated = await res.json();
      setProfile(updated);
      setForm({ ...updated, allergies: updated.allergies || [], chronicConditions: updated.chronicConditions || [], currentMedications: updated.currentMedications || [], emergencyContact: updated.emergencyContact || {} });
      setEditMode(false);
      flash('✅ Medical profile updated successfully.');
    } catch (err) { flash(err.message, true); }
  };

  // ── Tag helpers ──────────────────────────────────────────────────────────
  const addTag    = (field, value, setter) => {
    if (!value.trim()) return;
    setForm(p => ({ ...p, [field]: [...(p[field] || []), value.trim()] }));
    setter('');
  };
  const removeTag = (field, index) =>
    setForm(p => ({ ...p, [field]: p[field].filter((_, i) => i !== index) }));

  // ── Appointment stats ────────────────────────────────────────────────────
  const acceptedAppts = appointments.filter(a => a.status === 'Accepted');

  const tabs = [
    { id: 'profile',    label: 'Health Profile',    icon: <User size={16} /> },
    { id: 'diagnosis',  label: 'Past Diagnosis',    icon: <Stethoscope size={16} /> },
    { id: 'treatments', label: 'Past Treatments',   icon: <Activity size={16} /> },
    { id: 'labs',       label: 'Lab Reports',       icon: <FlaskConical size={16} /> },
  ];

  if (loading) return (
    <div className="mh-page">
      <div className="mh-loading"><div className="mh-spinner" /><p>Loading your medical history…</p></div>
    </div>
  );

  return (
    <div className="mh-page">
      {/* Header */}
      <div className="mh-header">
        <div className="mh-header-left">
          <Heart size={32} color="#e74c3c" />
          <div>
            <h1>Medical History</h1>
            <p>Your complete personal health record — all in one place</p>
          </div>
        </div>
        <button className="mh-btn mh-btn-outline" onClick={fetchData}><RefreshCw size={16} /> Refresh</button>
      </div>

      {/* Flash messages */}
      {successMsg && <div className="mh-flash mh-flash-success"><CheckCircle size={16} /> {successMsg}</div>}
      {error      && <div className="mh-flash mh-flash-error"><AlertCircle size={16} /> {error}</div>}

      {/* Summary cards */}
      <div className="mh-summary-row">
        {[
          { label: 'Appointments',  val: appointments.length,  color: '#4a90e2', icon: <Calendar size={20} /> },
          { label: 'Treatments',    val: acceptedAppts.length, color: '#10b981', icon: <Activity size={20} /> },
          { label: 'Lab Tests',     val: labTests.length,      color: '#f59e0b', icon: <FlaskConical size={20} /> },
          { label: 'Medications',   val: profile?.currentMedications?.length || 0, color: '#8b5cf6', icon: <Pill size={20} /> },
        ].map(s => (
          <div key={s.label} className="mh-summary-card" style={{ borderLeftColor: s.color }}>
            <div className="mh-summary-icon" style={{ background: s.color + '18', color: s.color }}>{s.icon}</div>
            <div>
              <div className="mh-summary-num" style={{ color: s.color }}>{s.val}</div>
              <div className="mh-summary-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mh-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`mh-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Health Profile Tab ─────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="mh-card">
          <div className="mh-card-title-row">
            <h2><User size={18} /> Health Profile</h2>
            {!editMode
              ? <button className="mh-btn mh-btn-outline" onClick={() => setEditMode(true)}><Edit2 size={15} /> Edit</button>
              : <div className="mh-btn-group">
                  <button className="mh-btn mh-btn-outline" onClick={() => { setEditMode(false); setForm({ ...profile, allergies: profile.allergies||[], chronicConditions: profile.chronicConditions||[], currentMedications: profile.currentMedications||[], emergencyContact: profile.emergencyContact||{} }); }}><X size={15} /> Cancel</button>
                  <button className="mh-btn mh-btn-primary" onClick={handleSave}><Save size={15} /> Save</button>
                </div>
            }
          </div>

          <div className="mh-profile-grid">
            {/* Basic Info */}
            <div className="mh-section">
              <h3 className="mh-section-title"><User size={15} /> Basic Information</h3>
              <div className="mh-field-row">
                <div className="mh-field"><span className="mh-field-label">Full Name</span><span className="mh-field-val">{profile?.name || '—'}</span></div>
                <div className="mh-field"><span className="mh-field-label">Email</span><span className="mh-field-val">{profile?.email || '—'}</span></div>
                <div className="mh-field">
                  <span className="mh-field-label">Phone</span>
                  {editMode
                    ? <input className="mh-input" value={form.phone || ''} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                    : <span className="mh-field-val">{profile?.phone || '—'}</span>}
                </div>
                <div className="mh-field">
                  <span className="mh-field-label">Gender</span>
                  {editMode
                    ? <select className="mh-input" value={form.gender || ''} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                        {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g || '— Select —'}</option>)}
                      </select>
                    : <span className="mh-field-val">{profile?.gender || '—'}</span>}
                </div>
                <div className="mh-field">
                  <span className="mh-field-label">Date of Birth</span>
                  {editMode
                    ? <input className="mh-input" type="date" value={form.dateOfBirth?.split('T')[0] || ''} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} />
                    : <span className="mh-field-val">{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-IN') : '—'}</span>}
                </div>
                <div className="mh-field">
                  <span className="mh-field-label"><Droplets size={13} /> Blood Group</span>
                  {editMode
                    ? <select className="mh-input" value={form.bloodGroup || 'Unknown'} onChange={e => setForm(p => ({ ...p, bloodGroup: e.target.value }))}>
                        {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    : <span className="mh-field-val mh-blood">{profile?.bloodGroup || 'Unknown'}</span>}
                </div>
              </div>
              <div className="mh-field mh-field-full">
                <span className="mh-field-label">Address</span>
                {editMode
                  ? <textarea className="mh-input" rows={2} value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                  : <span className="mh-field-val">{profile?.address || '—'}</span>}
              </div>
            </div>

            {/* Medical Details */}
            <div className="mh-section">
              <h3 className="mh-section-title"><AlertCircle size={15} /> Known Allergies</h3>
              <div className="mh-tags">
                {(editMode ? form.allergies : profile?.allergies || []).map((a, i) => (
                  <span key={i} className="mh-tag mh-tag-red">
                    {a}
                    {editMode && <button className="mh-tag-remove" onClick={() => removeTag('allergies', i)}>×</button>}
                  </span>
                ))}
                {(editMode ? form.allergies : profile?.allergies || []).length === 0 && <span className="mh-empty-tag">None recorded</span>}
              </div>
              {editMode && (
                <div className="mh-tag-input-row">
                  <input className="mh-input" placeholder="Add allergy…" value={allergyInput} onChange={e => setAllergyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTag('allergies', allergyInput, setAllergyInput)} />
                  <button className="mh-btn mh-btn-sm" onClick={() => addTag('allergies', allergyInput, setAllergyInput)}>Add</button>
                </div>
              )}

              <h3 className="mh-section-title" style={{ marginTop: 20 }}><Heart size={15} /> Chronic Conditions</h3>
              <div className="mh-tags">
                {(editMode ? form.chronicConditions : profile?.chronicConditions || []).map((c, i) => (
                  <span key={i} className="mh-tag mh-tag-orange">
                    {c}
                    {editMode && <button className="mh-tag-remove" onClick={() => removeTag('chronicConditions', i)}>×</button>}
                  </span>
                ))}
                {(editMode ? form.chronicConditions : profile?.chronicConditions || []).length === 0 && <span className="mh-empty-tag">None recorded</span>}
              </div>
              {editMode && (
                <div className="mh-tag-input-row">
                  <input className="mh-input" placeholder="Add condition…" value={conditionInput} onChange={e => setConditionInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTag('chronicConditions', conditionInput, setConditionInput)} />
                  <button className="mh-btn mh-btn-sm" onClick={() => addTag('chronicConditions', conditionInput, setConditionInput)}>Add</button>
                </div>
              )}

              <h3 className="mh-section-title" style={{ marginTop: 20 }}><Pill size={15} /> Current Medications</h3>
              <div className="mh-tags">
                {(editMode ? form.currentMedications : profile?.currentMedications || []).map((m, i) => (
                  <span key={i} className="mh-tag mh-tag-blue">
                    {m}
                    {editMode && <button className="mh-tag-remove" onClick={() => removeTag('currentMedications', i)}>×</button>}
                  </span>
                ))}
                {(editMode ? form.currentMedications : profile?.currentMedications || []).length === 0 && <span className="mh-empty-tag">None recorded</span>}
              </div>
              {editMode && (
                <div className="mh-tag-input-row">
                  <input className="mh-input" placeholder="Add medication…" value={medicationInput} onChange={e => setMedicationInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTag('currentMedications', medicationInput, setMedicationInput)} />
                  <button className="mh-btn mh-btn-sm" onClick={() => addTag('currentMedications', medicationInput, setMedicationInput)}>Add</button>
                </div>
              )}
            </div>

            {/* Emergency Contact */}
            <div className="mh-section mh-section-full">
              <h3 className="mh-section-title"><Phone size={15} /> Emergency Contact</h3>
              <div className="mh-field-row">
                {['name', 'phone', 'relation'].map(field => (
                  <div key={field} className="mh-field">
                    <span className="mh-field-label">{field.charAt(0).toUpperCase() + field.slice(1)}</span>
                    {editMode
                      ? <input className="mh-input" value={form.emergencyContact?.[field] || ''}
                          onChange={e => setForm(p => ({ ...p, emergencyContact: { ...p.emergencyContact, [field]: e.target.value } }))} />
                      : <span className="mh-field-val">{profile?.emergencyContact?.[field] || '—'}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Past Diagnosis Tab ─────────────────────────────────────────────── */}
      {activeTab === 'diagnosis' && (
        <div className="mh-card">
          <h2 className="mh-card-h2"><Stethoscope size={18} /> Past Diagnosis (via Appointments)</h2>
          {appointments.length === 0 ? (
            <div className="mh-tab-empty">
              <Stethoscope size={40} color="#c5d8f8" />
              <p>No appointment history found.</p>
              <button className="mh-btn mh-btn-primary" onClick={() => navigate('/appointment-booking')}>Book an Appointment</button>
            </div>
          ) : (
            <div className="mh-appt-list">
              {appointments.map(appt => (
                <div key={appt._id} className={`mh-appt-row mh-appt-${appt.status?.toLowerCase()}`}>
                  <div className="mh-appt-left">
                    <div className="mh-appt-icon"><Calendar size={18} /></div>
                    <div>
                      <div className="mh-appt-title">{appt.doctor?.name ? `Dr. ${appt.doctor.name}` : 'Doctor'}</div>
                      <div className="mh-appt-sub">{appt.hospital?.hospitalName || 'Hospital'} · {appt.city}</div>
                      <div className="mh-appt-sub">{new Date(appt.date).toLocaleDateString('en-IN')} at {appt.time}</div>
                      {appt.additionalMessage && <div className="mh-appt-note">"{appt.additionalMessage}"</div>}
                    </div>
                  </div>
                  <span className={`mh-status-badge mh-status-${appt.status?.toLowerCase()}`}>{appt.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Past Treatments Tab ───────────────────────────────────────────── */}
      {activeTab === 'treatments' && (
        <div className="mh-card">
          <h2 className="mh-card-h2"><Activity size={18} /> Past Treatments</h2>

          {/* Chronic Conditions */}
          <div className="mh-treatment-section">
            <h3>Chronic Conditions Being Managed</h3>
            {(profile?.chronicConditions || []).length === 0
              ? <p className="mh-muted">No chronic conditions recorded. Update your health profile to add them.</p>
              : (profile.chronicConditions || []).map((c, i) => (
                  <div key={i} className="mh-treatment-row"><Heart size={15} color="#f59e0b" />{c}</div>
                ))
            }
          </div>

          {/* Current Medications */}
          <div className="mh-treatment-section">
            <h3>Current Medications</h3>
            {(profile?.currentMedications || []).length === 0
              ? <p className="mh-muted">No medications recorded.</p>
              : (profile.currentMedications || []).map((m, i) => (
                  <div key={i} className="mh-treatment-row"><Pill size={15} color="#8b5cf6" />{m}</div>
                ))
            }
          </div>

          {/* Accepted appointments = completed treatments */}
          <div className="mh-treatment-section">
            <h3>Completed Consultations</h3>
            {acceptedAppts.length === 0
              ? <p className="mh-muted">No completed consultations yet.</p>
              : acceptedAppts.map(appt => (
                  <div key={appt._id} className="mh-treatment-row mh-treatment-accepted">
                    <CheckCircle size={15} color="#10b981" />
                    <div>
                      <strong>{appt.doctor?.name ? `Dr. ${appt.doctor.name}` : 'Consultation'}</strong>
                      <span className="mh-muted"> · {appt.hospital?.hospitalName}</span>
                      <span className="mh-muted"> · {new Date(appt.date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {/* ── Lab Reports Tab ───────────────────────────────────────────────── */}
      {activeTab === 'labs' && (
        <div className="mh-card">
          <div className="mh-card-title-row">
            <h2 className="mh-card-h2" style={{ margin: 0 }}><FlaskConical size={18} /> Lab Reports</h2>
            <button className="mh-btn mh-btn-primary" onClick={() => navigate('/lab-tests')}><FlaskConical size={15} /> Schedule New Test</button>
          </div>
          {labTests.length === 0 ? (
            <div className="mh-tab-empty">
              <FlaskConical size={40} color="#c5d8f8" />
              <p>No lab tests recorded yet.</p>
              <button className="mh-btn mh-btn-primary" onClick={() => navigate('/lab-tests')}>Go to Lab Tests</button>
            </div>
          ) : (
            <div className="mh-lab-list">
              {labTests.map(t => (
                <div key={t._id} className="mh-lab-row">
                  <FlaskConical size={18} color="#4a90e2" />
                  <div className="mh-lab-info">
                    <strong>{t.testName}</strong>
                    <span>{new Date(t.testDate).toLocaleDateString('en-IN')}</span>
                    {t.labName && <span>{t.labName}</span>}
                    {t.notes   && <span className="mh-muted">"{t.notes}"</span>}
                  </div>
                  <span className={`mh-result-chip mh-result-${t.result?.toLowerCase()}`}>{t.result || 'Pending'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalHistory;