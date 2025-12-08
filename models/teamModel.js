// models/teamModel.js
const { pool } = require('../config/db');

// ===============================
// TEAMS
// ===============================

async function listarTeamsPorCompany(companyId) {
  const [rows] = await pool.query(
    `
    SELECT id, company_id, name, description, type, status, created_at
    FROM teams
    WHERE company_id = ?
    ORDER BY created_at DESC
    `,
    [companyId]
  );
  return rows;
}

async function obtenerTeamPorId(id, companyId) {
  const [rows] = await pool.query(
    `
    SELECT id, company_id, name, description, type, status, created_at
    FROM teams
    WHERE id = ? AND company_id = ?
    LIMIT 1
    `,
    [id, companyId]
  );
  return rows[0] || null;
}

async function crearTeam({ company_id, name, description, type, status }) {
  const [result] = await pool.query(
    `
    INSERT INTO teams (company_id, name, description, type, status)
    VALUES (?, ?, ?, ?, ?)
    `,
    [company_id, name, description || null, type || 'other', status || 'active']
  );
  return result.insertId;
}

async function actualizarTeam(id, companyId, { name, description, type, status }) {
  const [result] = await pool.query(
    `
    UPDATE teams
    SET name = ?, description = ?, type = ?, status = ?
    WHERE id = ? AND company_id = ?
    `,
    [name, description || null, type || 'other', status || 'active', id, companyId]
  );
  return result.affectedRows > 0;
}

// ===============================
// MEMBERS
// ===============================

async function listarMiembrosTeam(teamId, companyId) {
  const [rows] = await pool.query(
    `
    SELECT 
      tm.team_id,
      tm.user_id,
      tm.role_in_team,
      u.name,
      u.email,
      u.role_id,
      u.area_id,
      u.status
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    JOIN users u ON u.id = tm.user_id
    WHERE tm.team_id = ? AND t.company_id = ?
    ORDER BY u.name
    `,
    [teamId, companyId]
  );
  return rows;
}

async function agregarMiembroTeam(teamId, companyId, userId, roleInTeam = 'member') {
  // Validar que el team pertenece a la company del admin
  const team = await obtenerTeamPorId(teamId, companyId);
  if (!team) return false;

  await pool.query(
    `
    INSERT IGNORE INTO team_members (team_id, user_id, role_in_team)
    VALUES (?, ?, ?)
    `,
    [teamId, userId, roleInTeam]
  );
  return true;
}

async function quitarMiembroTeam(teamId, companyId, userId) {
  const team = await obtenerTeamPorId(teamId, companyId);
  if (!team) return false;

  const [result] = await pool.query(
    `
    DELETE FROM team_members
    WHERE team_id = ? AND user_id = ?
    `,
    [teamId, userId]
  );
  return result.affectedRows > 0;
}

// ===============================
// Obtener todos los equipos de una compañía
// ===============================
async function getAllByCompany(companyId) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      company_id,
      area_id,
      name,
      status,
      created_at
    FROM teams
    WHERE company_id = ?
    ORDER BY name
    `,
    [companyId]
  );

  return rows;
}

async function getContextoMiembro(teamId, userId, companyId) {
  const [rows] = await pool.query(
    `
    SELECT
      tm.team_id,
      tm.user_id,
      tm.role_in_team,
      u.id         AS user_id_real,
      u.name       AS user_name,
      u.company_id,
      u.area_id,
      t.name       AS team_name,
      t.status     AS team_status
    FROM team_members tm
    INNER JOIN users u ON tm.user_id = u.id
    INNER JOIN teams t ON t.id = tm.team_id
    WHERE tm.team_id   = ?
      AND tm.user_id   = ?
      AND u.company_id = ?
    LIMIT 1
    `,
    [teamId, userId, companyId]
  );

  return rows[0] || null;
}

module.exports = {
  listarTeamsPorCompany,
  obtenerTeamPorId,
  crearTeam,
  actualizarTeam,
  listarMiembrosTeam,
  agregarMiembroTeam,
  quitarMiembroTeam,
  getAllByCompany,
  getContextoMiembro
};
