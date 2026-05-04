import React, { useState } from 'react';
import { Heart, Droplet, IndianRupee, ChevronRight, Info } from 'lucide-react';
import './DonationDashboard.css';

const DonationDashboard = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const donationTypes = [
    {
      id: 'blood',
      href: '/blood-donation',
      icon: <Droplet size={32} />,
      title: 'Blood Donation',
      description: 'Donate blood and save up to 3 lives. Takes only 10–15 minutes.',
      color: '#ef4444',
      bg: '#fee2e2',
      stats: 'Every 2 seconds someone needs blood',
    },
    {
      id: 'organ',
      href: '/organ-donation',
      icon: <Heart size={32} />,
      title: 'Organ Donation',
      description: 'One donor can save up to 8 lives. Register your pledge today.',
      color: '#8b5cf6',
      bg: '#ede9fe',
      stats: '500,000+ people on waiting lists in India',
    },
    {
      id: 'financial',
      href: '/financial-aid',
      icon: <IndianRupee size={32} />,
      title: 'Financial Aid',
      description: 'Support patients who cannot afford medical treatment.',
      color: '#10b981',
      bg: '#d1fae5',
      stats: 'Help cover hospital bills & medicine costs',
    },
  ];

  const impactStats = [
    { label: 'Blood Donations', value: '450+', icon: '🩸' },
    { label: 'Organ Pledges', value: '30+', icon: '❤️' },
    { label: 'Families Helped', value: '80+', icon: '👨‍👩‍👧' },
    { label: 'Hospitals Partnered', value: '10+', icon: '🏥' },
  ];

  return (
    <div className="dd-page">
      {/* Hero */}
      <div className="dd-hero">
        <Heart size={48} color="#ef4444" />
        <br/>
        <h1>Make a Difference Today</h1>
        <p>Choose how you'd like to contribute and save lives in your community</p>
      </div>

      {/* Donation Cards */}
      <div className="dd-cards-section">
        <div className="dd-cards-grid">
          {donationTypes.map(type => (
            <a
              key={type.id}
              href={type.href}
              className={`dd-type-card ${hoveredCard === type.id ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredCard(type.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="dd-card-icon" style={{ background: type.bg, color: type.color }}>
                {type.icon}
              </div>
              <h3 style={{ color: type.color }}>{type.title}</h3>
              <p>{type.description}</p>
              <div className="dd-card-stat">
                <Info size={14} />
                <span>{type.stats}</span>
              </div>
              <div className="dd-card-cta" style={{ color: type.color }}>
                Get Started <ChevronRight size={16} />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Impact Stats */}
      <div className="dd-impact">
        <h2>Our Impact So Far</h2>
        <div className="dd-impact-grid">
          {impactStats.map((stat, i) => (
            <div key={i} className="dd-impact-card">
              <span className="dd-impact-emoji">{stat.icon}</span>
              <span className="dd-impact-num">{stat.value}</span>
              <span className="dd-impact-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="dd-how">
        <h2>How It Works</h2>
        <div className="dd-steps">
          {[
            { step: '1', title: 'Choose Your Cause', desc: 'Select blood, organ or financial aid' },
            { step: '2', title: 'Fill Your Details', desc: 'Complete a quick, secure form' },
            { step: '3', title: 'We Connect You', desc: 'Our team links you with verified hospitals' },
            { step: '4', title: 'Make an Impact', desc: 'Your donation saves real lives' },
          ].map((s, i) => (
            <div key={i} className="dd-step">
              <div className="dd-step-num">{s.step}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DonationDashboard;