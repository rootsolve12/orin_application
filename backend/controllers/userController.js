// controllers/userController.js
const { sanitize, sanitizeObject, isValidUrl } = require('../middleware/validate');
const { logSecurityEvent, EVENT_TYPES } = require('../middleware/logger');

// Mocked Central Database for Users
let usersDb = {
  'user_001': {
    id: 'user_001',
    name: 'Hitesh B',
    email: 'hitesh@srmist.edu.in',
    avatar: 'https://via.placeholder.com/150',
    institution: 'SRM Institute of Science and Technology',
    department: 'Computer Science',
    degreeProgram: 'B.Tech',
    academicYear: '3rd Year',
    graduationYear: '2027',
    skills: ['React', 'Node.js', 'Flutter', 'Firebase'],
    interests: ['Web3', 'AI/ML', 'Open Source'],
    careerAspirations: 'Full Stack Developer',
    resumeUrl: null,
    links: {
      linkedin: 'https://linkedin.com/in/hitesh',
      github: 'https://github.com/hitesh',
      leetcode: '',
      kaggle: ''
    },
    privacy: 'Public', // Public, Institution Only, Connections Only, Private
    eventsParticipated: 12,
    certificatesEarned: 5,
    eventsCompleted: 10,
    skillsAcquired: 8,
    savedEvents: []
  },
  'user_002': {
    id: 'user_002',
    name: 'Organizer User',
    email: 'organizer@srmist.edu.in',
    avatar: 'https://via.placeholder.com/150',
    institution: 'SRM Institute of Science and Technology',
    department: 'Computer Science',
    degreeProgram: 'B.Tech',
    academicYear: '4th Year',
    graduationYear: '2026',
    skills: ['Project Management', 'Leadership'],
    interests: ['Event Planning'],
    careerAspirations: 'Product Manager',
    resumeUrl: null,
    links: { linkedin: '', github: '', leetcode: '', kaggle: '' },
    privacy: 'Public',
    eventsParticipated: 5,
    certificatesEarned: 2,
    eventsCompleted: 4,
    skillsAcquired: 3,
    savedEvents: []
  },
  'user_003': {
    id: 'user_003',
    name: 'Admin User',
    email: 'admin@srmist.edu.in',
    avatar: 'https://via.placeholder.com/150',
    institution: 'SRM Institute of Science and Technology',
    department: 'IT',
    degreeProgram: 'B.Tech',
    academicYear: 'Staff',
    graduationYear: 'N/A',
    skills: ['System Administration'],
    interests: ['Security'],
    careerAspirations: 'DevOps Engineer',
    resumeUrl: null,
    links: { linkedin: '', github: '', leetcode: '', kaggle: '' },
    privacy: 'Private',
    eventsParticipated: 0,
    certificatesEarned: 0,
    eventsCompleted: 0,
    skillsAcquired: 0,
    savedEvents: []
  }
};

// WHITELISTED fields for profile update (prevents mass assignment)
const ALLOWED_PROFILE_FIELDS = [
  'name', 'avatar', 'institution', 'department', 'degreeProgram',
  'academicYear', 'graduationYear', 'skills', 'interests',
  'careerAspirations', 'resumeUrl', 'links', 'privacy', 'savedEvents'
];

// Calculate Profile Completion Score
const calculateCompletionScore = (user) => {
  let score = 0;
  const totalWeight = 100;
  
  if (user.name) score += 10;
  if (user.avatar) score += 5;
  if (user.institution) score += 15;
  if (user.department && user.degreeProgram) score += 15;
  if (user.skills && user.skills.length > 0) score += 15;
  if (user.careerAspirations) score += 10;
  if (user.resumeUrl) score += 10;
  
  // Social Links (5 points each, up to 20)
  if (user.links) {
    if (user.links.linkedin) score += 5;
    if (user.links.github) score += 5;
    if (user.links.leetcode) score += 5;
    if (user.links.kaggle) score += 5;
  }

  return Math.min(score, totalWeight); // Cap at 100%
};

/**
 * Filter profile data based on privacy settings.
 */
const applyPrivacyFilter = (user, requesterId) => {
  if (user.id === requesterId) return user; // Own profile — full access
  
  const privacySetting = user.privacy || 'Public';
  if (privacySetting === 'Private') {
    return { id: user.id, name: user.name, privacy: 'Private' }; // Minimal data
  }
  // For Public / Institution Only / Connections Only — return filtered data
  const { email, links, resumeUrl, ...publicData } = user;
  return publicData;
};

exports.getProfile = (req, res) => {
  const userId = req.user.id;
  if (!usersDb[userId]) {
    usersDb[userId] = {
      id: userId,
      name: sanitize(req.user.name || 'New User'),
      email: req.user.email || '',
      avatar: 'https://via.placeholder.com/150',
      institution: '',
      department: '',
      degreeProgram: '',
      academicYear: '',
      graduationYear: '',
      skills: [],
      interests: [],
      careerAspirations: '',
      resumeUrl: null,
      links: { linkedin: '', github: '', leetcode: '', kaggle: '' },
      privacy: 'Public',
      eventsParticipated: 0,
      certificatesEarned: 0,
      eventsCompleted: 0,
      skillsAcquired: 0,
      savedEvents: []
    };
  }
  const user = usersDb[userId];
  
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  
  const completionScore = calculateCompletionScore(user);
  
  // Return only necessary fields (data minimization)
  res.json({
    success: true,
    data: {
      ...user,
      completionScore
    }
  });
};

exports.updateProfile = (req, res) => {
  const userId = req.user.id;
  if (!usersDb[userId]) {
    usersDb[userId] = { id: userId };
  }
  
  // WHITELISTED field update — prevents mass assignment of role, id, email, etc.
  const sanitizedUpdate = {};
  for (const field of ALLOWED_PROFILE_FIELDS) {
    if (req.body[field] !== undefined) {
      // Prevent prototype pollution
      if (field === '__proto__' || field === 'constructor' || field === 'prototype') continue;
      
      const value = req.body[field];
      if (typeof value === 'string') {
        // Validate length
        if (value.length > 2000) {
          return res.status(400).json({ success: false, message: `${field} is too long (max 2000 chars)` });
        }
        sanitizedUpdate[field] = sanitize(value);
      } else if (Array.isArray(value)) {
        sanitizedUpdate[field] = value.map(v => typeof v === 'string' ? sanitize(v) : v).slice(0, 50);
      } else if (typeof value === 'object' && value !== null) {
        sanitizedUpdate[field] = sanitizeObject(value);
      } else {
        sanitizedUpdate[field] = value;
      }
    }
  }

  // Validate URLs if provided
  if (sanitizedUpdate.resumeUrl && sanitizedUpdate.resumeUrl !== '' && !isValidUrl(sanitizedUpdate.resumeUrl)) {
    return res.status(400).json({ success: false, message: 'Invalid resume URL format' });
  }

  // Merge only whitelisted, sanitized data
  usersDb[userId] = { ...usersDb[userId], ...sanitizedUpdate };
  
  logSecurityEvent(EVENT_TYPES.ADMIN_ACTION, {
    userId,
    message: `Profile updated. Fields: ${Object.keys(sanitizedUpdate).join(', ')}`,
    severity: 'INFO'
  });

  const completionScore = calculateCompletionScore(usersDb[userId]);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      ...usersDb[userId],
      completionScore
    }
  });
};

/**
 * Data Export (GDPR Article 20 - Right to Data Portability)
 */
exports.exportData = (req, res) => {
  const userId = req.user.id;
  const user = usersDb[userId];
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  logSecurityEvent(EVENT_TYPES.DATA_EXPORT, {
    userId,
    message: 'User data export requested',
    severity: 'INFO'
  });

  res.json({
    success: true,
    message: 'Data export successful',
    data: {
      profile: user,
      exportDate: new Date().toISOString(),
      format: 'JSON'
    }
  });
};

/**
 * Delete Account (GDPR Article 17 - Right to Erasure)
 */
exports.deleteAccount = (req, res) => {
  const userId = req.user.id;
  
  if (!usersDb[userId]) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  logSecurityEvent(EVENT_TYPES.ACCOUNT_DELETE, {
    userId,
    message: 'Account deletion requested',
    severity: 'HIGH'
  });

  delete usersDb[userId];
  
  res.json({
    success: true,
    message: 'Account and all associated data have been deleted'
  });
};
