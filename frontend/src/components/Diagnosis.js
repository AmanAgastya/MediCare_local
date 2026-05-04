import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import "./Diagnosis.css";

const Diagnosis = () => {
  const [formData, setFormData] = useState({
    name: "", dateOfBirth: "", age: "", gender: "",
    symptoms: "", durationStart: "",
    medicalHistory: "", currentMedications: "", allergies: "",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const userName = localStorage.getItem("userName");
    if (userName) setFormData(p => ({ ...p, name: userName }));
  }, []);

  useEffect(() => {
    if (formData.dateOfBirth) {
      const birth = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      if (today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
      setFormData(p => ({ ...p, age: age.toString() }));
    }
  }, [formData.dateOfBirth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    setErrors(p => ({ ...p, [name]: "" }));
  };

  const getDiagnosis = async () => {
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const res = await fetch(`${API_BASE}/api/ai/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:               formData.name,
        age:                formData.age,
        gender:             formData.gender,
        symptoms:           formData.symptoms,
        durationStart:      formData.durationStart,
        medicalHistory:     formData.medicalHistory,
        currentMedications: formData.currentMedications,
        allergies:          formData.allergies,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'AI diagnosis failed');
    return data.text;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setApiError("");
    setDiagnosis("");
    try {
      const result = await getDiagnosisWithRetry();
      setDiagnosis(result);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (err) {
      console.error("Diagnosis error:", err);
      setApiError(err.message || "Failed to get diagnosis. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let valid = true;
    if (currentStep === 1) {
      if (!formData.name.trim()) { newErrors.name = "Name is required"; valid = false; }
      if (!formData.dateOfBirth) { newErrors.dateOfBirth = "Date of birth is required"; valid = false; }
      if (!formData.gender) { newErrors.gender = "Gender is required"; valid = false; }
    } else if (currentStep === 2) {
      if (!formData.symptoms.trim()) { newErrors.symptoms = "Symptoms are required"; valid = false; }
      if (!formData.durationStart) { newErrors.durationStart = "Start date is required"; valid = false; }
    } else if (currentStep === 3) {
      if (!formData.medicalHistory.trim()) { newErrors.medicalHistory = "Medical history is required"; valid = false; }
      if (!formData.currentMedications.trim()) { newErrors.currentMedications = "Current medications are required (enter 'None' if none)"; valid = false; }
      if (!formData.allergies.trim()) { newErrors.allergies = "Allergies required (enter 'None' if none)"; valid = false; }
    }
    setErrors(newErrors);
    return valid;
  };

  const nextStep = () => {
    if (validateForm()) { setCurrentStep(s => s + 1); setErrorMessage(""); }
    else setErrorMessage("Please complete all required fields.");
  };

  const prevStep = () => { setCurrentStep(s => s - 1); setErrorMessage(""); };

  const isStepValid = () => {
    if (currentStep === 1) return formData.name && formData.dateOfBirth && formData.gender;
    if (currentStep === 2) return formData.symptoms && formData.durationStart;
    return true;
  };

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const getDiagnosisWithRetry = async (retries = 3) => {
  try {
    return await getDiagnosis();
  } catch (err) {
    if (err.message.includes("quota") && retries > 0) {
      await sleep(25000); // wait ~25 sec
      return getDiagnosisWithRetry(retries - 1);
    }
    throw err;
  }
};

  return (
    <div className="diagnosis-container">
      <h1 className="diagnosis-title">🤖 AI Diagnosis Form</h1>
      <p className="diagnosis-subtitle">Fill in your details for an AI-powered preliminary health analysis</p>

      {/* Progress */}
      <div className="diagnosis-steps">
        {["Personal Info", "Symptoms", "Medical History"].map((label, i) => (
          <div key={i} className={`diag-step-item ${currentStep === i + 1 ? 'active' : ''} ${currentStep > i + 1 ? 'done' : ''}`}>
            <div className="diag-step-circle">{currentStep > i + 1 ? '✓' : i + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="progress-bar">
        <div className="progress" style={{ width: `${(currentStep / 3) * 100}%` }} />
      </div>

      <form className="diagnosis-form" onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="diagnosis-form-group">
              <label className="diagnosis-label">Full Name *</label>
              <input className="diagnosis-input" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
            <div className="diag-row">
              <div className="diagnosis-form-group">
                <label className="diagnosis-label">Date of Birth *</label>
                <input className="diagnosis-input" type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} max={new Date().toISOString().split('T')[0]} />
                {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
              </div>
              <div className="diagnosis-form-group">
                <label className="diagnosis-label">Age (auto-calculated)</label>
                <input className="diagnosis-input" type="text" name="age" value={formData.age} readOnly placeholder="Auto from DOB" />
              </div>
            </div>
            <div className="diagnosis-form-group">
              <label className="diagnosis-label">Gender *</label>
              <select className="diagnosis-select" name="gender" value={formData.gender} onChange={handleChange}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <span className="error-message">{errors.gender}</span>}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="form-section">
            <h3>Symptoms</h3>
            <div className="diagnosis-form-group">
              <label className="diagnosis-label">Describe Your Symptoms *</label>
              <textarea className="diagnosis-textarea" name="symptoms" value={formData.symptoms} onChange={handleChange}
                placeholder="e.g. Persistent headache, fever (101°F), fatigue, sore throat for the last 3 days..." rows={5} />
              {errors.symptoms && <span className="error-message">{errors.symptoms}</span>}
            </div>
            <div className="diagnosis-form-group">
              <label className="diagnosis-label">When did symptoms start? *</label>
              <input className="diagnosis-input" type="date" name="durationStart" value={formData.durationStart} onChange={handleChange} max={new Date().toISOString().split('T')[0]} />
              {errors.durationStart && <span className="error-message">{errors.durationStart}</span>}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="form-section">
            <h3>Medical History</h3>
            <div className="diagnosis-form-group">
              <label className="diagnosis-label">Past Medical Conditions / Surgeries *</label>
              <textarea className="diagnosis-textarea" name="medicalHistory" value={formData.medicalHistory} onChange={handleChange}
                placeholder="e.g. Diabetes (Type 2), appendectomy in 2018, hypertension... or 'None'" rows={3} />
              {errors.medicalHistory && <span className="error-message">{errors.medicalHistory}</span>}
            </div>
            <div className="diagnosis-form-group">
              <label className="diagnosis-label">Current Medications *</label>
              <textarea className="diagnosis-textarea" name="currentMedications" value={formData.currentMedications} onChange={handleChange}
                placeholder="e.g. Metformin 500mg, Lisinopril 10mg... or 'None'" rows={3} />
              {errors.currentMedications && <span className="error-message">{errors.currentMedications}</span>}
            </div>
            <div className="diagnosis-form-group">
              <label className="diagnosis-label">Known Allergies *</label>
              <textarea className="diagnosis-textarea" name="allergies" value={formData.allergies} onChange={handleChange}
                placeholder="e.g. Penicillin, pollen, shellfish... or 'None'" rows={2} />
              {errors.allergies && <span className="error-message">{errors.allergies}</span>}
            </div>
          </div>
        )}

        {errorMessage && <div className="diag-form-error"><AlertCircle size={16} /> {errorMessage}</div>}

        <div className="button-group">
          {currentStep > 1 && <button className="prev-button" type="button" onClick={prevStep}>← Previous</button>}
          {currentStep < 3 && (
            <button className="next-button" type="button" onClick={nextStep} disabled={!isStepValid()}>
              Next →
            </button>
          )}
          {currentStep === 3 && (
            <button className="diagnosis-submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader size={16} className="spin" /> Analyzing…</> : '🔍 Get AI Diagnosis'}
            </button>
          )}
        </div>
      </form>

      {apiError && (
        <div className="diag-api-error">
          <AlertCircle size={20} />
          <div>
            <strong>Error:</strong> {apiError}
          </div>
        </div>
      )}

      {diagnosis && (
        <div className="diagnosis-result">
          <div className="diag-result-header">
            <CheckCircle size={24} color="#10b981" />
            <h2>AI Diagnosis Report</h2>
          </div>
          <div className="diag-disclaimer">⚠️ This is AI-generated information only — not a substitute for professional medical advice.</div>
          <ReactMarkdown>{diagnosis}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default Diagnosis;