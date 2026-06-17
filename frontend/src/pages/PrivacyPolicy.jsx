import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px', color: '#1A1A1A', lineHeight: '1.6' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6C757D', textDecoration: 'none', marginBottom: '32px', fontWeight: '500' }}>
        <ArrowLeft size={18} /> Back to Home
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: 48, height: 48, background: '#F3F0FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7B61FF' }}>
          <Shield size={24} />
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>Privacy Policy</h1>
      </div>
      
      <p style={{ color: '#6C757D', fontSize: '15px', marginBottom: '40px' }}>Last updated: June 17, 2026</p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>1. Information We Collect</h2>
        <p style={{ marginBottom: '12px', color: '#495057' }}>As an academic and event platform, Orin collects information to facilitate your participation in hackathons, workshops, and community events:</p>
        <ul style={{ paddingLeft: '24px', color: '#495057', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>Account Data:</strong> Name, email address, university affiliation, and profile details provided during onboarding.</li>
          <li><strong>Event Registration:</strong> Responses to registration forms, resumes (if uploaded), and team formation details.</li>
          <li><strong>Submission Data:</strong> Code repositories, project links, and files uploaded to team vaults or submission portals.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>2. How We Use Your Information</h2>
        <p style={{ marginBottom: '12px', color: '#495057' }}>We use your data strictly to improve your academic journey:</p>
        <ul style={{ paddingLeft: '24px', color: '#495057', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>To match you with events and communities based on your skills.</li>
          <li>To share necessary registration details with Event Organizers.</li>
          <li>To issue and verify digital certificates.</li>
          <li>To send critical notifications regarding deadlines and emergencies.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>3. Data Sharing and Organizers</h2>
        <p style={{ color: '#495057' }}>
          When you register for an event, the specific Event Organizer will have access to your registration details and submissions. Organizers are required to handle your data responsibly. We do not sell your personal information to third-party advertisers.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>4. Security</h2>
        <p style={{ color: '#495057' }}>
          We utilize Firebase Authentication and Firestore security rules to protect your data. While we strive for commercially acceptable means of protecting your information, no method of transmission over the internet is 100% secure.
        </p>
      </section>

      <div style={{ background: '#F8F9FA', padding: '24px', borderRadius: '16px', border: '1px solid #E9ECEF', marginTop: '48px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Contact Us</h3>
        <p style={{ color: '#6C757D', fontSize: '14px', margin: 0 }}>
          If you have questions about this Privacy Policy, please contact us at <strong style={{ color: '#7B61FF' }}>privacy@orinplatform.edu</strong>.
        </p>
      </div>
    </div>
  );
}
