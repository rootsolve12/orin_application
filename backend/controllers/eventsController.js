// controllers/eventsController.js
const emailService = require('../services/emailService');

const DEFAULT_ROUNDS = [
  'Registration', 'Screening', 'Assessment', 'Submission', 
  'Presentation', 'Interview', 'Final Results'
];

let eventsDb = [
  {
    id: 'e1',
    title: 'Global Hack 2026',
    category: 'Hackathons',
    date: '2026-08-15T10:00:00Z',
    location: 'SRM University',
    mode: 'Offline',
    registeredCount: 450,
    maxCapacity: 500,
    isTrending: true,
    isRecommended: true,
    image: 'https://via.placeholder.com/600x300/7B61FF/FFFFFF?text=Global+Hack+2026',
    organizerQuestions: ['What is your T-Shirt size?', 'Any dietary restrictions?'],
    organizerId: 'other_user',
    status: 'Published',
    currentRoundIndex: 0,
    rounds: DEFAULT_ROUNDS
  },
  {
    id: 'e2',
    title: 'Intro to Quantum Computing',
    category: 'Webinars',
    date: '2026-09-01T14:00:00Z',
    location: 'Virtual',
    mode: 'Online',
    registeredCount: 1200,
    maxCapacity: 5000,
    isTrending: false,
    isRecommended: true,
    image: 'https://via.placeholder.com/600x300/FF6B6B/FFFFFF?text=Quantum+Computing',
    organizerQuestions: [],
    organizerId: 'other_user',
    status: 'Published',
    currentRoundIndex: 0,
    rounds: DEFAULT_ROUNDS
  },
  {
    id: 'e3',
    title: 'AI Innovation Challenge',
    category: 'Innovation Challenges',
    date: '2026-10-10T09:00:00Z',
    location: 'Bangalore Tech Park',
    mode: 'Offline',
    registeredCount: 89,
    maxCapacity: 100,
    isTrending: true,
    isRecommended: false,
    image: 'https://via.placeholder.com/600x300/20C997/FFFFFF?text=AI+Innovation',
    organizerQuestions: ['GitHub Profile URL for team check?'],
    organizerId: 'user_123',
    status: 'Published',
    currentRoundIndex: 0,
    rounds: DEFAULT_ROUNDS
  },
  {
    id: 'e4',
    title: 'AlgoRhythm Coding Comp',
    category: 'Coding Competitions',
    date: '2026-07-20T18:00:00Z',
    location: 'Virtual',
    mode: 'Online',
    registeredCount: 300,
    maxCapacity: 300,
    isTrending: true,
    isRecommended: true,
    image: 'https://via.placeholder.com/600x300/FD7E14/FFFFFF?text=AlgoRhythm',
    organizerQuestions: ['Preferred programming language?'],
    organizerId: 'user_123',
    status: 'Published',
    currentRoundIndex: 2, // e.g. Currently in Assessment Round
    rounds: DEFAULT_ROUNDS
  }
];

let registrationsDb = [];
let submissionsDb = [];

exports.getEvents = (req, res) => {
  // Only return published events for the explore feed
  const published = eventsDb.filter(e => e.status !== 'Draft' && e.status !== 'Archived');
  res.json({ success: true, data: published });
};

exports.getEventById = (req, res) => {
  const event = eventsDb.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({ success: true, data: event });
};

// Organizer Endpoints
exports.getOrganizerStats = (req, res) => {
  const { userId } = req.query; // in real app, from auth token
  const myEvents = eventsDb.filter(e => e.organizerId === 'user_123'); // hardcoded for demo
  
  let totalRegs = 0;
  myEvents.forEach(e => totalRegs += e.registeredCount);

  res.json({
    success: true,
    data: {
      totalEvents: myEvents.length,
      activeEvents: myEvents.filter(e => e.status === 'Published').length,
      totalRegistrations: totalRegs,
      pendingApprovals: 42, // Mocked pending
      attendance: Math.floor(totalRegs * 0.8), // 80% attendance rate mock
      submissions: 156,
      certificatesGenerated: 89,
      eventsList: myEvents
    }
  });
};

exports.createEvent = (req, res) => {
  const payload = req.body;
  const newEvent = {
    id: `ev_${Date.now()}`,
    ...payload,
    organizerId: 'user_123', // Hardcoded for demo
    registeredCount: 0,
    image: payload.image || 'https://via.placeholder.com/600x300/7B61FF/FFFFFF?text=New+Event',
    currentRoundIndex: 0,
    rounds: DEFAULT_ROUNDS
  };
  eventsDb.push(newEvent);
  
  res.json({
    success: true,
    message: payload.status === 'Draft' ? 'Draft Saved Successfully' : 'Event Published!',
    data: newEvent
  });
};

exports.advanceRound = (req, res) => {
  const event = eventsDb.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  
  if (event.currentRoundIndex < event.rounds.length - 1) {
    event.currentRoundIndex += 1;
    res.json({ success: true, message: `Advanced to ${event.rounds[event.currentRoundIndex]}` });
  } else {
    res.json({ success: false, message: 'Event is already in the final round' });
  }
};

// Intelligent Registration System
exports.registerForEvent = (req, res) => {
  const { eventId } = req.params;
  const { userId, customAnswers, autoFilledProfile } = req.body;

  const event = eventsDb.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  // Determine status (Waitlisted if full)
  let status = 'Approved';
  if (event.registeredCount >= event.maxCapacity) {
    status = 'Waitlisted';
  } else {
    event.registeredCount += 1; // Increment count
  }

  const registrationRecord = {
    id: `reg_${Date.now()}`,
    eventId,
    userId,
    status,
    timestamp: new Date().toISOString(),
    customAnswers,
    // Store snapshot of the auto-filled profile for the organizer
    participantSnapshot: {
      name: autoFilledProfile.name,
      institution: autoFilledProfile.institution,
      department: autoFilledProfile.department,
      academicYear: autoFilledProfile.academicYear,
      skills: autoFilledProfile.skills,
      resumeUrl: autoFilledProfile.resumeUrl,
      links: autoFilledProfile.links
    }
  };

  registrationsDb.push(registrationRecord);

  // Trigger Registration Email Notification
  emailService.sendRegistrationConfirmation('participant@example.com', event.title);

  res.json({
    success: true,
    message: status === 'Waitlisted' ? 'Added to Waitlist' : 'Registration Successful',
    data: registrationRecord
  });
};

exports.getUserRegistrations = (req, res) => {
  const { userId } = req.params;
  const userRegs = registrationsDb.filter(r => r.userId === userId);
  
  // Attach event details
  const populated = userRegs.map(reg => {
    const eventDetails = eventsDb.find(e => e.id === reg.eventId);
    return { ...reg, event: eventDetails };
  });

  res.json({ success: true, data: populated });
};

// ==========================================
// COMPETITION EXECUTION ENGINE
// ==========================================

exports.submitAssessment = (req, res) => {
  const { id } = req.params;
  const { userId, score } = req.body;
  // Mock assessment logic
  res.json({ success: true, message: `Assessment Completed. Score: ${score}` });
};

exports.submitProject = (req, res) => {
  const { id } = req.params;
  const { userId, links, isFinalLock } = req.body;
  
  const newSubmission = {
    id: `sub_${Date.now()}`,
    eventId: id,
    userId,
    links, // array of { type: 'GitHub', url: '...' }
    isFinalLock,
    version: 1,
    status: 'Pending Review',
    timestamp: new Date().toISOString()
  };
  
  submissionsDb.push(newSubmission);
  
  res.json({ 
    success: true, 
    message: isFinalLock ? 'Project Locked and Submitted' : 'Draft Saved Successfully',
    data: newSubmission
  });
};

exports.getEventSubmissions = (req, res) => {
  const { id } = req.params;
  // Get all submissions for this event (used by Organizer Dashboard)
  const eventSubs = submissionsDb.filter(s => s.eventId === id);
  res.json({ success: true, data: eventSubs });
};

exports.evaluateSubmission = (req, res) => {
  const { id, submissionId } = req.params;
  const { rubricScores, feedback, isShortlisted } = req.body;
  
  const submission = submissionsDb.find(s => s.id === submissionId);
  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
  
  submission.status = isShortlisted ? 'Shortlisted' : 'Evaluated';
  submission.rubricScores = rubricScores;
  submission.feedback = feedback;
  
  // Trigger Qualification Alert if shortlisted
  if (isShortlisted) {
    const event = eventsDb.find(e => e.id === id);
    if (event) emailService.sendQualificationAlert('participant@example.com', event.title);
  }
  
  res.json({ success: true, message: 'Evaluation Saved Successfully', data: submission });
};
