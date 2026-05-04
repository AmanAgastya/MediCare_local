import React, { useState, useEffect } from 'react';
import { Users, Clock, Hospital, Stethoscope, Heart, Calendar, MapPin, Droplet, TestTubeDiagonal, PillBottle, BrainCircuit,History, BotMessageSquare, User } from 'lucide-react';
import { State, City } from 'country-state-city';
import FAQs from './FAQs';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const services = [
  { id: 1, title: 'Medical History', icon: <History />, details: ['Past Diagnosis', 'Past Reports', 'Past Treatments'] },
  { id: 2, title: 'AI Diagnosis', icon: <BotMessageSquare />, details: ['AI Diagnosis'] },
  { id: 3, title: 'Government Schemes', icon: <Users />, details: [
      'Ayushman Bharat - National Health Protection Mission (AB-NHPS)',
      'Central Government Health Scheme (CGHS)',
      'Rashtriya Swasthya Bima Yojana (RSBY)',
      'Pradhan Mantri Jan Arogya Yojana (PMJAY)',
      'National Health Mission (NHM)',
      'And benefits of various other central and state government schemes.'
    ] 
  },
  { id: 4, title: 'Donations', icon: <Droplet />, details: ['Blood Donation', 'Organ Donation', 'Financial Aid'] },
  { id: 5, title: 'Labs', icon: <TestTubeDiagonal />, details: ['Schedule Tests', 'View Report'] },
  { id: 6, title: 'Telemedecine', icon: <PillBottle />, details: ['Order Medicines Online'] },
  { id: 7, title: 'Mental Health', icon: <BrainCircuit />, details: ['Are You Depressed? Find out about your mental health status.'] },
  { id: 8, title: 'For Organisations', icon: <Hospital />, details: ['Hospital Login', 'Register Your Hosiptal', 'Doctor Login'] },
  { id: 9, title: 'About Us', icon: <User />, details: ['About Us'] },
];

const getServiceLink = (serviceId, detail) => {
  const links = {
    1: {
      'Past Diagnosis': '/medical-history',
      'Past Reports': '/medical-history',
      'Past Treatments': '/medical-history'
    },
    2: {
      'AI Diagnosis': '/diagnosis'
    },
    6: {
      'Order Medicines Online': '/medstore'
    },
    4: {
      'Blood Donation': '/blood-donation',
      'Organ Donation': '/organ-donation',
      'Financial Aid': '/financial-aid'
    },
    5: {
      'Schedule Tests': '/lab-tests',
      'View Report': '/lab-tests'
      },
    3: {
      'Ayushman Bharat - National Health Protection Mission (AB-NHPS)': 'https://abdm.gov.in/',
      'Central Government Health Scheme (CGHS)': 'https://cghs.gov.in/',
      'Rashtriya Swasthya Bima Yojana (RSBY)': 'https://www.india.gov.in/spotlight/rashtriya-swasthya-bima-yojana',
      'Pradhan Mantri Jan Arogya Yojana (PMJAY)': 'https://pmjay.gov.in/',
      'National Health Mission (NHM)': 'https://nhm.gov.in/',
    },
    7: {
      'Are You Depressed? Find out about your mental health status.': '/depression-test' 
    },
    8: {
      'Hospital Login': '/hospital-login',
      'Register Your Hosiptal': '/hospital-signup',
       'Doctor Login': '/doctor-login'
      },
    9: {
      'About Us': '/aboutus'
    }
  };
  
  return links[serviceId]?.[detail] || null;
};

const hospitals = [
  // WEST BENGAL
  { id: 1, name: 'Ruby General Hospital', location: 'EM Bypass, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 2, name: 'Apollo Multispeciality Hospital', location: 'Salt Lake, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 3, name: 'AMRI Hospital', location: 'Dhakuria, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 4, name: 'Fortis Hospital', location: 'Anandapur, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 5, name: 'Medica Superspecialty Hospital', location: 'Mukundapur, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 6, name: 'District Hospital', location: 'Kharagpur, West Bengal', city: 'Kharagpur', state: 'West Bengal' },
  { id: 7, name: 'Burdwan Medical College', location: 'Bardhaman, West Bengal', city: 'Bardhaman', state: 'West Bengal' },
  { id: 43, name: 'SSKM Hospital', location: 'A.J.C. Bose Road, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 30, name: 'NRS Medical College', location: 'Sealdah, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 31, name: 'RG Kar Medical College', location: 'Belgachia, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 32, name: 'Peerless Hospital', location: 'Panchasayar, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 33, name: 'Desun Hospital', location: 'Kasba, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 34, name: 'ILS Hospital', location: 'Salt Lake, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 35, name: 'Belle Vue Clinic', location: 'Loudon Street, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 36, name: 'Woodlands Hospital', location: 'Alipore, Kolkata, West Bengal', city: 'Kolkata', state: 'West Bengal' },
  { id: 37, name: 'Narayan Hospital', location: 'Andul Road, Howrah, West Bengal', city: 'Howrah', state: 'West Bengal' },
  { id: 38, name: 'Howrah District Hospital', location: 'Howrah, West Bengal', city: 'Howrah', state: 'West Bengal' },
  { id: 39, name: 'Durgapur Steel Plant Hospital', location: 'Durgapur, West Bengal', city: 'Durgapur', state: 'West Bengal' },
  { id: 40, name: 'Mission Hospital', location: 'Durgapur, West Bengal', city: 'Durgapur', state: 'West Bengal' },
  { id: 41, name: 'North Bengal Medical College', location: 'Siliguri, West Bengal', city: 'Siliguri', state: 'West Bengal' },
  { id: 42, name: 'Neotia Getwel Healthcare Centre', location: 'Siliguri, West Bengal', city: 'Siliguri', state: 'West Bengal' },

  // MAHARASHTRA
  { id: 8, name: 'Lilavati Hospital', location: 'Bandra, Mumbai, Maharashtra', city: 'Mumbai', state: 'Maharashtra' },
  { id: 9, name: 'Kokilaben Dhirubhai Ambani Hospital', location: 'Andheri, Mumbai, Maharashtra', city: 'Mumbai', state: 'Maharashtra' },
  { id: 10, name: 'Tata Memorial Hospital', location: 'Parel, Mumbai, Maharashtra', city: 'Mumbai', state: 'Maharashtra' },
  { id: 11, name: 'Jehangir Hospital', location: 'Pune, Maharashtra', city: 'Pune', state: 'Maharashtra' },

  // DELHI
  { id: 12, name: 'AIIMS Delhi', location: 'Ansari Nagar, New Delhi', city: 'Delhi', state: 'Delhi' },
  { id: 13, name: 'Fortis Escorts Heart Institute', location: 'Okhla, Delhi', city: 'Delhi', state: 'Delhi' },
  { id: 14, name: 'Max Super Speciality Hospital', location: 'Saket, Delhi', city: 'Delhi', state: 'Delhi' },

  // KARNATAKA
  { id: 15, name: 'Manipal Hospital', location: 'Old Airport Road, Bangalore, Karnataka', city: 'Bangalore', state: 'Karnataka' },
  { id: 16, name: 'Narayana Health City', location: 'Bommasandra, Bangalore, Karnataka', city: 'Bangalore', state: 'Karnataka' },

  // TAMIL NADU
  { id: 17, name: 'Apollo Hospital', location: 'Greams Road, Chennai, Tamil Nadu', city: 'Chennai', state: 'Tamil Nadu' },
  { id: 18, name: 'MIOT International', location: 'Manapakkam, Chennai, Tamil Nadu', city: 'Chennai', state: 'Tamil Nadu' },

  // TELANGANA
  { id: 19, name: 'Yashoda Hospital', location: 'Somajiguda, Hyderabad, Telangana', city: 'Hyderabad', state: 'Telangana' },
  { id: 20, name: 'Care Hospital', location: 'Banjara Hills, Hyderabad, Telangana', city: 'Hyderabad', state: 'Telangana' },

  // BIHAR
  { id: 21, name: 'Paras HMRI Hospital', location: 'Raja Bazar, Patna, Bihar', city: 'Patna', state: 'Bihar' },
  { id: 22, name: 'IGIMS', location: 'Sheikhpura, Patna, Bihar', city: 'Patna', state: 'Bihar' },
  { id: 29, name: 'Ruban Memorial Hospital', location: 'Patna, Bihar', city: 'Patna', state: 'Bihar' },

  // UTTAR PRADESH
  { id: 23, name: 'Sanjay Gandhi Postgraduate Institute', location: 'Lucknow, Uttar Pradesh', city: 'Lucknow', state: 'Uttar Pradesh' },
  { id: 24, name: 'King George Medical University', location: 'Lucknow, Uttar Pradesh', city: 'Lucknow', state: 'Uttar Pradesh' },

  // GUJARAT
  { id: 25, name: 'Civil Hospital', location: 'Ahmedabad, Gujarat', city: 'Ahmedabad', state: 'Gujarat' },
  { id: 26, name: 'Sterling Hospital', location: 'Ahmedabad, Gujarat', city: 'Ahmedabad', state: 'Gujarat' },

  // RAJASTHAN
  { id: 27, name: 'SMS Hospital', location: 'Jaipur, Rajasthan', city: 'Jaipur', state: 'Rajasthan' },
  { id: 28, name: 'Fortis Hospital', location: 'Jaipur, Rajasthan', city: 'Jaipur', state: 'Rajasthan' },
];

const Home = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [displayLocation, setDisplayLocation] = useState('');
  const [filteredHospitals, setFilteredHospitals] = useState(hospitals.slice(0, 5));

  useEffect(() => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, []);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await response.json();
            const address = data.address || {};
            const city = address.town || address.city || '';
            const state = address.state || '';
            setSelectedCity(city);
            setSelectedState(state);
            setDisplayLocation(`Your Location: ${city}, ${state}`);
          } catch (error) {
            console.error('Error fetching location data:', error);
            setDisplayLocation('Unable to detect location. Please select manually.');
          }
        },
        (error) => {
          console.error('Error detecting location:', error);
          setDisplayLocation('Unable to detect location. Please select manually.');
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
      setDisplayLocation('Geolocation is not supported. Please select manually.');
    }
  };

  const states = State.getStatesOfCountry('IN');
  const cities = City.getCitiesOfState('IN', selectedState);

  useEffect(() => {
    let updatedHospitals = [];
    if (selectedCity) {
      updatedHospitals = hospitals.filter(hospital => hospital.city === selectedCity).slice(0, 14);
    } else if (selectedState) {
      updatedHospitals = hospitals.filter(hospital => hospital.state === selectedState).slice(0, 14);
    } else {
      updatedHospitals = hospitals.slice(0, 5);
    }
  
    setFilteredHospitals(updatedHospitals);
  }, [selectedState, selectedCity]);

  return (
    <div className={`home ${darkMode ? 'dark-mode' : ''}`}>

      <div className="background-elements">
        <svg className="background-left" width="100%" height="100%" viewBox="0 0 500 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="200" cy="400" r="200" stroke="var(--primary-color)" strokeOpacity="0.4" strokeWidth="8" fill="none" />
          <circle cx="200" cy="650" r="150" stroke="var(--primary-color)" strokeOpacity="0.45" strokeWidth="6" fill="none" />
          <circle cx="250" cy="150" r="100" stroke="var(--primary-color)" strokeOpacity="0.5" strokeWidth="4" fill="none" />
        </svg>
        <svg className="background-right" width="100%" height="100%" viewBox="0 0 500 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="300" cy="400" r="200" stroke="var(--primary-color)" strokeOpacity="0.4" strokeWidth="8" fill="none" />
          <circle cx="250" cy="150" r="150" stroke="var(--primary-color)" strokeOpacity="0.45" strokeWidth="6" fill="none" />
          <circle cx="300" cy="650" r="100" stroke="var(--primary-color)" strokeOpacity="0.5" strokeWidth="4" fill="none" />
        </svg>
      </div>

      <div className="content-wrapper">
        <section className="hero">
          <div className="hero-content">
            <h1>Your One Stop Wellness Portal</h1>
            <p>Connecting Hospital, Empower your well-being with personalized health solutions at your fingertips. <br />Find Online Medical Centers, Connect instantly with a 24x7 specialist or choose to video visit a particular doctor.</p>
            <button className="cta-button-app" onClick={() => navigate("/appointment-booking")}>Appointment Now</button>
          </div>
          <div className="hero-image">
            <img src='/HeroImg.png' alt="Hero" />
          </div>
        </section>

        <section className="features">
          {[
            { icon: <Stethoscope size={32} />, title: "AI Health Diagnosis", description: "Cutting-edge AI technology for accurate health diagnostics." },
            { icon: <Calendar size={32} />, title: "Appointment Booking", description: "Easy and efficient appointment booking system." },
            { icon: <Clock size={32} />, title: "24/7 Support", description: "Round-the-clock customer support for all your queries." },
            { icon: <Heart size={32} />, title: "Personalized Health Plans", description: "Customized health plans tailored to individual needs." }
          ].map((feature, index) => (
            <div key={index} className="feature-box">
              <div className="feature">
                {feature.icon}
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="services">
        <h2>Services</h2>
        <div className="services-container">
          <div className="services-grid">
            {services.map((service) => (
              <div 
                key={service.id} 
                className={`service-item ${selectedService === service.id ? 'selected' : ''}`}
                onClick={() => setSelectedService(service.id)}
              >
                <div className="service-header">
                  {service.icon}
                  <h3>{service.title}</h3>
                </div>
              </div>
            ))}
          </div>
          <div className="service-details">
            <h3>{services.find(service => service.id === selectedService)?.title}</h3>
            {services.find(service => service.id === selectedService)?.details.map((detail, index) => (
              <p key={index}>
                {getServiceLink(selectedService, detail) ? (
                  <a
                    href={getServiceLink(selectedService, detail)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="scheme-link"
                  >
                    {detail}
                  </a>
                ) : (
                  detail
                )}
              </p>
            ))}
          </div>
        </div>
      </section>

        <section className="premium-features">
          <div className="premium-heading">
            <span className="star">⭐</span>
            <h2>Premium Features</h2>
            <span className="star">⭐</span>
          </div>
          <div className="premium-grid">
            <div className="premium-feature">
              <h3>Advanced Diagnostics</h3>
              <p>Get detailed health diagnostics with our premium AI technology.</p>
            </div>
            <div className="premium-feature">
              <h3>Priority Support</h3>
              <p>Enjoy expedited support with dedicated priority service.</p>
            </div>
            <div className="premium-feature">
              <h3>Exclusive Health Plans</h3>
              <p>Access exclusive, tailored health plans designed for optimal care.</p>
            </div>
            <div className="premium-feature">
              <h3>Personal Health Coach</h3>
              <p>Work with a personal health coach to achieve your wellness goals.</p>
            </div>
          </div>
        </section>

        <section className="partnered-hospitals">
          <h2>Partnered Hospitals</h2>
          <div className="hospital-container">
            <div className="hospital-options">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedState}
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
              <div className="or-divider">
                <span>or</span>
              </div>
              <button className="location-button" onClick={detectLocation}>
                <MapPin size={16} /> Detect my Location
              </button>
              {displayLocation && (
                <p className="location-display">{displayLocation}</p>
              )}
            </div>
            <div className="hospital-carousel">
              <h3>{selectedCity ? `Top Hospitals in ${selectedCity}` : selectedState ? `Top Hospitals in ${selectedState}` : 'Top 5 Hospitals'}</h3>
              <div className="carousel-wrapper">
                {filteredHospitals.length > 0 ? (
                  filteredHospitals.map((hospital) => (
                    <div key={hospital.id} className="carousel-item">
                      <h3>{hospital.name}</h3>
                      <p>{hospital.location}</p>
                    </div>
                  ))
                ) : (
                  <p>No hospitals available in this area.</p>
                )}
              </div>
            </div>
          </div>
        </section>
        <section id="faqs" className="FAQs">
        <div className="FAQs-container">
        <FAQs />
        </div>
        </section>
      </div>
    </div>
  );
};

export default Home;