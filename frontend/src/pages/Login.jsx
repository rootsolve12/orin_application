import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle } from '../firebase/auth';

const GOOGLE_SVG = (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const FEATURES = [
  { icon: '🏆', title: 'Compete & Win', desc: 'Join hackathons, coding contests, and innovation challenges nationwide.' },
  { icon: '📜', title: 'Build Your Portfolio', desc: 'Earn certificates and showcase achievements to top recruiters.' },
  { icon: '🤝', title: 'Find Your Team', desc: 'Connect with like-minded students and build your dream team.' },
  { icon: '🎓', title: 'Learn & Grow', desc: 'Attend workshops and seminars led by industry experts.' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      // GuestRoute will auto-redirect once Firebase onAuthStateChanged fires
    } catch (err) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
        ? 'Invalid email or password. Please try again.'
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      // GuestRoute will auto-redirect once Firebase onAuthStateChanged fires
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputBase = {
    width: '100%',
    padding: '14px 16px 14px 48px',
    border: '1.5px solid #E9ECEF',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    background: '#FAFAFA',
  };

  const iconWrap = {
    position: 'absolute', left: '16px', top: '50%',
    transform: 'translateY(-50%)', color: '#9CA3AF',
    pointerEvents: 'none',
  };

  return (
    /* Full-page centered wrapper */
    <div className="login-container">
      {/* Two-column card */}
      <div className="auth-card">

        {/* ── LEFT PANEL — Branding ── */}
        <div className="auth-left">
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -40, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          {/* Logo */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
              <img src="/master_icon.png" alt="Orin Logo" style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'contain' }} />
              <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>Orin</span>
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px', lineHeight: '1.25' }}>
              Your Academic<br />Journey Starts Here 🚀
            </h2>
            <p style={{ fontSize: '15px', opacity: 0.85, lineHeight: '1.6' }}>
              The all-in-one platform for students to discover events, compete, and build their career.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '2px' }}>{f.title}</div>
                  <div style={{ fontSize: '13px', opacity: 0.75, lineHeight: '1.4' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL — Form ── */}
        <div className="auth-right">
          {/* Mobile Only Brand Header */}
          <div className="mobile-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
            <img src="/master_icon.png" alt="Orin Logo" style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'contain' }} />
            <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Orin</span>
          </div>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px' }}>
              Welcome back 👋
            </h1>
            <p style={{ color: '#6C757D', fontSize: '15px' }}>
              Sign in to continue to Orin
            </p>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: '#FFEBEE', color: '#DC3545', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '13px', background: 'white', border: '1.5px solid #E9ECEF',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '15px', color: '#1A1A1A',
              marginBottom: '24px', transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            {GOOGLE_SVG} Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: '#E9ECEF' }} />
            <span style={{ padding: '0 16px', fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: '#E9ECEF' }} />
          </div>

          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#374151' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </span>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputBase}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize: '13px', color: '#7B61FF', textDecoration: 'none', fontWeight: '600' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={iconWrap}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputBase}
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '16px' }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                padding: '14px', fontSize: '15px', borderRadius: '12px', fontWeight: '700',
                background: loading ? '#C4B5FD' : 'linear-gradient(135deg, #7B61FF, #9D88FF)',
                color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px', boxShadow: '0 4px 16px rgba(123,97,255,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: '#6C757D' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: '#7B61FF', fontWeight: '700', textDecoration: 'none' }}>
              Create account
            </Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#9CA3AF', lineHeight: '1.5' }}>
            By signing in, you agree to our{' '}
            <span style={{ color: '#7B61FF', cursor: 'pointer' }}>Terms of Service</span> and{' '}
            <span style={{ color: '#7B61FF', cursor: 'pointer' }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
