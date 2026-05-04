import React from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "1. Information We Collect",
      content: `We collect information you provide directly to us when you:
• Create an account (name, email address, phone number, password)
• Book appointments (health information, preferred doctor, date and time)
• Use our blood or organ donation services (blood type, medical history)
• Submit feedback or contact us
• Use our telemedicine services (health symptoms, medical records you choose to share)

We also automatically collect certain technical information such as your IP address, browser type, device information, and usage data through cookies and similar technologies.`
    },
    {
      title: "2. How We Use Your Information",
      content: `We use the information we collect to:
• Provide, maintain, and improve our services
• Process and manage appointment bookings
• Connect you with verified hospitals and doctors
• Send you service-related notifications and updates
• Respond to your comments, questions, and requests
• Monitor and analyze usage patterns to enhance user experience
• Ensure the security and integrity of our platform
• Comply with legal obligations`
    },
    {
      title: "3. Information Sharing",
      content: `We share your information only in the following circumstances:
• With hospitals and doctors you choose to book with — only the information necessary for your appointment
• With service providers who assist us in operating the platform (under strict confidentiality agreements)
• When required by law, court order, or government authority
• To protect the rights, property, or safety of MediCare, our users, or the public

We do NOT sell, rent, or trade your personal information to third parties for marketing purposes.`
    },
    {
      title: "4. Data Security",
      content: `We take the security of your information seriously and implement industry-standard measures including:
• Encryption of data in transit using TLS/SSL
• Secure storage of passwords using bcrypt hashing
• JWT-based authentication with token expiry
• Regular security audits and vulnerability assessments
• Access controls limiting who within MediCare can access sensitive data

No system is 100% secure. In the event of a data breach, we will notify affected users as required by applicable law.`
    },
    {
      title: "5. Your Rights & Choices",
      content: `You have the following rights regarding your personal data:
• Access: Request a copy of the personal data we hold about you
• Correction: Request correction of inaccurate or incomplete data
• Deletion: Request deletion of your account and associated data
• Portability: Request your data in a portable format
• Objection: Object to certain uses of your data

To exercise any of these rights, contact us at privacy@medicare.com. We will respond within 30 days.`
    },
    {
      title: "6. Cookies & Tracking",
      content: `MediCare uses cookies and similar tracking technologies to:
• Keep you logged in across sessions
• Remember your preferences (e.g., dark mode)
• Analyze how our service is used

You can control cookies through your browser settings. Disabling cookies may affect the functionality of some features on our platform.`
    },
    {
      title: "7. Children's Privacy",
      content: `MediCare is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately and we will promptly delete it.`
    },
    {
      title: "8. Changes to This Policy",
      content: `We may update this Privacy Policy from time to time to reflect changes in our practices or for legal reasons. When we make material changes, we will:
• Post the new policy on this page with an updated "Last Updated" date
• Send an email notification to registered users
• Display a prominent notice on our platform

Your continued use of MediCare after any changes constitutes your acceptance of the updated policy.`
    },
    {
      title: "9. Contact Us",
      content: `If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact:

📧 Email: privacy@medicare.com
📞 Phone: +91-XXX-XXX-XXXX
📍 Address: MediCare Health Technologies, [City], India

We are committed to resolving any privacy concerns promptly and transparently.`
    }
  ];

  return (
    <div className="pp-page">
      <div className="pp-hero">
      <br/>
        <h1>🔒 Privacy Policy</h1>
        <p>Last Updated: January 2025</p>
        <p className="pp-tagline">Your privacy is important to us. This policy explains how MediCare collects, uses & protects your information.</p>
      </div>

      <div className="pp-container">
        <div className="pp-intro">
          <p>Welcome to MediCare. By using our platform, you agree to the collection and use of information in accordance with this policy. Please read it carefully before using our services.</p>
        </div>

        {sections.map((section, i) => (
          <div key={i} className="pp-section">
            <h2 className="pp-section-title">{section.title}</h2>
            <p className="pp-section-content">{section.content}</p>
          </div>
        ))}

        <div className="pp-footer-note">
          <p>🏥 MediCare is committed to protecting your health data with the highest standards of privacy and security.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;