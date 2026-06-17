import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Calendar, Globe, Users, Award, MapPin, UserCheck, Trophy, ChevronDown, User, Zap, ArrowRight, Check, Plus, Clipboard, UserPlus, Info } from 'lucide-react';
import RegistrationModal from '../components/RegistrationModal';
import { getEvent, getEventRegistration, getUserCertificateForEvent, getEventTeams, createTeam, joinTeam, getTeam } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile, refreshProfile } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Team-joining specific states
  const [eventTeams, setEventTeams] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [isTeamingAction, setIsTeamingAction] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const data = await getEvent(id);
        setEvent(data);
        if (currentUser) {
          const reg = await getEventRegistration(id, currentUser.uid);
          setRegistration(reg);
          const cert = await getUserCertificateForEvent(id, currentUser.uid);
          setCertificate(cert);
          
          // Load event-specific teams
          if (data?.isTeamEvent) {
            const teamsList = await getEventTeams(id);
            setEventTeams(teamsList);
            
            if (userProfile?.teamId) {
              const teamData = await getTeam(userProfile.teamId);
              // Confirm this team belongs to this event
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

  const handleCreateEventTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return alert("Enter team name!");
    setIsTeamingAction(true);
    try {
      await createTeam(currentUser.uid, newTeamName, id);
      alert('Team created successfully for this event!');
      setNewTeamName('');
      setRefreshKey(k => k + 1);
      await refreshProfile();
    } catch (err) {
      console.error(err);
      alert('Failed to create team.');
    } finally {
      setIsTeamingAction(false);
    }
  };

  const handleJoinEventTeam = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) return alert("Enter invite code!");
    setIsTeamingAction(true);
    try {
      const joined = await joinTeam(currentUser.uid, inviteCodeInput.trim().toUpperCase());
      if (joined.eventId !== id) {
        alert('Warning: You joined a team that is not associated with this event!');
      } else {
        alert('Successfully joined the team for this event!');
      }
      setInviteCodeInput('');
      setRefreshKey(k => k + 1);
      await refreshProfile();
    } catch (err) {
      console.error(err);
      alert('Invalid code or failed to join.');
    } finally {
      setIsTeamingAction(false);
    }
  };

  const handleJoinFinderTeam = async (targetTeam) => {
    setIsTeamingAction(true);
    try {
      await joinTeam(currentUser.uid, targetTeam.inviteCode);
      alert(`Joined team "${targetTeam.name}"!`);
      setRefreshKey(k => k + 1);
      await refreshProfile();
    } catch (err) {
      console.error(err);
      alert('Failed to join team.');
    } finally {
      setIsTeamingAction(false);
    }
  };

  if (loading || !event) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6C757D' }}>Loading Event Details...</div>;
  }

  // Mock data fallbacks for the new UI to match the screenshot exactly
  const title = event.title || 'HackSphere 2025 - National Hackathon';
  const category = event.category || 'hackathon';
  const level = event.level || 'intermediate';
  const dateStr = event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jul 15, 2025';
  const format = event.format || 'Hybrid';
  const registeredCount = event.registeredCount || 342;
  const maxCapacity = event.maxCapacity || 500;
  const certOption = event.certificate || 'Yes';
  const spotsRemaining = maxCapacity - registeredCount;

  const aboutText = event.description || "A 48-hour national-level hackathon challenging students to build innovative solutions for real-world problems. Categories include AI/ML, FinTech, HealthTech, EdTech, and Sustainability.\n\nTeams will work through ideation, prototyping, and presentation stages with mentorship from industry experts. Top projects will receive funding opportunities and internship offers.";
  
  const venue = event.venue || 'IIT Delhi, New Delhi';
  const eligibility = event.eligibility || 'Open to all undergraduate and postgraduate students';
  const teamSize = event.teamSize || '2 - 4 members';
  
  const prizes = event.prizes || [
    { label: '1st Place', value: '₹2,00,000' },
    { label: '2nd Place', value: '₹1,00,000' },
    { label: '3rd Place', value: '₹50,000' },
    { label: 'Best UI/UX', value: '₹25,000' },
    { label: 'Best Innovation', value: '₹25,000' }
  ];

  const skills = event.skills || ['Python', 'JavaScript', 'Machine Learning', 'UI/UX Design'];

  const schedule = event.schedule || [
    { day: 'Day 1', time: '9:00 AM', title: 'Opening Ceremony', desc: 'Inauguration and problem statement reveal' },
    { day: 'Day 1', time: '10:00 AM', title: 'Hacking Begins', desc: 'Teams start building' },
    { day: 'Day 2', time: '2:00 PM', title: 'Mentor Sessions', desc: '1-on-1 mentorship rounds' },
    { day: 'Day 3', time: '10:00 AM', title: 'Submissions Due', desc: 'Final submission deadline' },
    { day: 'Day 3', time: '2:00 PM', title: 'Presentations', desc: 'Top 20 teams present' },
    { day: 'Day 3', time: '5:00 PM', title: 'Awards Ceremony', desc: 'Winners announced' }
  ];

  const faqs = event.faqs || [
    { q: 'Do I need a team to participate?', a: 'You can register individually and we will help you find a team, or you can register with a pre-formed team.' },
    { q: 'Is there a registration fee?', a: 'No, the event is completely free for all accepted participants.' },
    { q: 'Can I participate remotely?', a: 'Yes, this is a hybrid event. You can participate entirely online if you choose.' }
  ];

  const organizer = event.organizer || 'TechFest India';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 40px', color: '#1A1A1A' }}>
      
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingTop: '24px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#6C757D', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <button style={{ background: 'none', border: 'none', color: '#6C757D', cursor: 'pointer' }}>
          <Bookmark size={20} />
        </button>
      </div>

      {/* Hero Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #A493C1, #69577D)', 
        borderRadius: '24px', 
        padding: '40px', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '280px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        boxShadow: '0 12px 32px rgba(0,0,0,0.1)'
      }}>
        {/* Background Icon */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.15 }}>
          <Zap size={140} strokeWidth={1} />
        </div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>{category}</span>
            <span style={{ background: '#FFD700', color: '#1A1A1A', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>{level}</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>{title}</h1>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px', marginBottom: '32px' }}>
        {[
          { icon: <Calendar size={20} />, label: 'Date', value: dateStr },
          { icon: <Globe size={20} />, label: 'Format', value: format },
          { icon: <Users size={20} />, label: 'Participants', value: `${registeredCount}/${maxCapacity}` },
          { icon: <Award size={20} />, label: 'Certificate', value: certOption },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ color: '#7B61FF', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1A1A1A', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#6C757D' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Registration / Timeline Journey Gate Bar */}
      {registration ? (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.08), rgba(157, 133, 255, 0.05))', 
          border: '1.5px solid rgba(123, 97, 255, 0.2)', 
          borderRadius: '20px', 
          padding: '24px', 
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 24px rgba(123,97,255,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ 
                  background: 'var(--primary)', 
                  color: 'white', 
                  fontSize: '11px', 
                  fontWeight: '800', 
                  padding: '2px 8px', 
                  borderRadius: '12px',
                  textTransform: 'uppercase'
                }}>Registered</span>
                <span style={{ 
                  background: registration.status === 'Approved' ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 161, 22, 0.1)',
                  color: registration.status === 'Approved' ? '#28A745' : '#FFA116',
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>Screening: {registration.status}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text)' }}>You're in the competition!</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>
                Active Round: <strong>{event.rounds?.[event.currentRoundIndex || 0] || 'Registration'}</strong>
              </p>
            </div>
            
            <button 
              onClick={() => navigate(`/event/${event.id}/timeline`)} 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px' }}
            >
              Open Timeline Workspace <ArrowRight size={16} />
            </button>
          </div>

          {/* Stepper overview */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'white', padding: '12px 16px', borderRadius: '12px', overflowX: 'auto', border: '1px solid var(--border-light)' }}>
            {(event.rounds || ['Registration', 'Screening', 'Assessment', 'Submission', 'Review', 'Shortlisting', 'Final', 'Results', 'Certification']).map((r, idx) => {
              const isCompleted = idx < (event.currentRoundIndex || 0);
              const isActive = idx === (event.currentRoundIndex || 0);
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: isCompleted ? '#28A745' : isActive ? 'var(--primary)' : '#E9ECEF'
                  }} />
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: isActive || isCompleted ? '700' : '500',
                    color: isCompleted ? '#28A745' : isActive ? 'var(--primary)' : 'var(--text-light)'
                  }}>{r}</span>
                  {idx < (event.rounds?.length || 9) - 1 && <span style={{ color: 'var(--border-light)', fontSize: '10px' }}>&bull;</span>}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1A1A1A', marginBottom: '4px' }}>Ready to join?</div>
            <div style={{ fontSize: '13px', color: '#6C757D' }}>{spotsRemaining} spots remaining</div>
          </div>
          <button onClick={() => setShowRegistrationModal(true)} style={{ background: '#7B61FF', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '24px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s' }}>
            Register Now
          </button>
        </div>
      )}
      {/* Event Teaming Center (Visible only to registered participants in team-based events) */}
      {registration && event.isTeamEvent && (
        <div style={{ 
          background: 'white', 
          border: '1px solid var(--border-light)', 
          borderRadius: '20px', 
          padding: '32px', 
          marginBottom: '32px', 
          boxShadow: '0 6px 18px rgba(0,0,0,0.02)',
          textAlign: 'left'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users color="var(--primary)" size={20} /> Event Teaming Center
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '24px' }}>
            Teaming is required for this event. Establish or find a team to submit assessments.
          </p>

          {myTeam ? (
            <div style={{ 
              background: 'rgba(123, 97, 255, 0.04)', 
              border: '1.5px solid rgba(123, 97, 255, 0.15)', 
              padding: '24px', 
              borderRadius: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <span style={{ background: 'var(--primary)', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>Active Team</span>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginTop: '6px', color: 'var(--text)' }}>{myTeam.name}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                  Members: <strong>{myTeam.memberIds?.length || 1}</strong> &bull; Invite Code: <strong style={{ color: 'var(--primary)' }}>{myTeam.inviteCode}</strong>
                </p>
              </div>
              <button 
                onClick={() => navigate('/team')} 
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
              >
                Go to Team Workspace <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
              {/* Forms Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>Create New Team</h4>
                  <form onSubmit={handleCreateEventTeam} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      placeholder="Team Name (e.g. Code Knights)" 
                      value={newTeamName} 
                      onChange={e => setNewTeamName(e.target.value)} 
                      className="form-input" 
                      style={{ background: 'white', fontSize: '13px', padding: '8px 12px' }}
                    />
                    <button type="submit" disabled={isTeamingAction} className="btn-primary" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Plus size={14} /> Create
                    </button>
                  </form>
                </div>

                <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>Join by Invite Code</h4>
                  <form onSubmit={handleJoinEventTeam} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      placeholder="6-digit Code" 
                      value={inviteCodeInput} 
                      onChange={e => setInviteCodeInput(e.target.value)} 
                      maxLength={6} 
                      className="form-input" 
                      style={{ background: 'white', fontSize: '13px', padding: '8px 12px' }}
                    />
                    <button type="submit" disabled={isTeamingAction} className="btn-primary" style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserPlus size={14} /> Join
                    </button>
                  </form>
                </div>
              </div>

              {/* Team Finder Grid Column */}
              <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Search size={14} color="var(--primary)" /> Browse Open Teams
                </h4>
                
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px' }}>
                  {eventTeams.map((t, idx) => (
                    <div key={idx} style={{ background: 'white', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text)' }}>{t.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                          Members: {t.memberIds?.length || 1}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleJoinFinderTeam(t)} 
                        disabled={isTeamingAction}
                        style={{ border: 'none', background: 'rgba(123,97,255,0.08)', color: 'var(--primary)', fontWeight: '700', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        Join
                      </button>
                    </div>
                  ))}
                  {eventTeams.length === 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--text-light)', textAlign: 'center', margin: 'auto 0', padding: '24px 0' }}>
                      No teams created for this event yet. Create one to get started!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* About Section */}
      <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1A1A1A' }}>About this Event</h2>
        <div style={{ color: '#6C757D', fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
          {aboutText}
        </div>
      </div>

      {/* 2x2 Grid Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7B61FF', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>
            <MapPin size={18} /> Venue
          </div>
          <div style={{ color: '#6C757D', fontSize: '15px' }}>{venue}</div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7B61FF', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>
            <UserCheck size={18} /> Eligibility
          </div>
          <div style={{ color: '#6C757D', fontSize: '15px' }}>{eligibility}</div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7B61FF', fontWeight: 'bold', fontSize: '15px', marginBottom: '16px' }}>
            <Trophy size={18} /> Prizes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {prizes.map((p, i) => (
              <div key={i} style={{ display: 'flex', fontSize: '15px', color: '#6C757D' }}>
                <span style={{ width: '120px' }}>{p.label}:</span>
                <span style={{ fontWeight: '500' }}>{p.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7B61FF', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>
            <Users size={18} /> Team Size
          </div>
          <div style={{ color: '#6C757D', fontSize: '15px' }}>{teamSize}</div>
        </div>
      </div>

      {/* Skills Required */}
      <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#1A1A1A' }}>Skills Required</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {skills.map((skill, i) => (
            <span key={i} style={{ background: '#F8F9FA', color: '#1A1A1A', border: '1px solid #E9ECEF', padding: '8px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: '500' }}>
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '32px', color: '#1A1A1A' }}>Schedule</h2>
        <div style={{ position: 'relative', paddingLeft: '14px' }}>
          {/* Vertical Line */}
          <div style={{ position: 'absolute', top: '8px', bottom: '8px', left: '0', width: '2px', background: '#E9ECEF' }} />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {schedule.map((item, i) => (
              <div key={i} style={{ position: 'relative', paddingLeft: '24px' }}>
                {/* Dot */}
                <div style={{ position: 'absolute', left: '-18px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: '#7B61FF', border: '2px solid white' }} />
                
                <div style={{ fontSize: '13px', color: '#6C757D', marginBottom: '4px' }}>{item.day} - {item.time}</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '14px', color: '#6C757D' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: '#1A1A1A' }}>FAQs</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: i === faqs.length - 1 ? 'none' : '1px solid #E9ECEF', paddingBottom: i === faqs.length - 1 ? 0 : '16px' }}>
              <div 
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: '600', fontSize: '15px', color: '#1A1A1A' }}
              >
                {faq.q}
                <ChevronDown size={18} color="#6C757D" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
              </div>
              {openFaq === i && (
                <div style={{ marginTop: '12px', color: '#6C757D', fontSize: '14px', lineHeight: '1.6' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Organizer */}
      <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '24px 32px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: '#1A1A1A' }}>Organized by</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7B61FF' }}>
            <User size={24} />
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#1A1A1A' }}>{organizer}</div>
        </div>
      </div>

      {showRegistrationModal && (
        <RegistrationModal 
          event={event} 
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={() => setShowRegistrationModal(false)}
        />
      )}

    </div>
  );
}
