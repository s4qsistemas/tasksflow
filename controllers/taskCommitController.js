// controllers/taskCommitController.js
const taskCommitModel = require('../models/taskCommitModel');

// ===============================
// GET /api/tasks/:id/commits
// ===============================
async function listarCommitsPorTarea(req, res) {
  try {
    const taskId = parseInt(req.params.id, 10);

    if (!taskId) {
      return res.json({
        ok: false,
        message: 'ID de tarea inválido'
      });
    }

    const commits = await taskCommitModel.listarPorTarea(taskId);

    return res.json({
      ok: true,
      data: commits
    });
  } catch (err) {
    console.error('Error listarCommitsPorTarea:', err);
    return res.json({
      ok: false,
      message: 'Error al obtener commits de la tarea'
    });
  }
}

// ===============================
// POST /api/tasks/:id/commits
// ===============================
async function crearCommitParaTarea(req, res) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const { message, from_status, to_status } = req.body;
    const userId = req.user.id;

    if (!taskId) {
      return res.json({
        ok: false,
        message: 'ID de tarea inválido'
      });
    }

    // 1) Guardar commit en la tabla task_commits
    await taskCommitModel.crearCommit({
      task_id: taskId,
      user_id: userId,
      message: message || '',
      from_status: from_status || null,
      to_status: to_status || null
    });

    // 2) Si el usuario seleccionó un nuevo estado en el modal,
    // opcionalmente actualizamos la tarea en la tabla tasks.
    //
    // OJO: tu frontend (main.js) ya llama a PATCH /api/tasks/:id/status
    // mediante updateTaskStatus(...), así que esto es redundante pero
    // inofensivo. Si prefieres evitar doble actualización, puedes comentar
    // este bloque.
    if (to_status && to_status.trim() !== '') {
      await taskCommitModel.actualizarEstadoTarea(taskId, to_status.trim());
    }

    return res.json({
      ok: true,
      message: 'Commit registrado correctamente'
    });
  } catch (err) {
    console.error('Error crearCommitParaTarea:', err);
    return res.json({
      ok: false,
      message: 'Error al registrar el commit de la tarea'
    });
  }
}

module.exports = {
  listarCommitsPorTarea,
  crearCommitParaTarea
};