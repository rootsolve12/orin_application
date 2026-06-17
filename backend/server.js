const app = require('./app');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Orin Backend Server running successfully on port ${PORT}`);
});

