const express = require('express');
const router = express.Router();
const authJwt = require('../middleware/authJwt');
const { createKey, listKeys, revokeKey, usage } = require('../controllers/apiKeyController');

router.use(authJwt); // every route below requires a logged-in user

router.post('/', createKey);
router.get('/', listKeys);
router.get('/usage', usage);
router.delete('/:id', revokeKey);

module.exports = router;
