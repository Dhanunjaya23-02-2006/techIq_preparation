import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { HiPlus, HiTrash, HiSearch, HiCheck, HiArrowLeft, HiDownload } from 'react-icons/hi';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { testService } from '../../services/testService';
import { questionService } from '../../services/questionService';

export default function TestCreator() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '', description: '', exam_type: 'ntpc', subject: '',
    time_limit: 60, negative_marking: 0.25, marks_per_question: 1.0, is_grand_test: false,
    is_pyq: false, is_free: false, is_active: true
  });
  const [pdfFile, setPdfFile] = useState(null);
  
  const [questions, setQuestions] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [filters, setFilters] = useState({ subject: '', topic: '', difficulty: '', search: '', status: 'approved' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [filters]);

  useEffect(() => {
    if (editId) {
      loadTestData();
    }
  }, [editId]);

  const loadTestData = async () => {
    try {
      const res = await testService.getMockTest(editId);
      const data = res.data;
      setForm({
        title: data.title,
        description: data.description || '',
        exam_type: data.exam_type,
        subject: data.subject || '',
        time_limit: data.time_limit || 60,
        negative_marking: isNaN(parseFloat(data.negative_marking)) ? 0.25 : parseFloat(data.negative_marking),
        marks_per_question: isNaN(parseFloat(data.marks_per_question)) ? 1.0 : parseFloat(data.marks_per_question),
        is_grand_test: data.is_grand_test,
        is_pyq: data.is_pyq || false,
        is_free: data.is_free || false,
        is_active: data.is_active ?? true
      });
      if (data.questions) {
        setSelectedIds(new Set(data.questions.map(q => typeof q === 'object' ? q.id : q)));
      }
    } catch {
      toast.error('Failed to load test data');
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      params.page_size = 100;
      const res = await questionService.getAll(params);
      const data = res.data;
      setQuestions(Array.isArray(data) ? data : (data.results || data.data || []));
    } catch {
      toast.error('Failed to load questions');
    }
    setLoading(false);
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    const newSet = new Set(selectedIds);
    questions.forEach(q => newSet.add(q.id));
    setSelectedIds(newSet);
  };

  const deselectAll = () => {
    const newSet = new Set(selectedIds);
    questions.forEach(q => newSet.delete(q.id));
    setSelectedIds(newSet);
  };

  const handleDeleteQuestion = async (id, e) => {
    e.stopPropagation();
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>Delete this question?</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await questionService.delete(id);
                toast.success('Question deleted successfully');
                setQuestions(questions.filter(q => q.id !== id));
                if (selectedIds.has(id)) {
                  const newSet = new Set(selectedIds);
                  newSet.delete(id);
                  setSelectedIds(newSet);
                }
              } catch {
                toast.error('Failed to delete question');
              }
            }}
            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
          >Confirm</button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}
          >Cancel</button>
        </div>
      </div>
    ), { duration: 6000, style: { background: '#1e293b', border: '1px solid rgba(255,153,51,0.3)', padding: '16px' } });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    if (selectedIds.size === 0) { toast.error('Please select at least one question'); return; }
    
    setSaving(true);
    try {
      const data = new FormData();
      Object.keys(form).forEach(key => {
        // Ensure numbers are sent correctly, replace empty strings with defaults or 0
        let val = form[key];
        if (key === 'time_limit' && (val === '' || isNaN(val))) val = 60;
        if (key === 'marks_per_question' && (val === '' || isNaN(val))) val = 1.0;
        if (key === 'negative_marking' && (val === '' || isNaN(val))) val = 0.25;
        data.append(key, val);
      });
      Array.from(selectedIds).forEach(id => data.append('question_ids', id));
      if (pdfFile) data.append('pdf_file', pdfFile);

      if (editId) {
        await api.patch(`/tests/mock/${editId}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Test updated successfully!');
      } else {
        await api.post('/tests/mock/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Test created successfully!');
      }
      
      if (editId) {
        navigate('/tests');
      } else {
        setForm({
          title: '', description: '', exam_type: 'ntpc', subject: '',
          time_limit: 60, negative_marking: 0.25, marks_per_question: 1.0, is_grand_test: false,
          is_pyq: false, is_free: false, is_active: true
        });
        setPdfFile(null);
        setSelectedIds(new Set());
      }
    } catch (err) {
      toast.error(editId ? 'Failed to update test' : 'Failed to create test');
    }
    setSaving(false);
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {editId ? '✏️ Edit Mock Test' : '🛠 Test Creator'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {editId ? `Editing test ID: ${editId}` : 'Create Mock Tests and Grand Tests from Question Models'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {editId && (
            <motion.button 
              whileHover={{ scale: 1.05, translateY: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/tests')} 
              className="btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <HiArrowLeft size={18} /> Back to Tests
            </motion.button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        
        {/* Left Col: Test Details Form */}
        <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)' }}>Test Details</h3>
          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Title *</label>
              <input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. NTPC Full Mock 1" required />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Description</label>
              <textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Optional test description" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Exam Type</label>
                <select className="input-field" value={form.exam_type} onChange={e => setForm({...form, exam_type: e.target.value})}>
                  <option value="ntpc">NTPC</option>
                  <option value="group_d">Group D</option>
                  <option value="je">JE</option>
                  <option value="alp">ALP</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Subject (Optional)</label>
                <input className="input-field" placeholder="e.g. Mathematics" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Mins</label>
                <input className="input-field" type="number" min="1" value={isNaN(form.time_limit) ? '' : form.time_limit} onChange={e => {
                  const val = e.target.value;
                  setForm({...form, time_limit: val === '' ? '' : parseInt(val)});
                }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Correct</label>
                <input className="input-field" type="number" step="0.5" value={isNaN(form.marks_per_question) ? '' : form.marks_per_question} onChange={e => {
                  const val = e.target.value;
                  setForm({...form, marks_per_question: val === '' ? '' : parseFloat(val)});
                }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Negative</label>
                <input className="input-field" type="number" step="0.05" value={isNaN(form.negative_marking) ? '' : form.negative_marking} onChange={e => {
                  const val = e.target.value;
                  setForm({...form, negative_marking: val === '' ? '' : parseFloat(val)});
                }} />
              </div>
            </div>

            <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="grand_test" checked={form.is_grand_test} onChange={e => setForm({...form, is_grand_test: e.target.checked})} />
                <label htmlFor="grand_test" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>Mark as Grand Test</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="is_pyq" checked={form.is_pyq} onChange={e => setForm({...form, is_pyq: e.target.checked})} />
                <label htmlFor="is_pyq" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>Mark as Previous Year (PYQ)</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="is_free" checked={form.is_free} onChange={e => setForm({...form, is_free: e.target.checked})} />
                <label htmlFor="is_free" style={{ fontSize: '0.9rem', color: 'var(--saffron)', fontWeight: 700, cursor: 'pointer' }}>✨ Mark as FREE Test</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} />
                <label htmlFor="is_active" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>Is Active (Visible to students)</label>
              </div>
            </div>

            {form.is_pyq && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>PYQ PDF File</label>
                <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files[0])} className="input-field" style={{ padding: '8px' }} />
              </div>
            )}

            <div style={{ padding: '16px', background: 'rgba(99,102,241,0.1)', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Questions Selected</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-light)' }}>{selectedIds.size}</div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%', fontWeight: 700 }} 
              disabled={saving}
            >
              {saving ? 'Saving...' : (editId ? 'Update Mock Test' : 'Create Mock Test')}
            </motion.button>
          </form>
        </div>

        {/* Right Col: Question Selector */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Select Questions Database</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                className="btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem' }} 
                onClick={selectAll}
              >
                Select All
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                className="btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem' }} 
                onClick={deselectAll}
              >
                Deselect
              </motion.button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <HiSearch size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input className="input-field" style={{ paddingLeft: '32px', fontSize: '0.85rem' }} placeholder="Search..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
            </div>
            <input className="input-field" style={{ fontSize: '0.85rem' }} placeholder="Subject" value={filters.subject} onChange={e => setFilters({...filters, subject: e.target.value})} />
            <select className="input-field" style={{ fontSize: '0.85rem' }} value={filters.difficulty} onChange={e => setFilters({...filters, difficulty: e.target.value})}>
              <option value="">All Diff</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading models...</div>
            ) : questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No approved questions found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {questions.map(q => {
                  const selected = selectedIds.has(q.id);
                  return (
                    <motion.div 
                      key={q.id} 
                      onClick={() => toggleSelect(q.id)} 
                      whileHover={{ scale: 1.01, x: 5 }}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px',
                        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                        background: selected ? 'rgba(99,102,241,0.15)' : 'var(--bg-dark)',
                        border: selected ? '1px solid var(--primary)' : '1px solid transparent'
                      }}
                    >
                      <div style={{
                        width: '20px', height: '20px', borderRadius: '4px', border: '2px solid',
                        borderColor: selected ? 'var(--primary)' : 'var(--border)',
                        background: selected ? 'var(--primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px'
                      }}>
                        {selected && <HiCheck size={14} color="#fff" />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', marginBottom: '6px', color: 'var(--text-primary)' }}>{q.text}</div>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', alignItems: 'center' }}>
                          <span className={`badge badge-${q.difficulty}`}>{q.difficulty}</span>
                          <span className="badge" style={{ background: 'rgba(51,65,85,0.4)' }}>{q.subject}</span>
                          <span className="badge" style={{ background: 'rgba(51,65,85,0.4)' }}>{q.topic}</span>
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto' }}>
                        <button
                          onClick={(e) => handleDeleteQuestion(q.id, e)}
                          className="btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          title="Delete Question"
                        >
                          <HiTrash size={14} /> Delete
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
