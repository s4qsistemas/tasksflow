// controllers/authController.js
const { verifyLogin } = require('../models/authModel');
const { updatePassword } = require('../models/userModel');
const argon2 = require('argon2');

const RoleRoutes = {
  root: '/root',
  admin: '/admin',
  supervisor: '/supervisor',
  user: '/user'
};

// Hash por defecto definido en .env (la password genérica)
const DEFAULT_PASSWORD_HASH = process.env.DEFAULT_USER_PASSWORD_HASH || null;
const PEPPER = process.env.PEPPER || '';

// ======================================================
// LOGIN
// ======================================================
async function postLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ ok: false, message: 'Faltan credenciales' });
    }

    const user = await verifyLogin(username.trim(), password);

    if (!user) {
      return res
        .status(401)
        .json({ ok: false, message: 'Credenciales inválidas' });
    }

    const role = String(user.role_name || '').toLowerCase();

    // Estado usuario
    if (user.status && user.status !== 'active') {
      return res.status(403).json({
        ok: false,
        message:
          'Tu usuario se encuentra suspendido. Contacta al administrador.'
      });
    }

    // Estado de la compañía
    if (role !== 'root') {
      if (
        user.company_id &&
        typeof user.company_status === 'string' &&
        user.company_status !== 'active'
      ) {
        return res.status(403).json({
          ok: false,
          message:
            'La compañía asociada a tu cuenta está inactiva. No es posible iniciar sesión.'
        });
      }
    }

    // Detectar pass genérica
    let mustChangePassword = false;
    if (
      DEFAULT_PASSWORD_HASH &&
      typeof user.password_hash === 'string' &&
      user.password_hash === DEFAULT_PASSWORD_HASH
    ) {
      mustChangePassword = true;
    }

    // Guardar sesión
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name,
      status: user.status,
      company_id: user.company_id,
      company_name: user.company_name || null,
      company_status: user.company_status || null,
      area_id: user.area_id || null,
      area_name: user.area_name || null,
      mustChangePassword
    };

    const redirect = RoleRoutes[role] || '/user';

    return res.json({
      ok: true,
      message: `Bienvenido ${user.name}`,
      redirect,
      mustChangePassword
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, message: 'Error interno' });
  }
}

// ======================================================
// FORMULARIO CAMBIO DE PASSWORD
// ======================================================
async function mostrarFormularioCambioPassword(req, res) {
  const user = req.session?.user;

  // Si no hay usuario, volver al portal
  if (!user) {
    return res.redirect('/');
  }

  // Renderiza la vista EJS (aún no creada)
  return res.render('cambiar-password', {
    title: 'Cambiar contraseña',
    user
  });
}

// ======================================================
// PROCESAR CAMBIO DE PASSWORD
// ======================================================
async function procesarCambioPassword(req, res) {
  try {
    const user = req.session?.user;
    if (!user) return res.redirect('/');

    const { old_password, new_password, confirm_password } = req.body;

    if (!old_password || !new_password || !confirm_password) {
      return res.status(400).json({
        ok: false,
        message: 'Debes completar todos los campos.'
      });
    }

    if (new_password !== confirm_password) {
      return res
        .status(400)
        .json({ ok: false, message: 'Las contraseñas no coinciden.' });
    }

    // 1) Volver a verificar la password actual contra la BD
    const fullUser = await verifyLogin(user.email, old_password);
    if (!fullUser) {
      return res
        .status(401)
        .json({ ok: false, message: 'Contraseña actual incorrecta.' });
    }

    // 2) Generar nuevo hash Argon2 + PEPPER
    const newHash = await argon2.hash(new_password + PEPPER);

    // 3) Guardarlo en la BD
    await updatePassword(user.id, user.company_id, newHash);

    // 4) Actualizar sesión
    req.session.user.mustChangePassword = false;

    // 5) Redirigir al panel correspondiente
    const role = String(user.role_name || '').toLowerCase();
    const redirect = RoleRoutes[role] || '/user';

    return res.json({
      ok: true,
      message: 'Contraseña actualizada correctamente.',
      redirect
    });
  } catch (e) {
    console.error('❌ Error al cambiar contraseña:', e);
    return res.status(500).json({ ok: false, message: 'Error interno.' });
  }
}

module.exports = {
  postLogin,
  mostrarFormularioCambioPassword,
  procesarCambioPassword
};
