import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Award, Users, TrendingUp, ChevronRight, Bell, Zap, Clock, Activity, Target, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllEvents, getUserRegistrations, subscribeToEmergencies } from '../firebase/firestore';
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
  const [emergencies, setEmergencies] = useState([]);
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

  const upcomingEvents = registrations
    .filter(e => new Date(e.date || e.createdAt) > new Date())
    .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
  const upNext = upcomingEvents[0];

  // Logic to show legit recommended events that the user is NOT already registered for.
  const registeredIds = new Set(registrations.map(r => r.id || r.eventId));
  const unregisteredEvents = events.filter(e => !registeredIds.has(e.id));

  useEffect(() => {
    if (!upNext) return;
    const interval = setInterval(() => {
      const diff = new Date(upNext.date || upNext.createdAt).getTime() - new Date().getTime();
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
  }, [upNext]);

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', background: 'var(--bg-light)', minHeight: '100vh', color: 'var(--text-light)' }}>
      
      {/* 1. Welcome Banner */}
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
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px', letterSpacing: '-0.5px' }}>Your Mission Control 🚀</h1>
        <p style={{ fontSize: '15px', color: '#EBE4FF', maxWidth: '540px', marginBottom: '28px', lineHeight: '1.6' }}>
          Track your activity, discover next-gen events, and rise on the global leaderboard. Let's build something extraordinary today.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Main Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* 2. Up Next Action Center */}
          <div style={{ background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(123, 97, 255, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '12px' }}><Clock size={20} /></div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-light)', margin: 0 }}>Up Next</h2>
                  <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: 0 }}>Your most urgent event</p>
                </div>
              </div>
            </div>
            {upNext ? (
              <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '8px' }}>{upNext.title}</h3>
                <p style={{ fontSize: '15px', color: 'var(--muted-light)', marginBottom: '24px' }}>Starts in</p>
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
                  <button className="btn-primary" style={{ flex: 1, padding: '14px' }}>Join Workspace</button>
                  <button style={{ flex: 1, padding: '14px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', fontWeight: '600', cursor: 'pointer' }}>View Details</button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <Target size={48} color="var(--border-light)" style={{ marginBottom: '16px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '8px' }}>Your schedule is clear</h3>
                <p style={{ fontSize: '14px', color: 'var(--muted-light)', marginBottom: '24px' }}>Ready for your next challenge?</p>
                <button onClick={() => navigate('/explore')} className="btn-primary">Explore Upcoming Events</button>
              </div>
            )}
          </div>

          {/* 3. Activity Heatmap */}
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
              {/* Mock Heatmap Generation */}
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
          </div>

          {/* AI Recommended Events */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-light)', marginBottom: '4px' }}>✨ AI Recommended</h2>
                <p style={{ color: 'var(--muted-light)', fontSize: '14px' }}>Based on your skills & interests</p>
              </div>
              <Link to="/explore" style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                View all <ChevronRight size={16} style={{ marginLeft: '4px' }} />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {unregisteredEvents.length > 0 ? (
                unregisteredEvents.slice(0, 2).map(event => (
                  <EventCard key={event.id} event={event} />
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                  <p style={{ color: 'var(--muted-light)', fontSize: '14px', margin: 0 }}>You've joined all available events! Check back later for more.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Profile Snapshot / Leaderboard */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', padding: '24px', border: '1px solid var(--border-light)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60px', background: 'var(--primary)', opacity: 0.1 }} />
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #00F0FF)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: '800', border: '4px solid var(--surface)', position: 'relative', zIndex: 1 }}>
              {firstName.charAt(0)}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '4px' }}>{userProfile?.displayName || 'Developer'}</h3>
            <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600', marginBottom: '20px' }}>Top 15% Contributor</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <div>
                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>{userProfile?.certificates || 12}</p>
                <p style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '600', textTransform: 'uppercase' }}>Certs</p>
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>4</p>
                <p style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '600', textTransform: 'uppercase' }}>Teams</p>
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>18</p>
                <p style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '600', textTransform: 'uppercase' }}>Skills</p>
              </div>
            </div>
          </div>

          {/* Trending Metrics */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-light)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <TrendingUp size={16} color="var(--primary)" /> Trending Now
              </h3>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top Tech Skill</span>
                <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-light)', marginTop: '2px' }}>#Rust & WASM</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hottest Topic</span>
                <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-light)', marginTop: '2px' }}>Agentic AI Workflows</p>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Most Active Org</span>
                <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-light)', marginTop: '2px' }}>Google Developer Groups</p>
              </div>
            </div>
          </div>

          {/* Peer Activity Feed */}
          <div style={{ background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-light)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <MessageSquare size={16} color="var(--primary)" /> Peer Activity
              </h3>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { name: 'Sarah Chen', action: 'earned the React Master cert', time: '10m ago' },
                { name: 'Alex M.', action: 'registered for Web3 Hackathon', time: '1h ago' },
                { name: 'David K.', action: 'joined your team DataBros', time: '3h ago' },
              ].map((activity, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-light)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', color: 'var(--text-light)' }}>
                    {activity.name.charAt(0)}
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
