// middlewares/auth.js
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    // 🔐 Evitar que el navegador cachee estas respuestas
    res.set('Cache-Control', 'no-store');
    return next();
  }

  return res.redirect('/');
}

module.exports = { requireAuth };
