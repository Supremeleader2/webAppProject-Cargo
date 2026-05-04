const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
  handleValidationErrors,
];

const validateSchool = [
  body('name').notEmpty().withMessage('El nombre es requerido'),
  body('county').notEmpty().withMessage('El municipio es requerido'),
  body('students').optional().isInt({ min: 0 }),
  body('teachers').optional().isInt({ min: 0 }),
  body('fundingProgress').optional().isInt({ min: 0, max: 100 }).toInt(),
  body('materialsProgress').optional().isInt({ min: 0, max: 100 }).toInt(),
  body('volunteerHoursProgress').optional().isInt({ min: 0, max: 100 }).toInt(),
  body('donationTypes').optional().isArray(),
  handleValidationErrors,
];

const validateSupportRequest = [
  body('nombreContacto').notEmpty().withMessage('Nombre requerido'),
  body('nombreInstitucion').notEmpty().withMessage('Institución requerida'),
  body('municipio').notEmpty().withMessage('Municipio requerido'),
  body('tipoInstitucion').notEmpty(),
  body('formaParticipacion').notEmpty(),
  body('telefono').notEmpty(),
  body('correo').isEmail().withMessage('Email inválido'),
  handleValidationErrors,
];

module.exports = {
  validateLogin,
  validateSchool,
  validateSupportRequest,
};
