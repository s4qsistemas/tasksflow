// models/taskCommitModel.js
const { pool } = require('../config/db');

// ===============================
// Listar commits de una tarea
// ===============================
/**
 * Listar commits de una tarea
 * Usado por: GET /api/tasks/:id/commits
 * main.js → loadTaskCommits(taskId)
 */
async function listarPorTarea(taskId) {
  const sql = `
    SELECT 
      tc.id,
      tc.task_id,
      tc.author_id,
      tc.message,
      tc.from_status,
      tc.to_status,
      tc.created_at,
      u.name AS author_name
    FROM task_commits tc
    LEFT JOIN users u ON u.id = tc.author_id
    WHERE tc.task_id = ?
    ORDER BY tc.created_at DESC, tc.id DESC
  `;

  const [rows] = await pool.query(sql, [taskId]);
  return rows;
}

/**
 * Crear un nuevo commit
 * Usado por: POST /api/tasks/:id/commits
 * main.js → formNuevoCommit (postForm)
 *
 * OJO: el controller le pasa user_id = req.user.id,
 * aquí lo mapeamos a author_id porque así se llama la columna.
 */
async function crearCommit({ task_id, user_id, message, from_status, to_status }) {
  const sql = `
    INSERT INTO task_commits (task_id, author_id, message, from_status, to_status, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
  `;

  const [result] = await pool.query(sql, [
    task_id,
    user_id,                 // → author_id
    message || '',
    from_status || null,
    to_status || null
  ]);

  return { id: result.insertId };
}

/**
 * Actualizar estado de la tarea en la tabla tasks
 * Usado opcionalmente desde el controller de commits
 */
async function actualizarEstadoTarea(taskId, nuevoEstado) {
  const sql = `
    UPDATE tasks
    SET status = ?, updated_at = NOW()
    WHERE id = ?
  `;

  await pool.query(sql, [nuevoEstado, taskId]);
}

module.exports = {
  listarPorTarea,
  crearCommit,
  actualizarEstadoTarea
};