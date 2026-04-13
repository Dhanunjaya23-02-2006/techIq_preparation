import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiClock, HiAcademicCap, HiPencil, HiTrash, HiDownload } from 'react-icons/hi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { testService } from '../../services/testService';
import useAuthStore from '../../store/authStore';

export default function TestList() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const isPYQPage = location.pathname === '/pyq';
  const isGrandPage = location.pathname === '/grand-test';

  const fetchTests = () => {
    setLoading(true);
    const params = { 
      exam_type: filter || undefined,
      is_pyq: isPYQPage,
      is_grand_test: isGrandPage
    };
    // Ensure we don't send undefined keys
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    testService.getMockTests(params)
      .then(res => setTests(res.data.results || res.data || []))
      .catch(() => toast.error('Failed to load tests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTests();
  }, [filter, location.pathname]);

  const handleStart = async (testId) => {
    try {
      const res = await testService.startTest(testId);
      if (res.data.success) navigate('/test-engine', { state: res.data.data });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot start test');
    }
  };

  const handleDelete = (id, title) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>Delete test "{title}"?</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await testService.deleteMockTest(id);
                toast.success('Test deleted');
                fetchTests();
              } catch { toast.error('Delete failed'); }
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

  return (
    <div className="animate-fadeIn">
      <div className="test-list-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
            {isPYQPage ? '📚 Previous Year Papers' : isGrandPage ? '🏆 Grand Tests' : '📝 Mock Tests'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {isPYQPage ? 'Free PDF papers and interactive pyq quizzes' : 'Full length simulation of the actual exam'}
          </p>
        </div>
        <div className="test-list-actions">
          <select className="input-field" style={{ maxWidth: '180px' }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All {isPYQPage ? 'PYQs' : 'Exams'}</option>
            <option value="ntpc">NTPC</option>
            <option value="group_d">Group D</option>
            <option value="je">JE</option>
            <option value="alp">ALP</option>
          </select>
          <button 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => navigate('/test-history')}
          >
            <HiClock /> My History
          </button>
        </div>
      </div>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '200px' }} />)}
        </div>
      ) : tests.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <HiAcademicCap size={48} color="var(--text-secondary)" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>No tests available</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {tests.map(t => (
            <div key={t.id} className="glass-card" style={{ padding: '24px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span className="badge" style={{ 
                    background: t.is_pyq ? 'rgba(16, 185, 129, 0.15)' : t.is_grand_test ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)', 
                    color: t.is_pyq ? '#10b981' : t.is_grand_test ? '#fbbf24' : '#818cf8' 
                  }}>
                    {t.is_pyq ? '📚 PYQ' : t.is_grand_test ? '🏆 Grand' : '📝 Mock'}
                  </span>
                  
                  {t.title.includes('AI Generated') && (
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: '0.7rem' }}>
                      ✨ AI Generated
                    </span>
                  )}
                  
                  {/* Access Badge */}
                  {!isAdmin && !t.is_free && (
                    <span className="badge" style={{ 
                      background: 'rgba(0,0,0,0.3)', 
                      color: (t.is_grand_test || t.is_pyq) ? '#fbbf24' : '#818cf8',
                      border: `1px solid ${(t.is_grand_test || t.is_pyq) ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.3)'}`,
                      fontSize: '0.7rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: (t.is_grand_test || t.is_pyq) ? '#fbbf24' : '#818cf8' }} />
                        {(t.is_grand_test || t.is_pyq) ? 'Elite Plan Exclusive' : 'Pro Plan Exclusive'}
                      </div>
                    </span>
                  )}
                  {t.is_free && (
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.7rem' }}>
                      ✨ Free Access
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => navigate(`/admin/tests?edit=${t.id}`)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-light)', cursor: 'pointer' }}
                      title="Edit"
                    >
                      <HiPencil size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(t.id, t.title)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      title="Delete"
                    >
                      <HiTrash size={18} />
                    </button>
                  </div>
                )}
              </div>
              <h3 style={{ fontWeight: 700, marginBottom: '12px' }}>{t.title}</h3>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
                <span><HiClock size={14} /> {t.time_limit} min</span>
                <span>{t.total_questions} Qs</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {t.total_questions > 0 && (() => {
                  const currentPlan = user?.current_plan || 'No Plan';
                  const testCounts = user?.test_counts || { mock: 0, grand: 0, pyq: 0 };
                  const totalAttempts = user?.total_test_attempts || 0;
                  
                  const isElite = ['Elite', 'Elite Mastery'].includes(currentPlan);
                  const isPro = ['Pro', 'Pro Premium'].includes(currentPlan) || isElite;
                  const isStarter = ['Starter', 'Starter Plan'].includes(currentPlan) || isPro;
                  const isFreeTier = !isStarter;

                  let limitReached = false;
                  let lockReason = '';

                  if (isFreeTier) {
                    if (!t.is_free) {
                      limitReached = true;
                      lockReason = 'Premium Test';
                    } else if (totalAttempts >= 3) {
                      limitReached = true;
                      lockReason = '3-Exams Limit';
                    }
                  } else if (currentPlan === 'Starter' || currentPlan === 'Starter Plan') {
                    if (t.is_grand_test && testCounts.grand >= 30) {
                      limitReached = true;
                      lockReason = 'Grand Test Limit (30)';
                    } else if (t.is_pyq && testCounts.pyq >= 40) {
                      limitReached = true;
                      lockReason = 'PYQ Limit (40)';
                    } else if (!t.is_grand_test && !t.is_pyq && testCounts.mock >= 50) {
                      limitReached = true;
                      lockReason = 'Mock Test Limit (50)';
                    }
                  } else if (currentPlan === 'Pro' || currentPlan === 'Pro Premium') {
                    if (t.is_grand_test && testCounts.grand >= 60) {
                      limitReached = true;
                      lockReason = 'Grand Test Limit (60)';
                    } else if (t.is_pyq && testCounts.pyq >= 80) {
                      limitReached = true;
                      lockReason = 'PYQ Limit (80)';
                    } else if (!t.is_grand_test && !t.is_pyq && testCounts.mock >= 100) {
                      limitReached = true;
                      lockReason = 'Mock Test Limit (100)';
                    }
                  }

                  const canAccess = isAdmin || (!limitReached && (t.is_free || (t.is_grand_test || t.is_pyq ? isElite : isStarter)));
                  const effectivelyLocked = !canAccess;

                  return (
                    <motion.button 
                      whileHover={effectivelyLocked ? {} : { scale: 1.05, translateY: -4 }}
                      whileTap={effectivelyLocked ? {} : { scale: 0.95 }}
                      className={effectivelyLocked ? "btn-secondary" : "btn-primary"} 
                      style={{ 
                        flex: 1, fontWeight: 700, 
                        opacity: effectivelyLocked ? 0.6 : 1,
                        cursor: effectivelyLocked ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                      }} 
                      onClick={() => !effectivelyLocked && handleStart(t.id)}
                    >
                      {effectivelyLocked ? (
                        <>{lockReason ? `🚫 ${lockReason}` : '🔏 Locked'}</>
                      ) : (
                        <>Start →</>
                      )}
                    </motion.button>
                  );
                })()}
                {t.is_pyq && t.pdf_file && (
                  <motion.a
                    href={t.pdf_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05, translateY: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-secondary"
                    style={{ 
                      padding: '12px', display: 'flex', alignItems: 'center', 
                      justifyContent: 'center', color: 'var(--text-primary)' 
                    }}
                    title="Download PYQ PDF"
                  >
                    <HiDownload size={20} />
                  </motion.a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
