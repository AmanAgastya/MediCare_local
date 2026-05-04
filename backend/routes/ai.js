const express = require('express');
const router  = express.Router();

// ── Groq API (free tier, no billing required) ──────────────────────────────
// Get your free key at: https://console.groq.com → API Keys
// Add to backend/.env:  GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // free, fast, very capable

// Shared helper — calls Groq with OpenAI-compatible format
async function callGroq(messages, temperature = 0.5, maxTokens = 1024) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set in backend/.env — get a free key at https://console.groq.com');

  const response = await fetch(GROQ_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages,
      temperature,
      max_tokens:  maxTokens,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Groq API error ${response.status}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from AI');
  return text;
}

// ── POST /api/ai/chat ──────────────────────────────────────────────────────
// Body: { messages: [{role, content}], systemPrompt?: string }
router.post('/chat', async (req, res) => {
  const { messages = [], systemPrompt = '' } = req.body;
  if (!messages.length) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const groqMessages = [];
  if (systemPrompt) groqMessages.push({ role: 'system', content: systemPrompt });
  messages.forEach(m => groqMessages.push({
    role:    m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));

  try {
    const text = await callGroq(groqMessages, 0.5, 1024);
    res.json({ text });
  } catch (err) {
    console.error('AI /chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/ai/diagnose ──────────────────────────────────────────────────
router.post('/diagnose', async (req, res) => {
  const {
    name, age, gender, symptoms, durationStart,
    medicalHistory, currentMedications, allergies,
  } = req.body;

  if (!symptoms) return res.status(400).json({ error: 'symptoms field is required' });

  try {
    const text = await callGroq([
      {
        role: 'system',
        content: `You are Vaidya, an expert AI medical assistant on the MediCare platform.
Provide thorough, structured health analysis. Always remind users to consult a real doctor.
Format your response using clear markdown headings and bullet points.`,
      },
      {
        role: 'user',
        content: `Analyze the following patient information and provide a detailed health report:

**Patient Information:**
- Name: ${name || 'Not provided'}
- Age: ${age || 'Not provided'}
- Gender: ${gender || 'Not provided'}
- Symptoms: ${symptoms}
- Symptom Start Date: ${durationStart || 'Not provided'}
- Medical History: ${medicalHistory || 'None'}
- Current Medications: ${currentMedications || 'None'}
- Known Allergies: ${allergies || 'None'}

Structure your response with exactly these sections:
## 📋 Patient Summary
## 🔍 Possible Conditions
## ⚠️ Warning Signs to Watch
## 💊 General Recommendations
## 🏥 Next Steps
## ⚕️ Important Disclaimer`,
      },
    ], 0.4, 2048);

    res.json({ text });
  } catch (err) {
    console.error('AI /diagnose error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;