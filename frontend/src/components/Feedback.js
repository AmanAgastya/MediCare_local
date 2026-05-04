import React, { useState } from 'react';
import './Feedback.css';

const API = 'http://localhost:5000';

const Feedback = () => {
  const [form, setForm] = useState({ name: '', email: '', rating: 0, category: 'general', message: '' });
  const [hover, setHover] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.rating || !form.message) { setError('Please fill all required fields.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/admin/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      setSubmitted(true);
    } catch (err) { setError(err.message || 'Failed to submit. Try again.'); }
    finally { setLoading(false); }
  };

  const categories = ['general','appointment','donation','telemedicine','app','other'];

  if (submitted) return (
    <div className="fb-page">
      <div className="fb-success">
        <div className="fb-success-icon">✅</div>
        <h2>Thank You!</h2>
        <p>Your feedback has been submitted successfully. Our team will review it shortly.</p>
        <button className="fb-submit" onClick={() => { setSubmitted(false); setForm({ name:'', email:'', rating:0, category:'general', message:'' }); }}>
          Submit Another
        </button>
      </div>
    </div>
  );

  return (
    <div className="fb-page">
      <div className="fb-card">
        <div className="fb-top">
          <h1>💬 Share Your Feedback</h1>
          <p>Help us improve MediCare by sharing your experience</p>
        </div>

        {error && <div className="fb-error">{error}</div>}

        <form onSubmit={handleSubmit} className="fb-form">
          <div className="fb-row">
            <div className="fb-field">
              <label>Full Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
            </div>
            <div className="fb-field">
              <label>Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" />
            </div>
          </div>

          <div className="fb-field">
            <label>Category</label>
            <select name="category" value={form.category} onChange={handleChange}>
              {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          <div className="fb-field">
            <label>Rating *</label>
            <div className="fb-stars-input">
              {[1,2,3,4,5].map(star => (
                <button type="button" key={star}
                  className={`fb-star ${star <= (hover || form.rating) ? 'active' : ''}`}
                  onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
                  onClick={() => setForm({ ...form, rating: star })}>★</button>
              ))}
              <span className="fb-rating-label">
                {form.rating > 0 ? ['','Poor','Fair','Good','Very Good','Excellent'][form.rating] : 'Select rating'}
              </span>
            </div>
          </div>

          <div className="fb-field">
            <label>Your Message *</label>
            <textarea name="message" value={form.message} onChange={handleChange}
              placeholder="Share your experience, suggestions or concerns…" rows={5} />
          </div>

          <button type="submit" className="fb-submit" disabled={loading}>
            {loading ? 'Submitting…' : '📨 Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;