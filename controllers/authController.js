// controllers/authController.js
const { verifyLogin } = require('../models/userModel');

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
      return res.status(400).json({ ok: false, message: 'Faltan credenciales' });
    }

    const user = await verifyLogin(username.trim(), password);
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas' });
    }

    // 🔐 AQUÍ recién guardamos en sesión
    req.session.user = {
      id: user.id,
      name: user.name,
      role_id: user.role_id,
      role_name: user.role_name,
      company_id: user.company_id,
      area_id: user.area_id || null
    };

    const role = String(user.role_name || '').toLowerCase();
    const redirect = RoleRoutes[role] || '/user'; // o '/admin', lo que tú uses por defecto

    return res.json({ ok: true, message: `Bienvenido ${user.name}`, redirect });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, message: 'Error interno' });
  }
}

module.exports = { postLogin };
