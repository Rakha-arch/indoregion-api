require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes');
const regionRoutes = require('./routes/regionRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'IndoRegion API',
    description: 'SaaS API providing data on Indonesian administrative regions',
    docs: '/health for status, see README for full endpoint list',
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/auth', authRoutes);
app.use('/api-keys', apiKeyRoutes);
app.use('/v1', regionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Only listen when run directly (local dev). On Vercel, api/index.js
// imports this app and exports it as a serverless handler instead.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`IndoRegion API running at http://localhost:${PORT}`));
}

module.exports = app;
