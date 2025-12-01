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

/**
 * Obtiene las tareas asignadas a un usuario (por su userId).
 * Opcionalmente filtra por companyId para mayor seguridad.
 */
async function getByAssignee(userId, companyId = null) {
  const params = [userId];

  let sql = `
    SELECT
      t.id,
      t.company_id,
      t.project_id,
      t.title,
      t.description,
      t.status,
      t.priority,
      t.deadline,
      t.creator_id,
      ta.assigned_at
    FROM task_assignments ta
    INNER JOIN tasks t ON ta.task_id = t.id
    WHERE ta.user_id = ?
  `;

  if (companyId) {
    sql += ' AND t.company_id = ?';
    params.push(companyId);
  }

  sql += ' ORDER BY ta.assigned_at DESC';

  const [rows] = await pool.query(sql, params);
  return rows;
}

async function updateStatus(taskId, status, companyId, userId) {
  // Opcional: verificar que la tarea le pertenece al usuario o está asignada a él.
  const [result] = await pool.query(
    `
      UPDATE tasks
      SET status = ?
      WHERE id = ? AND company_id = ?
    `,
    [status, taskId, companyId]
  );

  return result.affectedRows; // 0 = no actualizó, 1 = ok
}

module.exports = {
  createTask,
  addAssignments,
  getActiveUserIdsByTeam,
  getActiveUserIdsByArea,
  filterUserIdsByCompanyAndArea,
  getByAssignee,
  updateStatus
};
