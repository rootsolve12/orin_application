import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../firebase/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | sent | error
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await resetPassword(email);
      setStatus('sent');
    } catch (err) {
      const msg = err.code === 'auth/user-not-found'
        ? 'No account found with that email address.'
        : err.message;
      setError(msg);
      setStatus('error');
    }
  };

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', background: '#F8F9FA',
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', padding: '20px',
    }}>
      {/* Logo */}
      <div style={{
        width: 56, height: 56, backgroundColor: '#7B61FF', borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px', color: 'white', fontSize: 24, fontWeight: 'bold',
      }}>O</div>

      <div style={{
        width: '100%', maxWidth: '440px', background: 'white',
        padding: '36px', borderRadius: '16px', border: '1px solid #E9ECEF',
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        textAlign: 'center',
      }}>
        {status === 'sent' ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>Check your email</h2>
            <p style={{ color: '#6C757D', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
              We sent a password reset link to <strong>{email}</strong>. Please check your inbox (and spam folder).
            </p>
            <Link to="/login" style={{
              display: 'block', padding: '14px', background: '#7B61FF', color: 'white',
              borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '15px',
            }}>
              Back to Sign In
            </Link>
          </>
        ) : (
          <>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', color: '#1A1A1A' }}>
              Forgot Password?
            </h1>
            <p style={{ color: '#6C757D', fontSize: '15px', marginBottom: '28px', lineHeight: '1.5' }}>
              Enter your email and we'll send you a link to reset your password.
            </p>

            {(status === 'error') && (
              <div style={{ padding: '12px', background: '#FFEBEE', color: '#DC3545', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'left' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#1A1A1A' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6C757D' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </span>
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      width: '100%', padding: '14px 16px 14px 48px', border: '1px solid #E9ECEF',
                      borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  padding: '14px', background: '#7B61FF', color: 'white', border: 'none',
                  borderRadius: '10px', fontWeight: '600', fontSize: '15px', cursor: 'pointer',
                }}
              >
                {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p style={{ marginTop: '24px', fontSize: '14px', color: '#6C757D' }}>
              Remember your password? <Link to="/login" style={{ color: '#7B61FF', fontWeight: 'bold', textDecoration: 'none' }}>Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
