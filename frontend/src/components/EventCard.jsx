import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Sparkles, Bookmark } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toggleSaveEvent } from '../firebase/firestore';

export default function EventCard({ event, isMatched, matchedSkills }) {
  const navigate = useNavigate();
  const { currentUser, userProfile, refreshProfile } = useAuth();

  const savedEvents = userProfile?.savedEvents || [];
  const isSaved = savedEvents.includes(event.id);
  
  return (
    <div 
      onClick={() => navigate(`/event/${event.id}`)}
      style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border-light)', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        cursor: 'pointer',
        minWidth: '320px',
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Image Area with Lightning Bolt Placeholder */}
      <div style={{ 
        height: '180px', 
        background: 'linear-gradient(135deg, #F3F0FF 0%, #EBE4FF 100%)', 
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Top Badges */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'var(--primary)', color: 'white', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '12px' }}>
          Featured
        </div>
        
        {/* Bookmark Button */}
        <button
          onClick={async (e) => {
            e.stopPropagation(); // Stop navigation to event details
            if (!currentUser) return;
            try {
              await toggleSaveEvent(currentUser.uid, event.id);
              await refreshProfile();
            } catch (err) {
              console.error('Error toggling event bookmark:', err);
            }
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--surface)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
            zIndex: 100,
            color: isSaved ? 'var(--primary)' : 'var(--muted-light)',
            padding: 0
          }}
        >
          <Bookmark size={16} fill={isSaved ? 'var(--primary)' : 'none'} />
        </button>

        {/* Category Badge - bottom left */}
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'var(--surface)', color: 'var(--primary)', fontSize: '12px', fontWeight: 'bold', padding: '4px 12px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {event.category || 'Hackathon'}
        </div>
        
        {/* Lightning Bolt Icon */}
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>

      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '8px' }}>{event.title}</h3>
        
        {isMatched && (
          <div style={{ 
            alignSelf: 'flex-start',
            background: 'rgba(123, 97, 255, 0.08)', 
            border: '1px solid rgba(123, 97, 255, 0.2)', 
            color: '#7B61FF', 
            fontSize: '11px', 
            fontWeight: '700', 
            padding: '4px 10px', 
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px'
          }}>
            <Sparkles size={12} fill="#7B61FF" />
            <span>Matched: {matchedSkills?.join(', ')}</span>
          </div>
        )}

        <p style={{ color: 'var(--muted-light)', fontSize: '14px', marginBottom: event.timeline ? '12px' : '20px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {event.description || 'Join this exciting event to learn, collaborate, and build amazing projects.'}
        </p>
        
        {event.timeline && (
          <div style={{ marginBottom: '20px', borderLeft: '2px solid var(--border-light)', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {event.timeline.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary)', minWidth: '45px' }}>{step.date}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '500' }}>{step.label}</span>
              </div>
            ))}
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--muted-light)', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            {new Date(event.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={14} />
            {event.mode || event.location || 'Online'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={14} />
            {event.registeredCount || 0} joined
          </div>
        </div>
      </div>
    </div>
  );
}
