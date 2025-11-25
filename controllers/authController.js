// controllers/authController.js
const { verifyLogin } = require('../models/authModel');

const RoleRoutes = {
  root: '/root',
  admin: '/admin',
  supervisor: '/supervisor',
  user: '/user',
};

async function postLogin(req, res) {
  try {
    const { username, password } = req.body; // <input name="username|password">

    if (!username || !password) {
      return res
        .status(400)
        .json({ ok: false, message: 'Faltan credenciales' });
    }

    // 1) Verificar login (usuario + password)
    const user = await verifyLogin(username.trim(), password);

    if (!user) {
      // Usuario inexistente o password incorrecta
      return res
        .status(401)
        .json({ ok: false, message: 'Credenciales inválidas' });
    }

    const role = String(user.role_name || '').toLowerCase();

    // 2) Validar estado del usuario
    if (user.status && user.status !== 'active') {
      return res.status(403).json({
        ok: false,
        message:
          'Tu usuario se encuentra suspendido. Contacta al administrador.',
      });
    }

    // 3) Validar estado de la compañía (solo para roles distintos de root)
    if (role !== 'root') {
      if (
        user.company_id &&                         // tiene compañía asociada
        typeof user.company_status === 'string' && // la columna viene de la DB
        user.company_status !== 'active'
      ) {
        return res.status(403).json({
          ok: false,
          message:
            'La compañía asociada a tu cuenta está inactiva. ' +
            'No es posible iniciar sesión en este momento.',
        });
      }
    }

    // 4) Login válido -> guardar sesión
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name,
      status: user.status, // 'active' | 'suspended'
      company_id: user.company_id,
      company_name: user.company_name || null,
      company_status: user.company_status || null,
      area_id: user.area_id || null,
      area_name: user.area_name || null,
    };

    const redirect = RoleRoutes[role] || '/user'; // ruta por defecto

    return res.json({
      ok: true,
      message: `Bienvenido ${user.name}`,
      redirect,
    });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ ok: false, message: 'Error interno' });
  }
}

module.exports = { postLogin };
