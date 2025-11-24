// middlewares/auth.js
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    res.set('Cache-Control', 'no-store');
    req.user = req.session.user;
    return next();
  }

  return res.redirect('/');
}

module.exports = { requireAuth };
