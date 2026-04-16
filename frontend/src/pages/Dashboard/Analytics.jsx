import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HiChartBar, HiTrendingUp, HiClock, HiAcademicCap, 
  HiLightBulb, HiCheckCircle, HiLightningBolt
} from 'react-icons/hi';
import { HiFire } from 'react-icons/hi2';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, Area, AreaChart, Tooltip, XAxis, YAxis 
} from 'recharts';
import { analyticsService } from '../../services/testService';

import ThreeDRocket from '../../components/ThreeDRocket';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getPerformance()
      .then(res => setStats(res.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--saffron)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>No Analytics Data Found</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Take your first mock test to see your performance breakdown!</p>
      </div>
    );
  }

  // Prepare radar data
  const radarData = stats.subject_stats?.map(s => ({
    subject: s.subject,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    fullMark: 100
  })) || [];

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}
    >
      {/* Header & Streak */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <motion.div variants={itemVariants}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span>Mission <span className="gradient-text">Control</span></span>
            <ThreeDRocket size={60} />
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Level <span style={{ color: 'var(--saffron)', fontWeight: 800 }}>{stats.level}</span> Aspirant • {stats.total_xp} Total XP
          </p>
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className="glass-card"
          whileHover={{ scale: 1.05 }}
          style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '20px', background: 'linear-gradient(135deg, rgba(255,69,0,0.1) 0%, transparent 100%)', border: '1px solid rgba(255,69,0,0.2)', borderRadius: '24px' }}
        >
          <div style={{ position: 'relative' }}>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <HiFire size={40} color="#ff4500" style={{ filter: 'drop-shadow(0 0 10px rgba(255,69,0,0.5))' }} />
            </motion.div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stats.streak}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Day Streak</div>
          </div>
        </motion.div>
      </div>

      {/* Level Progress Bar */}
      <motion.div variants={itemVariants} className="glass-card" style={{ marginBottom: '40px', padding: '24px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-end' }}>
           <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current Rank</span>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Level {stats.level} Explorer</h4>
           </div>
           <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--saffron)' }}>{stats.total_xp % 500} / 500</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>XP to Level {stats.level + 1}</span>
           </div>
        </div>
        <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${stats.xp_percentage}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ height: '100%', background: 'linear-gradient(90deg, var(--saffron), #ff4500)', boxShadow: '0 0 15px rgba(255,153,51,0.4)' }}
          />
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {[
          { label: 'Overall Accuracy', value: `${stats.accuracy}%`, icon: HiCheckCircle, color: '#10b981', trend: stats.accuracy_trend || '0%' },
          { label: 'Average Score', value: Number(stats.average_score).toFixed(2), icon: HiTrendingUp, color: '#f59e0b', trend: stats.score_trend || '0 pts' },
          { label: 'Total Tests', value: stats.total_tests, icon: HiAcademicCap, color: '#3b82f6', trend: 'Lifetime' },
          { label: 'Total XP', value: stats.total_xp, icon: HiLightningBolt, color: '#6366f1', trend: 'Ranked' },
        ].map(({ label, value, icon: Icon, color, trend }) => (
          <motion.div 
            key={label} 
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="glass-card" 
            style={{ padding: '24px', borderLeft: `6px solid ${color}`, position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
               <Icon size={100} color={color} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: `${color}15`, padding: '10px', borderRadius: '12px' }}>
                <Icon size={24} color={color} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
               <p style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff' }}>{value}</p>
               <span style={{ fontSize: '0.8rem', fontWeight: 800, color: color }}>{trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '40px' }}>
        {/* Radar Map (3D Skill View) */}
        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px', height: '450px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <HiChartBar color="var(--saffron)" /> Skill Radar Map
          </h3>
          <div style={{ width: '100%', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Accuracy"
                  dataKey="accuracy"
                  stroke="#FF9933"
                  fill="#FF9933"
                  fillOpacity={0.4}
                />
                <Tooltip 
                  contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#FF9933' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

        </motion.div>

        {/* Progress History */}
        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px', height: '450px' }}>
           <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <HiTrendingUp color="#34d399" /> Performance Progression
          </h3>
          <div style={{ width: '100%', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={stats.recent_attempts?.map((a, i) => ({ name: i + 1, score: a.score })) || []}>

                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="score" stroke="#34d399" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Detailed Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 450px', gap: '32px' }}>
        
        {/* Test History */}
        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Detailed Battle Log</h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>LAST 10 ATTEMPTS</span>
          </div>
          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {stats.recent_attempts?.map((attempt, idx) => (
              <div key={idx} style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <HiLightningBolt color="var(--saffron)" size={20} />
                   </div>
                   <div>
                      <div style={{ fontWeight: 800, color: '#fff' }}>{attempt.test_title || `Simulation #${stats.total_tests - idx}`}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(attempt.submitted_at).toLocaleDateString()}</div>
                   </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '1.4rem', fontWeight: 900, color: attempt.score >= 0 ? 'var(--saffron)' : '#ef4444' }}>{Number(attempt.score).toFixed(2)}</div>
                   <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--green)' }}>COMPLETED</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Knowledge & Achievements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
           <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px', background: 'linear-gradient(135deg, rgba(255,153,51,0.05) 0%, transparent 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' }}>
                 <HiLightBulb size={24} color="var(--saffron)" />
                 <h3 style={{ fontSize: '1.3rem', fontWeight: 900 }}>Intelligence Report</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                   <p style={{ color: '#f87171', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Target Focus Areas</p>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {stats.weak_topics?.map((t, idx) => (
                         <span key={idx} style={{ padding: '6px 14px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            {t.question__topic}
                         </span>
                      ))}
                   </div>
                </div>
                <div>
                   <p style={{ color: '#34d399', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Elite Knowledge Base</p>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {stats.strong_topics?.map((t, idx) => (
                         <span key={idx} style={{ padding: '6px 14px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700, border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                            {t.question__topic}
                         </span>
                      ))}
                   </div>
                </div>
              </div>
           </motion.div>

            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px' }}>
               <h4 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '20px', color: '#fff' }}>Strategic Recommendation</h4>
               <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1rem' }}>
                  {stats.recommendation?.text || `Agent, your current ${stats.accuracy}% accuracy is impressive. To breach the Top 100, focus on ${stats.weak_topics?.[0]?.question__topic || 'Conceptual'} modules. Your ${stats.streak}-day streak grants a Level UP bonus.`}
               </p>
            </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
