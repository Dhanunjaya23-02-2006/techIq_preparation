import { NavLink, useNavigate } from 'react-router-dom';
import {
  HiHome, HiAcademicCap, HiDocumentText, HiChartBar,
  HiUserGroup, HiLogout, HiClipboardList,
  HiBookOpen, HiNewspaper, HiStar, HiCurrencyRupee, HiClock, HiX
} from 'react-icons/hi';
import useAuthStore from '../store/authStore';

const studentLinks = [
  { to: '/dashboard', icon: HiHome, label: 'Dashboard' },
  { to: '/tests', icon: HiAcademicCap, label: 'Mock Tests' },
  { to: '/grand-test', icon: HiStar, label: 'Grand Tests' },
  { to: '/pyq', icon: HiClipboardList, label: 'Previous Year Q' },
  { to: '/study-material', icon: HiBookOpen, label: 'Study Material' },
  { to: '/current-affairs', icon: HiNewspaper, label: 'Current Affairs' },
  { to: '/leaderboard', icon: HiUserGroup, label: 'Leaderboard' },
  { to: '/test-history', icon: HiClock, label: 'Exam History' },
  { to: '/analytics', icon: HiChartBar, label: 'Analytics' },
  { to: '/plans', icon: HiCurrencyRupee, label: 'Enroll Plans' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: HiHome, label: 'Dashboard' },
  { to: '/admin/questions', icon: HiDocumentText, label: 'Questions' },
  { to: '/admin/pdf-upload', icon: HiDocumentText, label: 'PDF Upload' },
  { to: '/admin/tests', icon: HiAcademicCap, label: 'Test Creator' },
  { to: '/admin/pyqs', icon: HiClipboardList, label: 'PYQ Manager' },
  { to: '/admin/study-material', icon: HiBookOpen, label: 'Study Material' },
  { to: '/admin/users', icon: HiUserGroup, label: 'Users' },
  { to: '/tests', icon: HiAcademicCap, label: 'Mock Tests' },
  { to: '/leaderboard', icon: HiUserGroup, label: 'Leaderboard' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout, isProfileLoading } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.is_staff;
  const links = isAdmin ? adminLinks : studentLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Mobile Close Button */}
      <button className="mobile-close-btn" onClick={onClose}>
        <HiX size={24} />
      </button>

      {/* Logo */}
      <div style={{ padding: '0 28px', marginBottom: '40px' }}>
        <h1 className="gradient-text" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          🚂 TrackIQ
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '6px', letterSpacing: '0.05em' }}>
          NEXT-GEN LEARNING
        </p>
      </div>


      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={22} style={{ filter: 'drop-shadow(0 0 4px rgba(255,153,51,0.2))' }} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div 
        onClick={() => navigate('/profile')}
        style={{ 
          padding: '20px 28px', 
          borderTop: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
      >
        {isProfileLoading ? (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', animation: 'pulse 1.5s infinite' }} />
        ) : user?.avatar ? (
          <img src={user.avatar} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {(user?.first_name || user?.username || '?')[0].toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {isProfileLoading ? (
            <>
              <div style={{ width: '60%', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
              <div style={{ width: '40%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            </>
          ) : (
            <>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: 'var(--text-primary)' }}>
                {user?.first_name || user?.username || 'User'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {user?.role || 'Student'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Logout Action */}
      <div style={{ padding: '0 28px 20px', borderTop: 'none' }}>
        <button onClick={handleLogout} className="sidebar-link" style={{ 
          padding: '12px 0', 
          border: 'none', 
          background: 'none', 
          width: '100%', 
          cursor: 'pointer',
          color: 'var(--danger)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ef4444';
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
        }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--danger)';
            e.currentTarget.style.background = 'none';
          }}
        >
          <HiLogout size={22} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
