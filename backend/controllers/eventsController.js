const emailService = require('../services/emailService');
const { sanitize, sanitizeObject, isValidUrl, isValidISODate, isInternalUrl, isPositiveInt, isValidScore, generateId } = require('../middleware/validate');
const { logSecurityEvent, EVENT_TYPES } = require('../middleware/logger');

const isOwner = (req, targetUserId) => {
  if (!req.user) return false;
  return req.user.id === targetUserId;
};

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
    organizerId: 'user_002',
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
    organizerId: 'user_002',
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
    organizerId: 'user_001',
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
    organizerId: 'user_001',
    status: 'Published',
    currentRoundIndex: 2,
    rounds: DEFAULT_ROUNDS
  }
];

let registrationsDb = [];
let submissionsDb = [];

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================
exports.getEvents = (req, res) => {
  const published = eventsDb.filter(e => e.status !== 'Draft' && e.status !== 'Archived');
  
  // Pagination
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const startIdx = (page - 1) * limit;
  const paginated = published.slice(startIdx, startIdx + limit);

  // Data minimization — don't expose organizerId in public listing
  const sanitized = paginated.map(({ organizerId, ...rest }) => rest);
  
  res.json({ 
    success: true, 
    data: sanitized,
    pagination: {
      page,
      limit,
      total: published.length,
      totalPages: Math.ceil(published.length / limit)
    }
  });
};

exports.getEventById = (req, res) => {
  const event = eventsDb.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  
  // Data minimization for public view
  const { organizerId, ...publicEvent } = event;
  res.json({ success: true, data: publicEvent });
};

// ==========================================
// ORGANIZER ENDPOINTS
// ==========================================
exports.getOrganizerStats = (req, res) => {
  const userId = req.user.id;
  const myEvents = eventsDb.filter(e => e.organizerId === userId);
  
  let totalRegs = 0;
  myEvents.forEach(e => totalRegs += e.registeredCount);

  res.json({
    success: true,
    data: {
      totalEvents: myEvents.length,
      activeEvents: myEvents.filter(e => e.status === 'Published').length,
      totalRegistrations: totalRegs,
      pendingApprovals: 42,
      attendance: Math.floor(totalRegs * 0.8),
      submissions: 156,
      certificatesGenerated: 89,
      eventsList: myEvents
    }
  });
};

exports.createEvent = (req, res) => {
  const payload = req.body;

  // ==========================================
  // INPUT VALIDATION
  // ==========================================
  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim() === '') {
    return res.status(400).json({ success: false, message: 'Event title is required' });
  }

  if (payload.title.length > 200) {
    return res.status(400).json({ success: false, message: 'Title is too long (max 200 chars)' });
  }

  if (payload.date && !isValidISODate(payload.date)) {
    return res.status(400).json({ success: false, message: 'Invalid date format. Use ISO 8601.' });
  }

  if (payload.maxCapacity !== undefined) {
    if (!isPositiveInt(payload.maxCapacity)) {
      return res.status(400).json({ success: false, message: 'maxCapacity must be a positive integer' });
    }
  }

  if (payload.image && !isValidUrl(payload.image)) {
    return res.status(400).json({ success: false, message: 'Invalid image URL' });
  }

  if (payload.image && isInternalUrl(payload.image)) {
    return res.status(400).json({ success: false, message: 'Internal URLs are not allowed' });
  }

  // Only allow valid statuses
  const validStatuses = ['Draft', 'Published'];
  const status = validStatuses.includes(payload.status) ? payload.status : 'Draft';

  // Sanitize all string inputs and build event with WHITELISTED fields only
  const newEvent = {
    id: generateId('ev_'),
    title: sanitize(payload.title),
    category: sanitize(payload.category || 'General'),
    date: payload.date || new Date().toISOString(),
    location: sanitize(payload.location || 'TBD'),
    mode: ['Online', 'Offline', 'Hybrid'].includes(payload.mode) ? payload.mode : 'Online',
    registeredCount: 0, // Always starts at 0, cannot be injected
    maxCapacity: payload.maxCapacity || 100,
    isTrending: false,
    isRecommended: false,
    image: payload.image || 'https://via.placeholder.com/600x300/7B61FF/FFFFFF?text=New+Event',
    organizerQuestions: Array.isArray(payload.organizerQuestions)
      ? payload.organizerQuestions.map(q => sanitize(String(q))).slice(0, 20)
      : [],
    organizerId: req.user.id, // Always from authenticated user, cannot be injected
    status,
    currentRoundIndex: 0,
    rounds: DEFAULT_ROUNDS
  };

  eventsDb.push(newEvent);

  logSecurityEvent(EVENT_TYPES.ADMIN_ACTION, {
    userId: req.user.id,
    resource: `Event ${newEvent.id}`,
    message: `Event created: "${newEvent.title}" with status ${status}`,
    severity: 'INFO'
  });
  
  res.json({
    success: true,
    message: status === 'Draft' ? 'Draft Saved Successfully' : 'Event Published!',
    data: newEvent
  });
};


exports.advanceRound = (req, res) => {
  const event = eventsDb.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
  
  // Verify organizer role
  if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
    logSecurityEvent(EVENT_TYPES.FORBIDDEN_ACCESS, {
      userId: req.user.id,
      resource: `Event ${event.id}`,
      message: 'Attempted to advance round without permission',
      severity: 'HIGH'
    });
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  if (event.currentRoundIndex < event.rounds.length - 1) {
    event.currentRoundIndex += 1;

    logSecurityEvent(EVENT_TYPES.ADMIN_ACTION, {
      userId: req.user.id,
      resource: `Event ${event.id}`,
      message: `Round advanced to ${event.rounds[event.currentRoundIndex]}`,
      severity: 'INFO'
    });

    res.json({ success: true, message: `Advanced to ${event.rounds[event.currentRoundIndex]}` });
  } else {
    res.json({ success: false, message: 'Event is already in the final round' });
  }
};

// ==========================================
// REGISTRATION
// ==========================================
exports.registerForEvent = (req, res) => {
  const { eventId } = req.params;
  const { userId, customAnswers, autoFilledProfile } = req.body;

  // Input validation
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }

  // Verify ownership to prevent IDOR
  if (!isOwner(req, userId) && req.user.role !== 'admin') {
    logSecurityEvent(EVENT_TYPES.IDOR_ATTEMPT, {
      ip: req.ip,
      userId: req.user.id,
      resource: `Registration for event ${eventId}`,
      message: `Attempted to register as userId: ${userId}`,
      severity: 'HIGH'
    });
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const event = eventsDb.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  // Duplicate registration check
  const existingReg = registrationsDb.find(r => r.eventId === eventId && r.userId === userId);
  if (existingReg) {
    return res.status(409).json({ success: false, message: 'Already registered for this event' });
  }

  // Determine status (Waitlisted if full)
  let status = 'Approved';
  if (event.registeredCount >= event.maxCapacity) {
    status = 'Waitlisted';
  } else {
    event.registeredCount += 1;
  }

  // Safely extract auto-filled profile with defaults
  const profile = autoFilledProfile || {};
  const registrationRecord = {
    id: generateId('reg_'),
    eventId,
    userId,
    status,
    timestamp: new Date().toISOString(),
    customAnswers: Array.isArray(customAnswers)
      ? customAnswers.map(a => sanitize(String(a)))
      : [],
    participantSnapshot: {
      name: sanitize(profile.name || ''),
      institution: sanitize(profile.institution || ''),
      department: sanitize(profile.department || ''),
      academicYear: sanitize(profile.academicYear || ''),
      skills: Array.isArray(profile.skills) ? profile.skills.map(s => sanitize(String(s))) : [],
      resumeUrl: profile.resumeUrl && isValidUrl(profile.resumeUrl) ? profile.resumeUrl : null,
      links: sanitizeObject(profile.links || {})
    }
  };

  registrationsDb.push(registrationRecord);

  logSecurityEvent(EVENT_TYPES.REGISTRATION, {
    userId,
    resource: `Event ${eventId}`,
    message: `Registration ${status}`,
    severity: 'INFO'
  });

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

  // Verify ownership to prevent IDOR
  if (!isOwner(req, userId) && req.user.role !== 'organizer' && req.user.role !== 'admin') {
    logSecurityEvent(EVENT_TYPES.IDOR_ATTEMPT, {
      userId: req.user.id,
      resource: `Registrations for user ${userId}`,
      message: 'IDOR attempt on user registrations',
      severity: 'HIGH'
    });
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const userRegs = registrationsDb.filter(r => r.userId === userId);
  
  // Pagination
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const startIdx = (page - 1) * limit;
  const paginated = userRegs.slice(startIdx, startIdx + limit);

  // Attach event details
  const populated = paginated.map(reg => {
    const eventDetails = eventsDb.find(e => e.id === reg.eventId);
    return { ...reg, event: eventDetails };
  });

  res.json({ 
    success: true, 
    data: populated,
    pagination: { page, limit, total: userRegs.length, totalPages: Math.ceil(userRegs.length / limit) }
  });
};

// ==========================================
// COMPETITION EXECUTION ENGINE
// ==========================================

exports.submitAssessment = (req, res) => {
  const { id } = req.params;
  const { userId, score } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }

  if (score === undefined || score === null || !isValidScore(score)) {
    return res.status(400).json({ success: false, message: 'Score must be a number between 0 and 100' });
  }

  // Verify ownership to prevent IDOR
  if (!isOwner(req, userId) && req.user.role !== 'admin') {
    logSecurityEvent(EVENT_TYPES.IDOR_ATTEMPT, {
      userId: req.user.id,
      resource: `Assessment for event ${id}`,
      message: `IDOR attempt: tried to submit as ${userId}`,
      severity: 'HIGH'
    });
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  res.json({ success: true, message: `Assessment Completed. Score: ${score}` });
};

exports.submitProject = (req, res) => {
  const { id } = req.params;
  const { userId, links, isFinalLock } = req.body;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }

  // Verify ownership to prevent IDOR
  if (!isOwner(req, userId) && req.user.role !== 'admin') {
    logSecurityEvent(EVENT_TYPES.IDOR_ATTEMPT, {
      userId: req.user.id,
      resource: `Project submission for event ${id}`,
      message: `IDOR attempt: tried to submit as ${userId}`,
      severity: 'HIGH'
    });
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  // Check for locked submission
  const existingSub = submissionsDb.find(s => s.eventId === id && s.userId === userId && s.isFinalLock);
  if (existingSub) {
    return res.status(400).json({ success: false, message: 'Submission is already locked and cannot be modified' });
  }

  // Validate and sanitize links
  const validatedLinks = [];
  if (Array.isArray(links)) {
    for (const link of links.slice(0, 10)) {
      if (!link.url || !isValidUrl(link.url)) {
        return res.status(400).json({ success: false, message: `Invalid URL: ${link.url || 'empty'}` });
      }
      if (isInternalUrl(link.url)) {
        return res.status(400).json({ success: false, message: 'Internal/private URLs are not allowed' });
      }
      validatedLinks.push({
        type: sanitize(String(link.type || 'Other')),
        url: link.url
      });
    }
  }
  
  const newSubmission = {
    id: generateId('sub_'),
    eventId: id,
    userId,
    links: validatedLinks,
    isFinalLock: !!isFinalLock,
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
  const event = eventsDb.find(e => e.id === id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  // Verify organizer role
  if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
    logSecurityEvent(EVENT_TYPES.FORBIDDEN_ACCESS, {
      userId: req.user.id,
      resource: `Submissions for event ${id}`,
      message: 'Unauthorized access to submissions',
      severity: 'HIGH'
    });
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const eventSubs = submissionsDb.filter(s => s.eventId === id);

  // Pagination
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const startIdx = (page - 1) * limit;
  const paginated = eventSubs.slice(startIdx, startIdx + limit);

  res.json({ 
    success: true, 
    data: paginated,
    pagination: { page, limit, total: eventSubs.length, totalPages: Math.ceil(eventSubs.length / limit) }
  });
};

exports.evaluateSubmission = (req, res) => {
  const { id, submissionId } = req.params;
  const { rubricScores, feedback, isShortlisted } = req.body;
  
  const event = eventsDb.find(e => e.id === id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

  // Verify organizer role
  if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
    logSecurityEvent(EVENT_TYPES.FORBIDDEN_ACCESS, {
      userId: req.user.id,
      resource: `Evaluation for submission ${submissionId}`,
      message: 'Unauthorized evaluation attempt',
      severity: 'HIGH'
    });
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  let submission = submissionsDb.find(s => s.id === submissionId);
  if (!submission) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }
  
  submission.status = isShortlisted ? 'Shortlisted' : 'Evaluated';
  submission.rubricScores = rubricScores;
  submission.feedback = sanitize(String(feedback || ''));

  logSecurityEvent(EVENT_TYPES.ADMIN_ACTION, {
    userId: req.user.id,
    resource: `Submission ${submissionId}`,
    message: `Submission evaluated: ${submission.status}`,
    severity: 'INFO'
  });
  
  // Trigger Qualification Alert if shortlisted
  if (isShortlisted) {
    emailService.sendQualificationAlert('participant@example.com', event.title);
  }
  
  res.json({ success: true, message: 'Evaluation Saved Successfully', data: submission });
};
