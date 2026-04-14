import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiCheck, 
  HiX,
  HiLightningBolt,
  HiStar,
  HiCurrencyRupee,
  HiClock,
  HiShieldCheck
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { paymentService } from '../../services/paymentService';
import TiltCard from '../../components/TiltCard';

export default function PlanManager() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    ui_slug: '',
    badge: '',
    description: '',
    price: 0,
    duration_days: 30,
    features: [],
    is_active: true,
    is_elite: false
  });
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const resp = await paymentService.getAdminPlans();
      setPlans(Array.isArray(resp.data) ? resp.data : []);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        ui_slug: plan.ui_slug || '',
        badge: plan.badge || '',
        description: plan.description || '',
        price: plan.price,
        duration_days: plan.duration_days,
        features: plan.features || [],
        is_active: plan.is_active,
        is_elite: plan.is_elite || false
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        ui_slug: '',
        badge: '',
        description: '',
        price: 0,
        duration_days: 30,
        features: [],
        is_active: true,
        is_elite: false
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await paymentService.updatePlan(editingPlan.id, formData);
        toast.success("Plan updated successfully");
      } else {
        await paymentService.createPlan(formData);
        toast.success("Plan created successfully");
      }
      fetchPlans();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save plan");
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the plan "${name}"?`)) {
      try {
        await paymentService.deletePlan(id);
        toast.success("Plan deleted");
        fetchPlans();
      } catch (error) {
        toast.error(error.response?.data?.detail || "Failed to delete plan");
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>Plan <span className="gradient-text">Management</span> 💎</h1>
          <p style={{ color: '#94a3b8', marginTop: '8px' }}>Create and manage subscription offerings for your students.</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => handleOpenModal()}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
        >
          <HiPlus size={20} /> Create New Plan
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: '#94a3b8' }}>Loading plans...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {plans.map((plan) => (
            <TiltCard key={plan.id}>
              <motion.div 
                variants={itemVariants}
                className="glass-card"
                style={{ 
                  padding: '32px', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  position: 'relative',
                  border: plan.is_active ? '1px solid rgba(255,153,51,0.2)' : '1px solid rgba(255,255,255,0.05)',
                  opacity: plan.is_active ? 1 : 0.6
                }}
              >
                {!plan.is_active && (
                  <div style={{ 
                    position: 'absolute', top: '15px', right: '15px', 
                    background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444',
                    padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800
                  }}>INACTIVE</div>
                )}
                
                {plan.is_elite && (
                  <div style={{ 
                    position: 'absolute', top: '15px', left: '15px', 
                    background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b',
                    padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    <HiStar size={12} /> ELITE
                  </div>
                )}

                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '10px 0' }}>{plan.name}</h2>
                  {plan.badge && (
                    <span style={{ 
                      background: 'var(--saffron)', color: '#000', 
                      fontSize: '0.7rem', fontWeight: 900, padding: '2px 8px', 
                      borderRadius: '4px', textTransform: 'uppercase' 
                    }}>{plan.badge}</span>
                  )}
                </div>

                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900 }}>₹{plan.price}</span>
                  <span style={{ color: '#94a3b8', fontSize: '1rem' }}> / {plan.duration_days} days</span>
                </div>

                <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
                  {plan.description}
                </p>

                <div style={{ flexGrow: 1, marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '12px', fontWeight: 700 }}>Features:</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {plan.features?.map((f, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                        <HiCheck size={16} color="var(--saffron)" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <button 
                    onClick={() => handleOpenModal(plan)}
                    style={{ 
                      flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <HiPencil size={18} /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(plan.id, plan.name)}
                    style={{ 
                      padding: '10px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)',
                      background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer'
                    }}
                  >
                    <HiTrash size={18} />
                  </button>
                </div>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 1000, 
              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-card"
              style={{ padding: '32px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h2>
                <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <HiX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Plan Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Pro Premium"
                    />
                  </div>
                  <div className="form-group">
                    <label>UI Slug (Optional)</label>
                    <input 
                      type="text" 
                      value={formData.ui_slug}
                      onChange={(e) => setFormData({...formData, ui_slug: e.target.value})}
                      placeholder="e.g. veteran"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Briefly describe the plan benefits..."
                  ></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label>Price (₹)</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (Days)</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.duration_days}
                      onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Badge</label>
                    <input 
                      type="text" 
                      value={formData.badge}
                      onChange={(e) => setFormData({...formData, badge: e.target.value})}
                      placeholder="e.g. POPULAR"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Active</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#f59e0b' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.is_elite}
                      onChange={(e) => setFormData({...formData, is_elite: e.target.checked})}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span>Grant Elite Status</span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Features</label>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input 
                      type="text" 
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      placeholder="Add a feature..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <button type="button" onClick={addFeature} className="btn-secondary" style={{ padding: '0 15px' }}>Add</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {formData.features.map((f, i) => (
                      <span key={i} style={{ 
                        background: 'rgba(255,153,51,0.1)', border: '1px solid rgba(255,153,51,0.3)',
                        padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}>
                        {f} <HiX size={14} style={{ cursor: 'pointer' }} onClick={() => removeFeature(i)} />
                      </span>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '10px', padding: '14px' }}>
                  {editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
