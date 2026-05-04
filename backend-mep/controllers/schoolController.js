const pool = require('../config/db');
const { extractNeedsArray, extractDonationTypesArray } = require('../utils/helpers');
const crypto = require('crypto');

// GET /api/schools (con filtros)
const getSchools = async (req, res) => {
  const { county, donationType, search } = req.query;
  let sql = `
    SELECT DISTINCT e.*, m.nombre_municipio as county_name, nv.nombre_nivel as nivel_nombre
    FROM escuela e
    JOIN municipio m ON e.id_municipio = m.id_municipio
    LEFT JOIN nivel_educativo nv ON e.id_nivel = nv.id_nivel
    LEFT JOIN escuela_tipo_donacion etd ON e.id_escuela = etd.id_escuela
    LEFT JOIN tipo_donacion td ON etd.id_tipo_donacion = td.id_tipo_donacion
    WHERE 1=1
  `;
  const params = [];

  if (county && county !== 'Todos los Municipios') {
    sql += ` AND m.nombre_municipio = ?`;
    params.push(county);
  }
  if (donationType && donationType !== 'Todos los Tipos') {
    sql += ` AND td.nombre_tipo = ?`;
    params.push(donationType);
  }
  if (search) {
    sql += ` AND (e.nombre LIKE ? OR e.descripcion LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  try {
    const [schools] = await pool.query(sql, params);
    const result = await Promise.all(
      schools.map(async (school) => {
        const [needsRows] = await pool.query(
          `SELECT nc.nombre_necesidad FROM escuela_necesidad en
         JOIN necesidad_catalogo nc ON en.id_necesidad = nc.id_necesidad
         WHERE en.id_escuela = ?`,
          [school.id_escuela],
        );
        const [donationRows] = await pool.query(
          `SELECT td.nombre_tipo FROM escuela_tipo_donacion etd
         JOIN tipo_donacion td ON etd.id_tipo_donacion = td.id_tipo_donacion
         WHERE etd.id_escuela = ?`,
          [school.id_escuela],
        );
        return {
          id: school.id_escuela,
          name: school.nombre,
          county: school.county_name,
          nivel: school.nivel_nombre,
          students: school.num_estudiantes,
          teachers: school.num_maestros,
          description: school.descripcion,
          image: school.url_imagen,
          fundingProgress: school.progreso_financiamiento,
          materialsProgress: school.progreso_materiales,
          volunteerHoursProgress: school.progreso_voluntariado,
          needs: extractNeedsArray(needsRows),
          donationTypes: extractDonationTypesArray(donationRows),
          nivelCondicion: school.nivel_condicion,
        };
      }),
    );
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener escuelas' });
  }
};

// GET /api/schools/:id
const getSchoolById = async (req, res) => {
  const { id } = req.params;
  try {
    const [schoolRows] = await pool.query(
      `SELECT e.*, m.nombre_municipio as county_name, nv.nombre_nivel as nivel_nombre
       FROM escuela e
       JOIN municipio m ON e.id_municipio = m.id_municipio
       LEFT JOIN nivel_educativo nv ON e.id_nivel = nv.id_nivel
       WHERE e.id_escuela = ?`,
      [id],
    );
    if (schoolRows.length === 0) {
      return res.status(404).json({ message: 'Escuela no encontrada' });
    }
    const school = schoolRows[0];
    const [needsRows] = await pool.query(
      `SELECT nc.nombre_necesidad, nc.cantidad_requerida, nc.cantidad_recibida, nc.prioridad,
              nc.propuesta, nc.unidad, nc.estado, nc.detalles
       FROM escuela_necesidad en
       JOIN necesidad_catalogo nc ON en.id_necesidad = nc.id_necesidad
       WHERE en.id_escuela = ?`,
      [id],
    );
    const [donationRows] = await pool.query(
      `SELECT td.nombre_tipo FROM escuela_tipo_donacion etd
       JOIN tipo_donacion td ON etd.id_tipo_donacion = td.id_tipo_donacion
       WHERE etd.id_escuela = ?`,
      [id],
    );
    res.json({
      id: school.id_escuela,
      name: school.nombre,
      county: school.county_name,
      nivel: school.nivel_nombre,
      students: school.num_estudiantes,
      teachers: school.num_maestros,
      phone: school.telefono,
      email: school.email,
      address: school.direccion,
      description: school.descripcion,
      image: school.url_imagen,
      fundingProgress: school.progreso_financiamiento,
      materialsProgress: school.progreso_materiales,
      volunteerHoursProgress: school.progreso_voluntariado,
      needs: needsRows,
      donationTypes: extractDonationTypesArray(donationRows),
      nivelCondicion: school.nivel_condicion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la escuela' });
  }
};

// POST /api/schools (admin)
const createSchool = async (req, res) => {
  try {
    const {
      name,
      county,
      nivel,
      students,
      teachers,
      phone,
      email,
      address,
      description,
      image,
      fundingProgress,
      materialsProgress,
      volunteerHoursProgress,
      needs = [],
      donationTypes = [],
      nivelCondicion = 'Mínimo',
    } = req.body;

    // Obtener id_municipio
    const [municipioRows] = await pool.query(
      'SELECT id_municipio FROM municipio WHERE nombre_municipio = ?',
      [county],
    );
    if (municipioRows.length === 0) {
      return res.status(400).json({ message: 'Municipio no válido' });
    }
    const id_municipio = municipioRows[0].id_municipio;

    // Dentro de createSchool, después de obtener id_municipio
    const [existing] = await pool.query(
      'SELECT id_escuela FROM escuela WHERE nombre = ? AND id_municipio = ?',
      [name, id_municipio],
    );
    if (existing.length) {
      return res.status(409).json({
        message: 'Ya existe una escuela con el mismo nombre en este municipio',
        existingId: existing[0].id_escuela,
      });
    }

    // Obtener id_nivel
    let id_nivel = null;
    if (nivel) {
      const [nivelRows] = await pool.query(
        'SELECT id_nivel FROM nivel_educativo WHERE nombre_nivel = ?',
        [nivel],
      );
      if (nivelRows.length) id_nivel = nivelRows[0].id_nivel;
    }

    const id_escuela = crypto.randomUUID();
    await pool.query(
      `INSERT INTO escuela (id_escuela, nombre, id_municipio, id_nivel, num_estudiantes, num_maestros,
        telefono, email, direccion, descripcion, url_imagen, progreso_financiamiento,
        progreso_materiales, progreso_voluntariado, nivel_condicion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_escuela,
        name,
        id_municipio,
        id_nivel,
        students || 0,
        teachers || 0,
        phone || null,
        email || null,
        address || null,
        description || null,
        image || null,
        fundingProgress || 0,
        materialsProgress || 0,
        volunteerHoursProgress || 0,
        nivelCondicion,
      ],
    );

    // Insertar necesidades
    for (const needName of needs) {
      const [needRow] = await pool.query(
        'SELECT id_necesidad FROM necesidad_catalogo WHERE nombre_necesidad = ?',
        [needName],
      );
      if (needRow.length) {
        await pool.query(
          'INSERT IGNORE INTO escuela_necesidad (id_escuela, id_necesidad) VALUES (?, ?)',
          [id_escuela, needRow[0].id_necesidad],
        );
      }
    }

    // Insertar tipos de donación
    for (const typeName of donationTypes) {
      const [typeRow] = await pool.query(
        'SELECT id_tipo_donacion FROM tipo_donacion WHERE nombre_tipo = ?',
        [typeName],
      );
      if (typeRow.length) {
        await pool.query(
          'INSERT IGNORE INTO escuela_tipo_donacion (id_escuela, id_tipo_donacion) VALUES (?, ?)',
          [id_escuela, typeRow[0].id_tipo_donacion],
        );
      }
    }

    res.status(201).json({ message: 'Escuela creada exitosamente', id: id_escuela });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear escuela' });
  }
};

// PUT /api/schools/:id (admin)
const updateSchool = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const [existing] = await pool.query('SELECT id_escuela FROM escuela WHERE id_escuela = ?', [
      id,
    ]);
    if (existing.length === 0) return res.status(404).json({ message: 'Escuela no encontrada' });

    // Construir SET dinámico
    const fields = [];
    const values = [];
    if (updates.name !== undefined) {
      fields.push('nombre = ?');
      values.push(updates.name);
    }
    if (updates.county !== undefined) {
      const [mRow] = await pool.query(
        'SELECT id_municipio FROM municipio WHERE nombre_municipio = ?',
        [updates.county],
      );
      if (mRow.length) {
        fields.push('id_municipio = ?');
        values.push(mRow[0].id_municipio);
      }
    }
    if (updates.nivel !== undefined) {
      const [nRow] = await pool.query(
        'SELECT id_nivel FROM nivel_educativo WHERE nombre_nivel = ?',
        [updates.nivel],
      );
      if (nRow.length) {
        fields.push('id_nivel = ?');
        values.push(nRow[0].id_nivel);
      }
    }
    if (updates.students !== undefined) {
      fields.push('num_estudiantes = ?');
      values.push(updates.students);
    }
    if (updates.teachers !== undefined) {
      fields.push('num_maestros = ?');
      values.push(updates.teachers);
    }
    if (updates.phone !== undefined) {
      fields.push('telefono = ?');
      values.push(updates.phone);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }
    if (updates.address !== undefined) {
      fields.push('direccion = ?');
      values.push(updates.address);
    }
    if (updates.description !== undefined) {
      fields.push('descripcion = ?');
      values.push(updates.description);
    }
    if (updates.image !== undefined) {
      fields.push('url_imagen = ?');
      values.push(updates.image);
    }
    if (updates.fundingProgress !== undefined) {
      fields.push('progreso_financiamiento = ?');
      values.push(updates.fundingProgress);
    }
    if (updates.materialsProgress !== undefined) {
      fields.push('progreso_materiales = ?');
      values.push(updates.materialsProgress);
    }
    if (updates.volunteerHoursProgress !== undefined) {
      fields.push('progreso_voluntariado = ?');
      values.push(updates.volunteerHoursProgress);
    }
    if (updates.nivelCondicion !== undefined) {
      fields.push('nivel_condicion = ?');
      values.push(updates.nivelCondicion);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE escuela SET ${fields.join(', ')} WHERE id_escuela = ?`, values);
    }

    // Reemplazar tipos de donación
    if (updates.donationTypes && Array.isArray(updates.donationTypes)) {
      await pool.query('DELETE FROM escuela_tipo_donacion WHERE id_escuela = ?', [id]);
      for (const typeName of updates.donationTypes) {
        const [typeRow] = await pool.query(
          'SELECT id_tipo_donacion FROM tipo_donacion WHERE nombre_tipo = ?',
          [typeName],
        );
        if (typeRow.length) {
          await pool.query(
            'INSERT IGNORE INTO escuela_tipo_donacion (id_escuela, id_tipo_donacion) VALUES (?, ?)',
            [id, typeRow[0].id_tipo_donacion],
          );
        }
      }
    }

    res.json({ message: 'Escuela actualizada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar escuela' });
  }
};

// DELETE /api/schools/:id (admin)
const deleteSchool = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM escuela WHERE id_escuela = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Escuela no encontrada' });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar escuela' });
  }
};

// POST /api/schools/:id/image (admin)
const uploadSchoolImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se subió imagen' });
  const imageUrl = `/uploads/images/${req.file.filename}`;
  try {
    await pool.query('UPDATE escuela SET url_imagen = ? WHERE id_escuela = ?', [
      imageUrl,
      req.params.id,
    ]);
    res.json({ imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar imagen de la escuela' });
  }
};

module.exports = {
  getSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  uploadSchoolImage,
};
