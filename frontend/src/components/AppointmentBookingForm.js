import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { State, City } from 'country-state-city';
import './AppointmentBookingForm.css';

const API_BASE_URL = 'http://localhost:5000/api/auth/hospital';

// Static hospital list (same as Home.js — shown when not in DB)
const STATIC_HOSPITALS = [
  { _id: 's1',  hospitalName: 'Ruby General Hospital',           city: 'Kolkata',   state: 'WB', isStatic: true },
  { _id: 's2',  hospitalName: 'Apollo Multispeciality Hospital', city: 'Kolkata',   state: 'WB', isStatic: true },
  { _id: 's3',  hospitalName: 'AMRI Hospital',                   city: 'Kolkata',   state: 'WB', isStatic: true },
  { _id: 's4',  hospitalName: 'Fortis Hospital',                 city: 'Kolkata',   state: 'WB', isStatic: true },
  { _id: 's5',  hospitalName: 'Medica Superspecialty Hospital',  city: 'Kolkata',   state: 'WB', isStatic: true },
  { _id: 's6',  hospitalName: 'SSKM Hospital',                   city: 'Kolkata',   state: 'WB', isStatic: true },
  { _id: 's7',  hospitalName: 'NRS Medical College',             city: 'Kolkata',   state: 'WB', isStatic: true },
  { _id: 's8',  hospitalName: 'Peerless Hospital',               city: 'Kolkata',   state: 'WB', isStatic: true },
  { _id: 's9',  hospitalName: 'Belle Vue Clinic',                city: 'Kolkata',   state: 'WB', isStatic: true },
  { _id: 's10', hospitalName: 'Woodlands Hospital',              city: 'Kolkata',   state: 'WB', isStatic: true },
  { _id: 's11', hospitalName: 'Lilavati Hospital',               city: 'Mumbai',    state: 'MH', isStatic: true },
  { _id: 's12', hospitalName: 'Kokilaben Dhirubhai Ambani Hospital', city: 'Mumbai', state: 'MH', isStatic: true },
  { _id: 's13', hospitalName: 'Tata Memorial Hospital',          city: 'Mumbai',    state: 'MH', isStatic: true },
  { _id: 's14', hospitalName: 'AIIMS Delhi',                     city: 'Delhi',     state: 'DL', isStatic: true },
  { _id: 's15', hospitalName: 'Max Super Speciality Hospital',   city: 'Delhi',     state: 'DL', isStatic: true },
  { _id: 's16', hospitalName: 'Apollo Hospital',                 city: 'Chennai',   state: 'TN', isStatic: true },
  { _id: 's17', hospitalName: 'Manipal Hospital',                city: 'Bangalore', state: 'KA', isStatic: true },
  { _id: 's18', hospitalName: 'Narayana Health City',            city: 'Bangalore', state: 'KA', isStatic: true },
  { _id: 's19', hospitalName: 'Yashoda Hospital',                city: 'Hyderabad', state: 'TG', isStatic: true },
  { _id: 's20', hospitalName: 'Care Hospital',                   city: 'Hyderabad', state: 'TG', isStatic: true },
  { _id: 's21', hospitalName: 'Paras HMRI Hospital',             city: 'Patna',     state: 'BR', isStatic: true },
  { _id: 's22', hospitalName: 'IGIMS',                           city: 'Patna',     state: 'BR', isStatic: true },
  { _id: 's23', hospitalName: 'SMS Hospital',                    city: 'Jaipur',    state: 'RJ', isStatic: true },
  { _id: 's24', hospitalName: 'Civil Hospital',                  city: 'Ahmedabad', state: 'GJ', isStatic: true },
  { _id: 's25', hospitalName: 'Sterling Hospital',               city: 'Ahmedabad', state: 'GJ', isStatic: true },
];

const AppointmentBookingForm = () => {
  const [formData, setFormData] = useState({
    fullName: '', email: '', phoneNumber: '',
    date: '', time: '', state: '', city: '',
    hospital: '', doctor: '', doctorName: '',
    additionalMessage: '', needsBed: false
  });

  const [states, setStates]     = useState([]);
  const [cities, setCities]     = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors]   = useState([]);
  const [bedInfo, setBedInfo]   = useState(null);
  const [submitStatus, setSubmitStatus] = useState(''); // '' | 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setStates(State.getStatesOfCountry('IN') || []);
  }, []);

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === 'state') {
      const stateCities = City.getCitiesOfState('IN', value);
      setCities(stateCities);
      setFormData(p => ({ ...p, state: value, city: '', hospital: '', doctor: '', doctorName: '' }));
      setHospitals([]); setDoctors([]); setBedInfo(null);
      return;
    }

    if (name === 'city') {
      setFormData(p => ({ ...p, city: value, hospital: '', doctor: '', doctorName: '' }));
      setDoctors([]); setBedInfo(null);
      if (value) fetchHospitals(value, formData.state);
      else setHospitals([]);
      return;
    }

    if (name === 'hospital') {
      setFormData(p => ({ ...p, hospital: value, doctor: '', doctorName: '' }));
      setDoctors([]); setBedInfo(null);
      const selected = hospitals.find(h => h._id === value);
      if (selected && !selected.isStatic) {
        fetchDoctors(value);
        fetchBedInfo(value);
      }
      return;
    }

    if (name === 'doctor') {
      const selectedDoc = doctors.find(d => d._id === value);
      setFormData(p => ({ ...p, doctor: value, doctorName: selectedDoc ? selectedDoc.name : '' }));
      return;
    }

    setFormData(p => ({ ...p, [name]: value }));
  };

  const fetchHospitals = async (city, stateCode) => {
    try {
      const cityName = city.trim();
      // Fetch from DB (only accepted hospitals)
      const response = await axios.get(`${API_BASE_URL}/hospitals/${encodeURIComponent(cityName)}`);
      const dbHospitals = response.data || [];

      // Merge with static list for this city
      const dbNames = dbHospitals.map(h => h.hospitalName.toLowerCase());
      const staticForCity = STATIC_HOSPITALS.filter(
        h => h.city.toLowerCase() === cityName.toLowerCase() &&
             !dbNames.includes(h.hospitalName.toLowerCase())
      );

      setHospitals([...dbHospitals, ...staticForCity]);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      // Fallback: show static hospitals only
      const staticForCity = STATIC_HOSPITALS.filter(
        h => h.city.toLowerCase() === city.toLowerCase()
      );
      setHospitals(staticForCity);
    }
  };

  const fetchDoctors = async (hospitalId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/doctors/${hospitalId}`);
      setDoctors(response.data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    }
  };

  const fetchBedInfo = async (hospitalId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/bed-availability/${hospitalId}`);
      setBedInfo(res.data);
    } catch {
      setBedInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMsg('Please log in to book an appointment.');
      return;
    }

    const selectedHospital = hospitals.find(h => h._id === formData.hospital);
    if (!selectedHospital) { setErrorMsg('Please select a hospital.'); return; }

    // Static hospitals: show user-friendly message
    if (selectedHospital.isStatic) {
      alert(`"${selectedHospital.hospitalName}" is a listed hospital but has not yet registered on MediCare. Please contact them directly to book an appointment.`);
      return;
    }

    setSubmitStatus('loading');
    try {
      const appointmentData = {
        fullName:          formData.fullName,
        email:             formData.email,
        phoneNumber:       formData.phoneNumber,
        date:              formData.date,
        time:              formData.time,
        state:             formData.state,
        city:              formData.city,
        doctor: {
          id:   formData.doctor,
          name: formData.doctorName
        },
        additionalMessage: formData.additionalMessage,
        needsBed: formData.needsBed
      };

      await axios.post(
        `${API_BASE_URL}/book-appointment/${formData.hospital}`,
        appointmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubmitStatus('success');
      setFormData({
        fullName: '', email: '', phoneNumber: '',
        date: '', time: '', state: '', city: '',
        hospital: '', doctor: '', doctorName: '',
        additionalMessage: ''
      });
      setHospitals([]); setDoctors([]); setBedInfo(null);
    } catch (error) {
      setSubmitStatus('error');
      setErrorMsg(error.response?.data?.message || 'Failed to book appointment. Please try again.');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="appointment-container">
      <h1 className="appointment-title">Book an Appointment</h1>

      {submitStatus === 'success' && (
        <div className="appt-success-banner">
          ✓ Appointment booked successfully! The hospital will review and confirm your booking.
        </div>
      )}

      {(submitStatus === 'error' || errorMsg) && (
        <div className="appt-error-banner">{errorMsg}</div>
      )}

      <form onSubmit={handleSubmit} className="appointment-form">
        <div className="form-section">

          {/* Personal Info */}
          <div className="form-group-heading">Personal Information</div>

          <div className="appointment-form-group">
            <label htmlFor="fullName">Full Name</label>
            <input id="fullName" name="fullName" type="text"
              value={formData.fullName} onChange={handleChange}
              className="appointment-input" required />
          </div>

          <div className="appointment-form-group">
            <label htmlFor="email">Email Address</label>
            <input id="email" name="email" type="email"
              value={formData.email} onChange={handleChange}
              className="appointment-input" required />
          </div>

          <div className="appointment-form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input id="phoneNumber" name="phoneNumber" type="tel"
              value={formData.phoneNumber} onChange={handleChange}
              className="appointment-input" pattern="\d{10}" required />
          </div>

          {/* Schedule */}
          <div className="form-group-heading">Schedule</div>

          <div className="appointment-form-group">
            <label htmlFor="date">Appointment Date</label>
            <input id="date" name="date" type="date"
              value={formData.date} onChange={handleChange}
              min={today}
              className="appointment-input" required />
          </div>

          <div className="appointment-form-group">
            <label htmlFor="time">Appointment Time</label>
            <input id="time" name="time" type="time"
              value={formData.time} onChange={handleChange}
              className="appointment-input" required />
          </div>

          {/* Hospital Selection */}
          <div className="form-group-heading">Hospital & Doctor</div>

          <div className="appointment-form-group">
            <label htmlFor="state">State</label>
            <select id="state" name="state"
              value={formData.state} onChange={handleChange}
              className="appointment-select" required>
              <option value="">Select State</option>
              {states.map(s => (
                <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="appointment-form-group">
            <label htmlFor="city">City</label>
            <select id="city" name="city"
              value={formData.city} onChange={handleChange}
              className="appointment-select" required disabled={!formData.state}>
              <option value="">Select City</option>
              {cities.map(c => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="appointment-form-group">
            <label htmlFor="hospital">Hospital</label>
            <select id="hospital" name="hospital"
              value={formData.hospital} onChange={handleChange}
              className="appointment-select" required disabled={!formData.city}>
              <option value="">
                {formData.city
                  ? hospitals.length === 0 ? 'No hospitals found in this city' : 'Select Hospital'
                  : 'Select City first'}
              </option>
              {hospitals.length > 0 && (
                <>
                  {hospitals.filter(h => !h.isStatic).length > 0 && (
                    <optgroup label="— Registered on MediCare —">
                      {hospitals.filter(h => !h.isStatic).map(h => (
                        <option key={h._id} value={h._id}>{h.hospitalName}</option>
                      ))}
                    </optgroup>
                  )}
                  {hospitals.filter(h => h.isStatic).length > 0 && (
                    <optgroup label="— Other hospitals in this city —">
                      {hospitals.filter(h => h.isStatic).map(h => (
                        <option key={h._id} value={h._id}>{h.hospitalName} (not on MediCare)</option>
                      ))}
                    </optgroup>
                  )}
                </>
              )}
            </select>
          </div>

          {/* Bed availability badge */}
          {bedInfo && (
            <div className={`appt-bed-badge ${bedInfo.availableBeds === 0 ? 'appt-bed-full' : 'appt-bed-ok'}`}>
              🛏 {bedInfo.availableBeds} / {bedInfo.totalBeds} beds available at {bedInfo.hospitalName}
            </div>
          )}

          <div className="appointment-form-group">
            <label htmlFor="doctor">Doctor</label>
            <select id="doctor" name="doctor"
              value={formData.doctor} onChange={handleChange}
              className="appointment-select" required disabled={!formData.hospital || doctors.length === 0}>
              <option value="">
                {!formData.hospital
                  ? 'Select Hospital first'
                  : doctors.length === 0
                    ? 'No doctors available'
                    : 'Select Doctor'}
              </option>
              {doctors.map(d => (
                <option key={d._id} value={d._id}>{d.name} — {d.specialization}</option>
              ))}
            </select>
          </div>

          <div className="appointment-form-group">
            <label htmlFor="additionalMessage">Additional Message</label>
            <textarea id="additionalMessage" name="additionalMessage"
              value={formData.additionalMessage} onChange={handleChange}
              className="appointment-textarea" rows={3}
              placeholder="Describe your symptoms or any special requirements…"
            />
          </div>

          <div className="appointment-form-group" style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
            <input type="checkbox" id="needsBed" name="needsBed"
              checked={formData.needsBed}
              onChange={e => setFormData(p => ({ ...p, needsBed: e.target.checked }))}
              style={{ width:18, height:18, cursor:'pointer' }} />
            <label htmlFor="needsBed" style={{ marginBottom:0, cursor:'pointer', fontWeight:500 }}>
              🛏 I require a hospital bed (the hospital will allocate one upon approval)
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="appointment-submit-button"
          disabled={submitStatus === 'loading'}
        >
          {submitStatus === 'loading' ? 'Booking…' : 'Book Appointment'}
        </button>
      </form>
    </div>
  );
};

export default AppointmentBookingForm;