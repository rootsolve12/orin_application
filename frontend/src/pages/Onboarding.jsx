import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../firebase/firestore';
import { uploadSubmissionFile } from '../firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

const TOTAL_STEPS = 5;

const SKILL_OPTIONS = [
  'React', 'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'Node.js',
  'Machine Learning', 'Data Science', 'UI/UX Design', 'Figma', 'Android',
  'Flutter', 'SQL', 'MongoDB', 'Docker', 'AWS', 'Blockchain', 'Web3', 'Go',
  'Kotlin', 'Swift', 'PHP', 'Ruby', 'Rust', 'DevOps', 'Cybersecurity',
];

const INTEREST_OPTIONS = [
  'AI/ML', 'Web Development', 'Mobile Apps', 'Blockchain', 'Cybersecurity',
  'Data Science', 'Game Development', 'IoT', 'AR/VR', 'Open Source',
  'Research', 'Entrepreneurship', 'Product Management', 'UX Design',
  'Cloud Computing', 'Competitive Programming',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { currentUser, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resumeFile, setResumeFile] = useState(null);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const picInputRef = useRef();
  const resumeInputRef = useRef();

  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    institution: '',
    department: '',
    degreeProgram: '',
    academicYear: '',
    graduationYear: '',
    skills: [],
    interests: [],
    careerGoals: '',
    linkedin: '',
    github: '',
    leetcode: '',
    kaggle: '',
    portfolioUrl: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTag = (field, value) => {
    setFormData(prev => {
      const current = prev[field];
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter(v => v !== value) : [...current, value],
      };
    });
  };

  const handleProfilePic = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfilePicFile(file);
    setProfilePicPreview(URL.createObjectURL(file));
  };

  const handleResumeSelect = (e) => {
    const file = e.target.files[0];
    if (file) setResumeFile(file);
  };

  const uploadToStorage = (file, path, onProgress) => {
    return new Promise((resolve, reject) => {
      const fileRef = ref(storage, path);
      const task = uploadBytesResumable(fileRef, file);
      task.on('state_changed',
        snap => onProgress && onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      let photoURL = currentUser?.photoURL || null;
      let resumeUrl = null;

      if (profilePicFile) {
        photoURL = await uploadToStorage(
          profilePicFile,
          `profiles/${currentUser.uid}/avatar_${Date.now()}`,
          null
        );
      }

      if (resumeFile) {
        resumeUrl = await uploadToStorage(
          resumeFile,
          `resumes/${currentUser.uid}/${Date.now()}_${resumeFile.name}`,
          setUploadProgress
        );
      }

      const payload = {
        ...formData,
        photoURL,
        resumeUrl,
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      };

      if (currentUser) {
        await updateUserProfile(currentUser.uid, payload);
        await refreshProfile();
      }

      navigate('/');
    } catch (err) {
      console.error('Error saving onboarding data:', err);
      alert('Failed to save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.displayName.trim().length > 0;
    if (step === 2) return formData.institution.trim().length > 0 && formData.academicYear.trim().length > 0;
    return true;
  };

  const TagPill = ({ label, selected, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '12px 20px', borderRadius: '24px', fontSize: '14px', fontWeight: '600',
        border: selected ? 'none' : '1px solid #E9ECEF',
        background: selected ? '#7B61FF' : 'white',
        color: selected ? 'white' : '#6C757D',
        cursor: 'pointer', transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        minHeight: '44px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {selected && '✓ '}{label}
    </button>
  );

  const inputStyle = {
    width: '100%', padding: '14px 16px', border: '1px solid #E9ECEF',
    borderRadius: '10px', fontSize: '16px', outline: 'none', boxSizing: 'border-box',
    background: 'white',
    minHeight: '48px',
  };

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #F8F9FA 0%, #EDE9FE 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div className="onboarding-card">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: 36, height: 36, background: '#7B61FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>O</div>
            <span style={{ fontWeight: '700', fontSize: '18px', color: '#1A1A1A' }}>Orin</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px' }}>
            {['', 'Your Identity', 'Academic Info', 'Skills & Interests', 'Portfolio Links', 'Your Resume'][step]}
          </h1>
          <p style={{ color: '#6C757D', fontSize: '14px', marginBottom: '16px' }}>Step {step} of {TOTAL_STEPS}</p>
          
          {/* Progress bar */}
          <div style={{ height: '6px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #7B61FF, #A78BFA)',
              borderRadius: '3px', width: `${(step / TOTAL_STEPS) * 100}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Step 1: Identity + Profile Picture */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Profile Picture Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                onClick={() => picInputRef.current.click()}
                style={{
                  width: 96, height: 96, borderRadius: '24px', cursor: 'pointer',
                  background: profilePicPreview ? 'transparent' : '#F3F0FF',
                  border: '2px dashed #C4B5FD', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {profilePicPreview
                  ? <img src={profilePicPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '36px' }}>📷</span>
                }
              </div>
              <button type="button" onClick={() => picInputRef.current.click()} style={{ fontSize: '13px', color: '#7B61FF', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
                {profilePicPreview ? 'Change Photo' : 'Upload Profile Photo'}
              </button>
              <input ref={picInputRef} type="file" accept="image/*" onChange={handleProfilePic} style={{ display: 'none' }} />
            </div>

            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={formData.displayName} onChange={e => handleChange('displayName', e.target.value)} placeholder="e.g. Arjun Kumar" />
            </div>
          </div>
        )}

        {/* Step 2: Academic Information */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Institution / University *</label>
              <input style={inputStyle} value={formData.institution} onChange={e => handleChange('institution', e.target.value)} placeholder="e.g. SRM Institute of Technology" />
            </div>
            <div>
              <label style={labelStyle}>Department</label>
              <input style={inputStyle} value={formData.department} onChange={e => handleChange('department', e.target.value)} placeholder="e.g. Computer Science & Engineering" />
            </div>
            <div className="onboarding-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Degree Program</label>
                <input style={inputStyle} value={formData.degreeProgram} onChange={e => handleChange('degreeProgram', e.target.value)} placeholder="e.g. B.Tech" />
              </div>
              <div>
                <label style={labelStyle}>Academic Year *</label>
                <select style={{ ...inputStyle, appearance: 'none' }} value={formData.academicYear} onChange={e => handleChange('academicYear', e.target.value)}>
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                  <option value="Postgrad">Postgrad</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Graduation Year</label>
              <select style={{ ...inputStyle, appearance: 'none' }} value={formData.graduationYear} onChange={e => handleChange('graduationYear', e.target.value)}>
                <option value="">Select year</option>
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Skills & Interests */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={labelStyle}>Skills (Select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '4px 0' }}>
                {SKILL_OPTIONS.map(skill => (
                  <TagPill
                    key={skill} label={skill}
                    selected={formData.skills.includes(skill)}
                    onClick={() => toggleTag('skills', skill)}
                  />
                ))}
              </div>
              {formData.skills.length > 0 && (
                <p style={{ fontSize: '12px', color: '#7B61FF', marginTop: '8px' }}>{formData.skills.length} selected</p>
              )}
            </div>

            <div>
              <label style={labelStyle}>Interests (Select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '4px 0' }}>
                {INTEREST_OPTIONS.map(interest => (
                  <TagPill
                    key={interest} label={interest}
                    selected={formData.interests.includes(interest)}
                    onClick={() => toggleTag('interests', interest)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Career Goals</label>
              <textarea
                style={{ ...inputStyle, height: '80px', resize: 'none' }}
                value={formData.careerGoals}
                onChange={e => handleChange('careerGoals', e.target.value)}
                placeholder="e.g. Become a full-stack engineer at a product startup..."
              />
            </div>
          </div>
        )}

        {/* Step 4: Portfolio Links */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { field: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourprofile', icon: '💼' },
              { field: 'github', label: 'GitHub', placeholder: 'https://github.com/yourusername', icon: '🐙' },
              { field: 'leetcode', label: 'LeetCode', placeholder: 'https://leetcode.com/yourusername', icon: '💻' },
              { field: 'kaggle', label: 'Kaggle', placeholder: 'https://kaggle.com/yourusername', icon: '📊' },
              { field: 'portfolioUrl', label: 'Portfolio Website', placeholder: 'https://yourportfolio.dev', icon: '🌐' },
            ].map(({ field, label, placeholder, icon }) => (
              <div key={field}>
                <label style={labelStyle}>{icon} {label}</label>
                <input
                  style={inputStyle}
                  value={formData[field]}
                  onChange={e => handleChange(field, e.target.value)}
                  placeholder={placeholder}
                  type="url"
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 5: Resume Upload */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={labelStyle}>Resume / CV (PDF, DOCX)</label>
              <div
                onClick={() => resumeInputRef.current.click()}
                style={{
                  border: '2px dashed #C4B5FD', borderRadius: '16px', padding: '40px 24px',
                  textAlign: 'center', cursor: 'pointer', background: resumeFile ? '#F3F0FF' : '#FAFAFA',
                  transition: 'all 0.2s',
                }}
              >
                {resumeFile ? (
                  <>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>📄</div>
                    <p style={{ fontWeight: '600', color: '#7B61FF', marginBottom: '4px' }}>{resumeFile.name}</p>
                    <p style={{ fontSize: '13px', color: '#6C757D' }}>{(resumeFile.size / 1024).toFixed(1)} KB</p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>📂</div>
                    <p style={{ fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Click to upload your resume</p>
                    <p style={{ fontSize: '13px', color: '#6C757D' }}>PDF or DOCX, max 10MB</p>
                  </>
                )}
              </div>
              <input
                ref={resumeInputRef} type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeSelect} style={{ display: 'none' }}
              />
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div>
                <p style={{ fontSize: '13px', color: '#6C757D', marginBottom: '6px' }}>Uploading... {uploadProgress}%</p>
                <div style={{ height: '6px', background: '#F3F4F6', borderRadius: '3px' }}>
                  <div style={{ height: '100%', background: '#7B61FF', borderRadius: '3px', width: `${uploadProgress}%`, transition: 'width 0.2s' }} />
                </div>
              </div>
            )}

            <div style={{ background: '#F3F0FF', borderRadius: '12px', padding: '16px' }}>
              <p style={{ fontSize: '13px', color: '#7B61FF', margin: 0, lineHeight: '1.5' }}>
                💡 <strong>Tip:</strong> You can skip this step and upload your resume later from your profile settings. A well-crafted resume increases your chance of getting shortlisted for competitive events!
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="onboarding-buttons-container">
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: 1, padding: '14px', borderRadius: '10px', background: 'white',
                color: '#7B61FF', border: '1px solid #7B61FF', cursor: 'pointer', fontWeight: '600',
                minHeight: '48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              ← Back
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              style={{
                flex: 2, padding: '14px', borderRadius: '10px',
                background: canProceed() ? '#7B61FF' : '#E9ECEF',
                color: canProceed() ? 'white' : '#6C757D',
                border: 'none', cursor: canProceed() ? 'pointer' : 'not-allowed', fontWeight: '600', fontSize: '15px',
                transition: 'all 0.2s',
                minHeight: '48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                flex: 2, padding: '14px', borderRadius: '10px',
                background: saving ? '#E9ECEF' : 'linear-gradient(135deg, #7B61FF, #9D88FF)',
                color: saving ? '#6C757D' : 'white',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px',
                minHeight: '48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {saving ? 'Saving your profile...' : '🚀 Complete Setup'}
            </button>
          )}
        </div>

        {step < TOTAL_STEPS && (
          <button
            onClick={handleSubmit}
            style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '16px', background: 'none', border: 'none', color: '#6C757D', fontSize: '13px', cursor: 'pointer' }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
