import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Download, ExternalLink, Eye, ArrowLeft, Copy, Check, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserCertificates } from '../firebase/firestore';

export default function Certificates() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const fetchCerts = async () => {
      if (currentUser) {
        try {
          const data = await getUserCertificates(currentUser.uid);
          setCertificates(data);
        } catch (err) {
          console.error("Error fetching user certificates:", err);
        }
      }
      setLoading(false);
    };
    fetchCerts();
  }, [currentUser]);

  const handleCopyLink = (certId) => {
    const verifyUrl = `${window.location.origin}/verify/${certId}`;
    navigator.clipboard.writeText(verifyUrl);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLinkedInShare = (cert) => {
    const verifyUrl = `${window.location.origin}/verify/${cert.certId}`;
    const shareUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.eventTitle + ' Certificate')}&organizationName=Orin%20Student%20Event%20Platform&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(cert.certId)}`;
    window.open(shareUrl, '_blank');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 60px', color: '#1A1A1A' }}>
      
      {/* Back to Profile */}
      <button 
        onClick={() => navigate('/profile')} 
        style={{ background: 'none', border: 'none', color: '#6C757D', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', marginBottom: '24px' }}
      >
        <ArrowLeft size={18} /> Back to Profile
      </button>

      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <h1 className="heading-1" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award size={30} color="var(--primary)" /> My Certificates
        </h1>
        <p className="text-muted" style={{ marginTop: '8px' }}>View, share, and verify your credentials earned from campus events.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
          <Loader2 className="animate-spin" size={32} color="var(--primary)" />
          <span style={{ marginLeft: '12px', fontWeight: '600', color: '#6C757D' }}>Loading certifications...</span>
        </div>
      ) : certificates.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {certificates.map((cert) => (
            <div 
              key={cert.id} 
              style={{ 
                background: 'white', 
                border: '1px solid var(--border-light)', 
                borderRadius: '16px', 
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '240px',
                transition: 'transform 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div>
                {/* Header Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(40,167,69,0.08)', color: '#28A745', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                    <ShieldCheck size={12} /> Verified
                  </div>
                  <span style={{ fontSize: '11px', color: '#6C757D', fontFamily: 'monospace' }}>{cert.certId}</span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px', lineHeight: '1.4' }}>{cert.eventTitle}</h3>
                <p style={{ fontSize: '12px', color: '#6C757D' }}>Issued on: {cert.issuedAt ? (typeof cert.issuedAt.toDate === 'function' ? cert.issuedAt.toDate().toLocaleDateString() : (cert.issuedAt.seconds ? new Date(cert.issuedAt.seconds * 1000).toLocaleDateString() : String(cert.issuedAt))) : new Date().toLocaleDateString()}</p>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  onClick={() => setSelectedCert(cert)}
                  style={{
                    flex: 1,
                    background: 'rgba(123, 97, 255, 0.08)',
                    color: 'var(--primary)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Eye size={14} /> Preview
                </button>
                <button
                  onClick={() => handleCopyLink(cert.certId)}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#6C757D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Copy verification link"
                >
                  {copiedId === cert.certId ? <Check size={14} color="#28A745" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => handleLinkedInShare(cert)}
                  style={{
                    background: 'white',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: '#6C757D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Add to LinkedIn"
                >
                  <ExternalLink size={14} />
                </button>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px dashed var(--border-light)', borderRadius: '20px', padding: '60px 24px', textAlign: 'center' }}>
          <Award size={48} color="#D1D5DB" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>No Certificates Found</h3>
          <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto 24px', fontSize: '14px', lineHeight: '1.5' }}>
            Certificates are automatically issued when organizers finalize results or shortlist your projects. Join events to earn credentials!
          </p>
          <button 
            onClick={() => navigate('/explore')} 
            className="btn-primary"
            style={{ padding: '12px 24px', fontSize: '14px' }}
          >
            Explore Active Events
          </button>
        </div>
      )}

      {/* Simulated Premium Certificate Preview Modal */}
      {selectedCert && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#FAF9F6', width: '95%', maxWidth: '760px', borderRadius: '16px', border: '12px solid #33261C', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' }}>
            
            {/* Corner Decorative Borders */}
            <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', bottom: '10px', border: '2px solid #D4AF37', pointerEvents: 'none' }} />
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedCert(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#6C757D', cursor: 'pointer', zIndex: 10 }}
            >
              <XIcon size={24} />
            </button>

            {/* Background Watermark */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.02, pointerEvents: 'none' }}>
              <Award size={320} />
            </div>

            {/* Certificate Content */}
            <div style={{ textAlign: 'center', color: '#33261C' }}>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '4px', color: '#8F7A5E', fontWeight: 'bold', marginBottom: '20px' }}>
                Orin Credential Registry
              </h4>
              <h1 style={{ fontSize: '36px', fontWeight: 'normal', fontFamily: '"Georgia", serif', color: '#4A3B32', marginBottom: '24px' }}>
                Certificate of Achievement
              </h1>
              
              <p style={{ fontSize: '15px', fontStyle: 'italic', marginBottom: '12px', color: '#6A564A' }}>This is proudly presented to</p>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', fontFamily: '"Georgia", serif', color: 'var(--primary)', marginBottom: '16px', borderBottom: '1.5px solid #E5D5C5', paddingBottom: '12px', width: '80%', margin: '0 auto 16px' }}>
                {selectedCert.participantName || currentUser.displayName || 'Orin Achiever'}
              </h2>
              
              <p style={{ fontSize: '14px', marginBottom: '12px', color: '#6A564A' }}>for successfully competing and securing recognition in</p>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#4A3B32', marginBottom: '36px' }}>
                {selectedCert.eventTitle}
              </h3>

              {/* Lower Section Signatures / QR */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 32px', borderTop: '1px dashed #E5D5C5', paddingTop: '24px' }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '11px', color: '#8F7A5E', textTransform: 'uppercase', letterSpacing: '1px' }}>Date Issued</div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#4A3B32', marginTop: '4px' }}>
                    {selectedCert.issuedAt ? (typeof selectedCert.issuedAt.toDate === 'function' ? selectedCert.issuedAt.toDate().toLocaleDateString() : (selectedCert.issuedAt.seconds ? new Date(selectedCert.issuedAt.seconds * 1000).toLocaleDateString() : String(selectedCert.issuedAt))) : new Date().toLocaleDateString()}
                  </div>
                </div>

                {/* QR server simulator */}
                <div style={{ background: 'white', padding: '8px', border: '1px solid #E5D5C5', borderRadius: '6px' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(window.location.origin + '/verify/' + selectedCert.certId)}`} 
                    alt="Verify QR" 
                    style={{ width: '64px', height: '64px' }}
                  />
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#8F7A5E', textTransform: 'uppercase', letterSpacing: '1px' }}>Credential ID</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px', color: '#4A3B32', marginTop: '4px' }}>
                    {selectedCert.certId}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Simple Internal XIcon to avoid import glitches
function XIcon(props) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
