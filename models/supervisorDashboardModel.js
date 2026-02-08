// models/supervisorDashboardModel.js
const { pool } = require('../config/db');

/**
 * Obtiene los IDs de trabajadores a cargo del supervisor actual
 */
async function getTeamUserIds(companyId, supervisorId) {
  const [rows] = await pool.query(
    `SELECT id
       FROM users
      WHERE company_id = ?
        AND manager_id = ?
        AND role_id = 4
        AND status = 'active'`,
    [companyId, supervisorId]
  );
  return rows.map(r => r.id);
}

/**
 * KPIs generales del equipo
 */
async function getSupervisorMetrics(companyId, supervisorId) {
  const teamIds = await getTeamUserIds(companyId, supervisorId);
  if (!teamIds.length) {
    return { tasksOpen: 0, tasksOverdue: 0, completionLast7d: 0 };
  }

  // Tareas abiertas = pending + in_progress
  const [openRows] = await pool.query(
    `SELECT COUNT(DISTINCT t.id) AS cnt
       FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
      WHERE t.company_id = ?
        AND ta.user_id IN (?)
        AND t.status IN ('pending', 'in_progress')`,
    [companyId, teamIds]
  );
  const tasksOpen = openRows[0]?.cnt || 0;

  // Tareas vencidas = deadline pasado y no done
  const [overRows] = await pool.query(
    `SELECT COUNT(DISTINCT t.id) AS cnt
       FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
      WHERE t.company_id = ?
        AND ta.user_id IN (?)
        AND t.status IN ('pending','in_progress','review')
        AND t.deadline IS NOT NULL
        AND t.deadline < NOW()`,
    [companyId, teamIds]
  );
  const tasksOverdue = overRows[0]?.cnt || 0;

  // % cierre últimos 7 días (tareas de mi equipo que pasaron a done)
  const [doneRows] = await pool.query(
    `SELECT COUNT(DISTINCT t.id) AS cnt
       FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
       JOIN task_commits tc ON tc.task_id = t.id
      WHERE t.company_id = ?
        AND ta.user_id IN (?)
        AND tc.to_status = 'done'
        AND tc.created_at >= (NOW() - INTERVAL 7 DAY)`,
    [companyId, teamIds]
  );
  const closedLast7d = doneRows[0]?.cnt || 0;

  // Total tareas tocadas últimos 7 días (para calcular porcentaje)
  const [allLast7dRows] = await pool.query(
    `SELECT COUNT(DISTINCT t.id) AS cnt
       FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
       JOIN task_commits tc ON tc.task_id = t.id
      WHERE t.company_id = ?
        AND ta.user_id IN (?)
        AND tc.created_at >= (NOW() - INTERVAL 7 DAY)`,
    [companyId, teamIds]
  );
  const allLast7d = allLast7dRows[0]?.cnt || 0;

  const completionLast7d =
    allLast7d > 0 ? Math.round((closedLast7d * 100) / allLast7d) : 0;

  return { tasksOpen, tasksOverdue, completionLast7d };
}

/**
 * Carga por persona del equipo
 */
async function getTeamLoad(companyId, supervisorId) {
  const [rows] = await pool.query(
    `SELECT
        u.id,
        u.name,
        SUM(t.status IN ('pending','in_progress'))          AS tasksOpen,
        SUM(t.status = 'in_progress')                       AS tasksInProgress,
        SUM(
          t.status IN ('pending','in_progress','review')
          AND t.deadline IS NOT NULL
          AND t.deadline < NOW()
        ) AS tasksOverdue
     FROM users u
     LEFT JOIN task_assignments ta ON ta.user_id = u.id
     LEFT JOIN tasks t ON t.id = ta.task_id
    WHERE u.company_id = ?
      AND u.manager_id = ?
      AND u.role_id = 4
    GROUP BY u.id, u.name
    ORDER BY u.name`,
    [companyId, supervisorId]
  );

  return rows;
}

/**
 * Tareas del equipo para HOY
 */
async function getTodayTasks(companyId, supervisorId) {
  const [rows] = await pool.query(
    `SELECT
        t.id,
        t.title,
        t.status,
        DATE_FORMAT(t.deadline, '%d-%m-%Y %H:%i') AS due_human,
        u.name AS assignee_name
     FROM tasks t
     JOIN task_assignments ta ON ta.task_id = t.id
     JOIN users u ON u.id = ta.user_id
    WHERE t.company_id = ?
      AND u.manager_id = ?
      AND DATE(t.deadline) = CURDATE()
    ORDER BY t.deadline ASC`,
    [companyId, supervisorId]
  );

  return rows;
}

/**
 * "Periodicidad": la reinterpretamos como horizonte de plazo
 * daily    -> vencen hoy
 * weekly   -> en los próximos 7 días
 * monthly  -> en los próximos 30 días
 */
async function getTeamDeadlineHorizon(companyId, supervisorId) {
  const [rows] = await pool.query(
    `SELECT
        SUM(DATE(t.deadline) = CURDATE())                               AS daily,
        SUM(DATE(t.deadline) > CURDATE()
            AND t.deadline <= (NOW() + INTERVAL 7 DAY))                  AS weekly,
        SUM(DATE(t.deadline) > (CURDATE() + INTERVAL 7 DAY)
            AND t.deadline <= (NOW() + INTERVAL 30 DAY))                 AS monthly
     FROM tasks t
     JOIN task_assignments ta ON ta.task_id = t.id
     JOIN users u ON u.id = ta.user_id
    WHERE t.company_id = ?
      AND u.manager_id = ?
      AND t.status IN ('pending','in_progress','review')`,
    [companyId, supervisorId]
  );

  const r = rows[0] || {};
  return {
    daily: Number(r.daily || 0),
    weekly: Number(r.weekly || 0),
    monthly: Number(r.monthly || 0)
  };
}

/**
 * Próximas tareas (7 días) como "upcomingRecurring"
 */
async function getUpcomingTasks7d(companyId, supervisorId) {
  const [rows] = await pool.query(
    `SELECT
        t.id,
        t.title,
        u.name AS assignee_name,
        DATE_FORMAT(t.deadline, '%d-%m-%Y %H:%i') AS next_run_human
     FROM tasks t
     JOIN task_assignments ta ON ta.task_id = t.id
     JOIN users u ON u.id = ta.user_id
    WHERE t.company_id = ?
      AND u.manager_id = ?
      AND t.status IN ('pending','in_progress','review')
      AND t.deadline IS NOT NULL
      AND t.deadline > NOW()
      AND t.deadline <= (NOW() + INTERVAL 7 DAY)
    ORDER BY t.deadline ASC
    LIMIT 10`,
    [companyId, supervisorId]
  );
  return rows;
}

/**
 * Alertas tácticas sencillas en base a la carga
 */
function buildTacticalAlerts(stats, teamLoad) {
  const alerts = [];

  if (stats.tasksOverdue > 0) {
    alerts.push({
      title: 'Tareas vencidas en el equipo',
      detail: `Hay ${stats.tasksOverdue} tareas vencidas asignadas a tu equipo. Revisa la tabla de carga por persona.`
    });
  }

  teamLoad
    .filter(u => (u.tasksOverdue || 0) >= 3)
    .forEach(u => {
      alerts.push({
        title: `Sobrecarga de ${u.name}`,
        detail: `${u.name} tiene ${u.tasksOverdue} tareas vencidas y ${u.tasksOpen} abiertas. Evalúa re-asignar o apoyar.`
      });
    });

  if (!alerts.length) {
    alerts.push({
      title: 'Sin alertas críticas',
      detail: 'La carga del equipo está razonablemente distribuida y sin grandes atrasos.'
    });
  }

  return alerts;
}

/**
 * Tareas para el Kanban del supervisor, agrupadas por status
 */
async function getKanbanTasks(companyId, supervisorId) {
  const [rows] = await pool.query(
    `SELECT
        t.id,
        t.title,
        t.priority,
        t.status,
        t.project_id,
        p.name AS project_name,
        u.name AS assignee_name
     FROM tasks t
     JOIN task_assignments ta ON ta.task_id = t.id
     JOIN users u ON u.id = ta.user_id
     LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.company_id = ?
      AND u.manager_id = ?
    ORDER BY t.status, t.deadline IS NULL, t.deadline`,
    [companyId, supervisorId]
  );

  const grouped = {
    pending: [],
    in_progress: [],
    review: [],
    done: []
  };

  rows.forEach(t => {
    if (!grouped[t.status]) grouped[t.status] = [];
    grouped[t.status].push(t);
  });

  return grouped;
}

/**
 * Proyectos donde participa el equipo del supervisor
 */
async function getUserProjects(companyId, supervisorId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT
        p.id,
        p.name
     FROM projects p
     JOIN tasks t ON t.project_id = p.id
     JOIN task_assignments ta ON ta.task_id = t.id
     JOIN users u ON u.id = ta.user_id
    WHERE p.company_id = ?
      AND u.manager_id = ?
    ORDER BY p.name`,
    [companyId, supervisorId]
  );
  return rows;
}

module.exports = {
  getSupervisorMetrics,
  getTeamLoad,
  getTodayTasks,
  getTeamDeadlineHorizon,
  getUpcomingTasks7d,
  buildTacticalAlerts,
  getKanbanTasks,
  getUserProjects
};
