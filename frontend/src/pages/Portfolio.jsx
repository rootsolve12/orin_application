import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Award, 
  BookOpen, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit, 
  ExternalLink, 
  Globe, 
  Calendar, 
  ArrowLeft, 
  X, 
  Briefcase, 
  FileText, 
  Code,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserProfile, 
  getUserAchievements, 
  addAchievement, 
  updateAchievement, 
  deleteAchievement 
} from '../firebase/firestore';

const GITHUB_SVG = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ display: 'block' }}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const LINKEDIN_SVG = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ display: 'block' }}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const ACHIEVEMENT_TYPES = [
  { value: 'Hackathon', label: '🏆 Hackathon & Contest' },
  { value: 'Project', label: '💻 Coding Project' },
  { value: 'Certification', label: '📜 Professional Certification' },
  { value: 'Academic', label: '🎓 Academic Award' },
  { value: 'Other', label: '✨ Other Accomplishment' },
];

export default function Portfolio() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formIssuer, setFormIssuer] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState('Hackathon');
  const [formDescription, setFormDescription] = useState('');
  const [formLink, setFormLink] = useState('');

  const fetchPortfolioData = async () => {
    if (currentUser) {
      try {
        const [profile, achs] = await Promise.all([
          getUserProfile(currentUser.uid),
          getUserAchievements(currentUser.uid)
        ]);
        setProfileData(profile);
        setAchievements(achs);
      } catch (err) {
        console.error("Error fetching portfolio details:", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPortfolioData();
  }, [currentUser]);

  const openAddModal = () => {
    setModalType('add');
    setEditingId(null);
    setFormTitle('');
    setFormIssuer('');
    setFormDate(new Date().toLocaleDateString('en-CA'));
    setFormType('Hackathon');
    setFormDescription('');
    setFormLink('');
    setErrorMessage('');
    setModalOpen(true);
  };

  const openEditModal = (ach) => {
    setModalType('edit');
    setEditingId(ach.id);
    setFormTitle(ach.title || '');
    setFormIssuer(ach.issuer || '');
    setFormDate(ach.date || new Date().toLocaleDateString('en-CA'));
    setFormType(ach.type || 'Hackathon');
    setFormDescription(ach.description || '');
    setFormLink(ach.link || '');
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setErrorMessage('Title is required.');
      return;
    }
    setSaving(true);
    setErrorMessage('');
    
    const data = {
      title: formTitle,
      issuer: formIssuer,
      date: formDate,
      type: formType,
      description: formDescription,
      link: formLink,
    };

    try {
      if (modalType === 'add') {
        await addAchievement(currentUser.uid, data);
        showFeedback('Achievement posted successfully!');
      } else {
        await updateAchievement(editingId, data);
        showFeedback('Achievement updated successfully!');
      }
      setModalOpen(false);
      fetchPortfolioData();
    } catch (err) {
      console.error("Error saving achievement:", err);
      setErrorMessage(err.message || 'Failed to save achievement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (achId) => {
    if (window.confirm("Are you sure you want to delete this achievement?")) {
      try {
        await deleteAchievement(achId);
        showFeedback('Achievement deleted.');
        fetchPortfolioData();
      } catch (err) {
        console.error("Error deleting achievement:", err);
        alert("Failed to delete achievement.");
      }
    }
  };

  const showFeedback = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getTypeBadgeStyles = (type) => {
    switch(type) {
      case 'Hackathon':
        return { bg: 'rgba(255, 193, 7, 0.08)', color: '#FFC107', border: 'rgba(255, 193, 7, 0.2)' };
      case 'Project':
        return { bg: 'rgba(23, 162, 184, 0.08)', color: '#17A2B8', border: 'rgba(23, 162, 184, 0.2)' };
      case 'Certification':
        return { bg: 'rgba(40, 167, 69, 0.08)', color: '#28A745', border: 'rgba(40, 167, 69, 0.2)' };
      case 'Academic':
        return { bg: 'rgba(0, 123, 255, 0.08)', color: '#007BFF', border: 'rgba(0, 123, 255, 0.2)' };
      default:
        return { bg: 'rgba(123, 97, 255, 0.08)', color: '#7B61FF', border: 'rgba(123, 97, 255, 0.2)' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#F8F9FA' }}>
        <Loader2 className="animate-spin" size={36} color="var(--primary)" />
        <span style={{ marginLeft: '12px', fontWeight: '600', color: '#6C757D' }}>Loading Portfolio...</span>
      </div>
    );
  }

  const user = {
    name: profileData?.displayName || currentUser?.displayName || 'quizhb45',
    email: currentUser?.email || 'quizhb45@example.com',
    institution: profileData?.institution || 'Simats University',
    department: profileData?.department || 'Computer Science Engineering',
    degreeProgram: profileData?.degreeProgram || 'B.E. / B.Tech',
    academicYear: profileData?.academicYear || '4th Year',
    skills: profileData?.skills || [],
    interests: profileData?.interests || [],
    photoURL: profileData?.photoURL || currentUser?.photoURL,
    resumeUrl: profileData?.resumeUrl,
    github: profileData?.github,
    linkedin: profileData?.linkedin,
    leetcode: profileData?.leetcode,
    kaggle: profileData?.kaggle,
    portfolioUrl: profileData?.portfolioUrl,
  };

  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'Q';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px', color: '#1A1A1A' }}>
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/profile')} 
        style={{ background: 'none', border: 'none', color: '#6C757D', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', marginBottom: '28px', transition: 'color 0.2s' }}
        onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
        onMouseLeave={(e) => e.target.style.color = '#6C757D'}
      >
        <ArrowLeft size={18} /> Back to Profile
      </button>

      {/* Floating Alert Messages */}
      {successMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 10005, padding: '14px 20px', background: '#E2F0D9', borderLeft: '5px solid #28A745', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', color: '#385723', animation: 'slideIn 0.3s ease-out' }}>
          <CheckCircle size={18} />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{successMessage}</span>
        </div>
      )}

      {/* Grid container: Left sidebar, Right main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Large screen layout grid config */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 900px) {
            .portfolio-grid-layout {
              grid-template-columns: 320px 1fr !important;
            }
          }
          @keyframes slideIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}} />

        <div className="portfolio-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          
          {/* ── LEFT SIDEBAR: User Card ── */}
          <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '24px', padding: '32px 24px', boxShadow: '0 8px 24px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            
            {/* User Avatar */}
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.name} style={{ width: '110px', height: '110px', borderRadius: '24px', objectFit: 'cover', boxShadow: '0 8px 24px rgba(123, 97, 255, 0.15)', marginBottom: '16px' }} />
            ) : (
              <div style={{ width: '110px', height: '110px', background: 'linear-gradient(135deg, #7B61FF, #9D88FF)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '48px', fontWeight: 'bold', boxShadow: '0 8px 24px rgba(123, 97, 255, 0.15)', marginBottom: '16px' }}>
                {initial}
              </div>
            )}

            {/* Basic details */}
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px' }}>{user.name}</h2>
            <p style={{ color: '#6C757D', fontSize: '13px', marginBottom: '16px' }}>{user.email}</p>
            
            <div style={{ width: '100%', borderTop: '1px solid #F1F3F5', margin: '16px 0' }} />

            {/* Academic details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', textAlign: 'left', fontSize: '13px', color: '#495057', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="#6C757D" />
                <span style={{ fontWeight: '500' }}>{user.institution}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} color="#6C757D" />
                <span>{user.degreeProgram} · {user.academicYear}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={16} color="#6C757D" />
                <span>{user.department}</span>
              </div>
            </div>

            {/* Social Icons row */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
              {user.portfolioUrl && (
                <a href={user.portfolioUrl} target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057', transition: 'all 0.2s' }} title="Personal Website">
                  <Globe size={18} />
                </a>
              )}
              {user.github && (
                <a href={user.github} target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057', transition: 'all 0.2s' }} title="GitHub">
                  {GITHUB_SVG}
                </a>
              )}
              {user.linkedin && (
                <a href={user.linkedin} target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057', transition: 'all 0.2s' }} title="LinkedIn">
                  {LINKEDIN_SVG}
                </a>
              )}
              {user.leetcode && (
                <a href={user.leetcode} target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057', transition: 'all 0.2s', fontWeight: 'bold', textDecoration: 'none', fontSize: '11px' }} title="LeetCode">
                  LC
                </a>
              )}
              {user.kaggle && (
                <a href={user.kaggle} target="_blank" rel="noreferrer" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F3F5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057', transition: 'all 0.2s', fontWeight: 'bold', textDecoration: 'none', fontSize: '11px' }} title="Kaggle">
                  K
                </a>
              )}
            </div>

            {/* Resume button */}
            {user.resumeUrl && (
              <a href={user.resumeUrl} target="_blank" rel="noreferrer" style={{ width: '100%', textDecoration: 'none' }}>
                <button style={{ width: '100%', padding: '12px', background: 'rgba(123, 97, 255, 0.08)', border: 'none', color: 'var(--primary)', fontWeight: '700', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', transition: 'all 0.2s' }}>
                  <FileText size={16} /> View Resume
                </button>
              </a>
            )}

            {/* Skills section */}
            {user.skills.length > 0 && (
              <div style={{ width: '100%', textAlign: 'left', marginTop: '24px' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', color: '#8F9CAE', marginBottom: '12px' }}>Skills</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {user.skills.map((skill, i) => (
                    <span key={i} style={{ padding: '6px 12px', background: '#F8F9FA', border: '1px solid #E9ECEF', borderRadius: '20px', fontSize: '11px', fontWeight: '600', color: '#495057' }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests section */}
            {user.interests.length > 0 && (
              <div style={{ width: '100%', textAlign: 'left', marginTop: '24px' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', color: '#8F9CAE', marginBottom: '12px' }}>Interests</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {user.interests.map((interest, i) => (
                    <span key={i} style={{ padding: '6px 12px', background: '#F8F9FA', border: '1px solid #E9ECEF', borderRadius: '20px', fontSize: '11px', fontWeight: '600', color: '#495057' }}>
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT MAIN PANEL: Portfolio & Achievements ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Header with "+ Post" button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Trophy size={28} color="var(--primary)" /> Portfolio & Achievements
                </h1>
                <p style={{ color: '#6C757D', fontSize: '14px', marginTop: '4px' }}>Showcase your hackathons, projects, coding wins, and credentials.</p>
              </div>

              <button 
                onClick={openAddModal}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '12px 20px', 
                  background: 'linear-gradient(135deg, #7B61FF, #9D88FF)', 
                  border: 'none', 
                  color: 'white', 
                  fontWeight: '700', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  boxShadow: '0 4px 16px rgba(123,97,255,0.25)', 
                  transition: 'all 0.2s',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(123,97,255,0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(123,97,255,0.25)';
                }}
              >
                <Plus size={18} /> Post Achievement
              </button>
            </div>

            {/* Achievements List */}
            {achievements.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                {achievements.map((ach) => {
                  const style = getTypeBadgeStyles(ach.type);
                  return (
                    <div 
                      key={ach.id} 
                      style={{ 
                        background: 'white', 
                        border: '1px solid var(--border-light)', 
                        borderRadius: '20px', 
                        padding: '24px', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.01)', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        position: 'relative',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.01)';
                      }}
                    >
                      {/* Action buttons (Absolute positioned top right) */}
                      <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => openEditModal(ach)}
                          style={{ background: 'none', border: 'none', color: '#6C757D', cursor: 'pointer', padding: '4px', borderRadius: '6px', transition: 'color 0.2s' }}
                          title="Edit achievement"
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#6C757D'}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(ach.id)}
                          style={{ background: 'none', border: 'none', color: '#6C757D', cursor: 'pointer', padding: '4px', borderRadius: '6px', transition: 'color 0.2s' }}
                          title="Delete achievement"
                          onMouseEnter={(e) => e.currentTarget.style.color = '#DC3545'}
                          onMouseLeave={(e) => e.currentTarget.style.color = '#6C757D'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Achievement Details */}
                      <div>
                        {/* Header type badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                          <span style={{ 
                            background: style.bg, 
                            color: style.color, 
                            border: `1px solid ${style.border}`, 
                            padding: '4px 10px', 
                            borderRadius: '8px', 
                            fontSize: '11px', 
                            fontWeight: '800',
                            textTransform: 'uppercase'
                          }}>
                            {ach.type}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6C757D' }}>
                            <Calendar size={12} /> {ach.date}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px', paddingRight: '64px', lineHeight: '1.4' }}>
                          {ach.title}
                        </h3>

                        {/* Issuer */}
                        {ach.issuer && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#495057', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
                            <Award size={14} color="var(--primary)" />
                            {ach.issuer}
                          </div>
                        )}

                        {/* Description */}
                        {ach.description && (
                          <p style={{ fontSize: '14px', color: '#6C757D', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: '0 0 16px' }}>
                            {ach.description}
                          </p>
                        )}
                      </div>

                      {/* Footer Actions / Links */}
                      {ach.link && (
                        <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid #F1F3F5', paddingTop: '14px', marginTop: '12px' }}>
                          <a 
                            href={ach.link} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}
                          >
                            <ExternalLink size={14} /> View Reference/Certificate
                          </a>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty state */
              <div style={{ background: 'white', border: '2px dashed var(--border-light)', borderRadius: '24px', padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#F3F0FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '16px' }}>
                  <Trophy size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Your Portfolio is Empty</h3>
                <p style={{ color: '#6C757D', maxWidth: '420px', margin: '0 auto 24px', fontSize: '14px', lineHeight: '1.5' }}>
                  You haven't posted any achievements or projects yet. Click the button below to add your first accomplishment and build your profile!
                </p>
                <button 
                  onClick={openAddModal}
                  style={{ padding: '12px 24px', background: 'linear-gradient(135deg, #7B61FF, #9D88FF)', color: 'white', fontWeight: '700', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(123,97,255,0.2)' }}
                >
                  Post Your First Achievement
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ── DIALOG MODAL: Add/Edit Form ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div 
            style={{ 
              background: 'white', 
              width: '100%', 
              maxWidth: '520px', 
              borderRadius: '24px', 
              padding: '32px', 
              boxShadow: '0 24px 60px rgba(0,0,0,0.15)', 
              position: 'relative', 
              animation: 'slideIn 0.25s ease-out',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Close Button */}
            <button 
              onClick={() => setModalOpen(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#6C757D', cursor: 'pointer', padding: '4px', borderRadius: '50%' }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A1A', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {modalType === 'add' ? <Plus size={20} color="var(--primary)" /> : <Edit size={20} color="var(--primary)" />}
              {modalType === 'add' ? 'Post New Achievement' : 'Edit Achievement'}
            </h3>

            {/* Form */}
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {errorMessage && (
                <div style={{ padding: '12px', background: '#FFEBEE', color: '#DC3545', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={16} /> {errorMessage}
                </div>
              )}

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#495057' }}>Achievement Title *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. 1st Place - Smart India Hackathon" 
                  value={formTitle} 
                  onChange={e => setFormTitle(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E9ECEF', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAFA' }}
                />
              </div>

              {/* Grid: Type and Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#495057' }}>Category</label>
                  <select 
                    value={formType} 
                    onChange={e => setFormType(e.target.value)}
                    style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E9ECEF', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAFA' }}
                  >
                    {ACHIEVEMENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#495057' }}>Date Achieved</label>
                  <input 
                    type="date" 
                    value={formDate} 
                    onChange={e => setFormDate(e.target.value)}
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E9ECEF', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAFA' }}
                  />
                </div>
              </div>

              {/* Issuer */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#495057' }}>Issuer / Associated Org</label>
                <input 
                  type="text" 
                  placeholder="e.g. Ministry of Education / GitHub" 
                  value={formIssuer} 
                  onChange={e => setFormIssuer(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E9ECEF', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAFA' }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#495057' }}>Description</label>
                <textarea 
                  rows="3" 
                  placeholder="Briefly describe what you accomplished, the project developed, or tools used..." 
                  value={formDescription} 
                  onChange={e => setFormDescription(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E9ECEF', borderRadius: '10px', fontSize: '14px', outline: 'none', resize: 'vertical', background: '#FAFAFA', fontFamily: 'inherit' }}
                />
              </div>

              {/* Link */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#495057' }}>Reference URL / Link (Optional)</label>
                <input 
                  type="url" 
                  placeholder="e.g. https://github.com/project or certificate link" 
                  value={formLink} 
                  onChange={e => setFormLink(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E9ECEF', borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#FAFAFA' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  style={{ flex: 1, padding: '12px', border: '1.5px solid #E9ECEF', color: '#495057', background: 'white', fontWeight: '600', borderRadius: '12px', cursor: 'pointer', fontSize: '14px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  style={{ flex: 2, padding: '12px', border: 'none', color: 'white', background: 'linear-gradient(135deg, #7B61FF, #9D88FF)', fontWeight: '700', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Saving...
                    </>
                  ) : (
                    'Save Accomplishment'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
