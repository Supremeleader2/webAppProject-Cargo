const xlsx = require('xlsx');
const fs = require('fs');
const crypto = require('crypto');

const pool = require('../config/db');

const getMunicipalities = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_municipio, nombre_municipio FROM municipio ORDER BY nombre_municipio',
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener municipios' });
  }
};

const getDonationTypes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id_tipo_donacion, nombre_tipo FROM tipo_donacion');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tipos de donación' });
  }
};

const getEducationalLevels = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id_nivel, nombre_nivel FROM nivel_educativo');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener niveles educativos' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [totalSchools] = await pool.query('SELECT COUNT(*) as total FROM escuela');
    const [totalNeeds] = await pool.query('SELECT COUNT(*) as total FROM escuela_necesidad');
    const [totalRequests] = await pool.query('SELECT COUNT(*) as total FROM solicitud_apoyo');
    const [avgProgress] = await pool.query(
      'SELECT AVG(progreso_financiamiento) as promedio FROM escuela',
    );
    const [conditions] = await pool.query(`
      SELECT nivel_condicion, COUNT(*) as count
      FROM escuela
      GROUP BY nivel_condicion
    `);
    const distribution = {};
    conditions.forEach((c) => {
      distribution[c.nivel_condicion] = c.count;
    });

    res.json({
      totalEscuelas: totalSchools[0].total,
      necesidadesPendientes: totalNeeds[0].total,
      solicitudesRecibidas: totalRequests[0].total,
      progresoPromedio: Math.round(avgProgress[0].promedio || 0),
      distribucionCondiciones: distribution,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

const getGlobalProgress = async (req, res) => {
  try {
    // Meta: todas las escuelas en nivel 'Básico' o superior
    const [total] = await pool.query('SELECT COUNT(*) as total FROM escuela');
    const [basicoSuperior] = await pool.query(
      `SELECT COUNT(*) as count FROM escuela WHERE nivel_condicion IN ('Básico', 'Medio', 'Alto', 'Ideal')`,
    );
    const current = basicoSuperior[0].count;
    const goal = total[0].total;
    const percentage = goal > 0 ? Math.round((current / goal) * 100) : 0;
    // Convertir a "corazones" (por ejemplo, cada escuela = 100 corazones, o usar una escala fija)
    const heartCurrent = current * 100;
    const heartGoal = goal * 100;
    res.json({
      current: heartCurrent,
      goal: heartGoal,
      percentage,
      escuelasActuales: current,
      escuelasMeta: goal,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener progreso global' });
  }
};

const importExcel = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { raw: false, defval: '' });

    let imported = 0;
    let errors = [];

    for (const row of rows) {
      const municipioNombre = row['Municipio']?.trim();
      const escuelaNombre = row['Escuela']?.trim();
      const categoria = row['Categoría']?.trim();
      const subcategoria = row['Subcategoría']?.trim();
      const propuesta = row['Propuesta']?.trim() || null;
      let cantidadRaw = row['Cantidad'];
      let cantidad = 0;
      const unidad = row['Unidad']?.trim() || null;
      const estado = row['Estado']?.trim() || 'Pendiente';
      const detalles = row['Detalles']?.trim() || null;

      if (!municipioNombre || !escuelaNombre || !subcategoria) {
        errors.push(`Fila omitida: faltan campos obligatorios - ${JSON.stringify(row)}`);
        continue;
      }

      if (cantidadRaw !== undefined && cantidadRaw !== '') {
        cantidad = parseInt(cantidadRaw);
        if (isNaN(cantidad)) cantidad = 0;
      }

      try {
        // 1. Municipio
        let idMunicipio;
        const [mRow] = await pool.query(
          'SELECT id_municipio FROM municipio WHERE nombre_municipio = ?',
          [municipioNombre],
        );
        if (mRow.length) {
          idMunicipio = mRow[0].id_municipio;
        } else {
          const [result] = await pool.query('INSERT INTO municipio (nombre_municipio) VALUES (?)', [
            municipioNombre,
          ]);
          idMunicipio = result.insertId;
        }

        // 2. Escuela
        let idEscuela;
        const [eRow] = await pool.query(
          'SELECT id_escuela FROM escuela WHERE nombre = ? AND id_municipio = ?',
          [escuelaNombre, idMunicipio],
        );
        if (eRow.length) {
          idEscuela = eRow[0].id_escuela;
        } else {
          const newId = crypto.randomUUID();
          await pool.query(
            `INSERT INTO escuela (id_escuela, nombre, id_municipio, num_estudiantes, num_maestros, descripcion)
             VALUES (?, ?, ?, 0, 0, '')`,
            [newId, escuelaNombre, idMunicipio],
          );
          idEscuela = newId;
        }

        // 3. Necesidad
        let idNecesidad;
        const [nRow] = await pool.query(
          `SELECT nc.id_necesidad FROM necesidad_catalogo nc
           JOIN escuela_necesidad en ON nc.id_necesidad = en.id_necesidad
           WHERE nc.nombre_necesidad = ? AND nc.propuesta <=> ? AND en.id_escuela = ?`,
          [subcategoria, propuesta, idEscuela],
        );

        if (nRow.length) {
          idNecesidad = nRow[0].id_necesidad;
          await pool.query(
            `UPDATE necesidad_catalogo 
             SET categoria_general = COALESCE(?, categoria_general),
                 cantidad_requerida = ?,
                 unidad = COALESCE(?, unidad),
                 estado = COALESCE(?, estado),
                 detalles = COALESCE(?, detalles)
             WHERE id_necesidad = ?`,
            [categoria || 'General', cantidad, unidad, estado, detalles, idNecesidad],
          );
        } else {
          const [result] = await pool.query(
            `INSERT INTO necesidad_catalogo 
             (nombre_necesidad, categoria_general, cantidad_requerida, propuesta, unidad, estado, detalles)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [subcategoria, categoria || 'General', cantidad, propuesta, unidad, estado, detalles],
          );
          idNecesidad = result.insertId;
        }

        // 4. Relacionar escuela con necesidad
        await pool.query(
          'INSERT IGNORE INTO escuela_necesidad (id_escuela, id_necesidad) VALUES (?, ?)',
          [idEscuela, idNecesidad],
        );

        imported++;
      } catch (err) {
        errors.push(`Error en fila ${JSON.stringify(row)}: ${err.message}`);
      }
    }

    // Eliminar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Importación finalizada',
      imported,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error(error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Error al procesar el archivo', error: error.message });
  }
};

// EXPORTAR necesidades a Excel (GET /api/export/needs)
const exportNeeds = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        m.nombre_municipio AS Municipio,
        e.nombre AS Escuela,
        nc.categoria_general AS Categoría,
        nc.nombre_necesidad AS Subcategoría,
        nc.propuesta AS Propuesta,
        nc.cantidad_requerida AS Cantidad,
        nc.unidad AS Unidad,
        nc.estado AS Estado,
        nc.detalles AS Detalles
      FROM necesidad_catalogo nc
      JOIN escuela_necesidad en ON nc.id_necesidad = en.id_necesidad
      JOIN escuela e ON en.id_escuela = e.id_escuela
      JOIN municipio m ON e.id_municipio = m.id_municipio
      ORDER BY m.nombre_municipio, e.nombre, nc.nombre_necesidad
    `);
    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Necesidades');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="necesidades_exportadas.xlsx"');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al exportar necesidades' });
  }
};

module.exports = {
  getMunicipalities,
  getDonationTypes,
  getEducationalLevels,
  getDashboardStats,
  getGlobalProgress,
  importExcel,
  exportNeeds,
};
