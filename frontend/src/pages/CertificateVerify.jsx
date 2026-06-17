import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ShieldCheck, Download, Award, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { verifyCertificate } from '../firebase/firestore';

export default function CertificateVerify() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const data = await verifyCertificate(id);
        if (data) {
          setCertData(data);
        } else {
          setError("This Certificate ID is not registered or has been revoked.");
        }
      } catch (err) {
        console.error("Certificate verification error:", err);
        setError("Error lookup in database registry.");
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [id]);

  const handleCopyVerifyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Verification link copied to clipboard!");
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#6C757D' }}>
        <Loader2 className="animate-spin" size={36} color="var(--primary)" style={{ marginBottom: '16px' }} />
        <p style={{ fontWeight: '600' }}>Querying Orin Security Registry for UUID: {id}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '500px', margin: '80px auto', textAlign: 'center', padding: '32px', background: 'white', borderRadius: '16px', border: '1px solid #F8D7DA', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
        <AlertTriangle size={48} color="#DC3545" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#842029', marginBottom: '8px' }}>Verification Failed</h2>
        <p style={{ fontSize: '14px', color: '#842029', marginBottom: '24px', lineHeight: '1.5' }}>{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary" style={{ width: '100%' }}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const issueDate = certData.issuedAt
    ? (typeof certData.issuedAt.toDate === 'function' ? certData.issuedAt.toDate().toLocaleDateString() : (certData.issuedAt.seconds ? new Date(certData.issuedAt.seconds * 1000).toLocaleDateString() : String(certData.issuedAt)))
    : new Date().toLocaleDateString();

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto 60px', padding: '0 24px', textAlign: 'center' }}>
      
      {/* Verification Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(40, 167, 69, 0.1)', color: '#28A745', padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', marginBottom: '32px' }}>
        <ShieldCheck size={24} />
        Officially Verified by Orin Registry
      </div>

      {/* The Certificate UI */}
      <div style={{ 
        background: '#FAF9F6', borderRadius: '16px', border: '10px solid #33261C', padding: '60px 40px', 
        boxShadow: '0 24px 48px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden'
      }}>
        
        {/* Border Detail */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', right: '8px', bottom: '8px', border: '2px solid #D4AF37', pointerEvents: 'none' }} />

        {/* Background Watermark */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.02, pointerEvents: 'none' }}>
          <Award size={400} />
        </div>

        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '4px', color: '#8F7A5E', fontWeight: 'bold', marginBottom: '32px' }}>
          Certificate of Excellence & Completion
        </h3>

        <p style={{ fontSize: '16px', fontStyle: 'italic', color: '#6A564A', marginBottom: '16px' }}>This credential is officially registered to certify that</p>
        <h1 style={{ fontSize: '42px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '16px', fontFamily: '"Georgia", serif' }}>
          {certData.participantName}
        </h1>
        <p style={{ fontSize: '15px', color: '#6A564A', marginBottom: '24px' }}>has successfully participated in, completed, and achieved milestones during</p>
        
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#33261C', marginBottom: '50px' }}>
          {certData.eventTitle}
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #E5D5C5', paddingTop: '24px', color: '#33261C' }}>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#8F7A5E', margin: 0 }}>Date Issued</p>
            <p style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>{issueDate}</p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#8F7A5E', margin: 0 }}>Certificate ID</p>
            <p style={{ fontWeight: 'bold', fontSize: '14px', fontFamily: 'monospace', marginTop: '4px' }}>{id}</p>
          </div>
        </div>

        {/* QR Code */}
        <div style={{ position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '8px', border: '1px solid #E5D5C5', borderRadius: '6px' }}>
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(window.location.href)}`} 
            alt="Verify QR" 
            style={{ width: '64px', height: '64px' }}
          />
        </div>

      </div>

      <div style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
          <Download size={18} /> Print Certificate
        </button>
        <button onClick={handleCopyVerifyLink} className="btn-primary" style={{ background: 'white', color: 'var(--text)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
          <CheckCircle size={18} color="#28A745" /> Copy Verification Link
        </button>
      </div>

    </div>
  );
}
