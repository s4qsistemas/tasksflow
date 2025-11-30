// controllers/taskController.js

const taskModel = require('../models/taskModel');

/**
 * Normaliza un campo que puede venir como string o como array
 * (por ej. name="user_ids[]" o name="assignees[]").
 */
function normalizeIdArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((v) => Number(v))
      .filter((n) => Number.isInteger(n) && n > 0);
  }
  // string simple
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? [n] : [];
}

/**
 * Construye un DATETIME MySQL a partir de fecha + hora del formulario.
 * Si solo hay fecha, se usa 00:00:00.
 */
function buildDeadline(deadlineDate, deadlineTime) {
  if (!deadlineDate) return null;

  const date = deadlineDate.trim();
  const time = (deadlineTime || '').trim() || '00:00';

  // Formato esperado: YYYY-MM-DD y HH:MM
  return `${date} ${time}:00`;
}

/**
 * POST /api/tasks
 * Crea una tarea y la asigna según el rol (admin o supervisor).
 */
async function crearTarea(req, res) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'No autorizado'
      });
    }

    // Heurística sencilla para rol (ajusta según tu req.user)
    const roleName =
      user.role_name || user.role || user.roleName || '';
    const isAdmin = roleName === 'admin';
    const isSupervisor = roleName === 'supervisor';

    const {
      project_id,
      title,
      description,
      status,
      priority,
      deadline_date,
      deadline_time,
      assignment_type, // para admin
      team_id,
      area_id
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'El título de la tarea es obligatorio'
      });
    }

    const deadline = buildDeadline(deadline_date, deadline_time);

    // 1) Crear tarea base
    const taskId = await taskModel.createTask({
      companyId: user.company_id,
      projectId: project_id || null,
      title: title.trim(),
      description: description || null,
      status: status || 'pending',
      priority: priority || 'normal',
      deadline,
      creatorId: user.id
    });

    // 2) Determinar lista de usuarios a asignar
    let assigneeIds = [];

    if (isAdmin) {
      // ---- ADMIN: puede asignar a TEAM, área, usuarios específicos o a sí mismo ----
      const type = assignment_type || 'user';

      if (type === 'team' && team_id) {
        // miembros activos del team
        assigneeIds = await taskModel.getActiveUserIdsByTeam(
          Number(team_id),
          user.company_id
        );
      } else if (type === 'area' && area_id) {
        assigneeIds = await taskModel.getActiveUserIdsByArea(
          Number(area_id),
          user.company_id
        );
      } else if (type === 'self') {
        assigneeIds = [user.id];
      } else {
        // type === 'user' (usuarios seleccionados manualmente)
        const rawUsers =
          req.body['user_ids[]'] || req.body.user_ids || req.body.assignees;
        assigneeIds = normalizeIdArray(rawUsers);

        // Filtro de seguridad: solo usuarios activos de la misma company
        assigneeIds = await taskModel.filterUserIdsByCompanyAndArea(
          assigneeIds,
          user.company_id,
          null
        );
      }
    } else if (isSupervisor) {
      // ---- SUPERVISOR: SOLO su área, mini-grupos dentro de su área o él mismo ----
      const rawAssignees =
        req.body['assignees[]'] || req.body.assignees || [];

      assigneeIds = normalizeIdArray(rawAssignees);

      // Si no seleccionó a nadie, por defecto se asigna a sí mismo
      if (!assigneeIds.length) {
        assigneeIds = [user.id];
      }

      // Seguridad: solo usuarios activos de misma company + misma área
      assigneeIds = await taskModel.filterUserIdsByCompanyAndArea(
        assigneeIds,
        user.company_id,
        user.area_id
      );
    } else {
      // Por ahora solo admin y supervisor deberían llegar aquí (rutas protegidas)
      assigneeIds = [user.id];
    }

    // Eliminar duplicados, por si acaso
    assigneeIds = [...new Set(assigneeIds)];

    // 3) Insertar asignaciones
    if (assigneeIds.length) {
      await taskModel.addAssignments(taskId, assigneeIds);
    }

    return res.json({
      ok: true,
      message: 'Tarea creada correctamente',
      data: {
        task_id: taskId,
        assignees: assigneeIds
      }
    });
  } catch (err) {
    console.error('Error al crear tarea:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error interno al crear la tarea'
    });
  }
}

module.exports = {
  crearTarea
};
