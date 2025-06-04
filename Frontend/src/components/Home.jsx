// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // For animations
// Removed unused icons FaUsers and FaEnvelope
import { FaBrain, FaSearchDollar, FaComments, FaLightbulb, FaChartLine, FaLaptopCode, FaRocket } from 'react-icons/fa'; // Example icons

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.15 } },
};

const fadeInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const fadeInRight = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.7, ease: "easeOut" } },
};


// --- IMAGE PLACEHOLDERS (REPLACE THESE!) ---
// Find relevant, high-quality images from Unsplash, Pexels, or your own assets.
const heroBackgroundImage = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"; // e.g., abstract tech, modern workspace
const aboutUsImage = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1742&q=80"; // e.g., diverse team, collaboration
// For features, you might use abstract graphics or icons if not dedicated images per feature.

function Home({ token }) {
  const websiteName = "AI Resume Insight";

  // --- STYLES (Highly recommend moving to CSS Modules or Styled Components for a real app) ---
  const styles = {
    pageContainer: {
      fontFamily: "'Roboto', 'Helvetica Neue', Arial, sans-serif", // Modern font
      color: '#333', // Dark grey for text
      lineHeight: 1.7,
      overflowX: 'hidden', // Prevent horizontal scroll from animations
    },

    // --- HERO SECTION ---
    hero: {
      minHeight: '95vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 20px',
      textAlign: 'center',
      color: '#fff',
      backgroundImage: `linear-gradient(to bottom, rgba(26, 32, 44, 0.85), rgba(26, 32, 44, 0.95)), url(${heroBackgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundAttachment: 'fixed', // Parallax-like effect
    },
    heroContent: {
      maxWidth: '850px',
    },
    heroTitle: {
      fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', // Responsive font size
      fontWeight: 700,
      marginBottom: '25px',
      lineHeight: 1.2,
      textShadow: '0 2px 8px rgba(0,0,0,0.6)',
      letterSpacing: '-1px',
    },
    heroSubtitle: {
      fontSize: 'clamp(1rem, 2.5vw, 1.3rem)',
      marginBottom: '40px',
      maxWidth: '700px',
      margin: '0 auto 45px auto',
      opacity: 0.9,
      fontWeight: 300,
    },
    ctaButton: {
      background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)', // Vibrant gradient
      color: 'white',
      padding: '18px 40px',
      textDecoration: 'none',
      borderRadius: '50px', // Pill shape
      fontSize: '1.15em',
      fontWeight: '600',
      boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)',
      transition: 'all 0.3s ease',
      display: 'inline-block',
      border: 'none',
      cursor: 'pointer',
    },
    ctaButtonHover: { // We'll apply this with framer-motion's whileHover
      transform: 'translateY(-3px) scale(1.05)',
      boxShadow: '0 12px 25px rgba(79, 70, 229, 0.5)',
    },

    // --- GENERAL SECTION STYLING ---
    section: {
      padding: '80px 20px 100px 20px', // Increased bottom padding
    },
    sectionTitle: {
      fontSize: 'clamp(2rem, 5vw, 3.2rem)',
      color: '#1A202C', // Very dark blue/charcoal
      marginBottom: '20px',
      fontWeight: 700,
      textAlign: 'center',
      letterSpacing: '-0.5px',
    },
    sectionSubtitle: {
        fontSize: 'clamp(1rem, 2vw, 1.2rem)',
        color: '#4A5568', // Medium grey
        textAlign: 'center',
        maxWidth: '700px',
        margin: '0 auto 60px auto',
        fontWeight: 300,
    },

    // --- FEATURES SECTION ---
    featuresSection: {
      backgroundColor: '#F7FAFC', // Off-white
    },
    featureGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '40px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    featureItem: {
      backgroundColor: '#fff',
      padding: '35px 30px',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.07)',
      textAlign: 'center', // Center icon and title
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    },
    featureItemHover: {
        transform: 'translateY(-8px)',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.12)',
    },
    featureIconContainer: {
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #4F46E5 0%, #A78BFA 100%)', // Icon background gradient
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 25px auto',
        color: 'white',
        fontSize: '28px', // Icon size
        boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
    },
    featureItemTitle: {
      fontSize: '1.4em',
      color: '#1A202C',
      marginBottom: '12px',
      fontWeight: 600,
    },
    featureItemText: {
        color: '#4A5568',
        fontSize: '0.95rem',
    },

    // --- HOW IT WORKS (Simple Steps) ---
    howItWorksSection: {
        backgroundColor: '#fff', // White background
    },
    stepsGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        maxWidth: '1000px',
        margin: '0 auto',
        gap: '30px',
    },
    stepItem: {
        flex: '1 1 280px', // Responsive flex items
        textAlign: 'center',
        padding: '20px',
    },
    stepNumber: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        border: '3px solid #6366F1', // Primary accent
        color: '#6366F1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px auto',
        fontSize: '1.8em',
        fontWeight: 'bold',
    },
    stepTitle: {
        fontSize: '1.3em',
        color: '#1A202C',
        marginBottom: '10px',
        fontWeight: 600,
    },
    stepText: {
        color: '#4A5568',
        fontSize: '0.9rem',
    },

    // --- TESTIMONIALS SECTION ---
    testimonialsSection: {
      backgroundColor: '#1A202C', // Dark background for contrast
      color: '#E2E8F0', // Light text
      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%232D3748\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', // Subtle pattern
    },
    testimonialCard: {
      backgroundColor: 'rgba(45, 55, 72, 0.7)', // Semi-transparent dark card
      backdropFilter: 'blur(5px)', // Frosted glass effect
      padding: '35px',
      margin: '20px auto',
      borderRadius: '12px',
      maxWidth: '650px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    testimonialQuote: {
        fontSize: '1.15em',
        fontStyle: 'italic',
        marginBottom: '20px',
        lineHeight: 1.6,
        color: '#CBD5E0', // Lighter text for quote
    },
    testimonialAuthor: {
        color: '#A0AEC0', // Slightly muted author color
        fontWeight: '600',
        textAlign: 'right',
    },
    testimonialAuthorHighlight: { // For the name itself
        color: '#818CF8', // Accent
        display: 'block',
        marginTop: '5px',
    },

    // --- ABOUT US SECTION ---
    aboutSection: {
      backgroundColor: '#F7FAFC',
    },
    aboutContent: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '50px',
      maxWidth: '1100px',
      margin: '0 auto',
      textAlign: 'left',
    },
    aboutText: {
      flex: 1.2, // Give text slightly more space
      minWidth: '300px',
    },
    aboutImageContainer: {
      flex: 1,
      minWidth: '300px',
      maxWidth: '450px',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 15px 40px rgba(0,0,0,0.1)',
    },
    aboutImageHover: {
        transform: 'scale(1.05)',
    },

    // --- CALL TO ACTION (Bottom) ---
    bottomCtaSection: {
        backgroundColor: '#4F46E5', // Primary accent
        color: 'white',
        padding: '70px 20px',
    },
    bottomCtaTitle: {
        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
        fontWeight: 700,
        marginBottom: '30px',
        textAlign: 'center',
    },
    bottomCtaButton: { // Use a different style, e.g., outlined or white
        backgroundColor: 'white',
        color: '#4F46E5',
        padding: '16px 35px',
        textDecoration: 'none',
        borderRadius: '50px',
        fontSize: '1.1em',
        fontWeight: '600',
        boxShadow: '0 6px 15px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        display: 'inline-block',
        border: 'none',
        cursor: 'pointer',
    },
    bottomCtaButtonHover: {
        transform: 'translateY(-3px) scale(1.03)',
        boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
    },

    // --- FOOTER ---
    footer: {
      backgroundColor: '#1A202C',
      color: '#A0AEC0', // Lighter grey for footer text
      padding: '50px 20px 30px 20px',
      textAlign: 'center',
      fontSize: '0.9rem',
    },
    footerLinks: {
        marginBottom: '15px',
    },
    footerLink: {
      color: '#718096', // Muted link color
      textDecoration: 'none',
      margin: '0 12px',
      transition: 'color 0.3s ease',
    },
    footerLinkHover: {
        color: '#A78BFA', // Accent color on hover
    }
  };

  const featuresData = [
    { icon: FaBrain, title: "Deep AI Analysis", text: "Our AI goes beyond keywords, understanding context and impact to score your resume effectively." },
    { icon: FaSearchDollar, title: "ATS Optimization", text: "Craft a resume that sails through Applicant Tracking Systems and grabs recruiter attention." },
    { icon: FaComments, title: "Actionable Feedback", text: "Receive clear, concise, and personalized suggestions for every section of your resume." },
    { icon: FaLightbulb, title: "Skill Gap Insights", text: "Discover crucial skills you might be missing for your dream roles and how to acquire them." },
    { icon: FaChartLine, title: "Career Pathing", text: "Explore tailored career progression suggestions based on your unique profile and market trends." },
    { icon: FaLaptopCode, title: "Industry Tailoring", text: "Get insights specific to your industry, ensuring your resume speaks the right language." },
  ];

  const howItWorksSteps = [
    { number: 1, title: "Upload Your Resume", text: "Simply upload your current resume in PDF or DOCX format. It's quick and secure." },
    { number: 2, title: "AI Analysis", text: "Our intelligent engine meticulously analyzes your resume content, structure, and impact." },
    { number: 3, title: "Get Insights & Improve", text: "Receive a comprehensive report with scores, feedback, and actionable tips to enhance your resume." },
  ];

  const testimonialsData = [
    { quote: "AI Resume Insight completely transformed my job search. The feedback was spot-on, and I landed my dream job in weeks!", author: "Sarah K., Marketing Director" },
    { quote: "I was struggling to get interviews. This tool helped me identify the weaknesses in my resume, and the difference was night and day.", author: "John B., Software Engineer" },
    { quote: "The best resume tool I've used! It's like having a personal career coach, but available 24/7.", author: "Emily W., Project Manager" },
  ];


  return (
    <motion.div style={styles.pageContainer} initial="initial" animate="animate">
      {/* Hero Section */}
      <motion.header style={styles.hero} variants={fadeInUp}>
        <div style={styles.heroContent}>
          <motion.h1 style={styles.heroTitle} variants={fadeInUp}>
            Unlock Your Career Potential with {websiteName}
          </motion.h1>
          <motion.p style={styles.heroSubtitle} variants={fadeInUp} custom={0.2} /* custom prop for staggered delay */>
            Get instant, AI-powered feedback on your resume. Identify strengths, weaknesses, and opportunities to land your dream job faster.
          </motion.p>
          <motion.div variants={fadeInUp} custom={0.4}>
            <Link to={token ? "/upload" : "/register"}>
              <motion.button
                style={styles.ctaButton}
                whileHover={styles.ctaButtonHover}
                whileTap={{ scale: 0.95 }}
              >
                {token ? "Analyze My Resume Now" : "Get Started Free"}
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {/* Features Section */}
      <motion.section
        style={{...styles.section, ...styles.featuresSection}}
        id="features"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2 style={styles.sectionTitle} variants={fadeInUp}>Why Choose {websiteName}?</motion.h2>
        <motion.p style={styles.sectionSubtitle} variants={fadeInUp}>
            Our cutting-edge AI provides unparalleled insights to perfect your resume and accelerate your career.
        </motion.p>
        <div style={styles.featureGrid}>
          {featuresData.map((feature, index) => (
            <motion.div
              key={index}
              style={styles.featureItem}
              variants={fadeInUp}
              whileHover={styles.featureItemHover}
            >
              <div style={styles.featureIconContainer}><feature.icon /></div>
              <h3 style={styles.featureItemTitle}>{feature.title}</h3>
              <p style={styles.featureItemText}>{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section
        style={{...styles.section, ...styles.howItWorksSection}}
        id="how-it-works"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2 style={styles.sectionTitle} variants={fadeInUp}>Simple Steps to Success</motion.h2>
        <motion.p style={styles.sectionSubtitle} variants={fadeInUp}>
            Getting started with {websiteName} is easy. Follow these simple steps to a better resume.
        </motion.p>
        <div style={styles.stepsGrid}>
            {howItWorksSteps.map((step, index) => (
                <motion.div key={index} style={styles.stepItem} variants={fadeInUp}>
                    <div style={styles.stepNumber}>{step.number}</div>
                    <h3 style={styles.stepTitle}>{step.title}</h3>
                    <p style={styles.stepText}>{step.text}</p>
                </motion.div>
            ))}
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section
        style={{...styles.section, ...styles.testimonialsSection}}
        id="testimonials"
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2 style={{...styles.sectionTitle, color: 'white'}} variants={fadeInUp}>Loved by Professionals Like You</motion.h2>
         <motion.p style={{...styles.sectionSubtitle, color: '#A0AEC0'}} variants={fadeInUp}>
            Don't just take our word for it. See what our users are saying.
        </motion.p>
        {/* For a real carousel, use react-slick or a custom Framer Motion carousel */}
        {testimonialsData.map((testimonial, index) => (
          <motion.div key={index} style={styles.testimonialCard} variants={fadeInUp}>
            <p style={styles.testimonialQuote}>"{testimonial.quote}"</p>
            <p style={styles.testimonialAuthor}>
                {testimonial.author.split(',')[0]},
                <span style={styles.testimonialAuthorHighlight}>{testimonial.author.split(',')[1]}</span>
            </p>
          </motion.div>
        ))}
      </motion.section>

      {/* About Us Section */}
      <motion.section
        style={{...styles.section, ...styles.aboutSection}}
        id="about"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.2 }}
      >
         <motion.h2 style={styles.sectionTitle} variants={fadeInUp}>About {websiteName}</motion.h2>
         <motion.p style={styles.sectionSubtitle} variants={fadeInUp}>
            We are passionate about empowering job seekers with the tools they need to succeed.
        </motion.p>
        <div style={styles.aboutContent}>
          <motion.div style={styles.aboutText} variants={fadeInLeft}>
            <h3 style={{fontSize: '1.7em', color: '#2D3748', marginBottom: '15px', fontWeight: 600}}>Our Mission</h3>
            <p style={{marginBottom: '15px', color: '#4A5568'}}>
              At {websiteName}, we're committed to leveling the playing field in the job market. We believe that everyone, regardless of their background,
              deserves access to expert resume advice and cutting-edge career tools. Our AI-driven platform is designed to provide actionable insights
              that translate into real-world results.
            </p>
            <p style={{color: '#4A5568'}}>
              We blend advanced artificial intelligence with deep recruitment expertise to help you craft compelling narratives,
              highlight your unique value, and navigate your career path with confidence and clarity.
            </p>
             <Link to="/contact" style={{marginTop: '25px', display: 'inline-block'}}>
                <motion.button
                    style={{...styles.ctaButton, padding: '14px 30px', fontSize: '1em', background: 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)'}} // A slightly different CTA color
                    whileHover={{transform: 'translateY(-2px)', boxShadow: '0 8px 15px rgba(59, 130, 246, 0.3)'}}
                    whileTap={{ scale: 0.97 }}
                >
                    Learn More About Us
                </motion.button>
            </Link>
          </motion.div>
          <motion.div
            style={styles.aboutImageContainer}
            variants={fadeInRight}
            whileHover={styles.aboutImageHover}
            >
            <img src={aboutUsImage} alt="Our team collaborating on AI solutions" style={styles.aboutImage} />
          </motion.div>
        </div>
      </motion.section>

      {/* Bottom Call to Action Section */}
      <motion.section
        style={{...styles.section, ...styles.bottomCtaSection}}
        id="get-started"
        variants={fadeInUp}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
      >
        <h2 style={styles.bottomCtaTitle}>Ready to Supercharge Your Resume?</h2>
        <Link to={token ? "/upload" : "/register"}>
            <motion.button
            style={styles.bottomCtaButton}
            whileHover={styles.bottomCtaButtonHover}
            whileTap={{ scale: 0.95 }}
            >
            {token ? "Go to Dashboard" : "Create Your Free Account"}
            </motion.button>
        </Link>
      </motion.section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLinks}>
          <Link to="/privacy-policy" style={styles.footerLink} onMouseEnter={e => e.target.style.color=styles.footerLinkHover.color} onMouseLeave={e => e.target.style.color=styles.footerLink.color}>Privacy Policy</Link>
          <Link to="/terms-of-service" style={styles.footerLink} onMouseEnter={e => e.target.style.color=styles.footerLinkHover.color} onMouseLeave={e => e.target.style.color=styles.footerLink.color}>Terms of Service</Link>
          <Link to="/contact" style={styles.footerLink} onMouseEnter={e => e.target.style.color=styles.footerLinkHover.color} onMouseLeave={e => e.target.style.color=styles.footerLink.color}>Contact Us</Link>
        </div>
        <p>© {new Date().getFullYear()} {websiteName}. All Rights Reserved. Built with <FaRocket style={{color: '#A78BFA'}}/> & AI.</p>
      </footer>
    </motion.div>
  );
}

export default Home;