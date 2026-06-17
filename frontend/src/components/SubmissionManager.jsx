import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  Link as LinkIcon, 
  Lock, 
  CheckCircle, 
  FileText, 
  Trash2, 
  Loader2, 
  History, 
  Plus, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { submitProject, uploadSubmissionFile } from '../firebase/firestore';

export default function SubmissionManager({ eventId, onComplete }) {
  const { currentUser } = useAuth();
  const [links, setLinks] = useState([{ type: 'GitHub', url: '' }]);
  const [files, setFiles] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [version, setVersion] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [versionsHistory, setVersionsHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Load existing submission details on mount
  useEffect(() => {
    if (!currentUser || !eventId) return;
    const fetchSubmission = async () => {
      try {
        const subDoc = await getDoc(doc(db, 'events', eventId, 'submissions', currentUser.uid));
        if (subDoc.exists()) {
          const data = subDoc.data();
          setLinks(data.links || [{ type: 'GitHub', url: '' }]);
          setFiles(data.files || []);
          setIsLocked(data.isFinalLock || false);
          setVersionsHistory(data.versions || []);
          setVersion((data.versions?.length || 0) + 1);
        }
      } catch (err) {
        console.error("Error fetching existing submission:", err);
      }
    };
    fetchSubmission();
  }, [eventId, currentUser]);

  const handleLinkChange = (index, value) => {
    const newLinks = [...links];
    newLinks[index].url = value;
    setLinks(newLinks);
  };

  const addLink = () => setLinks([...links, { type: 'GitHub', url: '' }]);
  
  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  // Real upload to Storage
  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 50 * 1024 * 1024) {
      return alert("File is too large. Max allowed size is 50MB.");
    }

    setUploadProgress(0);
    try {
      const downloadUrl = await uploadSubmissionFile(eventId, currentUser.uid, selectedFile, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      
      const newFileObj = {
        name: selectedFile.name,
        url: downloadUrl,
        size: (selectedFile.size / (1024 * 1024)).toFixed(2) + " MB",
        uploadedAt: new Date().toISOString()
      };

      setFiles(prev => [...prev, newFileObj]);
      setUploadProgress(null);
    } catch (err) {
      console.error("Storage upload failed:", err);
      alert("Failed to upload file. Please try again.");
      setUploadProgress(null);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (isFinalLock) => {
    // Basic validation
    const validLinks = links.filter(l => l.url.trim() !== '');
    if (validLinks.length === 0 && files.length === 0) {
      return alert("Please upload at least one file or add a link before submitting!");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        links: validLinks,
        files,
        isFinalLock
      };

      await submitProject(eventId, currentUser.uid, payload);
      
      if (isFinalLock) {
        setIsLocked(true);
        if (onComplete) onComplete();
        alert('Submission finalized and locked.');
      } else {
        alert('Draft saved successfully.');
      }
      
      // Reload history/versions
      const subDoc = await getDoc(doc(db, 'events', eventId, 'submissions', currentUser.uid));
      if (subDoc.exists()) {
        const data = subDoc.data();
        setVersionsHistory(data.versions || []);
        setVersion((data.versions?.length || 0) + 1);
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting project.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '20px', padding: '24px', textAlign: 'left', width: '100%' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Deliverables Portal</h3>
        <span style={{ 
          fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px',
          background: isLocked ? '#28A745' : 'rgba(123, 97, 255, 0.1)',
          color: isLocked ? 'white' : 'var(--primary)'
        }}>
          {isLocked ? 'Locked & Final' : `Draft Version ${version}`}
        </span>
      </div>

      {isLocked ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', background: 'rgba(40, 167, 69, 0.05)', borderRadius: '12px', border: '1px solid rgba(40, 167, 69, 0.2)', marginBottom: '20px' }}>
          <CheckCircle size={40} color="#28A745" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#28A745' }}>Submission Confirmed</h4>
          <p style={{ marginTop: '6px', color: '#155724', fontSize: '13px' }}>Your project is locked and ready for evaluation. Organizers have been notified.</p>
        </div>
      ) : (
        <>
          {/* File Upload Section */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Upload Project Files (ZIP, PDF, Slides)</h4>
            
            <div style={{ border: '2px dashed var(--border-light)', borderRadius: '12px', padding: '24px', textAlign: 'center', background: 'var(--surface)', position: 'relative' }}>
              {uploadProgress !== null ? (
                <div style={{ padding: '12px 0' }}>
                  <Loader2 className="animate-spin" size={24} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: '700' }}>Uploading to Storage: {uploadProgress}%</div>
                  <div style={{ height: '6px', background: '#E9ECEF', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.1s' }} />
                  </div>
                </div>
              ) : (
                <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <UploadCloud size={32} color="var(--primary)" />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Choose files or drag here</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>ZIP, PPTX, PDF, or video up to 50MB</span>
                  <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {/* List of uploaded files */}
            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                {files.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <FileText size={16} color="var(--primary)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', flexShrink: 0 }}>({file.size})</span>
                    </div>
                    <button 
                      onClick={() => removeFile(idx)} 
                      style={{ border: 'none', background: 'none', color: '#DC3545', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* External Links Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700' }}>External Workspace Links</h4>
              <button 
                onClick={addLink} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add Link
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {links.map((link, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    value={link.type} 
                    onChange={(e) => {
                      const newLinks = [...links];
                      newLinks[idx].type = e.target.value;
                      setLinks(newLinks);
                    }}
                    className="form-input" style={{ width: '130px', fontSize: '13px', padding: '8px' }}
                  >
                    <option>GitHub</option>
                    <option>Figma</option>
                    <option>Google Drive</option>
                    <option>YouTube Demo</option>
                    <option>Website / Host</option>
                  </select>
                  <input 
                    placeholder="https://..." 
                    className="form-input" 
                    style={{ flex: 1, fontSize: '13px', padding: '8px' }}
                    value={link.url}
                    onChange={(e) => handleLinkChange(idx, e.target.value)}
                  />
                  {links.length > 1 && (
                    <button 
                      onClick={() => removeLink(idx)} 
                      style={{ border: 'none', background: 'none', color: '#DC3545', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => handleSubmit(false)} 
              disabled={isSubmitting}
              className="btn-primary" 
              style={{ flex: 1, background: 'white', color: 'var(--text-light)', border: '1px solid var(--border-light)', fontSize: '13px', padding: '10px' }}
            >
              Save Draft
            </button>
            <button 
              onClick={() => setShowConfirmModal(true)} 
              disabled={isSubmitting}
              className="btn-primary" 
              style={{ flex: 1.5, background: '#DC3545', border: 'none', fontSize: '13px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Lock size={14} /> Final Lock & Submit
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '8px', textAlign: 'center' }}>
            Warning: Locking prevents future updates. Submissions undergo automatic plagiarism screening.
          </p>
        </>
      )}

      {/* Version History Collapsible */}
      {versionsHistory.length > 0 && (
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            style={{ width: '100%', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontWeight: '700', fontSize: '13px', color: 'var(--text-light)', cursor: 'pointer' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={16} /> Submission History ({versionsHistory.length} drafts)
            </span>
            {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHistory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {versionsHistory.map((ver, idx) => (
                <div key={idx} style={{ background: 'var(--surface)', padding: '12px', borderRadius: '10px', fontSize: '12px', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', marginBottom: '6px' }}>
                    <span>Version {idx + 1} {ver.isFinalLock && <span style={{ color: '#28A745' }}>(Final Lock)</span>}</span>
                    <span style={{ color: 'var(--text-light)', fontWeight: 'normal' }}>
                      {new Date(ver.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {ver.files?.length > 0 && (
                    <div style={{ marginBottom: '6px' }}>
                      <strong>Files:</strong>
                      {ver.files.map((f, i) => (
                        <div key={i}><a href={f.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{f.name}</a></div>
                      ))}
                    </div>
                  )}
                  {ver.links?.length > 0 && (
                    <div>
                      <strong>Links:</strong>
                      {ver.links.map((l, i) => (
                        <div key={i}>
                          {l.type}: <a href={l.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{l.url}</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '450px', boxShadow: '0 12px 32px rgba(0,0,0,0.15)', textAlign: 'center' }}>
            <Lock size={36} color="#DC3545" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>Finalize Project Submission?</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: '1.6', marginBottom: '24px' }}>
              Are you sure you want to finalize your submission? <strong>This action is permanent and cannot be undone.</strong> You will no longer be able to make changes, upload files, or edit workspace links.
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowConfirmModal(false)} 
                className="btn-primary" 
                style={{ flex: 1, background: 'white', color: 'var(--text-light)', border: '1px solid var(--border-light)' }}
              >
                Go Back
              </button>
              <button 
                onClick={() => handleSubmit(true)} 
                className="btn-primary" 
                style={{ flex: 1.5, background: '#DC3545', border: 'none' }}
              >
                Confirm & Lock
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
