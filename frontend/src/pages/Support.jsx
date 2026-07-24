import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  CheckCircle, 
  MessageSquare,
  AlertTriangle,
  FileText,
  Search,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { createSupportTicket } from '../firebase/firestore';

const FAQ_LIST = [
  {
    q: 'How do I register for an event?',
    a: 'Find an active event under the Explore section, click on it to open the Event Details view, and press the "Register Now" button. If your academic profile is complete, your registration details will auto-fill instantly.'
  },
  {
    q: 'How do team registrations work and what is an invite code?',
    a: 'For team-based events, once you register, you can either create a new team or enter a 6-digit Invite Code shared by a teammate. The team leader is given an invite code in their Team Workspace to share with colleagues.'
  },
  {
    q: 'How do I submit project deliverables?',
    a: 'Once the event round advances to the "Submission" stage, go to the Event Details page or your Event Timeline page. If you are registered and approved, the Submission Portal will unlock, allowing you to drag-and-drop zip files/PDFs and add workspace links (GitHub/Figma).'
  },
  {
    q: 'Can I edit my submission after locking it?',
    a: 'No, clicking "Final Lock & Submit" is permanent. You can save as many draft versions as you like, but once finalized, the submission is frozen for evaluation.'
  },
  {
    q: 'Where do I view and verify my certificates?',
    a: 'Once issued by organizers, certificates are added to your Profile and Event Timeline. They are verified and searchable under `/verify/{certificateId}` by employers or academic heads.'
  },
  {
    q: 'How do I update my academic program and profile details?',
    a: 'Go to your Profile tab (bottom navigation or hamburger sidebar) and click "Edit Profile" or navigate to `/onboarding` to re-trigger the onboarding details wizard.'
  }
];

export default function Support() {
  const { currentUser, userProfile } = useAuth();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Ticket Form States
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Technical Issue');
  const [description, setDescription] = useState('');
  
  // Status States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicketId, setSuccessTicketId] = useState(null);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      return alert("Please fill in the subject and description fields!");
    }

    setIsSubmitting(true);
    try {
      const ticketData = {
        userId: currentUser?.uid || 'Anonymous',
        userEmail: currentUser?.email || 'Anonymous',
        userName: userProfile?.name || 'Anonymous User',
        subject: subject.trim(),
        category,
        description: description.trim()
      };
      
      const ticketId = await createSupportTicket(ticketData);
      setSuccessTicketId(ticketId);
      
      // Reset form
      setSubject('');
      setDescription('');
    } catch (err) {
      console.error("Failed to submit support ticket:", err);
      alert("Error submitting ticket. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFaqs = FAQ_LIST.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px 48px', color: '#1A1A1A', textAlign: 'left' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '36px' }}>
        <h1 className="heading-1" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <HelpCircle size={28} color="var(--primary)" /> Help & Support Center
        </h1>
        <p className="text-muted" style={{ marginTop: '8px' }}>Search guides, browse FAQs, or submit support tickets directly to our dev team.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: isMobile ? '24px' : '32px' }}>
        
        {/* Left Column: FAQs Accordion */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Frequently Asked Questions</h2>
          
          {/* FAQ Search */}
          <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', padding: '0 12px', marginBottom: '24px' }}>
            <Search size={18} color="#6C757D" />
            <input 
              placeholder="Search help topics..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px', fontSize: '13px', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredFaqs.map((faq, i) => (
              <div 
                key={i} 
                style={{ 
                  background: 'white', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.2s'
                }}
              >
                <div 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={16} color="#6C757D" /> : <ChevronDown size={16} color="#6C757D" />}
                </div>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 16px', fontSize: '13px', color: 'var(--text-light)', lineHeight: '1.6', background: 'var(--surface)', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
            {filteredFaqs.length === 0 && (
              <p className="text-muted" style={{ textAlign: 'center', padding: '16px 0' }}>No matching guides found.</p>
            )}
          </div>
        </div>

        {/* Right Column: Ticket Submission Form */}
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Submit Support Ticket</h2>
          
          {successTicketId ? (
            <div style={{ background: 'white', border: '1px solid #28A745', borderRadius: '16px', padding: '32px 24px', textAlign: 'center', boxShadow: '0 4px 12px rgba(40,167,69,0.05)' }}>
              <CheckCircle size={44} color="#28A745" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#28A745', marginBottom: '8px' }}>Ticket Submitted</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: '1.6', marginBottom: '16px' }}>
                Your ticket has been logged inside our operations database. We will reply to your account email shortly.
              </p>
              <div style={{ background: 'var(--surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-light)' }}>
                Ref ID: {successTicketId}
              </div>
              <button 
                onClick={() => setSuccessTicketId(null)}
                className="btn-primary" 
                style={{ background: 'white', color: 'var(--primary)', border: '1px solid var(--primary)', width: '100%', marginTop: '20px', padding: '10px' }}
              >
                Submit New Ticket
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateTicket} style={{ background: 'white', border: '1px solid var(--border-light)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Subject</label>
                <input 
                  placeholder="Summarize the query..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Category</label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '13px' }}
                >
                  <option>Technical Issue</option>
                  <option>Bug Report</option>
                  <option>Event Query</option>
                  <option>Certificate Request</option>
                  <option>Feedback / Suggestion</option>
                  <option>Account Security</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>Details</label>
                <textarea 
                  placeholder="Detail the steps to reproduce the bug or describe your specific query..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="form-input"
                  style={{ height: '100px', resize: 'none', fontSize: '13px' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '12px' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Logging Ticket...
                  </>
                ) : (
                  <>
                    <Mail size={16} /> Submit Ticket
                  </>
                )}
              </button>
            </form>
          )}

        </div>

      </div>

    </div>
  );
}
