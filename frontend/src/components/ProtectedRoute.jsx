import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protects a route so only authenticated users can access it.
 * If user hasn't completed onboarding, redirect to /onboarding.
 * 
 * IMPORTANT: We must wait for `loading` to be false before making any
 * redirect decisions. While Firebase resolves auth state, currentUser is
 * null even for signed-in users — causing a false redirect to /login.
 */
export function ProtectedRoute({ children, requireOnboarding = true }) {
  const { currentUser, onboardingComplete, loading } = useAuth();

  // ⏳ Still resolving Firebase auth — don't redirect yet
  if (loading) return null;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && !onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

/**
 * Redirects authenticated users away from auth pages (login/signup).
 * Also waits for loading to finish before making redirect decisions.
 */
export function GuestRoute({ children }) {
  const { currentUser, onboardingComplete, loading } = useAuth();

  // ⏳ Still resolving Firebase auth — don't redirect yet
  if (loading) return null;

  if (currentUser) {
    return <Navigate to={onboardingComplete ? '/' : '/onboarding'} replace />;
  }

  return children;
}

