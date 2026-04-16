import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiUser, HiPhone, HiMail, HiAcademicCap, HiTranslate, HiBadgeCheck, HiCalendar, HiLightBulb, HiX, HiCheck, HiLockClosed } from 'react-icons/hi';
import useAuthStore from '../../store/authStore';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';
import { getMediaUrl } from '../../utils/url';

const PlanDetailsModal = ({ isOpen, onClose, planData, onUpgrade }) => {
  if (!isOpen || !planData) return null;

  const { plan, end_date, status } = planData;
  const isPremium = status === 'active';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-card"
        style={{ 
          width: '100%', maxWidth: '500px', padding: '32px', position: 'relative', 
          border: '1px solid rgba(255,153,51,0.3)',
          background: 'var(--bg-dark)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <HiX size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '16px', 
            background: 'var(--saffron)', display: 'flex', alignItems: 'center', 
            justifyContent: 'center', color: 'white', margin: '0 auto 16px',
            boxShadow: '0 0 20px rgba(255,153,51,0.3)'
          }}>
            <HiBadgeCheck size={40} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>{plan?.name || 'Starter Plan'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{plan?.description}</p>
        </div>

        <div style={{ 
          background: 'rgba(255,255,255,0.03)', borderRadius: '16px', 
          padding: '20px', marginBottom: '24px', border: '1px solid var(--border)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Status</span>
            <span style={{ 
              color: isPremium ? '#10b981' : 'var(--text-tertiary)', 
              fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase' 
            }}>
              {isPremium ? 'Active' : 'Unsubscribed'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Price Paid</span>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>₹{plan?.price || 0}</span>
          </div>
          {end_date && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Valid Until</span>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                {new Date(end_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Plan Features
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(plan?.features || []).map((feature, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: '#d1d1d1' }}>
                <HiCheck size={18} color="var(--saffron)" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {!isPremium && (
          <button 
            className="btn-primary" 
            style={{ width: '100%', padding: '12px' }}
            onClick={onUpgrade}
          >
            Upgrade Plan
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default function Profile() {
  const { user } = useAuthStore();
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubData = async () => {
      try {
        const res = await paymentService.getMySubscriptions();
        setPlanData(res.data);
      } catch (err) {
        console.error('Failed to fetch subscription data', err);
      }
    };
    fetchSubData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  const profileDetails = [
    { label: 'Full Name', value: `${user?.first_name || ''} ${user?.last_name || ''}`, icon: <HiUser /> },
    { label: 'Email Address', value: user?.email, icon: <HiMail /> },
    { label: 'Phone Number', value: user?.phone || 'Not set', icon: <HiPhone /> },
    { label: 'Target Exam', value: user?.target_exam?.toUpperCase() || 'Not specified', icon: <HiAcademicCap /> },
    { label: 'Language', value: user?.preferred_language === 'en' ? 'English' : user?.preferred_language === 'hi' ? 'Hindi' : 'Telugu', icon: <HiTranslate /> },
    { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A', icon: <HiCalendar /> },
  ];

  return (
    <motion.div 
      className="animate-fadeIn"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <AnimatePresence>
        {showPlanDetails && (
          <PlanDetailsModal 
            isOpen={showPlanDetails} 
            onClose={() => setShowPlanDetails(false)} 
            planData={planData}
            onUpgrade={() => navigate('/plans')}
          />
        )}
      </AnimatePresence>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>👤 My Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>View your profile details and active subscription plan</p>
      </div>

      <div className="profile-grid">
        {/* Left Column: Avatar & Basic Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <motion.div 
            variants={itemVariants} 
            className="glass-card" 
            style={{ 
              padding: '32px 24px', 
              textAlign: 'center',
            }}
          >
            <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 20px' }}>
              <div 
                style={{ 
                  width: '100%', height: '100%', borderRadius: '50%', 
                  overflow: 'hidden', border: '4px solid var(--saffron)',
                  background: 'var(--bg-card)',
                  boxShadow: '0 0 20px rgba(255, 153, 51, 0.2)'
                }}
              >
                {user?.avatar ? (
                  <img src={getMediaUrl(user.avatar)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--saffron), #e67e22)', color: 'white', fontSize: '3rem', fontWeight: 800 }}>
                    {(user?.first_name || user?.username || '?')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{
                position: 'absolute', bottom: '5px', right: '5px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: '#10b981', border: '3px solid var(--bg-dark)'
              }} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px', color: 'white' }}>
              {user?.first_name} {user?.last_name}
            </h2>
            <p style={{ color: 'var(--saffron)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
              {user?.role}
            </p>
            
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,153,51,0.05)', border: '1px solid rgba(255,153,51,0.1)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Username</p>
              <p style={{ fontWeight: 600, color: 'white' }}>@{user?.username}</p>
            </div>
          </motion.div>

          {/* Plan Card */}
          <motion.div 
            variants={itemVariants} 
            className="glass-card" 
            style={{ 
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(255,153,51,0.1) 0%, rgba(15,15,15,0) 100%)',
              border: '1px solid rgba(255,153,51,0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--saffron)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <HiBadgeCheck size={24} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Active Plan</p>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'white' }}>{planData?.plan?.name || user?.current_plan || 'Starter Plan'}</h3>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status</span>
                <span style={{ color: planData?.status === 'active' ? '#10b981' : 'var(--text-tertiary)', fontWeight: 600 }}>
                  {planData?.status === 'active' ? 'Active' : 'Unsubscribed'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Validity</span>
                <span style={{ color: 'white' }}>
                  {planData?.end_date ? `${Math.ceil((new Date(planData.end_date) - new Date()) / (1000 * 60 * 60 * 24))} Days left` : 'Lifetime'}
                </span>
              </div>
            </div>

            <button 
              className="btn-secondary" 
              style={{ width: '100%', marginTop: '20px', padding: '10px', fontSize: '0.85rem' }}
              onClick={() => setShowPlanDetails(true)}
            >
              View Plan Details
            </button>
          </motion.div>
        </div>

        {/* Right Column: Detailed Info */}
        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px' }}>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--saffron)' }}>
              <HiLightBulb size={20} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Personal Information</h3>
          </div>

          <div className="profile-details-grid">
            {profileDetails.map((detail, idx) => (
              <div key={idx} style={{ 
                padding: '20px', 
                borderRadius: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border)',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: 'var(--saffron)' }}>
                  {detail.icon}
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {detail.label}
                  </span>
                </div>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'white', margin: 0, paddingLeft: '28px' }}>
                  {detail.value}
                </p>
              </div>
            ))}
          </div>

          {/* MFA Section */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--saffron)' }}>
                <HiLockClosed size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>Two-Factor Authentication (MFA)</h3>
            </div>

            <MFASettings />
          </div>

          <div style={{ marginTop: '40px', padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
              To update your profile information, please visit the 
              <button 
                onClick={() => navigate('/settings')}
                style={{ background: 'none', border: 'none', color: 'var(--saffron)', fontWeight: 600, cursor: 'pointer', padding: '0 5px' }}
              >
                Account Settings
              </button> 
              page.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

const MFASettings = () => {
  const { user, fetchProfile } = useAuthStore();
  const [mfaData, setMfaData] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const handleSetup = async () => {
    setLoading(true);
    try {
      const res = await useAuthStore.getState().setupMfa();
      setMfaData(res.data);
      setShowSetup(true);
    } catch (err) {
      toast.error('Failed to initiate MFA setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return toast.error('Enter 6-digit code.');
    setLoading(true);
    try {
      const res = await useAuthStore.getState().verifyMfa(code);
      if (res.success) {
        toast.success('MFA Enabled Successfully! 🔒');
        setShowSetup(false);
        fetchProfile();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable MFA? This reduces account security.')) return;
    setLoading(true);
    try {
      const res = await useAuthStore.getState().disableMfa();
      if (res.success) {
        toast.success('MFA Disabled.');
        fetchProfile();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('Failed to disable MFA.');
    } finally {
      setLoading(false);
    }
  };

  if (user?.mfa_enabled) {
    return (
      <div style={{ 
        padding: '24px', borderRadius: '16px', 
        background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '4px' }}>
              <HiCheck size={20} />
              <span style={{ fontWeight: 700 }}>MFA is Active</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Your account is protected with an additional layer of security.
            </p>
          </div>
          <button 
            onClick={handleDisable}
            disabled={loading}
            className="btn-secondary" 
            style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#ef4444' }}
          >
            Disable
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!showSetup ? (
        <div style={{ 
          padding: '24px', borderRadius: '16px', 
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)'
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Two-factor authentication adds an extra layer of security to your account by requiring more than just a password to log in.
          </p>
          <button 
            onClick={handleSetup}
            disabled={loading}
            className="btn-primary" 
            style={{ padding: '10px 20px', fontSize: '0.9rem' }}
          >
            {loading ? 'Setting up...' : 'Enable MFA'}
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '24px', border: '1px solid var(--saffron)' }}>
          <h4 style={{ color: 'white', marginBottom: '16px' }}>Setup Multi-Factor Authentication</h4>
          <ol style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', paddingLeft: '20px', marginBottom: '24px' }}>
            <li>Scan this QR code with your Authenticator app (Google Authenticator, Authy, etc.)</li>
            <li>Enter the 6-digit code generated by the app below.</li>
          </ol>
          
          <div style={{ textAlign: 'center', marginBottom: '24px', background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block', width: 'auto' }}>
            {(mfaData?.qr_code || mfaData?.provisioning_uri) && (
              <img 
                src={mfaData.qr_code || `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(mfaData.provisioning_uri)}`} 
                alt="QR Code" 
                style={{ width: '180px', height: '180px' }} 
              />
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Verification Code</label>
            <input 
              className="input-field"
              type="text" 
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={handleVerify}
              disabled={loading}
              className="btn-primary" 
              style={{ flex: 1 }}
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
            <button 
              onClick={() => setShowSetup(false)}
              className="btn-secondary" 
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
