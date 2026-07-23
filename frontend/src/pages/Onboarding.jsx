import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../firebase/firestore';

const TOTAL_STEPS = 4;

const ROLES = [
  { id: 'web', label: 'Web Developer', desc: 'Frontend, Backend, or Full Stack Web Applications', icon: '🌐' },
  { id: 'mobile', label: 'Mobile Developer', desc: 'Android, iOS, or Cross-Platform (Flutter/React Native)', icon: '📱' },
  { id: 'ai_data', label: 'Data Scientist / AI', desc: 'Machine Learning, AI models, and Data Analytics', icon: '📊' },
  { id: 'design', label: 'UI/UX Designer', desc: 'Product Design, wireframing, and Figma prototypes', icon: '🎨' },
  { id: 'security', label: 'Security Engineer', desc: 'Smart Contract Auditing, Cryptography, and Security', icon: '🔒' }
];

const EXPERIENCE_LEVELS = [
  { id: 'novice', label: 'Novice / Learner 🌱', desc: 'Just started coding. Looking to learn, join teams, and build basics.' },
  { id: 'builder', label: 'Intermediate Builder 🛠️', desc: 'Understand APIs, git, and have built a few personal projects.' },
  { id: 'veteran', label: 'Hackathon Veteran 🏆', desc: 'Participated in events. Comfortable coding fast and building prototypes.' },
  { id: 'expert', label: 'Experienced Specialist 🧠', desc: 'Professional experience or advanced knowledge in specific domains.' }
];

const TEAM_STYLES = [
  { id: 'solo', label: 'Solo Hacker 🧑‍💻', desc: 'Prefer working independently on assessments, challenges, and code.' },
  { id: 'player', label: 'Team Player 👥', desc: 'Love collaborating, brainstorming, and building projects together.' },
  { id: 'leader', label: 'Team Leader 👑', desc: 'Enjoy coordinate tasks, guiding teammates, and managing deliverables.' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { currentUser, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    developerRole: '',
    experienceLevel: '',
    teamStyle: '',
    linkedin: '',
    github: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        onboardingComplete: true,
        updatedAt: new Date().toISOString(),
      };

      if (currentUser) {
        await updateUserProfile(currentUser.uid, payload);
        await refreshProfile();
      }

      navigate('/');
    } catch (err) {
      console.error('Error saving onboarding details:', err);
      alert('Failed to save profile details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.displayName.trim().length > 0 && formData.developerRole !== '';
    if (step === 2) return formData.experienceLevel !== '';
    if (step === 3) return formData.teamStyle !== '';
    return true;
  };

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#495057' };

  const inputStyle = {
    width: '100%', padding: '14px 16px', border: '1.5px solid #E9ECEF',
    borderRadius: '12px', fontSize: '15px', fontWeight: '500', outline: 'none', boxSizing: 'border-box',
    background: '#FAFAFB', color: '#1A1A1A', transition: 'all 0.2s ease'
  };

  // E2E SVG Logos for Social Accounts
  const LINKEDIN_SVG = (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#0A66C2">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  );

  const GITHUB_SVG = (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="#181717">
      <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
    </svg>
  );

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #F8F9FA 0%, #EDE9FE 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div className="onboarding-card">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <img src="/master_icon.png" alt="Orin" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span style={{ fontWeight: '800', fontSize: '18px', color: '#1A1A1A', letterSpacing: '-0.5px' }}>Orin Setup</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px', letterSpacing: '-0.5px' }}>
            {['', 'Tell us about yourself', 'Your Experience', 'Your Hackathon Style', 'Link Accounts'][step]}
          </h1>
          <p style={{ color: '#6C757D', fontSize: '14px', marginBottom: '16px', fontWeight: '500' }}>Step {step} of {TOTAL_STEPS}</p>
          
          {/* Progress bar */}
          <div style={{ height: '6px', background: '#E9ECEF', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'linear-gradient(90deg, #7B61FF, #A78BFA)',
              borderRadius: '3px', width: `${(step / TOTAL_STEPS) * 100}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Step 1: Identity & Persona */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input 
                style={inputStyle} 
                value={formData.displayName} 
                onChange={e => handleChange('displayName', e.target.value)} 
                placeholder="e.g. Arjun Kumar" 
                onFocus={(e) => e.currentTarget.style.borderColor = '#7B61FF'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E9ECEF'}
              />
            </div>

            <div>
              <label style={labelStyle}>Select Developer Persona *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {ROLES.map(role => (
                  <div
                    key={role.id}
                    onClick={() => handleChange('developerRole', role.id)}
                    style={{
                      border: `1.5px solid ${formData.developerRole === role.id ? '#7B61FF' : '#E9ECEF'}`,
                      borderRadius: '16px',
                      padding: '16px',
                      cursor: 'pointer',
                      background: formData.developerRole === role.id ? '#F8F7FF' : 'white',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      minHeight: '48px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{role.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '800', fontSize: '15px', color: formData.developerRole === role.id ? '#7B61FF' : '#212529' }}>{role.label}</div>
                      <div style={{ fontSize: '12px', color: '#868E96', marginTop: '2px', fontWeight: '500' }}>{role.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Coding Experience Rating */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#6C757D', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>How would you rate your coding level?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {EXPERIENCE_LEVELS.map(level => (
                <div
                  key={level.id}
                  onClick={() => handleChange('experienceLevel', level.id)}
                  style={{
                    border: `1.5px solid ${formData.experienceLevel === level.id ? '#7B61FF' : '#E9ECEF'}`,
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    background: formData.experienceLevel === level.id ? '#F8F7FF' : 'white',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minHeight: '48px'
                  }}
                >
                  <div style={{ fontWeight: '800', fontSize: '15px', color: formData.experienceLevel === level.id ? '#7B61FF' : '#212529' }}>{level.label}</div>
                  <div style={{ fontSize: '12px', color: '#868E96', fontWeight: '500', lineHeight: '1.4' }}>{level.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Hackathon Participation Preferences */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: '#6C757D', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>What is your preferred style of team collaboration?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {TEAM_STYLES.map(style => (
                <div
                  key={style.id}
                  onClick={() => handleChange('teamStyle', style.id)}
                  style={{
                    border: `1.5px solid ${formData.teamStyle === style.id ? '#7B61FF' : '#E9ECEF'}`,
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    background: formData.teamStyle === style.id ? '#F8F7FF' : 'white',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minHeight: '48px'
                  }}
                >
                  <div style={{ fontWeight: '800', fontSize: '15px', color: formData.teamStyle === style.id ? '#7B61FF' : '#212529' }}>{style.label}</div>
                  <div style={{ fontSize: '12px', color: '#868E96', fontWeight: '500', lineHeight: '1.4' }}>{style.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Social Accounts */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ color: '#6C757D', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Connect your developer accounts to build reputation.</p>
            
            <div>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {LINKEDIN_SVG} LinkedIn Profile URL
              </label>
              <input
                style={inputStyle}
                value={formData.linkedin}
                onChange={e => handleChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/username"
                type="url"
                onFocus={(e) => e.currentTarget.style.borderColor = '#7B61FF'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E9ECEF'}
              />
            </div>

            <div>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {GITHUB_SVG} GitHub Username URL
              </label>
              <input
                style={inputStyle}
                value={formData.github}
                onChange={e => handleChange('github', e.target.value)}
                placeholder="https://github.com/username"
                type="url"
                onFocus={(e) => e.currentTarget.style.borderColor = '#7B61FF'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E9ECEF'}
              />
            </div>

            <div style={{ background: '#F8F7FF', borderRadius: '12px', padding: '16px', border: '1px solid #E9ECEF', marginTop: '8px' }}>
              <p style={{ fontSize: '13px', color: '#7B61FF', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
                💡 <strong>Optional:</strong> You can leave these blank and configure them later inside your profile dashboard configurations.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="onboarding-buttons-container" style={{ marginTop: '32px' }}>
          {step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              style={{
                flex: 1, padding: '14px', borderRadius: '12px', background: 'white',
                color: '#7B61FF', border: '1.5px solid #7B61FF', cursor: 'pointer', fontWeight: '700',
                fontSize: '15px', minHeight: '48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'none'
              }}
            >
              Back
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              style={{
                flex: 2, padding: '14px', borderRadius: '12px',
                background: canProceed() ? '#7B61FF' : '#D6D1FA',
                color: 'white',
                border: 'none', cursor: canProceed() ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '15px',
                transition: 'all 0.2s',
                minHeight: '48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: canProceed() ? '0 4px 12px rgba(123, 97, 255, 0.2)' : 'none'
              }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                flex: 2, padding: '14px', borderRadius: '12px',
                background: saving ? '#D6D1FA' : 'linear-gradient(135deg, #7B61FF, #9D88FF)',
                color: 'white',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '15px',
                minHeight: '48px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(123, 97, 255, 0.25)'
              }}
            >
              {saving ? 'Completing...' : 'Complete Setup 🚀'}
            </button>
          )}
        </div>

        {step < TOTAL_STEPS && (
          <button
            onClick={handleSubmit}
            style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '20px', background: 'none', border: 'none', color: '#6C757D', fontSize: '13px', cursor: 'pointer', fontWeight: '700', minHeight: '44px' }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
