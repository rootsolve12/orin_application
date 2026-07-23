import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, ArrowRight, Eye, Bookmark, Target, Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllEvents, getUserRegistrations } from '../firebase/firestore';
import EventCard from '../components/EventCard';

export default function Home() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [dbEvents, setDbEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activityTab, setActivityTab] = useState('Registrations');

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

  const activityTabs = ['Registrations', 'Watchlist', 'Recently Viewed', 'My Rounds'];

  // Clean dashboard styling components
  const SectionHeader = ({ title, subtitle, onViewAll }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', marginTop: '32px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '4px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-light)', margin: 0, letterSpacing: '-0.5px' }}>{title}</h2>
        </div>
        {subtitle && <p style={{ fontSize: '14px', color: 'var(--muted-light)', marginTop: '4px', marginLeft: '12px' }}>{subtitle}</p>}
      </div>
      {onViewAll && (
        <button onClick={onViewAll} className="touch-target" style={{ 
          background: 'var(--surface)', border: '1px solid var(--border-light)', 
          padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', 
          color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' 
        }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-light)'} onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}>
          View All <ArrowRight size={14} />
        </button>
      )}
    </div>
  );

  const HorizontalScroll = ({ children }) => (
    <div style={{ 
      display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', 
      scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' 
    }}>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '0 24px 80px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Mobile-only header compensation if needed, handled by AppLayout */}
      
      {/* MY ACTIVITY SECTION */}
      <div style={{ background: 'var(--surface)', borderRadius: '24px', padding: '24px', marginTop: '24px', border: '1px solid var(--border-light)' }}>
        <SectionHeader title="My Activity" />
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
          {activityTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActivityTab(tab)}
              style={{
                padding: '8px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                background: activityTab === tab ? 'var(--surface)' : 'transparent',
                border: activityTab === tab ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                color: activityTab === tab ? 'var(--primary)' : 'var(--muted-light)',
                boxShadow: activityTab === tab ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button style={{ 
            background: 'var(--surface)', border: '1px solid var(--primary)', padding: '8px 16px', 
            borderRadius: '20px', fontSize: '13px', fontWeight: '700', color: 'var(--primary)', 
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' 
          }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-light)'} onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}>
            View All <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-light)' }}>Loading activity...</div>
        ) : (
          <HorizontalScroll>
            {registrations.length === 0 ? (
              <div style={{ padding: '32px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-light)', width: '100%', textAlign: 'center' }}>
                <Target size={32} color="var(--muted-light)" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '4px' }}>No activity yet</h4>
                <p style={{ fontSize: '13px', color: 'var(--muted-light)' }}>Start exploring competitions to build your profile.</p>
              </div>
            ) : (
              registrations.map(reg => (
                <div key={reg.id} onClick={() => navigate(`/events/${reg.id || reg.eventId}`)} style={{ 
                  minWidth: '280px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-light)', 
                  padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s'
                }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.05)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {reg.image ? <img src={reg.image} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Award size={24} color="var(--muted-light)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-light)', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.title}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--muted-light)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reg.category || 'Event'}</p>
                  </div>
                </div>
              ))
            )}
          </HorizontalScroll>
        )}
      </div>

      {/* COMPETITIONS SECTION */}
      <SectionHeader title="Competitions" subtitle="Uncover the most talked-about competitions today." onViewAll={() => navigate('/explore')} />
      
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-light)' }}>Loading competitions...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {dbEvents.filter(e => !registrations.find(r => (r.id || r.eventId) === e.id)).slice(0, 6).map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

    </div>
  );
}
