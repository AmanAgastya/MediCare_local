import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import "./VaidyaChatbot.css";
import VaidyaLogo from "./VaidyaLogo";

// ── System prompt for Vaidya ─────────────────────────────────────────────────
const VAIDYA_SYSTEM_PROMPT = `You are Vaidya, a knowledgeable and compassionate AI health assistant for the MediCare platform.

Your role:
- Answer health-related questions clearly and accurately
- Help users understand symptoms, medications, conditions, and general wellness
- Guide users to the right MediCare features: appointments, lab tests, diagnosis tool, blood donation, organ donation, financial aid, medicine store, telemedicine
- Always remind users that your advice is informational and not a substitute for professional medical consultation

MediCare platform features you can guide users to:
- /diagnosis → AI Health Diagnosis form
- /appointment-booking → Book a doctor appointment
- /lab-tests → Order lab tests
- /medstore → Order medicines online
- /blood-donation → Blood donation
- /organ-donation → Organ donation
- /financial-aid → Medical financial aid
- /telemedicine → Telemedicine consultation
- /depression-test → Mental health screening
- /diet → Diet & nutrition plans
- /first-aid → First aid guide

Guidelines:
- Be warm, clear, and concise
- Use simple language — avoid heavy medical jargon unless explaining it
- For serious symptoms (chest pain, breathing difficulty, stroke signs), always advise calling emergency services immediately
- Never diagnose definitively — always recommend consulting a real doctor
- Keep responses focused and helpful, not overly long
- Format using markdown: bold key terms, use bullet points for lists`;

// ── Backend AI call (proxies to Gemini safely with correct payload) ───────────
const callAI = async (messages) => {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const res = await fetch(`${API_BASE}/api/ai/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      systemPrompt: VAIDYA_SYSTEM_PROMPT,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'AI service error');
  return data.text;
};

// ── Quick suggestion chips ───────────────────────────────────────────────────
const QUICK_CHIPS = [
  "What are common cold symptoms?",
  "How do I book an appointment?",
  "Tell me about blood donation",
  "I have a headache and fever",
  "Order medicines online",
  "Mental health support",
];

// ── Typing indicator ─────────────────────────────────────────────────────────
const TypingDots = () => (
  <div className="vc-typing">
    <span /><span /><span />
  </div>
);

// ── Single message bubble ─────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => (
  <div className={`vc-msg vc-msg--${msg.role}`}>
    {msg.role === "assistant" && (
      <div className="vc-avatar">
        <span>🩺</span>
      </div>
    )}
    <div className="vc-bubble">
      {msg.role === "assistant" ? (
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <a href={href} onClick={(e) => { e.preventDefault(); window.location.href = href; }}>
                {children}
              </a>
            ),
          }}
        >
          {msg.content}
        </ReactMarkdown>
      ) : (
        <p>{msg.content}</p>
      )}
      <span className="vc-time">{msg.time}</span>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const VaidyaChatbot = () => {
  const [open, setOpen]       = useState(false);
  const [input, setInput]     = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hello! I'm **Vaidya**, your AI health assistant on MediCare.\n\nI can help you with health questions, symptoms, medicines, and guide you to the right services. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isTyping, setIsTyping]   = useState(false);
  const [error, setError]         = useState("");
  const [showChips, setShowChips] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isTyping) return;

    const userMsg = {
      role: "user",
      content: trimmed,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setError("");
    setShowChips(false);

    try {
      // Build history for context (last 10 messages)
      const history = [...messages, userMsg].slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reply = await callAI(history);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! How can I help you?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setShowChips(true);
    setError("");
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        className={`vc-fab ${open ? "vc-fab--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Open Vaidya chatbot"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:22,height:22}}>
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <VaidyaLogo size={34} variant="white" animated={true} />
        )}
        {!open && <span className="vc-fab-pulse" />}
      </button>

      {/* Chat window */}
      <div className={`vc-window ${open ? "vc-window--open" : ""}`} role="dialog" aria-label="Vaidya Health Chatbot">

        {/* Header */}
        <div className="vc-header">
          <div className="vc-header-left">
            <div className="vc-header-avatar"><VaidyaLogo size={32} variant="white" animated={false} /></div>
            <div>
              <p className="vc-header-name">Vaidya</p>
              <p className="vc-header-status">
                <span className="vc-status-dot" />
                AI Health Assistant
              </p>
            </div>
          </div>
          <div className="vc-header-actions">
            <button onClick={clearChat} title="Clear chat" className="vc-icon-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" /><polyline points="23 20 23 14 17 14" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            </button>
            <button onClick={() => setOpen(false)} className="vc-icon-btn" title="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="vc-messages">
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
          {isTyping && (
            <div className="vc-msg vc-msg--assistant">
              <div className="vc-avatar"><VaidyaLogo size={26} variant="color" animated={false} /></div>
              <div className="vc-bubble"><TypingDots /></div>
            </div>
          )}
          {error && (
            <div className="vc-error">
              ⚠️ {error}
              {error.includes("API key") && (
                <p>Make sure the backend is running and <code>GEMINI_API_KEY</code> is set in <code>backend/.env</code></p>
              )}
            </div>
          )}
          {/* Quick chips — only shown at start */}
          {showChips && messages.length === 1 && (
            <div className="vc-chips">
              {QUICK_CHIPS.map((chip) => (
                <button key={chip} className="vc-chip" onClick={() => sendMessage(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="vc-input-area">
          <textarea
            ref={inputRef}
            className="vc-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Vaidya anything about health…"
            rows={1}
            disabled={isTyping}
          />
          <button
            className="vc-send-btn"
            onClick={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>

        <p className="vc-disclaimer">Not a substitute for professional medical advice.</p>
      </div>
    </>
  );
};

export default VaidyaChatbot;