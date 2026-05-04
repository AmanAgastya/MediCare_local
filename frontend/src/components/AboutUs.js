import React from 'react';
import { Users, Heart, Award, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AboutUs.css';
import PatientCaring from './PatientCaring';

const AboutUs = () => {
  const navigate = useNavigate();
  return (
    <div className="about-us">
    <h1>About Us</h1>
    <p className="mission-statement">
          Empowering health and wellness through innovative digital solutions.
         <br/> We try to provides updates on Real-time Queues, Live Beds, Better Care.
        </p>
      <div className="content-wrapper">

         <section className="Patient-Caring">
        <div className="Caring-container">
        <PatientCaring />
        </div>
        </section>
        <div className="about-sections">
          <section className="our-story">
            <h2>Our Story</h2>
            <p>
              Founded in 2025, our journey began with a simple yet powerful idea: to make quality healthcare accessible to everyone, anytime, anywhere. We've grown from a small startup to a trusted healthcare partner, serving thousands of users across the globe.
            </p>
          </section>
           <div className="logo">
          <img src="/Medicare_Logo.svg" alt="Medicare Logo"/>
        </div>
          <section className="our-values">
            <h2>Our Values</h2>
            <div className="values-grid">
              <div className="value-item">
                <Users size={32} />
                <h3>Patient-Centric</h3>
                <p>We put our users' needs at the heart of everything we do.</p>
              </div>
              <div className="value-item">
                <Heart size={32} />
                <h3>Compassion</h3>
                <p>We approach healthcare with empathy and understanding.</p>
              </div>
              <div className="value-item">
                <Award size={32} />
                <h3>Excellence</h3>
                <p>We strive for the highest standards in digital healthcare.</p>
              </div>
              <div className="value-item">
                <Zap size={32} />
                <h3>Innovation</h3>
                <p>We continuously evolve to meet the changing needs of healthcare.</p>
              </div>
            </div>
          </section>

          <section className="our-team">
            <h2>Our Team</h2>
            <p>
              Our diverse team of Founders, technologists, and innovators work tirelessly to bring you the best in digital health solutions. Led by experienced industry veterans, we're committed to revolutionizing the way you experience healthcare.
            </p>
            <div className="team-container">
             <div className="member-card">
              <img src="/Aman1.jpeg" alt="Aman Agastya" />
              <p>Aman Agastya</p>
             </div>
             <div className="member-card">
              <img src="/Bhawesh1.jpeg" alt="Bhawesh Ranjan" />
              <p>Bhawesh Ranjan</p>
             </div>
             <div className="member-card">
              <img src="/Bikash1.jpeg" alt="Bikash Lal Shaw" />
              <p>Bikash Lal Shaw</p>
             </div> 
             <div className="member-card">
              <img src="/Ram.jpeg" alt="Rampratap Chauhan" />
              <p>Rampratap Chauhan</p>
             </div>
            </div>
          </section>

          <section className="our-impact">
            <h2>Our Impact</h2>
            <div className="impact-stats">
              <div className="stat-item">
                <h3>4+</h3>
                <p>Users Served</p>
              </div>
              <div className="stat-item">
                <h3>98%</h3>
                <p>User Satisfaction</p>
              </div>
              <div className="stat-item">
                <h3>24/7</h3>
                <p>Support</p>
              </div>
            </div>
          </section>
        </div>

        <div className="cta-section">
          <h2>Join Us in Shaping the Future of Healthcare</h2>
          <p>Experience the difference with our innovative health solutions.</p>
          <button className="cta-button" onClick={() => navigate('/login')}>Get Started Today</button>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;