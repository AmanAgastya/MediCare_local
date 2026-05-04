import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Eye, EyeOff, LogIn } from 'lucide-react';
import './DoctorLogin.css';

const API = 'http://localhost:5000';

const DoctorLogin = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError('All fields are required'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/hospital/doctor-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Login failed'); return; }
      localStorage.setItem('doctorToken', data.token);
      localStorage.setItem('doctorName', data.doctorName);
      localStorage.setItem('doctorSpecialization', data.specialization);
      localStorage.setItem('doctorHospitalName', data.hospitalName);
      localStorage.setItem('doctorHospitalId', data.hospitalId);
      localStorage.setItem('userName', `Dr. ${data.doctorName}`);
      window.dispatchEvent(new Event('storage'));
      navigate('/doctor-dashboard');
    } catch (err) {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-login-page">
      <div className="doctor-login-card">
        <div className="dl-icon-wrap">
          <Stethoscope size={40} color="#4a90e2" />
        </div>
        <h2 className="dl-title">Doctor Login</h2>
        <p className="dl-sub">Login with the credentials provided by your hospital</p>

        {error && <div className="dl-error">{error}</div>}

        <form onSubmit={handleSubmit} className="dl-form">
          <div className="dl-field">
            <label>Username</label>
            <input type="text" name="username" value={form.username}
              onChange={handleChange} placeholder="Enter your username" autoComplete="username" />
          </div>
          <div className="dl-field">
            <label>Password</label>
            <div className="dl-password-wrap">
              <input type={showPassword ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} placeholder="Enter your password" autoComplete="current-password" />
              <button type="button" className="dl-eye" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="dl-submit" disabled={loading}>
            {loading ? 'Logging in…' : <><LogIn size={18} /> Login</>}
          </button>
        </form>
        <p className="dl-note">
          Not a doctor? <a href="/hospital-login">Hospital Login</a> | <a href="/user-login">Patient Login</a>
        </p>
      </div>
    </div>
  );
};

export default DoctorLogin;