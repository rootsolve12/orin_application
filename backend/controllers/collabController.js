// controllers/collabController.js

let teamsDb = [];
let messagesDb = [
  { id: 'm1', sender: 'Organizer', receiver: 'user_123', content: 'Welcome to the Global Hack! Do you need an extension?', timestamp: new Date().toISOString() }
];

exports.createTeam = (req, res) => {
  const { name, leaderId } = req.body;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const newTeam = {
    id: `team_${Date.now()}`,
    name,
    inviteCode,
    members: [{ userId: leaderId, role: 'Leader' }],
    files: [],
    deadlines: []
  };
  
  teamsDb.push(newTeam);
  res.json({ success: true, data: newTeam });
};

exports.joinTeam = (req, res) => {
  const { inviteCode, userId } = req.body;
  const team = teamsDb.find(t => t.inviteCode === inviteCode);
  
  if (!team) return res.status(404).json({ success: false, message: 'Invalid Invite Code' });
  if (team.members.find(m => m.userId === userId)) return res.json({ success: false, message: 'Already in this team' });
  
  team.members.push({ userId, role: 'Member' });
  res.json({ success: true, data: team });
};

exports.getMyTeam = (req, res) => {
  const { userId } = req.params;
  const team = teamsDb.find(t => t.members.some(m => m.userId === userId));
  if (!team) return res.json({ success: false });
  res.json({ success: true, data: team });
};

exports.getMessages = (req, res) => {
  const { userId } = req.params;
  const userMessages = messagesDb.filter(m => m.receiver === userId || m.sender === userId);
  res.json({ success: true, data: userMessages });
};

exports.sendMessage = (req, res) => {
  const { sender, receiver, content } = req.body;
  const newMsg = {
    id: `msg_${Date.now()}`,
    sender,
    receiver,
    content,
    timestamp: new Date().toISOString()
  };
  messagesDb.push(newMsg);
  res.json({ success: true, data: newMsg });
};
