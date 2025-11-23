const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// Test DB Route
router.get('/test-db', testController.getTestData);

// Placeholder for other modules
router.get('/status', (req, res) => {
    res.json({ status: 'OK', message: 'SICFOR API is running' });
});

module.exports = router;
