const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Tasks endpoint - Coming soon', data: [] });
}));

module.exports = router;