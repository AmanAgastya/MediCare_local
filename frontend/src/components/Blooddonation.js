import React, { useState, useEffect } from 'react';
import { Droplet, Clock, Heart, Activity, CheckCircle, AlertCircle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './BloodDonation.css';

const API = 'http://localhost:5000';

const BloodDonation = () => {
  const navigate = useNavigate();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showDonateForm, setShowDonateForm]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');
  const [myDonations, setMyDonations] = useState([]);

  const token    = localStorage.getItem('token');
  const userName = localStorage.getItem('userName') || '';
  const userEmail= localStorage.getItem('userEmail') || '';

  const [requestForm, setRequestForm] = useState({
    patientName: '', bloodGroup: '', unitsRequired: 1,
    contactPhone: '', hospitalName: '', urgency: 'normal', notes: ''
  });
  const [donateForm, setDonateForm] = useState({
    donorName: userName, donorPhone: '', donorEmail: userEmail,
    donorAge: '', donorGender: '', donorAddress: '',
    bloodGroup: '', unitsOffered: 1,
    lastDonationDate: '', notes: ''
  });

  // Pre-fill donor name/email from localStorage whenever token changes
  useEffect(() => {
    setDonateForm(f => ({
      ...f,
      donorName:  localStorage.getItem('userName') || '',
      donorEmail: localStorage.getItem('userEmail') || ''
    }));
  }, [token]);

  // Load this user's blood donation history
  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/donations/my-donations?type=blood`, {
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
          donationType:  'blood',
          requestType:   'donor_offer',
          donorName:     requestForm.patientName,
          donorPhone:    requestForm.contactPhone,
          bloodGroup:    requestForm.bloodGroup,
          unitsOffered:  requestForm.unitsRequired,
          urgency:       requestForm.urgency,
          notes:         `Hospital: ${requestForm.hospitalName}. ${requestForm.notes}`.trim(),
          userId:        null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setSuccess('✅ Blood request submitted! Admin will review and connect you with a donor.');
      setShowRequestForm(false);
      setRequestForm({ patientName:'', bloodGroup:'', unitsRequired:1, contactPhone:'', hospitalName:'', urgency:'normal', notes:'' });
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
          donationType: 'blood',
          donorName:    donateForm.donorName,
          donorPhone:   donateForm.donorPhone,
          donorEmail:   donateForm.donorEmail,
          donorAge:     Number(donateForm.donorAge),
          donorGender:  donateForm.donorGender,
          donorAddress: donateForm.donorAddress,
          bloodGroup:   donateForm.bloodGroup,
          unitsOffered: Number(donateForm.unitsOffered),
          urgency:      'normal',
          notes:        donateForm.lastDonationDate ? `Last donation: ${donateForm.lastDonationDate}. ${donateForm.notes}` : donateForm.notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setSuccess('✅ Donor registration submitted! Admin will review and contact you soon.');
      setShowDonateForm(false);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const statusColor = { pending:'#f59e0b', approved:'#10b981', rejected:'#ef4444', matched:'#8b5cf6', fulfilled:'#3b82f6' };

  return (
    <div className="blooddonation-container">
      <h1 className="blooddonation-header">Blood Donation Portal</h1>

      <div className="blooddonation-content">
        <p>Empower lives through the gift of blood. Your donation can be the lifeline someone desperately needs.
          Every two seconds, someone requires a blood transfusion, and a single donation can save up to three lives.</p>
      </div>

      {/* Auth notice */}
      {!token && (
        <div style={{background:'#fef3c7',border:'1px solid #f59e0b',borderRadius:'10px',padding:'12px 16px',margin:'16px 0',display:'flex',alignItems:'center',gap:'10px',color:'#92400e',fontSize:'14px'}}>
          <LogIn size={18}/> <span>You must be <strong>logged in</strong> to request or donate blood. <button onClick={()=>navigate('/user-login')} style={{color:'#2563eb',background:'none',border:'none',cursor:'pointer',fontWeight:600,textDecoration:'underline'}}>Login here</button></span>
        </div>
      )}

      {/* Alerts */}
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

      {/* Info */}
      <div className="blooddonation-info">
        <h2>Why Donate Blood?</h2>
        <div className="blooddonation-benefits">
          <div className="benefit-item"><Droplet size={24}/><h3>Save Lives</h3><p>One donation can save up to three lives</p></div>
          <div className="benefit-item"><Clock size={24}/><h3>Quick Process</h3><p>It takes only about 10–15 minutes to donate</p></div>
          <div className="benefit-item"><Heart size={24}/><h3>Fast Recovery</h3><p>Your body replenishes donated blood within 24 hours</p></div>
          <div className="benefit-item"><Activity size={24}/><h3>Maintain Supply</h3><p>Regular donation helps maintain a healthy blood supply</p></div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="blooddonation-actions">
        <button className="blooddonation-action-button" onClick={() => { setShowRequestForm(s => !s); setShowDonateForm(false); setError(''); setSuccess(''); }}>
          {showRequestForm ? 'Cancel' : 'Request Blood'}
        </button>
        <button className="blooddonation-action-button" onClick={() => { setShowDonateForm(s => !s); setShowRequestForm(false); setError(''); setSuccess(''); }}>
          {showDonateForm ? 'Cancel' : 'Donate Blood'}
        </button>
      </div>

      {/* ── REQUEST FORM ── */}
      {showRequestForm && (
        <div className="blooddonation-form-container">
          <h2>Request Blood</h2>
          <form className="blooddonation-form" onSubmit={submitRequest}>
            <input type="text" placeholder="Patient / Requestor Name" required value={requestForm.patientName} onChange={e => setRequestForm(f => ({...f, patientName: e.target.value}))} />
            <select required value={requestForm.bloodGroup} onChange={e => setRequestForm(f => ({...f, bloodGroup: e.target.value}))}>
              <option value="">Select Blood Group *</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            <input type="number" placeholder="Units Required" min="1" max="10" required value={requestForm.unitsRequired} onChange={e => setRequestForm(f => ({...f, unitsRequired: e.target.value}))} />
            <input type="text" placeholder="Hospital Name" required value={requestForm.hospitalName} onChange={e => setRequestForm(f => ({...f, hospitalName: e.target.value}))} />
            <input type="tel" placeholder="Contact Number" required value={requestForm.contactPhone} onChange={e => setRequestForm(f => ({...f, contactPhone: e.target.value}))} />
            <select value={requestForm.urgency} onChange={e => setRequestForm(f => ({...f, urgency: e.target.value}))}>
              <option value="normal">Normal Urgency</option>
              <option value="high">High Urgency</option>
              <option value="critical">Critical / Emergency</option>
            </select>
            <textarea placeholder="Additional notes (optional)" value={requestForm.notes} onChange={e => setRequestForm(f => ({...f, notes: e.target.value}))} rows={3}/>
            <button type="submit" className="blooddonation-submit-button" disabled={loading}>{loading ? 'Submitting…' : 'Submit Request'}</button>
          </form>
        </div>
      )}

      {/* ── DONATE FORM ── */}
      {showDonateForm && (
        <div className="blooddonation-form-container">
          <h2>Register as Blood Donor</h2>
          <form className="blooddonation-form" onSubmit={submitDonate}>
            <input type="text" placeholder="Full Name *" required value={donateForm.donorName} onChange={e => setDonateForm(f => ({...f, donorName: e.target.value}))} />
            <input type="number" placeholder="Age *" min="18" max="65" required value={donateForm.donorAge} onChange={e => setDonateForm(f => ({...f, donorAge: e.target.value}))} />
            <select value={donateForm.donorGender} onChange={e => setDonateForm(f => ({...f, donorGender: e.target.value}))}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <select required value={donateForm.bloodGroup} onChange={e => setDonateForm(f => ({...f, bloodGroup: e.target.value}))}>
              <option value="">Select Blood Group *</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            <input type="tel" placeholder="Contact Number *" required value={donateForm.donorPhone} onChange={e => setDonateForm(f => ({...f, donorPhone: e.target.value}))} />
            <input type="email" placeholder="Email Address" value={donateForm.donorEmail} onChange={e => setDonateForm(f => ({...f, donorEmail: e.target.value}))} />
            <input type="text" placeholder="Address / City" value={donateForm.donorAddress} onChange={e => setDonateForm(f => ({...f, donorAddress: e.target.value}))} />
            <input type="date" placeholder="Last Donation Date (if any)" max={new Date().toISOString().split('T')[0]} value={donateForm.lastDonationDate} onChange={e => setDonateForm(f => ({...f, lastDonationDate: e.target.value}))} />
            <textarea placeholder="Any health notes (optional)" value={donateForm.notes} onChange={e => setDonateForm(f => ({...f, notes: e.target.value}))} rows={2}/>
            <button type="submit" className="blooddonation-submit-button" disabled={loading}>{loading ? 'Submitting…' : 'Register to Donate'}</button>
          </form>
        </div>
      )}

      {/* ── MY DONATION HISTORY ── */}
      {token && myDonations.length > 0 && (
        <div style={{marginTop:'32px'}}>
          <h2 style={{marginBottom:'14px',fontSize:'18px'}}>🩸 My Blood Donation History</h2>
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {myDonations.map(d => (
              <div key={d._id} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:'10px',padding:'14px 18px',display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
                <Droplet size={20} color="#ef4444"/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,color:'#1f2937'}}>{d.requestType === 'donor_offer' ? 'Donor Offer' : 'Blood Request'} — {d.bloodGroup || 'Any'}</div>
                  <div style={{fontSize:'12px',color:'#6b7280',marginTop:'2px'}}>{d.unitsOffered || d.unitsRequired} unit(s) · {new Date(d.createdAt).toLocaleDateString('en-IN')}</div>
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

export default BloodDonation;