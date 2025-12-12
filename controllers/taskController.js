// controllers/taskController.js
// Lógica de control para tareas (creación y cambio de estado)

const taskModel = require('../models/taskModel');

// Normaliza los IDs de asignatarios desde el body
function extractAssigneeIds(body) {
  // Puede venir como assignees, assignees[] o similar
  let ids =
    body['assignees[]'] ||
    body.assignees ||
    body.assignee_ids ||
    body.assignee;

  if (!ids) return [];

  if (!Array.isArray(ids)) {
    ids = [ids];
  }

  return ids
    .map((v) => Number(v))
    .filter((n) => !Number.isNaN(n));
}

// Combina fecha + hora en un solo campo tipo DATETIME (para tasks.deadline)
function buildDeadline(deadline_date, deadline_time) {
  if (!deadline_date) return null;

  if (!deadline_time) {
    // Si no hay hora, la dejamos al final del día
    return `${deadline_date} 23:59:00`;
  }

  // Asumimos formato HH:MM
  return `${deadline_date} ${deadline_time}:00`;
}

// ===============================
// POST /api/tasks  → crear tarea
// ===============================
async function crearTarea(req, res) {
  try {
    const companyId = req.user.company_id;
    const role = req.user.role;
    const areaId = req.user.area_id || null;
    const creatorId = req.user.id;

    const {
      project_id,
      title,
      description,
      priority,
      status,
      deadline_date,
      deadline_time
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'El título de la tarea es obligatorio'
      });
    }

    // Obtener IDs de usuarios seleccionados en el modal
    let assigneeIds = extractAssigneeIds(req.body);

    if (!assigneeIds.length) {
      return res.status(400).json({
        ok: false,
        message: 'Debes asignar al menos un usuario'
      });
    }

    // Filtrar por company y, si corresponde, por área
    // - admin/root: puede asignar a cualquier activo de la company
    // - supervisor/user: restringimos a su misma área
    const areaFilter =
      role === 'supervisor' || role === 'user' ? areaId : null;

    assigneeIds = await taskModel.filterUserIdsByCompanyAndArea(
      assigneeIds,
      companyId,
      areaFilter
    );

    if (!assigneeIds.length) {
      return res.status(400).json({
        ok: false,
        message:
          'Ningún usuario seleccionado es válido/activo en tu compañía/área'
      });
    }

    const deadline = buildDeadline(deadline_date, deadline_time);

    // Crear la tarea base
    const newTaskId = await taskModel.createTask({
      companyId,
      projectId: project_id || null,
      title: title.trim(),
      description: description || null,
      status: status || 'pending',
      priority: priority || 'normal',
      deadline,
      creatorId
    });

    // Crear asignaciones
    await taskModel.addAssignments(newTaskId, assigneeIds);

    return res.json({
      ok: true,
      message: 'Tarea creada correctamente',
      data: { id: newTaskId }
    });
  } catch (err) {
    console.error('Error crearTarea:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al crear la tarea'
    });
  }
}

// ============================================
// PATCH /api/tasks/:id/status  → cambiar estado
// ============================================
async function updateStatus(req, res) {
  try {
    const taskId = req.params.id;
    const { status } = req.body || {};
    const companyId = req.user.company_id;
    const userId = req.user.id;

    const validStatuses = ['pending', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: 'Estado de tarea no válido'
      });
    }

    const affected = await taskModel.updateStatus(
      taskId,
      status,
      companyId,
      userId
    );

    if (!affected) {
      return res.status(404).json({
        ok: false,
        message: 'Tarea no encontrada o no pertenece a esta empresa'
      });
    }

    return res.json({
      ok: true,
      message: 'Estado de tarea actualizado'
    });
  } catch (err) {
    console.error('Error updateStatus:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar el estado de la tarea'
    });
  }
}

module.exports = {
  crearTarea,
  updateStatus
};
