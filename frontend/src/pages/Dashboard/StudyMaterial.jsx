import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiBookOpen, HiAcademicCap, HiChartBar, HiSearch, HiFolder, HiDownload } from 'react-icons/hi';
import { contentService } from '../../services/testService';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

export default function StudyMaterial() {
  const [activeTab, setActiveTab] = useState('All Subjects');
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const subjects = ['All Subjects', 'Mathematics', 'Reasoning', 'General Science', 'General Awareness', 'Current Affairs'];
  const [currentAffairs, setCurrentAffairs] = useState([]);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchCurrentAffairs = async () => {
    setLoading(true);
    try {
      const res = await contentService.getCurrentAffairs();
      setCurrentAffairs(res.data.results || res.data || []);
    } catch (error) {
      toast.error('Failed to load current affairs');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'Current Affairs') {
      fetchCurrentAffairs();
    }
  }, [activeTab]);

  const handleGenerateDaily = async () => {
    const loadId = toast.loading('Generating AI daily digest...');
    try {
      await contentService.generateDailyCurrentAffairs();
      toast.success('Generated successfully!', { id: loadId });
      fetchCurrentAffairs();
    } catch (error) {
      toast.error('Failed to generate: ' + (error.response?.data?.error || error.message), { id: loadId });
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await contentService.getMaterials();
      setResources(res.data.results || res.data || []);
    } catch (error) {
      toast.error('Failed to load study materials');
    }
    setLoading(false);
  };

  const filteredResources = resources.filter(res => {
    const matchesTab = activeTab === 'All Subjects' || res.subject.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="animate-fadeIn" style={{ padding: '20px' }}>
      
      {/* Hero Banner with 3D Book */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card" 
        style={{ 
          padding: '40px', 
          marginBottom: '32px', 
          display: 'grid', 
          gridTemplateColumns: '1fr 340px', 
          gap: '40px',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(255,153,51,0.05) 0%, rgba(59,130,246,0.05) 100%)',
          border: '1px solid var(--border)',
          overflow: 'hidden'
        }}
      >
        <div>
          <span style={{ 
            background: 'rgba(255, 153, 51, 0.1)', 
            color: 'var(--saffron)', 
            padding: '6px 14px', 
            borderRadius: '100px',
            fontSize: '0.75rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '20px',
            textTransform: 'uppercase'
          }}>
            <HiAcademicCap size={14} /> Library
          </span>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px', lineHeight: 1.1 }}>
            Exclusive <span className="gradient-text">Study Resources</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '480px', lineHeight: 1.6 }}>
            Access our curated collection of high-yield PDFs, master formulas, and video lectures. Everything you need to crack the RRB exams, beautifully organized.
          </p>
        </div>

        <div style={{ position: 'relative', width: '320px', height: '240px', perspective: '1500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* 3D CSS PREMIUM BOOK */}
          <motion.div 
            animate={{ 
              rotateY: [-5, 5, -5],
              y: [0, -8, 0],
              rotateX: [2, -2, 2]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            style={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative',
              transformStyle: 'preserve-3d',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {/* Left Cover (Back) */}
            <div style={{ 
              width: '140px', height: '200px', 
              background: 'linear-gradient(135deg, #334155, #1e293b, #0f172a)', 
              borderRadius: '6px 2px 2px 6px', position: 'relative',
              transformOrigin: 'right', transform: 'rotateY(-20deg)',
              boxShadow: '-15px 15px 40px rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '20px',
              display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
              {/* Gold Embossing Effect */}
              <div style={{ width: '100%', height: '4px', background: 'linear-gradient(to right, transparent, rgba(255,153,51,0.3), transparent)', borderRadius: '2px' }} />
              <div style={{ width: '60%', height: '4px', background: 'linear-gradient(to right, transparent, rgba(255,153,51,0.2), transparent)', borderRadius: '2px' }} />
              <div style={{ marginTop: 'auto', alignSelf: 'center', color: 'rgba(255,255,255,0.05)', fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.05em' }}>RP</div>
            </div>
            
            {/* Stacked Pages (Middle Depth) */}
            {[...Array(5)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ rotateY: [-15 + (i * 2), 5 - (i * 2), -15 + (i * 2)] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                style={{ 
                  position: 'absolute', width: '135px', height: '194px', background: '#fff',
                  borderRadius: '2px', transformOrigin: 'left', 
                  transform: `rotateY(15deg) translateZ(${i * 0.5}px)`,
                  boxShadow: '1px 1px 5px rgba(0,0,0,0.05)',
                  border: '1px solid #cbd5e1',
                  opacity: 0.95 - (i * 0.05)
                }}
              />
            ))}

            {/* Right Page (Active Content) */}
            <div style={{ 
              width: '140px', height: '200px', background: 'linear-gradient(to right, #f8fafc, #ffffff)', 
              borderRadius: '2px 6px 6px 2px', position: 'relative',
              transformOrigin: 'left', transform: 'rotateY(20deg)',
              boxShadow: '15px 15px 40px rgba(0,0,0,0.6)',
              border: '1px solid #e2e8f0',
              padding: '24px',
              display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
               {/* Realistic Page Content Mock */}
               <div style={{ width: '100%', height: '6px', background: 'var(--saffron)', opacity: 0.15, borderRadius: '3px' }} />
               <div style={{ display: 'flex', gap: '8px' }}>
                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--green)', opacity: 0.2 }} />
                 <div style={{ flex: 1, height: '6px', background: '#cbd5e1', opacity: 0.4, marginTop: '3px', borderRadius: '3px' }} />
               </div>
               {[...Array(4)].map((_, i) => (
                 <div key={i} style={{ width: i % 2 === 0 ? '100%' : '85%', height: '4px', background: '#e2e8f0', borderRadius: '2px' }} />
               ))}
               <div style={{ position: 'absolute', bottom: '24px', right: '24px', color: 'var(--saffron)', fontSize: '1.4rem', fontWeight: 900, opacity: 0.8 }}>πr²</div>
            </div>

            {/* Premium Spine - Better Connection */}
            <div style={{ 
              position: 'absolute', left: '50%', top: '10px', bottom: '10px', width: '20px', 
              background: 'linear-gradient(to right, #0f172a, #334155, #1e293b, #334155, #0f172a)',
              transform: 'translateX(-50%) translateZ(-10px)',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 0 25px rgba(0,0,0,0.5)',
              zIndex: 2
            }} />

            {/* Subtle Ambient Glow */}
            <div style={{ 
              position: 'absolute', inset: -40, 
              background: 'radial-gradient(circle, rgba(255,153,51,0.08) 0%, transparent 70%)',
              pointerEvents: 'none', zIndex: -1
            }} />
          </motion.div>

          {/* Floating Knowledge Elements */}
          {[HiBookOpen, HiAcademicCap, HiChartBar].map((Icon, i) => (
            <motion.div 
              key={i}
              animate={{ 
                y: [-40, -120], 
                x: [i === 0 ? -60 : i === 1 ? 60 : 0, i === 0 ? -80 : i === 1 ? 80 : 10], 
                opacity: [0, 0.8, 0],
                rotate: [0, 15, -15, 0],
                scale: [0.6, 1.2, 0.6]
              }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 1 }}
              style={{ position: 'absolute', top: '50%', left: '50%', color: i === 0 ? 'var(--saffron)' : i === 1 ? 'var(--green)' : '#3b82f6', fontSize: '1.8rem', zIndex: 10, filter: 'blur(0.5px)' }}
            >
              <Icon />
            </motion.div>
          ))}
        </div>

      </motion.div>

      {/* Filters Hub */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {subjects.map(sub => (
            <button
              key={sub}
              onClick={() => setActiveTab(sub)}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                background: activeTab === sub ? 'rgba(255,153,51,0.1)' : 'rgba(255,255,255,0.03)',
                border: activeTab === sub ? '1px solid var(--saffron)' : '1px solid var(--border)',
                color: activeTab === sub ? 'var(--saffron)' : 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {sub}
            </button>
          ))}
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <HiSearch style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            className="glass-input" 
            placeholder="Search materials..." 
            style={{ paddingLeft: '44px', width: '100%' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Resource Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '100px 0', textAlign: 'center' }}>
            <div className="animate-spin" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--saffron)', borderRadius: '50%' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading resources...</p>
          </div>
        ) : activeTab === 'Current Affairs' ? (
          <>
            {user?.role === 'admin' && (
              <div style={{ gridColumn: '1 / -1', marginBottom: '20px' }}>
                <button 
                  onClick={handleGenerateDaily}
                  className="btn-primary" 
                  style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <HiChartBar /> Generate Daily AI Digest
                </button>
              </div>
            )}
            {currentAffairs.length > 0 ? (
              currentAffairs.map((ca, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card"
                  style={{ padding: '32px', gridColumn: '1 / -1', borderLeft: '4px solid var(--saffron)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{ca.title}</h3>
                      <p style={{ color: 'var(--saffron)', fontSize: '0.85rem', fontWeight: 700 }}>{new Date(ca.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    {ca.file && (
                      <a href={ca.file} target="_blank" rel="noreferrer" className="glass-card" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--green)', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                        <HiDownload /> PDF
                      </a>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                    {ca.content}
                  </div>
                </motion.div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '100px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <HiAcademicCap size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No AI digests found</p>
                <p style={{ fontSize: '0.9rem' }}>Click "Generate" if you are an admin or wait for today's summary.</p>
              </div>
            )}
          </>
        ) : filteredResources.length > 0 ? (
          filteredResources.map((res, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="glass-card"
            style={{ padding: '24px', borderLeft: '4px solid rgba(255,255,255,0.05)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ 
                width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255, 153, 51, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--saffron)'
              }}>
                {res.content_type === 'pdf' ? <HiBookOpen size={20} /> : <HiFolder size={20} />}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {res.is_premium ? 'PRO/ELITE' : 'FREE'}
              </span>
            </div>
            
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>{res.title}</h3>
            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--saffron)', letterSpacing: '0.05em', marginBottom: '20px' }}>{res.subject}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {res.topic || 'General Resource'}
              </span>
              {res.file && (
                <a 
                  href={res.file} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-primary" 
                  style={{ 
                    padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px',
                    display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)', color: 'var(--green)',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(19,136,8,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  <HiDownload /> Download
                </a>
              )}
            </div>
          </motion.div>
        ))
        ) : (
          <div style={{ gridColumn: '1 / -1', padding: '100px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <HiSearch size={48} style={{ opacity: 0.1, marginBottom: '20px' }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No materials found matching your criteria</p>
            <p style={{ fontSize: '0.9rem' }}>Try changing your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
