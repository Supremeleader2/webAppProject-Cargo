const express = require('express');
const {
  getSupportRequests,
  createSupportRequest,
  deleteSupportRequest,
} = require('../controllers/requestController');
const { verifyToken } = require('../middleware/auth');
const { validateSupportRequest } = require('../middleware/validation');
const router = express.Router();

router.get('/', verifyToken, getSupportRequests);
router.post('/', validateSupportRequest, createSupportRequest);
router.delete('/:id', verifyToken, deleteSupportRequest);

module.exports = router;
