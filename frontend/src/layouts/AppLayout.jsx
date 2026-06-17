import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Home, Search, Users, Calendar, User, 
  Award, Bookmark, Shield, Bell, Briefcase, HelpCircle, LogOut 
} from 'lucide-react';
import NotificationPopover from '../components/NotificationPopover';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../firebase/auth';

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Routes where we hide navigation elements
  const hideNavRoutes = ['/login', '/signup', '/forgot-password', '/onboarding'];
  const isAuthRoute = hideNavRoutes.includes(location.pathname);

  const bottomNavItems = [
    { path: '/', icon: <Home size={24} />, label: 'Home' },
    { path: '/explore', icon: <Search size={24} />, label: 'Explore' },
    { path: '/communities', icon: <Users size={24} />, label: 'Community' },
    { path: '/my-events', icon: <Calendar size={24} />, label: 'Calendar' },
    { path: '/profile', icon: <User size={24} />, label: 'Profile' },
  ];

  const drawerItems = [
    { path: '/team', icon: <Users size={20} />, label: 'Team Workspace' },
    { path: '/certificates', icon: <Award size={20} />, label: 'My Certificates' },
    { path: '/organizer', icon: <Briefcase size={20} />, label: 'Organizer Tools' },
    { path: '/support', icon: <HelpCircle size={20} />, label: 'Help & Support' },
  ];

  const handleLogout = async () => {
    await logout();
    setIsDrawerOpen(false);
    navigate('/login');
  };

  // Auth pages manage their own full-page layout
  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      
      {/* Top Navbar */}
      <header style={{ 
        height: '60px', 
        background: 'white', 
        borderBottom: '1px solid var(--border-light)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <button 
          onClick={() => setIsDrawerOpen(true)}
          style={{ 
            background: '#F3F0FF', 
            border: '1px solid #E9ECEF', 
            cursor: 'pointer', 
            padding: '8px 10px', 
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          title="Menu"
        >
          <Menu size={22} color="#1A1A1A" strokeWidth={2.5} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '20px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <div style={{ width: 32, height: 32, backgroundColor: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '16px' }}>O</div>
          Orin
        </div>

        <NotificationPopover />
      </header>

      {/* Slide-out Drawer */}
      {isDrawerOpen && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.5)', zIndex: 2000 
          }}
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      <div 
        style={{
          position: 'fixed', top: 0, left: isDrawerOpen ? 0 : '-300px', 
          width: '280px', height: '100%', background: 'white', 
          zIndex: 2001, transition: 'left 0.3s ease',
          display: 'flex', flexDirection: 'column',
          boxShadow: isDrawerOpen ? '4px 0 24px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '18px' }}>
              <div style={{ width: 28, height: 28, backgroundColor: 'var(--primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px' }}>O</div>
              Orin
            </div>
            <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={24} color="var(--text-light)" />
            </button>
          </div>
          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#F8F9FA', borderRadius: '12px' }}>
              <div style={{ width: 40, height: 40, background: '#7B61FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', fontWeight: 'bold', flexShrink: 0 }}>
                {(userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userProfile?.displayName || currentUser?.displayName || 'User'}
                </div>
                <div style={{ fontSize: '12px', color: '#6C757D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser?.email}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          {drawerItems.map((item, idx) => (
            <Link 
              key={idx} 
              to={item.path}
              onClick={() => setIsDrawerOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px',
                color: 'var(--text)', textDecoration: 'none', fontWeight: '500'
              }}
            >
              <span style={{ color: 'var(--text-light)' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', padding: '16px 0' }}>
          <div style={{ display: 'flex', gap: '16px', padding: '0 24px', marginBottom: '16px' }}>
            <Link to="/privacy-policy" onClick={() => setIsDrawerOpen(false)} style={{ color: 'var(--text-light)', fontSize: '12px', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms-of-service" onClick={() => setIsDrawerOpen(false)} style={{ color: 'var(--text-light)', fontSize: '12px', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px',
              color: '#DC3545', textDecoration: 'none', fontWeight: '500',
              background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left'
            }}
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '70px', background: 'var(--background)' }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px',
        background: 'white', borderTop: '1px solid var(--border-light)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        zIndex: 1000,
        padding: '0 8px'
      }}>
        {bottomNavItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={idx} 
              to={item.path}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                color: isActive ? 'var(--primary)' : 'var(--muted-light)',
                textDecoration: 'none',
                background: isActive ? '#F3F0FF' : 'transparent',
                padding: '8px 16px',
                borderRadius: '16px',
                minWidth: '64px',
                transition: 'background 0.2s'
              }}
            >
              {item.icon}
              <span style={{ fontSize: '12px', fontWeight: isActive ? 'bold' : '500' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Slide-out Chat Drawer */}
    </div>
  );
}
