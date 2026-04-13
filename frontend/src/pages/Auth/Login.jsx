import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [mfaCode, setMfaCode] = useState('');
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // If it's an MFA step, we send the code too
    const loginData = isMfaStep ? { ...form, mfa_code: mfaCode } : form;
    
    const result = await login(loginData);
    
    if (result.success) {
      if (result.mfa_required) {
        setIsMfaStep(true);
        toast('Please enter your MFA code to continue.', { icon: '🔐' });
        return;
      }

      toast.success('Welcome back! 🚀');
      const user = useAuthStore.getState().user;
      if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="auth-container">
      {/* Back to Home Button */}
      <Link to="/" style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        zIndex: 50,
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
        fontSize: '0.9rem',
        fontWeight: 500,
        transition: 'color 0.2s'
      }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <HiArrowLeft size={18} />
        Back to Home
      </Link>

      {/* Left Pane - Immersive 3D/Graphic Side */}
      <div className="auth-left-pane">
        {/* Animated Background Elements */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'var(--saffron)',
            filter: 'blur(100px)',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'var(--green)',
            filter: 'blur(120px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          style={{ position: 'relative', zIndex: 10 }}
        >
          <h2 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px' }}>
            Elevate Your <br />
            <span className="gradient-text">Future.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '400px', lineHeight: 1.6 }}>
            Join thousands of candidates mastering their exams with our next-gen platform.
          </p>

          <div style={{ marginTop: '60px', display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
            <div>
              <p style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>150k+</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active Aspirants</p>
            </div>
            <div>
              <p style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>500+</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Mock Tests</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Pane - Login Form */}
      <div className="auth-right-pane">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-card"
          style={{
            maxWidth: '440px',
            width: '100%',
            padding: '40px',
            borderRadius: '24px'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{ fontSize: '3rem', marginBottom: '16px' }}
            >
              🚂
            </motion.div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Welcome Back</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            {!isMfaStep ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', display: 'block', color: 'var(--text-secondary)' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <HiMail size={18} style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)'
                    }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '42px' }}
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Password
                    </label>
                    <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--saffron)', textDecoration: 'none' }}>
                      Forgot?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <HiLockClosed size={18} style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)'
                    }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '42px', paddingRight: '42px' }}
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {showPass ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', display: 'block', color: 'var(--text-secondary)' }}>
                  MFA Code
                </label>
                <div style={{ position: 'relative' }}>
                  <HiLockClosed size={18} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)'
                  }} />
                  <input
                    className="input-field"
                    style={{ paddingLeft: '42px', textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsMfaStep(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--saffron)',
                    fontSize: '0.85rem',
                    marginTop: '12px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Back to login
                </button>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '12px',
                marginTop: '8px'
              }}
            >
              {isLoading ? (isMfaStep ? 'Verifying...' : 'Signing in...') : (isMfaStep ? 'Verify MFA' : 'Sign In')}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            New to TrackIQ?{' '}
            <Link to="/register" style={{ color: 'var(--saffron)', fontWeight: 700, textDecoration: 'none' }}>
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
