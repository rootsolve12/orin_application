import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bookmark, Globe, Users, Award, MapPin, 
  ChevronRight, ArrowRight, Check, Plus, UserPlus, 
  Share2, MessageSquare, Edit3, Heart, Clock, Zap
} from 'lucide-react';
import RegistrationModal from '../components/RegistrationModal';
import { getEvent, getEventRegistration, getUserCertificateForEvent, getEventTeams, createTeam, joinTeam, getTeam, toggleSaveEvent } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, refreshProfile } = useAuth();

  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Team states
  const [eventTeams, setEventTeams] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [isTeamingAction, setIsTeamingAction] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const data = await getEvent(id);
        if (data) {
          setEvent(data);
        } else {
          // If no data found for the ID, we could show an error, but for this demo if they click a mock event, we just supply safe fallback values.
          setEvent({ id, title: 'Event Not Found', description: 'This event could not be loaded.' });
        }
        
        if (currentUser && data) {
          const reg = await getEventRegistration(id, currentUser.uid);
          setRegistration(reg);
          const cert = await getUserCertificateForEvent(id, currentUser.uid);
          setCertificate(cert);
          
          if (data.isTeamEvent) {
            const teamsList = await getEventTeams(id);
            setEventTeams(teamsList);
            
            if (userProfile?.teamId) {
              const teamData = await getTeam(userProfile.teamId);
              if (teamData && teamData.eventId === id) {
                setMyTeam(teamData);
              }
            }
          }
        }
      } catch (err) {
        console.error("Firebase Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [id, currentUser, userProfile?.teamId, refreshKey]);

  // Team Handlers
  const handleCreateEventTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return alert("Enter team name!");
    setIsTeamingAction(true);
    try {
      await createTeam(currentUser.uid, newTeamName, id);
      alert('Team created successfully!');
      setNewTeamName('');
      setRefreshKey(k => k + 1);
      await refreshProfile();
    } catch (err) { alert('Failed to create team.'); } 
    finally { setIsTeamingAction(false); }
  };

  const handleJoinEventTeam = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return alert("Enter invite code!");
    setIsTeamingAction(true);
    try {
      const joined = await joinTeam(currentUser.uid, inviteCodeInput.trim().toUpperCase());
      if (joined.eventId !== id) alert('Warning: Team not for this event!');
      else alert('Joined team!');
      setInviteCodeInput('');
      setRefreshKey(k => k + 1);
      await refreshProfile();
    } catch (err) { alert('Invalid code.'); } 
    finally { setIsTeamingAction(false); }
  };

  const handleJoinFinderTeam = async (targetTeam) => {
    setIsTeamingAction(true);
    try {
      await joinTeam(currentUser.uid, targetTeam.inviteCode);
      alert(`Joined team "${targetTeam.name}"!`);
      setRefreshKey(k => k + 1);
      await refreshProfile();
    } catch (err) { alert('Failed to join team.'); } 
    finally { setIsTeamingAction(false); }
  };

  if (loading || !event) {
    return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--muted-light)', fontWeight: '600' }}>Loading Event Workspace...</div>;
  }

  // Map to actual DB data
  const title = event.title || 'Untitled Opportunity';
  const category = event.category || 'Event';
  const description = event.description || 'No description provided.';
  const format = event.mode || event.format || 'Online';
  const registeredCount = event.registeredCount || 0;
  const organizer = event.organizerName || event.organizer || 'Orin Community';
  const eligibility = event.eligibility || 'Open to all';
  const teamSize = event.teamSize || 'Individual';
  const isOnline = format.toLowerCase().includes('online');
  const rounds = event.rounds || ['Registration', 'Assessment', 'Results'];

  const savedEvents = userProfile?.savedEvents || [];
  const isSaved = savedEvents.includes(id);

  const handleToggleSave = async () => {
    if (!currentUser) return;
    try {
      await toggleSaveEvent(currentUser.uid, id);
      await refreshProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px', color: 'var(--text-light)' }}>
      
      {/* Top Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '24px' }}>
        <button onClick={() => navigate(-1)} className="touch-target" style={{ background: 'none', border: 'none', color: 'var(--muted-light)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>
          <ArrowLeft size={16} /> Back to Explore
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleToggleSave} className="touch-target" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '10px', borderRadius: '12px', color: isSaved ? '#FFD700' : 'var(--text-light)', cursor: 'pointer', transition: 'all 0.2s' }}>
            <Heart size={18} fill={isSaved ? '#FFD700' : 'none'} />
          </button>
          <button onClick={handleShare} className="touch-target" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '10px', borderRadius: '12px', color: 'var(--text-light)', cursor: 'pointer', transition: 'all 0.2s' }}>
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Two Column Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: isMobile ? '32px' : '48px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', minWidth: 0 }}>
          
          {/* ORIN UNIQUE HERO SECTION */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <span style={{ background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {category}
              </span>
              <span style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', color: 'var(--text-light)', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isOnline ? <Globe size={14} color="#10B981" /> : <MapPin size={14} color="#F59E0B" />} {format}
              </span>
            </div>
            
            <h1 style={{ fontSize: isMobile ? '28px' : '48px', fontWeight: '800', color: 'var(--text-light)', letterSpacing: '-1px', marginBottom: '16px', lineHeight: '1.1' }}>
              {title}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--muted-light)', fontSize: '16px', fontWeight: '500' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={18} color="var(--primary)" />
              </div>
              Organized by <strong style={{ color: 'var(--text-light)' }}>{organizer}</strong>
            </div>

            <div style={{ marginTop: '32px', padding: '24px', background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '20px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: 'var(--muted-light)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: '700' }}>Eligibility</div>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>{eligibility}</div>
              </div>
              <div>
                <div style={{ color: 'var(--muted-light)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: '700' }}>Team Size</div>
                <div style={{ fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} color="var(--primary)" /> {teamSize}
                </div>
              </div>
            </div>
          </div>

          {/* ORIN UNIQUE DETAILS (Glassmorphism Text Block) */}
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }} />
              About this Opportunity
            </h2>
            <div style={{ fontSize: '16px', color: 'var(--muted-light)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
              {description}
            </div>
          </div>

          {/* ORIN UNIQUE STAGES (Neon Timeline) */}
          {rounds && rounds.length > 0 && (
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }} />
                Stages & Timeline
              </h2>
              
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                <div style={{ position: 'absolute', top: '16px', bottom: '16px', left: '0', width: '2px', background: 'var(--border-light)' }} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {rounds.map((round, idx) => (
                    <div key={idx} style={{ position: 'relative', background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '24px', marginLeft: '16px' }}>
                      <div style={{ position: 'absolute', left: '-45px', top: '24px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--bg-light)', border: '3px solid var(--primary)', zIndex: 1 }} />
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)' }}>{round}</h3>
                        <span style={{ background: 'rgba(123, 97, 255, 0.1)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '800' }}>Stage {idx + 1}</span>
                      </div>
                      <p style={{ fontSize: '14px', color: 'var(--muted-light)', lineHeight: '1.6', margin: 0 }}>
                        Complete this round to advance to the next stage. Ensure all submissions are made before the deadline.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ORIN DISCUSSIONS */}
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }} />
              Discussions
            </h2>
            
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '24px', padding: '32px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MessageSquare size={18} color="var(--primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <textarea 
                    placeholder="Ask a question or share your thoughts..." 
                    style={{ width: '100%', minHeight: '80px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '16px', fontSize: '14px', color: 'var(--text-light)', outline: 'none', resize: 'vertical', marginBottom: '12px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-primary" style={{ padding: '8px 24px', borderRadius: '20px', fontWeight: '700', fontSize: '14px' }}>
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sticky Action Sidebar */}
        <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Registration Status Card (OLED Premium) */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
            
            {/* Status Header */}
            <div style={{ background: 'rgba(255, 215, 0, 0.1)', borderBottom: '1px solid rgba(255, 215, 0, 0.2)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Zap size={20} color="#FFD700" fill="#FFD700" />
              <span style={{ color: '#FFD700', fontSize: '14px', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Registrations Open</span>
            </div>

            <div style={{ padding: '32px 24px' }}>
              
              {/* Profile Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', background: 'var(--bg-light)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), #9333EA)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '16px' }}>
                  {(userProfile?.displayName || currentUser?.displayName || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-light)' }}>{userProfile?.displayName || currentUser?.displayName || 'User'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-light)' }}>{currentUser?.email}</div>
                </div>
                <div style={{ marginLeft: 'auto', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' }}>
                  ELIGIBLE
                </div>
              </div>

              {registration ? (
                <button 
                  onClick={() => navigate(`/event/${event.id}/timeline`)} 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(123, 97, 255, 0.3)' }}
                >
                  Enter Workspace <ArrowRight size={18} />
                </button>
              ) : (
                <button 
                  onClick={() => setShowRegistrationModal(true)} 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: '800', boxShadow: '0 4px 16px rgba(123, 97, 255, 0.3)' }}
                >
                  Apply Now
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', color: 'var(--muted-light)', fontSize: '14px', fontWeight: '600' }}>
                <Users size={16} /> <strong style={{ color: 'var(--text-light)' }}>{registeredCount}</strong> Registered
              </div>
            </div>
          </div>

        </div>
      </div>

      {showRegistrationModal && (
        <RegistrationModal 
          event={event} 
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={() => {
            setShowRegistrationModal(false);
            navigate(`/event/${event.id}/timeline`, { state: { justRegistered: true } });
          }}
        />
      )}

    </div>
  );
}
