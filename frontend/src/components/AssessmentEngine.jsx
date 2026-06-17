import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateRegistrationStatus } from '../firebase/firestore';

export default function AssessmentEngine({ eventId, onComplete }) {
  const { currentUser } = useAuth();
  const [timeLeft, setTimeLeft] = useState(60 * 15); // 15 minutes
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Mock calculate score based on answers length
    const score = Object.keys(answers).length * 10;
    try {
      await updateRegistrationStatus(eventId, currentUser.uid, `Assessment Scored: ${score}`);
      onComplete('Assessment Submitted Successfully. You scored: ' + score);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '32px', textAlign: 'left' }}>
      
      {/* Sticky Header with Timer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
        <h2 className="heading-2">Assessment Round</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: timeLeft < 60 ? '#FFEBEE' : 'rgba(123, 97, 255, 0.1)', color: timeLeft < 60 ? '#DC3545' : 'var(--primary)', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold' }}>
          <Clock size={20} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div style={{ background: '#FFF3CD', color: '#856404', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <AlertTriangle size={20} />
        <div>
          <strong>Warning: Negative Marking is Active.</strong>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>You will lose 1 point for every incorrect multiple choice answer. Do not refresh this page.</div>
        </div>
      </div>

      {/* Mock Question 1: MCQ */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>1. Which of the following data structures is most suitable for a priority queue?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {['Linked List', 'Binary Search Tree', 'Heap', 'Array'].map((opt, i) => (
            <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid var(--border-light)', borderRadius: '8px', cursor: 'pointer' }}>
              <input type="radio" name="q1" value={opt} onChange={() => setAnswers({...answers, q1: opt})} />
              {opt}
            </label>
          ))}
        </div>
      </div>

      {/* Mock Question 2: Coding */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>2. Write a function to reverse a linked list. (Pseudocode or any language)</h3>
        <textarea 
          placeholder="def reverse_list(head):..."
          style={{ width: '100%', height: '150px', background: '#1E1E1E', color: '#D4D4D4', fontFamily: 'monospace', padding: '16px', borderRadius: '8px', border: 'none' }}
          onChange={(e) => setAnswers({...answers, q2: e.target.value})}
        />
      </div>

      <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary" style={{ width: '100%', padding: '16px', fontSize: '18px' }}>
        {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
      </button>

    </div>
  );
}
