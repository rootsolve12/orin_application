import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Save, Lock, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { updateUserProfile } from '../firebase/firestore';

export default function Settings() {
  const navigate = useNavigate();
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // Privacy states
  const [collegeVisible, setCollegeVisible] = useState(true);
  const [emailVisible, setEmailVisible] = useState(true);
  const [portfolioPublic, setPortfolioPublic] = useState(true);
  
  // Operation states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load current values
  useEffect(() => {
    if (userProfile?.privacySettings) {
      const ps = userProfile.privacySettings;
      setCollegeVisible(ps.collegeVisible !== false);
      setEmailVisible(ps.emailVisible !== false);
      setPortfolioPublic(ps.portfolioPublic !== false);
    }
  }, [userProfile]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await updateUserProfile(currentUser.uid, {
        privacySettings: {
          collegeVisible,
          emailVisible,
          portfolioPublic
        }
      });
      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving privacy settings:", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px 48px', color: 'var(--text-light)' }}>
      
      {/* Top back navigation */}
      <button 
        onClick={() => navigate('/profile')} 
        style={{ background: 'none', border: 'none', color: 'var(--muted-light)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', marginBottom: '24px' }}
      >
        <ArrowLeft size={18} /> Back to Profile
      </button>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 className="heading-1" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={28} color="var(--primary)" /> Privacy & Security Settings
        </h1>
        <p className="text-muted" style={{ marginTop: '8px' }}>Control what information is visible to organizers, teammates, and recruiters.</p>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSaveSettings} style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '28px' }}>
        


        <div style={{ height: '1px', background: 'var(--border-light)' }} />

        {/* Toggle 1: College Visibility */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {collegeVisible ? <Eye size={16} color="var(--primary)" /> : <EyeOff size={16} color="var(--muted-light)" />}
              Show Institutional Details
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted-light)', lineHeight: '1.5' }}>
              When enabled, other students and team builders will see your college name, degree program, ID, and department on the finder board.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCollegeVisible(!collegeVisible)}
            style={{
              width: '52px', height: '28px', borderRadius: '14px',
              background: collegeVisible ? 'var(--primary)' : 'var(--border-light)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s', padding: 0
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', background: 'white',
              position: 'absolute', top: '3px', left: collegeVisible ? '27px' : '3px',
              transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
            }} />
          </button>
        </div>

        <div style={{ height: '1px', background: 'var(--border-light)' }} />

        {/* Toggle 2: Contact Info Visibility */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {emailVisible ? <Eye size={16} color="var(--primary)" /> : <EyeOff size={16} color="var(--muted-light)" />}
              Share Contact Info
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted-light)', lineHeight: '1.5' }}>
              Make your email address visible to event organizers and approved members in your team workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEmailVisible(!emailVisible)}
            style={{
              width: '52px', height: '28px', borderRadius: '14px',
              background: emailVisible ? 'var(--primary)' : 'var(--border-light)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s', padding: 0
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', background: 'white',
              position: 'absolute', top: '3px', left: emailVisible ? '27px' : '3px',
              transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
            }} />
          </button>
        </div>

        <div style={{ height: '1px', background: 'var(--border-light)' }} />

        {/* Toggle 3: Portfolio visibility */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {portfolioPublic ? <Eye size={16} color="var(--primary)" /> : <EyeOff size={16} color="var(--muted-light)" />}
              Public Portfolio Link
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--muted-light)', lineHeight: '1.5' }}>
              Allow recruiters and other campus students to verify your certificates, badges, and project files directly via your public link.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPortfolioPublic(!portfolioPublic)}
            style={{
              width: '52px', height: '28px', borderRadius: '14px',
              background: portfolioPublic ? 'var(--primary)' : 'var(--border-light)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s', padding: 0
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', background: 'white',
              position: 'absolute', top: '3px', left: portfolioPublic ? '27px' : '3px',
              transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
            }} />
          </button>
        </div>

        {/* Success Feedback Banner */}
        {saveSuccess && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(40,167,69,0.08)', border: '1px solid rgba(40,167,69,0.2)',
            color: '#28A745', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '600'
          }}>
            <CheckCircle2 size={16} /> Privacy settings saved successfully.
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '14px', width: '100%', fontSize: '14px', fontWeight: '700'
          }}
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Saving Changes...
            </>
          ) : (
            <>
              <Save size={16} /> Save Privacy Settings
            </>
          )}
        </button>

      </form>
    </div>
  );
}
