import React, { useState, useEffect } from 'react';
import { IndianRupee, Clock, Heart, Activity, CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FinancialAid.css';

const API = 'http://localhost:5000';

const AMOUNTS = [500, 1000, 2500, 5000, 10000];

const FinancialAid = () => {
  const navigate = useNavigate();
  const [showDonateForm, setShowDonateForm]   = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [myDonations, setMyDonations] = useState([]);

  const token     = localStorage.getItem('token');
  const userName  = localStorage.getItem('userName') || '';
  const userEmail = localStorage.getItem('userEmail') || '';

  const [donateForm, setDonateForm] = useState({
    donorName: userName, donorEmail: userEmail, donorPhone: '',
    amountOffered: '', customAmount: '', paymentMode: '', notes: ''
  });
  const [requestForm, setRequestForm] = useState({
    patientName: '', contactPhone: '', amountRequired: '',
    purpose: '', paymentMode: '', urgency: 'normal', notes: ''
  });

  useEffect(() => {
    setDonateForm(f => ({
      ...f,
      donorName:  localStorage.getItem('userName') || '',
      donorEmail: localStorage.getItem('userEmail') || ''
    }));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/donations/my-donations?type=financial`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(setMyDonations)
      .catch(() => {});
  }, [token, success]);

  const requireLogin = () => {
    setError('Please log in first to submit a financial donation.');
    setTimeout(() => navigate('/user-login'), 1500);
  };

  const getAmount = () => {
    if (donateForm.amountOffered === 'other') return Number(donateForm.customAmount);
    return Number(donateForm.amountOffered);
  };

  const submitDonate = async (e) => {
    e.preventDefault();
    if (!token) { requireLogin(); return; }
    const amt = getAmount();
    if (!amt || amt <= 0) { setError('Please enter a valid donation amount.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/donations/donor-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          donationType:  'financial',
          donorName:     donateForm.donorName,
          donorEmail:    donateForm.donorEmail,
          donorPhone:    donateForm.donorPhone,
          amountOffered: amt,
          paymentMode:   donateForm.paymentMode,
          urgency:       'normal',
          notes:         donateForm.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setSuccess(`✅ Your donation of ₹${amt} has been submitted! Admin will process and allocate it to a patient in need.`);
      setShowDonateForm(false);
      setDonateForm(f => ({ ...f, amountOffered:'', customAmount:'', paymentMode:'', notes:'' }));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!token) { requireLogin(); return; }
    if (!requestForm.amountRequired || Number(requestForm.amountRequired) <= 0) { setError('Please enter a valid amount required.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/donations/donor-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          donationType:   'financial',
          donorName:      requestForm.patientName,
          donorPhone:     requestForm.contactPhone,
          amountRequired: Number(requestForm.amountRequired),
          amountOffered:  0,
          paymentMode:    requestForm.paymentMode,
          patientName:    requestForm.patientName,
          purpose:        requestForm.purpose,
          urgency:        requestForm.urgency,
          notes:          requestForm.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setSuccess('✅ Financial aid request submitted! Admin will review and process your request.');
      setShowRequestForm(false);
      setRequestForm({ patientName:'', contactPhone:'', amountRequired:'', purpose:'', paymentMode:'', urgency:'normal', notes:'' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const statusColor = { pending:'#f59e0b', approved:'#10b981', rejected:'#ef4444', matched:'#8b5cf6', fulfilled:'#3b82f6' };

  return (
    <div className="financialaid-container">
      <h1 className="financialaid-header">Financial Aid Portal</h1>

      <div className="financialaid-content">
        <p>Empower lives through financial support. Your donation can be the lifeline someone desperately needs —
          supporting surgeries, treatments, and essential healthcare costs for those who cannot afford it.</p>
      </div>

      {/* Auth notice */}
      {!token && (
        <div style={{background:'#fef3c7',border:'1px solid #f59e0b',borderRadius:'10px',padding:'12px 16px',margin:'16px 0',display:'flex',alignItems:'center',gap:'10px',color:'#92400e',fontSize:'14px'}}>
          <LogIn size={18}/> <span>You must be <strong>logged in</strong> to donate or request financial aid. <button onClick={()=>navigate('/user-login')} style={{color:'#2563eb',background:'none',border:'none',cursor:'pointer',fontWeight:600,textDecoration:'underline'}}>Login here</button></span>
        </div>
      )}

      {success && (
        <div style={{background:'#d1fae5',border:'1px solid #10b981',borderRadius:'10px',padding:'12px 16px',margin:'12px 0',display:'flex',alignItems:'center',gap:'10px',color:'#065f46',fontSize:'14px'}}>
          <CheckCircle size={18}/> {success}
        </div>
      )}
      {error && (
        <div style={{background:'#fee2e2',border:'1px solid #ef4444',borderRadius:'10px',padding:'12px 16px',margin:'12px 0',display:'flex',alignItems:'center',gap:'10px',color:'#991b1b',fontSize:'14px'}}>
          <AlertCircle size={18}/> {error}
        </div>
      )}

      <div className="financialaid-info">
        <h2>Why Donate?</h2>
        <div className="financialaid-benefits">
          <div className="benefit-item"><IndianRupee size={24}/><h3>Change Lives</h3><p>One donation can cover life-saving treatment costs</p></div>
          <div className="benefit-item"><Clock size={24}/><h3>Quick Process</h3><p>It takes only a few minutes to donate</p></div>
          <div className="benefit-item"><Heart size={24}/><h3>Immediate Impact</h3><p>Your donation provides instant relief</p></div>
          <div className="benefit-item"><Activity size={24}/><h3>Transparent Use</h3><p>Admin verifies and allocates every rupee</p></div>
        </div>
      </div>

      <div className="financialaid-actions">
        <button className="financialaid-action-button" onClick={() => { setShowDonateForm(s => !s); setShowRequestForm(false); setError(''); setSuccess(''); }}>
          {showDonateForm ? 'Cancel' : 'Donate Now'}
        </button>
        <button className="financialaid-action-button" onClick={() => { setShowRequestForm(s => !s); setShowDonateForm(false); setError(''); setSuccess(''); }}>
          {showRequestForm ? 'Cancel' : 'Request Financial Aid'}
        </button>
      </div>

      {/* ── DONATE FORM ── */}
      {showDonateForm && (
        <div className="financialaid-form-container">
          <h2>Make a Donation</h2>
          <form className="financialaid-form" onSubmit={submitDonate}>
            <input type="text" placeholder="Full Name *" required value={donateForm.donorName} onChange={e => setDonateForm(f => ({...f, donorName: e.target.value}))} />
            <input type="email" placeholder="Email Address *" required value={donateForm.donorEmail} onChange={e => setDonateForm(f => ({...f, donorEmail: e.target.value}))} />
            <input type="tel" placeholder="Phone Number" value={donateForm.donorPhone} onChange={e => setDonateForm(f => ({...f, donorPhone: e.target.value}))} />
            <select required value={donateForm.amountOffered} onChange={e => setDonateForm(f => ({...f, amountOffered: e.target.value}))}>
              <option value="">Select Amount *</option>
              {AMOUNTS.map(a => <option key={a} value={a}>₹{a.toLocaleString('en-IN')}</option>)}
              <option value="other">Custom Amount</option>
            </select>
            {donateForm.amountOffered === 'other' && (
              <input type="number" placeholder="Enter custom amount (₹) *" min="1" required value={donateForm.customAmount} onChange={e => setDonateForm(f => ({...f, customAmount: e.target.value}))} />
            )}
            <select required value={donateForm.paymentMode} onChange={e => setDonateForm(f => ({...f, paymentMode: e.target.value}))}>
              <option value="">Select Payment Method *</option>
              <option value="UPI">UPI</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
            </select>
            <textarea placeholder="Leave a message (optional)" value={donateForm.notes} onChange={e => setDonateForm(f => ({...f, notes: e.target.value}))} rows={3}/>
            <button type="submit" className="financialaid-submit-button" disabled={loading}>{loading ? 'Processing…' : 'Complete Donation'}</button>
          </form>
        </div>
      )}

      {/* ── REQUEST FORM ── */}
      {showRequestForm && (
        <div className="financialaid-form-container">
          <h2>Request Financial Aid</h2>
          <form className="financialaid-form" onSubmit={submitRequest}>
            <input type="text" placeholder="Patient / Applicant Name *" required value={requestForm.patientName} onChange={e => setRequestForm(f => ({...f, patientName: e.target.value}))} />
            <input type="tel" placeholder="Contact Number *" required value={requestForm.contactPhone} onChange={e => setRequestForm(f => ({...f, contactPhone: e.target.value}))} />
            <input type="number" placeholder="Amount Required (₹) *" min="1" required value={requestForm.amountRequired} onChange={e => setRequestForm(f => ({...f, amountRequired: e.target.value}))} />
            <input type="text" placeholder="Purpose (e.g. Surgery, Chemotherapy) *" required value={requestForm.purpose} onChange={e => setRequestForm(f => ({...f, purpose: e.target.value}))} />
            <select value={requestForm.urgency} onChange={e => setRequestForm(f => ({...f, urgency: e.target.value}))}>
              <option value="normal">Normal</option>
              <option value="high">High Urgency</option>
              <option value="critical">Critical / Emergency</option>
            </select>
            <textarea placeholder="Describe your situation and why you need this aid *" required value={requestForm.notes} onChange={e => setRequestForm(f => ({...f, notes: e.target.value}))} rows={4}/>
            <button type="submit" className="financialaid-submit-button" disabled={loading}>{loading ? 'Submitting…' : 'Submit Request'}</button>
          </form>
        </div>
      )}

      {/* ── MY HISTORY ── */}
      {token && myDonations.length > 0 && (
        <div style={{marginTop:'32px'}}>
          <h2 style={{marginBottom:'14px',fontSize:'18px'}}>💰 My Financial Aid History</h2>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {myDonations.map(d => (
              <div key={d._id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'14px 18px',display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
                <IndianRupee size={20} color="#10b981"/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,color:'#1f2937'}}>
                    {d.requestType==='donor_offer' ? (d.amountOffered ? `Donation — ₹${d.amountOffered}` : 'Aid Request') : 'Financial Request'}
                    {d.purpose ? ` · ${d.purpose}` : ''}
                  </div>
                  <div style={{fontSize:'12px',color:'#6b7280',marginTop:'2px'}}>{new Date(d.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
                <span style={{padding:'3px 10px',borderRadius:'99px',fontSize:'11px',fontWeight:700,background:statusColor[d.status]+'22',color:statusColor[d.status]}}>
                  {d.status?.toUpperCase()}
                </span>
                {d.adminNote && <div style={{width:'100%',fontSize:'12px',color:'#4b5563',marginTop:'4px',paddingTop:'6px',borderTop:'1px solid #f3f4f6'}}>📝 Admin: {d.adminNote}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialAid;