// middlewares/auth.js
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
  const role = String(user.role_name || '').toLowerCase();
  if (
    role !== 'root' &&
    typeof user.company_status === 'string' &&
    user.company_status !== 'active'
  ) {
    req.session.destroy(() => {
      return res.redirect('/');
    });
    return;
  }

  // Todo ok, seguimos
  req.user = user;
  return next();
}

module.exports = { requireAuth };
