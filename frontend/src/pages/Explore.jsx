import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Bot, Sparkles, Loader2, X, Check } from 'lucide-react';
import { getAllEvents, getUserProfile } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import EventCard from '../components/EventCard';

const MOCK_EVENTS = [
  { id: '1', title: 'HackSphere 2025 - National Hackathon', description: '48-hour hackathon with AI, FinTech & HealthTech tracks. Win prizes worth ₹5... React, Python, or Java backend skills required.', date: '2025-07-15T00:00:00Z', format: 'Hybrid', registeredCount: 342, category: 'Hackathon', mode: 'Hybrid' },
  { id: '2', title: 'AI & Machine Learning Workshop', description: 'Hands-on AI/ML workshop from basics to deployment. Limited seats! Learn Python and Neural Networks.', date: '2025-07-20T00:00:00Z', format: 'Online', registeredCount: 156, category: 'Workshop', mode: 'Online' },
  { id: '3', title: 'InnoVenture - Startup Ideathon', description: '24-hour ideathon with seed funding opportunities for the best ideas. Focus on UI/UX and Figma.', date: '2025-08-10T00:00:00Z', format: 'Offline', registeredCount: 45, category: 'Ideathon', mode: 'Offline' },
  { id: '4', title: 'Web3 & Blockchain Seminar', description: 'Learn about decentralized web, smart contracts and crypto economics. Node.js and Solidity.', date: '2025-08-25T00:00:00Z', format: 'Hybrid', registeredCount: 210, category: 'Seminar', mode: 'Hybrid' },
  { id: '5', title: 'Global Tech Leaders Conference', description: 'Annual conference featuring keynotes from industry veterans. General tech insights.', date: '2025-09-05T00:00:00Z', format: 'Offline', registeredCount: 850, category: 'Conference', mode: 'Offline' },
  { id: '6', title: 'Competitive Coding Championship', description: 'Algorithm and data structures contest. Prepare for FAANG interviews using C++, Java, or Python.', date: '2025-09-15T00:00:00Z', format: 'Online', registeredCount: 120, category: 'Coding', mode: 'Online' }
];

export default function Explore() {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Standard search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // AI assistant states
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiStep, setAiStep] = useState('');
  const [aiFilters, setAiFilters] = useState(null);

  useEffect(() => {
    const fetchProfileAndEvents = async () => {
      try {
        const [eventData, profile] = await Promise.all([
          getAllEvents(),
          currentUser ? getUserProfile(currentUser.uid) : null
        ]);
        setEvents(eventData);
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

  const categories = ["All", "Hackathons", "Workshops", "Coding", "Seminars", "Webinars", "Conferences", "Ideathons", "Cultural", "Research"];

  // Use DB events if present, otherwise use mock events so the UI isn't empty
  const sourceEvents = events.length > 0 ? events : MOCK_EVENTS;

  // NLP Parser inside discovery
  const parseAiPrompt = (prompt) => {
    const normalized = prompt.toLowerCase();
    
    // Extract category
    let category = null;
    if (normalized.includes('hackathon')) category = 'hackathon';
    else if (normalized.includes('workshop')) category = 'workshop';
    else if (normalized.includes('coding') || normalized.includes('compiler') || normalized.includes('programming')) category = 'coding';
    else if (normalized.includes('seminar')) category = 'seminar';
    else if (normalized.includes('webinar')) category = 'webinar';
    else if (normalized.includes('conference')) category = 'conference';
    else if (normalized.includes('ideathon')) category = 'ideathon';
    else if (normalized.includes('cultural')) category = 'cultural';
    else if (normalized.includes('research')) category = 'research';

    // Extract venue format
    let mode = null;
    if (normalized.includes('offline') || normalized.includes('in-person') || normalized.includes('in person')) mode = 'offline';
    else if (normalized.includes('online') || normalized.includes('virtual') || normalized.includes('remote')) mode = 'online';
    else if (normalized.includes('hybrid')) mode = 'hybrid';

    // Extract capacity/registrations limits
    let maxRegistrants = null;
    const underRegMatch = normalized.match(/under\s+(\d+)/) || normalized.match(/less than\s+(\d+)/);
    if (underRegMatch) {
      maxRegistrants = parseInt(underRegMatch[1], 10);
    }

    // Extract skills
    const skillsList = ['react', 'python', 'java', 'blockchain', 'web3', 'ai', 'ml', 'figma', 'design', 'c++', 'javascript', 'html', 'css', 'node'];
    const matchedSkills = skillsList.filter(skill => normalized.includes(skill));

    return { category, mode, maxRegistrants, matchedSkills };
  };

  const handleAiSearch = (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiSearching(true);
    setAiStep('Initializing Orin AI Discovery Engine...');

    setTimeout(() => {
      setAiStep('Analyzing natural language semantics...');
      
      setTimeout(() => {
        setAiStep('Extracting category, format constraints, and skill keywords...');
        
        setTimeout(() => {
          const parsed = parseAiPrompt(aiPrompt);
          setAiFilters(parsed);
          setIsAiSearching(false);
          setAiStep('');
        }, 800);
      }, 700);
    }, 600);
  };

  const clearAiFilters = () => {
    setAiFilters(null);
    setAiPrompt('');
  };

  // Combine standard and AI filter logic
  const filteredEvents = sourceEvents.filter(event => {
    // 1. Text Search matching
    const matchesText = searchQuery === '' || 
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      event.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Category matching
    const matchesCategory = activeCategory === 'All' || 
      (event.category && activeCategory.toLowerCase().startsWith(event.category.toLowerCase()));

    // 3. AI Filter matching
    if (aiFilters) {
      const { category, mode, maxRegistrants, matchedSkills } = aiFilters;
      
      if (category && event.category && !event.category.toLowerCase().includes(category)) {
        return false;
      }
      
      // mode can match event.mode or event.format
      const eventMode = (event.mode || event.format || '').toLowerCase();
      if (mode && !eventMode.includes(mode)) {
        return false;
      }

      if (maxRegistrants && (event.registeredCount || 0) > maxRegistrants) {
        return false;
      }

      if (matchedSkills && matchedSkills.length > 0) {
        const textToSearch = (event.title + ' ' + event.description + ' ' + (event.category || '')).toLowerCase();
        const matchesAnySkill = matchedSkills.some(skill => textToSearch.includes(skill));
        if (!matchesAnySkill) return false;
      }
    }

    return matchesText && matchesCategory;
  });

  return (
    <div style={{ padding: '32px 24px 48px', maxWidth: '1200px', margin: '0 auto', background: '#F8F9FA', minHeight: '100vh' }}>
      
      {/* Header section */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="heading-1" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Explore Events
          </h1>
          <p className="text-muted" style={{ marginTop: '4px' }}>Discover hackathons, workshops, competitions & more</p>
        </div>
      </div>

      {/* AI Discovery Prompt Box */}
      <div style={{ 
        background: 'linear-gradient(135deg, #FAF8FF 0%, #F5F1FF 100%)', 
        border: '1.5px solid rgba(123, 97, 255, 0.2)', 
        borderRadius: '20px', 
        padding: '24px', 
        marginBottom: '32px', 
        boxShadow: '0 4px 20px rgba(123, 97, 255, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Bot size={22} color="var(--primary)" />
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1A1A1A' }}>Orin AI Smart Discovery Assistant</h3>
          <span style={{ background: 'var(--primary)', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto' }}>
            Local Model
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#6C757D', marginBottom: '16px', lineHeight: '1.4' }}>
          Type queries like: <em>"Find me a hackathon with under 200 joined that requires React skills and is hybrid"</em>
        </p>

        <form onSubmit={handleAiSearch} style={{ display: 'flex', gap: '12px' }}>
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
                transition: 'border-color 0.2s'
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
                <Loader2 size={16} className="animate-spin" /> Processing...
              </>
            ) : (
              <>⚡ Ask AI</>
            )}
          </button>
        </form>

        {/* AI Step Loader Progress */}
        {isAiSearching && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
            <Loader2 size={14} className="animate-spin" />
            <span>{aiStep}</span>
          </div>
        )}

        {/* Extracted Constraints Display */}
        {aiFilters && (
          <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#28A745', background: 'rgba(40,167,69,0.08)', border: '1px solid rgba(40,167,69,0.15)', padding: '6px 12px', borderRadius: '12px' }}>
              <Check size={14} /> AI Filters Applied
            </div>
            {aiFilters.category && (
              <span style={{ background: 'white', border: '1px solid #E9ECEF', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', color: '#1A1A1A' }}>
                Category: {aiFilters.category}
              </span>
            )}
            {aiFilters.mode && (
              <span style={{ background: 'white', border: '1px solid #E9ECEF', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', color: '#1A1A1A' }}>
                Mode: {aiFilters.mode}
              </span>
            )}
            {aiFilters.maxRegistrants && (
              <span style={{ background: 'white', border: '1px solid #E9ECEF', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', color: '#1A1A1A' }}>
                Registrations: &lt; {aiFilters.maxRegistrants}
              </span>
            )}
            {aiFilters.matchedSkills && aiFilters.matchedSkills.length > 0 && (
              <span style={{ background: 'white', border: '1px solid #E9ECEF', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', color: '#1A1A1A' }}>
                Skills: {aiFilters.matchedSkills.join(', ')}
              </span>
            )}
            <button 
              onClick={clearAiFilters}
              style={{ background: 'none', border: 'none', color: '#DC3545', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', marginLeft: '8px' }}
            >
              <X size={14} /> Clear AI Search
            </button>
          </div>
        )}
      </div>

      {/* Regular Search and Filters */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
          <div style={{ 
            flex: 1, 
            background: 'white', 
            border: '1px solid #E9ECEF', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <Search size={20} color="#6C757D" />
            <input 
              type="text" 
              placeholder="Search events, skills, topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '16px', fontSize: '15px', outline: 'none' }} 
            />
          </div>
          <button style={{ 
            background: 'white', 
            border: '1px solid #E9ECEF', 
            borderRadius: '12px', 
            width: '56px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#6C757D',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <SlidersHorizontal size={20} />
          </button>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {categories.map((cat, idx) => (
            <button 
              key={idx}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? '#7B61FF' : 'white',
                color: activeCategory === cat ? 'white' : '#6C757D',
                border: activeCategory === cat ? 'none' : '1px solid #E9ECEF',
                padding: '10px 20px',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Events */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {loading ? (
          <p className="text-muted">Loading events...</p>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map(event => {
            // Find matches against user's profile skills
            const eventTitleDesc = (event.title + " " + event.description + " " + (event.category || "")).toLowerCase();
            const matchedSkills = userSkills.filter(skill => eventTitleDesc.includes(skill.toLowerCase()));
            const isMatched = matchedSkills.length > 0;

            return (
              <EventCard 
                key={event.id} 
                event={event} 
                isMatched={isMatched}
                matchedSkills={matchedSkills}
              />
            );
          })
        ) : (
          <p className="text-muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0' }}>
            No events found matching your search criteria.
          </p>
        )}
      </div>
      
    </div>
  );
}
