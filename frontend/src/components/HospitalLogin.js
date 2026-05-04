import React, { useState } from 'react';
import { Hospital, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './HospitalLogin.css';

const HospitalLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email address'); return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      // No Authorization header — this IS the login endpoint
      const response = await fetch('http://localhost:5000/api/auth/hospital/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('hospitalToken', data.token);
        localStorage.setItem('hospitalName', data.hospitalName);
        localStorage.setItem('userName', data.hospitalName);
        // Dispatch so Header/other components can react
        window.dispatchEvent(new Event('storage'));
        navigate('/hospital-dashboard');
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hospital-login-container">
      <div className="hospital-login-content">
        <Hospital size={48} color="#4a90e2" />
        <h2>Hospital Login</h2>
        <p>Access your healthcare provider dashboard</p>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group"><Mail size={20} />
            <input type="email" name="email" placeholder="Email Address"
              value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group"><Lock size={20} />
            <input type="password" name="password" placeholder="Password"
              value={formData.password} onChange={handleChange} required minLength="8" />
          </div>
          <button type="submit" className="login-button-a" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <div className="signup-link">
          <p>Don't have an account? <a href="/hospital-signup">Sign up here</a></p>
        </div>
      </div>
    </div>
  );
};

export default HospitalLogin;