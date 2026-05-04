const express = require('express');
const {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  uploadSchoolImage,
} = require('../controllers/schoolController');
const { verifyToken } = require('../middleware/auth');
const { validateSchool } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const imageStorage = multer.diskStorage({
  destination: 'uploads/images/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const uploadImage = multer({ storage: imageStorage, limits: { fileSize: 5 * 1024 * 1024 } });

const {
  getPropuestas,
  addPropuesta,
  updatePropuesta,
  deletePropuesta,
} = require('../controllers/propuestaController');

router.get('/', getSchools);
router.get('/:id', getSchoolById);
router.post('/', verifyToken, validateSchool, createSchool);
router.put('/:id', verifyToken, validateSchool, updateSchool);
router.delete('/:id', verifyToken, deleteSchool);
router.post('/:id/image', verifyToken, uploadImage.single('image'), uploadSchoolImage);

// Propuestas routes (nested under school ID)
router.get('/:id/propuestas', getPropuestas);
router.post('/:id/propuestas', verifyToken, addPropuesta);
router.put('/:id/propuestas/:idNecesidad', verifyToken, updatePropuesta);
router.delete('/:id/propuestas/:idNecesidad', verifyToken, deletePropuesta);

module.exports = router;
