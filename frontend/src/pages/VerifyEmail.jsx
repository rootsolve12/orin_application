import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../firebase/firestore';
import { Mail, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmail() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  // Generate and send OTP on load
  useEffect(() => {
    if (currentUser && (!userProfile || !userProfile.tempOtp)) {
      triggerOtpSend();
    }
  }, [currentUser]);

  // Countdown timer for resend code
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const triggerOtpSend = async () => {
    if (!currentUser) return;
    setError('');
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      // 1. Store OTP temporarily in Firestore for security validation and test runner access
      await updateUserProfile(currentUser.uid, { tempOtp: newOtp });
      await refreshProfile();

      // 2. Request backend to send email with OTP
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, otp: newOtp })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to send verification email');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Failed to send verification code. Please try again.');
    }
  };

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    await triggerOtpSend();
    setTimer(30);
    setResending(false);
  };

  const handleChange = (element, index) => {
    const value = element.value.replace(/[^0-9]/g, '');
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input field
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      // Auto-focus previous input field
      if (index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const correctOtp = userProfile?.tempOtp;
      if (enteredCode === correctOtp) {
        // Successful verification
        await updateUserProfile(currentUser.uid, {
          emailVerified: true,
          tempOtp: null
        });
        await refreshProfile();
        navigate('/onboarding');
      } else {
        setError('Incorrect verification code. Please try again.');
      }
    } catch (err) {
      console.error('Verification Error:', err);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Automatically trigger verification when all 6 digits are filled
  useEffect(() => {
    if (otp.join('').length === 6) {
      handleVerify();
    }
  }, [otp]);

  return (
    <div className="signup-container">
      <div style={{
        position: 'absolute', top: '32px', display: 'flex', alignItems: 'center', gap: '10px', 
        fontWeight: '800', fontSize: '22px', color: '#1A1A1A', letterSpacing: '-0.5px'
      }}>
        <img src="/master_icon.png" alt="Orin Logo" style={{ width: 38, height: 38, borderRadius: 12, objectFit: 'contain' }} />
        <span>Orin</span>
      </div>

      <div style={{ width: '100%', maxWidth: '450px', textAlign: 'center', marginTop: '60px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px', color: '#1A1A1A', letterSpacing: '-0.5px' }}>
          Verify your email 📧
        </h1>
        <p style={{ color: '#6C757D', marginBottom: '24px', fontSize: '15px', fontWeight: '500', lineHeight: '1.5' }}>
          We've sent a 6-digit verification code to <br />
          <strong style={{ color: '#1A1A1A' }}>{currentUser?.email}</strong>
        </p>
      </div>

      <div className="signup-card" style={{ maxWidth: '450px', padding: '36px' }}>
        {error && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 16px', background: '#FFF0F0', color: '#D92D20', 
            borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '600'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => inputRefs.current[idx] = el}
                type="text"
                pattern="[0-9]*"
                maxLength="1"
                value={digit}
                onChange={e => handleChange(e.target, idx)}
                onKeyDown={e => handleKeyDown(e, idx)}
                style={{
                  width: '50px',
                  height: '56px',
                  border: '1.5px solid #E9ECEF',
                  borderRadius: '12px',
                  fontSize: '24px',
                  fontWeight: '800',
                  textAlign: 'center',
                  outline: 'none',
                  background: '#FAFAFB',
                  color: '#1A1A1A',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#7B61FF'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E9ECEF'}
              />
            ))}
          </div>

          <button 
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            style={{
              padding: '14px', 
              fontSize: '15px', 
              borderRadius: '12px',
              background: (loading || otp.join('').length !== 6) ? '#D6D1FA' : '#7B61FF', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: '700',
              boxShadow: otp.join('').length === 6 ? '0 4px 12px rgba(123, 97, 255, 0.2)' : 'none',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minHeight: '48px'
            }}
          >
            {loading ? 'Verifying...' : 'Verify Code 🚀'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <button
            onClick={handleResend}
            disabled={timer > 0 || resending}
            style={{
              background: 'none',
              border: 'none',
              color: timer > 0 ? '#ADB5BD' : '#7B61FF',
              fontWeight: '700',
              fontSize: '14px',
              cursor: timer > 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '44px'
            }}
          >
            <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
            {timer > 0 ? `Resend code in ${timer}s` : 'Resend Verification Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
