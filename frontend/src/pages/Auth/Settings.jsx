import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiUser, HiPhone, HiMail, HiAcademicCap, HiTranslate, HiCamera, HiSave, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getMediaUrl } from '../../utils/url';
import useAuthStore from '../../store/authStore';

export default function Settings() {
  const { user, updateProfile, isLoading } = useAuthStore();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    target_exam: user?.target_exam || '',
    preferred_language: user?.preferred_language || 'en',
    old_password: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ? getMediaUrl(user.avatar) : null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedFile, setCapturedFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      toast.error("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        setAvatarPreview(URL.createObjectURL(file));
        setCapturedFile(file);
        stopCamera();
      }, 'image/jpeg');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password) {
      if (!formData.old_password) {
        toast.error("Current password is required to set a new password");
        return;
      }
      if (formData.password !== formData.confirm_password) {
        toast.error("New passwords do not match");
        return;
      }
    }
    
    const data = new FormData();
    const updateData = { ...formData };
    delete updateData.confirm_password;
    
    // Only send password fields if a new password is being set
    if (!updateData.password) {
      delete updateData.password;
      delete updateData.old_password;
    }

    Object.keys(updateData).forEach(key => data.append(key, updateData[key]));
    
    if (fileInputRef.current.files[0]) {
      data.append('avatar', fileInputRef.current.files[0]);
    } else if (capturedFile) {
      data.append('avatar', capturedFile);
    }

    const res = await updateProfile(data);
    if (res.success) {
      toast.success('Profile updated successfully!');
      setFormData(prev => ({ ...prev, old_password: '', password: '', confirm_password: '' }));
    } else {
      toast.error(res.message);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      className="animate-fadeIn"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>⚙️ Account Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Update your personal information and security settings</p>
      </div>

      <div className="profile-grid" style={{ alignItems: 'stretch' }}>
        {/* Avatar Card */}
        <motion.div 
          variants={itemVariants} 
          className="glass-card" 
          style={{ 
            padding: '24px', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 16px' }}>
            <div 
              style={{ 
                width: '100%', height: '100%', borderRadius: '50%', 
                overflow: 'hidden', border: '4px solid var(--border)',
                background: 'var(--bg-card)'
              }}
            >
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.first_name || user?.username) + '&background=random&color=fff';
                  }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: 'white', fontSize: '2.5rem', fontWeight: 800 }}>
                  {(user?.first_name || user?.username || '?')[0].toUpperCase()}
                </div>
              )}
            </div>
            <motion.button 
              type="button"
              onClick={() => {
                toast.custom((t) => (
                  <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} glass-card`} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '300px' }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Update Profile Picture</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Choose a source for your new photo:</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          toast.dismiss(t.id);
                          fileInputRef.current.click();
                        }}
                        className="btn-primary"
                        style={{ flex: 1, padding: '10px' }}
                      >
                        Upload File
                      </button>
                      <button 
                        onClick={() => {
                          toast.dismiss(t.id);
                          startCamera();
                        }}
                        className="btn-secondary"
                        style={{ flex: 1, padding: '10px' }}
                      >
                        Open Camera
                      </button>
                    </div>
                    <button 
                      onClick={() => toast.dismiss(t.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px', cursor: 'pointer' }}
                    >
                      Close
                    </button>
                  </div>
                ), { duration: 5000 });
              }}
              style={{ 
                position: 'absolute', bottom: '0px', right: '0px', 
                width: '36px', height: '36px', borderRadius: '50%', 
                background: 'var(--saffron)', color: 'white', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,153,51,0.3)'
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <HiCamera size={18} />
            </motion.button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2px', color: 'var(--text-primary)' }}>{user?.username}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'capitalize', marginBottom: '16px' }}>{user?.role}</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A' },
              { label: 'Active Plan', value: user?.current_plan || 'Starter Plan' }
            ].map((item, idx) => (
              <div key={idx} style={{ 
                padding: '10px 14px', 
                borderRadius: '10px', 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border)', 
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Details Form */}
        <motion.div variants={itemVariants} className="glass-card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'white', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>👤 Personal Details</h3>
              <div className="settings-form-grid-2" style={{ marginBottom: '20px' }}>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>First Name</label>
                  <div style={{ position: 'relative' }}>
                    <HiUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      name="first_name" 
                      value={formData.first_name} 
                      onChange={handleChange}
                      className="glass-input" 
                      style={{ paddingLeft: '40px', width: '100%' }}
                      placeholder="Enter first name"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Last Name</label>
                  <div style={{ position: 'relative' }}>
                    <HiUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      name="last_name" 
                      value={formData.last_name} 
                      onChange={handleChange}
                      className="glass-input" 
                      style={{ paddingLeft: '40px', width: '100%' }}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email (Cannot be changed)</label>
                <div style={{ position: 'relative' }}>
                  <HiMail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', zIndex: 10 }} />
                  <input 
                    value={user?.email || ''} 
                    disabled 
                    className="glass-input" 
                    style={{ paddingLeft: '40px', width: '100%', cursor: 'not-allowed', color: 'rgba(255,255,255,0.6)', opacity: 0.8 }}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <HiPhone style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange}
                    className="glass-input" 
                    style={{ paddingLeft: '40px', width: '100%' }}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="settings-form-grid-2">
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Exam</label>
                  <div style={{ position: 'relative' }}>
                    <HiAcademicCap style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <select 
                      name="target_exam" 
                      value={formData.target_exam} 
                      onChange={handleChange}
                      className="glass-input" 
                      style={{ 
                        paddingLeft: '40px', 
                        width: '100%', 
                        color: 'var(--text-primary)',
                        background: 'rgba(255, 255, 255, 0.03)'
                      }}
                    >
                      <option value="" disabled>Select Exam</option>
                      <option value="ntpc">RRB NTPC</option>
                      <option value="group_d">RRB Group D</option>
                      <option value="je">RRB JE</option>
                      <option value="alp">RRB ALP</option>
                    </select>
                  </div>
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preferred Language</label>
                  <div style={{ position: 'relative' }}>
                    <HiTranslate style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <select 
                      name="preferred_language" 
                      value={formData.preferred_language} 
                      onChange={handleChange}
                      className="glass-input" 
                      style={{ 
                        paddingLeft: '40px', 
                        width: '100%', 
                        color: 'var(--text-primary)',
                        background: 'rgba(255, 255, 255, 0.03)'
                      }}
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="te">Telugu</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'white', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>🔐 Security</h3>
              
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <HiLockClosed style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="old_password" 
                    value={formData.old_password} 
                    onChange={handleChange}
                    className="glass-input" 
                    style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%' }}
                    placeholder="Required to change password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="settings-form-grid-2">
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <HiLockClosed style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange}
                      className="glass-input" 
                      style={{ paddingLeft: '40px', width: '100%' }}
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <HiLockClosed style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      type={showPassword ? "text" : "password"}
                      name="confirm_password" 
                      value={formData.confirm_password} 
                      onChange={handleChange}
                      className="glass-input" 
                      style={{ paddingLeft: '40px', width: '100%' }}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
            >
              {isLoading ? (
                'Saving...'
              ) : (
                <>
                  <HiSave size={20} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
      {/* Camera Modal */}
      {isCameraOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '20px'
        }}>
          <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', maxWidth: '90%' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '500px', borderRadius: '15px' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
              <button onClick={capturePhoto} className="btn-primary" style={{ padding: '10px 20px' }}>📸 Capture</button>
              <button onClick={stopCamera} className="btn-secondary" style={{ padding: '10px 20px' }}>Cancel</button>
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}
    </motion.div>
  );
}
