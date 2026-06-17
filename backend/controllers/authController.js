// controllers/authController.js
exports.login = (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    res.json({ success: true, token: 'mock-jwt-token-123', user: { name: 'Hitesh B', email } });
  } else {
    res.status(400).json({ success: false, message: 'Email and password required' });
  }
};
