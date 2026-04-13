import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useTestStore from '../../store/testStore';
import { testService } from '../../services/testService';

export default function TestEngine() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTest, questions, answers, currentIndex, timeLeft, markedQuestions,
    setTest, selectAnswer, toggleMark, setCurrentIndex, tick, reset } = useTestStore();

  useEffect(() => {
    if (location.state) setTest(location.state);
    else navigate('/tests');
  }, []);

  useEffect(() => {
    if (!currentTest || timeLeft <= 0) return;
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [currentTest, timeLeft]);

  useEffect(() => {
    if (currentTest && timeLeft === 0) handleSubmit();
  }, [timeLeft]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  };

  const handleSubmit = async () => {
    const answerList = questions.map(q => ({
      question_id: q.id,
      selected_option: answers[q.id] || null,
      time_spent: 0,
      is_marked: markedQuestions.has(q.id),
    }));
    try {
      const timeLimit = currentTest.time_limit || currentTest.test?.time_limit || 60;
      const timeTaken = Math.max(0, (parseInt(timeLimit) * 60) - (timeLeft || 0));
      
      const res = await testService.submitTest(currentTest.attempt_id, {
        answers: answerList, 
        time_taken: Math.floor(timeTaken)
      });
      if (res.data.success) {
        toast.success('Test submitted!');
        reset();
        navigate('/test-result', { state: res.data.data });
      }
    } catch { toast.error('Submit failed'); }
  };

  if (!currentTest || questions.length === 0) return null;
  const q = questions[currentIndex];
  const isUrgent = timeLeft < 60;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '0' }}>
      {/* Top Bar */}
      <div className="test-engine-topbar">
        <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>{currentTest.test_title || currentTest.test?.title || 'Mock Test'}</h2>
        <div style={{
          padding: '8px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '1.1rem',
          background: isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.15)',
          color: isUrgent ? '#f87171' : '#818cf8',
          animation: isUrgent ? 'pulse-glow 1s infinite' : 'none',
        }}>
          ⏱ {formatTime(timeLeft)}
        </div>
        <button className="btn-danger" style={{ padding: '8px 20px' }} onClick={handleSubmit}>Submit Test</button>
      </div>

      <div className="test-engine-body">
        {/* Question Area */}
        <div className="test-engine-question-area">
          <div className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Question {currentIndex + 1} / {questions.length}</span>
              <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{q.subject}</span>
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '24px' }}>{q.text}</p>
            {['A', 'B', 'C', 'D'].map(opt => {
              const key = `option_${opt.toLowerCase()}`;
              const isSelected = answers[q.id] === opt;
              return (
                <button key={opt} onClick={() => selectAnswer(q.id, opt)} style={{
                  display: 'flex', alignItems: 'center', gap: '14px', width: '100%',
                  padding: '14px 18px', marginBottom: '10px', borderRadius: '12px',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                  color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s',
                }}>
                  <span style={{
                    width: '30px', height: '30px', borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                    background: isSelected ? 'var(--primary)' : 'var(--bg-dark)',
                    fontSize: '0.85rem',
                  }}>{opt}</span>
                  {q[key]}
                </button>
              );
            })}
            <div className="test-engine-nav-buttons">
              <button className="btn-secondary" disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)}>← Previous</button>
              <button className="btn-secondary" onClick={() => toggleMark(q.id)} style={{ color: markedQuestions.has(q.id) ? '#fbbf24' : '' }}>
                {markedQuestions.has(q.id) ? '★ Marked' : '☆ Mark'}
              </button>
              <button className="btn-primary" disabled={currentIndex === questions.length - 1} onClick={() => setCurrentIndex(currentIndex + 1)}>Next →</button>
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="test-engine-palette">
          <div className="glass-card" style={{ padding: '16px', position: 'sticky', top: '70px' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '0.85rem' }}>Question Palette</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
              {questions.map((q2, i) => {
                let bg = 'var(--bg-dark)';
                if (answers[q2.id]) bg = 'var(--success)';
                if (markedQuestions.has(q2.id)) bg = 'var(--warning)';
                if (i === currentIndex) bg = 'var(--primary)';
                return (
                  <button key={i} onClick={() => setCurrentIndex(i)} style={{
                    width: '36px', height: '36px', borderRadius: '8px', fontWeight: 700,
                    fontSize: '0.8rem', border: 'none', cursor: 'pointer', color: '#fff', background: bg,
                  }}>{i + 1}</button>
                );
              })}
            </div>
            <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--success)' }} /> Answered
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--warning)' }} /> Marked
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--bg-dark)' }} /> Not Visited
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
