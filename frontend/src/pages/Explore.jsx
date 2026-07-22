import React, { useState, useEffect } from 'react';
import { 
  Search, SlidersHorizontal, Bot, Sparkles, Loader2, X, Check, 
  Calendar, MapPin, Users, Award, Clock, ArrowRight, TrendingUp, 
  ChevronRight, Bookmark, ShieldAlert, GraduationCap, Flame, HelpCircle
} from 'lucide-react';
import { getAllEvents, getUserProfile } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import EventCard from '../components/EventCard';

const MOCK_EVENTS = [
  { id: 'e1', title: 'HackSphere 2026 - National Hackathon', description: '48-hour hackathon with AI, FinTech & HealthTech tracks. React, Python, or Java backend skills required.', date: '2026-07-15T00:00:00Z', format: 'Hybrid', registeredCount: 342, category: 'Hackathon', mode: 'Hybrid', difficulty: 'Intermediate', organizerName: 'Google Developer Group', maxCapacity: 500 },
  { id: 'e2', title: 'AI & Machine Learning Workshop', description: 'Hands-on AI/ML workshop from basics to deployment. Learn Python and Neural Networks.', date: '2026-06-25T00:00:00Z', format: 'Online', registeredCount: 156, category: 'Workshop', mode: 'Online', difficulty: 'Beginner', organizerName: 'AI Research Guild', maxCapacity: 200 },
  { id: 'e3', title: 'InnoVenture - Startup Ideathon', description: '24-hour ideathon with seed funding opportunities for the best ideas. Focus on UI/UX and Figma.', date: '2026-08-10T00:00:00Z', format: 'Offline', registeredCount: 45, category: 'Ideathon', mode: 'Offline', difficulty: 'Intermediate', organizerName: 'E-Cell Association', maxCapacity: 100 },
  { id: 'e4', title: 'Web3 & Blockchain Seminar', description: 'Learn about decentralized web, smart contracts and crypto economics. Node.js and Solidity.', date: '2026-08-25T00:00:00Z', format: 'Hybrid', registeredCount: 210, category: 'Seminar', mode: 'Hybrid', difficulty: 'Advanced', organizerName: 'Solidity Devs Group', maxCapacity: 300 },
  { id: 'e5', title: 'Global Tech Leaders Conference', description: 'Annual conference featuring keynotes from industry veterans. General tech insights.', date: '2026-09-05T00:00:00Z', format: 'Offline', registeredCount: 850, category: 'Conference', mode: 'Offline', difficulty: 'Beginner', organizerName: 'IEEE Student Branch', maxCapacity: 1000 },
  { id: 'e6', title: 'Competitive Coding Championship', description: 'Algorithm and data structures contest. Prepare for FAANG interviews using C++, Java, or Python.', date: '2026-06-22T18:00:00Z', format: 'Online', registeredCount: 120, category: 'Coding', mode: 'Online', difficulty: 'Advanced', organizerName: 'ACM Chapter', maxCapacity: 500 },
  { id: 'e7', title: 'Cybersecurity Incident Response', description: 'Capture the flag competition simulating realistic systems breach scenarios. Focus on network forensics.', date: '2026-06-20T09:00:00Z', format: 'Online', registeredCount: 95, category: 'Cybersecurity', mode: 'Online', difficulty: 'Advanced', organizerName: 'RedTeam Labs', maxCapacity: 150 },
  { id: 'e8', title: 'Figma UI/UX Design Boot Camp', description: 'Learn prototyping, layout structures, user testing, and interactive vector graphics.', date: '2026-07-02T10:00:00Z', format: 'Online', registeredCount: 300, category: 'Workshop', mode: 'Online', difficulty: 'Beginner', organizerName: 'Product Design Club', maxCapacity: 500 }
];

export default function Explore() {
  const { currentUser, userProfile } = useAuth();
  const [dbEvents, setDbEvents] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Standard search and discovery tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('For You');
  const [selectedSkill, setSelectedSkill] = useState(null);

  // AI assistant states
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiStep, setAiStep] = useState('');
  const [aiFilters, setAiFilters] = useState(null);

  // Preference filter states
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);
  const [prefCategory, setPrefCategory] = useState('All');
  const [prefMode, setPrefMode] = useState('All');
  const [prefDifficulty, setPrefDifficulty] = useState('All');

  useEffect(() => {
    const fetchProfileAndEvents = async () => {
      try {
        const [eventData, profile] = await Promise.all([
          getAllEvents(),
          currentUser ? getUserProfile(currentUser.uid) : null
        ]);
        setDbEvents(eventData);
        if (profile && profile.skills) {
          setUserSkills(profile.skills);
        }
      } catch (err) {
        console.error("Firebase Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndEvents();
  }, [currentUser]);

  const sourceEvents = dbEvents.length > 0 ? dbEvents.map((e, idx) => ({
    ...e,
    difficulty: e.difficulty || (idx % 3 === 0 ? 'Advanced' : idx % 2 === 0 ? 'Intermediate' : 'Beginner'),
    organizerName: e.organizerName || 'GDG Student Branch'
  })) : MOCK_EVENTS;

  // NLP Parser inside discovery assistant
  const parseAiPrompt = (prompt) => {
    const normalized = prompt.toLowerCase();
    
    // Extract category
    let category = null;
    if (normalized.includes('hackathon') || normalized.includes('hack')) category = 'hackathon';
    else if (normalized.includes('workshop') || normalized.includes('boot camp')) category = 'workshop';
    else if (normalized.includes('coding') || normalized.includes('programming') || normalized.includes('competition')) category = 'coding';
    else if (normalized.includes('seminar') || normalized.includes('webinar')) category = 'seminar';
    else if (normalized.includes('conference')) category = 'conference';
    else if (normalized.includes('ideathon')) category = 'ideathon';
    else if (normalized.includes('cyber') || normalized.includes('security')) category = 'cybersecurity';

    // Extract format mode
    let mode = null;
    if (normalized.includes('offline') || normalized.includes('in-person')) mode = 'offline';
    else if (normalized.includes('online') || normalized.includes('virtual')) mode = 'online';
    else if (normalized.includes('hybrid')) mode = 'hybrid';

    // Extract difficulty
    let difficulty = null;
    if (normalized.includes('beginner') || normalized.includes('easy') || normalized.includes('starter')) difficulty = 'beginner';
    else if (normalized.includes('intermediate') || normalized.includes('medium')) difficulty = 'intermediate';
    else if (normalized.includes('advanced') || normalized.includes('hard') || normalized.includes('expert')) difficulty = 'advanced';

    // Extract skills
    const skillsList = ['react', 'python', 'java', 'blockchain', 'web3', 'ai', 'ml', 'figma', 'design', 'c++', 'javascript', 'cybersecurity', 'cloud'];
    const matchedSkills = skillsList.filter(skill => normalized.includes(skill));

    return { category, mode, difficulty, matchedSkills };
  };

  const handleAiSearch = (e) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiSearching(true);
    setAiStep('Initializing Orin AI Discovery Engine...');

    setTimeout(() => {
      setAiStep('Analyzing natural language query parameters...');
      
      setTimeout(() => {
        setAiStep('Parsing category, difficulty, format & tech requirements...');
        
        setTimeout(() => {
          const parsed = parseAiPrompt(aiPrompt);
          setAiFilters(parsed);
          setIsAiSearching(false);
          setAiStep('');
          setActiveTab('For You'); // Switch to results view
        }, 550);
      }, 450);
    }, 400);
  };

  const handleSuggestedPromptClick = (prompt) => {
    setAiPrompt(prompt);
    setIsAiSearching(true);
    setAiStep('Initializing Orin AI Discovery Engine...');

    setTimeout(() => {
      setAiStep('Analyzing natural language query parameters...');
      
      setTimeout(() => {
        setAiStep('Parsing category, difficulty, format & tech requirements...');
        
        setTimeout(() => {
          const parsed = parseAiPrompt(prompt);
          setAiFilters(parsed);
          setIsAiSearching(false);
          setAiStep('');
          setActiveTab('For You');
        }, 550);
      }, 450);
    }, 400);
  };

  const clearAiFilters = () => {
    setAiFilters(null);
    setAiPrompt('');
  };

  // Recommendation engine metadata helpers
  const getMatchPercentage = (event) => {
    const idSum = event.id ? event.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 100;
    return 86 + (idSum % 14);
  };

  const getReason = (event, section) => {
    const skills = userProfile?.skills || ['React', 'JavaScript', 'Python'];
    const match = skills.find(s => `${event.title} ${event.description}`.toLowerCase().includes(s.toLowerCase()));
    
    switch (section) {
      case 'recommended':
        return match ? `Based on your interest in ${match}` : `Matches your educational profile`;
      case 'trending':
        return `🔥 Highly popular among Computer Science students`;
      case 'closing':
        return `⏳ Registration closing soon - students from your institution joined`;
      case 'new':
        return `🆕 Published recently - fits your registered certifications`;
      case 'popular':
        return `🏫 Trending at your institution (SRM University)`;
      case 'picks':
        return `⭐ Recommended community pick this week`;
      default:
        return `Fits your skills`;
    }
  };

  // Apply tab filtering and search queries
  const getTabFilteredEvents = () => {
    let list = [...sourceEvents];

    if (activeTab === 'Trending') {
      list.sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0));
    } else if (activeTab === 'New') {
      list.sort((a, b) => new Date(b.date || Date.now()) - new Date(a.date || Date.now()));
    } else if (activeTab === 'Closing Soon') {
      list = list.filter(e => new Date(e.date) > new Date())
                 .sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (activeTab === 'Popular') {
      list = list.filter(e => (e.registeredCount || 0) > 150)
                 .sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0));
    }

    return list;
  };

  const getFinalFilteredEvents = () => {
    const tabList = getTabFilteredEvents();
    
    return tabList.filter(event => {
      // 1. Text Search query
      const matchesSearch = searchQuery === '' 
        || event.title?.toLowerCase().includes(searchQuery.toLowerCase()) 
        || event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Skill Chip Selection
      const matchesSkill = !selectedSkill
        || `${event.title} ${event.description} ${event.category}`.toLowerCase().includes(selectedSkill.toLowerCase());

      // 3. AI NLP Filter
      if (aiFilters) {
        const { category, mode, difficulty, matchedSkills } = aiFilters;
        
        if (category && event.category && !event.category.toLowerCase().includes(category)) {
          return false;
        }
        
        const eventMode = (event.mode || event.format || '').toLowerCase();
        if (mode && !eventMode.includes(mode)) {
          return false;
        }

        const eventDiff = (event.difficulty || '').toLowerCase();
        if (difficulty && !eventDiff.includes(difficulty)) {
          return false;
        }

        if (matchedSkills && matchedSkills.length > 0) {
          const textToSearch = (event.title + ' ' + event.description + ' ' + (event.category || '')).toLowerCase();
          const matchesAnySkill = matchedSkills.some(skill => textToSearch.includes(skill));
          if (!matchesAnySkill) return false;
        }
      }

      // 4. Preference Filters
      if (prefCategory !== 'All' && event.category && event.category.toLowerCase() !== prefCategory.toLowerCase()) {
        return false;
      }
      
      const eventMode = (event.mode || event.format || '').toLowerCase();
      if (prefMode !== 'All' && !eventMode.includes(prefMode.toLowerCase())) {
        return false;
      }

      const eventDiff = (event.difficulty || '').toLowerCase();
      if (prefDifficulty !== 'All' && !eventDiff.includes(prefDifficulty.toLowerCase())) {
        return false;
      }

      return matchesSearch && matchesSkill;
    });
  };

  const finalFiltered = getFinalFilteredEvents();

  // Dynamic Horizontal Recommendation Lists (for 'For You' overview display)
  const recList = sourceEvents.slice(0, 4);
  const trendList = [...sourceEvents].sort((a, b) => b.registeredCount - a.registeredCount).slice(0, 4);
  const closingList = [...sourceEvents].filter(e => new Date(e.date) > new Date()).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 4);
  const newList = [...sourceEvents].slice(2, 6);
  const institutionalList = sourceEvents.filter(e => e.registeredCount > 100).slice(0, 4);
  const communityPicksList = [...sourceEvents].reverse().slice(0, 4);

  return (
    <div style={{ padding: '32px 24px 48px', maxWidth: '1200px', margin: '0 auto', background: 'var(--bg-light)', minHeight: '100vh', color: 'var(--text-light)' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>Explore Opportunities</h1>
          <p style={{ color: 'var(--muted-light)', fontSize: '15px', marginTop: '4px', margin: 0 }}>Discover hackathons, workshops, competitions & academic certifications</p>
        </div>
      </div>

      {/* Main Search & Filter Control Bar */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ 
            flex: 1, 
            background: 'var(--surface)', 
            border: '1px solid var(--border-light)', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <Search size={20} color="var(--muted-light)" />
            <input 
              type="text" 
              placeholder="Search opportunities, topics, skills..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '16px', fontSize: '15px', outline: 'none', color: 'var(--text-light)' }} 
            />
          </div>
          <button 
            onClick={() => setIsPreferenceModalOpen(true)}
            style={{ 
              background: 'var(--surface)', 
              border: (prefCategory !== 'All' || prefMode !== 'All' || prefDifficulty !== 'All') ? '1.5px solid var(--primary)' : '1px solid var(--border-light)', 
              borderRadius: '12px', 
              width: '56px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              color: (prefCategory !== 'All' || prefMode !== 'All' || prefDifficulty !== 'All') ? 'var(--primary)' : 'var(--muted-light)',
              position: 'relative'
            }}
            title="Set Preference Filters"
          >
            <SlidersHorizontal size={20} />
            {(prefCategory !== 'All' || prefMode !== 'All' || prefDifficulty !== 'All') && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#10B981',
                border: '2px solid var(--surface)'
              }} />
            )}
          </button>
        </div>

        {/* Discovery Tab Navigation Row */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
          {['For You', 'Trending', 'New', 'Closing Soon', 'Popular'].map((tab) => (
            <button 
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedSkill(null); }}
              style={{
                background: activeTab === tab ? 'var(--primary)' : 'transparent',
                color: activeTab === tab ? 'white' : 'var(--text-light)',
                border: activeTab === tab ? 'none' : '1px solid transparent',
                padding: '10px 20px',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                marginBottom: '8px'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- Dynamic Content Area --- */}
      {loading ? (
        <p style={{ color: 'var(--muted-light)' }}>Loading opportunities...</p>
      ) : activeTab === 'For You' && !searchQuery && !selectedSkill && !aiFilters && prefCategory === 'All' && prefMode === 'All' && prefDifficulty === 'All' ? (
        
        // Overview discovery ecosystem display (For You channel structure)
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Channel 1: Recommended For You */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>Recommended For You</h3>
                <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: '4px 0 0 0' }}>Tailored opportunity selections based on your portfolio activity</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'thin' }}>
              {recList.map(event => (
                <div key={event.id} style={{ minWidth: '320px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(123, 97, 255, 0.05)', border: '1px solid rgba(123, 97, 255, 0.1)', padding: '8px 12px', borderRadius: '12px', fontSize: '12px' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>✨ {getReason(event, 'recommended')}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{getMatchPercentage(event)}% Match</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>{event.difficulty}</span>
                      <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>By {event.organizerName}</span>
                    </div>
                    <EventCard event={event} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel 2: Trending Events */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>Trending Events</h3>
                <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: '4px 0 0 0' }}>Opportunities capturing highest student registration growth this week</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'thin' }}>
              {trendList.map(event => (
                <div key={event.id} style={{ minWidth: '320px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 138, 0, 0.05)', border: '1px solid rgba(255, 138, 0, 0.1)', padding: '8px 12px', borderRadius: '12px', fontSize: '12px' }}>
                    <span style={{ color: '#FF8A00', fontWeight: '600' }}>🔥 {getReason(event, 'trending')}</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>{event.difficulty}</span>
                      <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>By {event.organizerName}</span>
                    </div>
                    <EventCard event={event} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel 3: Closing Soon */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>Closing Soon</h3>
                <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: '4px 0 0 0' }}>Registrations ending within 72 hours - apply now</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'thin' }}>
              {closingList.map(event => (
                <div key={event.id} style={{ minWidth: '320px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 61, 0, 0.05)', border: '1px solid rgba(255, 61, 0, 0.1)', padding: '8px 12px', borderRadius: '12px', fontSize: '12px' }}>
                    <span style={{ color: '#FF3D00', fontWeight: '600' }}>⏳ {getReason(event, 'closing')}</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>{event.difficulty}</span>
                      <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>By {event.organizerName}</span>
                    </div>
                    <EventCard event={event} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel 4: New This Week */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>New This Week</h3>
                <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: '4px 0 0 0' }}>Freshly minted academic opportunities added in the last 7 days</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'thin' }}>
              {newList.map(event => (
                <div key={event.id} style={{ minWidth: '320px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 200, 83, 0.05)', border: '1px solid rgba(0, 200, 83, 0.1)', padding: '8px 12px', borderRadius: '12px', fontSize: '12px' }}>
                    <span style={{ color: '#00C853', fontWeight: '600' }}>🆕 {getReason(event, 'new')}</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>{event.difficulty}</span>
                      <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>By {event.organizerName}</span>
                    </div>
                    <EventCard event={event} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel 5: Popular At Your Institution */}
          {institutionalList.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>Popular At Your Institution</h3>
                  <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: '4px 0 0 0' }}>Opportunities with the highest attendance from SRM University students</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'thin' }}>
                {institutionalList.map(event => (
                  <div key={event.id} style={{ minWidth: '320px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.1)', padding: '8px 12px', borderRadius: '12px', fontSize: '12px' }}>
                      <span style={{ color: '#00B8D9', fontWeight: '600' }}>🏫 {getReason(event, 'popular')}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>{event.difficulty}</span>
                        <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>By {event.organizerName}</span>
                      </div>
                      <EventCard event={event} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Channel 6: Community Picks */}
          {communityPicksList.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>Community Picks</h3>
                  <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: '4px 0 0 0' }}>Opportunities highly shared and discussed in your active community guilds</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'thin' }}>
                {communityPicksList.map(event => (
                  <div key={event.id} style={{ minWidth: '320px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(123, 97, 255, 0.05)', border: '1px solid rgba(123, 97, 255, 0.1)', padding: '8px 12px', borderRadius: '12px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--primary)', fontWeight: '600' }}>⭐ {getReason(event, 'picks')}</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 10, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>{event.difficulty}</span>
                        <span style={{ background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px' }}>By {event.organizerName}</span>
                      </div>
                      <EventCard event={event} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
        
      ) : (
        
        // Discovery grid presentation (triggered by tabs, search query, skill selection or AI filters)
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>
              {activeTab} Opportunities {selectedSkill ? `for ${selectedSkill}` : ''}
            </h3>
            <span style={{ fontSize: '14px', color: 'var(--muted-light)', fontWeight: '600' }}>
              Showing {finalFiltered.length} matches
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {finalFiltered.length > 0 ? (
              finalFiltered.map(event => {
                const eventTitleDesc = (event.title + " " + event.description + " " + (event.category || "")).toLowerCase();
                const matchedSkills = userSkills.filter(skill => eventTitleDesc.includes(skill.toLowerCase()));
                const isMatched = matchedSkills.length > 0 || !!selectedSkill;

                return (
                  <div key={event.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      background: 'var(--surface)', 
                      border: '1px solid var(--border-light)', 
                      padding: '8px 12px', 
                      borderRadius: '12px', 
                      fontSize: '12px' 
                    }}>
                      <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                        Match rating: {getMatchPercentage(event)}%
                      </span>
                      <span style={{ background: 'var(--bg-light)', color: 'var(--text-light)', padding: '2px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}>
                        {event.difficulty} • By {event.organizerName}
                      </span>
                    </div>
                    <EventCard 
                      event={event} 
                      isMatched={isMatched}
                      matchedSkills={selectedSkill ? [selectedSkill] : matchedSkills}
                    />
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                <p style={{ color: 'var(--muted-light)', fontSize: '14px', margin: 0 }}>No matches found. Clear filters or search queries to start over.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. Explore by Skills Panel */}
      <div style={{ margin: '48px 0 32px 0', borderTop: '1px solid var(--border-light)', paddingTop: '32px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '8px' }}>Explore by Skills</h3>
        <p style={{ color: 'var(--muted-light)', fontSize: '13px', marginBottom: '18px' }}>Focus your path by selecting a key technical topic</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['Flutter', 'React', 'AI', 'Machine Learning', 'Cybersecurity', 'UI/UX', 'Cloud Computing', 'Data Science'].map((skill) => {
            const isSelected = selectedSkill === skill;
            return (
              <button
                key={skill}
                onClick={() => {
                  if (isSelected) {
                    setSelectedSkill(null);
                  } else {
                    setSelectedSkill(skill);
                    setActiveTab('Search Results'); // Redirect to search display list
                  }
                }}
                style={{
                  background: isSelected ? 'var(--primary)' : 'var(--surface)',
                  color: isSelected ? 'white' : 'var(--text-light)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '16px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(123, 97, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--surface)';
                }}
              >
                <Sparkles size={14} fill={isSelected ? 'white' : 'var(--primary)'} color={isSelected ? 'var(--primary)' : 'var(--primary)'} />
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orin AI Smart Discovery Assistant Section (Positioned Below) */}
      <div style={{ 
        background: 'linear-gradient(135deg, #FAF8FF 0%, #F5F1FF 100%)', 
        border: '1.5px solid rgba(123, 97, 255, 0.2)', 
        borderRadius: '24px', 
        padding: '28px', 
        marginTop: '48px',
        boxShadow: '0 4px 20px rgba(123, 97, 255, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Bot size={22} color="var(--primary)" />
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1A1A1A' }}>Orin AI Smart Discovery Assistant</h3>
          <span style={{ background: 'var(--primary)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto' }}>
            Advanced NLP Agent
          </span>
        </div>
        
        <p style={{ fontSize: '13px', color: '#6C757D', marginBottom: '16px', lineHeight: '1.4' }}>
          Looking for a specific track? Enter natural requests below or try the quick prompt templates.
        </p>

        <form onSubmit={handleAiSearch} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Ask AI Spark search..." 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={isAiSearching}
              style={{ 
                width: '100%',
                background: 'white',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '14px 16px 14px 44px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                color: 'black'
              }}
            />
            <Sparkles size={18} color="var(--primary)" style={{ position: 'absolute', left: '16px', top: '15px' }} />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isAiSearching || !aiPrompt.trim()}
            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
          >
            {isAiSearching ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Analyzing...
              </>
            ) : (
              <>⚡ Search AI</>
            )}
          </button>
        </form>

        {/* Suggested NLP Prompts Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {[
            'Find AI hackathons this month',
            'Show cybersecurity competitions',
            'Find beginner-friendly workshops',
            'Show events closing this week'
          ].map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestedPromptClick(promptText)}
              disabled={isAiSearching}
              style={{
                background: 'white',
                border: '1px solid rgba(123, 97, 255, 0.15)',
                borderRadius: '10px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--primary)',
                cursor: 'pointer',
                transition: 'all 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#F9F7ff'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              🔍 {promptText}
            </button>
          ))}
        </div>

        {/* AI Discovery Step Progress Tracker */}
        {isAiSearching && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
            <Loader2 size={14} className="animate-spin" />
            <span>{aiStep}</span>
          </div>
        )}

        {/* AI Filters Applied display */}
        {aiFilters && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '12px', border: '1px solid rgba(123, 97, 255, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#28A745' }}>
              <Check size={14} /> Discovery Constraints Applied:
            </div>
            {aiFilters.category && (
              <span style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', color: 'var(--text-light)' }}>
                Category: {aiFilters.category}
              </span>
            )}
            {aiFilters.mode && (
              <span style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', color: 'var(--text-light)' }}>
                Format: {aiFilters.mode}
              </span>
            )}
            {aiFilters.difficulty && (
              <span style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', color: 'var(--text-light)' }}>
                Difficulty: {aiFilters.difficulty}
              </span>
            )}
            {aiFilters.matchedSkills && aiFilters.matchedSkills.length > 0 && (
              <span style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', color: 'var(--text-light)' }}>
                Skills: {aiFilters.matchedSkills.join(', ')}
              </span>
            )}
            <button 
              onClick={clearAiFilters}
              style={{ background: 'none', border: 'none', color: '#DC3545', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', marginLeft: 'auto' }}
            >
              <X size={14} /> Clear AI Search
            </button>
          </div>
        )}
        {/* PREFERENCE FILTERS MODAL */}
        {isPreferenceModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '32px', borderRadius: '20px', width: '450px', boxShadow: '0 12px 36px rgba(0,0,0,0.15)', color: '#1A1A1A' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <SlidersHorizontal size={20} color="var(--primary)" /> Set Discovery Preferences
                </h3>
                <button onClick={() => setIsPreferenceModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6C757D' }}><X size={20} /></button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#495057' }}>Opportunity Category</label>
                  <select 
                    value={prefCategory} 
                    onChange={(e) => setPrefCategory(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', outline: 'none', background: '#FAF9F6', color: '#1A1A1A', cursor: 'pointer' }}
                  >
                    <option value="All">All Categories</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Ideathon">Ideathon</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Conference">Conference</option>
                    <option value="Coding">Coding Competition</option>
                    <option value="Cybersecurity">Cybersecurity CTF</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#495057' }}>Participation Format</label>
                  <select 
                    value={prefMode} 
                    onChange={(e) => setPrefMode(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', outline: 'none', background: '#FAF9F6', color: '#1A1A1A', cursor: 'pointer' }}
                  >
                    <option value="All">All Formats</option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px', color: '#495057' }}>Difficulty Level</label>
                  <select 
                    value={prefDifficulty} 
                    onChange={(e) => setPrefDifficulty(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', outline: 'none', background: '#FAF9F6', color: '#1A1A1A', cursor: 'pointer' }}
                  >
                    <option value="All">All Difficulty Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                {/* Active Filter summary */}
                {(prefCategory !== 'All' || prefMode !== 'All' || prefDifficulty !== 'All') && (
                  <div style={{ background: '#F8F9FA', padding: '12px', borderRadius: '10px', fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
                    Selected Filters: {[
                      prefCategory !== 'All' && `Category: ${prefCategory}`,
                      prefMode !== 'All' && `Format: ${prefMode}`,
                      prefDifficulty !== 'All' && `Difficulty: ${prefDifficulty}`
                    ].filter(Boolean).join(' • ')}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      setPrefCategory('All');
                      setPrefMode('All');
                      setPrefDifficulty('All');
                    }} 
                    style={{ background: 'white', color: '#EF4444', border: '1.5px solid #EF4444', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                  >
                    Reset Filters
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsPreferenceModalOpen(false)} 
                    style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' }}
                  >
                    Apply Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
