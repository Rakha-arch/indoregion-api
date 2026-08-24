// Vercel serverless entry point.
// vercel.json routes every request to this file, which just re-exports
// the Express app. The @vercel/node runtime knows how to wrap an Express
// app's (req, res) signature as a serverless function automatically.
module.exports = require('../src/app');
