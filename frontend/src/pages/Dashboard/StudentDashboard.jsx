import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { HiAcademicCap, HiChartBar, HiStar, HiClock, HiTrendingUp, HiClipboardList, HiFire } from 'react-icons/hi';
import useAuthStore from '../../store/authStore';
import { analyticsService } from '../../services/testService';
import PerformanceCharts from './components/PerformanceCharts';
import TiltCard from '../../components/TiltCard';

import ThreeDRocket from '../../components/ThreeDRocket';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getPerformance()
      .then(res => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const examLabels = {
    ntpc: 'RRB NTPC', group_d: 'RRB Group D', je: 'RRB JE', alp: 'RRB ALP'
  };

  const quickActions = [
    { icon: HiAcademicCap, label: 'Take Mock Test', color: '#6366f1', path: '/tests' },
    { icon: HiStar, label: 'Grand Test', color: '#f59e0b', path: '/grand-test' },
    { icon: HiClipboardList, label: 'Previous Year Q', color: '#10b981', path: '/pyq' },
    { icon: HiClock, label: 'Test History', color: '#818cf8', path: '/test-history' },
    { icon: HiChartBar, label: 'My Analytics', color: '#ec4899', path: '/analytics' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const { level, xp, progress, nextLevelXp } = stats ? {
    level: stats.level || 1,
    xp: stats.total_xp || 0,
    progress: stats.xp_percentage || 0,
    nextLevelXp: stats.next_level_xp || 500
  } : { level: 1, xp: 0, progress: 0, nextLevelXp: 500 };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ position: 'relative', zIndex: 1 }}
    >
      {/* 3D Animated Background Elements */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: -1, pointerEvents: 'none' }}>
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: 'absolute', top: '10%', right: '5%', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,153,51,0.1) 0%, transparent 70%)', filter: 'blur(20px)' }}
        />
        <motion.div
           animate={{ y: [0, 30, 0], x: [0, -20, 0], rotate: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
           transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
           style={{ position: 'absolute', bottom: '20%', left: '5%', width: '200px', height: '200px', borderRadius: '30%', background: 'radial-gradient(circle, rgba(19,136,8,0.1) 0%, transparent 70%)', filter: 'blur(30px)' }}
        />
      </div>

      {/* Welcome Header */}
      <motion.div 
        variants={itemVariants} 
        className="dashboard-header"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          flexWrap: 'wrap',
          gap: '24px',
          marginBottom: '32px' 
        }}
      >
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h1 style={{ 
            fontSize: 'clamp(1.5rem, 4vw, 2rem)', 
            fontWeight: 900, 
            marginBottom: '8px', 
            color: 'var(--text-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: '12px' 
          }}>
            <span>
              Welcome back, <span 
                className="gradient-text cursor-pointer" 
                onClick={() => navigate('/profile')}
              >
                {user?.first_name || user?.username}
              </span>!
            </span>
            <ThreeDRocket size={45} />
          </h1>

          <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '1.05rem' }}>
            Target: <strong>{examLabels[user?.target_exam] || 'Railway Exam'}</strong> 
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ 
                background: 'rgba(245, 158, 11, 0.1)', 
                color: '#f59e0b', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '0.85rem',
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontWeight: 700,
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.1)'
              }}>
                <HiFire size={18} /> {stats?.streak || 0} Day Streak
              </span>
              <span style={{ 
                background: user?.is_elite ? 'rgba(255, 153, 51, 0.15)' : user?.is_premium ? 'rgba(99, 102, 241, 0.15)' : 'rgba(156, 163, 175, 0.15)', 
                color: user?.is_elite ? 'var(--saffron)' : user?.is_premium ? '#6366f1' : '#9ca3af', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '0.85rem',
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                fontWeight: 700,
                boxShadow: user?.is_elite ? '0 0 15px rgba(255, 153, 51, 0.1)' : '0 0 15px rgba(99, 102, 241, 0.1)'
              }}>
                <HiStar size={16} /> {user?.current_plan || 'No Plan'}
              </span>
            </div>
          </div>
        </div>



        {/* Enhanced Gamification Level Badge */}
        <TiltCard className="level-badge-card" style={{ padding: '0px', borderRadius: '24px', minWidth: '280px', background: 'transparent' }}>
          <div style={{ 
            padding: '24px', 
            borderRadius: '24px', 
            background: 'rgba(255,153,51,0.08)', 
            border: '1px solid rgba(255,153,51,0.3)', 
            position: 'relative', 
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
            height: '100%'
          }}>
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '100px', height: '100px', background: 'radial-gradient(circle, rgba(255,153,51,0.2) 0%, transparent 70%)', filter: 'blur(20px)' }} />
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
              <motion.div 
                animate={{ rotateY: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  color: '#fff',
                  border: '4px solid rgba(255,255,255,0.2)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {level}
              </motion.div>
              <div>
                 <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--saffron)', display: 'block' }}>Elite Warrior</span>
                 <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Level {level} reached</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Progress to Level {level + 1}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 800 }}>{Number(progress || 0).toFixed(0)}%</span>
            </div>
            
            <div className="xp-bar-container" style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,153,51,0.1)' }}>
              <motion.div 
                className="xp-bar-fill" 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ height: '100%', background: 'linear-gradient(90deg, #F59E0B, #FBBF24)', borderRadius: '10px', boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)' }} 
              />
            </div>
            <div style={{ marginTop: '8px', fontSize: '0.7rem', color: 'var(--text-tertiary)', textAlign: 'center' }}>
              {xp} / {nextLevelXp} XP EARNED
            </div>
          </div>
        </TiltCard>
      </motion.div>

      {/* Achievements Section */}
      <motion.div variants={itemVariants} style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--saffron)' }}>🏆</span> Recent Achievements
          </h2>
          <button style={{ background: 'none', border: 'none', color: 'var(--saffron)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>View All</button>
        </div>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', padding: '4px 0 20px 0' }} className="custom-scrollbar">
          {(stats?.recent_achievements || [
            { tag: 'Speed', title: 'Speed Demon', icon: '⚡', color: '#6366f1', desc: 'Completed 10 questions in under 5 mins' },
            { tag: 'Accuracy', title: 'Perfect Score', icon: '🎯', color: '#10b981', desc: '100% accuracy in mock test #12' },
          ]).filter(Boolean).map((ach, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              style={{
                flexShrink: 0, width: '200px', padding: '20px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ 
                width: '50px', height: '50px', borderRadius: '50%', background: `${ach.color || '#f59e0b'}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                marginBottom: '12px', boxShadow: `0 0 20px ${ach.color || '#f59e0b'}10`
              }}>
                {ach.icon}
              </div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '4px' }}>{ach.title}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{ach.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <motion.div 
        variants={itemVariants} 
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}
      >
        {quickActions.map(({ icon: Icon, label, color, path }) => (
          <TiltCard key={label} style={{ padding: 0 }} className="quick-action-card transition-all duration-300">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                padding: '24px', cursor: 'pointer', border: 'none', textAlign: 'center',
                background: 'transparent', width: '100%', height: '100%'
              }}
            >
              <motion.div 
                whileHover={{ rotateZ: [0, -10, 10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
                style={{
                  width: '56px', height: '56px', borderRadius: '16px',
                  background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 20px ${color}10`
                }}
              >
                <Icon size={28} color={color} />
              </motion.div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{label}</span>
            </motion.button>
          </TiltCard>
        ))}
      </motion.div>

      {/* Gamification Center: Quests & Social Feed */}
      <div className="responsive-grid-2-1" style={{ marginBottom: '40px' }}>

        {/* Daily Quests */}
        <motion.div 
          variants={itemVariants} 
          whileHover={{ translateZ: 20 }}
          className="glass-card" 
          style={{ 
            padding: '28px', 
            border: '1px solid rgba(52, 211, 153, 0.2)',
            transformStyle: 'preserve-3d'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
               <span style={{ color: '#34d399' }}>⚡</span> Daily Quests
             </h3>
             <span style={{ fontSize: '0.8rem', background: '#34d39922', color: '#34d399', padding: '4px 10px', borderRadius: '10px', fontWeight: 700 }}>
               {stats?.daily_quests?.filter(q => q.progress >= q.total).length || 0}/{stats?.daily_quests?.length || 0} Done
             </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(stats?.daily_quests || [
              { title: 'Solve 10 Questions', progress: 0, total: 10, xp: 50, icon: HiAcademicCap, color: '#34d399' },
              { title: 'Take 1 Mock Test', progress: 0, total: 1, xp: 100, icon: HiStar, color: '#34d399' },
            ]).map((quest, i) => (
              <motion.div 
                key={i} 
                whileHover={{ x: 10, background: 'rgba(255,255,255,0.05)' }}
                style={{ 
                  padding: '16px', 
                  borderRadius: '12px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: `${quest.color || '#34d399'}20`, padding: '8px', borderRadius: '8px' }}>
                      {quest.icon ? <quest.icon color={quest.color || '#34d399'} size={18} /> : <HiStar color="#34d399" size={18} />}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{quest.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rewarding +{quest.xp} XP</p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: quest.progress === quest.total ? '#34d399' : 'var(--text-secondary)' }}>
                     {quest.progress === quest.total ? '✅' : `${quest.progress}/${quest.total}`}
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(quest.progress / quest.total) * 100}%` }}
                    style={{ height: '100%', background: quest.color, borderRadius: '10px' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Live Social Feed */}
        <motion.div 
          variants={itemVariants} 
          whileHover={{ translateZ: 20 }}
          className="glass-card" 
          style={{ padding: '28px', transformStyle: 'preserve-3d' }}
        >
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#6366f1' }}>🌐</span> Live Peer Feed
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {(stats?.peer_feed || []).map((feed, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: feed.color, fontWeight: 800, fontSize: '0.8rem', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
                   {feed.user[0]}
                </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{feed.user}</span> 
                      <span style={{ color: 'var(--text-secondary)' }}> {feed.action}</span>
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      {new Date(feed.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                {feed.score && <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399' }}>{feed.score}</span>}
                {feed.badge && <span style={{ fontSize: '1.1rem' }}>{feed.badge}</span>}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={itemVariants} 
        className="responsive-grid-4" 
        style={{ marginBottom: '32px' }}
      >

        {[
          { label: 'Tests Taken', value: stats?.total_tests ?? 0, icon: HiAcademicCap, color: '#6366f1' },
          { label: 'Avg Score', value: stats?.average_score ?? '-', icon: HiChartBar, color: '#10b981' },
          { label: 'Accuracy', value: stats?.accuracy ? `${stats.accuracy}%` : '-', icon: HiChartBar, color: '#f59e0b' },
          { label: 'Questions', value: stats?.total_questions_attempted ?? 0, icon: HiClock, color: '#ec4899' },
        ].map(({ label, value, icon: Icon, color }) => (
          <TiltCard key={label} style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: `${color}15` }}>
                <Icon size={22} color={color} />
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
            </div>
            <p style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', textShadow: `0 0 25px ${color}40` }}>
              {loading ? '—' : value}
            </p>
          </TiltCard>
        ))}
      </motion.div>

      {/* Performance Charts */}
      {!loading && stats && (
        <motion.div variants={itemVariants} style={{ marginBottom: '40px' }}>
          <div className="glass-card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <HiTrendingUp color="var(--saffron)" /> Performance Analytics
            </h3>
            <PerformanceCharts data={stats} />
          </div>
        </motion.div>
      )}

      {/* Weak & Strong Topics */}
      <motion.div 
        variants={itemVariants} 
        className="responsive-grid-2-1"
      >

        <div className="glass-card" style={{ padding: '28px', borderLeft: '4px solid #f87171' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '20px', color: '#f87171', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
             ⚠️ Focus Areas
          </h3>
          {stats?.weak_topics?.filter(t => t && t.question__topic && t.question__topic.trim()).length > 0 ? (
            stats.weak_topics.filter(t => t && t.question__topic && t.question__topic.trim()).map((t, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', textTransform: 'capitalize', fontWeight: 500 }}>{t.question__topic.trim()}</span>
                <span style={{ color: '#fca5a5', fontSize: '0.85rem', fontWeight: 700, background: 'rgba(248,113,113,0.1)', padding: '4px 10px', borderRadius: '8px' }}>{t.wrong_count || 0} Missed</span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
               <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Take some tests to see your weak areas</p>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '28px', borderLeft: '4px solid #34d399' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '20px', color: '#34d399', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
             🏆 Strong Areas
          </h3>
          {stats?.strong_topics?.filter(t => t && t.question__topic && t.question__topic.trim()).length > 0 ? (
            stats.strong_topics.filter(t => t && t.question__topic && t.question__topic.trim()).map((t, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', textTransform: 'capitalize', fontWeight: 500 }}>{t.question__topic.trim()}</span>
                <span style={{ color: '#6ee7b7', fontSize: '0.85rem', fontWeight: 700, background: 'rgba(52,211,153,0.1)', padding: '4px 10px', borderRadius: '8px' }}>{t.correct_count || 0} Correct</span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
               <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Take some tests to see your strengths</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
