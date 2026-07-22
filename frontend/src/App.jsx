import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import MyEvents from './pages/MyEvents';
import MyRegistrations from './pages/MyRegistrations';
import Organizer from './pages/Organizer';
import CreateEvent from './pages/CreateEvent';
import EventDetails from './pages/EventDetails';
import EventTimeline from './pages/EventTimeline';
import TeamWorkspace from './pages/TeamWorkspace';
import Communities from './pages/Communities';
import Support from './pages/Support';
import CertificateVerify from './pages/CertificateVerify';
import Settings from './pages/Settings';
import Certificates from './pages/Certificates';
import Portfolio from './pages/Portfolio';
import SavedEvents from './pages/SavedEvents';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import './index.css';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppLayout>
            <Routes>
              {/* ── Public / Guest-only routes ── */}
              <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
              <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
              <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />

              {/* ── Onboarding: auth required, skips onboarding guard ── */}
              <Route path="/onboarding" element={
                <ProtectedRoute requireOnboarding={false}>
                  <Onboarding />
                </ProtectedRoute>
              } />

              {/* ── Protected routes: auth + onboarding required ── */}
              <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
              <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
              <Route path="/event/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
              <Route path="/event/:id/timeline" element={<ProtectedRoute><EventTimeline /></ProtectedRoute>} />
              <Route path="/communities" element={<ProtectedRoute><Communities /></ProtectedRoute>} />
              <Route path="/team" element={<ProtectedRoute><TeamWorkspace /></ProtectedRoute>} />
              <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
              <Route path="/my-registrations" element={<ProtectedRoute><MyRegistrations /></ProtectedRoute>} />
              <Route path="/organizer" element={<ProtectedRoute><Organizer /></ProtectedRoute>} />
              <Route path="/organizer/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
              <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
              <Route path="/saved-events" element={<ProtectedRoute><SavedEvents /></ProtectedRoute>} />

              {/* ── Certificate verification: public ── */}
              <Route path="/verify/:id" element={<CertificateVerify />} />

              {/* ── Legal / Information: public ── */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />

              {/* ── Fallback ── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
