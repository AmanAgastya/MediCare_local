import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical, Plus, Edit2, Trash2, Save, X,
  Calendar, Building2, FileText, AlertCircle, CheckCircle, RefreshCw
} from 'lucide-react';
import './LabTests.css';

const API = 'http://localhost:5000/api/auth';

// Common lab tests catalogue
const COMMON_TESTS = [
  'Complete Blood Count (CBC)',
  'Blood Glucose (Fasting)',
  'Blood Glucose (Post-Prandial)',
  'HbA1c (Glycated Haemoglobin)',
  'Lipid Profile',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Thyroid Profile (T3/T4/TSH)',
  'Urine Routine & Microscopy',
  'Serum Vitamin D',
  'Serum Vitamin B12',
  'Iron Studies (Serum Iron, TIBC, Ferritin)',
  'HIV Test',
  'Hepatitis B Surface Antigen (HBsAg)',
  'Hepatitis C Antibody',
  'COVID-19 RT-PCR',
  'Dengue NS1 Antigen',
  'Malaria Antigen Test',
  'Chest X-Ray',
  'ECG (Electrocardiogram)',
  'Echocardiogram',
  'Ultrasound Abdomen',
  'CT Scan',
  'MRI Scan',
  'Pap Smear',
  'PSA (Prostate-Specific Antigen)',
  'C-Reactive Protein (CRP)',
  'ESR (Erythrocyte Sedimentation Rate)',
  'Stool Routine & Microscopy',
  'Other (custom)',
];

const RESULT_OPTIONS = ['Pending', 'Normal', 'Abnormal', 'Critical', 'Inconclusive'];

const emptyForm = {
  testName: '',
  customTestName: '',
  testDate: '',
  labName: '',
  result: 'Pending',
  notes: '',
};

const LabTests = () => {
  const navigate = useNavigate();
  const [labTests, setLabTests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [successMsg, setSuccessMsg]   = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm]               = useState(emptyForm);
  const [editingId, setEditingId]     = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [filter, setFilter]           = useState('all'); // all | Pending | Normal | Abnormal

  const token = localStorage.getItem('token');
  const authH = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const flash = (msg, isErr = false) => {
    if (isErr) { setError(msg); setTimeout(() => setError(''), 4000); }
    else        { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500); }
  };

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchLabTests = useCallback(async () => {
    if (!token) { navigate('/user-login'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/profile`, { headers: authH });
      if (!res.ok) throw new Error('Not authenticated');
      const data = await res.json();
      setLabTests(data.labTests || []);
    } catch (err) {
      if (err.message === 'Not authenticated') navigate('/user-login');
      else flash(err.message, true);
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => { fetchLabTests(); }, [fetchLabTests]);

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    const testName = form.testName === 'Other (custom)' ? form.customTestName.trim() : form.testName;
    if (!testName)      { flash('Please select or enter a test name.', true); return; }
    if (!form.testDate) { flash('Test date is required.', true); return; }

    try {
      const body = { testName, testDate: form.testDate, labName: form.labName, result: form.result, notes: form.notes };
      const res  = await fetch(`${API}/lab-tests`, { method: 'POST', headers: authH, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to add test');
      setLabTests(await res.json());
      setForm(emptyForm);
      setShowAddForm(false);
      flash('✅ Lab test scheduled successfully!');
    } catch (err) { flash(err.message, true); }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const startEdit = (test) => { setEditingId(test._id); setEditForm({ ...test }); };
  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const handleSaveEdit = async () => {
    if (!editForm.testName || !editForm.testDate) { flash('Test name and date are required.', true); return; }
    try {
      const res = await fetch(`${API}/lab-tests/${editingId}`, {
        method: 'PUT', headers: authH, body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to update');
      setLabTests(await res.json());
      setEditingId(null);
      flash('✅ Lab test updated.');
    } catch (err) { flash(err.message, true); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lab test record?')) return;
    try {
      const res = await fetch(`${API}/lab-tests/${id}`, { method: 'DELETE', headers: authH });
      if (!res.ok) throw new Error('Failed to delete');
      setLabTests(await res.json());
      flash('🗑 Lab test deleted.');
    } catch (err) { flash(err.message, true); }
  };

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = filter === 'all' ? labTests : labTests.filter(t => t.result === filter);

  const resultColor = { Pending: '#f59e0b', Normal: '#10b981', Abnormal: '#ef4444', Critical: '#7c3aed', Inconclusive: '#6b7280' };

  const today = new Date().toISOString().split('T')[0];

  if (loading) return (
    <div className="lt-page">
      <div className="lt-loading"><div className="lt-spinner" /><p>Loading your lab records…</p></div>
    </div>
  );

  return (
    <div className="lt-page">
      {/* Header */}
      <div className="lt-header">
        <div className="lt-header-left">
          <FlaskConical size={32} color="#4a90e2" />
          <div>
            <h1>Lab Tests & Reports</h1>
            <p>Schedule tests, track results and view your full lab history</p>
          </div>
        </div>
        <div className="lt-header-actions">
          <button className="lt-btn lt-btn-outline" onClick={fetchLabTests} title="Refresh">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="lt-btn lt-btn-primary" onClick={() => { setShowAddForm(true); setForm(emptyForm); }}>
            <Plus size={16} /> Schedule Test
          </button>
        </div>
      </div>

      {/* Flash messages */}
      {successMsg && <div className="lt-flash lt-flash-success"><CheckCircle size={16} /> {successMsg}</div>}
      {error      && <div className="lt-flash lt-flash-error"><AlertCircle size={16} /> {error}</div>}

      {/* Stats */}
      <div className="lt-stats-row">
        {[
          { label: 'Total Tests',   val: labTests.length,                                       color: '#4a90e2' },
          { label: 'Pending',       val: labTests.filter(t => t.result === 'Pending').length,   color: '#f59e0b' },
          { label: 'Normal',        val: labTests.filter(t => t.result === 'Normal').length,    color: '#10b981' },
          { label: 'Abnormal',      val: labTests.filter(t => t.result === 'Abnormal').length,  color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="lt-stat-card" style={{ borderTopColor: s.color }}>
            <span className="lt-stat-num" style={{ color: s.color }}>{s.val}</span>
            <span className="lt-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="lt-add-card">
          <div className="lt-card-title-row">
            <h2><Plus size={18} /> Schedule a New Lab Test</h2>
            <button className="lt-icon-btn" onClick={() => setShowAddForm(false)}><X size={18} /></button>
          </div>
          <form onSubmit={handleAdd} className="lt-form">
            <div className="lt-form-grid">
              <div className="lt-form-group lt-full-width">
                <label>Test Name *</label>
                <select
                  value={form.testName}
                  onChange={e => setForm(p => ({ ...p, testName: e.target.value, customTestName: '' }))}
                  required
                >
                  <option value="">— Select a test —</option>
                  {COMMON_TESTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {form.testName === 'Other (custom)' && (
                <div className="lt-form-group lt-full-width">
                  <label>Custom Test Name *</label>
                  <input
                    type="text"
                    value={form.customTestName}
                    onChange={e => setForm(p => ({ ...p, customTestName: e.target.value }))}
                    placeholder="Enter the test name"
                    required
                  />
                </div>
              )}

              <div className="lt-form-group">
                <label>Scheduled Date *</label>
                <input
                  type="date"
                  value={form.testDate}
                  min={today}
                  onChange={e => setForm(p => ({ ...p, testDate: e.target.value }))}
                  required
                />
              </div>

              <div className="lt-form-group">
                <label>Lab / Hospital Name</label>
                <input
                  type="text"
                  value={form.labName}
                  onChange={e => setForm(p => ({ ...p, labName: e.target.value }))}
                  placeholder="e.g. Thyrocare, Apollo Diagnostics"
                />
              </div>

              <div className="lt-form-group">
                <label>Result Status</label>
                <select value={form.result} onChange={e => setForm(p => ({ ...p, result: e.target.value }))}>
                  {RESULT_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="lt-form-group lt-full-width">
                <label>Notes / Findings</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Doctor's notes, reference ranges, abnormal findings…"
                  rows={3}
                />
              </div>
            </div>
            <div className="lt-form-actions">
              <button type="button" className="lt-btn lt-btn-outline" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button type="submit" className="lt-btn lt-btn-primary"><Save size={16} /> Schedule Test</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="lt-filter-row">
        <span className="lt-filter-label">Filter:</span>
        {['all', 'Pending', 'Normal', 'Abnormal', 'Critical', 'Inconclusive'].map(f => (
          <button
            key={f}
            className={`lt-filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f}
            {f !== 'all' && <span className="lt-filter-count">{labTests.filter(t => t.result === f).length}</span>}
          </button>
        ))}
      </div>

      {/* Test List */}
      {filtered.length === 0 ? (
        <div className="lt-empty">
          <FlaskConical size={48} color="#c5d8f8" />
          <h3>{labTests.length === 0 ? 'No lab tests scheduled yet' : `No ${filter} tests`}</h3>
          <p>{labTests.length === 0 ? 'Click "Schedule Test" to add your first lab appointment.' : 'Try a different filter.'}</p>
          {labTests.length === 0 && (
            <button className="lt-btn lt-btn-primary" onClick={() => setShowAddForm(true)}>
              <Plus size={16} /> Schedule Your First Test
            </button>
          )}
        </div>
      ) : (
        <div className="lt-list">
          {filtered.map(test => (
            <div key={test._id} className="lt-card">
              {editingId === test._id ? (
                /* ── Edit Mode ─────────────────────────────────────────── */
                <div className="lt-edit-form">
                  <div className="lt-form-grid">
                    <div className="lt-form-group lt-full-width">
                      <label>Test Name *</label>
                      <input
                        type="text"
                        value={editForm.testName}
                        onChange={e => setEditForm(p => ({ ...p, testName: e.target.value }))}
                      />
                    </div>
                    <div className="lt-form-group">
                      <label>Date *</label>
                      <input type="date" value={editForm.testDate?.split('T')[0] || ''}
                        onChange={e => setEditForm(p => ({ ...p, testDate: e.target.value }))} />
                    </div>
                    <div className="lt-form-group">
                      <label>Lab Name</label>
                      <input type="text" value={editForm.labName || ''}
                        onChange={e => setEditForm(p => ({ ...p, labName: e.target.value }))} />
                    </div>
                    <div className="lt-form-group">
                      <label>Result</label>
                      <select value={editForm.result || 'Pending'}
                        onChange={e => setEditForm(p => ({ ...p, result: e.target.value }))}>
                        {RESULT_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="lt-form-group lt-full-width">
                      <label>Notes</label>
                      <textarea value={editForm.notes || ''} rows={3}
                        onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
                    </div>
                  </div>
                  <div className="lt-form-actions">
                    <button className="lt-btn lt-btn-outline" onClick={cancelEdit}><X size={14} /> Cancel</button>
                    <button className="lt-btn lt-btn-primary" onClick={handleSaveEdit}><Save size={14} /> Save</button>
                  </div>
                </div>
              ) : (
                /* ── View Mode ─────────────────────────────────────────── */
                <div className="lt-card-body">
                  <div className="lt-card-main">
                    <div className="lt-test-icon-wrap">
                      <FlaskConical size={22} color="#4a90e2" />
                    </div>
                    <div className="lt-test-info">
                      <h3 className="lt-test-name">{test.testName}</h3>
                      <div className="lt-test-meta">
                        <span><Calendar size={13} /> {new Date(test.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {test.labName && <span><Building2 size={13} /> {test.labName}</span>}
                      </div>
                      {test.notes && (
                        <p className="lt-test-notes"><FileText size={13} /> {test.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="lt-card-right">
                    <span
                      className="lt-result-badge"
                      style={{ background: resultColor[test.result] + '20', color: resultColor[test.result], borderColor: resultColor[test.result] + '60' }}
                    >
                      {test.result}
                    </span>
                    <div className="lt-card-actions">
                      <button className="lt-icon-btn lt-icon-edit" onClick={() => startEdit(test)} title="Edit"><Edit2 size={15} /></button>
                      <button className="lt-icon-btn lt-icon-delete" onClick={() => handleDelete(test._id)} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="lt-info-box">
        <AlertCircle size={16} color="#4a90e2" />
        <p>Lab test records are stored securely in your health profile. You can also view and manage them from your <button className="lt-link-btn" onClick={() => navigate('/dashboard')}>Dashboard → Lab Tests tab</button>.</p>
      </div>
    </div>
  );
};

export default LabTests;