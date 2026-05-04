import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Calendar, Users, LogOut, Clock, User, RefreshCw,
  FileText, Save, X, Plus } from 'lucide-react';
import './DoctorDashboard.css';

const API = 'http://localhost:5000/api/auth/hospital';

/* const STATUS_COLOR = {
  Pending:  '#f59e0b',
  Accepted: '#10b981',
  Running:  '#3b82f6',
  Done:     '#8b5cf6',
  Denied:   '#ef4444',
  Cancelled:'#9ca3af',
};  */

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [doctorName]     = useState(localStorage.getItem('doctorName') || '');
  const [specialization] = useState(localStorage.getItem('doctorSpecialization') || '');
  const [hospitalName]   = useState(localStorage.getItem('doctorHospitalName') || '');

  const [appointments, setAppointments] = useState([]);
  const [todayQueue,   setTodayQueue]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [activeTab,    setActiveTab]    = useState('overview');

  // Report modal state
  const [reportAppt,   setReportAppt]   = useState(null);
  const [reportForm,   setReportForm]   = useState({ diagnosis:'', prescription:'', notes:'', followUpDate:'' });
  const [reportSaving, setReportSaving] = useState(false);

  // Test suggestion state
  const [testApptId,   setTestApptId]   = useState(null);
  const [testName,     setTestName]     = useState('');
  const [testReason,   setTestReason]   = useState('');
  const [testUrgency,  setTestUrgency]  = useState('Routine');

  const authH = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('doctorToken')}`
  });

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('doctorToken');
    if (!token) { navigate('/doctor-login'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/doctor/dashboard`, { headers: authH() });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Failed to load dashboard');
      }
      const data = await res.json();
      setAppointments(data.appointments || []);
      setTodayQueue(data.todayQueue || []);
    } catch (err) {
      setError(err.message);
      if (err.message === 'Not authorized as a doctor') navigate('/doctor-login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Update appointment status ────────────────────────────────────────────
  const setStatus = async (apptId, status) => {
    try {
      const res = await fetch(`${API}/doctor/appointments/${apptId}/status`, {
        method: 'PUT', headers: authH(), body: JSON.stringify({ status })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      const updated = await res.json();
      setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
    } catch (err) { setError(err.message); }
  };

  // ── Save report ──────────────────────────────────────────────────────────
  const saveReport = async () => {
    setReportSaving(true);
    try {
      const res = await fetch(`${API}/doctor/appointments/${reportAppt._id}/report`, {
        method: 'PUT', headers: authH(), body: JSON.stringify(reportForm)
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      const updated = await res.json();
      setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
      setReportAppt(null);
    } catch (err) { setError(err.message); }
    setReportSaving(false);
  };

  // ── Add test suggestion ──────────────────────────────────────────────────
  const addTest = async (apptId) => {
    if (!testName.trim()) return;
    try {
      const res = await fetch(`${API}/doctor/appointments/${apptId}/tests`, {
        method: 'POST', headers: authH(),
        body: JSON.stringify({ testName, reason: testReason, urgency: testUrgency })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      const updated = await res.json();
      setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
      setTestName(''); setTestReason(''); setTestUrgency('Routine'); setTestApptId(null);
    } catch (err) { setError(err.message); }
  };

  const removeTest = async (apptId, testId) => {
    try {
      const res = await fetch(`${API}/doctor/appointments/${apptId}/tests/${testId}`, {
        method: 'DELETE', headers: authH()
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      const updated = await res.json();
      setAppointments(prev => prev.map(a => a._id === updated._id ? updated : a));
    } catch (err) { setError(err.message); }
  };

  const handleLogout = () => {
    ['doctorToken','doctorName','doctorSpecialization','doctorHospitalName','doctorHospitalId','userName']
      .forEach(k => localStorage.removeItem(k));
    window.dispatchEvent(new Event('storage'));
    navigate('/doctor-login');
  };

  if (loading) return <div className="dd-loading"><div className="dd-spinner" /><p>Loading…</p></div>;

  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter(a => a.date?.slice(0, 10) === today);
  const activeQueue = todayQueue.filter(q => q.status === 'Waiting' || q.status === 'In Progress');

  return (
    <div className="dd-container">
      {/* Header */}
      <div className="dd-header">
        <div className="dd-header-left">
          <div className="dd-avatar"><Stethoscope size={28} color="#fff" /></div>
          <div>
            <h1 className="dd-title">Dr. {doctorName}</h1>
            <p className="dd-sub">{specialization} · {hospitalName}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="dd-logout" style={{ background:'#3b82f6' }} onClick={fetchData}>
            <RefreshCw size={16} />
          </button>
          <button className="dd-logout" onClick={handleLogout}><LogOut size={18} /> Logout</button>
        </div>
      </div>

      {error && (
        <div className="dd-error" style={{ background:'#fff1f2', color:'#be123c', padding:'10px 16px',
          borderRadius:8, margin:'0 0 16px', display:'flex', justifyContent:'space-between' }}>
          ⚠️ {error}
          <button onClick={() => setError('')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18 }}>×</button>
        </div>
      )}

      {/* Stats */}
      <div className="dd-stats">
        <div className="dd-stat"><Calendar size={22} color="#4a90e2" /><span className="dd-stat-num">{appointments.length}</span><span>Total Appts</span></div>
        <div className="dd-stat"><Clock size={22} color="#f59e0b" /><span className="dd-stat-num">{activeQueue.length}</span><span>In Queue Today</span></div>
        <div className="dd-stat"><Users size={22} color="#10b981" /><span className="dd-stat-num">{todayAppts.length}</span><span>Today's Appts</span></div>
        <div className="dd-stat"><FileText size={22} color="#8b5cf6" /><span className="dd-stat-num">{appointments.filter(a => a.status === 'Done').length}</span><span>Completed</span></div>
      </div>

      {/* Tabs */}
      <div className="dd-tabs">
        {[
          { id:'overview',     label:'Overview' },
          { id:'appointments', label:`Today (${todayAppts.length})` },
          { id:'all',          label:`All Appts (${appointments.length})` },
          { id:'queue',        label:`Queue (${activeQueue.length})` },
        ].map(t => (
          <button key={t.id} className={`dd-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="dd-card">
          <h2>My Profile</h2>
          <div className="dd-profile-rows">
            <div className="dd-profile-row"><User size={18} color="#4a90e2" /><span><b>Name:</b> Dr. {doctorName}</span></div>
            <div className="dd-profile-row"><Stethoscope size={18} color="#4a90e2" /><span><b>Specialization:</b> {specialization}</span></div>
            <div className="dd-profile-row"><Calendar size={18} color="#4a90e2" /><span><b>Hospital:</b> {hospitalName}</span></div>
          </div>
          <div className="dd-info-box">
            <p>👋 Welcome back, Dr. {doctorName}. Use the tabs above to manage today's appointments and patient queue.</p>
          </div>
        </div>
      )}

      {/* ── TODAY'S APPOINTMENTS ──────────────────────────────────────────── */}
      {activeTab === 'appointments' && (
        <div className="dd-card">
          <h2>Today's Appointments ({todayAppts.length})</h2>
          {todayAppts.length === 0
            ? <p className="dd-empty">No appointments scheduled for today.</p>
            : <AppointmentList appts={todayAppts} onSetStatus={setStatus}
                onOpenReport={(a) => { setReportAppt(a); setReportForm({ diagnosis: a.doctorReport?.diagnosis||'', prescription: a.doctorReport?.prescription||'', notes: a.doctorReport?.notes||'', followUpDate: a.doctorReport?.followUpDate?.slice(0,10)||'' }); }}
                onToggleTest={(id) => setTestApptId(testApptId === id ? null : id)}
                testApptId={testApptId} testName={testName} testReason={testReason} testUrgency={testUrgency}
                setTestName={setTestName} setTestReason={setTestReason} setTestUrgency={setTestUrgency}
                onAddTest={addTest} onRemoveTest={removeTest} />
          }
        </div>
      )}

      {/* ── ALL APPOINTMENTS ──────────────────────────────────────────────── */}
      {activeTab === 'all' && (
        <div className="dd-card">
          <h2>All Appointments ({appointments.length})</h2>
          {appointments.length === 0
            ? <p className="dd-empty">No appointments yet.</p>
            : <AppointmentList appts={appointments} onSetStatus={setStatus}
                onOpenReport={(a) => { setReportAppt(a); setReportForm({ diagnosis: a.doctorReport?.diagnosis||'', prescription: a.doctorReport?.prescription||'', notes: a.doctorReport?.notes||'', followUpDate: a.doctorReport?.followUpDate?.slice(0,10)||'' }); }}
                onToggleTest={(id) => setTestApptId(testApptId === id ? null : id)}
                testApptId={testApptId} testName={testName} testReason={testReason} testUrgency={testUrgency}
                setTestName={setTestName} setTestReason={setTestReason} setTestUrgency={setTestUrgency}
                onAddTest={addTest} onRemoveTest={removeTest} />
          }
        </div>
      )}

      {/* ── QUEUE ─────────────────────────────────────────────────────────── */}
      {activeTab === 'queue' && (
        <div className="dd-card">
          <h2>Today's Patient Queue ({activeQueue.length} active)</h2>
          {todayQueue.length === 0
            ? <p className="dd-empty">No patients in queue today.</p>
            : (
              <div className="dd-queue-list">
                {todayQueue.map(q => (
                  <div key={q._id} className="dd-queue-row">
                    <div className="dd-token">#{q.tokenNumber}</div>
                    <div>
                      <strong>{q.patientName}</strong>
                      {q.patientPhone && <span className="dd-phone"> · {q.patientPhone}</span>}
                    </div>
                    <span className={`dd-badge dd-badge-${q.status.toLowerCase().replace(' ','-')}`}>{q.status}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* ── REPORT MODAL ──────────────────────────────────────────────────── */}
      {reportAppt && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex',
          alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}>
          <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:520,
            boxShadow:'0 20px 60px rgba(0,0,0,0.2)', overflow:'hidden' }}>
            <div style={{ background:'linear-gradient(135deg,#1e40af,#3b82f6)', padding:'16px 20px',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ color:'#fff', fontWeight:700, fontSize:16 }}>📋 Report — {reportAppt.fullName}</div>
              <button onClick={() => setReportAppt(null)} style={{ background:'rgba(255,255,255,0.2)',
                border:'none', color:'#fff', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:18 }}>✕</button>
            </div>
            <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { label:'Diagnosis', key:'diagnosis', rows:2 },
                { label:'Prescription / Medications', key:'prescription', rows:2 },
                { label:'Notes', key:'notes', rows:2 },
              ].map(({ label, key, rows }) => (
                <div key={key}>
                  <label style={{ fontSize:13, fontWeight:600, color:'#475569', display:'block', marginBottom:4 }}>{label}</label>
                  <textarea value={reportForm[key]} rows={rows}
                    onChange={e => setReportForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width:'100%', borderRadius:7, border:'1px solid #cbd5e1', padding:'8px 10px',
                      fontSize:13, resize:'vertical', fontFamily:'inherit', boxSizing:'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#475569', display:'block', marginBottom:4 }}>Follow-up Date</label>
                <input type="date" value={reportForm.followUpDate}
                  onChange={e => setReportForm(f => ({ ...f, followUpDate: e.target.value }))}
                  style={{ borderRadius:7, border:'1px solid #cbd5e1', padding:'7px 10px', fontSize:13 }} />
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
                <button onClick={() => setReportAppt(null)} style={{ padding:'8px 18px', borderRadius:7,
                  border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontWeight:600 }}>Cancel</button>
                <button onClick={saveReport} disabled={reportSaving} style={{ padding:'8px 20px', borderRadius:7,
                  background:'linear-gradient(135deg,#1e40af,#3b82f6)', color:'#fff', border:'none',
                  cursor:reportSaving?'wait':'pointer', fontWeight:700 }}>
                  {reportSaving ? 'Saving…' : <><Save size={14} style={{ marginRight:6 }}/>Save Report</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Reusable appointment list sub-component ───────────────────────────────────
function AppointmentList({ appts, onSetStatus, onOpenReport, onToggleTest,
  testApptId, testName, testReason, testUrgency,
  setTestName, setTestReason, setTestUrgency, onAddTest, onRemoveTest }) {

  const STATUS_COLOR = {
    Pending:'#f59e0b', Accepted:'#10b981', Running:'#3b82f6',
    Done:'#8b5cf6', Denied:'#ef4444', Cancelled:'#9ca3af',
  };

  return (
    <div className="dd-appt-list">
      {appts.map(a => (
        <div key={a._id} className="dd-appt-row" style={{ flexDirection:'column', alignItems:'stretch', gap:10 }}>
          {/* Top row */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
            <div>
              <strong>{a.fullName}</strong>
              <span className="dd-appt-date"> · {new Date(a.date).toLocaleDateString('en-IN')} at {a.time}</span>
              <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>📞 {a.phoneNumber}</div>
              {a.queueToken && <div style={{ fontSize:12, color:'#1d4ed8', marginTop:2 }}>🎫 Token #{a.queueToken}</div>}
              {a.additionalMessage && <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>💬 {a.additionalMessage}</div>}
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
              <span className="dd-badge" style={{ background: STATUS_COLOR[a.status]+'22', color: STATUS_COLOR[a.status],
                border:`1px solid ${STATUS_COLOR[a.status]}`, padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>
                {a.status}
              </span>
              <div style={{ display:'flex', gap:5 }}>
                {(a.status === 'Accepted') && (
                  <button onClick={() => onSetStatus(a._id, 'Running')}
                    style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid #bfdbfe',
                      background:'#eff6ff', color:'#1d4ed8', cursor:'pointer', fontWeight:600 }}>▶ Running</button>
                )}
                {(a.status === 'Accepted' || a.status === 'Running') && (
                  <button onClick={() => onSetStatus(a._id, 'Done')}
                    style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid #bbf7d0',
                      background:'#f0fdf4', color:'#15803d', cursor:'pointer', fontWeight:600 }}>✔ Done</button>
                )}
                <button onClick={() => onOpenReport(a)}
                  style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid #ddd6fe',
                    background:'#f5f3ff', color:'#6d28d9', cursor:'pointer', fontWeight:600 }}>📋 Report</button>
                <button onClick={() => onToggleTest(a._id)}
                  style={{ fontSize:11, padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0',
                    background:'#f8fafc', color:'#475569', cursor:'pointer', fontWeight:600 }}>🧪 Tests</button>
              </div>
            </div>
          </div>

          {/* Report summary */}
          {a.doctorReport?.diagnosis && (
            <div style={{ background:'#fafaf9', border:'1px solid #e7e5e4', borderRadius:8, padding:'10px 12px', fontSize:13 }}>
              <span style={{ color:'#78716c', fontWeight:700 }}>Diagnosis: </span>{a.doctorReport.diagnosis}
              {a.doctorReport.prescription && <span style={{ marginLeft:16, color:'#78716c' }}>Rx: {a.doctorReport.prescription}</span>}
            </div>
          )}

          {/* Test suggestions */}
          {a.testSuggestions?.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {a.testSuggestions.map(t => (
                <span key={t._id} style={{ fontSize:11, padding:'3px 10px', borderRadius:20,
                  background: t.urgency==='Emergency'?'#fff1f2': t.urgency==='Urgent'?'#fff7ed':'#f0fdf4',
                  color: t.urgency==='Emergency'?'#be123c': t.urgency==='Urgent'?'#c2410c':'#15803d',
                  border:'1px solid currentColor', display:'flex', alignItems:'center', gap:4 }}>
                  🧪 {t.testName} ({t.urgency})
                  <button onClick={() => onRemoveTest(a._id, t._id)}
                    style={{ background:'none', border:'none', cursor:'pointer', padding:0, fontSize:13, lineHeight:1 }}>×</button>
                </span>
              ))}
            </div>
          )}

          {/* Add test panel */}
          {testApptId === a._id && (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', background:'#f8fafc',
              border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 12px' }}>
              <input value={testName} onChange={e => setTestName(e.target.value)}
                placeholder="Test name (e.g. CBC)"
                style={{ flex:'2 1 120px', borderRadius:6, border:'1px solid #cbd5e1', padding:'6px 8px', fontSize:13 }} />
              <input value={testReason} onChange={e => setTestReason(e.target.value)}
                placeholder="Reason (optional)"
                style={{ flex:'3 1 140px', borderRadius:6, border:'1px solid #cbd5e1', padding:'6px 8px', fontSize:13 }} />
              <select value={testUrgency} onChange={e => setTestUrgency(e.target.value)}
                style={{ flex:'1 1 90px', borderRadius:6, border:'1px solid #cbd5e1', padding:'6px 8px', fontSize:13 }}>
                <option>Routine</option><option>Urgent</option><option>Emergency</option>
              </select>
              <button onClick={() => onAddTest(a._id)}
                style={{ borderRadius:6, border:'none', background:'#1e40af', color:'#fff',
                  padding:'6px 14px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                <Plus size={13} /> Add
              </button>
              <button onClick={() => onToggleTest(a._id)}
                style={{ borderRadius:6, border:'1px solid #e2e8f0', background:'#fff',
                  padding:'6px 10px', fontSize:13, cursor:'pointer' }}>
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default DoctorDashboard;