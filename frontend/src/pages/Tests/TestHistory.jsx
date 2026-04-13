import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiClock, HiCalendar, HiChartBar, HiChevronRight, HiAcademicCap } from 'react-icons/hi';
import { testService } from '../../services/testService';
import toast from 'react-hot-toast';

export default function TestHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await testService.getHistory();
      setHistory(res.data || []);
    } catch (err) {
      toast.error('Failed to load test history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="animate-fadeIn page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="test-history-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Exam History</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review your past performance and learn from mistakes</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/tests')}>Take New Test</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '100px' }} />)}
        </div>
      ) : history.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <HiAcademicCap size={48} color="var(--text-secondary)" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '16px', fontSize: '1.1rem' }}>You haven't taken any tests yet.</p>
          <button className="btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/tests')}>Start Your First Test</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {history.map((attempt) => (
            <motion.div
              key={attempt.id}
              whileHover={{ x: 10, background: 'rgba(255,255,255,0.05)' }}
              className="glass-card test-history-card"
              style={{ padding: '24px', cursor: 'pointer' }}
              onClick={() => navigate('/test-result', { state: attempt })}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{attempt.test_title || `Mock Test #${attempt.test_id}`}</h3>
                  {!attempt.is_completed && <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>Incomplete</span>}
                  {attempt.is_completed && <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Completed</span>}
                </div>
                <div className="test-history-card-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HiCalendar size={14} /> {formatDate(attempt.started_at)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <HiClock size={14} /> {Math.round(attempt.time_taken / 60)} mins used
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginRight: '40px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }} className="gradient-text">{attempt.score}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Score</div>
              </div>

              <div className="test-history-card-stats">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#10b981' }}>{attempt.correct}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Correct</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 800, color: '#ef4444' }}>{attempt.wrong}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Wrong</div>
                  </div>
                </div>
                <HiChevronRight size={24} color="var(--border)" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
