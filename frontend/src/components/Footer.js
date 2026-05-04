import React from 'react';
import './Footer.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faXTwitter, faInstagram, faLinkedinIn, faYoutube } from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="content-wrapper">
      <div className="footer-left">
      <div className="logo">
          <img src="/Medicare_Logo.svg" alt="Medicare Logo"/>
        </div>
        <div className="footer-socials">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <FontAwesomeIcon icon={faFacebookF} />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
            <FontAwesomeIcon icon={faXTwitter} />
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <FontAwesomeIcon icon={faLinkedinIn} />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
            <FontAwesomeIcon icon={faYoutube} />
          </a>
        </div>
       </div>

         <div className="footer-links">

          <div className="footer-column">
            <h4>Company</h4>
            <a href='/aboutus'>About Us</a>
            <a href='/privacy-policy'>Privacy Policy</a>
            <a href='/feedback'>Feedback</a>
          </div>

          <div className="footer-column">
            <h4>Check</h4>
            <a href="/appointment-booking">Appointment</a>
            <a href='/premium'>Our Pricing</a>
            <a href="/#faqs">FAQs</a>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <a href="/login">Login/Register</a>
            <a href="/medstore">Medical Store</a>
            <a href='/doctor-login'>Doctor Login</a>
          </div>

        </div>
      </div>

        <div className="footer-bottom">
          <p>&copy; 2025 MediCare. All Rights Reserved by Team 28.</p>
        </div>
    </footer>
  );
};

export default Footer;