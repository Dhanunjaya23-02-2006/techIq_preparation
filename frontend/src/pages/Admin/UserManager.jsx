import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  HiSearch, 
  HiOutlineTrash, 
  HiOutlinePlus, 
  HiOutlineUser,
  HiOutlineCheckCircle,
  HiLightningBolt,
  HiStar
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import TiltCard from '../../components/TiltCard';
// Remove date-fns import to avoid installation dependency

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState('pro'); // 'pro' or 'elite'

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const resp = await authService.getUsers();
      let userData = [];
      if (resp.data.success) {
        userData = resp.data.data || [];
      } else if (resp.data.results) {
        userData = resp.data.results;
      } else {
        userData = Array.isArray(resp.data) ? resp.data : [];
      }
      setUsers(userData);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (userId, username) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>Delete user "{username}"?</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await authService.deleteUser(userId);
                toast.success(`User ${username} deleted`);
                fetchUsers();
              } catch (error) {
                toast.error("Failed to delete user");
              }
            }}
            style={{ 
              padding: '6px 12px', borderRadius: '8px', border: 'none', 
              background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 
            }}
          >
            Confirm
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            style={{ 
              padding: '6px 12px', borderRadius: '8px', border: 'none', 
              background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' 
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000, style: { background: '#1e293b', border: '1px solid rgba(255,153,51,0.3)', padding: '16px' } });
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(filteredUsers.map(u => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    setIsActivating(true);
    try {
      // Pass the selected plan type to the backend
      await authService.bulkActivate(selectedUsers, selectedPlanType);
      toast.success(`Successfully activated ${selectedUsers.length} students to ${selectedPlanType.toUpperCase()} plan`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to bulk activate users");
    } finally {
      setIsActivating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>Delete {selectedUsers.length} selected students?</p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              setIsDeleting(true);
              try {
                await authService.bulkDelete(selectedUsers);
                toast.success(`Successfully deleted ${selectedUsers.length} students`);
                setSelectedUsers([]);
                fetchUsers();
              } catch (error) {
                toast.error("Failed to bulk delete users");
              } finally {
                setIsDeleting(false);
              }
            }}
            style={{ 
              padding: '6px 12px', borderRadius: '8px', border: 'none', 
              background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 
            }}
          >
            Confirm Delete
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)}
            style={{ 
              padding: '6px 12px', borderRadius: '8px', border: 'none', 
              background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' 
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 6000, style: { background: '#1e293b', border: '1px solid #ef444450', padding: '16px' } });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a valid CSV file");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    setIsRegistering(true);
    try {
      const resp = await authService.bulkRegister(formData);
      toast.success(resp.data.message || "Bulk registration completed");
      if (resp.data.errors && resp.data.errors.length > 0) {
        resp.data.errors.forEach(err => toast.error(err, { duration: 5000 }));
      }
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to bulk register users");
    } finally {
      setIsRegistering(false);
      e.target.value = null; // Reset input
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatLastLogin = (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      return date.toLocaleDateString();
    } catch (e) {
      return 'Never';
    }
  };

  const getPlanStyles = (plan) => {
    const p = (plan || 'STARTER PLAN').toUpperCase();
    if (p.includes('ELITE')) return { color: '#FCD34D', label: 'ELITE', glow: '0 0 20px rgba(252, 211, 77, 0.6)', bg: 'rgba(252, 211, 77, 0.1)' };
    if (p.includes('PRO')) return { color: '#A855F7', label: 'PRO', glow: '0 0 15px rgba(168, 85, 247, 0.4)', bg: 'rgba(168, 85, 247, 0.1)' };
    return { color: '#3B82F6', label: 'STARTER', glow: 'none', bg: 'rgba(59, 130, 246, 0.1)' };
  };


  const filteredUsers = (users || []).filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        staggerChildren: 0.05,
        duration: 0.6,
        ease: "easeOut"
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { type: 'spring', damping: 15, stiffness: 100 }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ 
        padding: '24px',
        color: '#fff',
        maxWidth: '1400px',
        margin: '0 auto'
      }}
    >
      {/* 3D Background Decor */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        style={{ position: 'fixed', top: '-10%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)', zIndex: -1, borderRadius: '50%', filter: 'blur(60px)' }} 
      ></motion.div>
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.15, 0.05],
          x: [0, 50, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: 'fixed', bottom: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(234, 179, 8, 0.1) 0%, transparent 70%)', zIndex: -1, borderRadius: '50%', filter: 'blur(50px)' }}
      ></motion.div>

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <motion.div
           initial={{ x: -50, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ duration: 0.6 }}
        >
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 900, 
            margin: 0, 
            letterSpacing: '-1.5px',
            background: 'linear-gradient(to right, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Student Center</h1>
          <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '1.2rem' }}>Manage your portal's core operations with precision</p>
        </motion.div>
      </div>

      {/* 3D Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {[
          { label: 'Total Students', value: users.length, icon: <HiOutlineUser size={24} />, color: '#3B82F6' },
          { 
            label: 'Online Students', 
            value: users.filter(u => {
              if (!u.last_seen) return false;
              const lastSeen = new Date(u.last_seen);
              const now = new Date();
              return (now - lastSeen) / 1000 / 60 < 5;
            }).length, 
            icon: <HiOutlineCheckCircle size={24} />, 
            color: '#10B981' 
          },
          { label: 'Pro Users', value: users.filter(u => u.current_plan?.toLowerCase().includes('pro')).length, icon: <HiLightningBolt size={24} />, color: '#A855F7' },
          { label: 'Elite Members', value: users.filter(u => u.current_plan?.toLowerCase().includes('elite')).length, icon: <HiStar size={24} />, color: '#F59E0B' }
        ].map((stat, i) => (
          <TiltCard key={i} style={{ padding: '0px', borderRadius: '24px', background: 'transparent' }}>
            <div style={{
              padding: '24px',
              height: '100%',
              background: 'rgba(15, 23, 42, 0.4)',
              border: `1px solid ${stat.color}20`,
              borderRadius: '24px',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  background: `${stat.color}15`, 
                  color: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {stat.icon}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f8fafc' }}>{stat.value}</div>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '70%' }}
                  style={{ height: '100%', background: stat.color, boxShadow: `0 0 10px ${stat.color}` }}
                />
              </div>
            </div>
          </TiltCard>
        ))}
      </div>

      {/* Search and Bulk Actions */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ 
          flex: 2,
          minWidth: '300px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '12px 20px',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
        }}>
          <HiSearch size={22} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search students by name, email, phone..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#f8fafc', 
              width: '100%', 
              fontSize: '1rem',
              outline: 'none'
            }} 
          />
        </div>
        
        <div style={{ 
          display: 'flex', 
          background: 'rgba(15, 23, 42, 0.4)', 
          padding: '4px', 
          borderRadius: '14px', 
          border: '1px solid rgba(255,255,255,0.05)' 
        }}>
          {['pro', 'elite'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedPlanType(type)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                transition: 'all 0.3s ease',
                background: selectedPlanType === type 
                  ? (type === 'elite' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #a855f7, #7e22ce)')
                  : 'transparent',
                color: selectedPlanType === type ? '#fff' : '#64748b',
                boxShadow: selectedPlanType === type ? `0 4px 12px ${type === 'elite' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(168, 85, 247, 0.3)'}` : 'none'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <motion.button 
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBulkActivate}
          disabled={isActivating || isDeleting || selectedUsers.length === 0}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            background: selectedUsers.length > 0 
              ? (selectedPlanType === 'elite' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(168, 85, 247, 0.15)') 
              : 'rgba(255,255,255,0.05)', 
            color: selectedUsers.length > 0 
              ? (selectedPlanType === 'elite' ? '#fbbf24' : '#c084fc') 
              : '#64748b',
            border: `1px solid ${selectedUsers.length > 0 
              ? (selectedPlanType === 'elite' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(168, 85, 247, 0.3)') 
              : 'rgba(255,255,255,0.1)'}`,
            padding: '12px 24px', borderRadius: '16px', fontWeight: 700,
            cursor: selectedUsers.length > 0 ? 'pointer' : 'not-allowed',
            opacity: isActivating ? 0.7 : 1,
            boxShadow: selectedUsers.length > 0 ? `0 10px 20px -5px rgba(0,0,0,0.3)` : 'none'
          }}
        >
          <HiLightningBolt size={20} /> {isActivating ? 'Activating...' : `Activate ${selectedPlanType.toUpperCase()} (${selectedUsers.length})`}
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBulkDelete}
          disabled={isDeleting || isActivating || selectedUsers.length === 0}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            background: selectedUsers.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', 
            color: selectedUsers.length > 0 ? '#ef4444' : '#64748b',
            border: `1px solid ${selectedUsers.length > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.1)'}`,
            padding: '12px 24px', borderRadius: '16px', fontWeight: 700,
            cursor: selectedUsers.length > 0 ? 'pointer' : 'not-allowed',
            opacity: isDeleting ? 0.7 : 1,
            boxShadow: selectedUsers.length > 0 ? `0 10px 20px -5px rgba(239, 68, 68, 0.2)` : 'none'
          }}
        >
          <HiOutlineTrash size={20} /> {isDeleting ? 'Deleting...' : `Delete Selected (${selectedUsers.length})`}
        </motion.button>

        <div style={{ position: 'relative' }}>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload} 
            disabled={isRegistering}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }}
          />
          <motion.button 
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff',
              border: 'none',
              padding: '12px 24px', borderRadius: '16px', fontWeight: 700,
              cursor: 'pointer',
              opacity: isRegistering ? 0.7 : 1,
              boxShadow: '0 10px 20px -5px rgba(14, 165, 233, 0.3)'
            }}
          >
            <HiOutlinePlus size={20} /> {isRegistering ? 'Uploading...' : 'Bulk Register'}
          </motion.button>
        </div>
      </div>

      {/* Users Table */}
      <motion.div 
        style={{ 
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '24px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)',
          overflowX: 'auto'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 20, background: '#0f172a', backdropFilter: 'blur(10px)' }}>
            <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <th style={{ padding: '24px 20px', width: '40px' }}>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#10b981' }}
                />
              </th>
              <th style={{ padding: '24px 30px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Student</th>
              <th style={{ padding: '24px 30px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Plan Status</th>
              <th style={{ padding: '24px 30px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Time</th>
              <th style={{ padding: '24px 30px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last Login</th>
              <th style={{ padding: '24px 30px', color: '#64748b', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '100px', textAlign: 'center', color: '#94a3b8' }}>
                  <div className="loading-shimmer">Loading students...</div>
                </td>
              </tr>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const planInfo = getPlanStyles(user.current_plan);
                const isSelected = selectedUsers.includes(user.id);
                return (
                  <motion.tr 
                    key={user.id}
                    variants={itemVariants}
                    whileHover={{ 
                      scale: 1.005, 
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      translateZ: 20
                    }}
                    style={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.02)',
                      background: isSelected ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                      transition: 'background 0.2s ease',
                      cursor: 'default'
                    }}
                  >
                    <td style={{ padding: '20px' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleSelectUser(user.id)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#10b981' }}
                      />
                    </td>
                    <td style={{ padding: '20px 30px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ position: 'relative' }}>
                          {user.avatar ? (
                            <img src={user.avatar} style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.05)' }} alt={user.username} />
                          ) : (
                            <div style={{
                              width: '52px', height: '52px', borderRadius: '14px',
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                              <HiOutlineUser size={26} color="#64748b" />
                            </div>
                          )}
                          {(() => {
                            if (!user.last_seen) return false;
                            const ls = new Date(user.last_seen);
                            const n = new Date();
                            return (n - ls) / 1000 / 60 < 5;
                          })() && (
                             <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', background: '#10b981', borderRadius: '50%', border: '3px solid #0f172a' }}></div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc' }}>{user.first_name || user.username}</div>
                          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 30px' }}>
                      <div style={{ 
                        fontWeight: 900, 
                        color: planInfo.color, 
                        fontSize: '0.75rem', 
                        padding: '4px 12px',
                        borderRadius: '8px',
                        background: planInfo.bg,
                        border: `1px solid ${planInfo.color}30`,
                        display: 'inline-block',
                        marginBottom: '8px',
                        letterSpacing: '0.1em',
                        boxShadow: planInfo.glow,
                        textTransform: 'uppercase'
                      }}>
                        {planInfo.label}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
                        <div style={{ 
                          width: '8px', height: '8px', borderRadius: '50%', 
                          background: user.is_premium ? '#10b981' : '#64748b',
                          boxShadow: user.is_premium ? '0 0 8px #10b981' : 'none'
                        }}></div>
                        {user.is_premium ? `${planInfo.label} Access` : 'Free Tier'}
                      </div>
                    </td>
                    <td style={{ padding: '20px 30px', fontWeight: 700, color: '#f8fafc' }}>
                      {formatTime(user.total_time_spent)}
                    </td>
                    <td style={{ padding: '20px 30px', color: '#94a3b8', fontSize: '0.95rem' }}>
                      {formatLastLogin(user.last_login)}
                    </td>
                    <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                      <motion.button 
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(user.id, user.username)}
                        style={{ 
                          background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none',
                          padding: '12px', borderRadius: '12px', cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <HiOutlineTrash size={22} />
                      </motion.button>
                    </td>
                  </motion.tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '120px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>No students found matches your search.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
