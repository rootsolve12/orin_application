import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Calendar, Award, Users, TrendingUp, ChevronRight, 
  Zap, Clock, Target, MessageSquare, 
  GraduationCap, Flame, Compass, Users2, ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllEvents, getUserRegistrations } from '../firebase/firestore';
import EventCard from '../components/EventCard';

const MOCK_FALLBACK_EVENTS = [
  { id: 'e1', title: 'Global Hack 2026', category: 'Hackathons', date: '2026-08-15T10:00:00Z', location: 'SRM University', mode: 'Offline', registeredCount: 450, maxCapacity: 500, description: '48-hour national hackathon with tracks in AI, FinTech, and Web3. Build next-gen student solutions.', image: 'https://via.placeholder.com/600x300/7B61FF/FFFFFF?text=Global+Hack+2026' },
  { id: 'e2', title: 'Intro to Quantum Computing', category: 'Webinars', date: '2026-09-01T14:00:00Z', location: 'Virtual', mode: 'Online', registeredCount: 120, maxCapacity: 5000, description: 'Master quantum algorithms, qubits, and IBM Qiskit from scratch with industry leaders.', image: 'https://via.placeholder.com/600x300/FF6B6B/FFFFFF?text=Quantum+Computing' },
  { id: 'e3', title: 'AI Innovation Challenge', category: 'Innovation Challenges', date: '2026-10-10T09:00:00Z', location: 'Bangalore Tech Park', mode: 'Offline', registeredCount: 89, maxCapacity: 100, description: 'Design and pitch AI agentic workflows solving local sustainability issues. Seed funding available.', image: 'https://via.placeholder.com/600x300/20C997/FFFFFF?text=AI+Innovation' },
  { id: 'e4', title: 'AlgoRhythm Coding Comp', category: 'Coding', date: '2026-07-20T18:00:00Z', location: 'Virtual', mode: 'Online', registeredCount: 300, maxCapacity: 300, description: 'Speed programming contest on DSA. Solve 6 algorithmic problems in 3 hours.', image: 'https://via.placeholder.com/600x300/FD7E14/FFFFFF?text=AlgoRhythm' },
  { id: 'e5', title: 'Advanced React Architecture', category: 'Workshops', date: '2026-06-28T09:00:00Z', location: 'Virtual', mode: 'Online', registeredCount: 250, maxCapacity: 300, description: 'Master Server Components, concurrent rendering, and advanced performance optimizations.', image: 'https://via.placeholder.com/600x300/61DAFB/000000?text=React+Architecture' },
  { id: 'e6', title: 'Rust Systems Programming', category: 'Workshops', date: '2026-06-25T13:00:00Z', location: 'Virtual', mode: 'Online', registeredCount: 180, maxCapacity: 200, description: 'Learn memory safety, lifetimes, and concurrent programming in systems-level development.', image: 'https://via.placeholder.com/600x300/000000/FFFFFF?text=Rust+Programming' }
];

export default function Home() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const mapRoundToStage = (roundName) => {
    if (!roundName) return 'Registration';
    const r = roundName.toLowerCase();
    if (r.includes('register') || r.includes('screen')) return 'Registration';
    if (r.includes('assess')) return 'Assessment';
    if (r.includes('submit') || r.includes('project')) return 'Submission';
    if (r.includes('review') || r.includes('shortlist') || r.includes('judge')) return 'Review';
    if (r.includes('final') || r.includes('result') || r.includes('winner')) return 'Results';
    if (r.includes('certif')) return 'Certification';
    return 'Registration';
  };

  const [dbEvents, setDbEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);



  // Tabs for structured clean discovery feeds
  const [opportunityTab, setOpportunityTab] = useState('recommended');
  
  // Bottom Discovery Feed Category & Search
  const [discoveryFilter, setDiscoveryFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(3);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const firstName = userProfile?.displayName?.split(' ')[0] 
    || currentUser?.displayName?.split(' ')[0] 
    || 'Developer';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, regs] = await Promise.all([
          getAllEvents(),
          currentUser ? getUserRegistrations(currentUser.uid) : Promise.resolve([]),
        ]);
        setDbEvents(data);
        setRegistrations(regs);
      } catch (err) {
        console.error('Firebase Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  // --- Memoized Dynamic Feed Categorization Arrays ---
  const userSkills = userProfile?.skills || ['React', 'JavaScript', 'Python'];

  const {
    recommendedEvents,
    trendingEvents,
    newEvents,
    closingSoonEvents,
    skillGrowthEvents,
    discoveryEvents
  } = useMemo(() => {
    const sourceEvents = dbEvents.length > 0 ? dbEvents : MOCK_FALLBACK_EVENTS;
    const registeredIds = new Set(registrations.map(r => r.id || r.eventId));
    const unregistered = sourceEvents.filter(e => !registeredIds.has(e.id));

    const recommended = unregistered.filter(event => {
      const textToMatch = `${event.title} ${event.description} ${event.category}`.toLowerCase();
      return userSkills.some(skill => textToMatch.includes(skill.toLowerCase()));
    }).slice(0, 4);

    const trending = [...unregistered]
      .sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0))
      .slice(0, 4);

    const newEvts = [...unregistered]
      .sort((a, b) => new Date(b.date || Date.now()) - new Date(a.date || Date.now()))
      .slice(0, 4);

    const closing = [...unregistered]
      .filter(event => new Date(event.date || Date.now()) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);

    const growth = unregistered.filter(event => {
      const textToMatch = `${event.title} ${event.description}`.toLowerCase();
      return textToMatch.includes('react') || textToMatch.includes('rust') || textToMatch.includes('systems');
    }).slice(0, 4);

    const parsedSearchQuery = searchQuery.toLowerCase();
    const discovery = unregistered.filter(event => {
      const matchesFilter = discoveryFilter === 'All' 
        || event.category?.toLowerCase().startsWith(discoveryFilter.toLowerCase().slice(0, 5));
      const matchesSearch = searchQuery === ''
        || event.title?.toLowerCase().includes(parsedSearchQuery)
        || event.description?.toLowerCase().includes(parsedSearchQuery);
      return matchesFilter && matchesSearch;
    });

    return {
      recommendedEvents: recommended,
      trendingEvents: trending,
      newEvents: newEvts,
      closingSoonEvents: closing,
      skillGrowthEvents: growth,
      discoveryEvents: discovery
    };
  }, [dbEvents, registrations, userSkills, discoveryFilter, searchQuery]);

  // --- Dynamic Tab Selector Configuration ---
  const tabConfigs = useMemo(() => [
    { key: 'recommended', label: '🎯 For You', data: recommendedEvents },
    { key: 'trending', label: '🔥 Trending', data: trendingEvents },
    { key: 'closing', label: '⏳ Closing Soon', data: closingSoonEvents },
    { key: 'new', label: '🆕 New Opportunities', data: newEvents },
    { key: 'growth', label: '⚡ Skill Growth', data: skillGrowthEvents }
  ], [recommendedEvents, trendingEvents, closingSoonEvents, newEvents, skillGrowthEvents]);

  const getRecommendationReason = (event, tabKey) => {
    switch (tabKey) {
      case 'recommended':
        return `Matches skill: ${userSkills.find(s => `${event.title} ${event.description}`.toLowerCase().includes(s.toLowerCase())) || 'Tech'}`;
      case 'trending':
        return `🔥 Popular - ${(event.registeredCount || 0) + 120} views today`;
      case 'new':
        return `🆕 Published recently`;
      case 'closing':
        return `⏳ Registration closes soon`;
      case 'growth':
        return `⚡ Perfect for skill expansion`;
      default:
        return 'Fits your profile';
    }
  };

  const getMatchPercentage = (event) => {
    const idSum = event.id ? event.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 100;
    return 85 + (idSum % 15);
  };

  const activeTabData = tabConfigs.find(t => t.key === opportunityTab)?.data || recommendedEvents;

  // --- Lightweight Styled Component Blocks ---

  const continueJourneyWidget = (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(127, 86, 217, 0.04) 0%, rgba(255, 255, 255, 0) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Flame size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>Continue Your Journey</h3>
        </div>
      </div>
      
      {registrations.length > 0 ? (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {registrations.slice(0, 2).map(reg => (
            <div key={reg.id || reg.eventId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.5)', padding: '14px 16px', borderRadius: '16px', border: '1px solid var(--border-light)', gap: '12px' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-light)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.title}</h4>
                <p style={{ fontSize: '12px', color: 'var(--muted-light)', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Stage: {reg.rounds?.[reg.currentRoundIndex || 0] ? `${mapRoundToStage(reg.rounds[reg.currentRoundIndex])} (${reg.rounds[reg.currentRoundIndex]})` : 'Registration'}
                </p>
              </div>
              <button onClick={() => navigate(`/event/${reg.id || reg.eventId}`)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px', flexShrink: 0 }}>Resume</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '36px 20px', textAlign: 'center' }}>
          <Target size={40} color="var(--muted-light)" style={{ marginBottom: '12px', opacity: 0.5 }} />
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '6px' }}>Your agenda is open</h4>
          <p style={{ fontSize: '13px', color: 'var(--muted-light)', marginBottom: '20px', maxWidth: '340px', margin: '0 auto 20px', lineHeight: '1.4' }}>
            Unlock verified merit credentials and badges by entering open hackathons or workshops.
          </p>
          <button onClick={() => navigate('/explore')} className="btn-primary" style={{ padding: '10px 20px', fontSize: '13px', borderRadius: '10px' }}>Explore Upcoming Events</button>
        </div>
      )}
    </div>
  );

  const activeDeadlines = useMemo(() => {
    return registrations
      .filter(r => new Date(r.date || Date.now()) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3)
      .map(r => {
        const timeDiff = new Date(r.date) - new Date();
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
        return { type: 'Upcoming', event: r.title, timeLeft: `${days}d ${hours}h`, color: '#F59E0B', bg: '#FFFBEB' };
      });
  }, [registrations]);

  const deadlineCenterWidget = (
    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Clock size={16} color="var(--primary)" /> Deadline Tracker
        </h3>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeDeadlines.length > 0 ? activeDeadlines.map((dl, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < activeDeadlines.length - 1 ? '1px solid #F1F5F9' : 'none', paddingBottom: idx < activeDeadlines.length - 1 ? '10px' : '0', gap: '8px' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '10px', color: dl.color, fontWeight: '700', textTransform: 'uppercase', background: dl.bg, padding: '2px 6px', borderRadius: '6px' }}>{dl.type}</span>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#334155', margin: '6px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dl.event}</p>
            </div>
            <span style={{ background: '#F1F5F9', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', color: '#475569', flexShrink: 0 }}>{dl.timeLeft}</span>
          </div>
        )) : (
          <div style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', padding: '10px 0' }}>No upcoming deadlines.</div>
        )}
      </div>
    </div>
  );

  const myTeamsWidget = (
    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Users size={16} color="var(--primary)" /> My Teams
        </h3>
      </div>
      
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {userProfile?.teamId ? (
          <div style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>💻 Your Workspace Team</span>
              <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>Active</span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', padding: '10px 0' }}>You are not in any teams.</div>
        )}
        <button onClick={() => navigate('/team')} style={{ width: '100%', padding: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          Go to Teams Workspace <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );

  const quickActionsWidget = (
    <div style={{ background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Zap size={16} color="var(--primary)" /> Workspace Actions
        </h3>
      </div>
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {[
          { label: 'Explore Events', path: '/explore', icon: <Compass size={14} />, bg: '#EEF2FF', color: '#4F46E5' },
          { label: 'Create Team', path: '/team', icon: <Users2 size={14} />, bg: '#ECFDF5', color: '#059669' },
          { label: 'Certifications', path: '/certificates', icon: <Award size={14} />, bg: '#FFF7ED', color: '#D97706' },
          { label: 'Registrations', path: '/my-events', icon: <Calendar size={14} />, bg: '#FDF2F8', color: '#DB2777' }
        ].map((action, idx) => (
          <button
            key={idx}
            onClick={() => navigate(action.path)}
            className="touch-target glass-card"
            style={{
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '12px 8px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              minHeight: '80px',
              justifyContent: 'center'
            }}
          >
            <span style={{ display: 'flex', padding: '8px', borderRadius: '50%', background: action.bg, color: action.color }}>
              {action.icon}
            </span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );



  return (
    <div className="custom-scroll" style={{ padding: isMobile ? '16px 12px' : '32px 24px', maxWidth: '1200px', margin: '0 auto', background: 'transparent', minHeight: '100vh', color: '#1D2939', position: 'relative' }}>
      
      {/* Decorative Pastel Background Blobs */}
      <div className="bg-blob-purple" style={{ top: '5%', left: '-5%' }} />
      <div className="bg-blob-blue" style={{ top: '35%', right: '-5%' }} />
      <div className="bg-blob-pink" style={{ bottom: '15%', left: '25%' }} />


      {/* Dynamic Welcome Banner (Lightweight & Soft Pastel Design) */}
      <div className="glass-panel animate-fade-in-up" style={{
        background: 'linear-gradient(135deg, rgba(245, 243, 255, 0.8) 0%, rgba(240, 249, 255, 0.8) 50%, rgba(255, 241, 242, 0.7) 100%)',
        padding: isMobile ? '24px 20px' : '36px 44px',
        marginBottom: '32px', position: 'relative', overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        boxShadow: '0 10px 40px rgba(127, 86, 217, 0.05)'
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(127, 86, 217, 0.05)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 80, width: 160, height: 160, borderRadius: '50%', background: 'rgba(14, 165, 233, 0.04)', filter: 'blur(25px)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '800', fontSize: '13px', letterSpacing: '-0.1px' }}>
            <Sparkles size={16} color="var(--primary)" fill="var(--primary)" />
            Welcome back, {firstName}!
          </div>
          <div style={{ background: '#FFF3E0', border: '1px solid #FFE0B2', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '800', color: '#E65100', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={13} color="#E65100" fill="#E65100" />
            Login Streak: {userProfile?.loginStreak || 3} Days
          </div>
        </div>
        
        <h1 style={{ fontSize: isMobile ? '22px' : '32px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-light)', letterSpacing: '-0.8px', position: 'relative', zIndex: 1 }}>
          Your Opportunity Workspace 🚀
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--muted-light)', maxWidth: '640px', marginBottom: '24px', lineHeight: '1.5', fontWeight: '500', position: 'relative', zIndex: 1 }}>
          Discover certified hackathons, coding assessments, and technical challenges tailored for your growth pathway.
        </p>

        {/* Global user profile stats container */}
        <div className="swipe-container" style={{ marginBottom: '24px', display: 'flex', gap: '14px', flexWrap: isMobile ? 'nowrap' : 'wrap', position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Registered Events', value: registrations.length },
            { label: 'Opportunity Matches', value: recommendedEvents.length || dbEvents.length },
            { label: 'Upcoming Deadlines', value: closingSoonEvents.length },
            { label: 'Ongoing Evaluation', value: 1 },
            { label: 'Earned Badges', value: 0 }
          ].map((stat, idx) => (
            <div key={idx} className="glass-card" style={{ flex: isMobile ? '0 0 135px' : '1', minWidth: '120px', padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.5px' }}>{stat.value}</span>
              <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '600', marginTop: '4px' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Level and XP progress tracker */}
        <div style={{ background: 'rgba(255, 255, 255, 0.7)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '24px', border: '1px solid var(--border-light)', flexWrap: 'wrap', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', position: 'relative', zIndex: 1 }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '800', color: 'var(--text-light)' }}>
              <span>Scholar Pathway: Level 1</span>
              <span style={{ color: 'var(--primary)' }}>0% Progress</span>
            </div>
            <div style={{ background: 'rgba(232, 230, 250, 0.6)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(90deg, var(--primary) 0%, #10B981 100%)', width: `0%`, height: '100%', borderRadius: '4px', transition: 'width 0.4s ease-out' }} />
            </div>
          </div>
          <div style={{ background: 'rgba(127, 86, 217, 0.08)', border: '1px solid rgba(127, 86, 217, 0.12)', padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GraduationCap size={15} color="var(--primary)" />
            Rank #42
          </div>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <button onClick={() => navigate('/explore')} className="btn-primary" style={{ border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(127,86,217,0.2)' }}>
            <Compass size={15} /> Find Opportunities
          </button>
          <button onClick={() => navigate('/my-events')} style={{ background: '#FFFFFF', color: 'var(--muted-light)', border: '1px solid var(--border-light)', padding: '10px 20px', borderRadius: '12px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} /> Calendar Schedule
          </button>
        </div>
      </div>

      <div className="home-grid">
        
        {/* Mobile Sidebar Widgets (top stack on viewports < 768px) */}
        {isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '28px' }}>
            {continueJourneyWidget}
            {deadlineCenterWidget}
            {myTeamsWidget}
            {quickActionsWidget}
          </div>
        )}

        {/* LEFT COLUMN: Main tabbed feed panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', overflow: 'hidden' }}>

          {!isMobile && continueJourneyWidget}

          {/* Structured Dynamic Tab Rework */}
          <div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', borderBottom: '1px solid #E2E8F0', marginBottom: '20px', scrollbarWidth: 'none' }}>
              {tabConfigs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setOpportunityTab(tab.key)}
                  className="touch-target glass-card"
                  style={{
                    background: opportunityTab === tab.key ? '#FFFFFF' : 'transparent',
                    color: opportunityTab === tab.key ? 'var(--primary)' : '#64748B',
                    border: opportunityTab === tab.key ? '1px solid #E2E8F0' : '1px solid transparent',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: opportunityTab === tab.key ? '0 2px 8px rgba(0,0,0,0.02)' : 'none',
                    transition: 'all 0.2s',
                    minHeight: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Panel Content */}
            {activeTabData.length > 0 ? (
              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
                {activeTabData.map(event => (
                  <div key={event.id} style={{ minWidth: '310px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', color: 'var(--primary)' }}>
                      <span>{getRecommendationReason(event, opportunityTab)}</span>
                      <span>{getMatchPercentage(event)}% Match</span>
                    </div>
                    <EventCard event={event} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '36px', textAlign: 'center', background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>No dynamic matching opportunities in this tab.</p>
              </div>
            )}
          </div>

          {/* Main Discovery Feed section */}
          <div>
            <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Opportunity Discovery Feed</h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 16px 0' }}>Explore all published milestones, webinar schedules, and competitions</p>
              
              {/* Category Pills */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
                {['All', 'Hackathons', 'Workshops', 'Coding', 'Webinars', 'Challenges'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setDiscoveryFilter(tab); setVisibleCount(3); }}
                    className="touch-target glass-card"
                    style={{
                      background: discoveryFilter === tab ? 'var(--primary)' : 'white',
                      color: discoveryFilter === tab ? 'white' : '#475569',
                      border: '1px solid #E2E8F0',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                      transition: 'all 0.15s',
                      minHeight: '44px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {discoveryEvents.length > 0 ? (
                discoveryEvents.slice(0, visibleCount).map(event => (
                  <div key={event.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'white', padding: '6px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
                      <span style={{ color: 'var(--primary)' }}>{getMatchPercentage(event)}% Profile Match</span>
                      <span>•</span>
                      <span>{event.registeredCount || 0} enrolled</span>
                      <span>•</span>
                      <span style={{ color: '#059669' }}>Open Stage</span>
                    </div>
                    <EventCard event={event} />
                  </div>
                ))
              ) : (
                <div style={{ padding: '36px', textAlign: 'center', background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                  <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>No matches found in this category.</p>
                </div>
              )}

              {discoveryEvents.length > visibleCount && (
                <button
                  onClick={() => setVisibleCount(prev => prev + 3)}
                  style={{
                    width: '100%', padding: '12px', background: 'white',
                    border: '1px solid #E2E8F0', borderRadius: '12px',
                    color: 'var(--primary)', fontWeight: '800',
                    cursor: 'pointer', fontSize: '13px',
                    transition: 'background 0.2s', textAlign: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  Load More Opportunities 
                </button>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar (Widgets Center) */}
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* PROFILE SNAPSHOT */}
            <div className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', background: 'var(--primary)', opacity: 0.06 }} />
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #B692FF)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '22px', fontWeight: '800', border: '4px solid white', position: 'relative', zIndex: 1, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                {firstName.charAt(0)}
              </div>
              
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '4px', textAlign: 'center' }}>{userProfile?.displayName || 'Developer'}</h3>
              <p style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>Top 15% Contributor (Rank #42)</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--muted-light)' }}>Participations</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-light)' }}>{registrations.length} Events</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--muted-light)' }}>Achievements</span>
                  <span style={{ fontWeight: '700', color: 'var(--text-light)' }}>0 Badges</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--muted-light)' }}>Profile Level</span>
                  <span style={{ fontWeight: '700', color: '#10B981' }}>Level 1 (0% Strong)</span>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted-light)', marginBottom: '4px' }}>
                    <span>Portfolio Progress</span>
                    <span>85%</span>
                  </div>
                  <div style={{ background: 'rgba(232, 230, 250, 0.6)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ background: '#10B981', width: '85%', height: '100%' }} />
                  </div>
                </div>
              </div>
 
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => navigate('/profile')} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border-light)', borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: 'var(--muted-light)', cursor: 'pointer' }}>View Profile</button>
                <button onClick={() => navigate('/portfolio')} style={{ flex: 1, padding: '10px', background: 'var(--primary)', border: 'none', borderRadius: '10px', fontSize: '11px', fontWeight: '800', color: 'white', cursor: 'pointer' }}>Portfolio</button>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            {quickActionsWidget}

            {/* DEADLINE TRACKER */}
            {deadlineCenterWidget}

            {/* TEAMS */}
            {myTeamsWidget}


          </div>
        )}

      </div>

    </div>
  );
}
