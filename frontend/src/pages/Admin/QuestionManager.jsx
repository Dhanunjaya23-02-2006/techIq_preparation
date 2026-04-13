import { useEffect, useState } from 'react';
import { HiPencil, HiTrash, HiCheck, HiX, HiSearch, HiPlus, HiFilter } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { questionService } from '../../services/questionService';

export default function QuestionManager() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ subject: '', difficulty: '', status: '', source: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A', explanation: '', subject: '', topic: '',
    difficulty: 'medium', exam_type: 'ntpc', status: 'pending_review',
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const params = { page, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await questionService.getAll(params);
      const data = res.data;
      if (Array.isArray(data)) {
        setQuestions(data);
      } else if (data.results) {
        setQuestions(data.results);
        setTotalPages(Math.ceil(data.count / 20));
      } else {
        setQuestions(data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load questions');
    }
    setLoading(false);
  };

  useEffect(() => { loadQuestions(); }, [page, filters]);

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showForm]);

  const handleSave = async () => {
    try {
      if (editingId) {
        await questionService.update(editingId, form);
        toast.success('Question updated');
      } else {
        await questionService.create(form);
        toast.success('Question created');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      loadQuestions();
    } catch (err) {
      const backendError = err.response?.data;
      let errorMsg = 'Save failed';
      if (typeof backendError === 'object' && backendError !== null) {
        errorMsg = backendError.detail || backendError.message || Object.values(backendError).flat()[0] || 'Save failed';
      }
      toast.error(errorMsg);
    }
  };

  const optionStyle = { background: '#1e293b', color: '#f8fafc' };

  const handleEdit = (q) => {
    setForm({
      text: q.text, option_a: q.option_a, option_b: q.option_b,
      option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option,
      explanation: q.explanation, subject: q.subject, topic: q.topic,
      difficulty: q.difficulty, exam_type: q.exam_type || 'ntpc', status: q.status,
    });
    setEditingId(q.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>Delete this question?</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await questionService.delete(id);
                toast.success('Question deleted');
                loadQuestions();
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

  const handleBulkAction = async (action, overrideIds = null) => {
    const idsToProcess = overrideIds || selectedIds;
    if (idsToProcess.length === 0) { toast.error('Select questions first'); return; }
    try {
      await questionService.bulkAction({ question_ids: idsToProcess, action });
      toast.success(`${idsToProcess.length} questions ${action}d`);
      if (!overrideIds) setSelectedIds([]);
      loadQuestions();
    } catch { toast.error('Bulk action failed'); }
  };

  const handleCsvImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await questionService.importCsv(formData);
      toast.success(res.data.message);
      loadQuestions();
    } catch { toast.error('CSV import failed'); }
  };

  const resetForm = () => setForm({
    text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A', explanation: '', subject: '', topic: '',
    difficulty: 'medium', exam_type: 'ntpc', status: 'pending_review',
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const difficultyBadge = (d) => `badge badge-${d}`;
  const statusBadge = (s) => `badge badge-${s.replace('pending_review', 'pending')}`;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>📝 Question Manager</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Manage, review, and approve the core question database</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <motion.label
            whileHover={{ scale: 1.05, translateY: -2 }}
            whileTap={{ scale: 0.95 }}
            className="btn-secondary"
            style={{ cursor: 'pointer', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <HiSearch size={18} /> Import CSV
            <input type="file" accept=".csv" onChange={handleCsvImport} style={{ display: 'none' }} />
          </motion.label>
          <motion.button
            whileHover={{ scale: 1.05, translateY: -2 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary"
            onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <HiPlus size={20} /> Add Question
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'nowrap', alignItems: 'center', overflowX: 'auto' }}>
        <HiFilter size={18} color="var(--text-secondary)" />
        <input className="input-field" style={{ minWidth: '180px' }} placeholder="Search questions..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select className="input-field" style={{ minWidth: '130px' }} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="pending_review">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select className="input-field" style={{ minWidth: '130px' }} value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}>
          <option value="">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
            {questions.some(q => selectedIds.includes(q.id) && q.status !== 'approved') && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="btn-success"
                style={{ padding: '8px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                onClick={() => handleBulkAction('approve')}
              >
                ✅ Approve ({questions.filter(q => selectedIds.includes(q.id) && q.status !== 'approved').length})
              </motion.button>
            )}
            {questions.some(q => selectedIds.includes(q.id) && q.status !== 'rejected') && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="btn-danger"
                style={{ padding: '8px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                onClick={() => handleBulkAction('reject')}
              >
                ❌ Reject ({questions.filter(q => selectedIds.includes(q.id) && q.status !== 'rejected').length})
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="btn-danger"
              style={{ padding: '8px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap', marginLeft: '8px' }}
              onClick={() => {
                toast((t) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>Delete {selectedIds.length} question(s)?</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => {
                          toast.dismiss(t.id);
                          handleBulkAction('delete');
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
              }}
            >
              🗑️ Delete All Selected ({selectedIds.length})
            </motion.button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input type="checkbox" onChange={(e) => {
                  if (e.target.checked) setSelectedIds(questions.map(q => q.id));
                  else setSelectedIds([]);
                }} />
              </th>
              <th>Question</th>
              <th>Subject</th>
              <th>Topic</th>
              <th>Difficulty</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No questions found</td></tr>
            ) : (
              questions.map(q => (
                <tr key={q.id}>
                  <td><input type="checkbox" checked={selectedIds.includes(q.id)} onChange={() => toggleSelect(q.id)} /></td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{q.text}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{q.subject}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{q.topic}</td>
                  <td><span className={difficultyBadge(q.difficulty)}>{q.difficulty}</span></td>
                  <td><span className={statusBadge(q.status)}>{q.status.replace('_', ' ')}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {q.status === 'pending_review' && (
                        <>
                          <button onClick={() => handleBulkAction('approve', [q.id])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }} title="Approve"><HiCheck size={16} /></button>
                          <button onClick={() => handleBulkAction('reject', [q.id])} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Reject"><HiX size={16} /></button>
                        </>
                      )}
                      <button onClick={() => handleEdit(q)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-light)' }} title="Edit"><HiPencil size={16} /></button>
                      <button onClick={() => handleDelete(q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Delete"><HiTrash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none',
                background: page === i + 1 ? 'var(--primary)' : 'var(--bg-card)',
                color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600,
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(10px)', padding: '80px 24px 40px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card"
              style={{
                width: '100%', maxWidth: '800px', padding: 0,
                maxHeight: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header - Fixed */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'rgba(255, 153, 51, 0.1)', width: '40px', height: '40px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 153, 51, 0.2)'
                }}>
                  <HiPencil size={22} color="var(--saffron)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2px' }}>
                    {editingId ? 'Edit' : 'Submit'} <span className="gradient-text">Question</span>
                  </h2>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <HiX size={20} />
                </button>
              </div>

              <div style={{
                padding: '24px', flex: 1, overflowY: 'auto',
                scrollbarWidth: 'none', msOverflowStyle: 'none'
              }} className="hide-scrollbar">
                <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Question Text *</label>
                  <textarea className="input-field" rows={3} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="Enter question..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt}>
                      <label className="label">Option {opt} *</label>
                      <input className="input-field" value={form[`option_${opt.toLowerCase()}`]} onChange={e => setForm({ ...form, [`option_${opt.toLowerCase()}`]: e.target.value })} />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Explanation</label>
                  <textarea className="input-field" rows={2} value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} placeholder="Detailed explanation..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label className="label">Correct Option</label>
                    <select className="input-field" value={form.correct_option} onChange={e => setForm({ ...form, correct_option: e.target.value })}>
                      {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o} style={optionStyle}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Difficulty</label>
                    <select className="input-field" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                      <option value="easy" style={optionStyle}>Easy</option>
                      <option value="medium" style={optionStyle}>Medium</option>
                      <option value="hard" style={optionStyle}>Hard</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label className="label">Exam Type</label>
                    <select className="input-field" value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })}>
                      {['ntpc', 'group_d', 'je', 'alp'].map(ex => <option key={ex} value={ex} style={optionStyle}>{ex.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Subject</label>
                    <input className="input-field" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" />
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label className="label">Topic</label>
                  <input className="input-field" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Algebra" />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="button" onClick={handleSave} className="btn-primary" style={{ flex: 2 }}>
                    {editingId ? 'Update Question' : 'Submit Question'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
