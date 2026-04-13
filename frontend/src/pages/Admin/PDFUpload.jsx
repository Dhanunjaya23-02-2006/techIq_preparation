import { useState, useEffect } from 'react';
import { HiUpload, HiDocumentText, HiRefresh } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { pdfService } from '../../services/testService';

export default function PDFUpload() {
  const [pdfs, setPdfs] = useState([]);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    exam_type: 'ntpc', subject: 'Mathematics', time_limit: 60, negative_marking: 0.25, marks_per_question: 1.0, is_grand_test: false, is_pyq: true
  });
  const [genForm, setGenForm] = useState({
    exam_type: 'ntpc', subject: 'Mathematics', topic: '', difficulty: 'medium', count: 10, language: 'en'
  });

  const loadPdfs = async () => {
    try {
      const res = await pdfService.getList();
      setPdfs(res.data.results || res.data || []);
    } catch {}
  };

  useEffect(() => { loadPdfs(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) { toast.error('Please provide a title and PDF file'); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('exam_type', uploadForm.exam_type);
    formData.append('subject', uploadForm.subject);
    formData.append('time_limit', uploadForm.time_limit);
    formData.append('negative_marking', uploadForm.negative_marking);
    formData.append('marks_per_question', uploadForm.marks_per_question);
    formData.append('is_grand_test', uploadForm.is_grand_test);
    formData.append('is_pyq', uploadForm.is_pyq);
    try {
      await pdfService.upload(formData);
      toast.success('PDF uploaded! Question generation started in background.');
      setTitle('');
      setFile(null);
      loadPdfs();
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!genForm.topic) { toast.error('Please enter a topic'); return; }
    try {
      await pdfService.generateStandalone(genForm);
      toast.success('AI question generation started! Check back shortly.');
    } catch { toast.error('Generation failed'); }
  };
  const statusIcon = (s) => {
    if (s === 'done') return '✅';
    if (s === 'processing') return '⏳';
    return '❌';
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to delete ALL upload history and files?')) return;
    try {
      await pdfService.clearHistory();
      toast.success('History cleared');
      loadPdfs();
    } catch { toast.error('Failed to clear history'); }
  };

  return (
    <div className="animate-fadeIn">
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)' }}>🤖 AI Question Generator</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        {/* PDF Upload */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiDocumentText size={20} color="var(--primary-light)" /> <span style={{ color: 'var(--text-primary)' }}>PDF → Questions</span>
          </h3>
          <form onSubmit={handleUpload}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>PDF Title</label>
              <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. General Science Chapter 5" />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Exam</label>
                <select className="input-field" value={uploadForm.exam_type} onChange={e => setUploadForm({ ...uploadForm, exam_type: e.target.value })}>
                  <option value="ntpc">NTPC</option><option value="group_d">Group D</option>
                  <option value="je">JE</option><option value="alp">ALP</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Subject</label>
                <select className="input-field" value={uploadForm.subject} onChange={e => setUploadForm({ ...uploadForm, subject: e.target.value })}>
                  <option>Mathematics</option><option>Reasoning</option>
                  <option>General Awareness</option><option>General Science</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Time Limit (min)</label>
                <input type="number" className="input-field" value={uploadForm.time_limit} onChange={e => setUploadForm({ ...uploadForm, time_limit: parseInt(e.target.value) })} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Negative Marks</label>
                <input type="number" step="0.01" className="input-field" value={uploadForm.negative_marking} onChange={e => setUploadForm({ ...uploadForm, negative_marking: parseFloat(e.target.value) })} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={uploadForm.is_grand_test} onChange={e => setUploadForm({ ...uploadForm, is_grand_test: e.target.checked })} />
                Grand Test
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={uploadForm.is_pyq} onChange={e => setUploadForm({ ...uploadForm, is_pyq: e.target.checked })} />
                PYQ
              </label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '20px', border: '2px dashed var(--border)', borderRadius: '12px',
                cursor: 'pointer', transition: 'all 0.3s', color: 'var(--text-secondary)',
              }}>
                <HiUpload size={20} />
                {file ? file.name : 'Click to select PDF file'}
                <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
              </label>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload & Generate'}
            </button>
          </form>
        </div>

        {/* Standalone Generation */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-primary)' }}>✨ Standalone AI Generation</span>
          </h3>
          <form onSubmit={handleGenerate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Exam</label>
                <select className="input-field" value={genForm.exam_type} onChange={e => setGenForm({ ...genForm, exam_type: e.target.value })}>
                  <option value="ntpc">NTPC</option><option value="group_d">Group D</option>
                  <option value="je">JE</option><option value="alp">ALP</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Subject</label>
                <select className="input-field" value={genForm.subject} onChange={e => setGenForm({ ...genForm, subject: e.target.value })}>
                  <option>Mathematics</option><option>Reasoning</option>
                  <option>General Awareness</option><option>General Science</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Topic *</label>
              <input className="input-field" value={genForm.topic} onChange={e => setGenForm({ ...genForm, topic: e.target.value })} placeholder="e.g. Percentage, Blood Relations" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Difficulty</label>
                <select className="input-field" value={genForm.difficulty} onChange={e => setGenForm({ ...genForm, difficulty: e.target.value })}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Count</label>
                <select className="input-field" value={genForm.count} onChange={e => setGenForm({ ...genForm, count: parseInt(e.target.value) })}>
                  <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>Generate Questions</button>
          </form>
        </div>
      </div>

      {/* PDF Upload History */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📋 Upload History</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleClearHistory} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', borderColor: '#ef4444', color: '#ef4444' }}>
              🗑️ Clear History
            </button>
            <button onClick={loadPdfs} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              <HiRefresh size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Refresh
            </button>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Title</th><th>Status</th><th>Questions</th><th>Uploaded</th></tr>
          </thead>
          <tbody>
            {pdfs.filter(p => p.status !== 'failed').length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No PDFs uploaded yet</td></tr>
            ) : (
              pdfs
                .filter(p => p.status !== 'failed')
                .map(p => (
                <tr key={p.id}>
                  <td style={{ color: 'var(--text-primary)' }}>{p.title}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{statusIcon(p.status)} {p.status}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{p.questions_generated}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
