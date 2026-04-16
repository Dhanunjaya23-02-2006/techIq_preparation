import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiBell, HiSearch, HiUser, HiClock, HiCheckCircle, HiExternalLink, HiCog, HiLogout, HiChevronDown, HiSparkles, HiMenu, HiQuestionMarkCircle } from 'react-icons/hi';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import notificationService from '../services/notificationService';
import { getMediaUrl } from '../utils/url';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { setChatOpen } = useUIStore();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll for new notifications every 2 minutes
      const interval = setInterval(fetchNotifications, 120000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      const notifs = res.data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="top-navbar" style={{ position: 'relative', zIndex: 1000 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="hamburger-btn" onClick={onMenuClick}>
          <HiMenu size={24} />
        </button>

        <div style={{
          position: 'relative',
          maxWidth: '320px',
          width: '100%',
        }}>
          <HiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} size={18} />
          <input 
            type="text" 
            placeholder="Search tests, questions,... " 
            className="navbar-search-input"
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '10px 16px 10px 40px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
      </div>


      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* Settings Icon */}

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: showDropdown ? '#fff' : 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative'
          }}
          onClick={() => { setShowDropdown(!showDropdown); setShowProfileDropdown(false); }}
          >
            <HiBell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0px',
                right: '0px',
                minWidth: '18px',
                height: '18px',
                background: 'var(--saffron)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #000',
                padding: '0 4px'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showDropdown && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: -1 }} 
                  onClick={() => setShowDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="notification-dropdown"
                  style={{
                    position: 'absolute',
                    top: '55px',
                    right: '0',
                    width: '320px',
                    maxHeight: '450px',
                    background: 'rgba(15, 15, 15, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff' }}>Notifications</h4>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        style={{ background: 'none', border: 'none', color: 'var(--saffron)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div style={{ overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <HiCheckCircle size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                        <p style={{ fontSize: '0.85rem' }}>No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => handleMarkAsRead(notif.id)}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: notif.is_read ? 'transparent' : 'rgba(255, 153, 51, 0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(255, 153, 51, 0.05)'}
                        >
                          {!notif.is_read && (
                            <div style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--saffron)' }} />
                          )}
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px', 
                              background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: notif.is_read ? 'var(--text-tertiary)' : 'var(--saffron)', flexShrink: 0,
                              transition: 'all 0.3s ease'
                            }}>
                              <HiBell size={16} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: notif.is_read ? 500 : 700, color: notif.is_read ? 'var(--text-secondary)' : '#fff' }}>
                                  {notif.title}
                                </p>
                                {!notif.is_read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(notif.id);
                                    }}
                                    style={{
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      border: 'none',
                                      borderRadius: '4px',
                                      padding: '4px',
                                      color: '#10b981',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                                    title="Mark as read"
                                  >
                                    <HiCheckCircle size={14} />
                                  </button>
                                )}
                              </div>
                              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
                                {notif.message}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                                <HiClock size={12} />
                                {new Date(notif.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 auto' }}>
                      View All Activity <HiExternalLink size={14} />
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              paddingLeft: '20px', 
              borderLeft: '1px solid var(--border)',
              cursor: 'pointer'
            }}
            onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowDropdown(false); }}
          >
            <div className="navbar-profile-info" style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                {user?.first_name || user?.username || 'Guest'}
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                {user?.role || 'Student'}
              </p>
            </div>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: user?.avatar ? 'transparent' : 'linear-gradient(135deg, var(--saffron), #e67e22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '1rem',
              boxShadow: '0 4px 10px rgba(255, 153, 51, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              border: user?.avatar ? '2px solid var(--saffron)' : 'none'
            }}>
              {user?.avatar ? (
                <img 
                  src={getMediaUrl(user.avatar)} 
                  alt="Avatar" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.first_name || user?.username) + '&background=random&color=fff';
                  }}
                />
              ) : (
                user?.first_name?.[0] || user?.username?.[0] || <HiUser />
              )}
              <div style={{
                position: 'absolute', bottom: '-2px', right: '-2px',
                width: '12px', height: '12px', borderRadius: '50%',
                background: '#10b981', border: '2px solid var(--bg-dark)',
                zIndex: 10
              }} />
            </div>
            <HiChevronDown size={14} color="var(--text-secondary)" />
          </div>

          <AnimatePresence>
            {showProfileDropdown && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: -1 }} 
                  onClick={() => setShowProfileDropdown(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute',
                    top: '55px',
                    right: '0',
                    width: '240px',
                    background: 'rgba(15, 15, 15, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {user?.email}
                    </p>
                  </div>
                  
                  <div style={{ padding: '8px' }}>
                    <button 
                      onClick={() => { navigate('/profile'); setShowProfileDropdown(false); }}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '8px', 
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'transparent', border: 'none', color: 'var(--text-primary)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <HiUser size={18} color="var(--saffron)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>My Profile</span>
                    </button>

                    <button 
                      onClick={() => { navigate('/settings'); setShowProfileDropdown(false); }}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '8px', 
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'transparent', border: 'none', color: 'var(--text-primary)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <HiCog size={18} color="var(--saffron)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Account Settings</span>
                    </button>

                    <button 
                      onClick={() => { setChatOpen(true); setShowProfileDropdown(false); }}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '8px', 
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'transparent', border: 'none', color: 'var(--text-primary)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <HiQuestionMarkCircle size={18} color="var(--saffron)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Support</span>
                    </button>

                    <div style={{ height: '1px', background: 'var(--border)', margin: '8px 4px' }} />

                    <button 
                      onClick={handleLogout}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: '8px', 
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: 'transparent', border: 'none', color: '#ef4444',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <HiLogout size={18} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Logout</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
