import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { HiUser, HiChartBar, HiTrendingUp, HiLightningBolt } from 'react-icons/hi';
import { HiTrophy, HiStar, HiBolt } from 'react-icons/hi2';
import { leaderboardService } from '../../services/testService';
import Medal3D from '../../components/Medal3D';

const PodiumCard = ({ entry, rank, custom }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const podiumVariants = {
    hidden: { scale: 0.8, opacity: 0, y: 50 },
    visible: (i) => ({
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        delay: i * 0.2
      }
    })
  };

  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  const type = isFirst ? 'gold' : isSecond ? 'silver' : 'bronze';
  const size = isFirst ? 120 : 80;
  
  return (
    <motion.div 
      custom={custom}
      variants={podiumVariants}
      initial="hidden"
      animate="visible"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="glass-card perspective-1000"
      style={{ 
        padding: isFirst ? '48px 32px' : '32px', 
        textAlign: 'center', 
        background: isFirst 
          ? 'linear-gradient(180deg, rgba(255,215,0,0.15) 0%, transparent 100%)'
          : isSecond 
            ? 'linear-gradient(180deg, rgba(192,192,192,0.1) 0%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(205,127,50,0.1) 0%, transparent 100%)',
        borderRadius: isFirst ? '40px 40px 0 0' : '30px 30px 0 0',
        border: isFirst ? '2px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.05)',
        borderBottom: 'none',
        boxShadow: isFirst ? '0 20px 40px -10px rgba(255,215,0,0.1)' : 'none',
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d'
      }}
    >
      <div style={{ transform: 'translateZ(30px)' }}>
        <Medal3D type={type} size={size} label={rank} />
      </div>
      <h3 style={{ fontSize: isFirst ? '1.6rem' : '1.2rem', fontWeight: 900, marginTop: '24px', color: '#fff', transform: 'translateZ(20px)' }}>
        {entry.student_name}
      </h3>
      <p style={{ color: isFirst ? 'var(--saffron)' : 'var(--text-secondary)', fontWeight: 700, transform: 'translateZ(15px)' }}>
        Level {entry.level} {isFirst && 'Supreme'}
      </p>
      <div style={{ 
        marginTop: '16px', 
        fontSize: isFirst ? '1.3rem' : '1rem', 
        fontWeight: 900, 
        color: isFirst ? '#FFD700' : isSecond ? '#C0C0C0' : '#CD7F32',
        transform: 'translateZ(25px)'
      }}>
        {entry.total_xp} XP
      </div>
    </motion.div>
  );
};

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter ? { exam_type: filter } : {};
    leaderboardService.get(params)
      .then(res => {
        const payload = res.data.data;
        setData(payload.leaderboard || []);
        setUserRank(payload.user_rank);
        setGlobalStats(payload.global_stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter]);

  const topThree = data.slice(0, 3);
  const others = data.slice(3);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      }
    }
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

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', overflow: 'hidden' }}>
      {/* Premium Header */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ textAlign: 'center', marginBottom: '80px', position: 'relative' }}
      >
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 1, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <h1 className="leaderboard-header-title">
            Hall of <span className="gradient-text">Fame</span> 🏆
          </h1>
        </motion.div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Real-time global rankings. Push your limits and claim your spot among the legends.
        </p>
        
        {/* Floating background elements */}
        <div style={{ position: 'absolute', top: -50, right: '10%', opacity: 0.1, pointerEvents: 'none' }}>
           <HiTrophy size={150} />
        </div>
        <div style={{ position: 'absolute', top: 50, left: '10%', opacity: 0.1, pointerEvents: 'none' }}>
           <HiStar size={100} />
        </div>
      </motion.div>

      {/* User's Personal Rank Highlight */}
      {userRank && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card leaderboard-user-rank"
          style={{ 
            marginBottom: '80px', 
            padding: '32px', 
            border: '2px solid var(--saffron)', 
            background: 'linear-gradient(135deg, rgba(255,153,51,0.15) 0%, rgba(0,0,0,0) 100%)',
            borderRadius: '40px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div className="leaderboard-user-rank-info">
            <motion.div 
              animate={{ 
                scale: [1, 1.05, 1],
                filter: ["drop-shadow(0 0 5px rgba(255,153,51,0.3))", "drop-shadow(0 0 20px rgba(255,153,51,0.6))", "drop-shadow(0 0 5px rgba(255,153,51,0.3))"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
               <Medal3D type={userRank.rank <= 3 ? (userRank.rank === 1 ? 'gold' : userRank.rank === 2 ? 'silver' : 'bronze') : 'gold'} size={140} label={userRank.rank} />
            </motion.div>
            <div>
               <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--saffron)', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '8px' }}>Your Current Legend</div>
               <h2 style={{ fontSize: '3rem', fontWeight: 950, color: '#fff', letterSpacing: '-0.02em' }}>{userRank.student_name}</h2>
               <div className="leaderboard-user-rank-stats">
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>LEVEL</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{userRank.level}</span>
                  </div>
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>EXPERIENCE</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--saffron)' }}>{userRank.total_xp} XP</span>
                  </div>
               </div>
               
               {/* XP Progress Bar for User */}
               <div style={{ marginTop: '20px', width: '300px' }}>
                  <div className="xp-bar-container">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((userRank.total_xp % 1000) / 10, 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="xp-bar-fill"
                    >
                      <div className="xp-bar-glow" />
                    </motion.div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    <span>Next Level</span>
                    <span>{1000 - (userRank.total_xp % 1000)} XP Remaining</span>
                  </div>
               </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'right', marginRight: '40px' }}>
             <div style={{ fontSize: '5rem', fontWeight: 950, color: 'var(--saffron)', lineHeight: 0.9, letterSpacing: '-0.05em' }}>#{userRank.rank}</div>
             <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Global Position</div>
          </div>
        </motion.div>
      )}

      {/* Podium Section */}
      <div className="leaderboard-podium-grid">
        {/* Second Place */}
        {topThree[1] && <PodiumCard entry={topThree[1]} rank={2} custom={1} />}

        {/* First Place */}
        {topThree[0] && <PodiumCard entry={topThree[0]} rank={1} custom={0} />}

        {/* Third Place */}
        {topThree[2] && <PodiumCard entry={topThree[2]} rank={3} custom={2} />}
      </div>

      {/* Other Rankings */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="glass-card"
        style={{ padding: '0', borderRadius: '40px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="leaderboard-rank-header" style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
           <h3 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>World Rankings</h3>
           <div className="leaderboard-rank-header-stats">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--saffron)' }} />
                <span>Total: {globalStats?.total_students || 0}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} />
                <span>Average XP: {Math.round(globalStats?.avg_xp || 0)}</span>
              </div>
           </div>
        </div>

        <div style={{ maxHeight: '800px', overflowY: 'auto' }}>
          {others.length > 0 ? others.map((entry, index) => (
            <motion.div
              key={entry.student_id}
              variants={itemVariants}
              whileHover={{ background: 'rgba(255,255,255,0.03)', x: 10 }}
              className="leaderboard-rank-row"
            >
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'rgba(255,255,255,0.2)' }}>#{index + 4}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(255,153,51,0.2), rgba(0,0,0,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,153,51,0.2)' }}>
                    <HiUser color="var(--saffron)" size={24} />
                  </div>
                  {entry.level >= 10 && (
                    <div style={{ position: 'absolute', top: -5, right: -5, background: 'var(--saffron)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-dark)' }}>
                      <HiLightningBolt size={10} color="#000" />
                    </div>
                  )}
                </div>
                <div>
                   <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{entry.student_name}</div>
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Master Aspirant • Level {entry.level}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HiBolt color="var(--saffron)" size={18} />
                    <span style={{ fontWeight: 900, color: '#fff', fontSize: '1.1rem' }}>{entry.total_xp} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>XP</span></span>
                 </div>
                 <div className="xp-bar-container" style={{ height: '4px', width: '120px' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(entry.total_xp % 1000) / 10}%` }}
                      viewport={{ once: true }}
                      className="xp-bar-fill" 
                      style={{ boxShadow: 'none' }}
                    />
                 </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', color: 'var(--green)', fontSize: '0.9rem', fontWeight: 900 }}>
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                      <HiTrendingUp size={18} />
                    </motion.div>
                    <span>+12%</span>
                 </div>
                 <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', marginTop: '4px' }}>Weekly Surge</div>
              </div>
            </motion.div>
          )) : (
            <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
               <HiChartBar size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
               <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>The arena is still quiet. Be the first to rise!</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Gamification Footer Info */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ marginTop: '100px', textAlign: 'center', padding: '80px', background: 'linear-gradient(135deg, rgba(255,153,51,0.05) 0%, rgba(19, 136, 8, 0.02) 100%)', borderRadius: '50px', border: '1px solid rgba(255,153,51,0.1)', position: 'relative', overflow: 'hidden' }}
      >
        <div className="leaderboard-footer-cards" style={{ position: 'relative', zIndex: 1 }}>
           <motion.div 
             whileHover={{ y: -10, scale: 1.05 }}
             style={{ background: 'rgba(255,255,255,0.03)', padding: '32px', borderRadius: '24px', width: '240px', border: '1px solid rgba(255,255,255,0.05)' }}
           >
              <div style={{ width: '48px', height: '48px', background: 'rgba(255,153,51,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <HiLightningBolt size={24} color="var(--saffron)" />
              </div>
              <h5 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>XP Multiplier</h5>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>Earn <span style={{ color: 'var(--saffron)', fontWeight: 700 }}>10 XP</span> for every correct answer in real-time tests.</p>
           </motion.div>
           <motion.div 
             whileHover={{ y: -10, scale: 1.05 }}
             style={{ background: 'rgba(255,255,255,0.03)', padding: '32px', borderRadius: '24px', width: '240px', border: '1px solid rgba(255,255,255,0.05)' }}
           >
              <div style={{ width: '48px', height: '48px', background: 'rgba(255,153,51,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <HiTrophy size={24} color="var(--saffron)" />
              </div>
              <h5 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>Weekly Crown</h5>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>Top <span style={{ color: 'var(--saffron)', fontWeight: 700 }}>10 legends</span> each week unlock exclusive Elite features.</p>
           </motion.div>
        </div>
        <h4 style={{ color: '#fff', fontWeight: 950, fontSize: '2rem', marginBottom: '16px', position: 'relative', zIndex: 1 }}>Fair Play Foundation</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.8, position: 'relative', zIndex: 1, fontWeight: 500 }}>
          The Hall of Fame is built on integrity. Our dynamic ranking system uses anti-cheat verification for every submission. Forge your path to the top with pure skill and dedication.
        </p>
        
        {/* Background glow in footer */}
        <div style={{ position: 'absolute', bottom: '-50%', left: '50%', transform: 'translateX(-50%)', width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(255,153,51,0.1) 0%, transparent 70%)', zIndex: 0 }} />
      </motion.div>
    </div>
  );
}
