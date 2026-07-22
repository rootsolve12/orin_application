import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { registerForEvent } from '../firebase/firestore';

export default function RegistrationModal({ event, onClose, onSuccess }) {
  const { currentUser, userProfile: profile } = useAuth();
  const [customAnswers, setCustomAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCustomAnswerChange = (question, value) => {
    setCustomAnswers(prev => ({ ...prev, [question]: value }));
  };

  const handleRegister = async () => {
    setIsSubmitting(true);
    try {
      await registerForEvent(event.id, currentUser.uid, {
        customAnswers,
        autoFilledProfile: profile
      });
      onSuccess('Registration Successful');
    } catch (err) {
      console.error(err);
      onSuccess('Failed to register. You might be already registered.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) return null; // Wait until profile loads to show the modal

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: '24px', padding: '32px',
        width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 48px rgba(0,0,0,0.1)'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="heading-2">Register: {event.title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        </div>

        <div style={{ background: 'rgba(123, 97, 255, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(123, 97, 255, 0.2)', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>✨ Intelligent Auto-Fill Active</h3>
          <p className="text-muted" style={{ fontSize: '14px', marginBottom: '16px' }}>
            We've automatically pulled your comprehensive academic identity from your Orin profile. You don't need to type this again!
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted-light)' }}>Name</div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{profile.name}</div>
            </div>
            <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted-light)' }}>Institution</div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{profile.institution}</div>
            </div>
            <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted-light)' }}>Degree & Year</div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{profile.degreeProgram} ({profile.academicYear})</div>
            </div>
            <div style={{ background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '12px', color: 'var(--muted-light)' }}>Resume Attached?</div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: profile.resumeUrl ? 'green' : 'red' }}>
                {profile.resumeUrl ? 'Yes' : 'No Resume on Profile'}
              </div>
            </div>
          </div>
        </div>

        {event.organizerQuestions && event.organizerQuestions.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Organizer Questions</h3>
            {event.organizerQuestions.map((q, idx) => (
              <div key={idx} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: '500' }}>{q}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Your answer..."
                  value={customAnswers[q] || ''}
                  onChange={(e) => handleCustomAnswerChange(q, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={handleRegister} 
          disabled={isSubmitting}
          className="btn-primary" 
          style={{ width: '100%', fontSize: '16px', padding: '16px' }}
        >
          {isSubmitting ? 'Registering...' : 'Confirm & Enter Action Center'}
        </button>

      </div>
    </div>
  );
}
