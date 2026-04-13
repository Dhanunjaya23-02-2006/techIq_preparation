import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiArrowLeft, HiCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      toast.success(res.data.message || 'Verification code sent!');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authService.resetPassword({ email, otp, password });
      toast.success(res.data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#050505',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px'
    }}>
      <Link to="/login" style={{
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
      }}>
        <HiArrowLeft size={18} />
        Back to Login
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
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
            {step === 1 ? '🔑' : '🛡️'}
          </motion.div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
            {step === 1 ? 'Forgot Password?' : 'Secure Reset'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {step === 1 
              ? 'Enter your email to receive a verification code' 
              : 'Enter the code sent to your email and choose a new password'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleRequestOTP}
            >
              <div style={{ marginBottom: '24px' }}>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
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
                {isLoading ? 'Sending code...' : 'Send Verification Code'}
              </motion.button>
            </motion.form>
          ) : (
            <motion.form
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleResetPassword}
            >
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', display: 'block', color: 'var(--text-secondary)' }}>
                  Verification Code
                </label>
                <div style={{ position: 'relative' }}>
                  <HiCheckCircle size={18} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)'
                  }} />
                  <input
                    className="input-field"
                    style={{ paddingLeft: '42px' }}
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', display: 'block', color: 'var(--text-secondary)' }}>
                  New Password
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
                    style={{ paddingLeft: '42px', paddingRight: '42px' }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {showPass ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px', display: 'block', color: 'var(--text-secondary)' }}>
                  Confirm New Password
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
                    style={{ paddingLeft: '42px' }}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
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
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </motion.button>
              
              <p 
                onClick={() => setStep(1)}
                style={{ 
                  textAlign: 'center', 
                  marginTop: '16px', 
                  color: 'var(--text-secondary)', 
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Didn't get the code? <span style={{ color: 'var(--saffron)' }}>Resend</span>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
