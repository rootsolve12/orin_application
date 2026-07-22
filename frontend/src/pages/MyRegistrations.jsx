import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Compass, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRegistrations, getEventRegistration } from '../firebase/firestore';
import EventCard from '../components/EventCard';

export default function MyRegistrations() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRegs = async () => {
    if (!currentUser) return;
    try {
      const regs = await getUserRegistrations(currentUser.uid);
      const regsWithStatus = await Promise.all(
        regs.map(async (event) => {
          try {
            const regDoc = await getEventRegistration(event.id, currentUser.uid);
            return {
              ...event,
              registrationStatus: regDoc?.status || 'Registered'
            };
          } catch (e) {
            console.warn("Failed to fetch reg status for event:", event.id, e);
            return {
              ...event,
              registrationStatus: 'Registered'
            };
          }
        })
      );
      setRegistrations(regsWithStatus);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegs();
  }, [currentUser]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 12px' }} />
          <p className="text-muted">Loading your registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 60px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="heading-1" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Bookmark size={28} color="var(--primary)" fill="var(--primary)" /> My Registrations
          </h1>
          <p className="text-muted">
            Track all the hackathons, workshops, and assessments you've registered for.
          </p>
        </div>
        <button 
          onClick={() => navigate('/my-events')}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}
        >
          <Calendar size={18} /> View Academic Calendar
        </button>
      </div>

      {registrations.length > 0 ? (
        <div className="card-grid">
          {registrations.map((event) => {
            const userSkills = userProfile?.skills || [];
            const eventText = `${event.title} ${event.description} ${event.category}`.toLowerCase();
            const matchedSkills = userSkills.filter(s => eventText.includes(s.toLowerCase()));
            
            return (
              <div key={event.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <EventCard 
                  event={event} 
                  isMatched={matchedSkills.length > 0} 
                  matchedSkills={matchedSkills} 
                />
                {/* Status Badge overlay */}
                <div style={{ 
                  position: 'absolute', 
                  bottom: '16px', 
                  right: '16px', 
                  background: 'var(--surface)', 
                  border: '1px solid var(--border-light)', 
                  padding: '4px 12px', 
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: event.registrationStatus === 'Approved' ? '#10B981' : 'var(--primary)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  zIndex: 10
                }}>
                  {event.registrationStatus}
                </div>
              </div>
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
            No registrations found
          </h3>
          <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
            You haven't registered for any events yet. Explore upcoming opportunities to get started!
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
