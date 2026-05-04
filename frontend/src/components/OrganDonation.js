import React, { useState, useEffect } from 'react';
import { Heart, Clock, UserPlus, Activity, CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './OrganDonation.css';

const API = 'http://localhost:5000';

const ORGANS = ['kidney','liver','heart','lungs','cornea','bone_marrow','pancreas','intestine','other'];

const OrganDonation = () => {
  const navigate = useNavigate();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showDonateForm, setShowDonateForm]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [myDonations, setMyDonations] = useState([]);

  const token     = localStorage.getItem('token');
  const userName  = localStorage.getItem('userName') || '';
  const userEmail = localStorage.getItem('userEmail') || '';

  const [requestForm, setRequestForm] = useState({
    patientName: '', patientAge: '', organType: '',
    contactPhone: '', hospitalName: '', urgency: 'normal', notes: ''
  });
  const [donateForm, setDonateForm] = useState({
    donorName: userName, donorPhone: '', donorEmail: userEmail,
    donorAge: '', donorGender: '', donorAddress: '',
    organType: '', donorAlive: true, bloodGroup: '',
    notes: ''
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
    fetch(`${API}/api/donations/my-donations?type=organ`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : [])
      .then(setMyDonations)
      .catch(() => {});
  }, [token, success]);

  const requireLogin = () => {
    setError('Please log in first to submit a donation request.');
    setTimeout(() => navigate('/user-login'), 1500);
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!token) { requireLogin(); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/donations/donor-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          donationType: 'organ',
          donorName:    requestForm.patientName,
          donorPhone:   requestForm.contactPhone,
          organType:    requestForm.organType,
          patientAge:   Number(requestForm.patientAge),
          urgency:      requestForm.urgency,
          notes:        `Hospital: ${requestForm.hospitalName}. ${requestForm.notes}`.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setSuccess('✅ Organ request submitted! Admin will review and connect you with a matching donor.');
      setShowRequestForm(false);
      setRequestForm({ patientName:'', patientAge:'', organType:'', contactPhone:'', hospitalName:'', urgency:'normal', notes:'' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const submitDonate = async (e) => {
    e.preventDefault();
    if (!token) { requireLogin(); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/donations/donor-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          donationType: 'organ',
          donorName:    donateForm.donorName,
          donorPhone:   donateForm.donorPhone,
          donorEmail:   donateForm.donorEmail,
          donorAge:     Number(donateForm.donorAge),
          donorGender:  donateForm.donorGender,
          donorAddress: donateForm.donorAddress,
          organType:    donateForm.organType,
          donorAlive:   donateForm.donorAlive,
          bloodGroup:   donateForm.bloodGroup,
          urgency:      'normal',
          notes:        donateForm.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setSuccess('✅ Organ donor pledge registered! Admin will review and contact you soon. Thank you for your generosity.');
      setShowDonateForm(false);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const statusColor = { pending:'#f59e0b', approved:'#10b981', rejected:'#ef4444', matched:'#8b5cf6', fulfilled:'#3b82f6' };

  return (
    <div className="organ-donation-container">
      <h1 className="organ-donation-header">Organ Donation Portal</h1>

      <div className="organ-donation-content">
        <p>Empower lives through organ donation. One organ donor can save up to eight lives and improve the lives of up to 75 people through tissue donation.</p>
      </div>

      {/* Auth notice */}
      {!token && (
        <div style={{background:'#fef3c7',border:'1px solid #f59e0b',borderRadius:'10px',padding:'12px 16px',margin:'16px 0',display:'flex',alignItems:'center',gap:'10px',color:'#92400e',fontSize:'14px'}}>
          <LogIn size={18}/> <span>You must be <strong>logged in</strong> to request or pledge organ donation. <button onClick={()=>navigate('/user-login')} style={{color:'#2563eb',background:'none',border:'none',cursor:'pointer',fontWeight:600,textDecoration:'underline'}}>Login here</button></span>
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

      <div className="organ-donation-info">
        <h2>Why Donate Organs?</h2>
        <div className="organ-donation-benefits">
          <div className="organ-benefit-item"><Heart size={24}/><h3>Save Lives</h3><p>One donor can save up to eight lives</p></div>
          <div className="organ-benefit-item"><Clock size={24}/><h3>Quick Process</h3><p>Registering as a donor takes only minutes</p></div>
          <div className="organ-benefit-item"><UserPlus size={24}/><h3>Help Many</h3><p>Improve the lives of up to 75 people</p></div>
          <div className="organ-benefit-item"><Activity size={24}/><h3>Lasting Impact</h3><p>Your gift can have a lifelong effect</p></div>
        </div>
      </div>

      <div className="organ-donation-actions">
        <button className="organ-donation-action-button" onClick={() => { setShowRequestForm(s => !s); setShowDonateForm(false); setError(''); setSuccess(''); }}>
          {showRequestForm ? 'Cancel' : 'Request Organ'}
        </button>
        <button className="organ-donation-action-button" onClick={() => { setShowDonateForm(s => !s); setShowRequestForm(false); setError(''); setSuccess(''); }}>
          {showDonateForm ? 'Cancel' : 'Become a Donor'}
        </button>
      </div>

      {/* ── REQUEST FORM ── */}
      {showRequestForm && (
        <div className="organ-donation-form-container">
          <h2>Request Organ</h2>
          <form className="organ-donation-form" onSubmit={submitRequest}>
            <input type="text" placeholder="Patient Full Name *" required value={requestForm.patientName} onChange={e => setRequestForm(f => ({...f, patientName: e.target.value}))} />
            <input type="number" placeholder="Patient Age *" min="0" max="100" required value={requestForm.patientAge} onChange={e => setRequestForm(f => ({...f, patientAge: e.target.value}))} />
            <select required value={requestForm.organType} onChange={e => setRequestForm(f => ({...f, organType: e.target.value}))}>
              <option value="">Select Organ Needed *</option>
              {ORGANS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1).replace('_',' ')}</option>)}
            </select>
            <input type="text" placeholder="Hospital Name *" required value={requestForm.hospitalName} onChange={e => setRequestForm(f => ({...f, hospitalName: e.target.value}))} />
            <input type="tel" placeholder="Contact Number *" required value={requestForm.contactPhone} onChange={e => setRequestForm(f => ({...f, contactPhone: e.target.value}))} />
            <select value={requestForm.urgency} onChange={e => setRequestForm(f => ({...f, urgency: e.target.value}))}>
              <option value="normal">Normal</option>
              <option value="high">High Urgency</option>
              <option value="critical">Critical / Emergency</option>
            </select>
            <textarea placeholder="Additional medical notes" value={requestForm.notes} onChange={e => setRequestForm(f => ({...f, notes: e.target.value}))} rows={3}/>
            <button type="submit" className="organ-donation-submit-button" disabled={loading}>{loading ? 'Submitting…' : 'Submit Request'}</button>
          </form>
        </div>
      )}

      {/* ── DONATE FORM ── */}
      {showDonateForm && (
        <div className="organ-donation-form-container">
          <h2>Become an Organ Donor</h2>
          <form className="organ-donation-form" onSubmit={submitDonate}>
            <input type="text" placeholder="Full Name *" required value={donateForm.donorName} onChange={e => setDonateForm(f => ({...f, donorName: e.target.value}))} />
            <input type="number" placeholder="Age *" min="18" max="80" required value={donateForm.donorAge} onChange={e => setDonateForm(f => ({...f, donorAge: e.target.value}))} />
            <select value={donateForm.donorGender} onChange={e => setDonateForm(f => ({...f, donorGender: e.target.value}))}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input type="email" placeholder="Email Address *" required value={donateForm.donorEmail} onChange={e => setDonateForm(f => ({...f, donorEmail: e.target.value}))} />
            <input type="tel" placeholder="Contact Number *" required value={donateForm.donorPhone} onChange={e => setDonateForm(f => ({...f, donorPhone: e.target.value}))} />
            <input type="text" placeholder="Address / City" value={donateForm.donorAddress} onChange={e => setDonateForm(f => ({...f, donorAddress: e.target.value}))} />
            <select required value={donateForm.organType} onChange={e => setDonateForm(f => ({...f, organType: e.target.value}))}>
              <option value="">Select Organ to Donate *</option>
              {ORGANS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1).replace('_',' ')}</option>)}
            </select>
            <select required value={donateForm.bloodGroup} onChange={e => setDonateForm(f => ({...f, bloodGroup: e.target.value}))}>
              <option value="">Select Blood Type *</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            <select value={String(donateForm.donorAlive)} onChange={e => setDonateForm(f => ({...f, donorAlive: e.target.value === 'true'}))}>
              <option value="true">Living Donor (I am donating now)</option>
              <option value="false">Posthumous Pledge (after my passing)</option>
            </select>
            <textarea placeholder="Any additional notes or conditions" value={donateForm.notes} onChange={e => setDonateForm(f => ({...f, notes: e.target.value}))} rows={2}/>
            <button type="submit" className="organ-donation-submit-button" disabled={loading}>{loading ? 'Submitting…' : 'Register as Donor'}</button>
          </form>
        </div>
      )}

      {/* ── MY HISTORY ── */}
      {token && myDonations.length > 0 && (
        <div style={{marginTop:'32px'}}>
          <h2 style={{marginBottom:'14px',fontSize:'18px'}}>🫀 My Organ Donation History</h2>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {myDonations.map(d => (
              <div key={d._id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'14px 18px',display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
                <Heart size={20} color="#8b5cf6"/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,color:'#1f2937'}}>{d.requestType === 'donor_offer' ? 'Donor Offer' : 'Organ Request'} — {d.organType ? d.organType.replace('_',' ') : '—'}</div>
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

export default OrganDonation;