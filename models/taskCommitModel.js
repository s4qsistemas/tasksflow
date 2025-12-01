// models/taskCommitModel.js
const { pool } = require('../config/db');

// 🔹 Obtener commits de una tarea (con nombre del autor)
async function listarPorTarea(taskId) {
  const [rows] = await pool.query(
    `
      SELECT
        tc.id,
        tc.task_id,
        tc.author_id,
        u.name AS author_name,
        tc.message,
        tc.from_status,
        tc.to_status,
        tc.created_at
      FROM task_commits tc
      INNER JOIN users u ON u.id = tc.author_id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at DESC, tc.id DESC
    `,
    [taskId]
  );

  return rows;
}

// 🔹 Crear un commit para una tarea
async function crearCommit({ taskId, authorId, message, fromStatus, toStatus }) {
  const [result] = await pool.query(
    `
      INSERT INTO task_commits (task_id, author_id, message, from_status, to_status)
      VALUES (?, ?, ?, ?, ?)
    `,
    [taskId, authorId, message, fromStatus || null, toStatus || null]
  );

  const insertId = result.insertId;

  // Devolvemos el commit recién creado, con nombre del autor
  const [rows] = await pool.query(
    `
      SELECT
        tc.id,
        tc.task_id,
        tc.author_id,
        u.name AS author_name,
        tc.message,
        tc.from_status,
        tc.to_status,
        tc.created_at
      FROM task_commits tc
      INNER JOIN users u ON u.id = tc.author_id
      WHERE tc.id = ?
    `,
    [insertId]
  );

  return rows[0];
}

// 🔹 Actualizar estado de una tarea (cuando el commit incluye cambio de estado)
async function actualizarEstadoTarea(taskId, newStatus) {
  if (!newStatus) return;

  await pool.query(
    `
      UPDATE tasks
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [newStatus, taskId]
  );
}

module.exports = {
  listarPorTarea,
  crearCommit,
  actualizarEstadoTarea
};