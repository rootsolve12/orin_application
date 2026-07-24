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

const CHENNAI_COLLEGES = [
  "IIT Madras (Indian Institute of Technology Madras)",
  "College of Engineering, Guindy (Anna University)",
  "Madras Institute of Technology (MIT, Chromepet)",
  "Alagappa College of Technology (ACT, Anna University)",
  "SRM Institute of Science and Technology (Kattankulathur)",
  "SRM Institute of Science and Technology (Ramapuram)",
  "SRM Institute of Science and Technology (Vadapalani)",
  "VIT Chennai (Vellore Institute of Technology)",
  "SSN College of Engineering (Sri Sivasubramaniya Nadar)",
  "Sathyabama Institute of Science and Technology",
  "Loyola College",
  "Madras Christian College (MCC)",
  "Stella Maris College",
  "Presidency College",
  "Women's Christian College (WCC)",
  "St. Joseph's College of Engineering",
  "Rajalakshmi Engineering College (REC)",
  "Sri Venkateswara College of Engineering (SVCE)",
  "Panimalar Engineering College",
  "Easwari Engineering College",
  "Meenakshi Sundararajan Engineering College",
  "Saveetha Engineering College",
  "SRM Valliammai Engineering College",
  "Velammal Engineering College",
  "Velammal Institute of Technology",
  "KCG College of Technology",
  "Jeppiaar Engineering College",
  "Jeppiaar Institute of Technology",
  "S.A. Engineering College",
  "RMK Engineering College",
  "RMD Engineering College",
  "RMK College of Engineering and Technology",
  "Anand Institute of Higher Technology",
  "Loyola-ICAM College of Engineering and Technology (LICET)",
  "St. Joseph's Institute of Technology",
  "Chennai Institute of Technology (CIT)",
  "Rajalakshmi Institute of Technology (RIT)",
  "B.S. Abdur Rahman Crescent Institute of Science and Technology",
  "Jerusalem College of Engineering",
  "Vels Institute of Science, Technology & Advanced Studies (VISTAS)",
  "Hindusthan Institute of Technology and Science (HITS)",
  "Sri Sai Ram Engineering College",
  "Sri Sairam Institute of Technology",
  "New College",
  "Guru Nanak College",
  "DG Vaishnav College",
  "Ramakrishna Mission Vivekananda College",
  "Ethiraj College for Women",
  "Queen Mary's College",
  "Justice Basheer Ahmed Sayeed College for Women (SIET)",
  "Meenakshi College for Women",
  "SDNB Vaishnav College for Women",
  "MOP Vaishnav College for Women",
  "Patrician College of Arts and Science",
  "Hindustan College of Arts and Science",
  "Asan Memorial College of Arts and Science",
  "Great Lakes Institute of Management",
  "LIBA (Loyola Institute of Business Administration)",
  "Madras Medical College (MMC)",
  "Stanley Medical College",
  "Kilpauk Medical College (KMC)",
  "Sri Ramachandra Institute of Higher Education and Research",
  "Dr. M.G.R. Educational and Research Institute",
  "Bharath Institute of Higher Education and Research (BIHER)",
  "Tamil Nadu Dr. Ambedkar Law University (TNDALU)",
  "School of Excellence in Law",
  "NIFT Chennai (National Institute of Fashion Technology)",
  "Government College of Fine Arts",
  "MEASI Academy of Architecture",
  "School of Architecture and Planning (SAP, Anna University)",
  "Asian College of Journalism (ACJ)",
  "University of Madras",
  "Tagore Engineering College",
  "Dhanalakshmi Srinivasan College of Engineering and Technology",
  "G.K.M. College of Engineering & Technology",
  "M.N.M. Jain Engineering College",
  "DMI College of Engineering",
  "Aarupadai Veedu Institute of Technology (AVIT)",
  "Chennai National Arts and Science College",
  "St. Peter's College of Engineering and Technology",
  "Venkateswara College of Engineering and Technology",
  "Kalsar College of Engineering",
  "Madha Engineering College",
  "Thangavelu Engineering College",
  "Sri Krishna Engineering College",
  "Sree Sastha Institute of Engineering and Technology",
  "TJS Engineering College",
  "Lord Jegannath College of Engineering and Technology",
  "Misrimal Navajee Munoth Jain Engineering College",
  "Prathyusha Engineering College",
  "Vel Tech Rangarajan Dr. Sagunthala R&D Institute of Science and Technology",
  "Vel Tech High Tech Dr. Rangarajan Dr. Sakunthala Engineering College",
  "Vel Tech Multi Tech Dr. Rangarajan Dr. Sakunthala Engineering College",
  "RMK College of Engineering",
  "Dhanalakshmi College of Engineering",
  "Valliammai Engineering College",
  "Meenakshi College of Engineering",
  "Gojan School of Business and Technology",
  "PMR Engineering College",
  "SKR Engineering College"
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { currentUser, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: currentUser?.email || '',
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
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName: `${formData.firstName} ${formData.lastName}`.trim(),
        mobile: formData.mobile,
        email: formData.email,
        location: formData.location,
        institution: formData.institution,
        degree: formData.degree,
        graduationYear: formData.graduationYear,
        techStack: formData.techStack,
        linkedin: formData.linkedin,
        github: formData.github,
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
    if (step === 1) {
      return formData.firstName.trim().length > 0 && 
             formData.lastName.trim().length > 0 && 
             formData.mobile.trim().length === 10 && 
             formData.location.trim().length > 0;
    }
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>First Name <span style={{ color: 'red' }}>*</span></label>
                <input 
                  style={inputStyle}
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={e => handleChange('firstName', e.target.value)}
                />
              </div>
              <div>
                <label style={labelStyle}>Last Name <span style={{ color: 'red' }}>*</span></label>
                <input 
                  style={inputStyle}
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={e => handleChange('lastName', e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Email Address</label>
              <input 
                style={{ ...inputStyle, background: '#E2E8F0', cursor: 'not-allowed' }}
                disabled
                value={formData.email}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Mobile Number <span style={{ color: 'red' }}>*</span></label>
              <input 
                style={inputStyle}
                placeholder="10-digit mobile number"
                type="tel"
                maxLength={10}
                value={formData.mobile}
                onChange={e => handleChange('mobile', e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Location <span style={{ color: 'red' }}>*</span></label>
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

            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={labelStyle}>Institution / University <span style={{ color: 'red' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <GraduationCap size={20} color="#ADB5BD" style={{ position: 'absolute', left: '16px', top: '15px' }} />
                <input 
                  style={{ ...inputStyle, paddingLeft: '44px' }}
                  placeholder="Search & select Chennai college..."
                  value={formData.institution}
                  onChange={e => {
                    handleChange('institution', e.target.value);
                    setShowCollegeDropdown(true);
                  }}
                  onFocus={() => setShowCollegeDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCollegeDropdown(false), 200)}
                />
              </div>
              
              {showCollegeDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'white', border: '1.5px solid #E9ECEF', borderRadius: '12px',
                  maxHeight: '200px', overflowY: 'auto', zIndex: 100, marginTop: '4px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                }}>
                  {CHENNAI_COLLEGES.filter(c => c.toLowerCase().includes(formData.institution.toLowerCase())).map((college, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        handleChange('institution', college);
                        setShowCollegeDropdown(false);
                      }}
                      style={{
                        padding: '12px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                        color: '#495057', borderBottom: '1px solid #F1F3F5',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.background = '#EDE9FE'}
                      onMouseOut={e => e.currentTarget.style.background = 'white'}
                    >
                      {college}
                    </div>
                  ))}
                  {CHENNAI_COLLEGES.filter(c => c.toLowerCase().includes(formData.institution.toLowerCase())).length === 0 && (
                    <div style={{ padding: '12px 16px', fontSize: '13px', color: '#868E96', textAlign: 'center' }}>
                      No matching Chennai college found. You can type your own.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Degree / Major <span style={{ color: 'red' }}>*</span></label>
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
