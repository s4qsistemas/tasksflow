// models/projectModel.js
const { pool } = require('../config/db');

// Obtener todos los proyectos de la empresa (para admin/root)
async function getAllByCompany(companyId) {
  const [rows] = await pool.query(
    `SELECT
       id,
       company_id,
       area_id,
       name,
       description,
       status,
       start_date,
       end_date,
       created_at
     FROM projects
     WHERE company_id = ?
     ORDER BY created_at DESC`,
    [companyId]
  );
  return rows;
}

// Obtener todos los proyectos de una área específica (para supervisor / user)
async function getAllByCompanyAndArea(companyId, areaId) {
  const [rows] = await pool.query(
    `SELECT
       id,
       company_id,
       area_id,
       creator_id,      -- 👈 IMPORTANTE
       name,
       description,
       status,
       start_date,
       end_date,
       created_at
     FROM projects
     WHERE company_id = ?
       AND area_id = ?
     ORDER BY created_at DESC`,
    [companyId, areaId]
  );
  return rows;
}

// Obtener un proyecto por id (validando solo company)
async function getById(id, companyId) {
  const [rows] = await pool.query(
    `SELECT
       id,
       company_id,
       area_id,
       name,
       description,
       status,
       start_date,
       end_date,
       created_at
     FROM projects
     WHERE id = ?
       AND company_id = ?`,
    [id, companyId]
  );
  return rows[0] || null;
}

// Obtener un proyecto por id, restringido a un área (para supervisor)
async function getByIdForArea(id, companyId, areaId) {
  const [rows] = await pool.query(
    `SELECT
       id,
       company_id,
       area_id,
       name,
       description,
       status,
       start_date,
       end_date,
       created_at
     FROM projects
     WHERE id = ?
       AND company_id = ?
       AND area_id = ?`,
    [id, companyId, areaId]
  );
  return rows[0] || null;
}

// Crear proyecto nuevo
async function createProject(companyId, areaId, creatorId, payload) {
  const {
    name,
    description,
    status,
    start_date,
    end_date
  } = payload;

  const [result] = await pool.query(
    `INSERT INTO projects
       (company_id, area_id, creator_id, name, description, status, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      companyId,
      areaId,
      creatorId,
      name,
      description,
      status,
      start_date,
      end_date
    ]
  );

  return {
    id: result.insertId,
    company_id: companyId,
    area_id: areaId,
    creator_id: creatorId,
    name,
    description,
    status,
    start_date,
    end_date
  };
}

// Actualizar proyecto existente
// areaScope = null  → sin restricción de área (admin/root)
// areaScope = <id> → restringe a esa área (supervisor)
async function updateProject(id, companyId, data, areaScope = null) {
  const fields = [];
  const params = [];

  if (typeof data.name !== 'undefined') {
    fields.push('name = ?');
    params.push(data.name);
  }
  if (typeof data.description !== 'undefined') {
    fields.push('description = ?');
    params.push(data.description);
  }
  if (typeof data.status !== 'undefined') {
    fields.push('status = ?');
    params.push(data.status);
  }
  if (typeof data.start_date !== 'undefined') {
    fields.push('start_date = ?');
    params.push(data.start_date || null);
  }
  if (typeof data.end_date !== 'undefined') {
    fields.push('end_date = ?');
    params.push(data.end_date || null);
  }
  // 🔹 Opcional: permitir cambiar area_id solo a admin/root
  if (typeof data.area_id !== 'undefined') {
    fields.push('area_id = ?');
    params.push(data.area_id || null);
  }

  if (!fields.length) {
    // Nada que actualizar
    if (areaScope) {
      return getByIdForArea(id, companyId, areaScope);
    }
    return getById(id, companyId);
  }

  let sql = `
    UPDATE projects
    SET ${fields.join(', ')}
    WHERE id = ?
      AND company_id = ?
  `;

  params.push(id, companyId);

  if (areaScope) {
    sql += ' AND area_id = ?';
    params.push(areaScope);
  }

  const [result] = await pool.query(sql, params);

  if (result.affectedRows === 0) {
    // No existe o no pertenece al scope
    return null;
  }

  if (areaScope) {
    return getByIdForArea(id, companyId, areaScope);
  }
  return getById(id, companyId);
}

module.exports = {
  getAllByCompany,
  getAllByCompanyAndArea,
  getById,
  getByIdForArea,
  createProject,
  updateProject
};
