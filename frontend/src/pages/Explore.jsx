import React, { useState, useEffect } from 'react';
import { 
  Search, SlidersHorizontal, Loader2, Calendar, MapPin, Users, Award, 
  Clock, ArrowRight, TrendingUp, ChevronRight, Bookmark 
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
];

export default function Explore() {
  const { currentUser, userProfile } = useAuth();
  const [dbEvents, setDbEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('For You');

  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);
  const [prefCategory, setPrefCategory] = useState('All');
  const [prefMode, setPrefMode] = useState('All');
  const [prefDifficulty, setPrefDifficulty] = useState('All');

  useEffect(() => {
    const fetchProfileAndEvents = async () => {
      try {
        const [eventData] = await Promise.all([
          getAllEvents(),
          currentUser ? getUserProfile(currentUser.uid) : null
        ]);
        setDbEvents(eventData);
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

  const getTabFilteredEvents = () => {
    let list = [...sourceEvents];
    if (activeTab === 'Trending') {
      list.sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0));
    } else if (activeTab === 'New') {
      list.sort((a, b) => new Date(b.date || Date.now()) - new Date(a.date || Date.now()));
    } else if (activeTab === 'Closing Soon') {
      list = list.filter(e => new Date(e.date || Date.now()) > new Date())
                 .sort((a, b) => new Date(a.date || Date.now()) - new Date(b.date || Date.now()));
    } else if (activeTab === 'Popular') {
      list = list.filter(e => (e.registeredCount || 0) > 100)
                 .sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0));
    }
    return list;
  };

  const getFinalFilteredEvents = () => {
    const tabList = getTabFilteredEvents();
    
    return tabList.filter(event => {
      const matchesSearch = searchQuery === '' 
        || event.title?.toLowerCase().includes(searchQuery.toLowerCase()) 
        || event.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (prefCategory !== 'All' && event.category && event.category.toLowerCase() !== prefCategory.toLowerCase()) return false;
      if (prefMode !== 'All' && event.mode && !event.mode.toLowerCase().includes(prefMode.toLowerCase())) return false;
      if (prefDifficulty !== 'All' && event.difficulty && !event.difficulty.toLowerCase().includes(prefDifficulty.toLowerCase())) return false;

      return matchesSearch;
    });
  };

  const finalFiltered = getFinalFilteredEvents();

  // Overview lists for "For You"
  const recList = sourceEvents.slice(0, 4);
  const trendList = [...sourceEvents].sort((a, b) => b.registeredCount - a.registeredCount).slice(0, 4);

  return (
    <div style={{ padding: '32px 24px 48px', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-light)', letterSpacing: '-0.5px', marginBottom: '8px' }}>Explore Opportunities</h1>
        <p style={{ color: 'var(--muted-light)', fontSize: '16px' }}>Discover hackathons, workshops, competitions & academic certifications</p>
      </div>

      {/* Search & Controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ 
          flex: 1, background: 'var(--surface)', border: '1px solid var(--border-light)', 
          borderRadius: '16px', display: 'flex', alignItems: 'center', padding: '0 20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <Search size={20} color="var(--muted-light)" />
          <input 
            type="text" 
            placeholder="Search events by name, skill, or keyword..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'transparent', padding: '16px', fontSize: '15px', outline: 'none', color: 'var(--text-light)' }} 
          />
        </div>
        
        <button 
          onClick={() => setIsPreferenceModalOpen(true)}
          style={{ 
            background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '16px', 
            width: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: 'var(--text-light)', transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--bg-light)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none', marginBottom: '32px', borderBottom: '1px solid var(--border-light)' }}>
        {['For You', 'Trending', 'New', 'Closing Soon', 'Popular'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-light)',
              border: activeTab === tab ? 'none' : '1px solid transparent',
              padding: '10px 24px', borderRadius: '30px', fontSize: '14px', fontWeight: '700',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Dynamic Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-light)', fontWeight: '600' }}>Loading opportunities...</div>
      ) : activeTab === 'For You' && !searchQuery && prefCategory === 'All' ? (
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '8px' }}>Recommended For You</h3>
            <p style={{ fontSize: '14px', color: 'var(--muted-light)', marginBottom: '24px' }}>Tailored opportunity selections based on your profile</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {recList.map((event, idx) => <EventCard key={idx} event={event} featured={idx === 0} />)}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '8px' }}>Trending 🔥</h3>
            <p style={{ fontSize: '14px', color: 'var(--muted-light)', marginBottom: '24px' }}>Opportunities capturing highest student registration growth this week</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {trendList.map((event, idx) => <EventCard key={idx} event={event} />)}
            </div>
          </div>

        </div>
      ) : (
        <div>
          <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '24px' }}>
            {searchQuery ? `Search Results for "${searchQuery}"` : `${activeTab} Events`}
          </h3>
          {finalFiltered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
              <Search size={48} color="var(--muted-light)" style={{ marginBottom: '16px' }} />
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-light)' }}>No events found</h4>
              <p style={{ color: 'var(--muted-light)', marginTop: '8px' }}>Try adjusting your search terms or filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {finalFiltered.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preference Filter Modal (stubbed for brevity) */}
      {isPreferenceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: '24px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ color: 'var(--text-light)', marginBottom: '24px' }}>Filters</h2>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button onClick={() => { setPrefCategory('All'); setPrefMode('All'); setPrefDifficulty('All'); setIsPreferenceModalOpen(false); }} style={{ padding: '10px 20px', background: 'var(--bg-light)', color: 'var(--text-light)', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>Clear</button>
              <button onClick={() => setIsPreferenceModalOpen(false)} style={{ padding: '10px 20px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>Apply</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
