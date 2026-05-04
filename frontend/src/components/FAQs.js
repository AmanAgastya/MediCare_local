import { Box, Container, Grid, Typography, Paper } from "@mui/material";
import CustomizedAccordions from './Accordion';

function FAQs() {
  const faqs = [
    {
      question: "Why choose MediCare for your family's healthcare?",
      answer: "MediCare connects you with verified, government-approved hospitals and specialist doctors across India. Our platform provides AI-powered diagnosis, 24/7 telemedicine consultations, real-time bed availability tracking, and seamless appointment booking — all in one place. We prioritize your privacy and ensure all medical data is securely encrypted."
    },
    {
      question: "How do I book an appointment with a doctor?",
      answer: "Simply navigate to 'Appointment Booking' from the Quick Links menu. Search for hospitals in your city, select an available doctor, choose your preferred date and time slot, and confirm your booking. You'll receive a confirmation and can track your appointment status from your dashboard."
    },
    {
      question: "How does the AI Diagnosis feature work?",
      answer: "Our AI Diagnosis tool uses advanced machine learning models trained on medical data to analyze your symptoms and provide preliminary insights. You describe your symptoms, and the AI suggests possible conditions and whether you should seek immediate or scheduled medical attention. Note: This is for informational purposes only and does not replace professional medical advice."
    },
    {
      question: "Is my medical and personal data safe on MediCare?",
      answer: "Absolutely. We use industry-standard TLS/SSL encryption for all data in transit, bcrypt hashing for passwords, and JWT-based authentication. We never sell or share your personal data with third parties for marketing. You can read our full Privacy Policy for complete details on how we protect your information."
    },
    {
      question: "How do I get an appointment for emergency cases?",
      answer: "For emergencies, use our 'Appointment Booking' feature and select 'Emergency' as the appointment type. You can also check real-time bed availability for hospitals in your area. For life-threatening emergencies, please call 112 (India's national emergency number) or go directly to the nearest hospital's emergency department."
    },
    {
      question: "What is telemedicine and how do I use it?",
      answer: "Telemedicine allows you to consult with doctors remotely via video or chat, without visiting a hospital. Go to Services → Telemedicine, log in to your account, and book an online consultation. It's ideal for follow-up appointments, minor illnesses, prescription renewals, and getting expert second opinions from the comfort of your home."
    },
    {
      question: "How can hospitals register on MediCare?",
      answer: "Hospitals can register by clicking 'Login' → 'Hospital Signup'. Fill in your hospital details, credentials, and submit the registration. Our admin team will review your application within 2-3 business days. Once approved, you'll gain access to the full Hospital Dashboard to manage doctors, appointments, queues, and bed availability."
    },
    {
      question: "What is the blood and organ donation portal?",
      answer: "MediCare's donation portal makes it easy to register as a blood or organ donor and request blood in emergencies. Go to Quick Links → Donations to access the Blood Donation Portal (register, request blood by type), Organ Donation (register to donate organs), and Financial Aid (assistance for medical expenses). All donation requests are handled through verified hospital channels."
    },
    {
      question: "How does the patient queue management work?",
      answer: "When you book an appointment at a hospital using MediCare, the hospital can issue you a token number in the queue. You can see your token status (Waiting, In Progress, Done) in real-time from your dashboard. This eliminates the need to wait in long physical lines and lets you arrive closer to your actual consultation time."
    },
    {
      question: "What are MediCare Premium Services?",
      answer: "MediCare Premium provides enhanced healthcare services including personalized health and diet plans created by certified nutritionists and doctors, detailed diagnostic reports with AI insights, priority appointment booking with top specialists, and direct chat with licensed doctors. Visit Services → Premium Services to learn more and subscribe."
    },
  ];

  return (
    <Box py={4}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
          <Typography color="primary.main" fontWeight={600} textAlign="center">
            Get Your Answer
          </Typography>
          <Typography textAlign="center" variant="h4" fontWeight={700} mb={1}>
            Frequently Asked Questions
          </Typography>
          <Typography textAlign="center" color="text.secondary" mb={4}>
            Everything you need to know about MediCare
          </Typography>
          <Grid container alignItems="flex-start" spacing={5}>
            <Grid item xs={12} md={5}>
              <Box
                component="img"
                src="/faqs-banner.jpg"
                alt="FAQ"
                sx={{ width: "100%", borderRadius: 3, boxShadow: 3 }}
              />
              <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f4fd', borderRadius: 2 }}>
                <Typography fontWeight={600} color="primary.main" mb={1}>Still have questions?</Typography>
                <Typography fontSize="0.9rem" color="text.secondary">
                  Can't find the answer you're looking for? Use our Feedback form and our support team will get back to you within 24 hours.
                </Typography>
                <Box mt={2}>
                  <a href="/feedback" style={{ color: '#4a90e2', fontWeight: 600, textDecoration: 'none' }}>
                    📨 Submit a Question →
                  </a>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={7}>
              <Box sx={{ width: "100%" }}>
                <CustomizedAccordions data={faqs} />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}

export default FAQs;