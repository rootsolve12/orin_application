import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, getUserRegistrations, getUserCertificates, updateUserProfile } from '../firebase/firestore';
import { 
  Trophy, Award, BookOpen, Settings, MapPin, Edit2, Camera, Download, Share2, 
  CheckCircle, Plus, Search, Check, Briefcase, GraduationCap, Mail, X, TrendingUp, 
  PieChart, Activity, Zap, Star, Shield, PlayCircle, FolderOpen, Heart, ShieldAlert,
  Users, Clock
} from 'lucide-react';

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Editable Skills State
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // Edit Profile Modal State
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    displayName: '',
    institution: '',
    department: '',
    graduationYear: '',
    bio: ''
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (currentUser) {
        try {
          const [profile, regs, certs] = await Promise.all([
            getUserProfile(currentUser.uid),
            getUserRegistrations(currentUser.uid),
            getUserCertificates(currentUser.uid)
          ]);
          setProfileData(profile);
          setRegistrations(regs);
          setCertificates(certs);
          setSkills(profile?.techStack || ['React.js', 'Python', 'Leadership', 'Problem Solving']);
        } catch (err) {
          console.error("Error fetching profile", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [currentUser, refreshKey]);

  if (loading) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>Loading Dashboard...</div>;
  }

  if (!currentUser || !profileData) {
    return <div style={{ padding: '80px', textAlign: 'center' }}>Please log in to view your profile.</div>;
  }

  const handleOpenEditModal = () => {
    setEditFormData({
      displayName: profileData.displayName || currentUser.displayName || '',
      institution: profileData.institution || '',
      department: profileData.department || '',
      graduationYear: profileData.graduationYear || '',
      bio: profileData.bio || ''
    });
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(currentUser.uid, editFormData);
      setIsEditProfileModalOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile changes.');
    }
  };

  const handleAddSkill = async () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updated = [...skills, newSkill.trim()];
      setSkills(updated);
      await updateUserProfile(currentUser.uid, { techStack: updated });
    }
    setNewSkill('');
    setIsAddingSkill(false);
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updated = skills.filter(s => s !== skillToRemove);
    setSkills(updated);
    await updateUserProfile(currentUser.uid, { techStack: updated });
  };

  const initial = (profileData.displayName || currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase();

  // Dynamic Timeline generation from registrations and certificates
  const timelineActivity = [
    ...registrations.map(r => ({
      type: 'registration',
      title: `Registered for ${r.eventName || 'an event'}`,
      time: r.registeredAt ? new Date(r.registeredAt.seconds * 1000).toLocaleDateString() : 'Recently',
      icon: <Plus size={16} />
    })),
    ...certificates.map(c => ({
      type: 'certificate',
      title: `Earned certificate for ${c.eventName || 'an event'}`,
      time: c.issuedAt ? new Date(c.issuedAt.seconds * 1000).toLocaleDateString() : 'Recently',
      icon: <Award size={16} />
    }))
  ].slice(0, 5); // take latest 5

  const badges = profileData?.badges || [];
  const portfolio = profileData?.portfolio || [];

  // Helper styles
  const cardStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border-light)',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column'
  };

  const sectionHeaderStyle = {
    fontSize: '20px',
    fontWeight: '800',
    color: 'var(--text-light)',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '32px 24px', paddingBottom: '100px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* --- HEADER --- */}
        <div style={{ ...cardStyle, flexDirection: window.innerWidth > 768 ? 'row' : 'column', gap: '32px', alignItems: 'center', padding: '32px', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle background glow */}
          <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'var(--primary)', opacity: 0.1, filter: 'blur(100px)', borderRadius: '50%' }} />

          {/* Avatar Area */}
          <div style={{ position: 'relative' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '4px solid var(--surface)', boxShadow: '0 8px 32px rgba(109, 40, 217, 0.3)' }}>
              {profileData.avatarUrl ? (
                <img src={profileData.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '48px', fontWeight: '800', color: 'white' }}>{initial}</span>
              )}
            </div>
            <button className="touch-target" style={{ position: 'absolute', bottom: '0', right: '0', width: '36px', height: '36px', background: 'var(--text-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface)', cursor: 'pointer' }}>
              <Camera size={16} color="var(--bg-light)" />
            </button>
          </div>

          {/* Info Area */}
          <div style={{ flex: 1, textAlign: window.innerWidth > 768 ? 'left' : 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: window.innerWidth > 768 ? 'flex-start' : 'center', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-light)', margin: 0, letterSpacing: '-0.5px' }}>
                {profileData.displayName || currentUser.displayName || 'Developer'}
              </h1>
              <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}>
                {profileData.role === 'organizer' ? 'Organizer' : 'Participant'}
              </span>
            </div>
            
            <p style={{ fontSize: '16px', color: 'var(--text-light)', fontWeight: '500', marginBottom: '16px' }}>
              {profileData.bio || 'Passionate developer building the future, one hackathon at a time.'}
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: window.innerWidth > 768 ? 'flex-start' : 'center', color: 'var(--muted-light)', fontSize: '13px', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Briefcase size={14} /> {profileData.institution || 'Add Institution'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BookOpen size={14} /> {profileData.department || 'Computer Science'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><GraduationCap size={14} /> Year {profileData.graduationYear || '2026'}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {currentUser.email}</span>
            </div>
          </div>

          {/* Completion & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '240px' }}>
            <div style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)' }}>Profile Completion</span>
                <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--primary)' }}>92%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--primary-light)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ width: '92%', height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={12} color="#10B981" /> Suggestion: Upload Resume
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleOpenEditModal} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}><Edit2 size={14} /> Edit</button>
              <button style={{ flex: 1, background: 'var(--bg-light)', border: '1px solid var(--border-light)', color: 'var(--text-light)', padding: '10px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><Share2 size={14} /> Share</button>
              <button style={{ width: '40px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', color: 'var(--text-light)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Download size={14} /></button>
            </div>
          </div>
        </div>



        {/* --- RESPONSIVE STATISTICS --- */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
          {[
            { label: 'Events Joined', value: registrations.length, icon: <Activity color="#8B5CF6" /> },
            { label: 'Active Regs', value: registrations.length, icon: <PlayCircle color="#10B981" /> },
            { label: 'Certificates', value: certificates.length, icon: <Award color="#F59E0B" /> },
            { label: 'Achievements', value: badges.length, icon: <Trophy color="#EF4444" /> },
            { label: 'Skills Added', value: skills.length, icon: <Zap color="#F97316" /> },
            { label: 'Profile Views', value: profileData.views || 0, icon: <Star color="#EC4899" /> }
          ].map((stat, idx) => (
            <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-light)' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted-light)', textTransform: 'uppercase', textAlign: 'center' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* --- MAIN GRID (LEFT/RIGHT) --- */}
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 900 ? '1fr 380px' : '1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Timeline */}
            <div style={cardStyle}>
              <h2 style={sectionHeaderStyle}><Clock size={20} color="var(--primary)" /> Recent Activity Timeline</h2>
              {timelineActivity.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', paddingLeft: '16px' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '23px', width: '2px', background: 'var(--border-light)' }} />
                  {timelineActivity.map((act, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginTop: '4px', border: '3px solid var(--surface)' }} />
                      <div style={{ flex: 1, background: 'var(--bg-light)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-light)' }}>{act.title}</span>
                          <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '600' }}>{act.time}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted-light)' }}>
                          {act.icon} {act.type.charAt(0).toUpperCase() + act.type.slice(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-light)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: 0 }}>No recent activity to display.</p>
                </div>
              )}
            </div>

            {/* Academic Portfolio */}
            <div style={cardStyle}>
              <h2 style={sectionHeaderStyle}><Briefcase size={20} color="var(--primary)" /> Academic Portfolio</h2>
              {portfolio.length > 0 ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {portfolio.map((item, idx) => (
                      <div key={idx} style={{ padding: '16px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '4px' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--muted-light)', fontWeight: '600' }}>{item.role} • {item.type}</div>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', background: 'rgba(123, 97, 255, 0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                          {item.date}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button style={{ marginTop: '16px', background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: '800', cursor: 'pointer', alignSelf: 'center' }}>View Full Portfolio</button>
                </>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-light)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: 0 }}>Add projects to your portfolio.</p>
                </div>
              )}
            </div>

            {/* Recent Certificates */}
            <div style={cardStyle}>
              <h2 style={sectionHeaderStyle}><Award size={20} color="var(--primary)" /> Recent Certificates</h2>
              {certificates.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {certificates.slice(0, 3).map((cert, idx) => (
                    <div key={cert.id || idx} style={{ border: '1px solid var(--border-light)', borderRadius: '16px', overflow: 'hidden' }}>
                      <div style={{ height: '120px', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Award size={40} color="var(--muted-light)" opacity={0.5} />
                      </div>
                      <div style={{ padding: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-light)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cert.eventName || 'Verified Certificate'}</div>
                        <div style={{ fontSize: '11px', color: '#10B981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><CheckCircle size={10} /> Verified on Blockchain</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-light)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
                  <Award size={48} color="var(--muted-light)" style={{ marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '8px' }}>No Certificates Yet</h3>
                  <p style={{ fontSize: '13px', color: 'var(--muted-light)', marginBottom: '16px' }}>Participate in events and complete assessments to earn verified certificates.</p>
                  <button className="btn-primary" onClick={() => navigate('/explore')} style={{ padding: '8px 24px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>Explore Events</button>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Achievements & Badges */}
            <div style={cardStyle}>
              <h2 style={sectionHeaderStyle}><ShieldAlert size={20} color="var(--primary)" /> Achievements</h2>
              {badges.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {badges.map((b, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-light)', border: '1px solid var(--border-light)', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 140px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        {b.icon || <Shield size={16} color="var(--primary)" />}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', lineHeight: '1.2' }}>{b.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-light)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
                  <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: 0 }}>No badges earned yet.</p>
                </div>
              )}
            </div>

            {/* Skills & Technologies */}
            <div style={cardStyle}>
              <h2 style={sectionHeaderStyle}><Zap size={20} color="var(--primary)" /> Skills & Tech</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                {skills.map(skill => (
                  <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(123, 97, 255, 0.1)', border: '1px solid rgba(123, 97, 255, 0.2)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} style={{ background: 'none', border: 'none', color: 'var(--primary)', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={12} /></button>
                  </div>
                ))}
              </div>
              {isAddingSkill ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="e.g. Node.js" style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', fontSize: '13px', outline: 'none' }} autoFocus onKeyDown={e => e.key === 'Enter' && handleAddSkill()} />
                  <button onClick={handleAddSkill} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>Add</button>
                  <button onClick={() => setIsAddingSkill(false)} style={{ background: 'none', border: 'none', color: 'var(--muted-light)', cursor: 'pointer' }}><X size={16} /></button>
                </div>
              ) : (
                <button onClick={() => setIsAddingSkill(true)} style={{ background: 'var(--bg-light)', border: '1px dashed var(--primary)', color: 'var(--primary)', padding: '8px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Plus size={14} /> Add Skill
                </button>
              )}
            </div>

            {/* Participation Insights */}
            <div style={cardStyle}>
              <h2 style={sectionHeaderStyle}><TrendingUp size={20} color="var(--primary)" /> Insights</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)' }}>Event Completion Rate</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-light)' }}>{profileData?.insights?.completionRate || 0}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-light)', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${profileData?.insights?.completionRate || 0}%`, height: '100%', background: '#10B981', borderRadius: '4px' }} /></div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)' }}>Win / Top 10 Rate</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-light)' }}>{profileData?.insights?.winRate || 0}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-light)', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${profileData?.insights?.winRate || 0}%`, height: '100%', background: '#F59E0B', borderRadius: '4px' }} /></div>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.05), rgba(16, 185, 129, 0.05))', border: '1px solid rgba(123, 97, 255, 0.2)' }}>
              <h2 style={sectionHeaderStyle}><Search size={20} color="var(--primary)" /> AI Recommendations</h2>
              <p style={{ fontSize: '13px', color: 'var(--muted-light)', marginBottom: '16px', lineHeight: '1.5' }}>Based on your skills (React, Python), we think you'll love these upcoming events:</p>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: '16px', marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '4px' }}>Global AI Hackathon 2026</div>
                <div style={{ fontSize: '12px', color: 'var(--muted-light)', marginBottom: '12px' }}>Online • Team of 4</div>
                <button className="btn-primary" style={{ width: '100%', padding: '8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>Register Now</button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {isEditProfileModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '24px' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px', border: '1px solid var(--border-light)' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: 'var(--text-light)' }}>Edit Profile</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type="text" value={editFormData.displayName} onChange={e => setEditFormData({ ...editFormData, displayName: e.target.value })} placeholder="Full Name" style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', outline: 'none' }} />
              <input type="text" value={editFormData.institution} onChange={e => setEditFormData({ ...editFormData, institution: e.target.value })} placeholder="Institution Name" style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', outline: 'none' }} />
              <input type="text" value={editFormData.department} onChange={e => setEditFormData({ ...editFormData, department: e.target.value })} placeholder="Department (e.g. Computer Science)" style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', outline: 'none' }} />
              <input type="text" value={editFormData.graduationYear} onChange={e => setEditFormData({ ...editFormData, graduationYear: e.target.value })} placeholder="Graduation Year (e.g. 2026)" style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', outline: 'none' }} />
              <textarea value={editFormData.bio} onChange={e => setEditFormData({ ...editFormData, bio: e.target.value })} placeholder="Short professional bio..." style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', minHeight: '100px', resize: 'vertical', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button onClick={() => setIsEditProfileModalOpen(false)} style={{ flex: 1, padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveProfile} className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '700' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
