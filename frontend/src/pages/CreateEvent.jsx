import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Plus, 
  Trash2, 
  Eye, 
  Image as ImageIcon, 
  Loader2,
  Calendar,
  MapPin,
  Globe,
  Award,
  Users,
  Trophy,
  User,
  Zap,
  HelpCircle,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createEvent, uploadEventBanner } from '../firebase/firestore';

const STEPS = [
  'Basic Information', // Title, category, tags, banner
  'Schedule',           // Start/end date, time, description, AI-gen
  'Eligibility',        // Who can join, degree, year
  'Venue & Mode',       // Online/offline/hybrid, location
  'Registration Rules', // Deadline, capacity, fee
  'Team Settings',      // Individual/team, size
  'FAQs Builder',       // Questions & Answers
  'Resources & Links',  // Extra documentation links
  'Assessment Setup',   // Assessment type, guidelines
  'Submission Configuration' // Deliverables, notifications
];

const CATEGORIES = [
  'Hackathons',
  'Workshops',
  'Seminars',
  'Webinars',
  'Coding Competitions',
  'Paper Presentations',
  'Research Programs',
  'Innovation Challenges',
  'Technical (Web/App Dev, UI/UX)',
  'Guest Lectures'
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingFaqs, setIsGeneratingFaqs] = useState(false);
  const [aiFaqStep, setAiFaqStep] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

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
    faqs: [{ q: 'Do I need a team to participate?', a: 'You can register individually and we will help you find a team, or you can register with a pre-formed team.' }],
    resources: [{ title: 'Official Hackathon Guide', url: 'https://orin-platform.web.app/docs/guide.pdf' }],
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

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadProgress(0);
    try {
      const url = await uploadEventBanner(file, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      setFormData(prev => ({ ...prev, bannerUrl: url }));
      setUploadProgress(null);
    } catch (err) {
      console.error("Banner upload failed:", err);
      alert("Failed to upload image. Please try again.");
      setUploadProgress(null);
    }
  };

  const handleAIGenerate = () => {
    if (!formData.title) return alert("Please enter a title first!");
    setIsGenerating(true);
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        description: `Welcome to ${formData.title}! This premier ${formData.category.toLowerCase()} event brings together top minds to solve complex challenges. Expect intensive collaboration, mentorship from industry leaders, and amazing prizes. \n\nKey Themes:\n- Artificial Intelligence & Machine Learning\n- Next-Gen User Experience\n- Sustainable & Impact Tech\n\nJoin us to build, learn, and showcase your potential!`
      }));
      setIsGenerating(false);
    }, 1500);
  };

  const handleAiFaqGenerate = () => {
    if (!formData.title) return alert("Please enter an event title in Step 1 first!");
    setIsGeneratingFaqs(true);
    setAiFaqStep("AI analyzing event setup details...");
    
    setTimeout(() => {
      setAiFaqStep("Generating eligibility and format FAQs...");
      
      setTimeout(() => {
        setAiFaqStep("Structuring dynamic team rules FAQ...");
        
        setTimeout(() => {
          const generated = [
            { q: `Who is eligible for ${formData.title}?`, a: `This is a ${formData.category.toLowerCase()} event. Eligibility: ${formData.eligibility}.${formData.degreeFilter ? ` Restricted to ${formData.degreeFilter} students.` : ''}` },
            { q: `What is the format of this event?`, a: `The event will be held in ${formData.mode} format. Location details: ${formData.location || 'To be shared upon onboarding'}.` },
            { q: `Is there a registration fee?`, a: formData.registrationFeeType === 'Free' ? `No, registration for ${formData.title} is completely free of charge.` : `Yes, the registration fee is ₹${formData.registrationFeeAmount}.` },
            { q: `How do team formations work?`, a: formData.isTeamEvent ? `Teams can have between ${formData.minTeamSize} and ${formData.maxTeamSize} members. You can create a team or join via invite codes.` : `This is an individual event. Team participation is not enabled.` },
            { q: `What are the submission guidelines?`, a: `Participants must submit deliverables matching: "${formData.submissionType}" prior to the deadline.` }
          ];
          
          setFormData(prev => ({
            ...prev,
            faqs: generated
          }));
          setIsGeneratingFaqs(false);
          setAiFaqStep('');
        }, 800);
      }, 700);
    }, 600);
  };

  // FAQ Manager
  const handleFaqChange = (index, field, value) => {
    const updatedFaqs = [...formData.faqs];
    updatedFaqs[index][field] = value;
    setFormData(prev => ({ ...prev, faqs: updatedFaqs }));
  };

  const addFaq = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { q: '', a: '' }]
    }));
  };

  const removeFaq = (index) => {
    const updatedFaqs = formData.faqs.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, faqs: updatedFaqs }));
  };

  // Resource Manager
  const handleResourceChange = (index, field, value) => {
    const updatedResources = [...formData.resources];
    updatedResources[index][field] = value;
    setFormData(prev => ({ ...prev, resources: updatedResources }));
  };

  const addResource = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, { title: '', url: '' }]
    }));
  };

  const removeResource = (index) => {
    const updatedResources = formData.resources.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, resources: updatedResources }));
  };

  const handleSaveDraft = async () => {
    if (!formData.title) return alert("Event Title is required to save a draft!");
    setIsSaving(true);
    try {
      await createEvent(currentUser.uid, { ...formData, status: 'Draft' });
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
      await createEvent(currentUser.uid, { ...formData, status: 'Published' });
      navigate('/organizer');
    } catch (err) {
      console.error(err);
      alert("Error publishing event.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--background)', zIndex: 9999, display: 'flex' }}>
      
      {/* Left Navigation Sidebar */}
      <div style={{ width: '320px', background: 'white', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text)' }}>Create Event</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>10-Step Operational Wizard</p>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {STEPS.map((stepName, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentStep(idx)}
              style={{
                width: '100%', textAlign: 'left', padding: '12px 24px', background: currentStep === idx ? 'rgba(123, 97, 255, 0.08)' : 'transparent',
                border: 'none', borderRight: currentStep === idx ? '4px solid var(--primary)' : '4px solid transparent',
                color: currentStep === idx ? 'var(--primary)' : 'var(--text-light)',
                fontWeight: currentStep === idx ? '700' : '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '13px' }}>{idx + 1}. {stepName}</span>
              {currentStep > idx && <Check size={16} color="var(--primary)" strokeWidth={3} />}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={() => navigate('/organizer')} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
          >
            <ChevronLeft size={16} /> Exit to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
        
        {/* Top Action Bar */}
        <div style={{ height: '70px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'white' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>Step {currentStep + 1}: {STEPS[currentStep]}</h3>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setShowPreview(true)} 
              className="btn-primary" 
              style={{ background: 'white', color: 'var(--text-light)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px' }}
            >
              <Eye size={16} /> Preview
            </button>
            <button 
              onClick={handleSaveDraft} 
              disabled={isSaving} 
              className="btn-primary" 
              style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '8px 16px', fontSize: '14px' }}
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            <button 
              onClick={handlePublish} 
              disabled={isSaving} 
              className="btn-primary" 
              style={{ background: '#28A745', border: 'none', padding: '8px 16px', fontSize: '14px' }}
            >
              {isSaving ? 'Publishing...' : 'Publish Event'}
            </button>
          </div>
        </div>

        {/* Dynamic Form Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
            
            {/* STEP 0: Basic Info */}
            {currentStep === 0 && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: 'var(--text)' }}>Basic Information</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Event Title</label>
                    <input name="title" value={formData.title} onChange={handleChange} className="form-input" placeholder="e.g. National HackSphere 2026" />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="form-input">
                      {CATEGORIES.map((cat, i) => (
                        <option key={i} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Tags (Comma separated)</label>
                    <input name="tags" value={formData.tags} onChange={handleChange} className="form-input" placeholder="AI, Web3, Python, UI/UX" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Event Banner Image</label>
                    <div style={{ border: '2px dashed var(--border-light)', borderRadius: '12px', padding: '24px', textAlign: 'center', background: 'var(--surface)', position: 'relative' }}>
                      {formData.bannerUrl ? (
                        <div style={{ position: 'relative' }}>
                          <img src={formData.bannerUrl} alt="Banner" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                          <button 
                            onClick={() => setFormData(p => ({ ...p, bannerUrl: '' }))} 
                            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <ImageIcon size={36} color="var(--primary)" />
                          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>Choose banner file</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>PNG, JPG, or WEBP up to 5MB</span>
                          <input type="file" accept="image/*" onChange={handleBannerUpload} style={{ display: 'none' }} />
                        </label>
                      )}
                      {uploadProgress !== null && (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ height: '6px', background: '#E9ECEF', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.1s' }} />
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>Uploading: {uploadProgress}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Schedule */}
            {currentStep === 1 && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: 'var(--text)' }}>Schedule & Description</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Start Date</label>
                      <input type="date" name="date" value={formData.date} onChange={handleChange} className="form-input" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>End Date</label>
                      <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="form-input" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Start Time</label>
                      <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="form-input" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>End Time</label>
                      <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="form-input" />
                    </div>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600' }}>Event Description</label>
                      <button 
                        type="button"
                        onClick={handleAIGenerate}
                        disabled={isGenerating}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '700' }}
                      >
                        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                        {isGenerating ? 'Drafting AI Content...' : 'Auto-Generate with AI'}
                      </button>
                    </div>
                    <textarea 
                      name="description" 
                      value={formData.description} 
                      onChange={handleChange} 
                      className="form-input" 
                      style={{ height: '180px', resize: 'none', fontFamily: 'inherit' }} 
                      placeholder="Detail the event objectives, tracks, prizes, and key instructions..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Eligibility */}
            {currentStep === 2 && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: 'var(--text)' }}>Eligibility Criteria</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Who can participate?</label>
                    <select name="eligibility" value={formData.eligibility} onChange={handleChange} className="form-input">
                      <option>Open to All</option>
                      <option>University Students Only</option>
                      <option>Professionals Only</option>
                      <option>High School Students Only</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Degree / Program Filter</label>
                    <input name="degreeFilter" value={formData.degreeFilter} onChange={handleChange} className="form-input" placeholder="e.g. B.Tech, MCA, BSc (Leave blank for no filter)" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Minimum Academic Year</label>
                    <select name="minAcademicYear" value={formData.minAcademicYear} onChange={handleChange} className="form-input">
                      <option value="1">1st Year or above</option>
                      <option value="2">2nd Year or above</option>
                      <option value="3">3rd Year or above</option>
                      <option value="4">4th Year or above</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Venue */}
            {currentStep === 3 && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: 'var(--text)' }}>Venue & Mode</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Event Mode</label>
                    <select name="mode" value={formData.mode} onChange={handleChange} className="form-input">
                      <option>Online</option>
                      <option>Offline</option>
                      <option>Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Location Name / Join URL</label>
                    <input name="location" value={formData.location} onChange={handleChange} className="form-input" placeholder="e.g. Auditorium 2, Main Campus or Zoom Link" />
                  </div>

                  {formData.mode !== 'Online' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Specific Room/Hall Details</label>
                      <input name="hallDetails" value={formData.hallDetails} onChange={handleChange} className="form-input" placeholder="e.g. Block A, Room 402" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Registration Rules */}
            {currentStep === 4 && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: 'var(--text)' }}>Registration Rules</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Registration Deadline</label>
                    <input type="date" name="registrationDeadline" value={formData.registrationDeadline} onChange={handleChange} className="form-input" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Maximum Capacity (Seats)</label>
                      <input type="number" name="maxCapacity" value={formData.maxCapacity} onChange={handleChange} className="form-input" min="1" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Fee Option</label>
                      <select name="registrationFeeType" value={formData.registrationFeeType} onChange={handleChange} className="form-input">
                        <option>Free</option>
                        <option>Paid</option>
                      </select>
                    </div>
                  </div>

                  {formData.registrationFeeType === 'Paid' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Registration Fee (INR)</label>
                      <input type="number" name="registrationFeeAmount" value={formData.registrationFeeAmount} onChange={handleChange} className="form-input" min="0" placeholder="₹ Amount" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: Team Settings */}
            {currentStep === 5 && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: 'var(--text)' }}>Team Settings</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'var(--surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                    <input 
                      type="checkbox" 
                      name="isTeamEvent" 
                      checked={formData.isTeamEvent} 
                      onChange={handleChange} 
                      style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <div style={{ fontWeight: '700' }}>This is a Team Event</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Enables dynamic group registration and invite code sharing</div>
                    </div>
                  </label>

                  {formData.isTeamEvent && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Min Team Size</label>
                        <input type="number" name="minTeamSize" value={formData.minTeamSize} onChange={handleChange} className="form-input" min="1" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Max Team Size</label>
                        <input type="number" name="maxTeamSize" value={formData.maxTeamSize} onChange={handleChange} className="form-input" min="1" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: FAQs Builder */}
            {currentStep === 6 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)' }}>FAQs Builder</h2>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      type="button"
                      onClick={handleAiFaqGenerate}
                      disabled={isGeneratingFaqs}
                      style={{ background: 'rgba(123, 97, 255, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '24px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {isGeneratingFaqs ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {isGeneratingFaqs ? 'Generating...' : '⚡ AI FAQ Spark'}
                    </button>
                    <button 
                      type="button"
                      onClick={addFaq}
                      style={{ background: 'rgba(123, 97, 255, 0.1)', color: 'var(--primary)', border: 'none', borderRadius: '24px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      <Plus size={16} /> Add FAQ
                    </button>
                  </div>
                </div>

                {isGeneratingFaqs && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{aiFaqStep}</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {formData.faqs.map((faq, idx) => (
                    <div key={idx} style={{ padding: '16px', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                      <button 
                        type="button"
                        onClick={() => removeFaq(idx)} 
                        style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', color: '#DC3545', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                      <div style={{ paddingRight: '30px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Question {idx + 1}</label>
                        <input 
                          type="text" 
                          value={faq.q} 
                          onChange={(e) => handleFaqChange(idx, 'q', e.target.value)} 
                          className="form-input" 
                          placeholder="e.g. Can we submit after the deadline?"
                          style={{ background: 'white' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Answer</label>
                        <textarea 
                          value={faq.a} 
                          onChange={(e) => handleFaqChange(idx, 'a', e.target.value)} 
                          className="form-input" 
                          placeholder="e.g. No, late submissions will not be accepted."
                          style={{ height: '60px', resize: 'none', background: 'white' }}
                        />
                      </div>
                    </div>
                  ))}
                  {formData.faqs.length === 0 && (
                    <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--border-light)', borderRadius: '12px', color: 'var(--text-light)' }}>
                      No FAQs defined yet. Click Add FAQ to start.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 7: Resources */}
            {currentStep === 7 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)' }}>Resources & Document Links</h2>
                  <button 
                    type="button"
                    onClick={addResource}
                    style={{ background: 'rgba(123, 97, 255, 0.1)', color: 'var(--primary)', border: 'none', borderRadius: '24px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    <Plus size={16} /> Add Link
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {formData.resources.map((res, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={res.title} 
                        onChange={(e) => handleResourceChange(idx, 'title', e.target.value)} 
                        className="form-input" 
                        placeholder="Link Title (e.g. API Docs)"
                        style={{ flex: 1 }}
                      />
                      <input 
                        type="text" 
                        value={res.url} 
                        onChange={(e) => handleResourceChange(idx, 'url', e.target.value)} 
                        className="form-input" 
                        placeholder="https://..."
                        style={{ flex: 2 }}
                      />
                      <button 
                        type="button"
                        onClick={() => removeResource(idx)} 
                        style={{ border: 'none', background: 'none', color: '#DC3545', cursor: 'pointer', padding: '8px' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {formData.resources.length === 0 && (
                    <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--border-light)', borderRadius: '12px', color: 'var(--text-light)' }}>
                      No resources attached. Click Add Link to share resource files.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 8: Assessment Setup */}
            {currentStep === 8 && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: 'var(--text)' }}>Assessment Setup</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Assessment Type</label>
                    <select name="assessmentType" value={formData.assessmentType} onChange={handleChange} className="form-input">
                      <option>Multiple Choice Quiz</option>
                      <option>Coding Challenge</option>
                      <option>Design Task</option>
                      <option>Subjective Review</option>
                      <option>No Initial Screening</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Guidelines & Criteria</label>
                    <textarea 
                      name="assessmentGuidelines" 
                      value={formData.assessmentGuidelines} 
                      onChange={handleChange} 
                      placeholder="Outline instructions, judging rubrics, time limits, and specific parameters..." 
                      className="form-input" 
                      style={{ height: '140px', resize: 'none' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 9: Submission Config */}
            {currentStep === 9 && (
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', color: 'var(--text)' }}>Submission & Notifications</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Required Submission Artifacts</label>
                    <select name="submissionType" value={formData.submissionType} onChange={handleChange} className="form-input">
                      <option>GitHub Repo & Demo Video</option>
                      <option>Figma File & Design Specs</option>
                      <option>PDF Report / PPT Slides</option>
                      <option>ZIP File Deliverables</option>
                      <option>URL Link Only</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Notification Settings</label>
                    <select name="notificationPrefs" value={formData.notificationPrefs} onChange={handleChange} className="form-input">
                      <option>Email & Push Notifications</option>
                      <option>Email Only</option>
                      <option>Push Notifications Only</option>
                      <option>No Automated Alerts</option>
                    </select>
                    <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px' }}>
                      Sends reminders 24 hours before deadlines and push notifications during event lifecycle transitions.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Navigation Bottom Row */}
          <div style={{ maxWidth: '800px', margin: '32px auto 0', display: 'flex', justifyContent: 'space-between' }}>
            <button 
              type="button"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))} 
              disabled={currentStep === 0}
              className="btn-primary" 
              style={{ background: 'white', color: 'var(--text-light)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ChevronLeft size={16} /> Previous Step
            </button>
            
            <button 
              type="button"
              onClick={() => setCurrentStep(prev => Math.min(STEPS.length - 1, prev + 1))}
              disabled={currentStep === STEPS.length - 1}
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              Next Step <ChevronRight size={16} />
            </button>
          </div>

        </div>
      </div>

      {/* Preview Modal (Fully mimicking EventDetails) */}
      {showPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', justifyContent: 'center', overflowY: 'auto', padding: '40px 0' }}>
          <div style={{ background: 'var(--background)', width: '90%', maxWidth: '900px', borderRadius: '24px', padding: '32px', position: 'relative', height: 'fit-content' }}>
            <button 
              onClick={() => setShowPreview(false)} 
              style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '16px' }}>✨ Live Organizer Preview Mode</h3>
            
            {/* Mocked EventDetails Page */}
            <div style={{ color: '#1A1A1A', textAlign: 'left' }}>
              <div style={{ 
                background: formData.bannerUrl ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${formData.bannerUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #A493C1, #69577D)', 
                borderRadius: '24px', 
                padding: '40px', 
                color: 'white',
                minHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                position: 'relative'
              }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>{formData.category}</span>
                    <span style={{ background: '#FFD700', color: '#1A1A1A', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>Active</span>
                  </div>
                  <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px' }}>{formData.title || 'Untitled Event'}</h1>
                </div>
              </div>

              {/* 4 Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px', marginBottom: '32px' }}>
                {[
                  { icon: <Calendar size={20} />, label: 'Date', value: formData.date ? new Date(formData.date).toLocaleDateString() : 'TBD' },
                  { icon: <Globe size={20} />, label: 'Format', value: formData.mode },
                  { icon: <Users size={20} />, label: 'Capacity', value: `${formData.maxCapacity} Seats` },
                  { icon: <Award size={20} />, label: 'Fee', value: formData.registrationFeeType === 'Free' ? 'Free' : `₹${formData.registrationFeeAmount}` },
                ].map((stat, i) => (
                  <div key={i} style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ color: '#7B61FF', marginBottom: '8px' }}>{stat.icon}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#1A1A1A', marginBottom: '4px' }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', color: '#6C757D' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* About Section */}
              <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1A1A1A' }}>About this Event</h2>
                <div style={{ color: '#6C757D', fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                  {formData.description || 'No description provided.'}
                </div>
              </div>

              {/* Grid Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7B61FF', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>
                    <MapPin size={18} /> Venue/Location
                  </div>
                  <div style={{ color: '#6C757D', fontSize: '15px' }}>{formData.location || 'TBD'} {formData.hallDetails && `(${formData.hallDetails})`}</div>
                </div>

                <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7B61FF', fontWeight: 'bold', fontSize: '15px', marginBottom: '12px' }}>
                    <User size={18} /> Eligibility
                  </div>
                  <div style={{ color: '#6C757D', fontSize: '15px' }}>{formData.eligibility} {formData.degreeFilter && `- Filter: ${formData.degreeFilter}`}</div>
                </div>
              </div>

              {/* FAQs Preview */}
              {formData.faqs.length > 0 && (
                <div style={{ background: 'white', border: '1px solid #E9ECEF', borderRadius: '16px', padding: '32px', marginBottom: '32px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1A1A1A' }}>FAQs Preview</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {formData.faqs.map((f, i) => (
                      <div key={i}>
                        <div style={{ fontWeight: '600', fontSize: '15px', color: '#1A1A1A' }}>Q: {f.q}</div>
                        <div style={{ color: '#6C757D', fontSize: '14px', marginTop: '4px' }}>A: {f.a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
