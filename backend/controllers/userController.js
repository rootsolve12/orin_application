// controllers/userController.js

// Mocked Central Database for Users
let usersDb = {
  'user_123': {
    id: 'user_123',
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
  }
};

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

exports.getProfile = (req, res) => {
  // In a real app, extract user ID from auth token
  const userId = 'user_123';
  const user = usersDb[userId];
  
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  
  const completionScore = calculateCompletionScore(user);
  
  res.json({
    success: true,
    data: {
      ...user,
      completionScore
    }
  });
};

exports.updateProfile = (req, res) => {
  const userId = 'user_123';
  if (!usersDb[userId]) usersDb[userId] = {};
  
  // Merge new data
  usersDb[userId] = { ...usersDb[userId], ...req.body };
  
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
