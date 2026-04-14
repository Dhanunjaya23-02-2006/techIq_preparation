import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiUsers, HiDocumentText, HiCube, HiChartPie,
  HiPlus, HiBell, HiDatabase, HiChartBar, HiCurrencyRupee, HiClock, HiLightningBolt, HiEye, HiCheckCircle, HiExternalLink
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getAdminStats } from '../../services/analyticsService';
import notificationService from '../../services/notificationService';
import useAuthStore from '../../store/authStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const resp = await getAdminStats();
      if (resp.success) {
        setStatsData(resp.data);
      }
    } catch (error) {
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
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

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  const stats = [
    {
      label: 'Student Population',
      value: statsData?.user_stats?.total_students || '0',
      icon: HiUsers,
      color: '#3b82f6',
      trend: `${statsData?.user_stats?.live_users || 0} currently live`,
      isLive: true
    },
    {
      label: 'Platform Traffic',
      value: statsData?.visitor_stats?.total_visits || '0',
      icon: HiEye,
      color: '#6366f1',
      trend: `+${statsData?.visitor_stats?.today_visits || 0} visits today`
    },
    {
      label: 'Revenue',
      value: `₹${statsData?.subscription_stats?.total_revenue?.toLocaleString() || '0'}`,
      icon: HiCurrencyRupee,
      color: '#10b981',
      trend: `${statsData?.subscription_stats?.active_subscriptions || 0} active plans`
    },
    {
      label: 'New Registrations',
      value: statsData?.user_stats?.new_students_today || '0',
      icon: HiPlus,
      color: '#f59e0b',
      trend: `Joined today`
    }
  ];

  const planData = statsData?.subscription_stats?.plan_distribution?.map(item => ({
    name: item.plan__name,
    value: item.count
  })) || [];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ padding: '30px' }}
    >
      {/* Admin Header */}
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Admin <span className="gradient-text">Console</span> 🛠️
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
            Manage exam content, monitor performance, and oversee students.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          {/* Header actions removed as they are now in the global Navbar */}
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {stats.map((s, i) => (
          <div key={i} className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: `${s.color}20`, padding: '12px', borderRadius: '12px' }}>
                <s.icon size={24} color={s.color} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>{s.value}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {s.isLive && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }} 
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4500', boxShadow: '0 0 8px #ff4500' }} 
                />
              )}
              <p style={{ fontSize: '0.8rem', color: s.color, fontWeight: 600 }}>{s.trend}</p>
            </div>

            {/* Background Accent */}
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
              <s.icon size={80} color={s.color} />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '40px' }}>
        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px', minHeight: '400px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '25px' }}>Plan Distribution</h3>
          <div style={{ width: '100%', height: '300px' }}>
            {planData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>

                  <Pie
                    data={planData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {planData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'rgba(23, 23, 23, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No active subscriptions found.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '25px' }}>Live Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { user: 'System', action: 'Fetched real-time dashboard data', time: 'Just now' },
              { user: 'Admin', action: 'Accessed stats panel', time: '1 min ago' },
              { user: 'Database', action: 'Subscription data indexed', time: '10 mins ago' },
              { user: 'Server', action: 'All systems green', time: 'Ongoing' }
            ].map((activity, i) => (
              <div key={i} style={{ display: 'flex', gap: '15px', paddingBottom: '15px', borderBottom: i !== 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--saffron)', marginTop: '6px' }} />
                <div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    <span style={{ fontWeight: 700 }}>{activity.user}</span> {activity.action}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Main Admin Actions Grid */}
      <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Quick Management</h3>
          <button
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => navigate('/admin/tests')}
          >
            <HiPlus size={18} /> New Test
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
          {[
            { title: 'Question Bank', desc: 'Manage questions', icon: HiChartPie, route: '/admin/questions' },
            { title: 'Study Materials', desc: 'Study guides', icon: HiDocumentText, route: '/admin/study-material' },
            { title: 'User List', desc: 'Enrolled students', icon: HiUsers, route: '/admin/users' },
            { title: 'Subscription Plans', desc: 'Plans & Pricing', icon: HiCurrencyRupee, route: '/admin/plans' },
            { title: 'AI PDF Upload', desc: 'Extract questions', icon: HiDatabase, route: '/admin/pdf-upload' }
          ].map((action, i) => (
            <div key={i} className="glass-card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.05)' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--saffron)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
              onClick={() => navigate(action.route)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px' }}>
                  <action.icon size={22} color="var(--saffron)" />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{action.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{action.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
