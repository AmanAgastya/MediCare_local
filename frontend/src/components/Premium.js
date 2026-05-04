import React, { useState, useEffect, useCallback } from 'react';
import { User, Clipboard, Headphones, Microscope, Clock, Zap, Users, Star, Heart, Shield, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Premium.css';

const PremiumFeatures = () => {
  const features = [
    { icon: <User size={32} />,       title: 'Personal Health Coach',       description: 'Work 1-on-1 with a certified health coach to achieve your wellness and fitness goals.' },
    { icon: <Clipboard size={32} />,  title: 'Exclusive Health Plans',       description: 'Access fully tailored diet, exercise, and medication plans designed by specialists.' },
    { icon: <Headphones size={32} />, title: 'Priority 24/7 Support',        description: 'Reach a real medical professional any time via chat, call, or video — day or night.' },
    { icon: <Microscope size={32} />, title: 'Advanced AI Diagnostics',      description: 'Get in-depth health diagnostics with our premium AI technology and specialist review.' },
    { icon: <Activity size={32} />,   title: 'Real-Time Health Monitoring',  description: 'Connect wearables and track vitals, sleep, and activity with live alerts.' },
    { icon: <Shield size={32} />,     title: 'Comprehensive Health Reports', description: 'Receive detailed quarterly reports reviewed by board-certified doctors.' },
  ];

  const reasons = [
    { icon: <Star size={24} />,   title: 'Personalized Care',        description: 'Tailored health solutions that adapt to your unique body and lifestyle.' },
    { icon: <Clock size={24} />,  title: 'Time-Saving',              description: 'Skip queues with priority appointments and instant doctor responses.' },
    { icon: <Zap size={24} />,    title: 'Cutting-Edge Technology',  description: 'Access the latest AI health tech for sharper insights and better outcomes.' },
    { icon: <Users size={24} />,  title: 'Exclusive Community',      description: 'Join a network of health-focused members and expert-led wellness groups.' },
    { icon: <Heart size={24} />,  title: 'Preventive Focus',         description: 'Stay ahead of illness with proactive screenings and lifestyle coaching.' },
    { icon: <Shield size={24} />, title: 'Full Privacy Protection',  description: 'Your health data is encrypted, private, and never shared or sold.' },
  ];

  // ✅ FIX: Added missing `rating` and `avatar` fields — these were undefined in the
  //         original, causing '★'.repeat(undefined) → NaN → React render crash → blank page.
  const testimonials = [
    {
      quote:  "The personal health coach completely transformed my lifestyle. I lost 18 kg in 6 months and my blood pressure is now normal. Best investment in my health ever.",
      author: "Priya Sharma",
      role:   "Software Engineer, Bangalore",
      avatar: "PS",
      rating: 5,
    },
    {
      quote:  "Advanced diagnostics caught early-stage prediabetes that my regular checkup missed. The detailed report with an actual doctor's review gave me the clarity I needed to act immediately.",
      author: "Rajesh Mehta",
      role:   "Business Owner, Mumbai",
      avatar: "RM",
      rating: 5,
    },
    {
      quote:  "Priority support is a lifesaver — literally. I had a health scare at 2 AM and got a doctor on video call within minutes. That kind of peace of mind is priceless.",
      author: "Ananya Iyer",
      role:   "Teacher, Chennai",
      avatar: "AI",
      rating: 5,
    },
    {
      quote:  "The personalized diet and exercise plan actually fits my busy schedule. My energy levels are through the roof and my doctor noticed the improvement in my last checkup.",
      author: "Vikram Nair",
      role:   "Marketing Manager, Hyderabad",
      avatar: "VN",
      rating: 4,
    },
    {
      quote:  "As someone with a family history of heart disease, the real-time health monitoring and quarterly reports give me and my cardiologist a complete picture. Absolutely worth it.",
      author: "Sunita Patel",
      role:   "Retired Principal, Ahmedabad",
      avatar: "SP",
      rating: 5,
    },
    {
      quote:  "I was skeptical at first, but MediCare Premium's AI diagnosis identified a vitamin D deficiency and iron anaemia that explained months of fatigue. Now I feel like a new person.",
      author: "Arjun Kapoor",
      role:   "Student, Delhi",
      avatar: "AK",
      rating: 4,
    },
  ];

  const plans = [
    {
      name:    "Basic",
      price:   "₹299",
      period:  "/month",
      color:   "#6b7280",
      popular: false,
      features: ["AI Diagnosis (5/month)", "Priority booking", "Basic health reports", "Email support"],
      cta:     "Get Started",
    },
    {
      name:    "Premium",
      price:   "₹499",
      period:  "/month",
      color:   "#4a90e2",
      popular: true,
      features: ["Unlimited AI Diagnosis", "Personal Health Coach", "Advanced diagnostics", "24/7 priority support", "Real-time monitoring", "Quarterly reports"],
      cta:     "Go Premium",
    },
    {
      name:    "Family",
      price:   "₹999",
      period:  "/month",
      color:   "#10b981",
      popular: false,
      features: ["Everything in Premium", "Up to 5 family members", "Family health dashboard", "Shared emergency contact", "Dedicated family doctor"],
      cta:     "Choose Family",
    },
  ];

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const navigate = useNavigate();

  const rotateTestimonial = useCallback(() => {
    setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    const interval = setInterval(rotateTestimonial, 5000);
    return () => clearInterval(interval);
  }, [rotateTestimonial]);

  const prev = () => setCurrentTestimonial(p => (p - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrentTestimonial(p => (p + 1) % testimonials.length);

  return (
    <div className="Premium-page">
      <div className="background-elements">
        <div className="background-left">
          <svg width="100%" height="100%" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#4a90e2" strokeWidth="0.5"/>
            <circle cx="100" cy="100" r="60" fill="none" stroke="#4a90e2" strokeWidth="0.5"/>
            <circle cx="100" cy="100" r="40" fill="none" stroke="#4a90e2" strokeWidth="0.5"/>
          </svg>
        </div>
        <div className="background-right">
          <svg width="100%" height="100%" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#4a90e2" strokeWidth="0.5"/>
            <circle cx="100" cy="100" r="60" fill="none" stroke="#4a90e2" strokeWidth="0.5"/>
            <circle cx="100" cy="100" r="40" fill="none" stroke="#4a90e2" strokeWidth="0.5"/>
          </svg>
        </div>
      </div>

      <main>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section id="Premium-hero">
          <h1>Elevate Your Healthcare</h1>
          <p>Unlock world-class benefits with MediCare Premium — your partner in complete, proactive healthcare</p>
          <div className="premium-hero-badges">
            <span>✅ Trusted by 100+ members</span>
            <span>✅ Board-certified doctors</span>
            <span>✅ Cancel anytime</span>
          </div>
          <button onClick={() => navigate("/login")} className="Premium-cta-button">
            Start Free Trial
          </button>
        </section>

        {/* ── Features ─────────────────────────────────────────────────────── */}
        <section id="Premium-features">
          <h2>Premium Features</h2>
          <p className="section-sub">Everything you need for complete, proactive healthcare</p>
          <div className="Premium-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="Premium-feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Why Premium ──────────────────────────────────────────────────── */}
        <section id="Premium-why-premium">
          <h2>Why Choose Premium?</h2>
          <p className="section-sub section-sub-light">Designed for people who take their health seriously</p>
          <div className="Premium-reasons-grid">
            {reasons.map((reason, index) => (
              <div key={index} className="Premium-reason">
                <div className="reason-icon">{reason.icon}</div>
                <h3>{reason.title}</h3>
                <p>{reason.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────────────────── */}
        <section id="Premium-pricing">
          <h2>Simple, Transparent Pricing</h2>
          <p className="section-sub">No hidden fees. Cancel anytime.</p>
          <div className="premium-plans-grid">
            {plans.map((plan, i) => (
              <div key={i} className={`premium-plan-card ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <div className="plan-popular-badge">Most Popular</div>}
                <h3 style={{ color: plan.color }}>{plan.name}</h3>
                <div className="plan-price">
                  <span className="plan-amount">{plan.price}</span>
                  <span className="plan-period">{plan.period}</span>
                </div>
                <ul className="plan-features">
                  {plan.features.map((f, fi) => <li key={fi}>✓ {f}</li>)}
                </ul>
                <button
                  className="plan-cta"
                  style={{ background: plan.color }}
                  onClick={() => navigate('/login')}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────────────────────── */}
        <section id="Premium-testimonials">
          <h2>What Our Members Say</h2>
          <p className="section-sub">Real stories from real MediCare Premium members</p>

          <div className="premium-testimonial-wrapper">
            <button className="testimonial-nav prev" onClick={prev} aria-label="Previous testimonial">
              <ChevronLeft size={22} />
            </button>

            <div className="Premium-testimonial-carousel">
              {testimonials.map((t, index) => (
                <div
                  key={index}
                  className={`Premium-testimonial ${index === currentTestimonial ? 'active' : ''}`}
                >
                  <div className="testimonial-stars">
                    {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                  </div>
                  <p className="testimonial-quote">"{t.quote}"</p>
                  <div className="testimonial-author-row">
                    <div className="testimonial-avatar">{t.avatar}</div>
                    <div className="testimonial-author-info">
                      <span className="testimonial-author">{t.author}</span>
                      <span className="testimonial-role">{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="testimonial-nav next" onClick={next} aria-label="Next testimonial">
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="Premium-testimonial-dots">
            {testimonials.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentTestimonial ? 'active' : ''}`}
                onClick={() => setCurrentTestimonial(index)}
                role="button"
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </section>

        {/* ── CTA Banner ───────────────────────────────────────────────────── */}
        <section id="Premium-cta-banner">
          <h2>Ready to Take Control of Your Health?</h2>
          <p>Join 100+ members already living healthier with MediCare Premium</p>
          <div className="premium-cta-row">
            <button onClick={() => navigate('/login')} className="Premium-cta-button">
              Start 7-Day Free Trial
            </button>
            <button onClick={() => navigate('/aboutus')} className="premium-outline-btn">
              Learn More
            </button>
          </div>
        </section>

      </main>
    </div>
  );
};

export default PremiumFeatures;