import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, Calendar, Award, Users, TrendingUp, ChevronRight, 
  Bell, Zap, Clock, Activity, Target, MessageSquare, 
  GraduationCap, Flame, Compass, Users2, ShieldAlert, ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllEvents, getUserRegistrations } from '../firebase/firestore';
import EventCard from '../components/EventCard';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '☀️ Good morning';
  if (h < 17) return '🌤 Good afternoon';
  return '🌙 Good evening';
}

export default function Home() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  const firstName = userProfile?.displayName?.split(' ')[0] 
    || currentUser?.displayName?.split(' ')[0] 
    || 'Developer';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [data, regs] = await Promise.all([
          getAllEvents(),
          currentUser ? getUserRegistrations(currentUser.uid) : Promise.resolve([]),
        ]);
        setEvents(data);
        setRegistrations(regs);
      } catch (err) {
        console.error('Firebase Error:', err);
        setEvents([]);
      }
    };
    fetchData();
  }, [currentUser]);

  // Fallback active events if user has not registered for any events yet (keeps dashboard looking premium and full)
  const activeEvents = registrations.length > 0 ? registrations.map((r, i) => ({
    ...r,
    currentRoundIndex: r.currentRoundIndex ?? (i % 2 === 0 ? 1 : 2),
    rounds: r.rounds ?? ['Registration', 'Assessment', 'Submission', 'Review', 'Results', 'Certification'],
    nextAction: i % 2 === 0 ? 'Complete Screening Test' : 'Upload Submission PDF',
    deadline: i % 2 === 0 ? 'June 25, 2026' : 'July 5, 2026'
  })) : [
    {
      id: 'e1',
      title: 'Global Hack 2026',
      category: 'Hackathons',
      date: '2026-08-15T10:00:00Z',
      location: 'SRM University',
      mode: 'Offline',
      registeredCount: 450,
      currentRoundIndex: 1,
      rounds: ['Registration', 'Screening', 'Assessment', 'Submission', 'Review', 'Results', 'Certification'],
      nextAction: 'Complete screening quiz before round closes.',
      deadline: 'June 25, 2026'
    },
    {
      id: 'e3',
      title: 'AI Innovation Challenge',
      category: 'Innovation Challenges',
      date: '2026-10-10T09:00:00Z',
      location: 'Bangalore Tech Park',
      mode: 'Offline',
      registeredCount: 89,
      currentRoundIndex: 2,
      rounds: ['Registration', 'Screening', 'Assessment', 'Submission', 'Review', 'Results', 'Certification'],
      nextAction: 'Prepare draft project roadmap submission.',
      deadline: 'July 1, 2026'
    }
  ];

  // AI Recommendation engine math & helper functions
  const getRecReason = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('hack')) return 'Recommended based on your Hackathon history and React skills.';
    if (cat.includes('webinar') || cat.includes('seminar')) return 'Recommended based on your interest in Quantum Computing.';
    if (cat.includes('coding') || cat.includes('algorithm')) return 'Recommended because of your Rust & Algorithm skills.';
    return 'Recommended based on your overall technical preferences.';
  };

  const getMatchPercent = (id) => {
    const mapping = { e1: 98, e2: 91, e3: 88, e4: 95 };
    return mapping[id] || 94;
  };

  // Smart priority item system
  const getPriorityItem = () => {
    // 1. Check if there are active events with close deadlines
    if (activeEvents.length > 0) {
      const primaryEvent = activeEvents[0];
      return {
        type: 'Upcoming event',
        title: primaryEvent.title,
        description: `Your active stage is "${primaryEvent.rounds?.[primaryEvent.currentRoundIndex] || 'Assessment'}". Next action: ${primaryEvent.nextAction}`,
        targetDate: new Date(Date.now() + 86400000 * 2 + 3600000 * 5), // 2 days, 5 hours out
        actionLabel: 'Join Workspace',
        actionPath: `/event/${primaryEvent.id || primaryEvent.eventId}`,
        icon: <Calendar size={20} />
      };
    }
    
    // 2. Default Priority fallback
    return {
      type: 'Assessment deadline',
      title: 'AlgoRhythm Screening Round',
      description: 'Your next-level programming evaluation is closing soon. Start the test now.',
      targetDate: new Date(Date.now() + 3600000 * 15 + 600000 * 23), // 15h 23m
      actionLabel: 'Start Assessment',
      actionPath: '/event/e4',
      icon: <Clock size={20} />
    };
  };

  const priorityItem = getPriorityItem();

  useEffect(() => {
    if (!priorityItem) return;
    const interval = setInterval(() => {
      const diff = new Date(priorityItem.targetDate).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        clearInterval(interval);
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60)
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [priorityItem.targetDate]);

  // Filter out unregistered events for AI recommendations
  const registeredIds = new Set(registrations.map(r => r.id || r.eventId));
  const unregisteredEvents = events.filter(e => !registeredIds.has(e.id));

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', background: 'var(--bg-light)', minHeight: '100vh', color: 'var(--text-light)' }}>
      
      {/* 1. Dynamic Welcome Banner & Insights Command Center */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #9D88FF 100%)',
        borderRadius: '24px', padding: '40px 48px', color: 'white',
        marginBottom: '32px', position: 'relative', overflow: 'hidden',
        boxShadow: '0 12px 32px rgba(123, 97, 255, 0.25)'
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 80, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EBE4FF', fontWeight: '600', fontSize: '15px' }}>
            <Sparkles size={18} color="#FFD700" />
            {getGreeting()}, {firstName}!
          </div>
          <div style={{ background: 'rgba(255, 138, 0, 0.2)', border: '1px solid #FF8A00', padding: '4px 12px', borderRadius: '16px', fontSize: '13px', fontWeight: 'bold', color: '#FFF8F0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="#FF8A00" fill="#FF8A00" />
            Streak: {userProfile?.loginStreak || 3} Days
          </div>
        </div>
        
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>Your Mission Control 🚀</h1>
        <p style={{ fontSize: '15px', color: '#EBE4FF', maxWidth: '540px', marginBottom: '24px', lineHeight: '1.6' }}>
          Track active registrations, pending assessments, and map out your academic progress. Let's create something extraordinary today.
        </p>

        {/* Dynamic insights stats layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Active Registrations', value: registrations.length || 3 },
            { label: 'Upcoming Deadlines', value: 2 },
            { label: 'Pending Submissions', value: 1 },
            { label: 'Assessments Due', value: 2 },
            { label: 'Certs Earned Month', value: 2 }
          ].map((stat, idx) => (
            <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', padding: '12px 16px', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', fontWeight: '800', color: 'white' }}>{stat.value}</span>
              <span style={{ fontSize: '12px', color: '#EBE4FF', fontWeight: '500', marginTop: '4px' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Circular/Linear growth indicator bar */}
        <div style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '28px', border: '1px solid rgba(255, 255, 255, 0.1)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
              <span>Scholar Growth Progress: Level 4</span>
              <span>78% towards Level 5</span>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ background: '#00F0FF', width: '78%', height: '100%', borderRadius: '4px', boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)' }} />
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GraduationCap size={16} color="#00F0FF" />
            Milestone Rank: #42
          </div>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/explore')} style={{ background: 'white', color: 'var(--primary)', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Compass size={16} /> Explore Events
          </button>
          <button onClick={() => navigate('/my-events')} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} /> My Events
          </button>
          <button onClick={() => {
            if (activeEvents.length > 0) {
              navigate(`/event/${activeEvents[0].id || activeEvents[0].eventId}`);
            } else {
              navigate('/explore');
            }
          }} style={{ background: '#00F0FF', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,240,255,0.2)' }}>
            <Flame size={16} /> Continue Activity
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Main Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* 2. Priority Up Next Action Center */}
          <div style={{ background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(123, 97, 255, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '12px' }}><Clock size={20} /></div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-light)', margin: 0 }}>Up Next Priority</h2>
                    <span style={{ background: '#FF3D00', color: 'white', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>Urgent</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: 0 }}>{priorityItem.type}</p>
                </div>
              </div>
            </div>
            
            <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '8px' }}>{priorityItem.title}</h3>
              <p style={{ fontSize: '15px', color: 'var(--muted-light)', marginBottom: '24px', maxWidth: '480px' }}>{priorityItem.description}</p>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                {[
                  { label: 'Days', value: timeLeft.d },
                  { label: 'Hours', value: timeLeft.h },
                  { label: 'Mins', value: timeLeft.m },
                  { label: 'Secs', value: timeLeft.s }
                ].map((t, i) => (
                  <div key={i} style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '16px', width: '70px', height: '75px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>{t.value.toString().padStart(2, '0')}</span>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-light)', textTransform: 'uppercase' }}>{t.label}</span>
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '360px' }}>
                <button onClick={() => navigate(priorityItem.actionPath)} className="btn-primary" style={{ flex: 1, padding: '14px' }}>{priorityItem.actionLabel}</button>
                <button onClick={() => navigate('/my-events')} style={{ flex: 1, padding: '14px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', fontWeight: '600', cursor: 'pointer' }}>View All Schedule</button>
              </div>
            </div>
          </div>

          {/* 3. My Active Events Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Target size={22} color="var(--primary)" /> My Active Events
                </h2>
                <p style={{ color: 'var(--muted-light)', fontSize: '14px', margin: 0 }}>Rounds and deadlines requiring your immediate attention</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {activeEvents.map(event => {
                const totalRounds = event.rounds?.length || 7;
                const currentIdx = event.currentRoundIndex || 0;
                const progressPercent = Math.round((currentIdx / (totalRounds - 1)) * 100);
                const currentStage = event.rounds?.[currentIdx] || 'Registration';
                
                return (
                  <div 
                    key={event.id} 
                    style={{ 
                      background: 'var(--surface)', 
                      border: '1px solid var(--border-light)', 
                      borderRadius: '16px', 
                      padding: '20px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px', 
                      transition: 'transform 0.2s, box-shadow 0.2s', 
                      cursor: 'pointer' 
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => navigate(`/event/${event.id || event.eventId}`)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, paddingRight: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>{event.category || 'Event'}</span>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-light)', marginTop: '2px', marginBottom: 0, lineHeight: '1.3' }}>{event.title}</h3>
                      </div>
                      <span style={{ background: 'rgba(123, 97, 255, 0.1)', color: 'var(--primary)', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                        {currentStage}
                      </span>
                    </div>
                    
                    {/* Visual Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted-light)', marginBottom: '4px' }}>
                        <span>Timeline Progress</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div style={{ background: 'var(--bg-light)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--primary)', width: `${progressPercent || 10}%`, height: '100%' }} />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', background: 'var(--bg-light)', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                      <span style={{ color: 'var(--muted-light)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>Next Action Required</span>
                      <span style={{ color: 'var(--text-light)', fontWeight: '600', lineHeight: '1.3' }}>{event.nextAction}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted-light)' }}>
                        Deadline: <strong style={{ color: 'var(--text-light)' }}>{event.deadline}</strong>
                      </span>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          navigate(`/event/${event.id || event.eventId}`); 
                        }} 
                        style={{ 
                          background: 'var(--bg-light)', 
                          border: '1px solid var(--border-light)', 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          color: 'var(--primary)', 
                          fontSize: '12px', 
                          fontWeight: 'bold', 
                          cursor: 'pointer' 
                        }}
                      >
                        Workspace
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Event Timeline Tracker Widget */}
          {activeEvents.length > 0 && (
            <div style={{ background: 'var(--surface)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-light)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-light)', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--primary)" /> Timeline Tracker: {activeEvents[0].title}
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflowX: 'auto', padding: '10px 0' }}>
                {/* Connecting Line */}
                <div style={{ position: 'absolute', top: '22px', left: '20px', right: '20px', height: '2px', background: 'var(--border-light)', zIndex: 0 }} />
                
                {['Registration', 'Assessment', 'Submission', 'Review', 'Results', 'Certification'].map((stage, index) => {
                  const currentStageIndex = activeEvents[0].currentRoundIndex || 0;
                  const isCompleted = index < currentStageIndex;
                  const isActive = index === currentStageIndex;
                  
                  let circleBg = 'var(--surface)';
                  let border = '2px solid var(--border-light)';
                  let fontColor = 'var(--muted-light)';
                  
                  if (isCompleted) {
                    circleBg = 'var(--primary)';
                    border = '2px solid var(--primary)';
                    fontColor = 'var(--primary)';
                  } else if (isActive) {
                    circleBg = 'var(--surface)';
                    border = '2px solid var(--primary)';
                    fontColor = 'var(--text-light)';
                  }
                  
                  return (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, zIndex: 1, minWidth: '85px', textAlign: 'center' }}>
                      <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: circleBg, border: border,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isCompleted ? 'white' : fontColor, fontSize: '11px', fontWeight: 'bold',
                        marginBottom: '8px', boxShadow: isActive ? '0 0 8px rgba(123, 97, 255, 0.3)' : 'none'
                      }}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: isActive ? '700' : '500', color: fontColor }}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8. Activity Contributions Heatmap */}
          <div style={{ background: 'var(--surface)', borderRadius: '24px', padding: '24px', border: '1px solid var(--border-light)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-light)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} color="var(--primary)" /> Activity Contributions
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--muted-light)', marginTop: '4px' }}>84 submissions in the last year</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {Array.from({ length: 90 }).map((_, i) => {
                const levels = ['var(--bg-light)', 'rgba(123, 97, 255, 0.3)', 'rgba(123, 97, 255, 0.6)', 'var(--primary)'];
                const level = levels[Math.floor(Math.random() * (Math.random() > 0.7 ? 4 : 2))];
                return (
                  <div key={i} style={{ width: '14px', height: '14px', borderRadius: '4px', background: level, border: '1px solid var(--border-light)' }} title="Activity Log" />
                );
              })}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '12px', color: 'var(--muted-light)' }}>
              <span>Less</span>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--bg-light)' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(123, 97, 255, 0.3)' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(123, 97, 255, 0.6)' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }} />
              <span>More</span>
            </div>

            {/* Achievement Metrics below Heatmap */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '16px', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Monthly Score</span>
                <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)', margin: '4px 0 0 0' }}>420 pts</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Streak</span>
                <p style={{ fontSize: '16px', fontWeight: '800', color: '#FF8A00', margin: '4px 0 0 0' }}>{userProfile?.loginStreak || 3} Days</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Completion Rate</span>
                <p style={{ fontSize: '16px', fontWeight: '800', color: '#00C853', margin: '4px 0 0 0' }}>94%</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--muted-light)', textTransform: 'uppercase', fontWeight: 'bold' }}>Skill Growth</span>
                <p style={{ fontSize: '16px', fontWeight: '800', color: '#00F0FF', margin: '4px 0 0 0' }}>+18%</p>
              </div>
            </div>
          </div>

          {/* 6. AI Recommended Events Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '4px' }}>✨ AI Recommended</h2>
                <p style={{ color: 'var(--muted-light)', fontSize: '14px' }}>Hyper-targeted suggestions matching your academic profile</p>
              </div>
              <Link to="/explore" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                View all <ChevronRight size={16} style={{ marginLeft: '4px' }} />
              </Link>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
              {unregisteredEvents.length > 0 ? (
                unregisteredEvents.slice(0, 2).map(event => (
                  <div key={event.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      background: 'rgba(123, 97, 255, 0.05)', 
                      border: '1px solid rgba(123, 97, 255, 0.12)', 
                      padding: '8px 12px', 
                      borderRadius: '12px', 
                      fontSize: '12px' 
                    }}>
                      <span style={{ color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} fill="var(--primary)" /> {getRecReason(event.category)}
                      </span>
                      <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', fontSize: '10px' }}>
                        {getMatchPercent(event.id)}% Match
                      </span>
                    </div>
                    <EventCard event={event} />
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                  <p style={{ color: 'var(--muted-light)', fontSize: '14px', margin: 0 }}>You've joined all available events! Check back later for new releases.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar (Widgets Center) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 5. Enhanced Profile Snapshot */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-light)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', background: 'var(--primary)', opacity: 0.1 }} />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #00F0FF)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: '800', border: '4px solid var(--surface)', position: 'relative', zIndex: 1 }}>
              {firstName.charAt(0)}
            </div>
            
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '4px', textAlign: 'center' }}>{userProfile?.displayName || 'Developer'}</h3>
            <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600', marginBottom: '20px', textAlign: 'center' }}>Top 15% Contributor (Rank #42)</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--muted-light)' }}>Participation Count</span>
                <span style={{ fontWeight: '700', color: 'var(--text-light)' }}>{registrations.length || 3} Events</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--muted-light)' }}>Achievement Count</span>
                <span style={{ fontWeight: '700', color: 'var(--text-light)' }}>8 Badges</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--muted-light)' }}>Profile Strength</span>
                <span style={{ fontWeight: '700', color: '#00C853' }}>92% (Excellent)</span>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted-light)', marginBottom: '4px' }}>
                  <span>Portfolio Completion</span>
                  <span>85%</span>
                </div>
                <div style={{ background: 'var(--bg-light)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ background: '#00F0FF', width: '85%', height: '100%' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => navigate('/profile')} style={{ flex: 1, padding: '10px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)', cursor: 'pointer' }}>View Profile</button>
              <button onClick={() => navigate('/portfolio')} style={{ flex: 1, padding: '10px', background: 'var(--primary)', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', color: 'white', cursor: 'pointer' }}>View Portfolio</button>
            </div>
          </div>

          {/* 13. Quick Actions Panel */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-light)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Zap size={16} color="var(--primary)" /> Quick Actions
              </h3>
            </div>
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Explore Events', path: '/explore', icon: <Compass size={14} /> },
                { label: 'Create Team', path: '/team-workspace', icon: <Users2 size={14} /> },
                { label: 'View Certificates', path: '/certificates', icon: <Award size={14} /> },
                { label: 'My Registrations', path: '/my-events', icon: <Calendar size={14} /> },
                { label: 'Communities', path: '/communities', icon: <Users size={14} /> },
                { label: 'Portfolio', path: '/portfolio', icon: <GraduationCap size={14} /> }
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(action.path)}
                  style={{
                    background: 'var(--bg-light)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '10px',
                    padding: '10px 8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-light)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    textAlign: 'center',
                    transition: 'background 0.2s, transform 0.1s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(123, 97, 255, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-light)'}
                >
                  <span style={{ color: 'var(--primary)' }}>{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* 9. Deadline Center */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-light)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Clock size={16} color="var(--primary)" /> Deadline Center
              </h3>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { type: 'Submission Due', event: 'Global Hack Project', timeLeft: '2d 14h', priority: 'High', color: '#FF3D00' },
                { type: 'Assessment Due', event: 'AlgoRhythm Coding Round', timeLeft: '15h 23m', priority: 'High', color: '#FF3D00' },
                { type: 'Registration Closing', event: 'Quantum Computing Webinar', timeLeft: '4d 2h', priority: 'Medium', color: '#FF8A00' },
                { type: 'Community Task', event: 'Update Portfolio Skills', timeLeft: '6d 10h', priority: 'Low', color: 'var(--primary)' }
              ].map((dl, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < 3 ? '1px solid var(--border-light)' : 'none', paddingBottom: idx < 3 ? '10px' : '0' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: dl.color, fontWeight: '700', textTransform: 'uppercase' }}>[{dl.priority}] {dl.type}</span>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-light)', margin: '2px 0 0 0' }}>{dl.event}</p>
                  </div>
                  <span style={{ background: 'var(--bg-light)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-light)' }}>{dl.timeLeft}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 7. My Teams Widget */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Users size={16} color="var(--primary)" /> My Teams
              </h3>
              <span style={{ background: 'rgba(255, 138, 0, 0.1)', color: '#FF8A00', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' }}>1 Invite</span>
            </div>
            
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-light)' }}>💻 DataBros</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted-light)' }}>Collaborating</span>
                </div>
                <p style={{ fontSize: '12px', color: '#FF3D00', margin: '4px 0 0 0', fontWeight: '600' }}>⚠️ Submission due in 2d</p>
              </div>
              
              <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-light)' }}>🛡️ DevKnights</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted-light)' }}>Active</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 138, 0, 0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px dashed #FF8A00' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '500' }}>Invite: CyberShield</span>
                <button onClick={() => navigate('/team-workspace')} style={{ background: '#FF8A00', border: 'none', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}>Accept</button>
              </div>
              
              <button onClick={() => navigate('/team-workspace')} style={{ width: '100%', padding: '10px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                Go to Workspace <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 12. Achievement Progress Widget */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-light)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Award size={16} color="var(--primary)" /> Achievement Progress
              </h3>
            </div>
            
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-light)' }}>{userProfile?.certificates || 12}</span>
                  <p style={{ fontSize: '10px', color: 'var(--muted-light)', margin: '2px 0 0 0', textTransform: 'uppercase' }}>Certs</p>
                </div>
                <div>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-light)' }}>15</span>
                  <p style={{ fontSize: '10px', color: 'var(--muted-light)', margin: '2px 0 0 0', textTransform: 'uppercase' }}>Events</p>
                </div>
                <div>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-light)' }}>6</span>
                  <p style={{ fontSize: '10px', color: 'var(--muted-light)', margin: '2px 0 0 0', textTransform: 'uppercase' }}>Badges</p>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted-light)', marginBottom: '4px' }}>
                  <span>Next Milestone Progress</span>
                  <span>3 / 5 Completed</span>
                </div>
                <div style={{ background: 'var(--bg-light)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--primary)', width: '60%', height: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 14. Opportunity Insights */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-light)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Sparkles size={16} color="var(--primary)" /> Opportunity Insights
              </h3>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { type: 'Match', text: 'React Native opportunity matches your Frontend skills.', tag: '95% Match' },
                { type: 'Suggestion', text: 'Google Cloud Practitioner cert suggested to boost cloud skill tags.', tag: 'Recommended' },
                { type: 'Community', text: 'Join the Cybersecurity Guild matching your profile interests.', tag: 'Popular' }
              ].map((insight, idx) => (
                <div key={idx} style={{ borderBottom: idx < 2 ? '1px solid var(--border-light)' : 'none', paddingBottom: idx < 2 ? '10px' : '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 'bold', textTransform: 'uppercase' }}>{insight.type}</span>
                    <span style={{ background: 'rgba(0, 240, 255, 0.1)', color: '#00B8D9', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '8px' }}>{insight.tag}</span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: 0, lineHeight: '1.4' }}>{insight.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 10. Platform Academic Trends */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-light)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <TrendingUp size={16} color="var(--primary)" /> Academic Trends
              </h3>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Popular Event Category</span>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-light)', marginTop: '2px', marginBottom: 0 }}>Hackathons (1.2k active participants)</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fastest Growing Skill</span>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-light)', marginTop: '2px', marginBottom: 0 }}>Agentic AI Workflows (+45% growth)</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Most Active Community</span>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-light)', marginTop: '2px', marginBottom: 0 }}>AI Research Guild (350+ members)</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Performing Event</span>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-light)', marginTop: '2px', marginBottom: 0 }}>Global Hack 2026</p>
              </div>
            </div>
          </div>

          {/* 11. Peer Activity Feed */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-light)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <MessageSquare size={16} color="var(--primary)" /> Peer Activity
              </h3>
            </div>
            
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { name: 'Sarah Chen', action: 'earned the React Master certificate', time: '10m ago', badge: '🎓' },
                { name: 'Alex M.', action: 'won 1st Place at AlgoRhythm Hack', time: '1h ago', badge: '🏆' },
                { name: 'David K.', action: 'formed team CyberShield', time: '3h ago', badge: '🛡️' },
                { name: 'Elena P.', action: 'submitted project QuantumSim', time: '5h ago', badge: '💻' }
              ].map((activity, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-light)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', color: 'var(--text-light)' }}>
                    {activity.badge}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: '1.4', margin: 0 }}>
                      <span style={{ fontWeight: '600' }}>{activity.name}</span> {activity.action}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--muted-light)' }}>{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
