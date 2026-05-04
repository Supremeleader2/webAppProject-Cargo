const pool = require('../config/db');

const getPropuestas = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM vista_propuestas_escuela WHERE id_escuela = ?', [
      id,
    ]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener propuestas' });
  }
};

const addPropuesta = async (req, res) => {
  try {
    const { id } = req.params;
    const { subcategoria, categoria, propuesta, cantidad_requerida, unidad, estado, detalles } =
      req.body;

    const [result] = await pool.query('CALL sp_upsert_propuesta(?, ?, ?, ?, ?, ?, ?, ?)', [
      id,
      subcategoria,
      categoria,
      propuesta,
      cantidad_requerida,
      unidad,
      estado,
      detalles,
    ]);

    // El SP devuelve un result set con id_necesidad
    const id_necesidad = result[0][0].id_necesidad;
    res.status(201).json({ id_necesidad, message: 'Propuesta agregada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al agregar propuesta' });
  }
};

const updatePropuesta = async (req, res) => {
  try {
    // id = id de la escuela (no se usa directamente en el SP de update pero está en la ruta)
    const { id, idNecesidad } = req.params;
    const { subcategoria, categoria, propuesta, cantidad_requerida, unidad, estado, detalles } =
      req.body;

    await pool.query('CALL sp_update_propuesta(?, ?, ?, ?, ?, ?, ?, ?)', [
      idNecesidad,
      subcategoria,
      categoria,
      propuesta,
      cantidad_requerida,
      unidad,
      estado,
      detalles,
    ]);

    res.json({ message: 'Propuesta actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar propuesta' });
  }
};

const deletePropuesta = async (req, res) => {
  try {
    const { idNecesidad } = req.params;

    await pool.query('CALL sp_delete_propuesta(?)', [idNecesidad]);

    res.json({ message: 'Propuesta eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar propuesta' });
  }
};

module.exports = {
  getPropuestas,
  addPropuesta,
  updatePropuesta,
  deletePropuesta,
};
