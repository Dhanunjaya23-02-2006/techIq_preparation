import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiCheckCircle, HiXCircle, HiLightningBolt, HiChevronDown, HiChevronUp, HiInformationCircle } from 'react-icons/hi';
import { HiTrophy } from 'react-icons/hi2';
import { testService } from '../../services/testService';
import toast from 'react-hot-toast';

export default function TestResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  useEffect(() => {
    if (state?.id) {
      fetchDetails(state.id);
    }
  }, [state]);

  const fetchDetails = async (attemptId) => {
    setLoading(true);
    try {
      const res = await testService.getAttemptDetails(attemptId);
      setDetails(res.data);
    } catch (err) {
      console.error('Failed to fetch details:', err);
      toast.error('Failed to load detailed review');
    } finally {
      setLoading(false);
    }
  };

  if (!state) { navigate('/tests'); return null; }

  const correct = state.correct || 0;
  const wrong = state.wrong || 0;
  const score = state.score || 0;
  const total_questions = state.total_questions || (correct + wrong + (state.unanswered || 0)) || 1;
  const accuracy = ((correct / total_questions) * 100).toFixed(1);
  const isHighScorer = parseFloat(accuracy) > 80;

  return (
    <div className="animate-fadeIn page-content" style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '40px', paddingBottom: '100px' }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card" 
        style={{ 
          padding: '40px', 
          textAlign: 'center',
          background: isHighScorer ? 'linear-gradient(135deg, rgba(25, 25, 25, 0.9) 0%, rgba(255, 153, 51, 0.05) 100%)' : 'var(--bg-card)',
          borderRadius: '32px',
          borderWidth: isHighScorer ? '2px' : '1px',
          borderColor: isHighScorer ? 'var(--saffron)' : 'var(--border)',
          marginBottom: '40px'
        }}
      >
        <motion.div 
          initial={{ y: -20 }} 
          animate={{ y: 0 }} 
          transition={{ type: 'spring', stiffness: 300 }}
          style={{ fontSize: '3.5rem', marginBottom: '16px' }}
        >
          {isHighScorer ? '🔥' : '🎯'}
        </motion.div>
        
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          {isHighScorer ? 'Outstanding Performance!' : 'Test Successfully Completed!'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '32px' }}>
          {isHighScorer ? "You're among the top tier students! Keep this momentum." : "Every test brings you one step closer to your Railway dream."}
        </p>

        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '32px' }}>
          {isHighScorer && (
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', inset: '-15px', border: '2px dashed var(--saffron)', borderRadius: '50%', opacity: 0.2 }}
            />
          )}
          <div style={{ 
            width: '180px', height: '180px', borderRadius: '50%', 
            background: 'rgba(255,255,255,0.03)', 
            border: `2px solid ${score >= 0 ? 'rgba(255, 153, 51, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: score >= 0 ? '0 0 30px rgba(255,153,51,0.05)' : '0 0 30px rgba(239,68,68,0.05)'
          }}>
            <span style={{ 
              fontSize: score.toString().length > 4 ? '2.5rem' : '3.5rem', 
              fontWeight: 900,
              background: score >= 0 ? 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 100%)' : 'linear-gradient(135deg, #ef4444 0%, #ff9999 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>{score}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total Score</span>
          </div>
        </div>

        <div className="test-result-stats-grid">
          <div className="glass-card" style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.05)', border: 'none' }}>
            <HiCheckCircle size={24} color="#10b981" style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>{correct}</p>
            <p style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>Correct</p>
          </div>
          <div className="glass-card" style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', border: 'none' }}>
            <HiXCircle size={24} color="#ef4444" style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>{wrong}</p>
            <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 700 }}>Wrong</p>
          </div>
          <div className="glass-card" style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', border: 'none' }}>
            <HiLightningBolt size={24} color="#3b82f6" style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>{accuracy}%</p>
            <p style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700 }}>Accuracy</p>
          </div>
        </div>

        <div className="test-result-actions">
          <button 
            className="btn-secondary" 
            style={{ padding: '12px 24px', borderRadius: '12px' }} 
            onClick={() => navigate('/tests')}
          >
            Back to Tests
          </button>
          <button 
            className="btn-primary" 
            style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }} 
            onClick={() => navigate('/analytics')}
          >
            <HiTrophy size={18} />
            View Rank
          </button>
        </div>
      </motion.div>

      {/* Review Section Toggle */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button 
          onClick={() => setShowReview(!showReview)}
          style={{
            background: 'none', border: '1px solid var(--border)', padding: '12px 24px',
            borderRadius: '12px', color: 'var(--text-primary)', fontWeight: 700,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px',
            transition: 'all 0.3s'
          }}
          className="hover-lift"
        >
          {showReview ? <HiChevronUp /> : <HiChevronDown />}
          {showReview ? 'Hide Detailed Review' : 'Show Detailed Review'}
        </button>
      </div>

      {/* Detailed Review Section */}
      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="review-container"
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px', textAlign: 'left' }}>Question Breakdown</h2>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div className="skeleton" style={{ height: '100px', marginBottom: '16px' }} />
                <div className="skeleton" style={{ height: '100px', marginBottom: '16px' }} />
                <div className="skeleton" style={{ height: '100px' }} />
              </div>
            ) : details?.questions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {details.questions.map((q, idx) => (
                  <div key={q.id} className="glass-card" style={{ 
                    padding: '24px', textAlign: 'left', 
                    borderLeft: `4px solid ${q.is_correct ? 'var(--success)' : (q.selected_option ? 'var(--danger)' : 'var(--text-secondary)')}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Question {idx + 1}</span>
                      <span className="badge" style={{ 
                        background: q.is_correct ? 'rgba(16, 185, 129, 0.1)' : (q.selected_option ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)'),
                        color: q.is_correct ? 'var(--success)' : (q.selected_option ? 'var(--danger)' : 'var(--text-secondary)'),
                        fontSize: '0.7rem'
                      }}>
                        {q.is_correct ? 'Correct' : (q.selected_option ? 'Incorrect' : 'Unanswered')}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '20px', lineHeight: 1.5 }}>{q.text}</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                      {['a', 'b', 'c', 'd'].map(opt => {
                        const optKey = `option_${opt}`;
                        const isCorrect = q.correct_option.toLowerCase() === opt;
                        const isSelected = q.selected_option?.toLowerCase() === opt;
                        
                        let borderColor = 'var(--border)';
                        let bgColor = 'rgba(255,255,255,0.02)';
                        if (isCorrect) {
                          borderColor = 'var(--success)';
                          bgColor = 'rgba(16, 185, 129, 0.05)';
                        } else if (isSelected && !isCorrect) {
                          borderColor = 'var(--danger)';
                          bgColor = 'rgba(239, 68, 68, 0.05)';
                        }

                        return (
                          <div key={opt} style={{ 
                            padding: '12px 16px', borderRadius: '10px', border: `1px solid ${borderColor}`,
                            background: bgColor, fontSize: '0.9rem', display: 'flex', gap: '8px',
                            alignItems: 'center'
                          }}>
                            <span style={{ 
                              width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem'
                            }}>{opt.toUpperCase()}</span>
                            <span>{q[optKey]}</span>
                            {isCorrect && <HiCheckCircle size={18} color="var(--success)" style={{ marginLeft: 'auto' }} />}
                            {isSelected && !isCorrect && <HiXCircle size={18} color="var(--danger)" style={{ marginLeft: 'auto' }} />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Section */}
                    {q.explanation && (
                      <div style={{ 
                        marginTop: '16px', padding: '16px', borderRadius: '12px', 
                        background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' 
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#60a5fa' }}>
                          <HiInformationCircle />
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase' }}>Explanation</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No detailed results available for this attempt.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
