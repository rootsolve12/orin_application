// controllers/collabController.js
const { sanitize, sanitizeObject, generateId, generateInviteCode } = require('../middleware/validate');
const { logSecurityEvent, EVENT_TYPES } = require('../middleware/logger');

const MAX_TEAM_SIZE = 10;
const MAX_MESSAGE_LENGTH = 5000;

const isOwner = (req, targetUserId) => {
  if (!req.user) return false;
  return req.user.id === targetUserId;
};

let teamsDb = [];
let messagesDb = [
  { id: 'm1', sender: 'Organizer', receiver: 'user_001', content: 'Welcome to the Global Hack! Do you need an extension?', timestamp: new Date().toISOString() }
];

exports.createTeam = (req, res) => {
  const { name, leaderId } = req.body;

  // Input validation
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Team name is required' });
  }

  if (name.length > 100) {
    return res.status(400).json({ success: false, message: 'Team name too long (max 100 chars)' });
  }

  if (!leaderId || typeof leaderId !== 'string') {
    return res.status(400).json({ success: false, message: 'leaderId is required' });
  }

  // Verify ownership to prevent IDOR
  if (!isOwner(req, leaderId) && req.user.role !== 'admin') {
    logSecurityEvent(EVENT_TYPES.IDOR_ATTEMPT, {
      userId: req.user.id,
      resource: 'Team creation',
      message: `Attempted to create team as ${leaderId}`,
      severity: 'HIGH'
    });
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  // Cryptographically secure invite code
  const inviteCode = generateInviteCode();
  
  const newTeam = {
    id: generateId('team_'),
    name: sanitize(name),
    inviteCode,
    members: [{ userId: leaderId, role: 'Leader' }],
    files: [],
    deadlines: [],
    maxSize: MAX_TEAM_SIZE
  };
  
  teamsDb.push(newTeam);
  res.json({ success: true, data: newTeam });
};


exports.joinTeam = (req, res) => {
  const { inviteCode, userId } = req.body;

  if (!inviteCode || typeof inviteCode !== 'string') {
    return res.status(400).json({ success: false, message: 'Invite code is required' });
  }

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }

  // Verify ownership to prevent IDOR
  if (!isOwner(req, userId) && req.user.role !== 'admin') {
    logSecurityEvent(EVENT_TYPES.IDOR_ATTEMPT, {
      userId: req.user.id,
      resource: 'Team join',
      message: `Attempted to join team as ${userId}`,
      severity: 'HIGH'
    });
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const team = teamsDb.find(t => t.inviteCode === inviteCode);
  
  if (!team) return res.status(404).json({ success: false, message: 'Invalid Invite Code' });
  if (team.members.find(m => m.userId === userId)) return res.json({ success: false, message: 'Already in this team' });
  
  // Team size limit
  if (team.members.length >= MAX_TEAM_SIZE) {
    return res.status(400).json({ success: false, message: `Team is full (max ${MAX_TEAM_SIZE} members)` });
  }

  team.members.push({ userId, role: 'Member' });
  res.json({ success: true, data: team });
};

exports.getMyTeam = (req, res) => {
  const { userId } = req.params;

  // Verify ownership to prevent IDOR
  if (!isOwner(req, userId) && req.user.role !== 'organizer' && req.user.role !== 'admin') {
    logSecurityEvent(EVENT_TYPES.IDOR_ATTEMPT, {
      userId: req.user.id,
      resource: `Team for user ${userId}`,
      message: 'IDOR attempt on team lookup',
      severity: 'HIGH'
    });
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const team = teamsDb.find(t => t.members.some(m => m.userId === userId));
  if (!team) return res.json({ success: false });
  res.json({ success: true, data: team });
};

exports.getMessages = (req, res) => {
  const { userId } = req.params;

  // Verify ownership to prevent IDOR
  if (!isOwner(req, userId) && req.user.role !== 'organizer' && req.user.role !== 'admin') {
    logSecurityEvent(EVENT_TYPES.IDOR_ATTEMPT, {
      userId: req.user.id,
      resource: `Messages for user ${userId}`,
      message: 'IDOR attempt on messages',
      severity: 'HIGH'
    });
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const userMessages = messagesDb.filter(m => m.receiver === userId || m.sender === userId);
  res.json({ success: true, data: userMessages });
};

exports.sendMessage = (req, res) => {
  const { sender, receiver, content } = req.body;

  // Input validation
  if (!sender || typeof sender !== 'string') {
    return res.status(400).json({ success: false, message: 'sender is required' });
  }
  if (!receiver || typeof receiver !== 'string') {
    return res.status(400).json({ success: false, message: 'receiver is required' });
  }
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message content is required' });
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ success: false, message: `Message too long (max ${MAX_MESSAGE_LENGTH} chars)` });
  }

  // Verify ownership to prevent IDOR
  if (!isOwner(req, sender) && req.user.role !== 'admin') {
    logSecurityEvent(EVENT_TYPES.IDOR_ATTEMPT, {
      userId: req.user.id,
      resource: 'Send message',
      message: `Attempted to send message as ${sender}`,
      severity: 'HIGH'
    });
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const newMsg = {
    id: generateId('msg_'),
    sender,
    receiver,
    content: sanitize(content), // XSS sanitization
    timestamp: new Date().toISOString()
  };
  messagesDb.push(newMsg);
  res.json({ success: true, data: newMsg });
};

exports.leaveTeam = (req, res) => {
  const { userId } = req.params;

  if (!isOwner(req, userId) && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const teamIndex = teamsDb.findIndex(t => t.members.some(m => m.userId === userId));
  if (teamIndex === -1) {
    return res.status(404).json({ success: false, message: 'Not in any team' });
  }

  const team = teamsDb[teamIndex];
  team.members = team.members.filter(m => m.userId !== userId);

  // Delete team if empty
  if (team.members.length === 0) {
    teamsDb.splice(teamIndex, 1);
  }

  res.json({ success: true, message: 'Left the team successfully' });
};

exports.deleteTeam = (req, res) => {
  const { teamId } = req.params;

  const team = teamsDb.find(t => t.id === teamId);
  if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

  // Only leader or admin can delete
  const leader = team.members.find(m => m.role === 'Leader');
  if (leader?.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only team leader or admin can delete the team' });
  }

  teamsDb = teamsDb.filter(t => t.id !== teamId);
  res.json({ success: true, message: 'Team deleted successfully' });
};
