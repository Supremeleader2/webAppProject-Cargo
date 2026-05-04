const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM admin_usuario WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const admin = rows[0];
    // Comparación directa de texto plano (sin bcrypt)
    if (admin.password_hash !== password) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const token = jwt.sign(
      { id: admin.id_admin, email: admin.email, rol: admin.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );
    res.json({
      token,
      user: {
        id: admin.id_admin,
        email: admin.email,
        nombre: admin.nombre_completo,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { login };
