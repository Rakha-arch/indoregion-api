const express = require('express');
const router = express.Router();
const authApiKey = require('../middleware/authApiKey');
const { listRegions, getRegionByCode, getStats } = require('../controllers/regionController');

router.use(authApiKey); // every route below requires a valid x-api-key

router.get('/regions/stats', getStats);
router.get('/regions/:code', getRegionByCode);
router.get('/regions', listRegions);

module.exports = router;
