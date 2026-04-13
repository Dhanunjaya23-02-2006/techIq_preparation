import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { 
  HiArrowRight, HiChartBar, HiClock, 
  HiUsers, HiBookOpen, HiLightningBolt 
} from 'react-icons/hi';
import useAuthStore from '../../store/authStore';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 80 } }
};

const SpeedEffect = React.memo(() => (
  <>
    {/* BACKGROUND SPEED STREAKS (Right-to-Left) */}
    {[...Array(25)].map((_, i) => (
      <motion.div 
        key={i}
        animate={{ x: [1500, -1500] }}
        transition={{ 
          duration: 1.2 + Math.random() * 0.8, 
          repeat: Infinity, 
          delay: i * 0.12, 
          ease: 'linear' 
        }}
        style={{ 
          position: 'absolute', top: `${10 + i * 4}%`, left: '100%',
          width: `${100 + Math.random() * 500}px`, height: '1px', 
          background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.3), transparent)',
          zIndex: 1, filter: 'blur(1px)'
        }}
      />
    ))}

    {/* Exhaust/Vapor Trails (Side Perspective) */}
    {[...Array(10)].map((_, i) => (
      <motion.div
        key={`vapor-${i}`}
        animate={{ 
          opacity: [0, 0.25, 0],
          x: [-100, -600],
          y: [0, -40 - Math.random() * 30],
          scale: [1, 4]
        }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
        style={{
          position: 'absolute', top: '160px', left: '70%',
          width: '15px', height: '15px', background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%', filter: 'blur(15px)', zIndex: 1
        }}
      />
    ))}
  </>
));

const Train3D = React.memo(() => (
  <div style={{ position: 'relative', width: '100%', height: '500px', perspective: '1500px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
    {/* HORIZONTAL RAILWAY TRACKS (Side Motion) */}
    <div style={{ 
      position: 'absolute', bottom: '120px', width: '200%', height: '100px', 
      transform: 'rotateX(75deg) rotateZ(0deg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 0, pointerEvents: 'none'
    }}>
      {/* Rear Rail */}
      <div style={{ position: 'absolute', top: '15px', width: '100%', height: '4px', background: 'linear-gradient(to right, #475569, #94a3b8, #475569)', boxShadow: '0 0 10px rgba(255,255,255,0.1)' }} />
      {/* Front Rail */}
      <div style={{ position: 'absolute', bottom: '15px', width: '100%', height: '6px', background: 'linear-gradient(to right, #475569, #e2e8f0, #475569)', boxShadow: '0 0 15px rgba(255,255,255,0.2)' }} />
      
      {/* Moving Sleepers - Right-to-Left for Rightward Travel (Medium Speed) */}
      <div style={{ position: 'absolute', width: '100%', height: '100%', display: 'flex', gap: '60px' }}>
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ x: [100, -2000] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "linear", delay: i * 0.08 }}
            style={{ width: '15px', height: '100%', background: 'linear-gradient(to right, #1e293b, #334155, #1e293b)', borderRadius: '2px', borderRight: '2px solid #000' }}
          />
        ))}
      </div>
    </div>

    {/* 3D SIDE-VIEW TRAIN (WAG-7 + LHB) */}
    <motion.div 
        initial={{ x: '-100vw' }} // Drive in from far left
        animate={{ 
          x: 40, // Target position
          y: [0, -2, 0], // Vibration
          rotateZ: [-0.2, 0.2, -0.2] // Sway
        }}
        transition={{ 
          x: { type: 'spring', damping: 20, stiffness: 50, duration: 2.5 }, // Smooth arrival
          y: { duration: 0.25, repeat: Infinity, ease: "linear" },
          rotateZ: { duration: 0.25, repeat: Infinity, ease: "linear" }
        }}
        style={{ 
          display: 'flex', gap: '6px', position: 'relative', 
          transformStyle: 'preserve-3d', 
          transform: 'rotateY(-25deg) rotateX(5deg)', // Side 3/4 perspective
          zIndex: 2,
          alignItems: 'flex-end'
        }}
    >
      {/* LHB COACH 2 (Side Profile) */}
      <div style={{ width: '220px', height: '85px', background: 'linear-gradient(to bottom, #991b1b, #bf1e2e, #991b1b)', borderRadius: '4px', position: 'relative', transformStyle: 'preserve-3d', boxShadow: '0 40px 60px rgba(0,0,0,0.6)' }}>
        {/* Roof Side Reveal */}
        <div style={{ position: 'absolute', top: '-10px', left: '0', right: '0', height: '20px', background: 'linear-gradient(to bottom, #94a3b8, #cbd5e1)', borderRadius: '15px 15px 0 0', transform: 'translateZ(-10px) rotateX(-20deg)', transformOrigin: 'bottom' }} />
        {/* Windows Side */}
        <div style={{ display: 'flex', gap: '15px', padding: '25px 15px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ width: '22px', height: '16px', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '2px', border: '1px solid rgba(255,255,255,0.05)' }} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '15px', left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.1)' }} />
        {/* Wheels Sitting on Rails - Refined Medium Speed */}
        <div style={{ position: 'absolute', bottom: '-18px', left: '30px', display: 'flex', gap: '8px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111', border: '5px solid #333', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }} />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111', border: '5px solid #333' }} />
        </div>
        <div style={{ position: 'absolute', bottom: '-18px', right: '30px', display: 'flex', gap: '8px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111', border: '5px solid #333' }} />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111', border: '5px solid #333' }} />
        </div>
      </div>

      {/* LHB COACH 1 (Side Profile) */}
      <div style={{ width: '220px', height: '85px', background: 'linear-gradient(to bottom, #991b1b, #bf1e2e, #991b1b)', borderRadius: '4px', position: 'relative', transformStyle: 'preserve-3d', boxShadow: '0 45px 70px rgba(0,0,0,0.7)' }}>
        <div style={{ position: 'absolute', top: '-10px', left: '0', right: '0', height: '20px', background: 'linear-gradient(to bottom, #94a3b8, #cbd5e1)', borderRadius: '15px 15px 0 0', transform: 'translateZ(-10px) rotateX(-20deg)', transformOrigin: 'bottom' }} />
        <div style={{ display: 'flex', gap: '15px', padding: '25px 15px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ width: '22px', height: '16px', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '2px' }} />
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: '15px', left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', bottom: '-18px', left: '30px', display: 'flex', gap: '8px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111', border: '5px solid #333' }} />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111', border: '5px solid #333' }} />
        </div>
        <div style={{ position: 'absolute', bottom: '-18px', right: '30px', display: 'flex', gap: '8px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111', border: '5px solid #333' }} />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#111', border: '5px solid #333' }} />
        </div>
      </div>

      {/* WAG-7 ENGINE (Side + Corner Front Reveal) */}
      <div style={{ 
        width: '240px', height: '105px', 
        background: 'linear-gradient(135deg, #1d4ed8, #1e40af)', 
        borderRadius: '4px 8px 8px 4px',
        position: 'relative', 
        transformStyle: 'preserve-3d',
        boxShadow: '0 50px 80px rgba(0,0,0,0.8)'
      }}>
          {/* SIDE PROFILE DETAILS */}
          <div style={{ position: 'absolute', bottom: '32px', left: 0, right: 0, height: '28px', background: 'linear-gradient(to bottom, #d97706, #f59e0b, #d97706)', borderY: '2px solid rgba(0,0,0,0.3)' }} />
          <div style={{ position: 'absolute', top: '15px', left: '20px', display: 'flex', gap: '6px' }}>
            {[...Array(8)].map((_, i) => <div key={i} style={{ width: '3px', height: '35px', background: 'rgba(0,0,0,0.4)', borderRadius: '1px' }} />)}
          </div>

          {/* FRONT CAB REVEAL (3D Effect) */}
          <div style={{
            position: 'absolute', right: '-15px', top: '0', width: '40px', height: '100%',
            background: '#1d4ed8', borderLeft: '2px solid rgba(0,0,0,0.2)',
            transform: 'rotateY(60deg)', transformOrigin: 'left',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            {/* Front Windows */}
            <div style={{ width: '25px', height: '30px', background: '#0f172a', marginTop: '10px', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.1)' }} />
            {/* Headlights on Front Face */}
            <div style={{ marginTop: 'auto', marginBottom: '25px', display: 'flex', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 15px white' }} />
              <div style={{ width: '6px', height: '6px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 15px white' }} />
            </div>
          </div>

          {/* WAG-7 TOP LIGHT (Projects towards right) */}
          <div style={{ position: 'absolute', right: '10px', top: '10px', width: '15px', height: '15px', background: '#fff', borderRadius: '50%', zIndex: 10, boxShadow: '0 0 80px 30px rgba(255,255,255,0.4), 0 0 150px 60px rgba(59,130,246,0.2)' }} />

          {/* Wheels Sitting on Rails - Refined Medium Speed & Size */}
          <div style={{ position: 'absolute', bottom: '-20px', left: '35px', display: 'flex', gap: '15px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#000', border: '7px solid #222' }} />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#000', border: '7px solid #222' }} />
          </div>
          <div style={{ position: 'absolute', bottom: '-20px', right: '45px', display: 'flex', gap: '15px' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#000', border: '7px solid #222' }} />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.45, repeat: Infinity, ease: "linear" }} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#000', border: '7px solid #222' }} />
          </div>
      </div>
    </motion.div>
    <SpeedEffect />
  </div>
));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505', color: 'white', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Background Orbs */}
      <div style={{ position: 'absolute', top: -100, left: -100, width: '400px', height: '400px', background: 'rgba(255, 153, 51, 0.05)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: '50%', right: -100, width: '500px', height: '500px', background: 'rgba(19, 136, 8, 0.03)', filter: 'blur(120px)', borderRadius: '50%', zIndex: 0 }} />

      {/* Navigation */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.8rem' }}>🚂</span>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>TrackIQ</h1>
        </div>
        
        <div className="landing-nav-links">
          <div className="landing-nav-menu">
            {['Home', 'Tests', 'Leaderboard', 'Dashboard'].map(link => (
              <Link 
                key={link} 
                to={link === 'Home' ? '/' : `/${link.toLowerCase()}`} 
                style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'white'}
                onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
              >
                {link}
              </Link>
            ))}
          </div>
          <button 
            onClick={handleStart}
            className="btn-primary"
            style={{ 
              padding: '10px 24px', borderRadius: '100px', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '8px' 
            }}
          >
            Get Started <HiArrowRight />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <motion.div initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div variants={itemVariants} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 16px', borderRadius: '100px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: '24px' }}>
            <span style={{ fontSize: '1.2rem' }}>🚂</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--saffron)' }}>India's Railway Exam Platform</span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="landing-hero-title">
            Your Railway Exam <br />
            <span className="gradient-text">Preparation Partner</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="landing-hero-subtitle" style={{ color: 'var(--text-secondary)' }}>
            Practice with AI-powered mock tests, track your performance with real-time analytics, and compete on leaderboards — all designed for RRB NTPC, Group D, JE & ALP exams.
          </motion.p>

          <motion.div variants={itemVariants} className="landing-hero-buttons">
            <button 
              onClick={handleStart}
              className="btn-primary"
              style={{ padding: '16px 36px', borderRadius: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              Start Preparing Free <HiArrowRight />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="btn-secondary"
              style={{ padding: '16px 36px', borderRadius: '12px', fontSize: '1rem' }}
            >
              Sign In
            </button>
          </motion.div>

          <motion.div variants={itemVariants} className="landing-hero-stats">
            {[
              { val: '10K+', label: 'Questions' },
              { val: '5K+', label: 'Students' },
              { val: '4', label: 'Exams Covered' },
            ].map((stat, i) => (
              <div key={i}>
                <h3 style={{ fontSize: '2rem', fontWeight: 800 }}>{stat.val}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* 3D Train Section - Side Perspective */}
        <Train3D />


      </section>

      {/* Features Section */}
      <section style={{ padding: '100px 6%', textAlign: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="landing-section-title">What TrackIQ Offers</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '60px' }}>
            Everything you need to crack your railway exam — from smart practice to deep analytics.
          </p>
        </motion.div>

        <div className="landing-features-grid">
          {[
            { icon: <HiLightningBolt />, title: 'Smart Mock Tests', desc: 'AI-curated exam papers matching RRB standards' },
            { icon: <HiChartBar />, title: 'Instant Analytics', desc: 'Track accuracy, weak topics & improvement trends' },
            { icon: <HiClock />, title: 'Timed Practice', desc: 'Real exam-like timed sessions with auto-submit' },
            { icon: <HiUsers />, title: 'Leaderboard', desc: 'Compete with thousands of aspirants nationwide' },
            { icon: <HiBookOpen />, title: 'Previous Year Q', desc: 'Practice with actual past exam question papers' },
            { icon: <HiLightningBolt />, title: 'AI Question Gen', desc: 'Fresh questions generated from PDFs using AI' },
          ].map((feature, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="glass-card"
              style={{ padding: '40px', textAlign: 'left', borderTop: i % 2 === 0 ? '2px solid var(--saffron)' : '2px solid var(--green)' }}
            >
              <div style={{ 
                width: '50px', height: '50px', borderRadius: '12px', 
                background: 'rgba(255,255,255,0.05)', display: 'flex', 
                alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                marginBottom: '24px', color: i % 2 === 0 ? 'var(--saffron)' : 'var(--green)'
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Exam Coverage Section */}
      <section style={{ padding: '100px 6%', background: 'rgba(255,255,255,0.02)', borderY: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800 }}>Prepare for All RRB Exams</h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            { name: 'RRB NTPC', status: 'Most Popular', color: 'var(--saffron)' },
            { name: 'RRB Group D', status: 'High Demand', color: 'var(--green)' },
            { name: 'RRB JE', status: 'Technical', color: '#3b82f6' },
            { name: 'RRB ALP', status: 'Specialized', color: '#8b5cf6' },
          ].map((exam, i) => (
            <div key={i} className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>{exam.name}</h3>
              <span style={{ 
                fontSize: '0.75rem', fontWeight: 600, color: exam.color, 
                padding: '4px 12px', borderRadius: '100px', background: 'rgba(255,255,255,0.05)'
              }}>
                {exam.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '140px 6%', textAlign: 'center', position: 'relative' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{ maxWidth: '900px', margin: '0 auto' }}
        >
          <h2 className="landing-cta-title">
            Ready to Crack Your Railway Exam?
          </h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px' }}>
            Join thousands of aspirants already preparing with TrackIQ's AI-powered platform.
          </p>
          <button 
            onClick={handleStart}
            className="btn-primary"
            style={{ padding: '18px 48px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700 }}
          >
            Get Started — It's Free →
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 6%', borderTop: '1px solid var(--border)', background: '#080808' }}>
        <div className="landing-footer-content">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.5rem' }}>🚂</span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>TrackIQ</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px' }}>
              © 2025 TrackIQ. Made with 🇮🇳 for India's railway aspirants.
            </p>
          </div>

          <div className="landing-footer-links">
             <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Product</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <li>Tests</li>
                  <li>Leaderboard</li>
                  <li>Dashboard</li>
                </ul>
             </div>
             <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>Legal</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <li>Privacy</li>
                  <li>Terms</li>
                  <li>Contact</li>
                </ul>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
