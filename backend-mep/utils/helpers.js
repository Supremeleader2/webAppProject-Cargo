const pool = require('../config/db');

const extractNeedsArray = (rows) => rows.map((row) => row.nombre_necesidad);
const extractDonationTypesArray = (rows) => rows.map((row) => row.nombre_tipo);

const getMunicipioNombre = async (id_municipio) => {
  if (!id_municipio) return null;
  const [rows] = await pool.query('SELECT nombre_municipio FROM municipio WHERE id_municipio = ?', [
    id_municipio,
  ]);
  return rows.length ? rows[0].nombre_municipio : null;
};

module.exports = {
  extractNeedsArray,
  extractDonationTypesArray,
  getMunicipioNombre,
};
