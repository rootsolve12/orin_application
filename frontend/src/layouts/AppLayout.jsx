import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Search, Users, Calendar, User, 
  Award, Bookmark, Shield, Bell, Briefcase, HelpCircle, LogOut, BookOpen, Target, Menu, X, Plus,
  Moon, Sun, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../firebase/auth';
import { getAllEvents, getAllUsers } from '../firebase/firestore';

export default function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark'));

  const [universalSearchQuery, setUniversalSearchQuery] = useState('');
  const [searchSource, setSearchSource] = useState({ events: [], users: [] });
  const [searchResults, setSearchResults] = useState({ events: [], users: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearchFocus = async () => {
    setShowSearchDropdown(true);
    if (searchSource.events.length === 0 && searchSource.users.length === 0) {
      setSearching(true);
      try {
        const [evs, usrs] = await Promise.all([
          getAllEvents(),
          getAllUsers()
        ]);
        setSearchSource({ events: evs, users: usrs });
      } catch (err) {
        console.error("Error loading search sources:", err);
      } finally {
        setSearching(false);
      }
    }
  };

  useEffect(() => {
    if (!universalSearchQuery.trim()) {
      setSearchResults({ events: [], users: [] });
      return;
    }
    const q = universalSearchQuery.toLowerCase();
    const filteredEvents = searchSource.events.filter(e => 
      e.title?.toLowerCase().includes(q) || 
      e.category?.toLowerCase().includes(q) ||
      e.tags?.toLowerCase().includes(q)
    ).slice(0, 5);

    const filteredUsers = searchSource.users.filter(u => 
      u.displayName?.toLowerCase().includes(q) || 
      u.username?.toLowerCase().includes(q) ||
      `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(q)
    ).slice(0, 5);

    setSearchResults({ events: filteredEvents, users: filteredUsers });
  }, [universalSearchQuery, searchSource]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const hideNavRoutes = ['/login', '/signup', '/forgot-password', '/onboarding'];
  const isAuthRoute = hideNavRoutes.includes(location.pathname);
  const isOrganizer = userProfile?.role === 'organizer';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isAuthRoute) {
    return <>{children}</>;
  }

  const navItems = isOrganizer ? [
    { path: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { path: '/organizer', icon: <Briefcase size={20} />, label: 'Manage Events' },
    { path: '/team', icon: <Target size={20} />, label: 'Team Workspace' },
    { path: '/profile', icon: <User size={20} />, label: 'Profile' },
  ] : [
    { path: '/', icon: <Home size={20} />, label: 'Home' },
    { path: '/explore', icon: <Search size={20} />, label: 'Competitions' },
    { path: '/team', icon: <Target size={20} />, label: 'Team Workspace' },
    { path: '/my-events', icon: <Calendar size={20} />, label: 'Calendar' },
    { path: '/my-registrations', icon: <Bookmark size={20} />, label: 'My Registrations' },
    { path: '/certificates', icon: <Award size={20} />, label: 'Certificates' },
  ];

  const secondaryItems = [
    { path: '/settings', icon: <Shield size={20} />, label: 'Settings' },
    { path: '/support', icon: <HelpCircle size={20} />, label: 'Help Center' },
  ];

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)', transition: 'all 0.3s ease' }}>
      {/* Brand Header */}
      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed && !isMobile ? 'center' : 'space-between', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/master_icon.png" alt="Logo" style={{ width: 32, height: 32, borderRadius: 8 }} />
          {(!isSidebarCollapsed || isMobile) && (
            <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-light)', letterSpacing: '-0.5px' }}>Orin</span>
          )}
        </div>
        {!isMobile && (
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-light)', display: 'flex' }}
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        {(!isSidebarCollapsed || isMobile) && (
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-light)', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px' }}>
            Menu
          </div>
        )}
        {navItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={idx} 
              to={item.path}
              title={isSidebarCollapsed && !isMobile ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                justifyContent: isSidebarCollapsed && !isMobile ? 'center' : 'flex-start',
                borderRadius: '12px', textDecoration: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-light)',
                fontWeight: isActive ? '700' : '600',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => !isActive && (e.currentTarget.style.background = 'var(--primary-light)')}
              onMouseOut={e => !isActive && (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ color: isActive ? 'white' : 'var(--muted-light)' }}>{item.icon}</div>
              {(!isSidebarCollapsed || isMobile) && item.label}
            </Link>
          );
        })}

        {(!isSidebarCollapsed || isMobile) && (
          <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--muted-light)', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '12px', marginTop: '24px' }}>
            Other
          </div>
        )}
        {secondaryItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={idx} 
              to={item.path}
              title={isSidebarCollapsed && !isMobile ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                justifyContent: isSidebarCollapsed && !isMobile ? 'center' : 'flex-start',
                borderRadius: '12px', textDecoration: 'none',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-light)',
                fontWeight: isActive ? '700' : '600',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => !isActive && (e.currentTarget.style.background = 'var(--primary-light)')}
              onMouseOut={e => !isActive && (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ color: isActive ? 'white' : 'var(--muted-light)' }}>{item.icon}</div>
              {(!isSidebarCollapsed || isMobile) && item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Mini Profile / Logout */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: isSidebarCollapsed && !isMobile ? 'center' : 'flex-start' }}>
        <button 
          onClick={handleLogout}
          title={isSidebarCollapsed && !isMobile ? "Sign Out" : undefined}
          style={{
            width: isSidebarCollapsed && !isMobile ? 'auto' : '100%', 
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
            borderRadius: '12px', background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#D92D20', fontWeight: '600', fontSize: '15px', transition: 'all 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#FEF3F2'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={20} /> {(!isSidebarCollapsed || isMobile) && "Sign Out"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-light)', transition: 'background 0.3s' }}>
      
      {/* Desktop Persistent Sidebar */}
      {!isMobile && (
        <aside style={{ width: isSidebarCollapsed ? '80px' : '260px', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0, borderRight: '1px solid var(--border-light)', zIndex: 100 }}>
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Drawer Overlay */}
      {isMobile && mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }}
        />
      )}
      
      {/* Mobile Drawer */}
      {isMobile && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', 
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1000,
          boxShadow: mobileMenuOpen ? '4px 0 24px rgba(0,0,0,0.1)' : 'none'
        }}>
          <SidebarContent />
        </div>
      )}

      {/* Main Right Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        
        {/* Top Header */}
        <header style={{ 
          height: '70px', background: 'var(--surface)', borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
          flexShrink: 0, zIndex: 10, transition: 'background 0.3s'
        }}>
          {isMobile ? (
            <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}>
              <Menu size={24} />
            </button>
          ) : (
            <div style={{ position: 'relative', width: '400px' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-light)' }} />
              <input 
                type="text" 
                placeholder="Search opportunities or users..." 
                value={universalSearchQuery}
                onChange={e => setUniversalSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                style={{
                  width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid var(--border-light)',
                  background: 'var(--bg-light)', color: 'var(--text-light)', fontSize: '14px', outline: 'none', transition: 'background 0.3s, color 0.3s'
                }}
              />

              {showSearchDropdown && universalSearchQuery.trim() && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '14px',
                  maxHeight: '360px', overflowY: 'auto', zIndex: 1000, marginTop: '8px',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.1)', padding: '12px'
                }}>
                  {searching ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted-light)', fontSize: '13px' }}>Indexing opportunities & users...</div>
                  ) : (
                    <>
                      {/* Events Section */}
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', color: 'var(--muted-light)', padding: '4px 8px' }}>Opportunities</div>
                        {searchResults.events.length === 0 ? (
                          <div style={{ padding: '8px', fontSize: '12px', color: 'var(--muted-light)' }}>No matching events found.</div>
                        ) : (
                          searchResults.events.map(ev => (
                            <div 
                              key={ev.id}
                              onClick={() => {
                                navigate(`/event/${ev.id}`);
                                setUniversalSearchQuery('');
                              }}
                              style={{
                                padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-light)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)' }}>{ev.title}</span>
                              <span style={{ fontSize: '11px', color: 'var(--muted-light)' }}>{ev.category} &bull; {ev.mode}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Users Section */}
                      <div>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', color: 'var(--muted-light)', padding: '4px 8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>Users & Developers</div>
                        {searchResults.users.length === 0 ? (
                          <div style={{ padding: '8px', fontSize: '12px', color: 'var(--muted-light)' }}>No matching users found.</div>
                        ) : (
                          searchResults.users.map(usr => (
                            <div 
                              key={usr.id}
                              onClick={() => {
                                if (usr.username) navigate(`/u/${usr.username}`);
                                else navigate(`/portfolio`);
                                setUniversalSearchQuery('');
                              }}
                              style={{
                                padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-light)'}
                              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '800' }}>
                                {(usr.displayName || 'U')[0].toUpperCase()}
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)' }}>{usr.displayName}</span>
                                <span style={{ fontSize: '11px', color: 'var(--muted-light)' }}>@{usr.username || 'user'} &bull; {usr.institution || 'Chennai'}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {isMobile && <Search size={24} color="var(--text-light)" />}
            
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg-light)'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', cursor: 'pointer' }}>
              <div style={{ textAlign: 'right', display: isMobile ? 'none' : 'block' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-light)' }}>{userProfile?.displayName || currentUser?.displayName || 'User'}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted-light)' }}>{userProfile?.role === 'organizer' ? 'Organizer' : 'Student'}</div>
              </div>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '16px' }}>
                {(userProfile?.displayName || currentUser?.displayName || 'U')[0].toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative' }}>
          {children}
        </main>

        {/* Floating Explore/Search FAB */}
        {location.pathname === '/' && (
          <button 
            onClick={() => navigate('/explore')}
            style={{
              position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
              background: isDarkMode ? 'var(--primary)' : 'var(--text-light)', color: isDarkMode ? 'var(--bg-light)' : 'white', 
              padding: '14px 28px', borderRadius: '30px', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', 
              fontWeight: '700', fontSize: '15px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', cursor: 'pointer', zIndex: 100, 
              transition: 'transform 0.2s ease, background 0.3s, color 0.3s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
          >
            <Search size={18} /> Explore Competitions
          </button>
        )}

      </div>
    </div>
  );
}
