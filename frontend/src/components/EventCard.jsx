import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Bookmark, ChevronRight, Globe, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toggleSaveEvent } from '../firebase/firestore';

export default function EventCard({ event, featured }) {
  const navigate = useNavigate();
  const { currentUser, userProfile, refreshProfile } = useAuth();

  const savedEvents = userProfile?.savedEvents || [];
  const isSaved = savedEvents.includes(event.id);
  
  const mode = event.mode || event.format || 'Online';
  const isOnline = mode.toLowerCase().includes('online');

  return (
    <div 
      onClick={() => navigate(`/event/${event.id}`)}
      style={{ 
        background: 'var(--surface)', 
        border: '1px solid var(--border-light)', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        cursor: 'pointer',
        minWidth: '300px',
        maxWidth: '400px',
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      }}
    >
      {/* Top Accent Strip */}
      <div style={{ height: '4px', width: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />

      {/* Top Banner / Image Area */}
      <div style={{ 
        height: '140px', 
        background: 'var(--bg-light)', 
        borderBottom: '1px solid var(--border-light)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Abstract pattern overlay for texture */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 2px 2px, var(--primary) 1px, transparent 0)', backgroundSize: '16px 16px' }} />

        {/* Semantic Status Badge */}
        {(() => {
          const status = event.status || (featured ? 'active' : 'upcoming');
          const normalizedStatus = status.toLowerCase();
          
          let bgColor = '#3B82F6'; // Blue for Upcoming
          let label = 'Upcoming';
          
          if (normalizedStatus.includes('active') || normalizedStatus.includes('open')) {
            bgColor = '#10B981'; // Green
            label = 'Active';
          } else if (normalizedStatus.includes('closed') || normalizedStatus.includes('offline')) {
            bgColor = '#EF4444'; // Red
            label = 'Closed';
          } else if (normalizedStatus.includes('pending')) {
            bgColor = '#F59E0B'; // Orange
            label = 'Pending';
          }

          return (
            <div style={{ position: 'absolute', top: '12px', left: '12px', background: bgColor, color: 'white', fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              {label}
            </div>
          );
        })()}
        
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (!currentUser) return;
            try {
              await toggleSaveEvent(currentUser.uid, event.id);
              await refreshProfile();
            } catch (err) {
              console.error('Error toggling event bookmark:', err);
            }
          }}
          className="touch-target"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--surface)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: isSaved ? '#FFD700' : 'var(--muted-light)',
            padding: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'none'}
        >
          <Bookmark size={16} fill={isSaved ? '#FFD700' : 'none'} strokeWidth={isSaved ? 0 : 2} />
        </button>

        {/* Central Icon */}
        <Trophy size={40} color="var(--primary)" strokeWidth={1.5} style={{ opacity: 0.8 }} />
        
        <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isOnline ? <Globe size={12} /> : <MapPin size={12} />} {mode}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ color: 'var(--primary)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {event.category || 'Event'}
          </span>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-light)' }} />
          <span style={{ color: 'var(--muted-light)', fontSize: '12px', fontWeight: '600' }}>
            {event.difficulty || 'Intermediate'}
          </span>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '8px', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {event.title}
        </h3>
        
        <p style={{ fontSize: '14px', color: 'var(--muted-light)', marginBottom: '24px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
          {event.description || 'Join this exciting opportunity to showcase your skills, build awesome projects, and connect with peers.'}
        </p>
        
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-light)' }}>{event.registeredCount || 0}</span>
              <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--muted-light)', textTransform: 'uppercase' }}>Registered</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontSize: '13px', fontWeight: '700' }}>
            View Details <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}
