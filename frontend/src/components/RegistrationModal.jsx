import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { registerForEvent } from '../firebase/firestore';
import { ChevronRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';

export default function RegistrationModal({ event, onClose, onSuccess }) {
  const { currentUser, userProfile: profile } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Basic Details State
  const [firstName, setFirstName] = useState(profile?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(profile?.name?.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [mobile, setMobile] = useState(profile?.mobile || '');
  const [gender, setGender] = useState('Male'); // Default or pull from profile if exists
  const [institute, setInstitute] = useState(profile?.institution || '');

  // User Details State
  const [userType, setUserType] = useState('College Students');
  const [domain, setDomain] = useState('Engineering');
  const [course, setCourse] = useState(profile?.degreeProgram || '');
  const [specialization, setSpecialization] = useState(profile?.skills?.[0] || '');
  const [gradYear, setGradYear] = useState(profile?.academicYear || '2026');
  const [duration, setDuration] = useState('4 Years');

  // Terms State
  const [agreed, setAgreed] = useState(false);

  const handleRegister = async () => {
    if (!agreed) return alert('You must agree to the Terms & Conditions.');
    setIsSubmitting(true);
    try {
      await registerForEvent(event.id, currentUser.uid, {
        registrationData: {
          firstName, lastName, email, mobile, gender, institute,
          userType, domain, course, specialization, gradYear, duration
        },
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

  if (!profile) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
      padding: '24px'
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: '24px',
        width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-light)' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-light)' }}>Registration Form</h2>
            <p style={{ fontSize: '13px', color: 'var(--muted-light)', margin: '4px 0 0 0' }}>{event.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: 'var(--muted-light)' }}>&times;</button>
        </div>

        {/* Progress Bar */}
        <div style={{ display: 'flex', padding: '0 32px', marginTop: '24px' }}>
          {[
            { num: 1, label: 'Basic Details' },
            { num: 2, label: 'User Details' },
            { num: 3, label: 'Terms' }
          ].map((s, idx) => (
            <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: idx !== 2 ? 1 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step >= s.num ? 'var(--primary)' : 'var(--bg-light)',
                  color: step >= s.num ? 'white' : 'var(--muted-light)',
                  fontWeight: '800', fontSize: '12px', border: step < s.num ? '1px solid var(--border-light)' : 'none'
                }}>
                  {step > s.num ? <Check size={14} /> : s.num}
                </div>
                <span style={{ fontSize: '13px', fontWeight: step >= s.num ? '700' : '500', color: step >= s.num ? 'var(--text-light)' : 'var(--muted-light)', whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              {idx !== 2 && <div style={{ height: '2px', background: step > s.num ? 'var(--primary)' : 'var(--border-light)', flex: 1, margin: '0 16px' }} />}
            </div>
          ))}
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
          
          {/* STEP 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px 16px', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Check size={18} color="#10B981" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#10B981' }}>Intelligent Auto-fill Applied</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-light)', marginTop: '2px' }}>We've pulled details from your Orin profile to save you time.</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)', marginBottom: '8px' }}>First Name *</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)', marginBottom: '8px' }}>Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)', marginBottom: '8px' }}>Email *</label>
                  <input type="email" value={email} disabled style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--muted-light)', outline: 'none', opacity: 0.7 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)', marginBottom: '8px' }}>Mobile *</label>
                  <input type="text" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="+91" style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)', marginBottom: '8px' }}>Gender *</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {['Female', 'Male', 'Transgender', 'Non-binary', 'Prefer not to say'].map(g => (
                    <button key={g} onClick={() => setGender(g)} style={{ 
                      padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                      background: gender === g ? 'rgba(123, 97, 255, 0.1)' : 'transparent',
                      border: gender === g ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                      color: gender === g ? 'var(--primary)' : 'var(--text-light)'
                    }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)', marginBottom: '8px' }}>Institute Name *</label>
                <input type="text" value={institute} onChange={e => setInstitute(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', outline: 'none' }} />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)', marginBottom: '8px' }}>Type *</label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {['College Students', 'Professional', 'School Student', 'Fresher'].map(t => (
                    <button key={t} onClick={() => setUserType(t)} style={{ 
                      padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                      background: userType === t ? 'rgba(123, 97, 255, 0.1)' : 'transparent',
                      border: userType === t ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                      color: userType === t ? 'var(--primary)' : 'var(--text-light)'
                    }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)', marginBottom: '8px' }}>Domain *</label>
                <select value={domain} onChange={e => setDomain(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', outline: 'none', appearance: 'none' }}>
                  <option>Engineering</option>
                  <option>Management</option>
                  <option>Arts & Science</option>
                  <option>Medical</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)', marginBottom: '8px' }}>Course *</label>
                <input type="text" value={course} onChange={e => setCourse(e.target.value)} placeholder="e.g. B.Tech/BE" style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)', marginBottom: '8px' }}>Course Specialization *</label>
                <input type="text" value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="e.g. Computer Science" style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)', marginBottom: '8px' }}>Graduating Year *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['2025', '2026', '2027', '2028'].map(y => (
                      <button key={y} onClick={() => setGradYear(y)} style={{ 
                        flex: 1, padding: '8px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                        background: gradYear === y ? 'rgba(123, 97, 255, 0.1)' : 'transparent',
                        border: gradYear === y ? '1.5px solid var(--primary)' : '1px solid var(--border-light)',
                        color: gradYear === y ? 'var(--primary)' : 'var(--text-light)'
                      }}>{y}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--muted-light)', marginBottom: '8px' }}>Course Duration *</label>
                  <select value={duration} onChange={e => setDuration(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-light)', border: '1px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-light)', outline: 'none', appearance: 'none' }}>
                    <option>4 Years</option>
                    <option>3 Years</option>
                    <option>2 Years</option>
                    <option>5 Years</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ background: 'rgba(255, 161, 22, 0.1)', border: '1px solid rgba(255, 161, 22, 0.2)', padding: '16px', borderRadius: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <AlertCircle size={24} color="#FFA116" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '8px' }}>Terms & Conditions</div>
                  <p style={{ fontSize: '13px', color: 'var(--muted-light)', lineHeight: '1.6', margin: 0 }}>
                    By registering for this opportunity, you agree to share the data mentioned in this form or any form henceforth on this opportunity with the organizer of this opportunity for further analysis, processing, and outreach. Your data will also be used by Orin for providing you regular and constant updates on this opportunity.
                  </p>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'var(--bg-light)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-light)' }}>I agree to the Terms & Conditions and Privacy Policy.</span>
              </label>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', background: 'var(--surface)' }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-light)', borderRadius: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div />}
          
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="btn-primary" style={{ padding: '12px 32px', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Next Step <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleRegister} disabled={!agreed || isSubmitting} className="btn-primary" style={{ padding: '12px 32px', borderRadius: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!agreed || isSubmitting) ? 0.5 : 1 }}>
              {isSubmitting ? 'Submitting...' : 'Confirm Registration'} <Check size={16} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
