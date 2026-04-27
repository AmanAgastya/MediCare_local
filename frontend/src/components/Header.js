import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Menu, Activity, Info, X, LogOut, Link2, Crown, BriefcaseBusiness, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

// ── Reusable dropdown — works on hover (desktop) AND click (mobile/touch) ────
const DropdownMenu = ({ icon, label, items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <li
      className={`dropdown-container1 ${open ? 'dd-open' : ''}`}
      ref={ref}
      onMouseEnter={() => window.innerWidth > 768 && setOpen(true)}
      onMouseLeave={() => window.innerWidth > 768 && setOpen(false)}
    >
      {/* Trigger button — NOT a link, so clicking never navigates away */}
      <button
        className="dd-trigger"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown size={14} className={`dd-chevron ${open ? 'dd-chevron-open' : ''}`} />
      </button>

      {/* Dropdown panel */}
      <ul className={`dropdown-menu1 ${open ? 'dd-visible' : ''}`} role="menu">
        {items.map((item, i) => (
          <li key={i} className="drop-menu" role="none">
            <Link
              className="dmn"
              to={item.href}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
};

// ── Nav data ──────────────────────────────────────────────────────────────────
const SERVICES = [
  { href: '/telemedicine', label: 'Telemedicine' },
  { href: '/diagnosis',    label: 'AI Diagnosis' },
  { href: '/medstore',     label: 'Medical Store' },
  { href: '/lab-tests',    label: 'Schedule Test' },
];

const PREMIUM = [
  { href: '/premium',            label: 'Learn More' },
  { href: '/under-construction', label: 'Detailed Report' },
  { href: '/under-construction', label: 'Chat with Doctor' },
  { href: '/diet',               label: 'Personalized Health/Diet Plan' },
];

const QUICKLINKS = [
  { href: '/medical-history',      label: 'Medical History' },
  { href: '/appointment-booking',  label: 'Direct Appointment Booking' },
  { href: '/donation-dashboard',   label: 'Donations' },
  { href: '/first-aid',            label: 'Basic First Aid' },
  { href: '/depression-test',      label: 'Are You Depressed?' },
  { href: '/feedback',             label: 'Feedback' },
];

// ── Header ────────────────────────────────────────────────────────────────────
const Header = ({ toggleTheme, isDarkMode }) => {
  const [isMenuOpen,  setIsMenuOpen]  = useState(false);
  const [isScrolled,  setIsScrolled]  = useState(false);
  const [isLoggedIn,  setIsLoggedIn]  = useState(false);
  const [userName,    setUserName]    = useState('');
  const [dashboardLink, setDashboardLink] = useState('/dashboard');
  const navigate = useNavigate();

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setIsMenuOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const check = () => {
      const token       = localStorage.getItem('token');
      const hosToken    = localStorage.getItem('hospitalToken');
      const docToken    = localStorage.getItem('doctorToken');
      const storedName  = localStorage.getItem('userName');

      if (storedName && (token || hosToken || docToken)) {
        setIsLoggedIn(true);
        setUserName(storedName);
        const role = localStorage.getItem('role');
        if (docToken)                              setDashboardLink('/doctor-dashboard');
        else if (hosToken)                         setDashboardLink('/hospital-dashboard');
        else if (role === 'admin' || role === 'super_admin') setDashboardLink('/admin-dashboard');
        else                                       setDashboardLink('/dashboard');
      } else {
        setIsLoggedIn(false);
        setUserName('');
        setDashboardLink('/dashboard');
      }
    };
    check();
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  const handleLogout = () => {
    ['token','hospitalToken','doctorToken','userName','role',
     'doctorName','doctorSpecialization','doctorHospitalName','doctorHospitalId']
      .forEach(k => localStorage.removeItem(k));
    setIsLoggedIn(false);
    setUserName('');
    window.dispatchEvent(new Event('storage'));
    navigate('/');
  };

  return (
    <header className={`header ${isDarkMode ? 'dark' : 'light'} ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-content">

        {/* Logo */}
        <div className="logo">
          <img src="/Medicare_Logo.svg" alt="Medicare Logo" />
        </div>

        {/* Nav */}
        <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
          {isMenuOpen && (
            <button className="close-menu" onClick={closeMenu} aria-label="Close menu">
              <X size={24} />
            </button>
          )}
          <ul>
            <li><Link to="/"        onClick={closeMenu}><Activity size={18} /> Home</Link></li>
            <li><Link to="/aboutus" onClick={closeMenu}><Info     size={18} /> About</Link></li>

            <DropdownMenu
              icon={<BriefcaseBusiness size={18} />}
              label="Services"
              items={SERVICES}
            />
            <DropdownMenu
              icon={<Crown size={18} />}
              label="Premium Services"
              items={PREMIUM}
            />
            <DropdownMenu
              icon={<Link2 size={18} />}
              label="Quick Links"
              items={QUICKLINKS}
            />
          </ul>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          <button className="menu-toggle" onClick={() => setIsMenuOpen(o => !o)} aria-label="Toggle menu">
            <Menu size={24} />
          </button>

          {isLoggedIn ? (
            <div className="user-info">
              <Link to={dashboardLink} className="dashboard-link" title="Go to Dashboard">
                <LayoutDashboard size={18} />
                <span className="user-name">{userName}</span>
              </Link>
              <button className="logout-button" onClick={handleLogout} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button className="login-button" onClick={() => navigate('/login')}>Login</button>
          )}

          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

      </div>
    </header>
  );
};

export default Header;