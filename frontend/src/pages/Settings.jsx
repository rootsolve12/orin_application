import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Lock, ArrowLeft, Loader2, CheckCircle2, User, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../firebase/firestore';
import { resetPassword, logout } from '../firebase/auth';

export default function Settings() {
  const navigate = useNavigate();
  const { currentUser, userProfile, refreshProfile } = useAuth();
  
  // Profile states
  const [displayName, setDisplayName] = useState('');
  const [institution, setInstitution] = useState('');
  const [bio, setBio] = useState('');

  // Notification states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [activityUpdates, setActivityUpdates] = useState(true);
  
  // Operation states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Load current values
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setInstitution(userProfile.institution || '');
      setBio(userProfile.bio || '');
      
      if (userProfile.notificationSettings) {
        const ns = userProfile.notificationSettings;
        setEmailAlerts(ns.emailAlerts !== false);
        setActivityUpdates(ns.activityUpdates !== false);
      }
    }
  }, [userProfile]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await updateUserProfile(currentUser.uid, {
        displayName,
        institution,
        bio,
        notificationSettings: {
          emailAlerts,
          activityUpdates
        }
      });
      await refreshProfile();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!currentUser?.email) return;
    setIsResettingPassword(true);
    setResetSuccess(false);
    try {
      await resetPassword(currentUser.email);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 5000);
    } catch (err) {
      console.error("Error resetting password:", err);
      alert("Failed to send password reset email. Please try again.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 16px 60px', color: 'var(--text-light)', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top back navigation */}
      <button 
        onClick={() => navigate('/profile')} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--muted-light)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          cursor: 'pointer', 
          fontSize: '14px', 
          fontWeight: '600', 
          marginBottom: '20px',
          padding: 0
        }}
      >
        <ArrowLeft size={16} /> Back to Profile
      </button>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="heading-1" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '28px', fontWeight: '800' }}>
          <SettingsIcon size={26} color="var(--primary)" /> Workspace Settings
        </h1>
        <p className="text-muted" style={{ marginTop: '6px', fontSize: '14px' }}>
          Configure your personal profile details, notification preferences, and account security.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Form Card */}
        <form onSubmit={handleSaveSettings} style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border-light)', 
          borderRadius: '20px', 
          padding: '24px', 
          boxShadow: '0 4px 18px rgba(127, 86, 217, 0.02)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '24px' 
        }}>
          
          {/* SECTION 1: Personal Profile */}
          <div>
            <h2 style={{ 
              fontSize: '15px', 
              fontWeight: '800', 
              marginBottom: '16px', 
              color: 'var(--text-light)', 
              borderBottom: '1px solid var(--border-light)', 
              paddingBottom: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <User size={16} color="var(--primary)" /> Personal Profile
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-light)' }}>Full Name</label>
                <input 
                  type="text" 
                  required 
                  value={displayName} 
                  onChange={e => setDisplayName(e.target.value)} 
                  placeholder="Enter full name" 
                  className="form-input"
                  style={{ fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-light)' }}>Institution / College</label>
                <input 
                  type="text" 
                  value={institution} 
                  onChange={e => setInstitution(e.target.value)} 
                  placeholder="e.g. SRM Institute of Technology" 
                  className="form-input"
                  style={{ fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-light)' }}>Short Bio / Headline</label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  placeholder="Tell us about yourself..." 
                  className="form-input"
                  rows={3}
                  style={{ 
                    resize: 'vertical', 
                    fontFamily: 'inherit', 
                    fontSize: '14px',
                    lineHeight: '1.5' 
                  }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Notification Preferences */}
          <div>
            <h2 style={{ 
              fontSize: '15px', 
              fontWeight: '800', 
              marginBottom: '16px', 
              color: 'var(--text-light)', 
              borderBottom: '1px solid var(--border-light)', 
              paddingBottom: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <Bell size={16} color="var(--primary)" /> Notifications
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Event Updates */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)' }}>Event Updates</h4>
                  <p style={{ fontSize: '11px', color: 'var(--muted-light)', marginTop: '2px', lineHeight: '1.4' }}>
                    Receive emails for announcements and timeline deadlines.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailAlerts(!emailAlerts)}
                  style={{
                    width: '46px', height: '24px', borderRadius: '12px',
                    background: emailAlerts ? 'var(--primary)' : '#E4E7EC',
                    border: 'none', cursor: 'pointer', position: 'relative',
                    transition: 'background 0.2s', padding: 0, flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                    position: 'absolute', top: '3px', left: emailAlerts ? '25px' : '3px',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                  }} />
                </button>
              </div>
              
              {/* Team Tenders */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)' }}>Team Invites</h4>
                  <p style={{ fontSize: '11px', color: 'var(--muted-light)', marginTop: '2px', lineHeight: '1.4' }}>
                    Receive real-time alerts when invited to join campus groups.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActivityUpdates(!activityUpdates)}
                  style={{
                    width: '46px', height: '24px', borderRadius: '12px',
                    background: activityUpdates ? 'var(--primary)' : '#E4E7EC',
                    border: 'none', cursor: 'pointer', position: 'relative',
                    transition: 'background 0.2s', padding: 0, flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                    position: 'absolute', top: '3px', left: activityUpdates ? '25px' : '3px',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                  }} />
                </button>
              </div>

            </div>
          </div>

          {/* Success Feedback Banner */}
          {saveSuccess && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#ECFDF3', border: '1px solid #D1FADF',
              color: '#027A48', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '600'
            }}>
              <CheckCircle2 size={14} /> Profile settings saved successfully.
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '12px', width: '100%', fontSize: '14px', fontWeight: '700', borderRadius: '10px'
            }}
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save size={15} /> Save Settings
              </>
            )}
          </button>

        </form>

        {/* Security & System Settings Card */}
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border-light)', 
          borderRadius: '20px', 
          padding: '24px', 
          boxShadow: '0 4px 18px rgba(127, 86, 217, 0.02)',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px' 
        }}>
          
          <h2 style={{ 
            fontSize: '15px', 
            fontWeight: '800', 
            marginBottom: '4px', 
            color: 'var(--text-light)', 
            borderBottom: '1px solid var(--border-light)', 
            paddingBottom: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <Lock size={16} color="var(--primary)" /> Security & Session
          </h2>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)' }}>Change Password</h4>
              <p style={{ fontSize: '11px', color: 'var(--muted-light)', marginTop: '2px', lineHeight: '1.4' }}>
                Sends a secure password reset link to your email {currentUser?.email}.
              </p>
            </div>
            <button
              type="button"
              disabled={isResettingPassword}
              onClick={handleResetPassword}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                background: '#F9F5FF',
                color: 'var(--primary)',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '12px',
                whiteSpace: 'nowrap'
              }}
            >
              {isResettingPassword ? 'Sending...' : 'Reset Password'}
            </button>
          </div>

          {resetSuccess && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#F4F3FF', border: '1px solid #D6BBFB',
              color: 'var(--primary)', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: '600'
            }}>
              <CheckCircle2 size={14} /> Password reset email sent. Please check your inbox.
            </div>
          )}

          <div style={{ height: '1px', background: 'var(--border-light)' }} />

          {/* Session Logout */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-light)' }}>Account Session</h4>
              <p style={{ fontSize: '11px', color: 'var(--muted-light)', marginTop: '2px', lineHeight: '1.4' }}>
                Logout from your active workspace session on this device.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #FDA29B',
                background: '#FEF3C7',
                color: '#B54708',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '12px',
                whiteSpace: 'nowrap'
              }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
