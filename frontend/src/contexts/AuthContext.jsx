import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange } from '../firebase/auth';
import { getUserProfile, updateUserProfile } from '../firebase/firestore';

// Safe default value prevents "Cannot destructure undefined" errors
// during HMR (hot module reload) or if a component mounts outside the Provider
const defaultContextValue = {
  currentUser: null,
  userProfile: null,
  loading: true,
  refreshProfile: () => Promise.resolve(),
  isOrganizer: false,
  isParticipant: true,
  onboardingComplete: false,
};

const AuthContext = createContext(defaultContextValue);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  // Guard: if context is somehow undefined (HMR edge-case), return safe defaults
  return ctx ?? defaultContextValue;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
          if (profile) {
            const todayStr = new Date().toLocaleDateString('en-CA');
            if (profile.lastLoginDate !== todayStr) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toLocaleDateString('en-CA');
              
              let newStreak = 1;
              if (profile.lastLoginDate === yesterdayStr) {
                newStreak = (profile.loginStreak || 0) + 1;
              }
              
              await updateUserProfile(user.uid, {
                loginStreak: newStreak,
                lastLoginDate: todayStr
              });
              setUserProfile(prev => prev ? { ...prev, loginStreak: newStreak, lastLoginDate: todayStr } : null);
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Refresh user profile — call this after onboarding or profile updates
  const refreshProfile = async () => {
    if (currentUser) {
      try {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      } catch (err) {
        console.error('Error refreshing profile:', err);
      }
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    refreshProfile,
    isOrganizer: userProfile?.role === 'organizer',
    isParticipant: !userProfile || userProfile?.role === 'participant',
    onboardingComplete: userProfile?.onboardingComplete === true,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render a blank screen while checking auth state, not null children */}
      {loading ? (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#F8F9FA',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 48, height: 48, background: '#7B61FF', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 24, fontWeight: 'bold', margin: '0 auto 16px',
              animation: 'pulse 1.5s infinite',
            }}>O</div>
            <p style={{ color: '#6C757D', fontSize: '14px' }}>Loading Orin...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
