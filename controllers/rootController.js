// controllers/rootController.js
const companyModel = require('../models/companyModel');
const userModel = require('../models/userModel');

// Vista principal del panel root
async function panelRootView(req, res, next) {
  try {
    const [companies, adminUsers] = await Promise.all([
      companyModel.getCompanies(),
      userModel.getAdminsWithCompany()
    ]);

    res.render('root', {
      title: 'Panel Root',
      user: req.user,
      companies,
      adminUsers
    });
  } catch (err) {
    next(err);
  }
}

// Helpers de rol
function getCurrentRoleName(user) {
  if (!user) return 'user';
  if (user.role_name) return String(user.role_name).toLowerCase();
  if (user.role_id) {
    switch (Number(user.role_id)) {
      case 1: return 'root';
      case 2: return 'admin';
      case 3: return 'supervisor';
      case 4:
      default:
        return 'user';
    }
  }
  return 'user';
}

/**
 * Obtener un admin por id (root, sin validar empresa)
 */
async function obtenerAdminRootJSON(req, res, next) {
  try {
    const actor = req.user;
    const roleName = getCurrentRoleName(actor);

    if (roleName !== 'root') {
      return res
        .status(403)
        .json({ ok: false, message: 'Solo root puede usar esta ruta' });
    }

    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json({ ok: false, message: 'ID de usuario inválido' });
    }

    const user = await userModel.getUserByIdAnyCompany(id);

    if (!user || user.role_id !== 2) {
      return res
        .status(404)
        .json({ ok: false, message: 'Admin no encontrado' });
    }

    res.json({ ok: true, data: user });
  } catch (err) {
    next(err);
  }
}

/**
 * Crear admin (root elige company_id explícitamente)
 */
async function crearAdminRoot(req, res, next) {
  try {
    const actor = req.user;
    const roleName = getCurrentRoleName(actor);

    if (roleName !== 'root') {
      return res
        .status(403)
        .json({ ok: false, message: 'Solo root puede crear admins' });
    }

    const {
      name,
      email,
      telephone,
      status,
      company_id
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

    const parsedCompanyId = company_id ? Number(company_id) : null;
    if (!parsedCompanyId || Number.isNaN(parsedCompanyId)) {
      return res
        .status(400)
        .json({ ok: false, message: 'Debes seleccionar una empresa válida' });
    }

    const finalStatus =
      status === 'suspended' || status === 'inactive' ? status : 'active';

    const nuevo = await userModel.createUser({
      company_id: parsedCompanyId,
      area_id: null,
      manager_id: null,
      role_id: 2, // admin
      name: name.trim(),
      email: email.trim(),
      telephone: telephone?.trim() || null,
      status: finalStatus,
      password_hash: null
    });

    res.status(201).json({
      ok: true,
      message: 'Admin creado correctamente',
      data: nuevo
    });
  } catch (err) {
    console.error('❌ [crearAdminRoot] Error:', err);
    next(err);
  }
}

/**
 * Actualizar admin (root, sin cambiar company_id)
 */
async function actualizarAdminRoot(req, res, next) {
  try {
    const actor = req.user;
    const roleName = getCurrentRoleName(actor);

    if (roleName !== 'root') {
      return res
        .status(403)
        .json({ ok: false, message: 'Solo root puede editar admins' });
    }

    const id = Number(req.params.id);
    if (!id) {
      return res
        .status(400)
        .json({ ok: false, message: 'ID de usuario inválido' });
    }

    const existente = await userModel.getUserByIdAnyCompany(id);
    if (!existente || existente.role_id !== 2) {
      return res.status(404).json({
        ok: false,
        message: 'Admin no encontrado'
      });
    }

    const {
      name,
      email,
      telephone,
      status
      // OJO: company_id NO se usa aquí a propósito (no se cambia de empresa)
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

    const actualizado = await userModel.updateUser({
      id,
      company_id: existente.company_id,   // 👈 se mantiene la empresa
      area_id: existente.area_id,
      manager_id: existente.manager_id,
      role_id: existente.role_id,         // sigue siendo admin
      name: name.trim(),
      email: email.trim(),
      telephone: telephone?.trim() || null,
      status: finalStatus
    });

    if (!actualizado) {
      return res.status(404).json({
        ok: false,
        message: 'Admin no encontrado al actualizar'
      });
    }

    res.json({
      ok: true,
      message: 'Admin actualizado correctamente',
      data: actualizado
    });
  } catch (err) {
    console.error('❌ [actualizarAdminRoot] Error:', err);
    next(err);
  }
}

module.exports = {
  panelRootView,
  obtenerAdminRootJSON,
  crearAdminRoot,
  actualizarAdminRoot
};
