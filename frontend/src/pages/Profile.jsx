import React, { useState, useEffect } from 'react';
import { Trophy, Award, BookOpen, Settings, MapPin, ChevronRight, Edit2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, getUserRegistrations } from '../firebase/firestore';

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [registeredEventsCount, setRegisteredEventsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        try {
          const [profile, regs] = await Promise.all([
            getUserProfile(currentUser.uid),
            getUserRegistrations(currentUser.uid)
          ]);
          setProfileData(profile);
          setRegisteredEventsCount(regs.length);
        } catch (err) {
          console.error("Firebase fetch error:", err);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [currentUser]);

  // Merge database data with fallbacks so the UI matches the mockup shape
  const user = {
    name: profileData?.displayName || currentUser?.displayName || 'quizhb45',
    email: currentUser?.email || 'quizhb45@gmail.com',
    location: profileData?.location || 'Simats University · 4th Year CSE',
    skills: profileData?.skills || ['Python', 'React', 'Java'],
    stats: [
      { label: 'Events Joined', value: registeredEventsCount || 0, icon: <CalendarIcon size={24} color="#7B61FF" /> },
      { label: 'Certificates', value: profileData?.certificates || 0, icon: <Award size={24} color="#7B61FF" /> },
      { label: 'Login Streak', value: `${profileData?.loginStreak || 1} 🔥`, icon: <Zap size={24} color="#FF8A00" /> },
      { label: 'Skills Added', value: profileData?.skills?.length || 0, icon: <BookOpen size={24} color="#7B61FF" /> }
    ],
    links: [
      { label: 'Portfolio & Achievements', icon: <Trophy size={20} color="#7B61FF" />, path: '/portfolio' },
      { label: 'My Certificates', icon: <Award size={20} color="#7B61FF" />, path: '/certificates' },
      { label: 'Saved Events', icon: <BookOpen size={20} color="#7B61FF" />, path: '/my-events' }, // Maps to calendar/saved later
      { label: 'Settings', icon: <Settings size={20} color="#7B61FF" />, path: '/settings' }
    ]
  };

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'Q';

  if (loading) {
    return <div style={{ padding: '32px', textAlign: 'center', color: '#6C757D' }}>Loading profile...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px', background: '#F8F9FA', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Avatar Section */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <div style={{ 
          width: '100px', 
          height: '100px', 
          background: '#9D88FF', 
          borderRadius: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'white',
          fontSize: '48px',
          fontWeight: 'bold',
          boxShadow: '0 8px 24px rgba(123, 97, 255, 0.2)'
        }}>
          {initial}
        </div>
        <div style={{
          position: 'absolute',
          bottom: '-6px',
          right: '-6px',
          width: '32px',
          height: '32px',
          background: 'white',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          cursor: 'pointer'
        }}
        onClick={() => alert("Edit profile picture functionality coming soon!")}
        >
          <Edit2 size={14} color="#6C757D" />
        </div>
      </div>

      {/* User Info */}
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '4px' }}>{user.name}</h1>
      <p style={{ color: '#6C757D', fontSize: '15px', marginBottom: '12px' }}>{user.email}</p>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6C757D', fontSize: '14px', marginBottom: '16px' }}>
        <MapPin size={16} />
        {user.location}
      </div>

      {/* Skills Pills */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {user.skills.map((skill, idx) => (
          <span key={idx} style={{ 
            background: 'white', 
            color: '#1A1A1A', 
            border: '1px solid #E9ECEF', 
            padding: '6px 16px', 
            borderRadius: '20px', 
            fontSize: '13px', 
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            {skill}
          </span>
        ))}
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '16px', width: '100%', marginBottom: '32px' }}>
        {user.stats.map((stat, idx) => (
          <div key={idx} style={{ 
            background: 'white', 
            border: '1px solid #E9ECEF', 
            borderRadius: '16px', 
            padding: '20px 10px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)' 
          }}>
            <div style={{ marginBottom: '12px' }}>{stat.icon}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '4px' }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#6C757D', textAlign: 'center' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Achievements / Badge Grid */}
      <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '20px', padding: '24px', width: '100%', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={18} color="#FFD700" /> Earned Milestone Badges
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            {
              id: 'first_code',
              title: 'First Code',
              desc: 'First project submit',
              emoji: '🥇',
              earned: registeredEventsCount > 0
            },
            {
              id: 'screening_cleared',
              title: 'Scholar',
              desc: 'Screening Cleared',
              emoji: '🎓',
              earned: profileData?.assessmentCompleted || profileData?.loginStreak >= 2 || (profileData?.certificates > 0)
            },
            {
              id: 'cert_holder',
              title: 'Champ',
              desc: 'Certificate Holder',
              emoji: '🏆',
              earned: profileData?.certificates > 0
            }
          ].map(badge => (
            <div 
              key={badge.id} 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 8px',
                borderRadius: '12px',
                background: badge.earned ? 'rgba(123, 97, 255, 0.05)' : '#F8F9FA',
                border: badge.earned ? '1.5px solid rgba(123, 97, 255, 0.2)' : '1.5px dashed #E9ECEF',
                opacity: badge.earned ? 1 : 0.6,
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '28px', marginBottom: '8px', filter: badge.earned ? 'none' : 'grayscale(100%)' }}>
                {badge.emoji}
              </span>
              <strong style={{ fontSize: '13px', color: badge.earned ? '#1A1A1A' : '#6C757D', display: 'block', marginBottom: '2px' }}>
                {badge.title}
              </strong>
              <span style={{ fontSize: '10px', color: '#6C757D' }}>
                {badge.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar for Upcoming Achievement */}
        <div style={{ borderTop: '1px solid #E9ECEF', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
            <span>Elite Badge (Join 5 Events)</span>
            <span>{Math.min(registeredEventsCount, 5)} / 5</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: '#F1F3F5', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${Math.min((registeredEventsCount / 5) * 100, 100)}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #7B61FF, #9D88FF)', 
              borderRadius: '4px',
              transition: 'width 0.5s ease-out'
            }} />
          </div>
          <p style={{ fontSize: '11px', color: '#6C757D', marginTop: '6px' }}>
            {registeredEventsCount >= 5 ? '🎉 Achievement Unlocked!' : `Complete ${5 - registeredEventsCount} more event(s) to unlock Elite Badge.`}
          </p>
        </div>
      </div>

      {/* Action Links */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {user.links.map((link, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(link.path)}
            style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'transparent',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {link.icon}
              </div>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#1A1A1A' }}>{link.label}</span>
            </div>
            <ChevronRight size={20} color="#6C757D" />
          </div>
        ))}
      </div>

    </div>
  );
}

// Simple internal icon for Calendar to avoid importing generic one if it conflicts
function CalendarIcon(props) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}
