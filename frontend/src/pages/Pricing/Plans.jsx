import React from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { HiCheck, HiRocketLaunch, HiShieldCheck, HiTrophy, HiCreditCard, HiXMark } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import api from '../../services/api';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';


const PlanCard = ({ plan, isFeatured, onEnroll, isCurrentPlan, hasActivePlan, isUpgrade }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const iconMap = {
    'recruit': <HiRocketLaunch size={48} color="var(--saffron)" />,
    'veteran': <HiShieldCheck size={48} color="#FFD700" />,
    'legendary': <HiTrophy size={48} color="#C0C0C0" />
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`glass-card perspective-1000 ${isFeatured ? 'featured-plan-card' : ''}`}
    >
      <div style={{ transform: "translateZ(60px)", transformStyle: "preserve-3d", display: 'flex', flexDirection: 'column', height: '100%', padding: '32px 24px' }}>
        
        {/* Badge */}
        {plan.badge && (
          <div className="plan-badge-v2">
            <span className="pulse-dot"></span>
            {plan.badge}
          </div>
        )}

        {/* Icon Header */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ 
              background: 'rgba(255,255,255,0.03)', 
              padding: '16px', 
              borderRadius: '20px', 
              border: '1px solid rgba(255,153,51,0.2)',
              boxShadow: isFeatured ? '0 0 20px rgba(255, 153, 51, 0.15)' : 'none'
            }}
          >
            {iconMap[plan.ui_slug] || <span style={{fontSize: '40px'}}>{plan.icon}</span>}
          </motion.div>
        </div>

        {/* Plan Title */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            {plan.name}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.4, fontWeight: 500, minHeight: '40px' }}>
            {plan.description}
          </p>
        </div>

        {/* Price Section */}
        <div style={{ textAlign: 'center', marginBottom: '24px', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--saffron)', marginBottom: '10px' }}>₹</span>
            <span style={{ fontSize: '3.2rem', fontWeight: 950, color: '#fff', letterSpacing: '-1.5px' }}>{plan.price}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, marginLeft: '4px' }}>/ {plan.duration}</span>
          </div>
        </div>

        {/* Features List */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {(plan.features || []).map((feature, idx) => (
            <motion.li 
              key={idx} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 600, color: '#d1d1d1' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '20px', height: '20px', borderRadius: '50%',
                background: isFeatured ? 'rgba(255, 153, 51, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: isFeatured ? 'var(--saffron)' : '#aaa',
                flexShrink: 0
              }}>
                <HiCheck size={14} strokeWidth={3} />
              </div>
              {feature}
            </motion.li>
          ))}
        </ul>

        {/* Action Button */}
        <motion.button
          whileHover={(!hasActivePlan || isUpgrade) ? { scale: 1.02 } : {}}
          whileTap={(!hasActivePlan || isUpgrade) ? { scale: 0.98 } : {}}
          onClick={() => (!hasActivePlan || isUpgrade) && onEnroll(plan)}
          disabled={hasActivePlan && !isUpgrade}
          className={isCurrentPlan ? 'active-plan-card-btn' : (isFeatured ? 'featured-enroll-btn' : 'standard-enroll-btn')}
          style={{
            ...(hasActivePlan && !isUpgrade && !isCurrentPlan ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
            ...(isCurrentPlan ? { background: 'rgba(255, 153, 51, 0.1)', border: '1px solid var(--saffron)', color: 'var(--saffron)' } : {})
          }}
        >
          {isCurrentPlan ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <HiShieldCheck size={20} /> YOUR ACTIVE PLAN
            </span>
          ) : isUpgrade ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <HiRocketLaunch size={20} /> UPGRADE NOW
            </span>
          ) : isFeatured ? (
             <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <HiRocketLaunch size={20} /> ASCEND TO PRO
             </span>
          ) : 'START JOURNEY'}
        </motion.button>
      </div>
    </motion.div>
  );
};

const PLAN_LEVELS = {
  'No Plan': 0,
  'Starter': 1,
  'Pro': 2,
  'Elite': 3
};

export default function Plans() {
  const { user } = useAuthStore();
  const [plans, setPlans] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  
  const currentPlanName = user?.current_plan || 'No Plan';
  const currentLevel = PLAN_LEVELS[currentPlanName] || 0;
  const hasActivePlan = currentLevel > 0;

  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await paymentService.getPlans();
        const planDetails = {
          'Starter': { ui_slug: 'recruit', icon: '🚀', highlight: false, description: 'Perfect for basic training and fundamental concept clearance.' },
          'Pro': { ui_slug: 'veteran', icon: '⭐', highlight: true, description: 'Become a battle-hardened aspirant with full test access.', badge: 'POPULAR' },
          'Elite': { ui_slug: 'legendary', icon: '👑', highlight: false, description: 'Master every dimension of the exam with personal mentorship.' }
        };

        const plansArray = res.data.results || res.data || [];
        const mappedPlans = plansArray.map(p => {
          const details = planDetails[p.name] || {};
          return {
            ...p,
            ...details,
            price: parseInt(p.price).toString(),
            duration: p.duration_days === 365 ? '1 Year' : `${Math.round(p.duration_days / 30)} Months`
          };
        });
        setPlans(mappedPlans);
      } catch (err) {
        toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleEnroll = (plan) => {
    processPayment('full', plan);
  };

  const processPayment = async (paymentType, plan) => {
    const loadingToast = toast.loading(`Initializing secure checkout...`);
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      toast.dismiss(loadingToast);
      toast.error('Razorpay SDK failed to load.');
      return;
    }

    try {
      const res = await paymentService.checkout(plan.id, paymentType);
      const { order_id, amount, currency, key_id } = res.data;
      toast.dismiss(loadingToast);

      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: 'TrackIQ Premium',
        description: `Subscription for ${plan.name} (${paymentType})`,
        order_id: order_id,
        handler: async (response) => {
          const verifyToast = toast.loading('Verifying secure payment...');
          try {
            await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.dismiss(verifyToast);
            toast.success('Subscription Activated Successfully! 🎊');
            navigate('/dashboard');
          } catch (err) {
            toast.dismiss(verifyToast);
            toast.error('Payment verification failed.');
          }
        },
        theme: { color: '#138808' }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error(err.response?.data?.error || 'Unable to initiate secure checkout.');
    }
  };

  return (
    <div style={{ padding: '60px 20px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', position: 'relative' }}>
      

      {/* Refined Background Elements */}
      <div style={{ position: 'fixed', top: '15%', left: '10%', opacity: 0.03, pointerEvents: 'none', zIndex: 0 }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}>
          <HiRocketLaunch size={300} />
        </motion.div>
      </div>
      <div style={{ position: 'fixed', bottom: '15%', right: '10%', opacity: 0.03, pointerEvents: 'none', zIndex: 0 }}>
        <motion.div animate={{ rotate: -360 }} transition={{ duration: 50, repeat: Infinity, ease: "linear" }}>
          <HiTrophy size={400} />
        </motion.div>
      </div>

      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: 'center', marginBottom: '80px', position: 'relative', zIndex: 1 }}
      >
        <motion.div
           animate={{ 
             y: [0, -10, 0],
             filter: ["drop-shadow(0 0 10px rgba(255,153,51,0))", "drop-shadow(0 0 25px rgba(255,153,51,0.3))", "drop-shadow(0 0 10px rgba(255,153,51,0))"]
           }}
           transition={{ duration: 4, repeat: Infinity }}
           style={{ display: 'inline-flex', padding: '20px', borderRadius: '30px', background: 'rgba(255,153,51,0.1)', marginBottom: '32px' }}
        >
          <HiTrophy size={60} color="var(--saffron)" />
        </motion.div>
        
        <h1 className="plans-hero-title">
          Choose Your <span className="gradient-text">Legendary</span> Path
        </h1>
        {hasActivePlan && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             style={{ 
               marginTop: '20px', 
               padding: '12px 24px', 
               background: 'rgba(255, 153, 51, 0.1)', 
               border: '1px solid rgba(255, 153, 51, 0.2)', 
               borderRadius: '12px',
               display: 'inline-flex',
               alignItems: 'center',
               gap: '12px',
               color: 'var(--saffron)',
               fontWeight: 600
             }}
           >
             <HiShieldCheck size={24} />
             You currently have an active {user.current_plan} Plan
           </motion.div>
        )}
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto', fontWeight: 500, lineHeight: 1.5, marginTop: hasActivePlan ? '20px' : '0' }}>
          The path to the Railways begins here. Select a tier that matches your ambition and start your ascent to the top of the leaderboard.
        </p>
      </motion.div>

      {/* Pricing Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', zIndex: 1, position: 'relative' }}>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: '60px', height: '60px', border: '5px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--saffron)', borderRadius: '50%', margin: '0 auto 24px' }}
          />
          <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Securing premium plans information...</p>
        </div>
      ) : (
        <div className="plans-grid">
          {plans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              isFeatured={plan.highlight} 
              onEnroll={handleEnroll} 
              isCurrentPlan={currentPlanName === plan.name}
              hasActivePlan={hasActivePlan}
              isUpgrade={PLAN_LEVELS[plan.name] > currentLevel}
            />
          ))}
        </div>
      )}

      {/* Quality Trust Banner */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 1 }}
      >
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          🔒 Secure Payment Processing • Instant Activation • 24/7 Support
        </p>
      </motion.div>

    </div>
  );
}
