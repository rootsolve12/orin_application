import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUpWithEmail, loginWithGoogle } from '../firebase/auth';
import { updateUserProfile } from '../firebase/firestore';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  Shield, 
  Award, 
  Sparkles, 
  Check, 
  AlertCircle 
} from 'lucide-react';

const ROLES = [
  {
    id: 'participant',
    label: 'Participant',
    desc: 'Discover events, build your portfolio, and compete with peers',
    icon: <Award size={32} />
  },
  {
    id: 'organizer',
    label: 'Organizer',
    desc: 'Create, launch, and manage events, and evaluate submissions',
    icon: <Shield size={32} />
  },
];

const GOOGLE_SVG = (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Signup() {
  const [step, setStep] = useState(1); // 1=credentials, 2=role
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field Focus / Interaction
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const [selectedRole, setSelectedRole] = useState('participant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Password Requirements State
  const [strengthScore, setStrengthScore] = useState(0);
  const [checks, setChecks] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });

  // Calculate Password Strength in real time
  useEffect(() => {
    const nextChecks = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
    setChecks(nextChecks);

    let score = 0;
    if (password.length > 0) {
      if (nextChecks.length) score += 25;
      if (nextChecks.uppercase) score += 25;
      if (nextChecks.number) score += 25;
      if (nextChecks.special) score += 25;
    }
    setStrengthScore(score);
  }, [password]);

  // Validation Checkers
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = email === '' || emailRegex.test(email);
  const isConfirmPasswordValid = confirmPassword === '' || password === confirmPassword;

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (strengthScore < 50) {
      setError('Please choose a stronger password.');
      return;
    }
    setStep(2);
  };

  const handleFinalSignup = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await signUpWithEmail(email, password, name);
      await updateUserProfile(user.uid, { role: selectedRole });
      // Onboarding state triggers redirect in GuestRoute automatically
    } catch (err) {
      setError(err.message || 'An error occurred during account creation.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      // Onboarding state triggers redirect in GuestRoute automatically
    } catch (err) {
      setError(err.message || 'An error occurred during Google Sign Up.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthLabel = () => {
    if (strengthScore === 0) return 'None';
    if (strengthScore <= 25) return 'Very Weak';
    if (strengthScore <= 50) return 'Weak';
    if (strengthScore <= 75) return 'Medium';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (strengthScore <= 25) return '#EF4444'; // Red
    if (strengthScore <= 50) return '#F59E0B'; // Orange
    if (strengthScore <= 75) return '#3B82F6'; // Blue
    return '#10B981'; // Green
  };

  // Styled helper definitions
  const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  };

  const inputStyle = (hasError, isTouched) => ({
    width: '100%',
    padding: '14px 44px 14px 48px',
    border: `1.5px solid ${hasError && isTouched ? '#EF4444' : '#E9ECEF'}`,
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '500',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
    background: '#FAFAFB',
    color: '#1A1A1A'
  });

  const iconWrap = {
    position: 'absolute', 
    left: '16px', 
    color: '#868E96',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const toggleEyeStyle = {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    color: '#868E96',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #F5F3FF 0%, #FCFCFD 50%, #EFF6FF 100%)',
      padding: '40px 24px',
      fontFamily: 'Inter, sans-serif'
    }}>
      
      {/* Brand logo header */}
      <div style={{
        position: 'absolute', top: '32px', display: 'flex', alignItems: 'center', gap: '10px', 
        fontWeight: '800', fontSize: '22px', color: '#1A1A1A', letterSpacing: '-0.5px'
      }}>
        <div style={{ 
          width: 38, height: 38, backgroundColor: '#7B61FF', borderRadius: 12, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          color: 'white', fontSize: 20, fontWeight: '900',
          boxShadow: '0 4px 12px rgba(123, 97, 255, 0.3)'
        }}>O</div>
        <span>Orin</span>
      </div>

      <div style={{ width: '100%', maxWidth: '450px', textAlign: 'center', marginTop: '60px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#1A1A1A', letterSpacing: '-0.5px' }}>
          {step === 1 ? 'Create account' : 'Setup profile role'}
        </h1>
        <p style={{ color: '#6C757D', marginBottom: '24px', fontSize: '15px', fontWeight: '500' }}>
          {step === 1 ? 'Compete in hackathons, assessments and showcase milestones' : 'Help us personalize your Orin workspaces'}
        </p>

        {/* Step Indicator Bullets */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', justifyContent: 'center' }}>
          {[1, 2].map(i => (
            <div key={i} style={{
              width: i === step ? '24px' : '8px', 
              height: '8px', 
              borderRadius: '6px',
              background: i === step ? '#7B61FF' : '#E9ECEF',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Main glassmorphic wrapper card */}
      <div style={{
        width: '100%', 
        maxWidth: '450px', 
        background: 'white',
        padding: '36px', 
        borderRadius: '24px', 
        border: '1px solid #E9ECEF',
        boxShadow: '0 12px 40px rgba(0,0,0,0.03)',
        boxSizing: 'border-box'
      }}>
        
        {error && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 16px', background: '#FFF0F0', color: '#D92D20', 
            borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: '600'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <>
            {/* Google Signup Button */}
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', background: 'white', border: '1.5px solid #E9ECEF',
                borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', color: '#343A40',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#F8F9FA'}
              onMouseOut={(e) => e.currentTarget.style.background = 'white'}
            >
              {GOOGLE_SVG} Sign up with Google
            </button>

            {/* Separator Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#E9ECEF' }} />
              <span style={{ padding: '0 16px', fontSize: '11px', color: '#ADB5BD', fontWeight: '700', letterSpacing: '1px' }}>OR SIGN UP WITH EMAIL</span>
              <div style={{ flex: 1, height: '1px', background: '#E9ECEF' }} />
            </div>

            {/* Email Form */}
            <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#495057' }}>Full Name</label>
                <div style={inputContainerStyle}>
                  <span style={iconWrap}><User size={18} /></span>
                  <input 
                    type="text" 
                    required 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Enter your name" 
                    style={inputStyle(false, false)}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#7B61FF'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#E9ECEF'}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#495057' }}>Email Address</label>
                <div style={inputContainerStyle}>
                  <span style={iconWrap}><Mail size={18} /></span>
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={e => { setEmail(e.target.value); setEmailTouched(true); }}
                    placeholder="you@domain.com" 
                    style={inputStyle(!isEmailValid, emailTouched)}
                    onFocus={(e) => e.currentTarget.style.borderColor = !isEmailValid ? '#EF4444' : '#7B61FF'}
                    onBlur={(e) => { e.currentTarget.style.borderColor = !isEmailValid ? '#EF4444' : '#E9ECEF'; setEmailTouched(true); }}
                  />
                </div>
                {!isEmailValid && emailTouched && (
                  <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> Please enter a valid email.
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#495057' }}>Password</label>
                <div style={inputContainerStyle}>
                  <span style={iconWrap}><Lock size={18} /></span>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={password} 
                    onChange={e => { setPassword(e.target.value); setPasswordTouched(true); }} 
                    placeholder="Choose a password" 
                    style={inputStyle(strengthScore < 50, passwordTouched)}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#7B61FF'}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E9ECEF'; setPasswordTouched(true); }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={toggleEyeStyle}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Real-Time bar indicator */}
                {password.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#868E96', fontWeight: '600' }}>Password Strength:</span>
                      <span style={{ fontSize: '11px', color: getStrengthColor(), fontWeight: '700' }}>{getStrengthLabel()}</span>
                    </div>
                    <div style={{ width: '100%', height: '5px', background: '#E9ECEF', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${strengthScore}%`, height: '100%', background: getStrengthColor(), transition: 'width 0.3s ease' }} />
                    </div>
                    
                    {/* Requirements checklist */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: checks.length ? '#10B981' : '#868E96', fontWeight: '600' }}>
                        <Check size={10} strokeWidth={3} /> Min. 6 chars
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: checks.uppercase ? '#10B981' : '#868E96', fontWeight: '600' }}>
                        <Check size={10} strokeWidth={3} /> Uppercase letter
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: checks.number ? '#10B981' : '#868E96', fontWeight: '600' }}>
                        <Check size={10} strokeWidth={3} /> Contains number
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: checks.special ? '#10B981' : '#868E96', fontWeight: '600' }}>
                        <Check size={10} strokeWidth={3} /> Special char
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#495057' }}>Confirm Password</label>
                <div style={inputContainerStyle}>
                  <span style={iconWrap}><Lock size={18} /></span>
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    required 
                    value={confirmPassword} 
                    onChange={e => { setConfirmPassword(e.target.value); setConfirmPasswordTouched(true); }} 
                    placeholder="Confirm password" 
                    style={inputStyle(!isConfirmPasswordValid, confirmPasswordTouched)}
                    onFocus={(e) => e.currentTarget.style.borderColor = !isConfirmPasswordValid ? '#EF4444' : '#7B61FF'}
                    onBlur={(e) => { e.currentTarget.style.borderColor = !isConfirmPasswordValid ? '#EF4444' : '#E9ECEF'; setConfirmPasswordTouched(true); }}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={toggleEyeStyle}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {!isConfirmPasswordValid && confirmPasswordTouched && (
                  <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> Passwords do not match.
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button 
                type="submit" 
                disabled={loading || !isEmailValid || !isConfirmPasswordValid || strengthScore < 50} 
                style={{
                  marginTop: '10px', 
                  padding: '14px', 
                  fontSize: '15px', 
                  borderRadius: '12px',
                  background: (loading || !isEmailValid || !isConfirmPasswordValid || strengthScore < 50) ? '#D6D1FA' : '#7B61FF', 
                  color: 'white', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: '700',
                  boxShadow: strengthScore >= 50 ? '0 4px 12px rgba(123, 97, 255, 0.2)' : 'none',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Continue <Sparkles size={16} />
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#6C757D', fontWeight: '500' }}>
              Already have an account? <Link to="/login" style={{ color: '#7B61FF', fontWeight: '700', textDecoration: 'none' }}>Sign in</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {ROLES.map(role => (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                style={{
                  border: `2px solid ${selectedRole === role.id ? '#7B61FF' : '#E9ECEF'}`,
                  borderRadius: '16px',
                  padding: '20px',
                  cursor: 'pointer',
                  background: selectedRole === role.id ? '#F8F7FF' : 'white',
                  transition: 'all 0.2s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transform: selectedRole === role.id ? 'scale(1.01)' : 'none',
                  boxShadow: selectedRole === role.id ? '0 4px 15px rgba(123, 97, 255, 0.05)' : 'none'
                }}
              >
                <span style={{ 
                  background: selectedRole === role.id ? '#7B61FF' : '#F1F3F5',
                  color: selectedRole === role.id ? 'white' : '#495057',
                  borderRadius: '12px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}>
                  {role.icon}
                </span>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: selectedRole === role.id ? '#7B61FF' : '#212529' }}>{role.label}</div>
                  <div style={{ fontSize: '12px', color: '#868E96', marginTop: '4px', lineHeight: '1.4', fontWeight: '500' }}>{role.desc}</div>
                </div>

                <div style={{ 
                  width: 22, height: 22, borderRadius: '50%', 
                  border: `2px solid ${selectedRole === role.id ? '#7B61FF' : '#E9ECEF'}`, 
                  background: selectedRole === role.id ? '#7B61FF' : 'transparent', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxSizing: 'border-box'
                }}>
                  {selectedRole === role.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                </div>
              </div>
            ))}

            {/* Back / Create Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                onClick={() => setStep(1)}
                style={{ 
                  flex: 1, padding: '14px', borderRadius: '12px', background: 'white', 
                  color: '#7B61FF', border: '1.5px solid #7B61FF', cursor: 'pointer', 
                  fontWeight: '700', fontSize: '15px'
                }}
              >
                Back
              </button>
              <button
                onClick={handleFinalSignup}
                disabled={loading}
                style={{ 
                  flex: 2, padding: '14px', borderRadius: '12px', background: '#7B61FF', 
                  color: 'white', border: 'none', cursor: 'pointer', fontWeight: '700', 
                  fontSize: '15px', boxShadow: '0 4px 12px rgba(123, 97, 255, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                {loading ? 'Creating account...' : 'Create Account 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
