import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, ChevronRight, ChevronLeft, Sparkles, Plus, Trash2, Eye, EyeOff,
  Image as ImageIcon, Calendar, MapPin, Globe, Award, Users, Trophy, User, 
  Zap, HelpCircle, X, Navigation, LayoutTemplate, Briefcase, 
  FileText, CheckCircle2, Shield, Settings2, Info, ArrowRight, Save, Layout
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createEvent, uploadEventBanner, updateUserProfile } from '../firebase/firestore';
import EventCard from '../components/EventCard';

const PHASES = [
  { id: 'identity', label: 'Identity & Vibe', icon: Sparkles, desc: 'Core details & branding' },
  { id: 'logistics', label: 'Logistics', icon: Navigation, desc: 'Time, venue & limits' },
  { id: 'rules', label: 'Rules & Roster', icon: Shield, desc: 'Eligibility & teams' },
  { id: 'delivery', label: 'Assessments', icon: Award, desc: 'Submissions & FAQs' }
];

const CATEGORIES = [
  'Hackathons', 'Workshops', 'Seminars', 'Webinars', 
  'Coding Competitions', 'Paper Presentations', 
  'Innovation Challenges', 'Technical'
];

const TEMPLATES = [
  { 
    name: 'Standard Hackathon', 
    icon: Zap,
    preset: {
      category: 'Hackathons', isTeamEvent: true, minTeamSize: 2, maxTeamSize: 4, 
      assessmentType: 'Project Submission', submissionType: 'GitHub Repo & Demo Video',
      tags: 'development, hacking, innovation', eligibility: 'Open to All',
      mode: 'Offline', maxCapacity: 200
    }
  },
  { 
    name: 'Technical Workshop', 
    icon: Briefcase,
    preset: {
      category: 'Workshops', isTeamEvent: false, minTeamSize: 1, maxTeamSize: 1, 
      assessmentType: 'Quiz', submissionType: 'None',
      tags: 'learning, tutorial, hands-on', eligibility: 'Open to All',
      mode: 'Online', maxCapacity: 500
    }
  }
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const { currentUser, userProfile, refreshProfile } = useAuth();
  
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingFaqs, setIsGeneratingFaqs] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [showLivePreview, setShowLivePreview] = useState(window.innerWidth > 1024);
  const [hasAppliedTemplate, setHasAppliedTemplate] = useState(false);

  // Auto-upgrade user to organizer role in Firestore if they are logged in as a participant
  useEffect(() => {
    if (currentUser && userProfile && userProfile.role !== 'organizer') {
      updateUserProfile(currentUser.uid, { role: 'organizer' }).then(() => {
        refreshProfile();
      });
    }
  }, [currentUser, userProfile, refreshProfile]);

  // Layout responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) setShowLivePreview(false);
      else setShowLivePreview(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Hackathons',
    tags: '',
    bannerUrl: '',
    date: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    description: '',
    eligibility: 'Open to All',
    degreeFilter: '',
    minAcademicYear: '1',
    mode: 'Online',
    location: '',
    hallDetails: '',
    registrationDeadline: '',
    maxCapacity: 100,
    registrationFeeType: 'Free',
    registrationFeeAmount: 0,
    isTeamEvent: false,
    minTeamSize: 2,
    maxTeamSize: 4,
    faqs: [{ q: 'Do I need a team to participate?', a: 'You can register individually or with a team.' }],
    resources: [{ title: 'Official Guide', url: 'https://docs.google.com/' }],
    assessmentType: 'Quiz',
    assessmentGuidelines: '',
    submissionType: 'GitHub Repo & Demo Video',
    notificationPrefs: 'Email & Push Notifications'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const applyTemplate = (preset) => {
    setFormData(prev => ({ ...prev, ...preset }));
    setHasAppliedTemplate(true);
  };

  const compressImage = (file, maxWidth = 800, maxHeight = 400, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview instantly
    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, bannerUrl: previewUrl }));
    setUploadProgress(0);

    try {
      const url = await uploadEventBanner(file, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      setFormData(prev => ({ ...prev, bannerUrl: url }));
      setUploadProgress(null);
    } catch (err) {
      console.warn("Storage upload failed, falling back to compressed Base64:", err);
      try {
        const base64Url = await compressImage(file);
        setFormData(prev => ({ ...prev, bannerUrl: base64Url }));
      } catch (compressErr) {
        console.error("Compression failed:", compressErr);
        alert("Failed to process image.");
      }
      setUploadProgress(null);
    }
  };

  const handleAIGenerate = () => {
    if (!formData.title) return alert("Please enter a title first!");
    setIsGenerating(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        description: `Welcome to **${formData.title}**! This premier ${formData.category.toLowerCase()} event brings together top minds to solve complex challenges. Expect intensive collaboration, mentorship from industry leaders, and amazing prizes. \n\n### Key Themes:\n- Artificial Intelligence & Machine Learning\n- Next-Gen User Experience\n- Sustainable & Impact Tech\n\nJoin us to build, learn, and showcase your potential!`
      }));
      setIsGenerating(false);
    }, 1200);
  };

  const handleAiFaqGenerate = () => {
    if (!formData.title) return alert("Please enter an event title in Step 1 first!");
    setIsGeneratingFaqs(true);
    setTimeout(() => {
      const generated = [
        { q: `Who is eligible for ${formData.title}?`, a: `This is a ${formData.category.toLowerCase()} event. Eligibility: ${formData.eligibility}.${formData.degreeFilter ? ` Restricted to ${formData.degreeFilter} students.` : ''}` },
        { q: `What is the format of this event?`, a: `The event will be held in ${formData.mode} format. Location details: ${formData.location || 'To be shared upon onboarding'}.` },
        { q: `Is there a registration fee?`, a: formData.registrationFeeType === 'Free' ? `No, registration for ${formData.title} is completely free of charge.` : `Yes, the registration fee is ₹${formData.registrationFeeAmount}.` },
        { q: `How do team formations work?`, a: formData.isTeamEvent ? `Teams can have between ${formData.minTeamSize} and ${formData.maxTeamSize} members.` : `This is an individual event. Team participation is not enabled.` }
      ];
      setFormData(prev => ({ ...prev, faqs: generated }));
      setIsGeneratingFaqs(false);
    }, 1500);
  };

  // Arrays Manager
  const handleFaqChange = (index, field, value) => {
    const updated = [...formData.faqs];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, faqs: updated }));
  };
  const addFaq = () => setFormData(prev => ({ ...prev, faqs: [...prev.faqs, { q: '', a: '' }] }));
  const removeFaq = (index) => setFormData(prev => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));

  const handleResourceChange = (index, field, value) => {
    const updated = [...formData.resources];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, resources: updated }));
  };
  const addResource = () => setFormData(prev => ({ ...prev, resources: [...prev.resources, { title: '', url: '' }] }));
  const removeResource = (index) => setFormData(prev => ({ ...prev, resources: prev.resources.filter((_, i) => i !== index) }));

  // Saving
  const handleSaveDraft = async () => {
    if (!formData.title) return alert("Event Title is required to save a draft!");
    setIsSaving(true);
    try {
      await createEvent(currentUser.uid, { 
        ...formData, 
        hostingCollege: userProfile?.institution || '',
        status: 'Draft' 
      });
      navigate('/organizer');
    } catch (err) {
      console.error(err);
      alert("Error saving draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.title) return alert("Event Title is required!");
    if (!formData.date) return alert("Start Date is required!");
    setIsSaving(true);
    try {
      await createEvent(currentUser.uid, { 
        ...formData, 
        hostingCollege: userProfile?.institution || '',
        status: 'Published' 
      });
      navigate('/organizer');
    } catch (err) {
      console.error(err);
      alert("Error publishing event.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderPhaseContent = () => {
    switch(currentPhase) {
      case 0: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-in-out' }}>
          
          {!hasAppliedTemplate && (
            <div style={{ background: 'linear-gradient(135deg, rgba(123, 97, 255, 0.1), rgba(0, 201, 255, 0.05))', borderRadius: '16px', padding: '24px', border: '1px dashed var(--primary)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <LayoutTemplate size={18} color="var(--primary)" /> Quick Start Templates
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {TEMPLATES.map((tpl, i) => (
                  <button 
                    key={i} onClick={() => applyTemplate(tpl.preset)}
                    style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
                  >
                    <div style={{ background: 'rgba(123, 97, 255, 0.1)', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <tpl.icon size={18} color="var(--primary)" />
                    </div>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text)' }}>{tpl.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--muted-light)' }}>Click to auto-fill form presets</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} /> Basic Information</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Event Title <span style={{ color: 'red' }}>*</span></label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-input" placeholder="e.g. Global AI Hackathon 2026" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="form-input">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Keywords / Tags (comma separated)</label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="form-input" placeholder="AI, Web3, Innovation" />
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><ImageIcon size={16} /> Visual Branding</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '12px', background: 'var(--bg-light)', border: '2px dashed var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {formData.bannerUrl ? (
                  <img src={formData.bannerUrl} alt="Banner Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--muted-light)' }}>
                    <ImageIcon size={32} opacity={0.5} />
                    <span style={{ fontSize: '13px', fontWeight: '600' }}>Click or drag to upload banner (1200x600px)</span>
                  </div>
                )}
                {uploadProgress !== null && (
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: 'white', gap: '12px', padding: '0 24px', zIndex: 10
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: '700' }}>Uploading banner... {uploadProgress}%</span>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#7B61FF', transition: 'width 0.1s ease' }} />
                    </div>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><Info size={16} /> Event Description</h4>
              <button onClick={handleAIGenerate} disabled={isGenerating} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(90deg, #7B61FF, #00C9FF)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                <Sparkles size={12} /> {isGenerating ? 'Generating...' : 'Auto-Generate with AI'}
              </button>
            </div>
            <textarea name="description" value={formData.description} onChange={handleChange} className="form-input" rows="8" placeholder="Describe the objectives, schedule highlights, and prizes..." style={{ resize: 'vertical' }} />
          </div>
        </div>
      );
      
      case 1: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-in-out' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Schedule Overview</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label">Start Date <span style={{ color: 'red' }}>*</span></label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">Start Time</label>
                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">End Time</label>
                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="form-input" />
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} /> Venue & Mode</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Event Mode</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['Online', 'Offline', 'Hybrid'].map(mode => (
                    <label key={mode} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: formData.mode === mode ? 'rgba(123, 97, 255, 0.1)' : 'var(--bg-light)', border: `2px solid ${formData.mode === mode ? 'var(--primary)' : 'transparent'}`, borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: formData.mode === mode ? 'var(--primary)' : 'var(--text-light)' }}>
                      <input type="radio" name="mode" value={mode} checked={formData.mode === mode} onChange={handleChange} style={{ display: 'none' }} />
                      {mode === 'Online' ? <Globe size={16} /> : mode === 'Offline' ? <MapPin size={16} /> : <Users size={16} />}
                      {mode}
                    </label>
                  ))}
                </div>
              </div>
              
              {formData.mode !== 'Online' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Location / City</label>
                    <input type="text" name="location" value={formData.location} onChange={handleChange} className="form-input" placeholder="e.g. Bangalore, India" />
                  </div>
                  <div>
                    <label className="form-label">Venue / Hall Details</label>
                    <input type="text" name="hallDetails" value={formData.hallDetails} onChange={handleChange} className="form-input" placeholder="e.g. Tech Park Main Auditorium" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> Capacity & Registration</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label">Registration Deadline</label>
                <input type="date" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} className="form-input" />
              </div>
              <div>
                <label className="form-label">Max Capacity (Pax)</label>
                <input type="number" name="maxCapacity" value={formData.maxCapacity} onChange={handleChange} className="form-input" />
              </div>
            </div>
          </div>
        </div>
      );

      case 2: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-in-out' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={16} /> Eligibility Criteria</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Who can apply?</label>
                <select name="eligibility" value={formData.eligibility} onChange={handleChange} className="form-input">
                  <option>Open to All</option>
                  <option>In-Campus (Restricted to Hosting College)</option>
                  <option>University Students Only</option>
                  <option>Working Professionals Only</option>
                  <option>Women Only</option>
                  <option>Invite Only</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Specific Degree (Optional)</label>
                  <input type="text" name="degreeFilter" value={formData.degreeFilter} onChange={handleChange} className="form-input" placeholder="e.g. B.Tech CS, MCA" />
                </div>
                <div>
                  <label className="form-label">Minimum Academic Year</label>
                  <select name="minAcademicYear" value={formData.minAcademicYear} onChange={handleChange} className="form-input">
                    <option value="1">1st Year & Above</option>
                    <option value="2">2nd Year & Above</option>
                    <option value="3">3rd Year & Above</option>
                    <option value="4">4th Year Only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={16} /> Team Settings</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-light)', padding: '16px', borderRadius: '12px', cursor: 'pointer' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: '2px solid var(--primary)', background: formData.isTeamEvent ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {formData.isTeamEvent && <Check size={14} color="white" />}
                </div>
                <input type="checkbox" name="isTeamEvent" checked={formData.isTeamEvent} onChange={handleChange} style={{ display: 'none' }} />
                <div>
                  <span style={{ fontWeight: '700', fontSize: '14px', display: 'block' }}>Allow Team Participation</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted-light)' }}>Participants can form teams and submit joint projects.</span>
                </div>
              </label>

              {formData.isTeamEvent && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: 'rgba(123, 97, 255, 0.05)', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
                  <div>
                    <label className="form-label">Min Team Size</label>
                    <input type="number" name="minTeamSize" value={formData.minTeamSize} onChange={handleChange} className="form-input" min="1" />
                  </div>
                  <div>
                    <label className="form-label">Max Team Size</label>
                    <input type="number" name="maxTeamSize" value={formData.maxTeamSize} onChange={handleChange} className="form-input" min="2" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={16} /> Registration Fees</h4>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              {['Free', 'Paid'].map(fee => (
                <label key={fee} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: formData.registrationFeeType === fee ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-light)', border: `2px solid ${formData.registrationFeeType === fee ? '#10B981' : 'transparent'}`, borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: formData.registrationFeeType === fee ? '#10B981' : 'var(--text-light)' }}>
                  <input type="radio" name="registrationFeeType" value={fee} checked={formData.registrationFeeType === fee} onChange={handleChange} style={{ display: 'none' }} />
                  {fee}
                </label>
              ))}
            </div>
            {formData.registrationFeeType === 'Paid' && (
              <div>
                <label className="form-label">Amount (₹)</label>
                <input type="number" name="registrationFeeAmount" value={formData.registrationFeeAmount} onChange={handleChange} className="form-input" min="0" />
              </div>
            )}
          </div>
        </div>
      );

      case 3: return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-in-out' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-light)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={16} /> Deliverables</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label className="form-label">Screening / Assessment</label>
                <select name="assessmentType" value={formData.assessmentType} onChange={handleChange} className="form-input">
                  <option>Quiz</option>
                  <option>Coding Challenge</option>
                  <option>Project Proposal</option>
                  <option>Direct Entry</option>
                </select>
              </div>
              <div>
                <label className="form-label">Final Submission Format</label>
                <select name="submissionType" value={formData.submissionType} onChange={handleChange} className="form-input">
                  <option>GitHub Repo & Demo Video</option>
                  <option>PDF Presentation / Research Paper</option>
                  <option>Figma Prototype Link</option>
                  <option>None</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><HelpCircle size={16} /> Frequently Asked Questions</h4>
              <button onClick={handleAiFaqGenerate} disabled={isGeneratingFaqs} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(90deg, #7B61FF, #00C9FF)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                <Sparkles size={12} /> {isGeneratingFaqs ? 'Drafting...' : 'Auto-Draft FAQs'}
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formData.faqs.map((faq, index) => (
                <div key={index} style={{ display: 'flex', gap: '12px', background: 'var(--bg-light)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input type="text" value={faq.q} onChange={e => handleFaqChange(index, 'q', e.target.value)} className="form-input" placeholder="Question" style={{ background: 'white' }} />
                    <textarea value={faq.a} onChange={e => handleFaqChange(index, 'a', e.target.value)} className="form-input" placeholder="Answer" rows="2" style={{ background: 'white', resize: 'vertical' }} />
                  </div>
                  <button onClick={() => removeFaq(index)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', alignSelf: 'flex-start', padding: '8px' }} title="Remove FAQ">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button onClick={addFaq} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'white', border: '1px dashed var(--primary)', color: 'var(--primary)', borderRadius: '12px', cursor: 'pointer', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>
                <Plus size={16} /> Add Custom Question
              </button>
            </div>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--background)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Application Header */}
      <div style={{ height: '70px', background: 'white', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/organizer')} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>
            <X size={20} color="var(--text)" />
          </button>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text)', margin: 0 }}>Create Event Hub</h2>
            <span style={{ fontSize: '12px', color: 'var(--muted-light)', fontWeight: '600' }}>{isSaving ? 'Saving progress...' : 'Auto-save enabled'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowLivePreview(!showLivePreview)} className="desktop-only" style={{ background: showLivePreview ? 'rgba(123, 97, 255, 0.1)' : 'var(--bg-light)', color: showLivePreview ? 'var(--primary)' : 'var(--text-light)', border: 'none', borderRadius: '10px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' }}>
            {showLivePreview ? <EyeOff size={16} /> : <Eye size={16} />} {showLivePreview ? 'Hide Preview' : 'Show Live Preview'}
          </button>
        </div>
      </div>

      {/* Main Content Area: Split Screen */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Form Panel */}
        <div style={{ flex: showLivePreview ? '0 0 60%' : '1', display: 'flex', flexDirection: 'column', background: 'var(--bg-light)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', borderRight: showLivePreview ? '1px solid var(--border-light)' : 'none' }}>
          
          {/* Horizontal Stepper Component */}
          <div style={{ background: 'white', padding: '24px 32px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '24px', left: '0', right: '0', height: '2px', background: 'var(--border-light)', zIndex: 1 }} />
              <div style={{ position: 'absolute', top: '24px', left: '0', height: '2px', background: 'var(--primary)', zIndex: 1, width: `${(currentPhase / (PHASES.length - 1)) * 100}%`, transition: 'width 0.3s ease' }} />
              
              {PHASES.map((phase, idx) => {
                const isActive = currentPhase === idx;
                const isCompleted = currentPhase > idx;
                return (
                  <button 
                    key={idx}
                    onClick={() => setCurrentPhase(idx)}
                    style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', minWidth: '80px' }}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: isActive ? 'var(--primary)' : isCompleted ? '#10B981' : 'white', border: `2px solid ${isActive ? 'var(--primary)' : isCompleted ? '#10B981' : 'var(--border-light)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive || isCompleted ? 'white' : 'var(--muted-light)', transition: 'all 0.3s ease', boxShadow: isActive ? '0 4px 12px rgba(123, 97, 255, 0.3)' : 'none' }}>
                      {isCompleted ? <Check size={20} strokeWidth={3} /> : <phase.icon size={20} />}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: isActive ? 'var(--primary)' : isCompleted ? 'var(--text)' : 'var(--muted-light)', display: 'block' }}>{phase.label}</span>
                      <span className="desktop-only" style={{ fontSize: '10px', color: 'var(--muted-light)', marginTop: '2px' }}>{phase.desc}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Form Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', paddingBottom: '100px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              {renderPhaseContent()}
            </div>
          </div>

        </div>

        {/* Right Live Preview Panel */}
        {showLivePreview && (
          <div className="desktop-only" style={{ flex: '0 0 40%', background: 'var(--background)', overflowY: 'auto', padding: '32px' }}>
            <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(123, 97, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layout size={20} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>Live Student Preview</h3>
                  <p style={{ fontSize: '12px', color: 'var(--muted-light)', margin: '2px 0 0 0' }}>This is how participants will see your event card.</p>
                </div>
              </div>

              {/* Event Card Component Injection for real-time visualization */}
              <div style={{ pointerEvents: 'none', transform: 'scale(0.95)', transformOrigin: 'top center' }}>
                <EventCard event={{
                  id: 'preview',
                  title: formData.title || 'Event Title Preview',
                  category: formData.category,
                  date: formData.date || new Date().toISOString(),
                  location: formData.mode === 'Online' ? 'Virtual / Online' : (formData.location || 'Location TBD'),
                  mode: formData.mode,
                  registeredCount: 0,
                  maxCapacity: formData.maxCapacity,
                  description: formData.description || 'Event description will appear here.',
                  image: formData.bannerUrl || 'https://via.placeholder.com/600x300/7B61FF/FFFFFF?text=Banner+Placeholder',
                  isTeamEvent: formData.isTeamEvent
                }} />
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Floating Bottom Action Bar */}
      <div style={{ position: 'fixed', bottom: '0', left: '0', right: showLivePreview ? '40%' : '0', height: '80px', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', zIndex: 20 }}>
        <button 
          onClick={() => setCurrentPhase(Math.max(0, currentPhase - 1))} 
          disabled={currentPhase === 0}
          style={{ background: 'var(--bg-light)', border: 'none', borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', cursor: currentPhase === 0 ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px', color: currentPhase === 0 ? 'var(--muted-light)' : 'var(--text)', opacity: currentPhase === 0 ? 0.5 : 1 }}
        >
          <ChevronLeft size={18} /> Back
        </button>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={handleSaveDraft} 
            disabled={isSaving} 
            style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={18} /> {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          
          {currentPhase < PHASES.length - 1 ? (
            <button 
              onClick={() => setCurrentPhase(currentPhase + 1)} 
              className="btn-primary" 
              style={{ padding: '12px 24px', fontSize: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={handlePublish} 
              disabled={isSaving} 
              className="btn-primary" 
              style={{ background: '#10B981', padding: '12px 32px', fontSize: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
            >
              <Sparkles size={18} /> {isSaving ? 'Publishing...' : 'Publish Event'}
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
