import React, { useState, useEffect } from 'react';
import { 
  Trophy, Award, BookOpen, Settings, MapPin, ChevronRight, Edit2, Zap, 
  Calendar, ExternalLink, ShieldAlert, Sparkles, Star, Plus, X, Search, FileText, CheckCircle, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, getUserRegistrations, getUserCertificates, updateUserProfile, getOrganizerEvents } from '../firebase/firestore';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const getRoleLabel = (role) => {
    switch (role) {
      case 'web': return 'Web Developer 🌐';
      case 'mobile': return 'Mobile Developer 📱';
      case 'ai_data': return 'Data Scientist / AI 📊';
      case 'design': return 'UI/UX Designer 🎨';
      case 'security': return 'Security Engineer 🔒';
      default: return 'Developer 💻';
    }
  };

  const getExperienceLabel = (exp) => {
    switch (exp) {
      case 'novice': return 'Novice / Learner 🌱';
      case 'builder': return 'Intermediate Builder 🛠️';
      case 'veteran': return 'Hackathon Veteran 🏆';
      case 'expert': return 'Experienced Specialist 🧠';
      default: return 'Builder ⚡';
    }
  };

  const getTeamLabel = (style) => {
    switch (style) {
      case 'solo': return 'Solo Hacker 🧑‍💻';
      case 'player': return 'Team Player 👥';
      case 'leader': return 'Team Leader 👑';
      default: return 'Collaborator 🤝';
    }
  };
  
  const [profileData, setProfileData] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [detailedEvents, setDetailedEvents] = useState([]);
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal & Edit States
  const [isEditLinksModalOpen, setIsEditLinksModalOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [isEditBioModalOpen, setIsEditBioModalOpen] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isEditSkillModalOpen, setIsEditSkillModalOpen] = useState(false);
  const [isEditReputationModalOpen, setIsEditReputationModalOpen] = useState(false);
  const [editingSkillIndex, setEditingSkillIndex] = useState(null);
  const [editedSkill, setEditedSkill] = useState({ name: '', level: 'Intermediate', growth: '+10%' });

  // Form Field States
  const [editedLinks, setEditedLinks] = useState({
    linkedin: '',
    github: '',
    leetcode: '',
    kaggle: '',
    portfolio: ''
  });
  const [editedBio, setEditedBio] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [editedInstitution, setEditedInstitution] = useState('');
  const [newProject, setNewProject] = useState({
    title: '',
    category: 'Featured Work',
    description: '',
    link: '',
    tech: ''
  });
  const [newSkill, setNewSkill] = useState({
    name: '',
    level: 'Intermediate',
    growth: '+10%'
  });
  const [editedReputation, setEditedReputation] = useState({
    participationScore: 35,
    skillScore: 30,
    consistencyScore: 25,
    contributorRank: 849
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

          if (profile?.role === 'organizer') {
            try {
              const orgEvts = await getOrganizerEvents(currentUser.uid);
              setOrganizerEvents(orgEvts);
            } catch (err) {
              console.error("Error fetching organizer events:", err);
            }
          }

          // Populate edit states
          setEditedLinks({
            linkedin: profile?.professionalLinks?.linkedin || '',
            github: profile?.professionalLinks?.github || '',
            leetcode: profile?.professionalLinks?.leetcode || '',
            kaggle: profile?.professionalLinks?.kaggle || '',
            portfolio: profile?.professionalLinks?.portfolio || ''
          });
          setEditedBio(profile?.bio || '');
          setEditedLocation(profile?.location || 'Chennai, India');
          setEditedInstitution(profile?.institution || 'Simats University');
          // Calculate realistic reputation metrics based on database states
          const localEventsParticipated = regs.length || 3;
          const localSkillsCount = profile?.skillsWithLevel?.length || 3;
          const localCertsCount = certs.length || 0;
          const localStreak = profile?.loginStreak || 3;
          
          const calculatedParticipation = Math.min(10 + localEventsParticipated * 5, 100);
          const calculatedSkill = Math.min(5 + localSkillsCount * 5 + localCertsCount * 10, 100);
          const calculatedConsistency = Math.min(10 + localStreak * 5, 100);
          const calculatedRank = Math.max(1, 999 - localEventsParticipated * 50 - localCertsCount * 100);

          setEditedReputation({
            participationScore: profile?.academicReputation?.participationScore ?? calculatedParticipation,
            skillScore: profile?.academicReputation?.skillScore ?? calculatedSkill,
            consistencyScore: profile?.academicReputation?.consistencyScore ?? calculatedConsistency,
            contributorRank: profile?.academicReputation?.contributorRank ?? calculatedRank
          });

          // Fetch event details in parallel from subcollections
          const eventDetails = await Promise.all(
            regs.map(async (event) => {
              try {
                const [regDoc, assessDoc, subDoc] = await Promise.all([
                  getDoc(doc(db, 'events', event.id, 'registrations', currentUser.uid)),
                  getDoc(doc(db, 'events', event.id, 'assessments', currentUser.uid)),
                  getDoc(doc(db, 'events', event.id, 'submissions', currentUser.uid))
                ]);
                return {
                  eventId: event.id,
                  eventTitle: event.title,
                  registered: regDoc.exists() ? regDoc.data() : null,
                  assessment: assessDoc.exists() ? assessDoc.data() : null,
                  submission: subDoc.exists() ? subDoc.data() : null,
                  event
                };
              } catch (e) {
                console.warn("Error fetching details for event:", event.id, e);
                return null;
              }
            })
          );
          setDetailedEvents(eventDetails.filter(Boolean));
        } catch (err) {
          console.error("Firebase fetch error inside profile:", err);
        }
      }
      setLoading(false);
    };
    fetchProfileData();
  }, [currentUser, refreshKey]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', color: 'var(--text-light)', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <Zap size={40} color="var(--primary)" className="animate-pulse" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Loading Academic Identity...</h2>
        </div>
      </div>
    );
  }

  // Dynamic Data & Fallbacks
  const displayName = profileData?.displayName || currentUser?.displayName || 'Student Developer';
  const email = currentUser?.email || '';
  const location = profileData?.location || 'Not Specified';
  const institution = profileData?.institution || 'Not Specified';
  const bio = profileData?.bio || 'No bio added yet. Click the edit pencil to introduce yourself!';
  
  const professionalLinks = {
    linkedin: profileData?.linkedin || profileData?.professionalLinks?.linkedin || '',
    github: profileData?.github || profileData?.professionalLinks?.github || '',
    leetcode: profileData?.professionalLinks?.leetcode || '',
    kaggle: profileData?.professionalLinks?.kaggle || '',
    portfolio: profileData?.professionalLinks?.portfolio || ''
  };

  const skills = profileData?.skillsWithLevel || [];

  const projects = profileData?.projects !== undefined ? profileData.projects : [];

  // Derived Metrics
  const eventsParticipated = registrations.length || 0;
  const eventsCompletedCount = detailedEvents.filter(de => de.event?.status === 'Completed' || de.submission?.status === 'Shortlisted').length || 0;
  const assessmentsCompletedCount = detailedEvents.filter(de => de.assessment).length || 0;
  const projectsSubmittedCount = detailedEvents.filter(de => de.submission).length || 0;
  const communitiesJoinedCount = profileData?.joinedCommunities?.length || 0;

  const isOrganizer = profileData?.role === 'organizer';

  // Profile Strength Calculator
  const checkListItems = [
    { label: 'Academic Bio Filled', checked: !!profileData?.bio },
    { label: 'Professional Skills Added', checked: !!profileData?.skillsWithLevel?.length },
    { label: 'Resume Linked', checked: !!profileData?.resumeUrl },
    { label: 'LinkedIn Profile Connected', checked: !!profileData?.professionalLinks?.linkedin },
    { label: 'GitHub Connected', checked: !!profileData?.professionalLinks?.github },
    { label: 'LeetCode Connected', checked: !!profileData?.professionalLinks?.leetcode },
    { label: 'Projects Showcased', checked: !!profileData?.projects?.length }
  ];
  const completedCount = checkListItems.filter(item => item.checked).length;
  const profileStrength = Math.round((completedCount / checkListItems.length) * 100);

  // Scores (User inputted with realistic dynamic fallbacks)
  const defaultParticipation = Math.min(10 + eventsParticipated * 5 + eventsCompletedCount * 10, 100);
  const defaultSkill = Math.min(5 + skills.length * 5 + certificates.length * 10, 100);
  const defaultConsistency = Math.min(10 + (profileData?.loginStreak || 3) * 5, 100);
  const defaultRank = Math.max(1, 999 - eventsParticipated * 50 - certificates.length * 100);

  const participationScore = profileData?.academicReputation?.participationScore ?? defaultParticipation;
  const skillScore = profileData?.academicReputation?.skillScore ?? defaultSkill;
  const consistencyScore = profileData?.academicReputation?.consistencyScore ?? defaultConsistency;
  const contributorRank = profileData?.academicReputation?.contributorRank ?? defaultRank;

  // Profile Update Handlers
  const handleSaveLinks = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(currentUser.uid, { professionalLinks: editedLinks });
      setIsEditLinksModalOpen(false);
      setRefreshKey(k => k + 1);
      alert('Professional links updated successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to update links.');
    }
  };

  const handleSaveBio = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(currentUser.uid, { 
        bio: editedBio,
        location: editedLocation,
        institution: editedInstitution
      });
      setIsEditBioModalOpen(false);
      setRefreshKey(k => k + 1);
      alert('Profile details updated successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile details.');
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.title || !newProject.description) return alert("Please fill out Title and Description.");
    
    const techArray = newProject.tech.split(',').map(t => t.trim()).filter(Boolean);
    const updatedProjects = [...(profileData?.projects || []), {
      title: newProject.title,
      category: newProject.category,
      description: newProject.description,
      link: newProject.link,
      tech: techArray
    }];

    try {
      await updateUserProfile(currentUser.uid, { projects: updatedProjects });
      setIsAddProjectModalOpen(false);
      setNewProject({ title: '', category: 'Featured Work', description: '', link: '', tech: '' });
      setRefreshKey(k => k + 1);
      alert('New project added to portfolio.');
    } catch (err) {
      console.error(err);
      alert('Failed to add project.');
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.name) return alert("Please enter skill name.");

    const updatedSkills = [...(profileData?.skillsWithLevel || []), newSkill];
    try {
      await updateUserProfile(currentUser.uid, { skillsWithLevel: updatedSkills });
      setIsAddSkillModalOpen(false);
      setNewSkill({ name: '', level: 'Intermediate', growth: '+10%' });
      setRefreshKey(k => k + 1);
      alert('Skill progress added.');
    } catch (err) {
      console.error(err);
      alert('Failed to add skill.');
    }
  };

  const handleDeleteSkill = async (indexToDelete) => {
    const updatedSkills = skills.filter((_, idx) => idx !== indexToDelete);
    try {
      await updateUserProfile(currentUser.uid, { skillsWithLevel: updatedSkills });
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert("Failed to delete skill.");
    }
  };

  const handleOpenEditSkill = (index) => {
    setEditingSkillIndex(index);
    setEditedSkill(skills[index]);
    setIsEditSkillModalOpen(true);
  };

  const handleEditSkillSubmit = async (e) => {
    e.preventDefault();
    if (!editedSkill.name) return alert("Please enter skill name.");

    const updatedSkills = [...skills];
    updatedSkills[editingSkillIndex] = editedSkill;

    try {
      await updateUserProfile(currentUser.uid, { skillsWithLevel: updatedSkills });
      setIsEditSkillModalOpen(false);
      setEditingSkillIndex(null);
      setRefreshKey(k => k + 1);
      alert('Skill progress updated successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to update skill.');
    }
  };

  const handleDeleteProject = async (indexToDelete) => {
    if (window.confirm("Are you sure you want to remove this project from your portfolio?")) {
      const updatedProjects = projects.filter((_, idx) => idx !== indexToDelete);
      try {
        await updateUserProfile(currentUser.uid, { projects: updatedProjects });
        setRefreshKey(k => k + 1);
      } catch (err) {
        console.error(err);
        alert("Failed to delete project.");
      }
    }
  };

  const handleSaveReputation = async (e) => {
    e.preventDefault();
    try {
      await updateUserProfile(currentUser.uid, { academicReputation: editedReputation });
      setIsEditReputationModalOpen(false);
      setRefreshKey(k => k + 1);
      alert("Reputation metrics updated successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to update reputation metrics.");
    }
  };

  const initialLetter = displayName.charAt(0).toUpperCase();

  // Social Icon SVGs
  const renderSocialIcon = (type) => {
    switch (type) {
      case 'linkedin':
        return (
          <svg style={{ width: '18px', height: '18px' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
        );
      case 'github':
        return (
          <svg style={{ width: '18px', height: '18px' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
          </svg>
        );
      case 'leetcode':
        return (
          <svg style={{ width: '18px', height: '18px' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.102 17.93l-2.697 2.607c-.466.45-1.245.45-1.71 0l-5.865-5.665a1.166 1.166 0 010-1.657l2.697-2.607c.466-.45 1.245-.45 1.71 0l5.865 5.665a1.166 1.166 0 010 1.657zM20.242 13.93l-2.697 2.607c-.466.45-1.245.45-1.71 0l-5.865-5.665a1.166 1.166 0 010-1.657l2.697-2.607c.466-.45 1.245-.45 1.71 0l5.865 5.665a1.166 1.166 0 010 1.657zM8.345 5.564L5.648 8.17c-.466.45-.466 1.202 0 1.652l5.865 5.665c.466.45 1.245.45 1.71 0l2.697-2.606c.466-.45.466-1.202 0-1.652l-5.865-5.665a1.166 1.166 0 00-1.71 0z"/>
          </svg>
        );
      case 'kaggle':
        return (
          <svg style={{ width: '18px', height: '18px' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.8 3c-.4 0-.8.2-1 .5l-4.7 6.1-2.4-1.8V4c0-.6-.4-1-1-1H7.8c-.6 0-1 .4-1 1v16c0 .6.4 1 1 1h1.9c.6 0 1-.4 1-1v-5.6l2.1-1.6 5 7.7c.3.5.7.8 1.2.8h2.3c.7 0 1.1-.7.7-1.3l-6.3-9.5 5.9-7.7c.4-.6 0-1.4-.7-1.4H18.8z"/>
          </svg>
        );
      default:
        return <Globe size={18} />;
    }
  };

  return (
    <div style={{ 
      maxWidth: '1100px', 
      margin: '0 auto', 
      padding: '24px', 
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      color: 'var(--text-light)',
      background: 'var(--background)'
    }}>
      
      {/* 1. Header Banner & Profile Snapshot */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #9D88FF 100%)',
        borderRadius: '24px',
        padding: '36px',
        color: 'white',
        boxShadow: '0 10px 30px rgba(123, 97, 255, 0.2)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', zIndex: 2 }}>
          {/* Avatar Area */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '3px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: '800'
            }}>
              {initialLetter}
            </div>
            <button 
              onClick={() => setIsEditBioModalOpen(true)}
              style={{
                position: 'absolute',
                bottom: '-8px',
                right: '-8px',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: 'pointer'
              }}
            >
              <Edit2 size={12} color="#7B61FF" />
            </button>
          </div>

          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {displayName} <Sparkles size={20} color="#FFD700" fill="#FFD700" />
            </h1>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.25)', padding: '4px 12px', borderRadius: '12px', fontWeight: '700' }}>
                {getRoleLabel(profileData?.developerRole)}
              </span>
              <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.25)', padding: '4px 12px', borderRadius: '12px', fontWeight: '700' }}>
                {getExperienceLabel(profileData?.experienceLevel)}
              </span>
              <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.25)', padding: '4px 12px', borderRadius: '12px', fontWeight: '700' }}>
                {getTeamLabel(profileData?.teamStyle)}
              </span>
            </div>

            <p style={{ opacity: 0.9, fontSize: '14px', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} /> {location}
            </p>
            <p style={{ opacity: 0.7, fontSize: '12px', marginTop: '2px' }}>{email}</p>
          </div>
        </div>

        {/* 9. Profile Strength Meter */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          padding: '20px',
          minWidth: '280px',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700' }}>
            <span>Profile Strength Meter</span>
            <span>{profileStrength}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${profileStrength}%`, height: '100%', background: '#00F0FF', borderRadius: '4px', transition: 'width 0.4s' }} />
          </div>
          <span style={{ fontSize: '11px', opacity: 0.9, fontWeight: '500' }}>
            {completedCount === checkListItems.length ? '🥇 Academic Portfolio is fully complete!' : `Complete ${checkListItems.length - completedCount} more details to hit 100%`}
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="profile-grid">
        
        {/* LEFT COLUMN: Reputation, Skills, Professional Connections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Academic Bio Snapshot Card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.5px', margin: 0 }}>Academic Bio</h3>
              <button onClick={() => setIsEditBioModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-light)', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px' }}><Edit2 size={16} /></button>
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-light)', opacity: 0.85, whiteSpace: 'pre-wrap', margin: 0 }}>
              {bio}
            </p>
          </div>

          {!isOrganizer && (
            <>
              {/* 5. Academic Reputation Metrics */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.5px', margin: 0 }}>Reputation Center</h3>
                  <button onClick={() => setIsEditReputationModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-light)', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px' }}><Edit2 size={16} /></button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Contributor Rank */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Star size={16} color="#FFD700" fill="#FFD700" />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>Contributor Rank</span>
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-light)' }}>Rank #{contributorRank}</span>
                  </div>

                  {/* Participation Score */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                      <span>Participation Score</span>
                      <span>{participationScore}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-light)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${participationScore}%`, height: '100%', background: '#7B61FF', borderRadius: '3px' }} />
                    </div>
                  </div>

                  {/* Skill Score */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                      <span>Skill Score</span>
                      <span>{skillScore}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-light)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${skillScore}%`, height: '100%', background: '#3B82F6', borderRadius: '3px' }} />
                    </div>
                  </div>

                  {/* Consistency Score */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                      <span>Consistency Score</span>
                      <span>{consistencyScore}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--bg-light)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${consistencyScore}%`, height: '100%', background: '#10B981', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Skills Progress Tracking */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.5px', margin: 0 }}>Skills Progress</h3>
                  <button 
                    onClick={() => setIsAddSkillModalOpen(true)}
                    style={{ 
                      background: 'rgba(123, 97, 255, 0.08)', 
                      border: 'none', 
                      color: 'var(--primary)', 
                      borderRadius: '50%', 
                      width: '44px', 
                      height: '44px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      cursor: 'pointer' 
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {skills.map((skill, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700' }}>{skill.name}</span>
                          <button 
                            onClick={() => handleOpenEditSkill(idx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-light)', display: 'flex', alignItems: 'center', padding: 0 }}
                            title="Edit Skill"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSkill(idx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', padding: 0 }}
                            title="Remove Skill"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: '800', 
                            background: skill.level === 'Expert' ? '#EBFBEE' : '#EBF8FF', 
                            color: skill.level === 'Expert' ? '#2B8A3E' : '#1971C2',
                            padding: '2px 6px',
                            borderRadius: '6px',
                            textTransform: 'uppercase'
                          }}>{skill.level}</span>
                          <span style={{ fontSize: '10px', color: '#10B981', fontWeight: '800' }}>{skill.growth}</span>
                        </div>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'var(--bg-light)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: skill.level === 'Expert' ? '90%' : skill.level === 'Advanced' ? '75%' : '50%', 
                          height: '100%', 
                          background: 'var(--primary)', 
                          borderRadius: '3px' 
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 10. Resume and Professional Links */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.5px', margin: 0 }}>Professional Links</h3>
              <button onClick={() => setIsEditLinksModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-light)', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px' }}><Edit2 size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Resume */}
              {!isOrganizer && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="var(--primary)" /> Academic Resume
                  </span>
                  {profileData?.resumeUrl ? (
                    <a href={profileData.resumeUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '800', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      View <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '600' }}>Not Linked</span>
                  )}
                </div>
              )}

              {/* LinkedIn */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderSocialIcon('linkedin')} LinkedIn
                </span>
                {professionalLinks.linkedin ? (
                  <a href={professionalLinks.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '800', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Link <ExternalLink size={10} />
                  </a>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--muted-light)' }}>Not Linked</span>
                )}
              </div>

              {/* GitHub */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderSocialIcon('github')} GitHub
                </span>
                {professionalLinks.github ? (
                  <a href={professionalLinks.github} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '800', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Link <ExternalLink size={10} />
                  </a>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--muted-light)' }}>Not Linked</span>
                )}
              </div>

              {/* LeetCode */}
              {!isOrganizer && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {renderSocialIcon('leetcode')} LeetCode
                  </span>
                  {professionalLinks.leetcode ? (
                    <a href={professionalLinks.leetcode} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '800', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      Link <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--muted-light)' }}>Not Linked</span>
                  )}
                </div>
              )}

              {/* Kaggle */}
              {!isOrganizer && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {renderSocialIcon('kaggle')} Kaggle
                  </span>
                  {professionalLinks.kaggle ? (
                    <a href={professionalLinks.kaggle} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '800', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      Link <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--muted-light)' }}>Not Linked</span>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Journey, Stats, Portfolio, Certificates, Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {isOrganizer ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: '20px', marginTop: 0 }}>Hosted Events Record</h3>
              {organizerEvents.length === 0 ? (
                <div style={{ padding: '36px 24px', textAlign: 'center', background: 'var(--bg-light)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
                  <Calendar size={32} color="var(--muted-light)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: 0, fontWeight: '500' }}>No hosted hackathons or events found in your record yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {organizerEvents.map((evt, index) => (
                    <div key={index} style={{ borderBottom: index < organizerEvents.length - 1 ? '1px solid var(--border-light)' : 'none', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>{evt.title}</h4>
                        <span style={{ fontSize: '11px', background: '#ECFDF5', color: '#059669', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>{evt.status || 'Active'}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: '6px 0 10px 0', lineHeight: '1.4' }}>{evt.description}</p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted-light)', fontWeight: '600' }}>
                        <span>👥 {evt.registeredCount || 0} Registered</span>
                        <span>📍 {evt.mode}</span>
                        <span>📅 {new Date(evt.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* 1. Academic Journey Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Events Joined', value: eventsParticipated, color: '#7B61FF' },
                  { label: 'Events Finished', value: eventsCompletedCount, color: '#10B981' },
                  { label: 'Tests Completed', value: assessmentsCompletedCount, color: '#3B82F6' },
                  { label: 'Workspace Uploads', value: projectsSubmittedCount, color: '#F59E0B' }
                ].map((stat, idx) => (
                  <div key={idx} style={{ 
                    background: 'white', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: '16px', 
                    padding: '16px',
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
                  }}>
                    <span style={{ fontSize: '26px', fontWeight: '800', color: stat.color, display: 'block', marginBottom: '4px' }}>{stat.value}</span>
                    <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '700', textTransform: 'uppercase' }}>{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* 8. Event Performance Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                {/* Event Stats */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '16px', borderBottom: '1.5px solid var(--border-light)', paddingBottom: '8px' }}>Event Performance</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--muted-light)' }}>Registrations</span>
                      <span style={{ fontWeight: '700' }}>{eventsParticipated}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--muted-light)' }}>Completions</span>
                      <span style={{ fontWeight: '700' }}>{eventsCompletedCount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--muted-light)' }}>Shortlists / Review</span>
                      <span style={{ fontWeight: '700' }}>{detailedEvents.filter(de => de.submission?.status === 'Shortlisted').length || 1}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--muted-light)' }}>Wins / Awards</span>
                      <span style={{ fontWeight: '700', color: '#10B981' }}>{certificates.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Portfolio Showcase */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.5px', margin: 0 }}>Portfolio Showcase</h3>
                  <button 
                    onClick={() => setIsAddProjectModalOpen(true)}
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 18px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minHeight: '44px'
                    }}
                  >
                    <Plus size={14} /> Add Project
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {projects.map((proj, idx) => (
                    <div 
                      key={idx}
                      style={{
                        background: 'var(--bg-light)',
                        borderRadius: '14px',
                        padding: '16px',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ 
                            fontSize: '9px', 
                            fontWeight: '800', 
                            background: 'rgba(123, 97, 255, 0.1)', 
                            color: 'var(--primary)', 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            textTransform: 'uppercase'
                          }}>{proj.category}</span>
                          <h4 style={{ fontSize: '15px', fontWeight: '700', marginTop: '6px', color: 'var(--text-light)', margin: '6px 0 2px 0' }}>{proj.title}</h4>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {proj.link && (
                            <a href={proj.link} target="_blank" rel="noreferrer" style={{ color: 'var(--muted-light)', transition: 'color 0.2s', display: 'flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--muted-light)'}>
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <button 
                            onClick={() => handleDeleteProject(idx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', padding: 0 }}
                            title="Delete Project"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <p style={{ fontSize: '13px', color: 'var(--muted-light)', lineHeight: '1.4', margin: 0 }}>{proj.description}</p>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                        {proj.tech?.map((tag, tIdx) => (
                          <span key={tIdx} style={{ fontSize: '10px', background: 'white', color: 'var(--text-light)', border: '1px solid var(--border-light)', padding: '2px 8px', borderRadius: '8px', fontWeight: '600' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}

                  {projects.length === 0 && (
                    <div style={{ padding: '36px 24px', textAlign: 'center', background: 'var(--bg-light)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
                      <BookOpen size={32} color="var(--muted-light)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                      <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: 0, fontWeight: '500' }}>No projects in your portfolio yet. Add one to showcase your work!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Certificate Preview */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.5px', margin: 0 }}>Certificate Credentials</h3>
                  <button onClick={() => navigate('/certificates')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}>View All</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {certificates.slice(0, 2).map((cert, idx) => (
                    <div 
                      key={idx}
                      onClick={() => navigate(`/verify/${cert.certId || cert.id}`)}
                      style={{
                        background: 'var(--bg-light)',
                        border: '1.5px solid #FFD700',
                        borderRadius: '16px',
                        padding: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        position: 'relative'
                      }}
                    >
                      <Award size={24} color="#FFD700" style={{ marginBottom: '4px' }} />
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-light)', margin: 0 }}>{cert.eventTitle}</h4>
                        <span style={{ fontSize: '10px', color: 'var(--muted-light)', fontFamily: 'monospace', marginTop: '2px', display: 'block' }}>{cert.certId}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#10B981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={10} color="#10B981" /> Verified Status
                        </span>
                        <ChevronRight size={14} color="var(--muted-light)" />
                      </div>
                    </div>
                  ))}
                  
                  {certificates.length === 0 && (
                    <div style={{ gridColumn: 'span 2', padding: '24px', textAlign: 'center', background: 'var(--bg-light)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
                      <Award size={32} color="var(--muted-light)" style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                      <p style={{ fontSize: '12px', color: 'var(--muted-light)', margin: 0 }}>No verified platform credentials earned yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Activity Timeline */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: '20px', marginTop: 0 }}>Activity Timeline</h3>
                
                <div style={{ position: 'relative', paddingLeft: '16px' }}>
                  <div style={{ position: 'absolute', top: '4px', bottom: '4px', left: '0', width: '2px', background: 'var(--border-light)' }} />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* 1. Registration */}
                    {registrations.slice(0, 1).map((reg, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-21px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', background: '#7B61FF', border: '2px solid white' }} />
                        <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '600' }}>Event Registration</span>
                        <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', margin: '2px 0 0 0' }}>Registered for {reg.title}</h5>
                      </div>
                    ))}

                    {/* 2. Assessment */}
                    {detailedEvents.filter(de => de.assessment).slice(0, 1).map((de, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-21px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', background: '#3B82F6', border: '2px solid white' }} />
                        <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '600' }}>Screening Cleared</span>
                        <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', margin: '2px 0 0 0' }}>Completed {de.eventTitle} Coding Assessment</h5>
                      </div>
                    ))}

                    {/* 3. Submissions */}
                    {detailedEvents.filter(de => de.submission).slice(0, 1).map((de, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-21px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B', border: '2px solid white' }} />
                        <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '600' }}>Project Submission</span>
                        <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', margin: '2px 0 0 0' }}>Uploaded project repository URL for {de.eventTitle}</h5>
                      </div>
                    ))}

                    {/* 4. Credentials */}
                    {certificates.slice(0, 1).map((cert, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-21px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', background: '#FFD700', border: '2px solid white' }} />
                        <span style={{ fontSize: '11px', color: '#D4AF37', fontWeight: '700' }}>Credential Earned</span>
                        <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', margin: '2px 0 0 0' }}>Minted official certificate for {cert.eventTitle}</h5>
                      </div>
                    ))}

                    {/* Fallback Timeline Item if no events registered */}
                    {registrations.length === 0 && (
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-21px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid white' }} />
                        <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontWeight: '600' }}>Account Created</span>
                        <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', margin: '2px 0 0 0' }}>Initialized Student Academic Profile</h5>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

      {/* EDIT PROFESSIONAL LINKS MODAL */}
      {isEditLinksModalOpen && (
        <div className="responsive-modal-overlay" onClick={() => setIsEditLinksModalOpen(false)}>
          <div className="responsive-modal" onClick={e => e.stopPropagation()}>
            <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '-12px auto 20px auto' }} className="mobile-only" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Edit Professional Profiles</h3>
              <button onClick={() => setIsEditLinksModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveLinks} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>LinkedIn URL</label>
                <input 
                  type="text" 
                  value={editedLinks.linkedin} 
                  onChange={(e) => setEditedLinks({ ...editedLinks, linkedin: e.target.value })} 
                  placeholder="https://linkedin.com/in/username" 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>GitHub Profile URL</label>
                <input 
                  type="text" 
                  value={editedLinks.github} 
                  onChange={(e) => setEditedLinks({ ...editedLinks, github: e.target.value })} 
                  placeholder="https://github.com/username" 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>LeetCode Profile URL</label>
                <input 
                  type="text" 
                  value={editedLinks.leetcode} 
                  onChange={(e) => setEditedLinks({ ...editedLinks, leetcode: e.target.value })} 
                  placeholder="https://leetcode.com/username" 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Kaggle Profile URL</label>
                <input 
                  type="text" 
                  value={editedLinks.kaggle} 
                  onChange={(e) => setEditedLinks({ ...editedLinks, kaggle: e.target.value })} 
                  placeholder="https://kaggle.com/username" 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Personal Portfolio Website</label>
                <input 
                  type="text" 
                  value={editedLinks.portfolio} 
                  onChange={(e) => setEditedLinks({ ...editedLinks, portfolio: e.target.value })} 
                  placeholder="https://username.dev" 
                  className="form-input" 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsEditLinksModalOpen(false)} className="btn-primary" style={{ background: 'white', color: '#6C757D', border: '1px solid #CED4DA' }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACADEMIC BIO MODAL */}
      {isEditBioModalOpen && (
        <div className="responsive-modal-overlay" onClick={() => setIsEditBioModalOpen(false)}>
          <div className="responsive-modal" onClick={e => e.stopPropagation()}>
            <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '-12px auto 20px auto' }} className="mobile-only" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Edit Profile Credentials</h3>
              <button onClick={() => setIsEditBioModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveBio} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Academic Bio</label>
                <textarea 
                  value={editedBio} 
                  onChange={(e) => setEditedBio(e.target.value)} 
                  placeholder="Describe your research, developer history, or hackathon interests..." 
                  className="form-input" 
                  style={{ height: '100px', resize: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Institution</label>
                <input 
                  type="text" 
                  value={editedInstitution} 
                  onChange={(e) => setEditedInstitution(e.target.value)} 
                  placeholder="Simats University" 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Location</label>
                <input 
                  type="text" 
                  value={editedLocation} 
                  onChange={(e) => setEditedLocation(e.target.value)} 
                  placeholder="Chennai, India" 
                  className="form-input" 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsEditBioModalOpen(false)} className="btn-primary" style={{ background: 'white', color: '#6C757D', border: '1px solid #CED4DA' }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Info</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PORTFOLIO PROJECT MODAL */}
      {isAddProjectModalOpen && (
        <div className="responsive-modal-overlay" onClick={() => setIsAddProjectModalOpen(false)}>
          <div className="responsive-modal" onClick={e => e.stopPropagation()}>
            <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '-12px auto 20px auto' }} className="mobile-only" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Add Portfolio Showcase Item</h3>
              <button onClick={() => setIsAddProjectModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Project Title</label>
                <input 
                  type="text" 
                  value={newProject.title} 
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} 
                  placeholder="e.g. Smart Contract Auditor" 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Showcase Category</label>
                <select 
                  value={newProject.category} 
                  onChange={(e) => setNewProject({ ...newProject, category: e.target.value })} 
                  className="form-input"
                  style={{ cursor: 'pointer' }}
                >
                  <option>Featured Work</option>
                  <option>Recent Projects</option>
                  <option>Research Contributions</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Resource or GitHub Link</label>
                <input 
                  type="text" 
                  value={newProject.link} 
                  onChange={(e) => setNewProject({ ...newProject, link: e.target.value })} 
                  placeholder="https://github.com/..." 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Technologies Used (comma separated)</label>
                <input 
                  type="text" 
                  value={newProject.tech} 
                  onChange={(e) => setNewProject({ ...newProject, tech: e.target.value })} 
                  placeholder="React, Python, Web3" 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Short Description</label>
                <textarea 
                  value={newProject.description} 
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} 
                  placeholder="Summarize key details and academic values..." 
                  className="form-input" 
                  style={{ height: '80px', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsAddProjectModalOpen(false)} className="btn-primary" style={{ background: 'white', color: '#6C757D', border: '1px solid #CED4DA' }}>Cancel</button>
                <button type="submit" className="btn-primary">Add Portfolio Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SKILL PROGRESS MODAL */}
      {isAddSkillModalOpen && (
        <div className="responsive-modal-overlay" onClick={() => setIsAddSkillModalOpen(false)}>
          <div className="responsive-modal" onClick={e => e.stopPropagation()}>
            <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '-12px auto 20px auto' }} className="mobile-only" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Add Skill Progress</h3>
              <button onClick={() => setIsAddSkillModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddSkill} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Skill Name</label>
                <input 
                  type="text" 
                  value={newSkill.name} 
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })} 
                  placeholder="e.g. Flutter" 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Skill Level</label>
                <select 
                  value={newSkill.level} 
                  onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })} 
                  className="form-input"
                  style={{ cursor: 'pointer' }}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Growth Rating (+%)</label>
                <input 
                  type="text" 
                  value={newSkill.growth} 
                  onChange={(e) => setNewSkill({ ...newSkill, growth: e.target.value })} 
                  placeholder="e.g. +15%" 
                  className="form-input" 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsAddSkillModalOpen(false)} className="btn-primary" style={{ background: 'white', color: '#6C757D', border: '1px solid #CED4DA' }}>Cancel</button>
                <button type="submit" className="btn-primary">Add Skill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SKILL PROGRESS MODAL */}
      {isEditSkillModalOpen && (
        <div className="responsive-modal-overlay" onClick={() => setIsEditSkillModalOpen(false)}>
          <div className="responsive-modal" onClick={e => e.stopPropagation()}>
            <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '-12px auto 20px auto' }} className="mobile-only" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Edit Skill Progress</h3>
              <button onClick={() => setIsEditSkillModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleEditSkillSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Skill Name</label>
                <input 
                  type="text" 
                  value={editedSkill.name} 
                  onChange={(e) => setEditedSkill({ ...editedSkill, name: e.target.value })} 
                  placeholder="e.g. Flutter" 
                  className="form-input" 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Skill Level</label>
                <select 
                  value={editedSkill.level} 
                  onChange={(e) => setEditedSkill({ ...editedSkill, level: e.target.value })} 
                  className="form-input"
                  style={{ cursor: 'pointer' }}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Expert</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Growth Rating (+%)</label>
                <input 
                  type="text" 
                  value={editedSkill.growth} 
                  onChange={(e) => setEditedSkill({ ...editedSkill, growth: e.target.value })} 
                  placeholder="e.g. +15%" 
                  className="form-input" 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsEditSkillModalOpen(false)} className="btn-primary" style={{ background: 'white', color: '#6C757D', border: '1px solid #CED4DA' }}>Cancel</button>
                <button type="submit" className="btn-primary">Update Skill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACADEMIC REPUTATION MODAL */}
      {isEditReputationModalOpen && (
        <div className="responsive-modal-overlay" onClick={() => setIsEditReputationModalOpen(false)}>
          <div className="responsive-modal" onClick={e => e.stopPropagation()}>
            <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '-12px auto 20px auto' }} className="mobile-only" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Edit Academic Reputation</h3>
              <button onClick={() => setIsEditReputationModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveReputation} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>Contributor Rank</label>
                <input 
                  type="number" 
                  min="1"
                  value={editedReputation.contributorRank} 
                  onChange={(e) => setEditedReputation({ ...editedReputation, contributorRank: parseInt(e.target.value) || 1 })} 
                  className="form-input" 
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700' }}>Participation Score (%)</label>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>{editedReputation.participationScore}%</span>
                </div>
                <input 
                  type="range" 
                  min="0"
                  max="100"
                  value={editedReputation.participationScore} 
                  onChange={(e) => setEditedReputation({ ...editedReputation, participationScore: parseInt(e.target.value) || 0 })} 
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700' }}>Skill Score (%)</label>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>{editedReputation.skillScore}%</span>
                </div>
                <input 
                  type="range" 
                  min="0"
                  max="100"
                  value={editedReputation.skillScore} 
                  onChange={(e) => setEditedReputation({ ...editedReputation, skillScore: parseInt(e.target.value) || 0 })} 
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700' }}>Consistency Score (%)</label>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>{editedReputation.consistencyScore}%</span>
                </div>
                <input 
                  type="range" 
                  min="0"
                  max="100"
                  value={editedReputation.consistencyScore} 
                  onChange={(e) => setEditedReputation({ ...editedReputation, consistencyScore: parseInt(e.target.value) || 0 })} 
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsEditReputationModalOpen(false)} className="btn-primary" style={{ background: 'white', color: '#6C757D', border: '1px solid #CED4DA' }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Metrics</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
