// models/projectModel.js
const { pool } = require('../config/db');

// ===============================
// Helpers de mapeo
// ===============================
function mapRow(row) {
  return {
    id: row.id,
    company_id: row.company_id,
    area_id: row.area_id,
    name: row.name,
    description: row.description,
    status: row.status,
    start_date: row.start_date,
    end_date: row.end_date,
    created_at: row.created_at,
    area_name: row.area_name || null,
    progress: row.progress || 0 // por si ya calculas algo
  };
}

// ===============================
// Listar por empresa (para admin/root)
// ===============================
async function getAllByCompany(companyId) {
  const [rows] = await pool.query(
    `
    SELECT
      p.*,
      a.name AS area_name
    FROM projects p
    LEFT JOIN areas a ON a.id = p.area_id
    WHERE p.company_id = ?
    ORDER BY p.created_at DESC
    `,
    [companyId]
  );

  return rows.map(mapRow);
}

// ===============================
// Listar por empresa + área (supervisor)
// ===============================
async function getAllByCompanyAndArea(companyId, areaId) {
  const [rows] = await pool.query(
    `
    SELECT
      p.*,
      a.name AS area_name
    FROM projects p
    LEFT JOIN areas a ON a.id = p.area_id
    WHERE p.company_id = ?
      AND (p.area_id = ? OR p.area_id IS NULL)
    ORDER BY p.created_at DESC
    `,
    [companyId, areaId]
  );

  return rows.map(mapRow);
}

// ===============================
// Obtener 1 proyecto por ID + empresa
// ===============================
async function getById(companyId, projectId) {
  const [rows] = await pool.query(
    `
    SELECT
      p.*,
      a.name AS area_name
    FROM projects p
    LEFT JOIN areas a ON a.id = p.area_id
    WHERE p.company_id = ?
      AND p.id = ?
    LIMIT 1
    `,
    [companyId, projectId]
  );

  if (!rows.length) return null;
  return mapRow(rows[0]);
}

// ===============================
// Crear proyecto
// ===============================
async function create({
  companyId,
  areaId,
  name,
  description,
  status,
  startDate,
  endDate,
  creatorId        // 👈 NUEVO
}) {
  const [result] = await pool.query(
    `
    INSERT INTO projects
      (company_id, area_id, name, description, status, start_date, end_date, creator_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      companyId,
      areaId || null,
      name,
      description || '',
      status || 'active',
      startDate || null,
      endDate || null,
      creatorId          // 👈 NUEVO
    ]
  );

  return result.insertId;
}

// ===============================
// Actualizar proyecto
// ===============================
async function update({ id, companyId, areaId, name, description, status, startDate, endDate }) {
  await pool.query(
    `
    UPDATE projects
    SET
      area_id = ?,
      name = ?,
      description = ?,
      status = ?,
      start_date = ?,
      end_date = ?
    WHERE id = ?
      AND company_id = ?
    `,
    [
      areaId || null,
      name,
      description || '',
      status || 'active',
      startDate || null,
      endDate || null,
      id,
      companyId
    ]
  );
}

module.exports = {
  getAllByCompany,
  getAllByCompanyAndArea,
  getById,
  create,
  update
};