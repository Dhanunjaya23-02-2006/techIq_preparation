import { useState, useEffect } from 'react';
import { HiPlus, HiTrash, HiPencil, HiDownload, HiSearch, HiX, HiBookOpen, HiRefresh } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { contentService } from '../../services/testService';

export default function StudyMaterialManager() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    content: '',
    content_type: 'pdf',
    subject: 'Mathematics',
    topic: '',
    is_premium: false,
    file: null
  });

  const subjects = ['Mathematics', 'Reasoning', 'General Science', 'General Awareness'];
  const contentTypes = [
    { value: 'pdf', label: 'PDF Document' },
    { value: 'notes', label: 'Study Notes' },
    { value: 'formula', label: 'Formula Sheet' }
  ];

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await contentService.getMaterials();
      setMaterials(res.data.results || res.data || []);
    } catch (error) {
      toast.error('Failed to load study materials');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [showForm]);

  const handleFileChange = (e) => {
    setForm({ ...form, file: e.target.files[0] });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || (!editingId && !form.file && form.content_type === 'pdf')) {
      toast.error('Title and File are required');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (key === 'file' && !form[key]) return;
      formData.append(key, form[key]);
    });

    try {
      if (editingId) {
        await contentService.updateMaterial(editingId, formData);
        toast.success('Material updated');
      } else {
        await contentService.createMaterial(formData);
        toast.success('Material created');
      }
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchMaterials();
    } catch (error) {
      toast.error('Failed to save material');
    }
    setSaving(false);
  };

  const handleEdit = (m) => {
    setForm({
      title: m.title,
      content: m.content || '',
      content_type: m.content_type,
      subject: m.subject,
      topic: m.topic || '',
      is_premium: m.is_premium,
      file: null
    });
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleDelete = (id, title) => {
    toast((t) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>Delete "{title}"?</p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await contentService.deleteMaterial(id);
                toast.success('Material deleted');
                fetchMaterials();
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

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      content_type: 'pdf',
      subject: 'Mathematics',
      topic: '',
      is_premium: false,
      file: null
    });
  };

  const filteredMaterials = (materials || []).filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>📚 Study Repository</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Upload and organize notes, PDFs, and formula sheets</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={fetchMaterials} className="btn-secondary" style={{ padding: '10px' }} title="Refresh">
            <HiRefresh size={20} />
          </button>
          <motion.button 
            whileHover={{ scale: 1.05, translateY: -2 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary" 
            onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
          >
            <HiPlus size={20} /> Add Material
          </motion.button>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <HiSearch size={18} color="var(--text-secondary)" />
        <input 
          className="input-field" 
          placeholder="Search materials by title or subject..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
        <table className="data-table" style={{ minWidth: '800px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a', backdropFilter: 'blur(10px)' }}>
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>Type</th>
              <th>Access</th>
              <th>Created At</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
            ) : filteredMaterials.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No materials found</td></tr>
            ) : (
              filteredMaterials.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.title}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{m.subject}</td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                      {m.content_type.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      background: m.is_premium ? 'rgba(255,153,51,0.1)' : 'rgba(16,185,129,0.1)', 
                      color: m.is_premium ? 'var(--saffron)' : '#10b981' 
                    }}>
                      {m.is_premium ? 'PREMIUM' : 'FREE'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      {m.file && (
                        <a href={m.file} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)' }} title="View File">
                          <HiDownload size={18} />
                        </a>
                      )}
                      <button onClick={() => handleEdit(m)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-light)' }}>
                        <HiPencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(m.id, m.title)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
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

      {/* Form Modal */}
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
                width: '100%', maxWidth: '480px', padding: 0,
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
                  <HiBookOpen size={22} color="var(--saffron)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '2px' }}>
                    {editingId ? 'Edit' : 'Add'} <span className="gradient-text">Study Material</span>
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
                <form onSubmit={handleSave}>
                  <div style={{ marginBottom: '16px' }}>
                    <label className="label">Title *</label>
                    <input 
                      className="input-field" 
                      value={form.title} 
                      onChange={e => setForm({...form, title: e.target.value})} 
                      placeholder="e.g. Master Formula Sheet"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label className="label">Subject</label>
                      <select className="input-field" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                        {subjects.map(s => <option key={s} value={s} style={{background: '#1e293b'}}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Content Type</label>
                      <select className="input-field" value={form.content_type} onChange={e => setForm({...form, content_type: e.target.value})}>
                        {contentTypes.map(t => <option key={t.value} value={t.value} style={{background: '#1e293b'}}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label className="label">Topic Tag (Optional)</label>
                    <input 
                      className="input-field" 
                      value={form.topic} 
                      onChange={e => setForm({...form, topic: e.target.value})} 
                      placeholder="e.g. Percentage, Profit & Loss"
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label className="label">Description (Optional)</label>
                    <textarea 
                      className="input-field" 
                      rows={2}
                      value={form.content} 
                      onChange={e => setForm({...form, content: e.target.value})} 
                      placeholder="Brief overview of the material..."
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label className="label">{editingId ? 'Update File (Optional)' : 'Upload File *'}</label>
                    <div style={{ 
                      border: '2px dashed var(--border)', padding: '20px', borderRadius: '12px', 
                      textAlign: 'center', cursor: 'pointer', position: 'relative' 
                    }}>
                      <input type="file" onChange={handleFileChange} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer' }} />
                      {form.file ? (
                        <p style={{ color: 'var(--saffron)', fontWeight: 600 }}>📎 {form.file.name}</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <HiPlus size={24} color="var(--text-secondary)" />
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Click or drag to upload</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                    <input 
                      type="checkbox" 
                      id="premium-check" 
                      checked={form.is_premium} 
                      onChange={e => setForm({...form, is_premium: e.target.checked})} 
                    />
                    <label htmlFor="premium-check" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                      Mark as Premium Content
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: 1 }}>
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ flex: 2 }}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : (editingId ? 'Update Material' : 'Create Material')}
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

