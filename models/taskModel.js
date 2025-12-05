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
// Tareas asignadas a un usuario (por company), con info de proyecto / team / área / supervisor
async function getByAssignee(userId, companyId) {
  const [rows] = await pool.query(
    `SELECT
       t.*,
       ta.user_id AS assignee_id,
       p.name         AS project_name,
       u_creator.name AS creator_name,
       r.name         AS creator_role_name
     FROM task_assignments ta
     INNER JOIN tasks t
       ON t.id = ta.task_id
     LEFT JOIN projects p
       ON p.id = t.project_id
     LEFT JOIN users u_creator
       ON u_creator.id = t.creator_id
     LEFT JOIN roles r
       ON r.id = u_creator.role_id
     WHERE
       ta.user_id   = ?
       AND t.company_id = ?
     ORDER BY t.created_at DESC`,
    [userId, companyId]
  );

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

async function getByCompanyAndArea(companyId, areaId) {
  const [rows] = await pool.query(
    `
    SELECT 
      t.id,
      t.title,
      t.status,
      t.project_id,
      p.name AS project_name,
      u.name AS assignee_name
    FROM tasks t
    LEFT JOIN projects p       ON p.id = t.project_id
    INNER JOIN task_assignments ta ON ta.task_id = t.id
    INNER JOIN users u             ON u.id = ta.user_id
    WHERE 
      t.company_id = ?
      AND u.area_id = ?
      AND u.status = 'active'
      AND t.status IN ('pending', 'in_progress', 'review', 'done')
    ORDER BY t.created_at DESC
    `,
    [companyId, areaId]
  );

  return rows;
}

// ===============================
// Obtener todas las tareas de una compañía (para admin)
// ===============================
async function getAllByCompany(companyId) {
  const [rows] = await pool.query(
    `
    SELECT
      t.*,
      p.name AS project_name
    FROM tasks t
    LEFT JOIN projects p
      ON p.id = t.project_id
    WHERE t.company_id = ?
    ORDER BY t.created_at DESC
    `,
    [companyId]
  );

  return rows;
}

module.exports = {
  createTask,
  addAssignments,
  getActiveUserIdsByTeam,
  getActiveUserIdsByArea,
  filterUserIdsByCompanyAndArea,
  getByAssignee,
  updateStatus,
  getByCompanyAndArea,
  getAllByCompany
};
