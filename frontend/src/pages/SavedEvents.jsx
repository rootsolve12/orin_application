import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Compass, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserSavedEvents } from '../firebase/firestore';
import EventCard from '../components/EventCard';

export default function SavedEvents() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    if (!currentUser) return;
    try {
      const data = await getUserSavedEvents(currentUser.uid);
      setSavedEvents(data);
    } catch (err) {
      console.error('Error fetching saved events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [currentUser, userProfile?.savedEvents]); // Refresh if profile savedEvents list changes

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px' }} />
          <p className="text-muted">Loading saved events...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 60px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 className="heading-1" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bookmark size={28} color="var(--primary)" fill="var(--primary)" /> Saved Opportunities
        </h1>
        <p className="text-muted" style={{ marginTop: '8px' }}>
          Keep track of technical challenges, hackathons, and webinars you have bookmarked for later.
        </p>
      </div>

      {savedEvents.length > 0 ? (
        <div className="card-grid">
          {savedEvents.map((event) => {
            const userSkills = userProfile?.skills || [];
            const eventText = `${event.title} ${event.description} ${event.category}`.toLowerCase();
            const matchedSkills = userSkills.filter(s => eventText.includes(s.toLowerCase()));
            
            return (
              <EventCard 
                key={event.id} 
                event={event} 
                isMatched={matchedSkills.length > 0} 
                matchedSkills={matchedSkills} 
              />
            );
          })}
        </div>
      ) : (
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border-light)', 
          borderRadius: '24px', 
          padding: '60px 24px', 
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
          maxWidth: '500px',
          margin: '40px auto 0'
        }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: 'var(--primary-light)', color: 'var(--primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 20px' 
          }}>
            <Bookmark size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '8px' }}>
            No saved events yet
          </h3>
          <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
            Browse upcoming opportunities and click the bookmark icon to save them to your workspace.
          </p>
          <button 
            onClick={() => navigate('/explore')} 
            className="btn-primary" 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 24px', borderRadius: '12px', fontSize: '14px' 
            }}
          >
            <Compass size={16} /> Explore Events
          </button>
        </div>
      )}
    </div>
  );
}
