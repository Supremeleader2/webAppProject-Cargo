const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const {
  getMunicipalities,
  getDonationTypes,
  getEducationalLevels,
  getDashboardStats,
  getGlobalProgress,
  importExcel,
  exportNeeds,
} = require('../controllers/catalogController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/municipalities', getMunicipalities);
router.get('/donation-types', getDonationTypes);
router.get('/educational-levels', getEducationalLevels);
router.get('/dashboard/stats', getDashboardStats);
router.get('/global-progress', getGlobalProgress);

router.get('/export/needs', exportNeeds);

router.post('/import/school-needs', verifyToken, upload.single('file'), importExcel);

module.exports = router;
