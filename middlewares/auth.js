// middlewares/auth.js

/**
 * Obtiene el nombre de rol normalizado ('root', 'admin', 'supervisor', 'user')
 * a partir del objeto user guardado en la sesión.
 */
function getRoleNameFromUser(user) {
  if (!user) return null;

  // Si viene directo desde la query con alias role_name
  if (user.role_name) {
    return String(user.role_name).toLowerCase();
  }

  // Si solo tenemos role_id, lo mapeamos
  const map = {
    1: 'root',
    2: 'admin',
    3: 'supervisor',
    4: 'user'
  };

  if (typeof user.role_id === 'number') {
    return map[user.role_id] || null;
  }

  if (typeof user.role_id === 'string') {
    const asNumber = Number(user.role_id);
    return map[asNumber] || null;
  }

  return null;
}

/**
 * Middleware base: exige sesión válida.
 * - Redirige al portal si no hay sesión.
 * - Bloquea usuarios suspendidos (status != 'active').
 * - Bloquea empresas inactivas (company_status != 'active'), salvo root.
 */
function requireAuth(req, res, next) {
  const user = req.session && req.session.user;

  if (!user) {
    return res.redirect('/');
  }

  // Evitar cache de páginas privadas
  res.set('Cache-Control', 'no-store');

  // Seguridad extra: si el usuario está suspendido, sacar de inmediato
  if (user.status && user.status !== 'active') {
    req.session.destroy(() => {
      return res.redirect('/');
    });
    return;
  }

  // Seguridad extra: si la company está inactiva (y no es root), también bloquear
  const roleName = getRoleNameFromUser(user);
  if (
    roleName !== 'root' &&
    typeof user.company_status === 'string' &&
    user.company_status !== 'active'
  ) {
    req.session.destroy(() => {
      return res.redirect('/');
    });
    return;
  }

  // Todo ok, exponemos el usuario en req.user y seguimos
  req.user = user;
  return next();
}

/**
 * Middleware de autorización por rol.
 * Uso:
 *   router.get('/admin', requireAuth, requireRole('admin', 'root'), handler);
 *
 * Acepta nombres de rol en minúsculas/mayúsculas, los normaliza internamente.
 */
function requireRole(...allowedRoles) {
  const allowed = allowedRoles.map((r) => String(r).toLowerCase());

  return (req, res, next) => {
    const user = req.user || (req.session && req.session.user);

    if (!user) {
      // Por seguridad, si no hay usuario, lo tratamos como no autenticado
      return res.redirect('/');
    }

    const roleName = getRoleNameFromUser(user);

    if (!roleName || !allowed.includes(roleName)) {
      const wantsJSON =
        req.xhr ||
        (req.headers.accept &&
          req.headers.accept.includes('application/json'));

      if (wantsJSON) {
        return res.status(403).json({
          ok: false,
          message: 'No tienes permisos suficientes para esta acción.'
        });
      }

      // Para vistas EJS normales, lo más simple es redirigir al portal
      return res.status(403).redirect('/');
    }

    // Rol permitido, seguimos
    return next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
