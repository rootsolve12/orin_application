import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Users, 
  FileText, 
  CheckCircle, 
  BarChart2, 
  X, 
  Bot, 
  AlertTriangle, 
  Calendar, 
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
  Search,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  QrCode,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getOrganizerEvents, 
  getEventRegistrations, 
  updateRegistrationStatus, 
  getEventSubmissions, 
  evaluateSubmission, 
  advanceEventRound, 
  createEvent, 
  updateEvent, 
  issueCertificate,
  checkInParticipant,
  addEmergencyAlert
} from '../firebase/firestore';

export default function Organizer() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Tab State: 'overview' | 'events' | 'participants' | 'submissions' | 'rankings'
  const [activeTab, setActiveTab] = useState('overview');
  
  // Data States
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals / Action States
  const [showDeadlineModal, setShowDeadlineModal] = useState(null); // eventId
  const [newDeadline, setNewDeadline] = useState('');
  const [evaluationSubmission, setEvaluationSubmission] = useState(null); // submission
  
  // Rubric Scores State (6 criteria, 0-10 each)
  const [rubric, setRubric] = useState({
    innovation: 0,
    technicalDepth: 0,
    problemSolving: 0,
    feasibility: 0,
    impact: 0,
    presentation: 0
  });
  const [writtenFeedback, setWrittenFeedback] = useState('');
  const [aiReviewResult, setAiReviewResult] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);

  // Additional states for Phase 4
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scanInputCode, setScanInputCode] = useState('');
  const [scannerFeedback, setScannerFeedback] = useState('');
  const [emergencyText, setEmergencyText] = useState('');

  // CSV Export functions
  const handleExportRegistrations = () => {
    if (!selectedEventId) return alert("Select an event first.");
    const targetEvent = events.find(e => e.id === selectedEventId);
    if (!targetEvent) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Name,Email,Institution,Degree Program,Academic Year,Status,Checked In,Checked In At\n";
    
    registrations.forEach(reg => {
      const profile = reg.autoFilledProfile || {};
      const name = (profile.name || reg.userId).replace(/,/g, " ");
      const email = (profile.email || reg.userId).replace(/,/g, " ");
      const institution = (profile.institution || "N/A").replace(/,/g, " ");
      const degree = (profile.degreeProgram || "N/A").replace(/,/g, " ");
      const year = profile.academicYear || "N/A";
      const status = reg.status || "Pending";
      const checkedIn = reg.checkedIn ? "Yes" : "No";
      const checkedInAt = reg.checkedInAt ? (typeof reg.checkedInAt.toDate === 'function' ? reg.checkedInAt.toDate().toISOString() : (reg.checkedInAt.seconds ? new Date(reg.checkedInAt.seconds * 1000).toISOString() : String(reg.checkedInAt))) : "N/A";
      
      csvContent += `"${name}","${email}","${institution}","${degree}","${year}","${status}","${checkedIn}","${checkedInAt}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${targetEvent.title.replace(/\s+/g, '_')}_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportEvaluations = () => {
    if (!selectedEventId) return alert("Select an event first.");
    const targetEvent = events.find(e => e.id === selectedEventId);
    if (!targetEvent) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rank,Name,User ID,Status,Innovation Score,Technical Depth Score,Problem Solving Score,Feasibility Score,Impact Score,Presentation Score,Total Score,Feedback\n";
    
    const sortedSubmissions = [...submissions].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    
    sortedSubmissions.forEach((sub, idx) => {
      const name = (sub.autoFilledProfile?.name || "N/A").replace(/,/g, " ");
      const userId = sub.userId;
      const status = sub.status || "Submitted";
      const rubric = sub.rubricScores || {};
      const innovation = rubric.innovation || 0;
      const technicalDepth = rubric.technicalDepth || 0;
      const problemSolving = rubric.problemSolving || 0;
      const feasibility = rubric.feasibility || 0;
      const impact = rubric.impact || 0;
      const presentation = rubric.presentation || 0;
      const total = sub.totalScore || 0;
      const feedback = (sub.feedback || "").replace(/"/g, '""').replace(/,/g, " ");
      
      csvContent += `"${idx + 1}","${name}","${userId}","${status}","${innovation}","${technicalDepth}","${problemSolving}","${feasibility}","${impact}","${presentation}","${total}","${feedback}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${targetEvent.title.replace(/\s+/g, '_')}_evaluations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCheckIn = async (eventId, userId) => {
    try {
      await checkInParticipant(eventId, userId);
      alert('Participant checked in successfully.');
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to check in participant.');
    }
  };

  const handleVerifyScan = async () => {
    setScannerFeedback('');
    if (!scanInputCode) {
      setScannerFeedback('Please enter a valid pass code.');
      return;
    }
    
    const parts = scanInputCode.split('-');
    if (parts.length < 3 || parts[0] !== 'ORIN') {
      setScannerFeedback('Invalid code format. Expected: ORIN-XXXX-YYYY');
      return;
    }
    
    const eventSuffix = parts[1].toUpperCase();
    const userSuffix = parts[2].toUpperCase();
    
    const matchedReg = registrations.find(r => r.userId.substring(0, 4).toUpperCase() === userSuffix);
    if (!matchedReg) {
      setScannerFeedback('No approved participant found matching this pass code.');
      return;
    }
    
    if (matchedReg.status !== 'Approved') {
      setScannerFeedback(`Participant registration is currently: ${matchedReg.status}. Only approved participants can check in.`);
      return;
    }
    
    if (matchedReg.checkedIn) {
      setScannerFeedback(`Participant (${matchedReg.autoFilledProfile?.name || matchedReg.userId}) is already checked in.`);
      return;
    }
    
    try {
      await checkInParticipant(selectedEventId, matchedReg.userId);
      setScannerFeedback(`SUCCESS: Checked in ${matchedReg.autoFilledProfile?.name || matchedReg.userId} successfully!`);
      setScanInputCode('');
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      setScannerFeedback('Failed to update check-in in database.');
    }
  };

  const handleSendEmergency = async () => {
    if (!emergencyText.trim()) return alert("Enter emergency alert message!");
    if (!selectedEventId) return alert("Select an event first!");
    
    try {
      await addEmergencyAlert(selectedEventId, emergencyText);
      alert('Emergency alert broadcasted successfully!');
      setEmergencyText('');
    } catch (err) {
      console.error(err);
      alert('Failed to send emergency alert.');
    }
  };

  // Load events
  useEffect(() => {
    if (!currentUser) return;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await getOrganizerEvents(currentUser.uid);
        setEvents(data);
        if (data.length > 0 && !selectedEventId) {
          setSelectedEventId(data[0].id);
        }
      } catch (err) {
        console.error("Error loading organizer events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [currentUser, refreshKey]);

  // Load registrations & submissions when selectedEventId changes
  useEffect(() => {
    if (!selectedEventId) return;
    const loadEventDetails = async () => {
      try {
        const regs = await getEventRegistrations(selectedEventId);
        setRegistrations(regs);
        
        const subs = await getEventSubmissions(selectedEventId);
        setSubmissions(subs);
      } catch (err) {
        console.error("Error loading event registrations/submissions:", err);
      }
    };
    loadEventDetails();
  }, [selectedEventId, refreshKey]);

  // Derived KPI Stats
  const totalEventsCount = events.length;
  const activeEventsCount = events.filter(e => e.status === 'Published' || e.status === 'Active').length;
  const totalRegsCount = events.reduce((sum, e) => sum + (e.registeredCount || 0), 0);
  
  // Pending registrations across all events
  const [globalPendingCount, setGlobalPendingCount] = useState(0);
  useEffect(() => {
    const calcPending = async () => {
      let pendingSum = 0;
      for (const e of events) {
        try {
          const regs = await getEventRegistrations(e.id);
          pendingSum += regs.filter(r => r.status === 'Pending').length;
        } catch (err) {
          console.error(err);
        }
      }
      setGlobalPendingCount(pendingSum);
    };
    if (events.length > 0) {
      calcPending();
    }
  }, [events, refreshKey]);

  // Action: Advance Round
  const handleAdvanceRound = async (eventId) => {
    try {
      await advanceEventRound(eventId);
      alert('Event advanced to the next round.');
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to advance event round.');
    }
  };

  // Action: Approve/Reject registration
  const handleRegStatusChange = async (eventId, userId, newStatus) => {
    try {
      await updateRegistrationStatus(eventId, userId, newStatus);
      alert(`Registration ${newStatus.toLowerCase()} successfully.`);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to update registration status.');
    }
  };

  // Action: Submit Rubric Evaluation
  const handleSaveEvaluation = async (isShortlisted) => {
    if (!evaluationSubmission) return;
    const totalScore = Object.values(rubric).reduce((sum, val) => sum + Number(val), 0);
    
    const evalData = {
      rubricScores: rubric,
      totalScore,
      feedback: writtenFeedback,
      isShortlisted,
      evaluatedAt: new Date().toISOString()
    };

    try {
      await evaluateSubmission(selectedEventId, evaluationSubmission.userId, evalData);
      alert(`Submission evaluated and ${isShortlisted ? 'Shortlisted' : 'Saved'}.`);
      setEvaluationSubmission(null);
      setRubric({
        innovation: 0,
        technicalDepth: 0,
        problemSolving: 0,
        feasibility: 0,
        impact: 0,
        presentation: 0
      });
      setWrittenFeedback('');
      setAiReviewResult(null);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to save evaluation.');
    }
  };

  // Action: Simulated AI Review Assistant
  const handleAiReview = (sub) => {
    setIsGeneratingAi(true);
    setTimeout(() => {
      const isGood = Math.random() > 0.3;
      const simPercent = isGood ? 8 : 34;
      setAiReviewResult({
        summary: `Codebase utilizes React + Firebase modular structure. Git history indicates steady commits. Code patterns are consistent with modern standards.`,
        plagiarismRisk: isGood ? 'Low (8% similarity)' : 'Medium (34% matching public repo code blocks)',
        plagiarismDetails: {
          similarity: simPercent,
          sourceUrl: isGood ? 'github.com/open-source/sample-auth' : 'github.com/developer-templates/firebase-chat-app',
          submittedCode: `// Student Submission - auth.js
import { auth, db } from '../config';
import { signInWithEmailAndPassword } from 'firebase/auth';

export async function loginUser(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = doc(db, 'users', cred.user.uid);
    return { success: true, user: cred.user };
  } catch (error) {
    console.error("Auth Failure:", error.message);
    return { success: false, error: error.message };
  }
}`,
          matchedCode: `// Matched Source - auth-template.js
import { auth, db } from '../config';
import { signInWithEmailAndPassword } from 'firebase/auth';

export async function loginUser(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = doc(db, 'users', cred.user.uid);
    return { success: true, user: cred.user };
  } catch (err) {
    console.error("Auth Error:", err.message);
    return { success: false, error: err.message };
  }
}`
        },
        suggestedScores: {
          innovation: isGood ? 8 : 5,
          technicalDepth: isGood ? 9 : 6,
          problemSolving: isGood ? 8 : 6,
          feasibility: isGood ? 7 : 7,
          impact: isGood ? 8 : 5,
          presentation: 9
        }
      });
      // Pre-fill rubric with suggested scores
      setRubric({
        innovation: isGood ? 8 : 5,
        technicalDepth: isGood ? 9 : 6,
        problemSolving: isGood ? 8 : 6,
        feasibility: isGood ? 7 : 7,
        impact: isGood ? 8 : 5,
        presentation: 9
      });
      setIsGeneratingAi(false);
    }, 2000);
  };

  // Action: Manage Dropdown Options
  const handleDropdownAction = async (eventId, action) => {
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;

    try {
      if (action === 'Publish') {
        await updateEvent(eventId, { status: 'Published' });
        alert('Event published successfully.');
      } else if (action === 'Pause Registrations') {
        await updateEvent(eventId, { status: 'Paused' });
        alert('Registrations paused.');
      } else if (action === 'Resume Registrations') {
        await updateEvent(eventId, { status: 'Published' });
        alert('Registrations resumed.');
      } else if (action === 'Archive') {
        if (window.confirm('Are you sure you want to archive this event?')) {
          await updateEvent(eventId, { status: 'Archived' });
          alert('Event archived.');
        }
      } else if (action === 'Duplicate') {
        const { id, createdAt, updatedAt, organizerId, registeredCount, ...cloneData } = targetEvent;
        const newId = await createEvent(currentUser.uid, {
          ...cloneData,
          title: `${cloneData.title} (Copy)`,
          status: 'Draft'
        });
        alert(`Event duplicated as Draft (ID: ${newId}).`);
      } else if (action === 'Extend Deadlines') {
        setShowDeadlineModal(eventId);
      }
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert('Operation failed.');
    }
  };

  // Action: Save Extended Deadline
  const saveDeadlineExtension = async () => {
    if (!newDeadline) return alert("Select a date!");
    try {
      await updateEvent(showDeadlineModal, { registrationDeadline: newDeadline });
      alert('Registration deadline updated.');
      setShowDeadlineModal(null);
      setNewDeadline('');
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to update deadline.');
    }
  };

  // Action: Issue Certificate
  const handleIssueCert = async (sub) => {
    const targetEvent = events.find(e => e.id === selectedEventId);
    const participantName = sub.autoFilledProfile?.name || sub.userId;
    if (window.confirm(`Issue Orin Verified Certificate to ${participantName}?`)) {
      try {
        const certId = await issueCertificate(selectedEventId, sub.userId, targetEvent.title, participantName);
        alert(`Certificate issued successfully! ID: ${certId}`);
        setRefreshKey(k => k + 1);
      } catch (err) {
        console.error(err);
        alert('Failed to issue certificate.');
      }
    }
  };

  // Action: Publish Final Results
  const handlePublishResults = async (eventId) => {
    if (window.confirm("Are you ready to publish final results and complete this event?")) {
      try {
        await updateEvent(eventId, { status: 'Completed', currentRoundIndex: 8 }); // Results/Certification stage
        alert("Results published successfully! The event is marked as Completed.");
        setRefreshKey(k => k + 1);
      } catch (err) {
        console.error(err);
        alert("Failed to publish results.");
      }
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '16px 12px' : '24px', color: '#1A1A1A' }}>
      
      {/* Top Banner */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '16px' : '24px', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="heading-1" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '24px' : '32px' }}>
            Organizer Operations Center
          </h1>
          <p className="text-muted" style={{ marginTop: 4, fontSize: isMobile ? '13px' : '14px' }}>Manage registrations, evaluate submissions, and track competitive rounds.</p>
        </div>
        <button onClick={() => navigate('/organizer/create')} className="btn-primary" style={{ padding: '12px 24px', fontSize: '15px', width: isMobile ? '100%' : 'auto', textAlign: 'center' }}>
          + Create New Event
        </button>
      </div>

      {/* KPI Ribbon */}
      <div 
        className={isMobile ? "swipe-container" : ""} 
        style={isMobile ? { marginBottom: '32px', display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' } : { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}
      >
        <div className="stat-card" style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)', flex: isMobile ? '0 0 160px' : 'auto', minWidth: isMobile ? '140px' : 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Activity color="var(--primary)" size={20} />
            <span style={{ fontWeight: '800', fontSize: '24px', color: 'var(--text)' }}>{totalEventsCount}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px', fontWeight: '600' }}>Total Events</div>
        </div>
        <div className="stat-card" style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)', flex: isMobile ? '0 0 160px' : 'auto', minWidth: isMobile ? '140px' : 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Users color="#28A745" size={20} />
            <span style={{ fontWeight: '800', fontSize: '24px', color: 'var(--text)' }}>{totalRegsCount}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px', fontWeight: '600' }}>Registrations</div>
        </div>
        <div className="stat-card" style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)', flex: isMobile ? '0 0 160px' : 'auto', minWidth: isMobile ? '140px' : 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <CheckCircle color="#FFA116" size={20} />
            <span style={{ fontWeight: '800', fontSize: '24px', color: 'var(--text)' }}>{globalPendingCount}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px', fontWeight: '600' }}>Pending Approval</div>
        </div>
        <div className="stat-card" style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)', flex: isMobile ? '0 0 160px' : 'auto', minWidth: isMobile ? '140px' : 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <FileText color="#17A2B8" size={20} />
            <span style={{ fontWeight: '800', fontSize: '24px', color: 'var(--text)' }}>
              {events.reduce((sum, e) => sum + (e.id === selectedEventId ? submissions.length : 0), 0) || submissions.length}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px', fontWeight: '600' }}>Submissions (Current)</div>
        </div>
        <div className="stat-card" style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)', flex: isMobile ? '0 0 160px' : 'auto', minWidth: isMobile ? '140px' : 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Award color="#6C757D" size={20} />
            <span style={{ fontWeight: '800', fontSize: '24px', color: 'var(--text)' }}>
              {submissions.filter(s => s.status === 'Completed' || s.earnedCertificates).length}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px', fontWeight: '600' }}>Certificates Issued</div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="swipe-container" style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '24px', marginBottom: '24px' }}>
        {[
          { id: 'overview', label: '📊 Dashboard Overview' },
          { id: 'analytics', label: '📈 Analytics Insights' },
          { id: 'events', label: '📅 Manage Events' },
          { id: 'participants', label: '👥 Participants List' },
          { id: 'submissions', label: '📝 Evaluations & Scoring' },
          { id: 'rankings', label: '🏆 Leaderboards & Certificates' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 4px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-light)',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: '24px' }}>
          
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Event Selection</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.map(e => (
                <div 
                  key={e.id} 
                  onClick={() => { setSelectedEventId(e.id); alert(`Focus switched to: ${e.title}`); }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: selectedEventId === e.id ? 'var(--primary)' : 'var(--border-light)',
                    background: selectedEventId === e.id ? 'rgba(123, 97, 255, 0.05)' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <h4 style={{ fontWeight: '700', fontSize: '14px' }}>{e.title}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                      Round: {e.rounds?.[e.currentRoundIndex || 0]} | Status: {e.status}
                    </p>
                  </div>
                  <ChevronRight size={18} color={selectedEventId === e.id ? 'var(--primary)' : 'var(--text-light)'} />
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>No events found. Start by creating your first event!</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '12px' }}>Quick Stats</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px' }}>Currently focusing on the selected event's registrations.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>Approved Registrations</span>
                  <span style={{ fontWeight: 'bold' }}>{registrations.filter(r => r.status === 'Approved').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>Pending Registrations</span>
                  <span style={{ fontWeight: 'bold' }}>{registrations.filter(r => r.status === 'Pending').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>Total Project Submissions</span>
                  <span style={{ fontWeight: 'bold' }}>{submissions.length}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, #7B61FF, #9D85FF)', padding: '24px', borderRadius: '16px', color: 'white' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>Round Management</h3>
              <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '16px' }}>Move the selected event to the next screening, coding assessment, or review stages.</p>
              <button 
                onClick={() => handleAdvanceRound(selectedEventId)} 
                className="btn-primary" 
                style={{ background: 'white', color: 'var(--primary)', border: 'none', width: '100%', padding: '12px', fontWeight: '800' }}
                disabled={!selectedEventId}
              >
                Advance Competition Round &rarr;
              </button>
            </div>

            {/* Emergency Alerts Form */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1.5px solid #FFD0D0' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '8px', color: '#DC3545', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={18} /> Emergency Broadcast
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '16px' }}>
                Send real-time alerts to all registered participants (e.g. venue changes or urgent delays).
              </p>
              
              <textarea
                value={emergencyText}
                onChange={e => setEmergencyText(e.target.value)}
                placeholder="Type urgent broadcast message here..."
                style={{
                  width: '100%',
                  height: '80px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-light)',
                  padding: '10px',
                  fontSize: '13px',
                  resize: 'none',
                  outline: 'none',
                  marginBottom: '12px'
                }}
              />
              
              <button
                onClick={handleSendEmergency}
                disabled={!selectedEventId}
                className="btn-primary"
                style={{ background: '#DC3545', border: 'none', width: '100%', padding: '10px', fontSize: '13px', fontWeight: '800' }}
              >
                Send Urgent Alert
              </button>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: Analytics Insights */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Top KPI Ribbon */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600' }}>Check-in Rate</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#28A745' }}>
                  {registrations.filter(r => r.status === 'Approved').length > 0
                    ? Math.round((registrations.filter(r => r.checkedIn).length / registrations.filter(r => r.status === 'Approved').length) * 100)
                    : 0}%
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '12px' }}>
                {registrations.filter(r => r.checkedIn).length} / {registrations.filter(r => r.status === 'Approved').length}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px' }}>Attendees Checked In</div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600' }}>Evaluation Progress</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>
                  {submissions.length > 0
                    ? Math.round((submissions.filter(s => s.totalScore !== undefined).length / submissions.length) * 100)
                    : 0}%
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '12px' }}>
                {submissions.filter(s => s.totalScore !== undefined).length} / {submissions.length}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px' }}>Projects Scored</div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600' }}>Shortlist Rate</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#FFA116' }}>
                  {submissions.length > 0
                    ? Math.round((submissions.filter(s => s.status === 'Shortlisted').length / submissions.length) * 100)
                    : 0}%
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '12px' }}>
                {submissions.filter(s => s.status === 'Shortlisted').length} Teams
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px' }}>Shortlisted Participants</div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600' }}>Total Submissions</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#17A2B8' }}>Active</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '12px' }}>
                {submissions.length}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '6px' }}>Total Project Uploads</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            
            {/* Registration Growth Chart */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>📈 Registration Growth Velocity</h3>
              
              <svg viewBox="0 0 500 200" style={{ width: '100%', height: '220px' }}>
                {/* Background Grid Lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#F1F3F5" strokeDasharray="4" />
                <line x1="40" y1="60" x2="480" y2="60" stroke="#F1F3F5" strokeDasharray="4" />
                <line x1="40" y1="100" x2="480" y2="100" stroke="#F1F3F5" strokeDasharray="4" />
                <line x1="40" y1="140" x2="480" y2="140" stroke="#F1F3F5" strokeDasharray="4" />
                <line x1="40" y1="180" x2="480" y2="180" stroke="#E9ECEF" strokeWidth="1.5" />
                
                {/* Y Axis Labels */}
                <text x="15" y="25" fill="#6C757D" fontSize="10" fontWeight="bold">100</text>
                <text x="15" y="65" fill="#6C757D" fontSize="10" fontWeight="bold">75</text>
                <text x="15" y="105" fill="#6C757D" fontSize="10" fontWeight="bold">50</text>
                <text x="15" y="145" fill="#6C757D" fontSize="10" fontWeight="bold">25</text>
                <text x="15" y="185" fill="#6C757D" fontSize="10" fontWeight="bold">0</text>
                
                {/* X Axis Labels */}
                <text x="40" y="195" fill="#6C757D" fontSize="9" fontWeight="bold" textAnchor="middle">Day 1</text>
                <text x="128" y="195" fill="#6C757D" fontSize="9" fontWeight="bold" textAnchor="middle">Day 2</text>
                <text x="216" y="195" fill="#6C757D" fontSize="9" fontWeight="bold" textAnchor="middle">Day 3</text>
                <text x="304" y="195" fill="#6C757D" fontSize="9" fontWeight="bold" textAnchor="middle">Day 4</text>
                <text x="392" y="195" fill="#6C757D" fontSize="9" fontWeight="bold" textAnchor="middle">Day 5</text>
                <text x="480" y="195" fill="#6C757D" fontSize="9" fontWeight="bold" textAnchor="middle">Day 6</text>

                {/* Line Path Gradient Fill */}
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Area Fill */}
                <path d="M40,180 L40,150 L128,125 L216,135 L304,90 L392,50 L480,30 L480,180 Z" fill="url(#chartGrad)" />
                
                {/* Path Line */}
                <path d="M40,150 L128,125 L216,135 L304,90 L392,50 L480,30" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Data Points */}
                <circle cx="40" cy="150" r="5" fill="var(--primary)" stroke="white" strokeWidth="2" />
                <circle cx="128" cy="125" r="5" fill="var(--primary)" stroke="white" strokeWidth="2" />
                <circle cx="216" cy="135" r="5" fill="var(--primary)" stroke="white" strokeWidth="2" />
                <circle cx="304" cy="90" r="5" fill="var(--primary)" stroke="white" strokeWidth="2" />
                <circle cx="392" cy="50" r="5" fill="var(--primary)" stroke="white" strokeWidth="2" />
                <circle cx="480" cy="30" r="5" fill="var(--primary)" stroke="white" strokeWidth="2" />
              </svg>
            </div>
            
            {/* Category distribution donut chart */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', width: '100%', textAlign: 'left', marginBottom: '20px' }}>🍩 Category Distribution</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', width: '100%', height: '220px' }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="#F1F3F5" strokeWidth="12" />
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="#7B61FF" strokeWidth="12"
                          strokeDasharray="157.08 314.16" strokeDashoffset="0" transform="rotate(-90 60 60)" />
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="#10B981" strokeWidth="12"
                          strokeDasharray="94.25 314.16" strokeDashoffset="-157.08" transform="rotate(-90 60 60)" />
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="#F59E0B" strokeWidth="12"
                          strokeDasharray="62.83 314.16" strokeDashoffset="-251.33" transform="rotate(-90 60 60)" />
                  <text x="60" y="62" textAnchor="middle" fill="#1A1A1A" fontSize="11" fontWeight="bold">Events</text>
                  <text x="60" y="74" textAnchor="middle" fill="#6C757D" fontSize="8" fontWeight="600">Spread</text>
                </svg>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#7B61FF' }} />
                    <span style={{ fontWeight: '600' }}>Hackathons (50%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10B981' }} />
                    <span style={{ fontWeight: '600' }}>Workshops (30%)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F59E0B' }} />
                    <span style={{ fontWeight: '600' }}>Cultural/Other (20%)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Stacked Attendance Ratios Chart */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '24px' }}>📊 Checked-In Attendance & Screening Ratios</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {events.map((e) => {
                const isSelected = e.id === selectedEventId;
                const total = registrations.length;
                const approved = registrations.filter(r => r.status === 'Approved').length;
                const checkedIn = registrations.filter(r => r.checkedIn).length;
                
                const approvedPct = total > 0 ? (approved / total) * 100 : 0;
                const checkedInPct = total > 0 ? (checkedIn / total) * 100 : 0;

                return (
                  <div key={e.id} style={{ opacity: isSelected ? 1 : 0.6, transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
                      <span>{e.title}</span>
                      <span style={{ color: 'var(--primary)', fontSize: '12px' }}>
                        Check-ins: {checkedIn} / {approved} ({approved > 0 ? Math.round((checkedIn/approved)*100) : 0}%)
                      </span>
                    </div>
                    
                    {/* Horizontal Stacked Bar */}
                    <div style={{ width: '100%', height: '24px', background: '#F1F3F5', borderRadius: '6px', overflow: 'hidden', display: 'flex', position: 'relative' }}>
                      {/* Checked in (Green) */}
                      <div style={{ 
                        width: `${isSelected ? checkedInPct : (e.registeredCount ? 20 : 0)}%`, 
                        height: '100%', 
                        background: '#10B981', 
                        transition: 'width 0.5s ease-out' 
                      }} title="Checked In" />
                      
                      {/* Approved but not checked in (Purple) */}
                      <div style={{ 
                        width: `${isSelected ? (approvedPct - checkedInPct) : (e.registeredCount ? 40 : 0)}%`, 
                        height: '100%', 
                        background: '#7B61FF', 
                        transition: 'width 0.5s ease-out' 
                      }} title="Approved (Pending Check-In)" />
                      
                      {/* Other / Pending Screening (Yellow) */}
                      <div style={{ 
                        width: `${isSelected ? (100 - approvedPct) : (e.registeredCount ? 40 : 100)}%`, 
                        height: '100%', 
                        background: '#F59E0B', 
                        transition: 'width 0.5s ease-out' 
                      }} title="Pending Screening / Rest" />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Chart Legend */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10B981' }} />
                <span>Checked In</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#7B61FF' }} />
                <span>Approved (Not Checked In)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#F59E0B' }} />
                <span>Pending Screening / Waitlist</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: Events Table */}
      {activeTab === 'events' && (
        isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {events.map(event => (
              <div key={event.id} style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontWeight: '700', fontSize: '15px', margin: 0, color: 'var(--text)' }}>{event.title}</h4>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                    background: event.status === 'Published' ? 'rgba(40, 167, 69, 0.1)' : event.status === 'Draft' ? 'rgba(108, 117, 125, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                    color: event.status === 'Published' ? '#28A745' : event.status === 'Draft' ? '#6C757D' : '#DC3545'
                  }}>
                    {event.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-light)' }}>
                  <span>Round Stage:</span>
                  <span style={{ background: '#F3F0FF', color: 'var(--primary)', padding: '2px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '12px' }}>
                    {event.rounds?.[event.currentRoundIndex || 0]}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-light)' }}>
                  <span>Registrations:</span>
                  <span style={{ fontWeight: '700', color: 'var(--text)' }}>{event.registeredCount} / {event.maxCapacity}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                  <button 
                    onClick={() => handleAdvanceRound(event.id)}
                    className="btn-primary" 
                    style={{ flex: 1, padding: '8px', fontSize: '12px', background: 'var(--primary)', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    Advance Round
                  </button>
                  <select 
                    onChange={(e) => handleDropdownAction(event.id, e.target.value)} 
                    value="Manage Actions..."
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', height: '36px' }}
                  >
                    <option disabled>Manage Actions...</option>
                    {event.status === 'Draft' && <option value="Publish">Publish</option>}
                    {(event.status === 'Published' || event.status === 'Active') && <option value="Pause Registrations">Pause Registrations</option>}
                    {event.status === 'Paused' && <option value="Resume Registrations">Resume Registrations</option>}
                    <option value="Extend Deadlines">Extend Deadline</option>
                    <option value="Duplicate">Duplicate Event</option>
                    <option value="Archive">Archive Event</option>
                  </select>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <p className="text-muted" style={{ textAlign: 'center', padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)' }}>No events created. Click "Create New Event" to start.</p>
            )}
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Event Name</th>
                  <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Round Stage</th>
                  <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Status</th>
                  <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Registrations</th>
                  <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{event.title}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      <span style={{ background: '#F3F0FF', color: 'var(--primary)', padding: '4px 10px', borderRadius: '8px', fontWeight: '600', fontSize: '12px' }}>
                        {event.rounds?.[event.currentRoundIndex || 0]}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                        background: event.status === 'Published' ? 'rgba(40, 167, 69, 0.1)' : event.status === 'Draft' ? 'rgba(108, 117, 125, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                        color: event.status === 'Published' ? '#28A745' : event.status === 'Draft' ? '#6C757D' : '#DC3545'
                      }}>
                        {event.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: '600', fontSize: '14px' }}>{event.registeredCount} / {event.maxCapacity}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button 
                          onClick={() => handleAdvanceRound(event.id)}
                          className="btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--primary)' }}
                        >
                          Advance Round
                        </button>
                        <select 
                          onChange={(e) => handleDropdownAction(event.id, e.target.value)} 
                          value="Manage Actions..."
                          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--surface)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          <option disabled>Manage Actions...</option>
                          {event.status === 'Draft' && <option value="Publish">Publish</option>}
                          {(event.status === 'Published' || event.status === 'Active') && <option value="Pause Registrations">Pause Registrations</option>}
                          {event.status === 'Paused' && <option value="Resume Registrations">Resume Registrations</option>}
                          <option value="Extend Deadlines">Extend Deadline</option>
                          <option value="Duplicate">Duplicate Event</option>
                          <option value="Archive">Archive Event</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)' }}>
                      No events created. Click "Create New Event" to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* TAB CONTENT: Participants */}
      {activeTab === 'participants' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Manage Participants & Approvals</h3>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => { setShowScannerModal(true); setScannerFeedback(''); }}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <QrCode size={16} /> Verify QR Check-In
                </button>
                <button
                  onClick={handleExportRegistrations}
                  style={{
                    background: 'white',
                    color: 'var(--text)',
                    border: '1px solid var(--border-light)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  📥 Export Registrations (CSV)
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600' }}>Select Event:</label>
              <select 
                value={selectedEventId} 
                onChange={(e) => setSelectedEventId(e.target.value)} 
                className="form-input" 
                style={{ width: '250px', display: 'inline-block' }}
              >
                {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
          </div>

          isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {registrations.map(reg => {
                const profile = reg.autoFilledProfile || {};
                return (
                  <div key={reg.id} style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text)' }}>{profile.name || reg.userId}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{profile.email || reg.userId}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                          background: reg.status === 'Approved' ? 'rgba(40, 167, 69, 0.1)' : reg.status === 'Pending' ? 'rgba(255, 161, 22, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                          color: reg.status === 'Approved' ? '#28A745' : reg.status === 'Pending' ? '#FFA116' : '#DC3545'
                        }}>
                          {reg.status}
                        </span>
                        {reg.checkedIn && (
                          <span style={{ 
                            padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: '800',
                            background: 'rgba(40, 167, 69, 0.2)', color: '#1E5E2F'
                          }}>
                            ✓ Checked In
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', borderTop: '1px solid var(--border-light)', paddingTop: '10px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-light)' }}>Institution:</span>
                        <span style={{ fontWeight: '500', color: 'var(--text)' }}>{profile.institution || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-light)' }}>Academic Info:</span>
                        <span style={{ fontWeight: '500', color: 'var(--text)' }}>{profile.degreeProgram || 'N/A'} {profile.academicYear && `(Yr ${profile.academicYear})`}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-light)' }}>Resume:</span>
                        {profile.resumeUrl ? (
                          <a href={profile.resumeUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>View Resume</a>
                        ) : <span style={{ color: 'var(--text-light)' }}>No Resume</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                      {reg.status === 'Approved' && !reg.checkedIn && (
                        <button 
                          onClick={() => handleCheckIn(selectedEventId, reg.userId)} 
                          style={{ flex: 1, background: 'var(--primary)', border: 'none', color: 'white', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          Check In
                        </button>
                      )}
                      {reg.status === 'Pending' && (
                        <>
                          <button 
                            onClick={() => handleRegStatusChange(selectedEventId, reg.userId, 'Approved')} 
                            style={{ flex: 1, background: '#28A745', border: 'none', color: 'white', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRegStatusChange(selectedEventId, reg.userId, 'Rejected')} 
                            style={{ flex: 1, background: '#DC3545', border: 'none', color: 'white', padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {registrations.length === 0 && (
                <p className="text-muted" style={{ textAlign: 'center', padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)' }}>No registrations found for this event.</p>
              )}
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Participant Name</th>
                    <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Institution</th>
                    <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Academic Info</th>
                    <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Resume</th>
                    <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Status</th>
                    <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(reg => {
                    const profile = reg.autoFilledProfile || {};
                    return (
                      <tr key={reg.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: '600' }}>{profile.name || reg.userId}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{profile.email || reg.userId}</div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px' }}>{profile.institution || 'N/A'}</td>
                        <td style={{ padding: '16px', fontSize: '14px' }}>
                          {profile.degreeProgram || 'N/A'} {profile.academicYear && `(Yr ${profile.academicYear})`}
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px' }}>
                          {profile.resumeUrl ? (
                            <a href={profile.resumeUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>View Resume</a>
                          ) : 'No Resume'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <span style={{ 
                              padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '700',
                              background: reg.status === 'Approved' ? 'rgba(40, 167, 69, 0.1)' : reg.status === 'Pending' ? 'rgba(255, 161, 22, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                              color: reg.status === 'Approved' ? '#28A745' : reg.status === 'Pending' ? '#FFA116' : '#DC3545'
                            }}>
                              {reg.status}
                            </span>
                            {reg.checkedIn && (
                              <span style={{ 
                                padding: '2px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: '800',
                                background: 'rgba(40, 167, 69, 0.2)', color: '#1E5E2F'
                              }}>
                                ✓ Checked In
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {reg.status === 'Approved' && !reg.checkedIn && (
                              <button 
                                onClick={() => handleCheckIn(selectedEventId, reg.userId)} 
                                style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                              >
                                Check In
                              </button>
                            )}
                            {reg.status === 'Pending' && (
                              <>
                                <button 
                                  onClick={() => handleRegStatusChange(selectedEventId, reg.userId, 'Approved')} 
                                  style={{ background: '#28A745', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleRegStatusChange(selectedEventId, reg.userId, 'Rejected')} 
                                  style={{ background: '#DC3545', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {registrations.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)' }}>
                        No registrations found for this event.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        </div>
      )}

      {/* TAB CONTENT: Submissions & Evaluation */}
      {activeTab === 'submissions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Evaluation Panel & Rubrics</h3>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '600', marginRight: '8px' }}>Select Event:</label>
              <select 
                value={selectedEventId} 
                onChange={(e) => setSelectedEventId(e.target.value)} 
                className="form-input" 
                style={{ width: '250px', display: 'inline-block' }}
              >
                {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: '24px' }}>
            
            {/* Submissions List */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              <h4 style={{ fontWeight: '800', fontSize: '15px', marginBottom: '16px' }}>Project Submissions</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {submissions.map(sub => (
                  <div 
                    key={sub.id}
                    onClick={() => { setEvaluationSubmission(sub); setAiReviewResult(null); }}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: evaluationSubmission?.id === sub.id ? 'var(--primary)' : 'var(--border-light)',
                      background: evaluationSubmission?.id === sub.id ? 'rgba(123, 97, 255, 0.04)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px' }}>{sub.autoFilledProfile?.name || sub.userId}</span>
                      <span style={{ 
                        fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '8px',
                        background: sub.status === 'Shortlisted' ? '#28A745' : sub.status === 'Submitted' ? 'var(--primary)' : '#6C757D',
                        color: 'white'
                      }}>{sub.status}</span>
                    </div>
                    
                    <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '8px' }}>
                      Submitted: {sub.submittedAt ? new Date(sub.submittedAt.seconds * 1000).toLocaleString() : 'Just now'}
                    </p>
                    
                    {sub.totalScore !== undefined && (
                      <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        Rubric Score: {sub.totalScore} / 60
                      </div>
                    )}
                  </div>
                ))}
                {submissions.length === 0 && (
                  <p className="text-muted" style={{ textAlign: 'center', padding: '24px' }}>No submissions received for this event yet.</p>
                )}
              </div>
            </div>

            {/* Rubric Evaluation Form */}
            <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
              {evaluationSubmission ? (
                <div>
                  <h4 style={{ fontWeight: '800', fontSize: '16px', marginBottom: '8px', color: 'var(--text)' }}>
                    Evaluate: {evaluationSubmission.autoFilledProfile?.name || evaluationSubmission.userId}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '16px' }}>Input rubric scores out of 10 points per criteria.</p>

                  {/* Submission Links & Artifacts */}
                  <div style={{ background: 'var(--surface)', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-light)' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '8px' }}>Submitted Links & Files:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {evaluationSubmission.links?.map((l, i) => (
                        <div key={i} style={{ fontSize: '13px' }}>
                          <strong>{l.type}:</strong> <a href={l.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', wordBreak: 'break-all' }}>{l.url}</a>
                        </div>
                      ))}
                      {evaluationSubmission.files?.map((f, i) => (
                        <div key={i} style={{ fontSize: '13px' }}>
                          <strong>File:</strong> <a href={f.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{f.name}</a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Assistant */}
                  <button 
                    onClick={() => handleAiReview(evaluationSubmission)}
                    disabled={isGeneratingAi}
                    style={{ width: '100%', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(123, 97, 255, 0.1)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '10px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}
                  >
                    <Bot size={18} /> {isGeneratingAi ? 'AI Code Review in Progress...' : 'Run AI Evaluation Assistant'}
                  </button>

                  {aiReviewResult && (
                    <div style={{ padding: '16px', background: '#FFF9E6', border: '1px solid #FFE699', borderRadius: '12px', marginBottom: '20px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', gap: '6px', color: '#B27D00', fontWeight: '700', marginBottom: '8px' }}>
                        <AlertTriangle size={16} /> AI Plagiarism & Review Summary
                      </div>
                      <p style={{ color: '#664D03', marginBottom: '8px' }}>{aiReviewResult.summary}</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                        <strong style={{ color: '#664D03' }}>Plagiarism Match: {aiReviewResult.plagiarismRisk}</strong>
                        
                        {aiReviewResult.plagiarismDetails && (
                          <button
                            type="button"
                            onClick={() => setShowDiffModal(true)}
                            style={{ 
                              background: 'var(--primary)', 
                              color: 'white', 
                              border: 'none', 
                              padding: '8px 12px', 
                              borderRadius: '6px', 
                              fontSize: '11px', 
                              fontWeight: '700', 
                              cursor: 'pointer',
                              width: 'fit-content'
                            }}
                          >
                            🔎 Compare Code Match (Side-by-Side Diff)
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rubric Points */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { key: 'innovation', label: 'Innovation' },
                      { key: 'technicalDepth', label: 'Tech Depth' },
                      { key: 'problemSolving', label: 'Problem Solving' },
                      { key: 'feasibility', label: 'Feasibility' },
                      { key: 'impact', label: 'Impact' },
                      { key: 'presentation', label: 'Presentation' }
                    ].map(crit => (
                      <div key={crit.key}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>{crit.label} (0-10)</label>
                        <input 
                          type="number" 
                          min="0" 
                          max="10" 
                          className="form-input" 
                          value={rubric[crit.key]}
                          onChange={(e) => setRubric({ ...rubric, [crit.key]: Math.min(10, Math.max(0, Number(e.target.value))) })} 
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Written Feedback</label>
                    <textarea 
                      className="form-input" 
                      value={writtenFeedback} 
                      onChange={(e) => setWrittenFeedback(e.target.value)} 
                      placeholder="Input constructive comments..."
                      style={{ height: '80px', resize: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => handleSaveEvaluation(false)} 
                      className="btn-primary" 
                      style={{ flex: 1, background: 'white', color: 'var(--text-light)', border: '1px solid var(--border-light)' }}
                    >
                      Save Score
                    </button>
                    <button 
                      onClick={() => handleSaveEvaluation(true)} 
                      className="btn-primary" 
                      style={{ flex: 1, background: '#28A745' }}
                    >
                      Shortlist
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>Select a project submission from the left panel to begin rubric scoring.</p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: Rankings & Certificates */}
      {activeTab === 'rankings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>🏆 Leaderboard & Issuance</h3>
              <button
                onClick={handleExportEvaluations}
                style={{
                  background: 'white',
                  color: 'var(--text)',
                  border: '1px solid var(--border-light)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                📥 Export Rankings & Evaluations (CSV)
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                onClick={() => handlePublishResults(selectedEventId)} 
                className="btn-primary" 
                style={{ background: '#FFD700', color: '#1A1A1A', padding: '8px 16px', fontSize: '13px' }}
                disabled={!selectedEventId}
              >
                Publish Final Results
              </button>
              <select 
                value={selectedEventId} 
                onChange={(e) => setSelectedEventId(e.target.value)} 
                className="form-input" 
                style={{ width: '250px' }}
              >
                {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
          </div>

          isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {submissions
                .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                .map((sub, idx) => (
                  <div key={sub.id} style={{ 
                    background: idx === 0 ? 'rgba(255, 215, 0, 0.05)' : idx === 1 ? 'rgba(192, 192, 192, 0.05)' : 'white', 
                    border: '1px solid var(--border-light)', 
                    borderRadius: '16px', 
                    padding: '16px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '800', fontSize: '15px', color: idx === 0 ? '#D4AF37' : idx === 1 ? '#9A9A9A' : 'var(--text-light)' }}>
                        {idx + 1 === 1 ? '🥇 1st' : idx + 1 === 2 ? '🥈 2nd' : idx + 1 === 3 ? '🥉 3rd' : `#${idx + 1}`}
                      </span>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                        background: sub.status === 'Shortlisted' ? '#28A745' : 'var(--primary)', color: 'white'
                      }}>
                        {sub.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-light)' }}>Participant:</span>
                      <span style={{ fontWeight: '700', color: 'var(--text)' }}>{sub.autoFilledProfile?.name || sub.userId}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span style={{ color: 'var(--text-light)' }}>Rubric Score:</span>
                      <span style={{ fontWeight: '800', color: 'var(--primary)' }}>{sub.totalScore || 0} / 60</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
                      <button 
                        onClick={() => handleIssueCert(sub)} 
                        className="btn-primary" 
                        style={{ width: '100%', padding: '8px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '36px' }}
                      >
                        <Award size={14} /> Issue Certificate
                      </button>
                    </div>
                  </div>
                ))}
              {submissions.length === 0 && (
                <p className="text-muted" style={{ textAlign: 'center', padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)' }}>No evaluation scores submitted. Evaluate submissions first.</p>
              )}
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Rank</th>
                    <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Participant</th>
                    <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Rubric Score</th>
                    <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px' }}>Status</th>
                    <th style={{ padding: '16px', fontWeight: '700', color: 'var(--text-light)', fontSize: '13px', textAlign: 'right' }}>Certificate Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions
                    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                    .map((sub, idx) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-light)', background: idx === 0 ? 'rgba(255, 215, 0, 0.05)' : idx === 1 ? 'rgba(192, 192, 192, 0.05)' : 'none' }}>
                        <td style={{ padding: '16px', fontWeight: 'bold' }}>
                          {idx + 1 === 1 ? '🥇 1st' : idx + 1 === 2 ? '🥈 2nd' : idx + 1 === 3 ? '🥉 3rd' : `${idx + 1}`}
                        </td>
                        <td style={{ padding: '16px', fontWeight: '600' }}>
                          {sub.autoFilledProfile?.name || sub.userId}
                        </td>
                        <td style={{ padding: '16px', fontWeight: '800', color: 'var(--primary)' }}>
                          {sub.totalScore || 0} / 60
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                            background: sub.status === 'Shortlisted' ? '#28A745' : 'var(--primary)', color: 'white'
                          }}>
                            {sub.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleIssueCert(sub)} 
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Award size={14} /> Issue Certificate
                          </button>
                        </td>
                      </tr>
                    ))}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)' }}>
                        No evaluation scores submitted. Evaluate submissions first.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        </div>
      )}

      {/* Deadline Extension Modal */}
      {showDeadlineModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '16px' : '0' }}>
          <div style={{ background: 'white', padding: isMobile ? '24px' : '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 12px 32px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Extend Registration Deadline</h3>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>New Deadline Date</label>
            <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} className="form-input" style={{ marginBottom: '24px' }} />
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeadlineModal(null)} className="btn-primary" style={{ background: 'white', color: 'var(--text-light)', border: '1px solid var(--border-light)' }}>Cancel</button>
              <button onClick={saveDeadlineExtension} className="btn-primary">Save Extension</button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Simulator Modal */}
      {showScannerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '16px' : '0' }}>
          <style>{`
            @keyframes laserScan {
              0% { top: 10%; }
              50% { top: 90%; }
              100% { top: 10%; }
            }
          `}</style>
          <div style={{ background: 'white', padding: isMobile ? '20px' : '32px', borderRadius: '20px', width: '100%', maxWidth: '460px', boxShadow: '0 12px 36px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={20} color="var(--primary)" /> QR Attendance Scanner Simulator
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '20px' }}>
              Scan participant pass or select from the directory to simulate camera verification.
            </p>

            {/* Simulated Camera Viewfinder */}
            <div style={{
              background: '#1A1A1A',
              height: '160px',
              borderRadius: '12px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #333',
              marginBottom: '20px'
            }}>
              {/* Laser line animation */}
              <div style={{
                position: 'absolute',
                left: '5%',
                right: '5%',
                height: '3px',
                background: '#FF3366',
                boxShadow: '0 0 10px #FF3366, 0 0 20px #FF3366',
                animation: 'laserScan 3s infinite linear'
              }} />
              
              {/* Center target box */}
              <div style={{
                width: '100px',
                height: '100px',
                border: '2px dashed rgba(255, 255, 255, 0.4)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '11px',
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }}>
                [ QR TICKET ]
              </div>
            </div>

            {/* Quick Auto-Selector Dropdown */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                Auto-fill from Approved Attendees:
              </label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const eventCode = selectedEventId.substring(0, 4).toUpperCase();
                    const userCode = val.substring(0, 4).toUpperCase();
                    setScanInputCode(`ORIN-${eventCode}-${userCode}`);
                  }
                }}
                defaultValue=""
                className="form-input"
                style={{ fontSize: '13px' }}
              >
                <option value="" disabled>Select participant to scan...</option>
                {registrations.filter(r => r.status === 'Approved' && !r.checkedIn).map(reg => (
                  <option key={reg.id} value={reg.userId}>
                    {reg.autoFilledProfile?.name || reg.userId} ({reg.userId.substring(0, 6)})
                  </option>
                ))}
                {registrations.filter(r => r.status === 'Approved' && !r.checkedIn).length === 0 && (
                  <option disabled>No approved participants pending check-in</option>
                )}
              </select>
            </div>

            {/* Input field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '6px' }}>
                QR Pass Code String:
              </label>
              <input
                type="text"
                value={scanInputCode}
                onChange={e => setScanInputCode(e.target.value.toUpperCase())}
                placeholder="ORIN-XXXX-YYYY"
                className="form-input"
                style={{ fontFamily: 'monospace', letterSpacing: '1px', textTransform: 'uppercase' }}
              />
            </div>

            {/* Scanner Feedback message */}
            {scannerFeedback && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '20px',
                background: scannerFeedback.startsWith('SUCCESS') ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)',
                color: scannerFeedback.startsWith('SUCCESS') ? '#28A745' : '#DC3545',
                border: '1px solid',
                borderColor: scannerFeedback.startsWith('SUCCESS') ? 'rgba(40,167,69,0.2)' : 'rgba(220,53,69,0.2)'
              }}>
                {scannerFeedback}
              </div>
            )}

            {/* Modal Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowScannerModal(false); setScanInputCode(''); setScannerFeedback(''); }}
                className="btn-primary"
                style={{ background: 'white', color: 'var(--text-light)', border: '1px solid var(--border-light)' }}
              >
                Close Scanner
              </button>
              <button
                onClick={handleVerifyScan}
                className="btn-primary"
              >
                Verify & Check In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plagiarism Code Diff Inspector Modal */}
      {showDiffModal && aiReviewResult?.plagiarismDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'white', width: '95%', maxWidth: '1000px', borderRadius: '20px', display: 'flex', flexDirection: 'column', height: isMobile ? '92vh' : '85vh', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8F9FA' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#1A1A1A' }}>
                  <AlertTriangle color="#FFA116" size={20} /> AI Plagiarism Code Diff Inspector
                </h3>
                <p style={{ fontSize: '12px', color: '#6C757D', marginTop: '2px' }}>
                  Comparing submission with matched public repository source: <a href={`https://${aiReviewResult.plagiarismDetails.sourceUrl}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: '600' }}>{aiReviewResult.plagiarismDetails.sourceUrl}</a>
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ background: aiReviewResult.plagiarismDetails.similarity > 20 ? '#FFF3CD' : '#D1E7DD', color: aiReviewResult.plagiarismDetails.similarity > 20 ? '#856404' : '#0F5132', fontSize: '12px', fontWeight: '800', padding: '6px 12px', borderRadius: '12px' }}>
                  Similarity: {aiReviewResult.plagiarismDetails.similarity}%
                </span>
                <button 
                  onClick={() => setShowDiffModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6C757D', padding: '4px' }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Side-by-Side Diff Panels */}
            <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden', background: '#1E1E1E' }}>
              
              {/* Left Panel: Submitted */}
              <div style={{ flex: 1, borderRight: isMobile ? 'none' : '1px solid #333', borderBottom: isMobile ? '1px solid #333' : 'none', display: 'flex', flexDirection: 'column', height: isMobile ? '50%' : '100%' }}>
                <div style={{ background: '#2D2D2D', padding: '10px 16px', color: '#D4D4D4', fontSize: '12px', fontWeight: '700', borderBottom: '1px solid #333' }}>
                  📂 Submitted File: auth.js
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', fontFamily: '"Fira Code", Monaco, Consolas, monospace', fontSize: '12px', color: '#D4D4D4', lineHeight: '1.6', whiteSpace: 'pre' }}>
                  {aiReviewResult.plagiarismDetails.submittedCode.split('\n').map((line, i) => {
                    const lineNum = i + 1;
                    const isMatchedLine = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13].includes(lineNum);
                    return (
                      <div 
                        key={i} 
                        style={{ 
                          background: isMatchedLine ? 'rgba(255, 161, 22, 0.15)' : 'transparent',
                          borderLeft: isMatchedLine ? '3px solid #FFA116' : '3px solid transparent',
                          padding: '2px 8px',
                          display: 'flex'
                        }}
                      >
                        <span style={{ color: '#5A5A5A', width: '24px', userSelect: 'none', display: 'inline-block' }}>{lineNum}</span>
                        <span style={{ color: isMatchedLine ? '#FFE0B2' : '#D4D4D4' }}>{line}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Panel: Matched Public Source */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: isMobile ? '50%' : '100%' }}>
                <div style={{ background: '#2D2D2D', padding: '10px 16px', color: '#D4D4D4', fontSize: '12px', fontWeight: '700', borderBottom: '1px solid #333' }}>
                  🌐 Matched Template: auth-template.js
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', fontFamily: '"Fira Code", Monaco, Consolas, monospace', fontSize: '12px', color: '#D4D4D4', lineHeight: '1.6', whiteSpace: 'pre' }}>
                  {aiReviewResult.plagiarismDetails.matchedCode.split('\n').map((line, i) => {
                    const lineNum = i + 1;
                    const isMatchedLine = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13].includes(lineNum);
                    return (
                      <div 
                        key={i} 
                        style={{ 
                          background: isMatchedLine ? 'rgba(255, 161, 22, 0.15)' : 'transparent',
                          borderLeft: isMatchedLine ? '3px solid #FFA116' : '3px solid transparent',
                          padding: '2px 8px',
                          display: 'flex'
                        }}
                      >
                        <span style={{ color: '#5A5A5A', width: '24px', userSelect: 'none', display: 'inline-block' }}>{lineNum}</span>
                        <span style={{ color: isMatchedLine ? '#FFE0B2' : '#D4D4D4' }}>{line}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', background: '#F8F9FA' }}>
              <button 
                onClick={() => setShowDiffModal(false)}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
