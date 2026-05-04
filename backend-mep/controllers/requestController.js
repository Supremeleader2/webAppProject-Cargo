const pool = require('../config/db');
const crypto = require('crypto');

// GET /api/support-requests (admin)
const getSupportRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, m.nombre_municipio as municipio_nombre
      FROM solicitud_apoyo s
      LEFT JOIN municipio m ON s.id_municipio = m.id_municipio
      ORDER BY s.fecha_recepcion DESC
    `);
    const formatted = rows.map((row) => ({
      id: row.id_solicitud,
      nombreContacto: row.nombre_contacto,
      nombreInstitucion: row.institucion,
      municipio: row.municipio_nombre,
      tipoInstitucion: row.tipo_institucion,
      formaParticipacion: row.forma_participacion,
      telefono: row.telefono,
      correo: row.correo,
      notasAdicionales: row.notas_adicionales,
      fecha_recepcion: row.fecha_recepcion,
      escuelaInteres: row.id_escuela_interes,
      categoriaInteres: row.categoria_interes,
    }));
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener solicitudes' });
  }
};

// POST /api/support-requests (público)
const createSupportRequest = async (req, res) => {
  const {
    nombreContacto,
    nombreInstitucion,
    municipio,
    tipoInstitucion,
    formaParticipacion,
    telefono,
    correo,
    notasAdicionales,
    escuelaInteres,
    categoriaInteres,
    tipoApoyo,
    materialEspecifico,
    cantidadMaterial,
  } = req.body;

  try {
    let id_municipio = null;
    if (municipio) {
      const [mRow] = await pool.query(
        'SELECT id_municipio FROM municipio WHERE nombre_municipio = ?',
        [municipio],
      );
      if (mRow.length) id_municipio = mRow[0].id_municipio;
      else console.log(`Municipio no encontrado: ${municipio}`);
    }

    const id_solicitud = crypto.randomUUID();
    let notasCompletas = notasAdicionales || '';
    if (tipoApoyo) notasCompletas += `\nTipo de apoyo: ${tipoApoyo}`;
    if (materialEspecifico) notasCompletas += `\nMaterial específico: ${materialEspecifico}`;
    if (cantidadMaterial) notasCompletas += `\nCantidad: ${cantidadMaterial}`;

    const [result] = await pool.query(
      `INSERT INTO solicitud_apoyo (id_solicitud, nombre_contacto, institucion, id_municipio,
        tipo_institucion, forma_participacion, telefono, correo, notas_adicionales,
        id_escuela_interes, categoria_interes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_solicitud,
        nombreContacto,
        nombreInstitucion,
        id_municipio,
        tipoInstitucion,
        formaParticipacion,
        telefono,
        correo,
        notasCompletas,
        escuelaInteres || null,
        categoriaInteres || null,
      ],
    );

    res.status(201).json({
      message: 'Solicitud registrada exitosamente',
      folio: id_solicitud,
      seguimiento:
        'En las próximas 48 horas, un asesor se pondrá en contacto contigo para coordinar los detalles de tu donación.',
    });
  } catch (error) {
    console.error('Error detallado al insertar solicitud:', error);
    // Enviar mensaje de error específico para depuración (solo desarrollo)
    res.status(500).json({
      message: 'Error al registrar solicitud',
      error: error.message,
      sqlMessage: error.sqlMessage,
    });
  }
};

// DELETE /api/support-requests/:id (admin)
const deleteSupportRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM solicitud_apoyo WHERE id_solicitud = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar solicitud' });
  }
};

module.exports = {
  getSupportRequests,
  createSupportRequest,
  deleteSupportRequest,
};
