// models/taskModel.js
// Lógica de acceso a datos para tareas y asignaciones

const { pool } = require('../config/db');

/**
 * Crea una tarea base en la tabla tasks.
 * Devuelve el ID autogenerado.
 */
async function createTask({
  companyId,
  projectId = null,
  title,
  description = null,
  status = 'pending',
  priority = 'normal',
  deadline = null,
  creatorId
}) {
  const [result] = await pool.query(
    `
    INSERT INTO tasks (
      company_id,
      project_id,
      title,
      description,
      status,
      priority,
      deadline,
      creator_id
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      companyId,
      projectId || null,
      title,
      description || null,
      status || 'pending',
      priority || 'normal',
      deadline,
      creatorId
    ]
  );

  return result.insertId;
}

/**
 * Inserta asignaciones en task_assignments para una lista de usuarios.
 */
async function addAssignments(taskId, userIds = []) {
  if (!userIds || !userIds.length) return;

  const values = userIds.map((uid) => [taskId, uid]);
  await pool.query(
    `
    INSERT INTO task_assignments (task_id, user_id)
    VALUES ?
    `,
    [values]
  );
}

/**
 * Obtiene IDs de usuarios activos de un TEAM (para admin).
 */
async function getActiveUserIdsByTeam(teamId, companyId) {
  const [rows] = await pool.query(
    `
    SELECT u.id
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    WHERE tm.team_id = ?
      AND u.company_id = ?
      AND u.status = 'active'
    `,
    [teamId, companyId]
  );
  return rows.map((r) => r.id);
}

/**
 * Obtiene IDs de usuarios activos de un área (para admin).
 */
async function getActiveUserIdsByArea(areaId, companyId) {
  const [rows] = await pool.query(
    `
    SELECT u.id
    FROM users u
    WHERE u.company_id = ?
      AND u.area_id = ?
      AND u.status = 'active'
    `,
    [companyId, areaId]
  );
  return rows.map((r) => r.id);
}

/**
 * Filtra una lista de IDs dejando solo usuarios activos de MISMA company.
 * Opcionalmente, misma área (para supervisores).
 */
async function filterUserIdsByCompanyAndArea(userIds, companyId, areaId = null) {
  if (!userIds || !userIds.length) return [];

  const [rows] = await pool.query(
    `
    SELECT u.id
    FROM users u
    WHERE u.company_id = ?
      AND u.status = 'active'
      AND u.id IN (?)
      ${areaId ? 'AND u.area_id = ?' : ''}
    `,
    areaId ? [companyId, userIds, areaId] : [companyId, userIds]
  );

  return rows.map((r) => r.id);
}

module.exports = {
  createTask,
  addAssignments,
  getActiveUserIdsByTeam,
  getActiveUserIdsByArea,
  filterUserIdsByCompanyAndArea
};
