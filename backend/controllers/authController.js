const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Email and password must be strings' });
  }

  if (email && password) {
    let role = 'participant';
    if (email.includes('admin')) {
      role = 'admin';
    } else if (email.includes('organizer')) {
      role = 'organizer';
    }

    const token = jwt.sign(
      { id: 'user_123', email, role },
      process.env.JWT_SECRET || 'super_secret_key_123_dont_leak_it',
      { expiresIn: '24h' }
    );

    res.json({ success: true, token, user: { id: 'user_123', name: 'Hitesh B', email, role } });
  } else {
    res.status(400).json({ success: false, message: 'Email and password required' });
  }
};

