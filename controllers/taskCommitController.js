// controllers/taskCommitController.js
const taskCommitModel = require('../models/taskCommitModel');

// GET /api/tasks/:id/commits
async function listarCommitsPorTarea(req, res) {
  const taskId = parseInt(req.params.id, 10);

  if (!taskId || Number.isNaN(taskId)) {
    return res
      .status(400)
      .json({ ok: false, message: 'ID de tarea inválido' });
  }

  try {
    // 🔐 Aquí podrías validar que la tarea pertenece a la empresa / área del usuario
    // o que el usuario esté asignado a la tarea. Por ahora dejamos abierto
    // porque ya controlas el acceso por vista y rol.
    const commits = await taskCommitModel.listarPorTarea(taskId);

    return res.json({
      ok: true,
      data: commits
    });
  } catch (err) {
    console.error('Error al listar commits de tarea:', err);
    return res
      .status(500)
      .json({ ok: false, message: 'Error al obtener los commits de la tarea' });
  }
}

// POST /api/tasks/:id/commits
async function crearCommitParaTarea(req, res) {
  const taskId = parseInt(req.params.id, 10);

  if (!taskId || Number.isNaN(taskId)) {
    return res
      .status(400)
      .json({ ok: false, message: 'ID de tarea inválido' });
  }

  const user = req.user; // viene de requireAuth
  if (!user || !user.id) {
    return res
      .status(401)
      .json({ ok: false, message: 'No autenticado' });
  }

  const authorId = user.id;
  const message = (req.body.message || '').trim();
  const fromStatus = req.body.from_status || null;
  const toStatus = req.body.to_status || null;

  if (!message) {
    return res
      .status(400)
      .json({ ok: false, message: 'El mensaje del commit no puede estar vacío' });
  }

  // Validar que el estado (si viene) es uno de los permitidos
  const VALID_STATES = ['pending', 'in_progress', 'review', 'done'];
  const sanitizedToStatus = VALID_STATES.includes(toStatus) ? toStatus : null;
  const sanitizedFromStatus = VALID_STATES.includes(fromStatus)
    ? fromStatus
    : null;

  try {
    // Crear commit
    const commit = await taskCommitModel.crearCommit({
      taskId,
      authorId,
      message,
      fromStatus: sanitizedFromStatus,
      toStatus: sanitizedToStatus
    });

    // Si el commit incluye cambio de estado, actualizamos la tarea
    if (sanitizedToStatus) {
      await taskCommitModel.actualizarEstadoTarea(taskId, sanitizedToStatus);
    }

    return res.json({
      ok: true,
      message: 'Commit registrado correctamente',
      data: commit
    });
  } catch (err) {
    console.error('Error al crear commit de tarea:', err);
    return res
      .status(500)
      .json({ ok: false, message: 'Error al registrar el commit' });
  }
}

module.exports = {
  listarCommitsPorTarea,
  crearCommitParaTarea
};