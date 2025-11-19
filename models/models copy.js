const crypto = require('crypto');
const { pool } = require('../config/db');

const Roles = Object.freeze({
  ROOT: 'root',
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  USER: 'user'
});

// ===== Utilidades de alcance =====
async function getUserById(id) {
  const [rows] = await pool.query(
    `SELECT u.*, r.name AS role_name, a.name AS area_name
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     LEFT JOIN areas a ON a.id = u.area_id
     WHERE u.id = ?`, [id]
  );
  return rows[0] || null;
}

async function getUserByEmail(email) {
  const [rows] = await pool.query(
    'SELECT u.*, r.name AS role_name, a.name AS area_name FROM users u LEFT JOIN roles r ON r.id=u.role_id LEFT JOIN areas a ON a.id=u.area_id WHERE email=?',
    [email]
  );
  return rows[0] || null;
}

async function getDirectReports(managerId) {
  const [rows] = await pool.query(`SELECT id FROM users WHERE manager_id = ?`, [managerId]);
  return rows.map(r => r.id);
}

async function getAdminScopeUserIds(adminId) {
  const supervisors = await getDirectReports(adminId);
  if (!supervisors.length) return [];
  const [rows] = await pool.query(`SELECT id FROM users WHERE manager_id IN (?)`, [supervisors]);
  const techs = rows.map(r => r.id);
  return [...new Set([...supervisors, ...techs])];
}

async function getUsersByArea(areaId) {
  const [rows] = await pool.query(`SELECT id FROM users WHERE area_id=?`, [areaId]);
  return rows.map(r => r.id);
}

async function getUsersByTeam(teamId) {
  const [rows] = await pool.query(`SELECT user_id AS id FROM team_members WHERE team_id=?`, [teamId]);
  return rows.map(r => r.id);
}

// ===== Tareas y commits estilo Git =====
function sha256(str) { return crypto.createHash('sha256').update(str).digest('hex'); }

async function latestCommitForTask(taskId) {
  const [rows] = await pool.query(
    `SELECT * FROM task_commits WHERE task_id=? ORDER BY id DESC LIMIT 1`, [taskId]
  );
  return rows[0] || null;
}

async function createCommit({ taskId, authorId, message, changes = {}, snapshot = null }) {
  const parent = await latestCommitForTask(taskId);
  const parentHash = parent ? parent.hash : null;
  const payload = JSON.stringify({ taskId, authorId, message, changes, parentHash, ts: Date.now() });
  const hash = sha256(payload);
  await pool.query(
    `INSERT INTO task_commits (task_id, hash, parent_hash, author_id, message, changes, snapshot)
     VALUES (?,?,?,?,?,?,?)`,
    [taskId, hash, parentHash, authorId, message, JSON.stringify(changes || null), snapshot ? JSON.stringify(snapshot) : null]
  );
  return { hash, parentHash };
}

async function createTask({ title, description, creatorId, isPersonal, visibilityScope, dueAt }) {
  const [res] = await pool.query(
    `INSERT INTO tasks (title, description, creator_id, is_personal, visibility_scope, due_at)
     VALUES (?,?,?,?,?,?)`,
    [title, description || null, creatorId, !!isPersonal, visibilityScope || 'private', dueAt || null]
  );
  const taskId = res.insertId;
  const [rows] = await pool.query(`SELECT * FROM tasks WHERE id=?`, [taskId]);
  await createCommit({
    taskId,
    authorId: creatorId,
    message: 'init',
    changes: { title, description, is_personal: !!isPersonal, visibility_scope: visibilityScope || 'private', due_at: dueAt || null },
    snapshot: rows[0]
  });
  return taskId;
}

async function addAssignments(taskId, userIds = []) {
  if (!userIds.length) return;
  const values = userIds.map(uid => [taskId, uid]);
  await pool.query(`INSERT IGNORE INTO task_assignments (task_id, user_id) VALUES ?`, [values]);
}

async function getTask(taskId) {
  const [[task]] = await pool.query(`SELECT * FROM tasks WHERE id=?`, [taskId]);
  if (!task) return null;
  const [assignees] = await pool.query(
    `SELECT u.id, u.name, u.email, u.area_id FROM task_assignments ta JOIN users u ON u.id=ta.user_id WHERE ta.task_id=?`,
    [taskId]
  );
  task.assignees = assignees;
  return task;
}

async function listTasksVisibleTo(user) {
  if (user.role_name === Roles.ROOT) {
    const [rows] = await pool.query(`
      SELECT t.*, JSON_ARRAYAGG(ta.user_id) AS assignees
      FROM tasks t
      LEFT JOIN task_assignments ta ON ta.task_id=t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);
    return rows;
  }

  if (user.role_name === Roles.ADMIN) {
    const scopeIds = await getAdminScopeUserIds(user.id);
    const [rows] = await pool.query(`
      SELECT DISTINCT t.*
      FROM tasks t
      LEFT JOIN task_assignments ta ON ta.task_id=t.id
      WHERE
        t.creator_id = ?
        OR (ta.user_id IN (?))
        OR (
          t.is_personal = 1
          AND t.visibility_scope IN ('supervisor','area','org')
          AND ta.user_id IN (?)
        )
      ORDER BY t.created_at DESC
    `, [user.id, scopeIds.length ? scopeIds : [-1], scopeIds.length ? scopeIds : [-1]]);
    return rows;
  }

  if (user.role_name === Roles.SUPERVISOR) {
    const [rows] = await pool.query(`
      SELECT DISTINCT t.*
      FROM tasks t
      LEFT JOIN task_assignments ta ON ta.task_id=t.id
      LEFT JOIN users au ON au.id=ta.user_id
      WHERE
        t.creator_id = ? OR ta.user_id = ?
        OR (
          t.is_personal = 1
          AND t.visibility_scope = 'supervisor'
          AND au.area_id = ?
        )
      ORDER BY t.created_at DESC
    `, [user.id, user.id, user.area_id]);
    return rows;
  }

  const [rows] = await pool.query(`
    SELECT DISTINCT t.*
    FROM tasks t
    LEFT JOIN task_assignments ta ON ta.task_id=t.id
    WHERE t.creator_id=? OR ta.user_id=?
    ORDER BY t.created_at DESC
  `, [user.id, user.id]);
  return rows;
}

async function updateTask(taskId, fields = {}) {
  const allowed = ['title', 'description', 'status', 'visibility_scope', 'due_at'];
  const sets = [];
  const args = [];
  for (const k of allowed) {
    if (k in fields) { sets.push(`${k}=?`); args.push(fields[k]); }
  }
  if (!sets.length) return false;
  args.push(taskId);
  await pool.query(`UPDATE tasks SET ${sets.join(', ')} WHERE id=?`, args);
  const [[snap]] = await pool.query(`SELECT * FROM tasks WHERE id=?`, [taskId]);
  return snap;
}

async function logAudit(taskId, actorId, action, payload = null) {
  try {
    await pool.query(`INSERT INTO task_audit (task_id, actor_id, action, payload) VALUES (?,?,?,?)`,
      [taskId, actorId, action, payload ? JSON.stringify(payload) : null]);
  } catch (_) {}
}

async function getTaskCommits(taskId) {
  const [rows] = await pool.query(
    `SELECT * FROM task_commits WHERE task_id=? ORDER BY id DESC`, [taskId]
  );
  return rows;
}

module.exports = {
  Roles,
  pool,
  getUserById,
  getUserByEmail,
  getDirectReports,
  getAdminScopeUserIds,
  getUsersByArea,
  getUsersByTeam,
  createTask,
  addAssignments,
  getTask,
  listTasksVisibleTo,
  updateTask,
  createCommit,
  latestCommitForTask,
  getTaskCommits,
  logAudit,
  sha256
};