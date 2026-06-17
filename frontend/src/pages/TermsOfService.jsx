import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px', color: '#1A1A1A', lineHeight: '1.6' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6C757D', textDecoration: 'none', marginBottom: '32px', fontWeight: '500' }}>
        <ArrowLeft size={18} /> Back to Home
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div style={{ width: 48, height: 48, background: '#F3F0FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7B61FF' }}>
          <FileText size={24} />
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>Terms of Service</h1>
      </div>
      
      <p style={{ color: '#6C757D', fontSize: '15px', marginBottom: '40px' }}>Last updated: June 17, 2026</p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>1. Acceptance of Terms</h2>
        <p style={{ color: '#495057' }}>
          By accessing and using the Orin platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform. Orin provides an academic and event management workspace connecting students, professionals, and event organizers.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>2. User Conduct & Academic Integrity</h2>
        <p style={{ marginBottom: '12px', color: '#495057' }}>As a participant on Orin, you agree to uphold strict standards of academic integrity:</p>
        <ul style={{ paddingLeft: '24px', color: '#495057', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>You will not submit plagiarized work to any hackathon, assessment, or event.</li>
          <li>You will respect the rules set forth by individual Event Organizers.</li>
          <li>You will not engage in harassment or abusive behavior in Community chats or Team Workspaces.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>3. Organizer Responsibilities</h2>
        <p style={{ color: '#495057' }}>
          Users creating events ("Organizers") are responsible for ensuring that their events comply with local laws and do not mislead participants. Organizers must honor any prizes, certificates, or claims made on their event pages.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>4. Intellectual Property</h2>
        <p style={{ color: '#495057' }}>
          Unless explicitly stated by an Event Organizer's specific rules, you retain the intellectual property rights to the projects and code you submit through the Orin platform. By submitting, you grant Orin and the Event Organizer a limited license to review and display your submission for evaluation purposes.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>5. Termination</h2>
        <p style={{ color: '#495057' }}>
          We reserve the right to suspend or terminate your account at any time for violations of these Terms of Service, especially concerning academic fraud or community harassment.
        </p>
      </section>

      <div style={{ background: '#F8F9FA', padding: '24px', borderRadius: '16px', border: '1px solid #E9ECEF', marginTop: '48px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>Questions?</h3>
        <p style={{ color: '#6C757D', fontSize: '14px', margin: 0 }}>
          If you have questions about these Terms, please contact <strong style={{ color: '#7B61FF' }}>legal@orinplatform.edu</strong>.
        </p>
      </div>
    </div>
  );
}
