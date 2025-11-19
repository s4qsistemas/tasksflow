const {
  Roles, getUserById, getUsersByArea, getUsersByTeam,
  getAdminScopeUserIds, listTasksVisibleTo, createTask, addAssignments,
  getTask, updateTask, createCommit, getTaskCommits, logAudit, pool
} = require('../models/models');

// ===== Auth mínima DEMO =====
async function login(req, res) {
  const { email, password } = req.body;
  const user = await require('../models/models').getUserByEmail(email);
  if (!user || user.password !== password) return res.status(401).json({ message: 'Credenciales inválidas' });
  return res.json({ user: { id: user.id, name: user.name, role: user.role_name, area_id: user.area_id } });
}

// ===== Crea auto‑tarea (todos los roles) =====
async function createPersonalTask(req, res) {
  const user = req.user;
  const { title, description, visibility_scope = 'private', due_at = null, message = 'create personal' } = req.body;

  const taskId = await createTask({
    title, description, creatorId: user.id, isPersonal: true, visibilityScope: visibility_scope, dueAt: due_at
  });
  await addAssignments(taskId, [user.id]);

  const task = await getTask(taskId);
  await createCommit({ taskId, authorId: user.id, message, changes: {}, snapshot: task });
  await logAudit(taskId, user.id, 'create_personal', { visibility_scope });

  res.status(201).json({ task });
}

// ===== Crea tarea dirigida (individuos / área / equipo) =====
async function createDirectedTask(req, res) {
  const user = req.user;
  const { title, description, due_at = null, user_ids = [], area_id = null, team_id = null, message = 'create directed' } = req.body;

  if (user.role_name === Roles.USER) return res.status(403).json({ message: 'No autorizado para asignar a otros' });

  let targets = [...new Set(user_ids)];
  if (area_id) targets = [...new Set([...targets, ...(await getUsersByArea(area_id))])];
  if (team_id) targets = [...new Set([...targets, ...(await getUsersByTeam(team_id))])];

  // Supervisor: solo su área
  if (user.role_name === Roles.SUPERVISOR) {
    const allowed = new Set(await getUsersByArea(user.area_id));
    targets = targets.filter(t => allowed.has ? allowed.has(t) : allowed.includes(t));
  }
  // Admin: solo su cadena (supervisores y equipos de esos supervisores)
  if (user.role_name === Roles.ADMIN) {
    const allowedIds = new Set(await getAdminScopeUserIds(user.id));
    targets = targets.filter(t => allowedIds.has ? allowedIds.has(t) : allowedIds.includes(t));
  }

  if (!targets.length) return res.status(400).json({ message: 'No hay destinatarios válidos en tu alcance' });

  const taskId = await createTask({
    title, description, creatorId: user.id, isPersonal: false, visibilityScope: 'org', dueAt: due_at
  });
  await addAssignments(taskId, targets);

  const task = await getTask(taskId);
  await createCommit({ taskId, authorId: user.id, message, changes: { assignees: targets }, snapshot: task });
  await logAudit(taskId, user.id, 'create_directed', { targets_count: targets.length });

  res.status(201).json({ task });
}

// ===== Listado visible según rol =====
async function listMyTasks(req, res) {
  const user = req.user;
  const rows = await listTasksVisibleTo(user);
  res.json({ tasks: rows });
}

// ===== Actualizar vía commit (PATCH genérico) =====
async function patchTask(req, res) {
  const user = req.user;
  const taskId = Number(req.params.id);
  const task = await getTask(taskId);
  if (!task) return res.status(404).json({ message: 'No encontrada' });

  const { title, description, status, visibility_scope, due_at, message = 'update' } = req.body;

  const isCreator = task.creator_id === user.id;
  const isAdminLike = [Roles.ROOT, Roles.ADMIN].includes(user.role_name);
  if (task.is_personal && !isAdminLike && !isCreator) {
    return res.status(403).json({ message: 'No autorizado (auto‑tarea ajena)' });
  }
  if (visibility_scope && task.is_personal && !['private','supervisor'].includes(visibility_scope)) {
    return res.status(400).json({ message: 'Visibilidad inválida para auto‑tarea' });
  }

  const changes = {};
  if (title !== undefined) changes.title = title;
  if (description !== undefined) changes.description = description;
  if (status !== undefined) changes.status = status;
  if (visibility_scope !== undefined) changes.visibility_scope = visibility_scope;
  if (due_at !== undefined) changes.due_at = due_at;

  const snap = await updateTask(taskId, changes);
  await createCommit({ taskId, authorId: user.id, message, changes, snapshot: snap });
  await logAudit(taskId, user.id, 'update_task', changes);

  res.json({ ok: true });
}

// ===== Cambiar estado (Drag&Drop) =====
async function updateTaskStatus(req, res) {
  const user = req.user;
  const id = Number(req.params.id);
  const { status, message = 'status change' } = req.body;
  const allowed = ['pending','in_progress','review','done'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Estado inválido' });

  const snap = await updateTask(id, { status });
  await createCommit({ taskId: id, authorId: user.id, message, changes: { status }, snapshot: snap });
  await logAudit(id, user.id, 'status_changed', { status });

  res.json({ ok: true });
}

// ===== Historial de commits =====
async function listTaskCommits(req, res) {
  const taskId = Number(req.params.id);
  const commits = await getTaskCommits(taskId);
  res.json({ commits });
}

// ===== Revert a un commit =====
async function revertTaskToCommit(req, res) {
  const user = req.user;
  const taskId = Number(req.params.id);
  const { hash, message = 'revert' } = req.body;

  const commits = await getTaskCommits(taskId);
  const target = commits.find(c => c.hash === hash);
  if (!target) return res.status(404).json({ message: 'Commit no encontrado' });

  const snapshot = JSON.parse(target.snapshot);
  const { title, description, status, visibility_scope, due_at } = snapshot;
  const snap = await updateTask(taskId, { title, description, status, visibility_scope, due_at });
  await createCommit({ taskId, authorId: user.id, message, changes: { revert_to: hash }, snapshot: snap });

  res.json({ ok: true });
}

// ===== Tablero =====
async function renderDashboard(req, res, next) {
  try {
    const user = req.user;
    const tasks = await listTasksVisibleTo(user);
    const cols = { pending: [], in_progress: [], review: [], done: [] };
    tasks.forEach(t => (cols[t.status] || (cols[t.status] = [])).push(t));
    res.render('dashboard', { title: 'Tablero', user, cols });
  } catch (e) { next(e); }
}

// ===== Resumen para gráfica =====
async function getSummary(req, res) {
  const user = req.user;
  let where = '1=1';
  let args = [];

  if (user.role_name === Roles.ADMIN) {
    const scopeIds = await getAdminScopeUserIds(user.id);
    if (!scopeIds.length) {
      where = `t.creator_id = ?`;
      args = [user.id];
    } else {
      where = `
        t.creator_id = ?
        OR EXISTS(SELECT 1 FROM task_assignments ta WHERE ta.task_id=t.id AND ta.user_id IN (?))
        OR (t.is_personal=1 AND t.visibility_scope IN ('supervisor','area','org')
            AND EXISTS(SELECT 1 FROM task_assignments ta WHERE ta.task_id=t.id AND ta.user_id IN (?)))
      `;
      args = [user.id, scopeIds, scopeIds];
    }
  } else if (user.role_name === Roles.SUPERVISOR) {
    where = `
      t.creator_id = ? OR EXISTS(
        SELECT 1 FROM task_assignments ta JOIN users au ON au.id=ta.user_id
        WHERE ta.task_id=t.id AND au.area_id = ?
      ) OR (
        t.is_personal=1 AND t.visibility_scope='supervisor' AND EXISTS(
          SELECT 1 FROM task_assignments ta JOIN users au ON au.id=ta.user_id
          WHERE ta.task_id=t.id AND au.area_id = ?
        )
      )`;
    args = [user.id, user.area_id, user.area_id];
  } else if (user.role_name === Roles.USER) {
    where = `t.creator_id = ? OR EXISTS(SELECT 1 FROM task_assignments ta WHERE ta.task_id=t.id AND ta.user_id=?)`;
    args = [user.id, user.id];
  }

  const [rows] = await pool.query(
    `SELECT
      SUM(t.status='pending') AS pending,
      SUM(t.status='in_progress') AS in_progress,
      SUM(t.status='review') AS review,
      SUM(t.status='done') AS done,
      SUM(t.is_personal=1) AS personal,
      SUM(t.is_personal=0) AS directed
     FROM tasks t
     WHERE ${where}`, args
  );
  res.json({ summary: rows[0] || {} });
}

module.exports = {
  login,
  createPersonalTask,
  createDirectedTask,
  listMyTasks,
  patchTask,
  updateTaskStatus,
  listTaskCommits,
  revertTaskToCommit,
  renderDashboard,
  getSummary
};