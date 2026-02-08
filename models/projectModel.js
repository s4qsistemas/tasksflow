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
    creator_id: row.creator_id,
    name: row.name,
    description: row.description,
    status: row.status,
    start_date: row.start_date,
    end_date: row.end_date,
    created_at: row.created_at,
    area_name: row.area_name || null,
    progress: row.progress || 0
  };
}

// ===============================
// Listar por empresa (para admin/root)
// ===============================
async function getAllByCompany(companyId) {
  const [rows] = await pool.query(
    `SELECT
       id,
       company_id,
       area_id,
       creator_id,
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

// ===============================
// Listar por empresa + área (supervisor)
// ===============================
async function getAllByCompanyAndArea(companyId, areaId) {
  const [rows] = await pool.query(
    `SELECT
       id,
       company_id,
       area_id,
       creator_id,
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

// ===============================
// Obtener 1 proyecto por ID + empresa
// ===============================
async function getById(companyId, projectId) {
  const [rows] = await pool.query(
    `
    SELECT
      p.*,
      a.name AS area_name,
      u.name AS creator_name
    FROM projects p
    LEFT JOIN areas a ON a.id = p.area_id
    LEFT JOIN users u ON u.id = p.creator_id
    WHERE p.company_id = ?
      AND p.id = ?
    LIMIT 1
    `,
    [companyId, projectId]
  );

  if (!rows.length) return null;

  const row = rows[0];
  const mapped = mapRow(row);
  mapped.creator_name = row.creator_name || null;
  return mapped;
}

// ===============================
// Crear proyecto
// ===============================
async function create({
  companyId,
  areaId,
  teamId = null,
  creatorId,
  name,
  description,
  status,
  startDate,
  endDate
}) {
  const [result] = await pool.query(
    `
    INSERT INTO projects
      (company_id, area_id, team_id, creator_id, name, description, status, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      companyId,
      areaId || null,
      teamId,
      creatorId,
      name,
      description || '',
      status || 'active',
      startDate || null,
      endDate || null
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

async function getAllByCompanyAndCreator(companyId, creatorId) {
  const [rows] = await pool.query(
    `SELECT
       id,
       company_id,
       area_id,
       creator_id,
       name,
       description,
       status,
       start_date,
       end_date,
       created_at
     FROM projects
     WHERE company_id = ?
       AND creator_id = ?
     ORDER BY created_at DESC`,
    [companyId, creatorId]
  );
  return rows;
}

async function createAutoProjectForMember({
  companyId,
  areaId,
  teamId = null,
  creatorId,
  name,
  description
}) {
  const [result] = await pool.query(
    `
    INSERT INTO projects (
      company_id,
      area_id,
      team_id,
      creator_id,
      name,
      description,
      status,
      start_date,
      end_date
    )
    VALUES (?, ?, ?, ?, ?, ?, 'active', CURDATE(), NULL)
    `,
    [
      companyId,
      areaId || null,
      teamId,
      creatorId,
      name,
      description || ''
    ]
  );

  const projectId = result.insertId;

  const [rows] = await pool.query(
    `
    SELECT
      id,
      company_id,
      area_id,
      team_id,
      creator_id,
      name,
      description,
      status,
      start_date,
      end_date,
      created_at
    FROM projects
    WHERE id = ?
    `,
    [projectId]
  );

  return rows[0];
}

// Proyectos donde el usuario participa (asignado en tareas, creador de tareas o creador del proyecto)
async function getProjectsByParticipation(companyId, userId) {
  const [rows] = await pool.query(
    `
    SELECT DISTINCT
      p.id,
      p.company_id,
      p.area_id,
      p.creator_id,
      p.name,
      p.description,
      p.status,
      p.start_date,
      p.end_date,
      p.created_at
    FROM projects p
    LEFT JOIN tasks t
      ON t.project_id = p.id
      AND t.company_id = p.company_id
    LEFT JOIN task_assignments ta
      ON ta.task_id = t.id
    WHERE
      p.company_id = ?
      AND (
        ta.user_id   = ?
        OR t.creator_id = ?
        OR p.creator_id = ?
      )
    ORDER BY p.created_at DESC
    `,
    [companyId, userId, userId, userId]
  );

  return rows;
}

// Proyectos donde el usuario participa (versión con subconsultas IN)
async function getProjectsByParticipationSubquery(companyId, userId) {
  const [rows] = await pool.query(
    `
    SELECT DISTINCT
      p.id,
      p.company_id,
      p.area_id,
      p.creator_id,
      p.name,
      p.description,
      p.status,
      p.start_date,
      p.end_date,
      p.created_at
    FROM projects p
    WHERE
      p.company_id = ?
      AND (
        p.id IN (
          SELECT t.project_id
          FROM tasks t
          WHERE
            t.company_id = ?
            AND (
              t.id IN (
                SELECT ta.task_id
                FROM task_assignments ta
                WHERE ta.user_id = ?
              )
              OR t.creator_id = ?
            )
        )
        OR p.creator_id = ?
      )
    ORDER BY p.created_at DESC
    `,
    [companyId, companyId, userId, userId, userId]
  );

  return rows;
}

module.exports = {
  getAllByCompany,
  getAllByCompanyAndArea,
  getById,
  create,
  update,
  getAllByCompanyAndCreator,
  createAutoProjectForMember,
  getProjectsByParticipation,
  getProjectsByParticipationSubquery
};