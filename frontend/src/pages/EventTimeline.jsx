import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  AlertCircle, 
  Award, 
  PlayCircle, 
  Lock, 
  Calendar, 
  FileText, 
  ChevronRight,
  Clock,
  BookOpen,
  Terminal,
  Code2,
  CheckSquare,
  Sparkles,
  Loader2,
  QrCode
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getEvent, getEventRegistration, getUserCertificateForEvent, getAssessment, submitAssessment, updateUserProfile } from '../firebase/firestore';
import SubmissionManager from '../components/SubmissionManager';

export default function EventTimeline() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [event, setEvent] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [assessment, setAssessment] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Assessment Workspace States
  const [showWorkspace, setShowWorkspace] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState('JavaScript');
  const [editorCode, setEditorCode] = useState('// Write a function to check if a number is prime\nfunction isPrime(num) {\n  \n}');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [isSubmittingAssess, setIsSubmittingAssess] = useState(false);

  // Assessment Timer Effect
  useEffect(() => {
    if (!showWorkspace) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [showWorkspace, timeLeft]);

  // Load Timeline Data
  useEffect(() => {
    if (!currentUser || !eventId) return;
    const fetchData = async () => {
      try {
        const eventData = await getEvent(eventId);
        setEvent(eventData);

        const regData = await getEventRegistration(eventId, currentUser.uid);
        setRegistration(regData);

        const certData = await getUserCertificateForEvent(eventId, currentUser.uid);
        setCertificate(certData);

        const assessData = await getAssessment(eventId, currentUser.uid);
        setAssessment(assessData);
      } catch (err) {
        console.error("Error loading timeline data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId, currentUser, refreshKey]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6C757D' }}>Loading Event Timeline...</div>;
  }

  if (!event) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#6C757D' }}>Event not found.</div>;
  }

  const currentRoundIndex = event.currentRoundIndex || 0;
  const rounds = event.rounds || [
    'Registration', 'Screening', 'Assessment', 'Submission', 'Review', 'Shortlisting', 'Final', 'Results', 'Certification'
  ];

  const MCQ_QUESTIONS = [
    {
      id: 1,
      q: "What is the time complexity of searching in a balanced Binary Search Tree (BST)?",
      options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
      correct: "O(log N)"
    },
    {
      id: 2,
      q: "Which Firebase database service offers native offline support and complex nested array updates?",
      options: ["Realtime Database", "Cloud Storage", "Cloud Firestore", "Authentication"],
      correct: "Cloud Firestore"
    },
    {
      id: 3,
      q: "Which React hook is designed specifically for side-effect data fetching on mount?",
      options: ["useState", "useEffect", "useMemo", "useContext"],
      correct: "useEffect"
    }
  ];

  const runCodeTests = () => {
    setIsRunningTests(true);
    setTestResult('Running compilation...');
    setTimeout(() => {
      setTestResult('Test case 1 passed: isPrime(7) === true\nTest case 2 passed: isPrime(4) === false\nAll simulated tests successfully executed.');
      setIsRunningTests(false);
    }, 1500);
  };

  const handleAutoSubmit = () => {
    alert("Time has expired! Submitting your workspace answers automatically.");
    submitWorkspaceAnswers();
  };

  const submitWorkspaceAnswers = async () => {
    setIsSubmittingAssess(true);
    try {
      let correct = 0;
      let wrong = 0;
      
      MCQ_QUESTIONS.forEach(q => {
        const selected = selectedAnswers[q.id];
        if (selected) {
          if (selected === q.correct) {
            correct += 1;
          } else {
            wrong += 1;
          }
        }
      });

      // Calculate score (+4 correct, -1 wrong)
      const mcqScore = (correct * 4) - (wrong * 1);
      
      const payload = {
        mcqScore,
        correctAnswersCount: correct,
        wrongAnswersCount: wrong,
        editorCode,
        selectedLanguage,
        totalMcqQuestions: MCQ_QUESTIONS.length,
        submittedAt: new Date().toISOString()
      };

      await submitAssessment(eventId, currentUser.uid, payload);
      try {
        await updateUserProfile(currentUser.uid, { assessmentCompleted: true });
      } catch (err) {
        console.error("Non-fatal profile update error:", err);
      }
      alert('Assessment submitted successfully!');
      setAssessment(payload);
      setShowWorkspace(false);
      setRefreshKey(k => k + 1);
    } catch (err) {
      console.error(err);
      alert('Failed to submit assessment.');
    } finally {
      setIsSubmittingAssess(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 40px', color: '#1A1A1A' }}>
      
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0 16px' }}>
        <button 
          onClick={() => navigate(`/event/${eventId}`)} 
          style={{ background: 'none', border: 'none', color: '#6C757D', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: '500' }}
        >
          <ArrowLeft size={18} /> Back to Event Details
        </button>
      </div>

      {/* Header Banner */}
      <div style={{ 
        background: 'linear-gradient(135deg, #7B61FF, #9D85FF)', 
        borderRadius: '24px', 
        padding: '32px', 
        color: 'white',
        marginBottom: '32px',
        boxShadow: '0 10px 24px rgba(123,97,255,0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          Competition Journey
        </span>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginTop: '12px', marginBottom: '8px' }}>{event.title}</h1>
        <p style={{ opacity: 0.9, fontSize: '14px' }}>
          Current Phase: <strong>{rounds[currentRoundIndex]}</strong>
        </p>
      </div>

      {/* Grid: Timeline Left, Context Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
        
        {/* Left Column: Timeline Stepper */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-light)', padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '24px' }}>Lifecycle Stages</h2>
          
          <div style={{ position: 'relative', paddingLeft: '20px' }}>
            {/* Vertical Line */}
            <div style={{ position: 'absolute', top: '8px', bottom: '8px', left: '6px', width: '2px', background: '#E9ECEF' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {rounds.map((round, idx) => {
                const isCompleted = idx < currentRoundIndex;
                const isActive = idx === currentRoundIndex;

                let dotColor = '#E9ECEF';
                let textColor = '#6C757D';
                let icon = null;

                if (isCompleted) {
                  dotColor = '#28A745';
                  textColor = '#28A745';
                  icon = <Check size={10} color="white" strokeWidth={4} />;
                } else if (isActive) {
                  dotColor = 'var(--primary)';
                  textColor = 'var(--primary)';
                }

                return (
                  <div key={idx} style={{ position: 'relative', paddingLeft: '24px', display: 'flex', flexDirection: 'column' }}>
                    {/* Dot */}
                    <div style={{ 
                      position: 'absolute', 
                      left: '-20px', 
                      top: '4px', 
                      width: '14px', 
                      height: '14px', 
                      borderRadius: '50%', 
                      background: dotColor, 
                      border: '2px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isActive ? '0 0 0 4px rgba(123,97,255,0.2)' : 'none',
                    }}>
                      {icon}
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: isActive ? '800' : '600', color: textColor }}>
                      {round}
                    </div>
                    
                    {isActive && (
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                        Active competition stage. See details to the right.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Action details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Registration Status Info Card */}
          <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-light)', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Your Status</h3>
            {registration ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '12px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>Approval Status</span>
                  <span style={{ 
                    fontSize: '12px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '8px',
                    background: registration.status === 'Approved' ? 'rgba(40,167,69,0.1)' : 'rgba(255,161,22,0.1)',
                    color: registration.status === 'Approved' ? '#28A745' : '#FFA116'
                  }}>{registration.status}</span>
                </div>
                
                {registration.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: '8px', color: '#856404', background: '#FFF3CD', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <span>Your application is currently being screened by organizers. Check back soon.</span>
                  </div>
                )}

                {registration.status === 'Approved' && (
                  <div style={{ display: 'flex', gap: '8px', color: '#155724', background: '#D4EDDA', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                    <Check size={18} style={{ flexShrink: 0 }} />
                    <span>Congratulations! You are officially cleared to compete.</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px' }}>You have not registered for this event yet.</p>
                <button 
                  onClick={() => navigate(`/event/${eventId}`)} 
                  className="btn-primary" 
                  style={{ width: '100%' }}
                >
                  Register Now
                </button>
              </div>
            )}
          </div>

          {/* Offline Pass QR Check-in */}
          {registration?.status === 'Approved' && (event.mode === 'Offline' || event.mode === 'Hybrid') && (
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-light)', padding: '24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <QrCode size={18} color="var(--primary)" /> Digital Check-In Pass
              </h3>
              
              <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-light)', display: 'inline-block', marginBottom: '16px' }}>
                {/* Styled barcode check pass */}
                <div style={{ padding: '12px', background: 'white', border: '2px solid #1A1A1A', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '120px', height: '120px', background: '#F8F9FA', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #6C757D' }}>
                    <span style={{ fontSize: '10px', color: '#6C757D', fontWeight: 'bold' }}>ORIN VERIFIED PASS</span>
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px', marginTop: '8px', color: '#1A1A1A' }}>
                    ORIN-{eventId.substring(0, 4).toUpperCase()}-{currentUser.uid.substring(0, 4).toUpperCase()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: registration.checkedIn ? 'rgba(40,167,69,0.08)' : 'rgba(255,161,22,0.08)', borderRadius: '10px', border: '1px solid', borderColor: registration.checkedIn ? 'rgba(40,167,69,0.2)' : 'rgba(255,161,22,0.2)', fontSize: '13px' }}>
                <span style={{ fontWeight: '600' }}>Attendance Status</span>
                <span style={{ fontWeight: '800', color: registration.checkedIn ? '#28A745' : '#FFA116' }}>
                  {registration.checkedIn ? '✓ Checked In' : 'Pending Check-In'}
                </span>
              </div>
            </div>
          )}

          {/* Timed Assessment Engine Section */}
          {registration?.status === 'Approved' && rounds[currentRoundIndex] === 'Assessment' && (
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-light)', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} color="var(--primary)" /> Timed Screening Assessment
              </h3>

              {assessment ? (
                <div style={{ background: 'rgba(40,167,69,0.04)', border: '1px solid rgba(40,167,69,0.2)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                  <CheckCircle size={32} color="#28A745" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ fontWeight: '700', fontSize: '14px', color: '#28A745' }}>Assessment Logged</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '6px' }}>
                    Your screening score has been recorded.
                  </p>
                  <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: '800', color: 'var(--primary)' }}>
                    MCQ Score: {assessment.mcqScore} / 12 points
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: '1.6', marginBottom: '16px' }}>
                    Complete the timed screening questions to unlock the next stages. Assessment contains MCQs (negative marking active) and a code editor.
                  </p>
                  <button 
                    onClick={() => setShowWorkspace(true)} 
                    className="btn-primary" 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <PlayCircle size={18} /> Launch Assessment Workspace
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Submission Gate */}
          {registration?.status === 'Approved' && rounds[currentRoundIndex] === 'Submission' && (
            <SubmissionManager 
              eventId={eventId} 
              onComplete={() => setRefreshKey(k => k + 1)} 
            />
          )}

          {/* Future Stage Indicator */}
          {registration?.status === 'Approved' && currentRoundIndex < 2 && (
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid var(--border-light)', padding: '24px', textAlign: 'center' }}>
              <Lock size={28} color="#6C757D" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>Assessment & Submission Locked</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                The competitive portal unlocks after screening approvals.
              </p>
            </div>
          )}

          {/* Certificate Claim */}
          {certificate && (
            <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #FFD700', padding: '24px', textAlign: 'center' }}>
              <Award size={32} color="#FFD700" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontWeight: '800', fontSize: '15px', marginBottom: '8px' }}>Verified Certificate Issued!</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '16px' }}>
                Orin verified credential has been successfully minted for your profile.
              </p>
              <button 
                onClick={() => navigate(`/verify/${certificate.certId || certificate.id}`)}
                className="btn-primary" 
                style={{ background: '#FFD700', color: '#1A1A1A', width: '100%', fontWeight: '700' }}
              >
                View Credential Page
              </button>
            </div>
          )}

        </div>

      </div>

      {/* TIMED ASSESSMENT WORKSPACE FULL MODAL */}
      {showWorkspace && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--background)', zIndex: 10005, display: 'flex', flexDirection: 'column' }}>
          
          {/* Top Timer Bar */}
          <div style={{ height: '70px', background: 'white', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen color="var(--primary)" size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Assessment Workspace</h3>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: timeLeft < 60 ? '#FFF0F0' : 'rgba(123,97,255,0.08)', borderRadius: '20px', border: '1.5px solid', borderColor: timeLeft < 60 ? '#FFD0D0' : 'var(--primary)' }}>
              <Clock size={16} color={timeLeft < 60 ? '#DC3545' : 'var(--primary)'} />
              <strong style={{ fontSize: '15px', fontFamily: 'monospace', color: timeLeft < 60 ? '#DC3545' : 'var(--primary)' }}>
                {formatTime(timeLeft)}
              </strong>
            </div>

            <button 
              onClick={() => { if (window.confirm("Quit assessment? All active inputs will be lost.")) setShowWorkspace(false); }}
              className="btn-primary" 
              style={{ background: 'white', color: 'var(--text-light)', border: '1px solid var(--border-light)', padding: '6px 16px', fontSize: '13px' }}
            >
              Quit Test
            </button>
          </div>

          {/* Split Screen Workspace Panel */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* Left Side: MCQ Section */}
            <div style={{ width: '50%', borderRight: '1px solid var(--border-light)', overflowY: 'auto', padding: '32px', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare size={16} color="var(--primary)" /> MCQ Question Set
                </h4>
                <span style={{ fontSize: '11px', background: '#FFF3CD', color: '#856404', padding: '4px 8px', borderRadius: '6px', fontWeight: '700' }}>
                  ⚠️ Correct: +4 | Wrong: -1 points
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {MCQ_QUESTIONS.map((q, idx) => (
                  <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', lineHeight: '1.5' }}>
                      {idx + 1}. {q.q}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      {q.options.map(opt => {
                        const isSelected = selectedAnswers[q.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              border: '1.5px solid',
                              borderColor: isSelected ? 'var(--primary)' : 'var(--border-light)',
                              background: isSelected ? 'rgba(123, 97, 255, 0.04)' : 'var(--surface)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '13px',
                              fontWeight: isSelected ? '700' : '500',
                              transition: 'all 0.1s'
                            }}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: Coding Simulator Workspace */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#282C34', color: '#ABB2BF', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontWeight: '800', fontSize: '14px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Code2 size={16} /> Code Editor Sandbox
                </h4>
                
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  style={{ background: '#21252B', border: '1px solid #4C525D', color: '#ABB2BF', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', outline: 'none' }}
                >
                  <option>JavaScript</option>
                  <option>Python</option>
                  <option>Java</option>
                </select>
              </div>

              {/* Text editor mock */}
              <textarea 
                value={editorCode}
                onChange={e => setEditorCode(e.target.value)}
                style={{ flex: 1, background: '#21252B', border: '1px solid #3E4451', borderRadius: '12px', color: '#98C379', fontFamily: 'monospace', padding: '16px', fontSize: '13px', resize: 'none', outline: 'none', lineHeight: '1.6' }}
              />

              {/* Test Cases Output */}
              <div style={{ height: '120px', background: '#1E222B', border: '1px solid #3E4451', borderRadius: '12px', marginTop: '16px', padding: '12px', fontFamily: 'monospace', fontSize: '12px', overflowY: 'auto' }}>
                <div style={{ color: '#E5C07B', fontWeight: '700', marginBottom: '6px' }}>Sandbox Console:</div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#61AFEF' }}>
                  {testResult || 'Ready to run compiler tests...'}
                </pre>
              </div>

              {/* Code Panel Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button 
                  onClick={runCodeTests}
                  disabled={isRunningTests}
                  className="btn-primary" 
                  style={{ background: '#3E4451', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  {isRunningTests ? <Loader2 size={14} className="animate-spin" /> : <Terminal size={14} />} 
                  {isRunningTests ? 'Compiling tests...' : 'Run Test Cases'}
                </button>

                <button 
                  onClick={() => { if (window.confirm("Are you ready to submit your screening assessment?")) submitWorkspaceAnswers(); }}
                  disabled={isSubmittingAssess}
                  className="btn-primary" 
                  style={{ background: '#28A745', border: 'none', padding: '10px 24px', fontWeight: '800', fontSize: '13px' }}
                >
                  {isSubmittingAssess ? 'Logging results...' : 'Submit Assessment'}
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
