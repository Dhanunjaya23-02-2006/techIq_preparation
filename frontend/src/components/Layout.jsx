import { useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChatBot from './ChatBot';

export default function Layout({ children }) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Define paths where chatbot should NOT appear
  const excludedPaths = [
    '/leaderboard',
    '/test-history',
    '/analytics',
    '/plans',
  ];

  const isAdminPath = location.pathname.startsWith('/admin');
  const isExcluded = excludedPaths.includes(location.pathname) || isAdminPath;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-primary)' }}>
      {/* Sidebar Backdrop */}
      <div 
        className={`sidebar-backdrop ${isSidebarOpen ? 'visible' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="main-content" style={{ flex: 1 }}>
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="page-content animate-fadeIn">
          {children}
        </main>
        {!isExcluded && <ChatBot />}
      </div>
    </div>
  );
}

