import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiUser, HiMail, HiLockClosed, HiPhone, HiArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import useAuthStore from '../../store/authStore';
import { formatError } from '../../utils/error';


export default function Register() {
  const [form, setForm] = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '', phone: '', role: 'student',
    otp: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [adminExists, setAdminExists] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await authService.checkAdminExists();
        const exists = res.data.exists;
        setAdminExists(exists);
        setForm(prev => ({ ...prev, role: exists ? 'student' : 'admin' }));
      } catch (err) {
        toast.error('Could not verify registration availability');
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (!form.email) {
      toast.error('Please enter your email first');
      return;
    }
    setIsSendingOtp(true);
    try {
      await authService.sendRegisterOtp(form.email);
      setOtpSent(true);
      setResendTimer(60);
      toast.success('Verification code sent to your email');
    } catch (err) {
      toast.error(formatError(err));
    } finally {

      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSendingOtp) return;
    setIsSendingOtp(true);
    try {
      await authService.sendRegisterOtp(form.email);
      setResendTimer(60);
      toast.success('New verification code sent');
    } catch (err) {
      toast.error(formatError(err));
    } finally {

      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      toast.error('Passwords do not match');
      return;
    }
    const result = await register(form);
    if (result.success) {
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } else {
      toast.error(result.message);
    }
  };

  const update = (key, val) => setForm({ ...form, [key]: val });

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
            Start Your <br />
            <span className="gradient-text">Success Story.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '400px', lineHeight: 1.6 }}>
            Create an account and access the most comprehensive Railway Exam preparation tools available.
          </p>

          <div style={{ marginTop: '60px', display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
            <div>
              <p style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>98%</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Satisfaction Rate</p>
            </div>
            <div>
              <p style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>24/7</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Support Access</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Pane - Register Form */}
      <div className="auth-right-pane auth-right-pane-wide">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-card"
          style={{
            maxWidth: '540px',
            width: '100%',
            padding: '40px',
            borderRadius: '24px',
            margin: 'auto'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <motion.div
              initial={{ rotate: 10 }}
              animate={{ rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{ fontSize: '3rem', marginBottom: '16px' }}
            >
              🚀
            </motion.div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Create Account</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Fill in your details to get started</p>
          </div>
          {adminExists === null ? (
            <div style={{ 
              marginBottom: '24px', 
              padding: '12px', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '12px',
              textAlign: 'center' 
            }}>
              <span className="skeleton" style={{ display: 'inline-block', width: '150px', height: '20px' }}></span>
            </div>
          ) : adminExists ? (
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <span style={{
                padding: '8px 20px',
                background: 'rgba(255,153,51,0.1)',
                color: 'var(--saffron)',
                borderRadius: '100px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: '1px solid rgba(255,153,51,0.2)'
              }}>
                Registration: Student Aspirant
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {['student', 'admin'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update('role', r)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: form.role === r ? 'var(--saffron)' : 'transparent',
                    color: form.role === r ? '#000' : 'var(--text-secondary)'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="register-form-grid-2" style={{ marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>First Name</label>
                <input className="input-field" placeholder="John" autoComplete="given-name" value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Last Name</label>
                <input className="input-field" placeholder="Doe" autoComplete="family-name" value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Username *</label>
              <div style={{ position: 'relative' }}>
                <HiUser size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="input-field" style={{ paddingLeft: '42px' }} placeholder="johndoe123" autoComplete="username" value={form.username} onChange={(e) => update('username', e.target.value)} required />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Email Address *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <HiMail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input className="input-field" style={{ paddingLeft: '42px' }} type="email" placeholder="john@example.com" autoComplete="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
                </div>
                {!otpSent && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    style={{
                      padding: '0 16px',
                      borderRadius: '10px',
                      background: 'var(--saffron)',
                      color: '#000',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isSendingOtp ? 'Sending...' : 'Verify'}
                  </button>
                )}
              </div>
            </div>

            {otpSent && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Verification Code *</label>
                <div style={{ position: 'relative' }}>
                  <HiLockClosed size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input className="input-field" style={{ paddingLeft: '42px' }} placeholder="Enter 6-digit code" value={form.otp} onChange={(e) => update('otp', e.target.value)} required />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--green)' }}>Code sent to {form.email}</p>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || isSendingOtp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendTimer > 0 ? 'var(--text-secondary)' : 'var(--saffron)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: resendTimer > 0 ? 'default' : 'pointer',
                      padding: 0
                    }}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Phone Number *</label>
              <div style={{ position: 'relative' }}>
                <HiPhone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="input-field" style={{ paddingLeft: '42px' }} placeholder="+91 00000 00000" autoComplete="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
              </div>
            </div>

            <div className="register-form-grid-2" style={{ marginBottom: '32px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <HiLockClosed size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input className="input-field" style={{ paddingLeft: '42px' }} type="password" placeholder="••••••••" autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', display: 'block', color: 'var(--text-secondary)' }}>Confirm *</label>
                <input className="input-field" type="password" placeholder="••••••••" autoComplete="new-password" value={form.password2} onChange={(e) => update('password2', e.target.value)} required />
              </div>
            </div>

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
                borderRadius: '12px'
              }}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--saffron)', fontWeight: 700, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
