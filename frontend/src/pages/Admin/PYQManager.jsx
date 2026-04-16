import { useState, useEffect } from 'react';
import { HiUpload, HiTrash, HiDownload, HiPlus, HiRefresh, HiClipboardList, HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { formatError } from '../../utils/error';


export default function PYQManager() {
  const [pyqs, setPyqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    exam_type: 'ntpc',
    subject: '',
    time_limit: 60,
    marks_per_question: 1.0,
    negative_marking: 0.25,
    is_pyq: true,
    is_active: true
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [genForm, setGenForm] = useState({
    title: '',
    exam_type: 'ntpc',
    count: 10
  });

  const fetchPYQs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tests/mock/?is_pyq=true');
      setPyqs(res.data.results || res.data || []);
    } catch {
      toast.error('Failed to load PYQs');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPYQs();
  }, []);

  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showAddModal, showGenerateModal]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !pdfFile) {
      toast.error('Title and PDF file are required');
      return;
    }

    setSaving(true);
    const data = new FormData();
    Object.keys(form).forEach(key => {
      // Don't send is_active if it's not needed by backend serializer, but ignoring is fine.
      data.append(key, form[key]);
    });
    data.append('pdf_file', pdfFile);

    try {
      await api.post('/tests/mock/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('PYQ added successfully!');
      setShowAddModal(false);
      setForm({ 
        title: '', description: '', exam_type: 'ntpc', subject: '', 
        time_limit: 60, marks_per_question: 1.0, negative_marking: 0.25, 
        is_pyq: true, is_active: true 
      });
      setPdfFile(null);
      fetchPYQs();
    } catch {
      toast.error('Failed to add PYQ');
    }
    setSaving(false);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!genForm.title || !pdfFile) {
      toast.error('Title and PDF file are required');
      return;
    }

    setGenerating(true);
    const data = new FormData();
    data.append('title', genForm.title);
    data.append('exam_type', genForm.exam_type);
    data.append('count', genForm.count);
    data.append('file', pdfFile);

    try {
      const res = await api.post('/pdf/generate-from-pyq/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || 'Questions generated successfully!');
      setShowGenerateModal(false);
      setGenForm({ title: '', exam_type: 'ntpc', count: 10 });
      setPdfFile(null);
      fetchPYQs();
    } catch (err) {
      toast.error(formatError(err));
    }

    setGenerating(false);
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>Delete this PYQ?</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await api.delete(`/tests/mock/${id}/`);
                toast.success('PYQ deleted');
                fetchPYQs();
              } catch {
                toast.error('Failed to delete');
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

  return (
    <div className="animate-fadeIn">
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>📚 PYQ Repository</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Manage Previous Year Question Papers (PDFs & Quizzes)</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchPYQs} className="btn-secondary" style={{ padding: '10px' }} title="Refresh">
            <HiRefresh size={20} />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' }}
          >
            <span>✨</span> Generate PYQ
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <HiPlus size={20} /> Add PYQ
          </motion.button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
        <table className="data-table" style={{ minWidth: '800px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a', backdropFilter: 'blur(10px)' }}>
            <tr>
              <th>Title</th>
              <th>Exam</th>
              <th>Subject</th>
              <th>Questions</th>
              <th>Date Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
            ) : pyqs.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No PYQs found</td></tr>
            ) : (
              pyqs.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {p.title}
                    {p.title.includes('AI Generated') && (
                      <span className="badge" style={{ marginLeft: '8px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', fontSize: '0.7rem' }}>
                        ✨ AI
                      </span>
                    )}
                  </td>
                  <td><span className="badge" style={{ background: 'rgba(99,102,241,0.1)' }}>{p.exam_type.toUpperCase()}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.subject || 'N/A'}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{p.total_questions || 0} Qs</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {p.pdf_file && (
                        <a href={p.pdf_file} target="_blank" rel="noreferrer" title="Download PDF" style={{ color: 'var(--primary-light)' }}>
                          <HiDownload size={18} />
                        </a>
                      )}
                      <button onClick={() => handleDelete(p.id)} style={{ border: 'none', background: 'none', color: 'var(--danger)', cursor: 'pointer' }} title="Delete">
                        <HiTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add PYQ Modal */}
      <AnimatePresence>
        {showAddModal && (
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
                width: '100%', maxWidth: '480px', padding: 0,
                maxHeight: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column'
              }}
            >
              {/* Header - Fixed */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'rgba(255, 153, 51, 0.1)', width: '40px', height: '40px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 153, 51, 0.2)'
                }}>
                  <HiClipboardList size={22} color="var(--saffron)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2px' }}>
                    Add <span className="gradient-text">PYQ Paper</span>
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
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
                <form onSubmit={handleSave}>
                  <div style={{ marginBottom: '16px' }}>
                  <label className="label">Paper Title *</label>
                  <input 
                    className="input-field" 
                    placeholder="e.g. RRB NTPC 2021 Stage 1 Shift 1"
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Description</label>
                  <textarea 
                    className="input-field" 
                    placeholder="Provide details about the PYQ paper..."
                    rows={2}
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label className="label">Exam Type</label>
                    <select className="input-field" value={form.exam_type} onChange={e => setForm({...form, exam_type: e.target.value})}>
                      <option value="ntpc">RRB NTPC</option>
                      <option value="group_d">RRB Group D</option>
                      <option value="je">RRB JE</option>
                      <option value="alp">RRB ALP</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Subject (Optional)</label>
                    <input 
                      className="input-field" 
                      placeholder="e.g. All Subjects"
                      value={form.subject}
                      onChange={e => setForm({...form, subject: e.target.value})}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label className="label">Time (min)</label>
                    <input 
                      type="number"
                      className="input-field" 
                      min="1"
                      value={form.time_limit}
                      onChange={e => setForm({...form, time_limit: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Correct Marks</label>
                    <input 
                      type="number"
                      step="0.1"
                      className="input-field" 
                      value={form.marks_per_question}
                      onChange={e => setForm({...form, marks_per_question: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Negative Marks</label>
                    <input 
                      type="number"
                      step="0.01"
                      className="input-field" 
                      value={form.negative_marking}
                      onChange={e => setForm({...form, negative_marking: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {saving && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(56, 189, 248, 0.3)', borderTopColor: 'var(--primary-light)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                      Parsing PDF & Extracting Questions... This may take a minute.
                    </p>
                  </div>
                )}

                  <div style={{ marginBottom: '24px' }}>
                    <label className="label">PDF Document *</label>
                    <div style={{
                      border: '2px dashed var(--border)', padding: '20px', borderRadius: '12px',
                      textAlign: 'center', cursor: 'pointer', position: 'relative'
                    }}>
                      <HiUpload size={24} color="var(--text-secondary)" style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {pdfFile ? pdfFile.name : 'Click to select PYQ PDF'}
                      </p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={e => setPdfFile(e.target.files[0])}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" style={{ flex: 2 }}>Upload Paper</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Generate PYQ Modal */}
      <AnimatePresence>
        {showGenerateModal && (
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
                width: '100%', maxWidth: '480px', padding: 0,
                maxHeight: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: 'rgba(99, 102, 241, 0.1)', width: '40px', height: '40px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>✨</span>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2px' }}>
                    AI <span className="gradient-text">PYQ Generator</span>
                  </h2>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <HiX size={20} />
                </button>
              </div>

              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
                <form onSubmit={handleGenerate}>
                  <div style={{ marginBottom: '16px' }}>
                    <label className="label">Base Paper Title *</label>
                    <input 
                      className="input-field" 
                      placeholder="e.g. RRB NTPC Shift 1 Analysis"
                      value={genForm.title}
                      onChange={e => setGenForm({...genForm, title: e.target.value})}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label className="label">Exam Type</label>
                      <select className="input-field" value={genForm.exam_type} onChange={e => setGenForm({...genForm, exam_type: e.target.value})}>
                        <option value="ntpc">RRB NTPC</option>
                        <option value="group_d">RRB Group D</option>
                        <option value="je">RRB JE</option>
                        <option value="alp">RRB ALP</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Question Count</label>
                      <input 
                        type="number"
                        className="input-field" 
                        min="5" max="30"
                        value={genForm.count}
                        onChange={e => setGenForm({...genForm, count: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  {generating && (
                    <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(99, 102, 241, 0.3)', borderTopColor: '#818cf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                        Analyzing PDF & Generating New Questions...
                      </p>
                    </div>
                  )}

                  <div style={{ marginBottom: '24px' }}>
                    <label className="label">Source PDF *</label>
                    <div style={{
                      border: '2px dashed var(--border)', padding: '20px', borderRadius: '12px',
                      textAlign: 'center', cursor: 'pointer', position: 'relative'
                    }}>
                      <HiUpload size={24} color="var(--text-secondary)" style={{ marginBottom: '8px' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {pdfFile ? pdfFile.name : 'Select PDF to analyze topics'}
                      </p>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={e => setPdfFile(e.target.files[0])}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setShowGenerateModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" style={{ flex: 2, background: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' }} disabled={generating}>
                      {generating ? 'Generating...' : 'Start Generation'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
