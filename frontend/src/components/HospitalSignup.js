import React, { useState, useEffect } from 'react';
import { Hospital, Mail, Phone, Building, User, MapPin, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { State, City } from 'country-state-city';
import './HospitalSignup.css';

const HospitalSignup = () => {
  const [formData, setFormData] = useState({
    hospitalName: '', email: '', phone: '',
    address: '', adminName: '', password: '',
    confirmPassword: '', state: '', city: '',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setStates(State.getStatesOfCountry('IN'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (name === 'state') {
      setCities(City.getCitiesOfState('IN', value));
      setFormData(p => ({ ...p, state: value, city: '' }));
    }
  };

  const validate = () => {
    if (!formData.hospitalName.trim())  { setError('Hospital name is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Invalid email address'); return false; }
    if (!/^\d{10}$/.test(formData.phone)) { setError('Phone must be 10 digits'); return false; }
    if (!formData.address.trim())       { setError('Address is required'); return false; }
    if (!formData.adminName.trim())     { setError('Admin name is required'); return false; }
    if (formData.password.length < 8)   { setError('Password must be at least 8 characters'); return false; }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false; }
    if (!formData.state)                { setError('Please select a state'); return false; }
    if (!formData.city)                 { setError('Please select a city'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      // No Authorization header — hospital doesn't have a token yet at signup
      const response = await fetch('http://localhost:5000/api/auth/hospital/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalName: formData.hospitalName,
          email:        formData.email,
          password:     formData.password,
          phone:        formData.phone,
          address:      formData.address,
          state:        formData.state,
          city:         formData.city,
          adminName:    formData.adminName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('hospitalToken', data.token);
        localStorage.setItem('hospitalName', data.hospitalName);
        navigate('/hospital-dashboard');
      } else {
        setError(data.message || 'An error occurred during signup');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hospital-signup-container">
      <div className="hospital-signup-content">
        <Hospital size={48} color="#4a90e2" />
        <h2>Hospital Signup</h2>
        <p>Register your healthcare facility. Our admin team will review and approve your request.</p>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group"><Building size={20} />
            <input type="text" name="hospitalName" placeholder="Hospital Name"
              value={formData.hospitalName} onChange={handleChange} required />
          </div>
          <div className="input-group"><Mail size={20} />
            <input type="email" name="email" placeholder="Email Address"
              value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group"><Phone size={20} />
            <input type="tel" name="phone" placeholder="Phone Number (10 digits)"
              value={formData.phone} onChange={handleChange} required pattern="\d{10}" />
          </div>
          <div className="input-group"><Building size={20} />
            <input type="text" name="address" placeholder="Hospital Address"
              value={formData.address} onChange={handleChange} required />
          </div>
          <div className="input-group"><MapPin size={20} />
            <select name="state" value={formData.state} onChange={handleChange} required>
              <option value="">Select State</option>
              {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
            </select>
          </div>
          <div className="input-group"><MapPin size={20} />
            <select name="city" value={formData.city} onChange={handleChange} required disabled={!formData.state}>
              <option value="">Select City</option>
              {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="input-group"><User size={20} />
            <input type="text" name="adminName" placeholder="Admin / Contact Person Name"
              value={formData.adminName} onChange={handleChange} required />
          </div>
          <div className="input-group"><Lock size={20} />
            <input type="password" name="password" placeholder="Password (min 8 chars)"
              value={formData.password} onChange={handleChange} required minLength="8" />
          </div>
          <div className="input-group"><Lock size={20} />
            <input type="password" name="confirmPassword" placeholder="Confirm Password"
              value={formData.confirmPassword} onChange={handleChange} required />
          </div>
          <button type="submit" className="signup-button" disabled={loading}>
            {loading ? 'Submitting…' : 'Request Access'}
          </button>
        </form>
        <div className="login-link">
          <p>Already registered? <a href="/hospital-login">Login here</a></p>
        </div>
      </div>
    </div>
  );
};

export default HospitalSignup;