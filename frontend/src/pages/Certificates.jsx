import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, Download, ExternalLink, Eye, ArrowLeft, Copy, Check, 
  ShieldCheck, Loader2, Plus, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserCertificates, addCertificate } from '../firebase/firestore';

export default function Certificates() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Add Certificate Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [certTitle, setCertTitle] = useState('');
  const [certIdInput, setCertIdInput] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certDate, setCertDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const shareUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.eventTitle + ' Certificate')}&organizationName=${encodeURIComponent(cert.organizerName || 'Orin Student Event Platform')}&certUrl=${encodeURIComponent(verifyUrl)}&certId=${encodeURIComponent(cert.certId)}`;
    window.open(shareUrl, '_blank');
  };

  const handleAddCertificate = async (e) => {
    e.preventDefault();
    if (!certTitle || !certIdInput || !certOrg) return;

    setIsSubmitting(true);
    try {
      const data = {
        eventTitle: certTitle,
        certId: certIdInput,
        organizerName: certOrg,
        issuedAt: certDate ? new Date(certDate) : new Date(),
        isManual: true,
        participantName: currentUser.displayName || 'Orin Achiever'
      };

      const docId = await addCertificate(currentUser.uid, data);
      
      // Update local state list immediately
      setCertificates(prev => [{ id: docId, ...data }, ...prev]);
      
      // Reset form states and close modal
      setCertTitle('');
      setCertIdInput('');
      setCertOrg('');
      setCertDate('');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Error adding certificate:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatIssueDate = (issuedAt) => {
    if (!issuedAt) return new Date().toLocaleDateString();
    if (typeof issuedAt.toDate === 'function') {
      return issuedAt.toDate().toLocaleDateString();
    }
    if (issuedAt.seconds) {
      return new Date(issuedAt.seconds * 1000).toLocaleDateString();
    }
    if (issuedAt instanceof Date) {
      return issuedAt.toLocaleDateString();
    }
    return String(issuedAt);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px 60px', color: 'var(--text-light)', background: 'var(--bg-light)', minHeight: '100vh' }}>
      
      {/* Back to Profile Link */}
      <button 
        onClick={() => navigate('/profile')} 
        style={{ background: 'none', border: 'none', color: '#6C757D', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500', marginBottom: '24px' }}
      >
        <ArrowLeft size={18} /> Back to Profile
      </button>

      {/* Header with Add Certificate Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '36px' }}>
        <div>
          <h1 className="heading-1" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Award size={30} color="var(--primary)" /> My Certificates
          </h1>
          <p className="text-muted" style={{ marginTop: '8px', margin: 0 }}>View, share, and verify your credentials earned or manually added.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          style={{
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(123, 97, 255, 0.2)'
          }}
        >
          <Plus size={16} /> Add Certificate
        </button>
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
                background: 'var(--surface)', 
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
                  {cert.isManual ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(123, 97, 255, 0.08)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                      <Award size={12} /> Manual Upload
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(40,167,69,0.08)', color: '#28A745', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                      <ShieldCheck size={12} /> Verified
                    </div>
                  )}
                  <span style={{ fontSize: '11px', color: 'var(--muted-light)', fontFamily: 'monospace' }}>{cert.certId}</span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '6px', lineHeight: '1.4' }}>{cert.eventTitle}</h3>
                <p style={{ fontSize: '12px', color: 'var(--muted-light)', marginBottom: '2px' }}>Organization: <strong>{cert.organizerName || 'External'}</strong></p>
                <p style={{ fontSize: '12px', color: 'var(--muted-light)' }}>Issued on: {formatIssueDate(cert.issuedAt)}</p>
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
                    background: 'var(--surface)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: 'var(--muted-light)',
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
                    background: 'var(--surface)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    padding: '8px',
                    cursor: 'pointer',
                    color: 'var(--muted-light)',
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
        <div style={{ background: 'var(--surface)', border: '1px dashed var(--border-light)', borderRadius: '20px', padding: '60px 24px', textAlign: 'center' }}>
          <Award size={48} color="#D1D5DB" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>No Certificates Found</h3>
          <p className="text-muted" style={{ maxWidth: '400px', margin: '0 auto 24px', fontSize: '14px', lineHeight: '1.5' }}>
            You haven't earned or added any certificates yet. Add a manual credential or participate in active events to earn them!
          </p>
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="btn-primary"
            style={{ padding: '12px 24px', fontSize: '14px' }}
          >
            Add First Certificate
          </button>
        </div>
      )}

      {/* --- ADD MANUAL CERTIFICATE MODAL --- */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10001, display: 'flex', alignItems: 'center', justifycontent: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--surface)', width: '95%', maxWidth: '500px', borderRadius: '16px', border: '1px solid var(--border-light)', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', position: 'relative' }}>
            
            <button 
              onClick={() => setIsAddModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--muted-light)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-light)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={22} color="var(--primary)" /> Add Certificate
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted-light)', marginBottom: '24px' }}>Manually register an external or campus event certificate in your Orin registry.</p>

            <form onSubmit={handleAddCertificate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '6px' }}>Certification / Event Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Google Cloud Practitioner"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '6px' }}>Credential ID / Code</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. GCP-987654"
                  value={certIdInput}
                  onChange={(e) => setCertIdInput(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '6px' }}>Issuing Organization</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Google Cloud / IEEE Student Council"
                  value={certOrg}
                  onChange={(e) => setCertOrg(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-light)', marginBottom: '6px' }}>Issue Date (Optional)</label>
                <input 
                  type="date" 
                  value={certDate}
                  onChange={(e) => setCertDate(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-light)', color: 'var(--text-light)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ flex: 1, padding: '12px', background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', color: 'var(--text-light)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    background: 'var(--primary)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Certificate'}
                </button>
              </div>
            </form>
          </div>
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
                    {formatIssueDate(selectedCert.issuedAt)}
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
