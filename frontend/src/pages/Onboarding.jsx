import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../firebase/firestore';
import { MapPin, GraduationCap, Code2, Link as LinkIcon, ChevronRight, Check, Sparkles } from 'lucide-react';

const TOTAL_STEPS = 4;

const SKILLS_LIST = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
  'Java', 'C++', 'Rust', 'Go', 'Solidity', 'SQL',
  'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Figma', 'UI/UX'
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { currentUser, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    location: '',
    institution: '',
    degree: '',
    graduationYear: '2026',
    techStack: [],
    linkedin: '',
    github: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skill) => {
    setFormData(prev => {
      if (prev.techStack.includes(skill)) {
        return { ...prev, techStack: prev.techStack.filter(s => s !== skill) };
      }
      if (prev.techStack.length >= 5) return prev;
      return { ...prev, techStack: [...prev.techStack, skill] };
    });
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
    if (step === 1) return formData.displayName.trim().length > 0 && formData.location.trim().length > 0;
    if (step === 2) return formData.institution.trim().length > 0 && formData.degree.trim().length > 0;
    if (step === 3) return formData.techStack.length > 0;
    return true;
  };

  const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#495057' };
  const inputStyle = {
    width: '100%', padding: '14px 16px', border: '1.5px solid #E9ECEF',
    borderRadius: '12px', fontSize: '15px', fontWeight: '500', outline: 'none', boxSizing: 'border-box',
    background: '#FAFAFB', color: '#1A1A1A', transition: 'all 0.2s ease'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        width: '100%', maxWidth: '540px', background: 'white',
        borderRadius: '24px', padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        position: 'relative', overflow: 'hidden'
      }}>
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[1, 2, 3, 4].map(s => (
            <div key={s} style={{
              flex: 1, height: '6px', borderRadius: '4px',
              background: s <= step ? 'var(--primary)' : '#E9ECEF',
              transition: 'all 0.3s ease'
            }} />
          ))}
        </div>

        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(123, 97, 255, 0.1)', padding: '10px', borderRadius: '12px' }}><Sparkles color="var(--primary)" size={24} /></div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>Core Identity</h2>
            </div>
            <p style={{ color: '#6C757D', marginBottom: '32px' }}>Let's start with the basics. How should people know you?</p>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Full Name</label>
              <input 
                style={inputStyle}
                placeholder="John Doe"
                value={formData.displayName}
                onChange={e => handleChange('displayName', e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={20} color="#ADB5BD" style={{ position: 'absolute', left: '16px', top: '15px' }} />
                <input 
                  style={{ ...inputStyle, paddingLeft: '44px' }}
                  placeholder="City, Country"
                  value={formData.location}
                  onChange={e => handleChange('location', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(123, 97, 255, 0.1)', padding: '10px', borderRadius: '12px' }}><GraduationCap color="var(--primary)" size={24} /></div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>Academics</h2>
            </div>
            <p style={{ color: '#6C757D', marginBottom: '32px' }}>Tell us where you're building your foundation.</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Institution / University</label>
              <input 
                style={inputStyle}
                placeholder="e.g. SRM Institute of Science and Technology"
                value={formData.institution}
                onChange={e => handleChange('institution', e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Degree / Major</label>
              <input 
                style={inputStyle}
                placeholder="e.g. B.Tech Computer Science"
                value={formData.degree}
                onChange={e => handleChange('degree', e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Expected Graduation Year</label>
              <select 
                style={inputStyle}
                value={formData.graduationYear}
                onChange={e => handleChange('graduationYear', e.target.value)}
              >
                {['2024', '2025', '2026', '2027', '2028', '2029', 'Alumni'].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(123, 97, 255, 0.1)', padding: '10px', borderRadius: '12px' }}><Code2 color="var(--primary)" size={24} /></div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>Tech Stack</h2>
            </div>
            <p style={{ color: '#6C757D', marginBottom: '24px' }}>Select up to 5 core skills that you excel at.</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' }}>
              {SKILLS_LIST.map(skill => {
                const isSelected = formData.techStack.includes(skill);
                const isDisabled = !isSelected && formData.techStack.length >= 5;
                return (
                  <button
                    key={skill}
                    disabled={isDisabled}
                    onClick={() => toggleSkill(skill)}
                    style={{
                      padding: '10px 16px', borderRadius: '100px', fontSize: '14px', fontWeight: '600',
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : '#E9ECEF'}`,
                      background: isSelected ? 'var(--primary)' : 'white',
                      color: isSelected ? 'white' : '#495057',
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.5 : 1,
                      transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    {isSelected && <Check size={14} />} {skill}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '600' }}>
              {formData.techStack.length}/5 Selected
            </p>
          </div>
        )}

        {step === 4 && (
          <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(123, 97, 255, 0.1)', padding: '10px', borderRadius: '12px' }}><LinkIcon color="var(--primary)" size={24} /></div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1A1A1A', margin: 0 }}>Social Proof</h2>
            </div>
            <p style={{ color: '#6C757D', marginBottom: '32px' }}>Connect your profiles to build your reputation.</p>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>GitHub Profile (Optional)</label>
              <input 
                style={inputStyle}
                placeholder="https://github.com/username"
                value={formData.github}
                onChange={e => handleChange('github', e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>LinkedIn Profile (Optional)</label>
              <input 
                style={inputStyle}
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedin}
                onChange={e => handleChange('linkedin', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '40px' }}>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                flex: 1, padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: '700',
                background: 'white', color: '#495057', border: '1.5px solid #E9ECEF', cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#F8F9FA'}
              onMouseOut={e => e.currentTarget.style.background = 'white'}
            >
              Back
            </button>
          )}
          
          <button
            onClick={() => {
              if (step < TOTAL_STEPS) setStep(step + 1);
              else handleSubmit();
            }}
            disabled={!canProceed() || saving}
            style={{
              flex: 2, padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: '700',
              background: canProceed() ? 'var(--primary)' : '#ADB5BD', color: 'white',
              border: 'none', cursor: canProceed() && !saving ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'background 0.2s', boxShadow: canProceed() ? '0 4px 14px rgba(123, 97, 255, 0.4)' : 'none'
            }}
          >
            {saving ? 'Saving...' : step === TOTAL_STEPS ? 'Complete Profile' : 'Continue'}
            {!saving && step < TOTAL_STEPS && <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
