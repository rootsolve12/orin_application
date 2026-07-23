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
    { path: '/organizer', icon: <Briefcase size={20} />, label: 'Organizer Tools' },
    { path: '/certificates', icon: <Award size={20} />, label: 'My Certificates' },
    { path: '/my-registrations', icon: <Bookmark size={20} />, label: 'My Registrations' },
    { path: '/saved-events', icon: <Bookmark size={20} />, label: 'Saved Events' },
    { path: '/support', icon: <HelpCircle size={20} />, label: 'Help & Support' },
    { path: '/settings', icon: <Shield size={20} />, label: 'Settings' },
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
        background: 'rgba(255, 255, 255, 0.75)', 
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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
            background: 'rgba(127, 86, 217, 0.08)', 
            border: '1px solid rgba(127, 86, 217, 0.15)', 
            cursor: 'pointer', 
            padding: '8px 10px', 
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(127, 86, 217, 0.15)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(127, 86, 217, 0.08)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Menu"
        >
          <Menu size={22} color="var(--primary)" strokeWidth={2.5} />
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '20px', color: 'var(--text-light)', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <img src="/master_icon.png" alt="Orin Logo" style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'contain' }} />
          Orin
        </div>

        <NotificationPopover />
      </header>

      {/* Slide-out Drawer Backdrop */}
      {isDrawerOpen && (
        <div 
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.5)', zIndex: 2000 
          }}
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      <div className={`app-drawer ${isDrawerOpen ? 'open' : 'closed'}`}>
        {/* Mobile Bottom Sheet Handle */}
        <div className="bottom-sheet-handle mobile-only" style={{ display: 'none' }} className="mobile-only bottom-sheet-handle" />
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '18px' }}>
              <img src="/master_icon.png" alt="Orin Logo" style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'contain' }} />
              Orin
            </div>
            <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                color: 'var(--text)', textDecoration: 'none', fontWeight: '500', minHeight: '48px'
              }}
            >
              <span style={{ color: 'var(--text-light)' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', padding: '16px 0' }}>
          <div style={{ display: 'flex', gap: '16px', padding: '0 24px', marginBottom: '16px' }}>
            <Link to="/privacy-policy" onClick={() => setIsDrawerOpen(false)} style={{ color: 'var(--text-light)', fontSize: '12px', textDecoration: 'none', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>Privacy Policy</Link>
            <Link to="/terms-of-service" onClick={() => setIsDrawerOpen(false)} style={{ color: 'var(--text-light)', fontSize: '12px', textDecoration: 'none', minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>Terms of Service</Link>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px',
              color: '#DC3545', textDecoration: 'none', fontWeight: '500',
              background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', minHeight: '48px'
            }}
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: '80px', background: 'var(--background)', position: 'relative' }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px',
        background: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-light)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        zIndex: 1000,
        padding: '0 8px',
        boxShadow: '0 -4px 20px rgba(127, 86, 217, 0.03)'
      }}>
        {bottomNavItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={idx} 
              to={item.path}
              className={isActive ? 'bottom-nav-link active touch-target' : 'bottom-nav-link touch-target'}
            >
              {item.icon}
              <span style={{ fontSize: '11px', fontWeight: isActive ? '800' : '600', letterSpacing: '-0.2px' }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
