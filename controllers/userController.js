// controllers/userController.js
const User = require('../models/userModel');

const taskModel = require('../models/taskModel');

const projectModel = require('../models/projectModel');

// Mapea 'admin', 'supervisor', 'user' -> ids de la tabla roles
function mapRoleToId(role) {
  switch ((role || '').toLowerCase()) {
    case 'root':
      return 1;
    case 'admin':
      return 2;
    case 'supervisor':
      return 3;
    case 'user':
    default:
      return 4;
  }
}

// Mapea id de rol -> nombre
function mapRoleIdToName(roleId) {
  switch (Number(roleId)) {
    case 1:
      return 'root';
    case 2:
      return 'admin';
    case 3:
      return 'supervisor';
    case 4:
    default:
      return 'user';
  }
}

// Rol actual a partir del usuario en sesión
function getCurrentRoleName(user) {
  if (!user) return 'user';
  if (user.role_name) return String(user.role_name).toLowerCase();
  if (user.role_id) return mapRoleIdToName(user.role_id);
  return 'user';
}

/**
 * Listar usuarios en JSON (empresa actual)
 */
async function listarUsuariosJSON(req, res, next) {
  try {
    const companyId = req.user?.company_id || 1;
    const users = await User.getUsersByCompany(companyId);
    res.json({ ok: true, data: users });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener un usuario en JSON
 */
async function obtenerUsuarioJSON(req, res, next) {
  try {
    const companyId = req.user?.company_id || 1;
    const id = Number(req.params.id);

    if (!id) {
      return res
        .status(400)
        .json({ ok: false, message: 'ID de usuario inválido' });
    }

    const user = await User.getUserById(id, companyId);

    if (!user) {
      return res
        .status(404)
        .json({ ok: false, message: 'Usuario no encontrado' });
    }

    res.json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
}

/**
 * Crear usuario (desde modal)
 */
async function crearUsuario(req, res, next) {
  try {
    const actor = req.user;
    const companyId = actor?.company_id || 1;
    const actorRole = getCurrentRoleName(actor);

    const {
      name,
      email,
      telephone,
      role,
      role_id,
      status,
      area_id,
      manager_id
    } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: 'El nombre es obligatorio' });
    }

    if (!email || !email.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: 'El correo es obligatorio' });
    }

    const finalStatus =
      status === 'suspended' || status === 'inactive' ? status : 'active';

    let finalRoleId;
    let finalAreaId = null;
    let finalManagerId = null;

    if (actorRole === 'root') {
      finalRoleId = role_id
        ? Number(role_id)
        : mapRoleToId(role || 'user');

      finalAreaId = area_id ? Number(area_id) || null : null;
      finalManagerId = manager_id ? Number(manager_id) || null : null;

    } else if (actorRole === 'admin') {
      finalRoleId = 3; // supervisor

      const areaIdNum = area_id ? Number(area_id) : null;
      if (!areaIdNum) {
        return res.status(400).json({
          ok: false,
          message: 'El área es obligatoria para crear un supervisor'
        });
      }

      finalAreaId = areaIdNum;
      finalManagerId = actor.id || null;

    } else if (actorRole === 'supervisor') {
      finalRoleId = 4; // user

      if (!actor.area_id) {
        return res.status(400).json({
          ok: false,
          message:
            'El supervisor no tiene área asignada. Contacta a un admin.'
        });
      }

      finalAreaId = actor.area_id;
      finalManagerId = actor.id || null;

    } else {
      return res
        .status(403)
        .json({ ok: false, message: 'No tienes permisos para crear usuarios' });
    }

    const nuevo = await User.createUser({
      company_id: companyId,
      area_id: finalAreaId,
      manager_id: finalManagerId,
      role_id: finalRoleId,
      name: name.trim(),
      email: email.trim(),
      telephone: telephone?.trim() || null,
      status: finalStatus,
      password_hash: null
    });

    res.status(201).json({
      ok: true,
      message: 'Usuario creado correctamente',
      data: nuevo
    });
  } catch (err) {
    console.error('❌ [crearUsuario] Error:', err);
    next(err);
  }
}

/**
 * Actualizar usuario
 */
async function actualizarUsuario(req, res, next) {
  try {
    const actor = req.user;
    const companyId = actor?.company_id || 1;
    const actorRole = getCurrentRoleName(actor);

    const id = Number(req.params.id);

    if (!id) {
      return res
        .status(400)
        .json({ ok: false, message: 'ID de usuario inválido' });
    }

    const existente = await User.getUserById(id, companyId);

    if (!existente) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario no encontrado o no pertenece a esta empresa'
      });
    }

    const targetRoleName = mapRoleIdToName(existente.role_id);

    const {
      name,
      email,
      telephone,
      role,
      role_id,
      status,
      area_id,
      manager_id
    } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: 'El nombre es obligatorio' });
    }

    if (!email || !email.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: 'El correo es obligatorio' });
    }

    const finalStatus =
      status === 'suspended' || status === 'inactive' ? status : 'active';

    let finalRoleId = existente.role_id;
    let finalAreaId = existente.area_id;
    let finalManagerId = existente.manager_id;

    if (actorRole === 'root') {
      finalRoleId = role_id
        ? Number(role_id)
        : (role ? mapRoleToId(role) : existente.role_id);

      finalAreaId = area_id ? Number(area_id) || null : existente.area_id;
      finalManagerId =
        manager_id ? Number(manager_id) || null : existente.manager_id;

    } else if (actorRole === 'admin') {
      if (targetRoleName !== 'supervisor') {
        return res.status(403).json({
          ok: false,
          message: 'Solo puedes editar supervisores'
        });
      }

      finalRoleId = 3;
      finalManagerId = actor.id;

      const areaIdNum = area_id ? Number(area_id) : existente.area_id;
      if (!areaIdNum) {
        return res.status(400).json({
          ok: false,
          message: 'El área es obligatoria para un supervisor'
        });
      }
      finalAreaId = areaIdNum;

    } else if (actorRole === 'supervisor') {
      if (targetRoleName !== 'user') {
        return res.status(403).json({
          ok: false,
          message: 'Solo puedes editar usuarios de tipo Trabajador'
        });
      }

      if (existente.manager_id !== actor.id) {
        return res.status(403).json({
          ok: false,
          message: 'Usuario no está a tu cargo'
        });
      }

      finalRoleId = 4;
      finalManagerId = existente.manager_id;
      finalAreaId = existente.area_id;

    } else {
      return res
        .status(403)
        .json({ ok: false, message: 'No tienes permisos' });
    }

    const actualizado = await User.updateUser({
      id,
      company_id: companyId,
      area_id: finalAreaId,
      manager_id: finalManagerId,
      role_id: finalRoleId,
      name: name.trim(),
      email: email.trim(),
      telephone: telephone?.trim() || null,
      status: finalStatus
    });

    if (!actualizado) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      ok: true,
      message: 'Usuario actualizado correctamente',
      data: actualizado
    });
  } catch (err) {
    console.error('❌ [actualizarUsuario] Error:', err);
    next(err);
  }
}

/**
 * Resetear contraseña a la genérica (DEFAULT_USER_PASSWORD_HASH)
 */
async function resetearPassword(req, res, next) {
  try {
    const actor = req.user;
    const actorRole = getCurrentRoleName(actor);
    const companyId = actor.company_id;

    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({
        ok: false,
        message: 'ID inválido'
      });
    }

    const target = await User.getUserById(id, companyId);
    if (!target) {
      return res.status(404).json({
        ok: false,
        message: 'Usuario no encontrado'
      });
    }

    const targetRole = mapRoleIdToName(target.role_id);

    // Reglas de jerarquía
    if (actorRole === 'root') {
      // root puede resetear a cualquiera
    } else if (actorRole === 'admin') {
      if (targetRole !== 'supervisor') {
        return res.status(403).json({
          ok: false,
          message: 'Solo puedes resetear a supervisores'
        });
      }
    } else if (actorRole === 'supervisor') {
      if (targetRole !== 'user' || target.manager_id !== actor.id) {
        return res.status(403).json({
          ok: false,
          message: 'Solo puedes resetear contraseña a tus usuarios'
        });
      }
    } else {
      return res.status(403).json({
        ok: false,
        message: 'No tienes permisos para esta acción'
      });
    }

    const success = await User.resetPassword(id, companyId);
    if (!success) {
      return res.status(500).json({
        ok: false,
        message: 'No se pudo resetear la contraseña'
      });
    }

    return res.json({
      ok: true,
      message: 'Contraseña reseteada a la genérica'
    });

  } catch (err) {
    console.error('❌ [resetearPassword] Error:', err);
    next(err);
  }
}

async function panelUserView(req, res) {
  try {
    const user = req.user;
    const companyId = user.company_id;
    const areaId = user.area_id;

    // Tareas asignadas al user actual
    const tasks = await taskModel.getByAssignee(user.id, companyId);

    // 🔹 Proyectos personales creados por el usuario actual
    const projects = await projectModel.getAllByCompanyAndCreator(
      companyId,
      user.id
    );

    // 🔹 Proyectos donde el user participa (para el filtro del Kanban)
    const userProjects = [];
    const seen = new Set();

    if (tasks && tasks.length) {
      tasks.forEach((t) => {
        if (t.project_id && t.project_name && !seen.has(t.project_id)) {
          seen.add(t.project_id);

          const p = projects.find((prj) => prj.id === t.project_id);

          userProjects.push({
            id: t.project_id,
            name: t.project_name,
            status: p ? p.status : 'active'
          });
        }
      });
    }

    res.render('user', {
      title: 'Panel Usuario',
      user,
      tasks,
      projects,     // ahora son proyectos CREADOS por el user
      userProjects  // donde participa (para el select de Kanban)
    });
  } catch (err) {
    console.error('Error en panelUserView:', err);
    res.status(500).send('Error al cargar panel usuario');
  }
}

module.exports = {
  listarUsuariosJSON,
  obtenerUsuarioJSON,
  crearUsuario,
  actualizarUsuario,
  resetearPassword,
  panelUserView
};
