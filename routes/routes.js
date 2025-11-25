// routes/routes.js
const express = require('express');
const router = express.Router();

const {
  postLogin,
  // NUEVO: vistas de cambio de contraseña
  mostrarFormularioCambioPassword,
  procesarCambioPassword
} = require('../controllers/authController');

const { requireAuth, requireRole } = require('../middlewares/auth');

const {
  listarAreasView,
  listarAreasJSON,
  obtenerAreaJSON,
  crearArea,
  actualizarArea,
  desactivarArea,
  activarArea
} = require('../controllers/areaController');

const {
  listarUsuariosJSON,
  obtenerUsuarioJSON,
  crearUsuario,
  actualizarUsuario,
  resetearPassword // 👈 NUEVO
} = require('../controllers/userController');

// ===============================
// Home -> portal
// ===============================
router.get('/', (req, res) =>
  res.render('portal', { title: 'TasksFlow — Portal' })
);

// Login (JSON)
router.post('/login', postLogin);

// ===============================
// Cambio de contraseña obligatoria
// ===============================

// Formulario cambio de contraseña (cualquier usuario logueado)
router.get(
  '/cambiar-password',
  requireAuth,
  mostrarFormularioCambioPassword
);

// Procesar cambio de contraseña
router.post(
  '/cambiar-password',
  requireAuth,
  procesarCambioPassword
);

// ===============================
// Vistas por rol
// ===============================

// Panel Root (solo root)
router.get('/root', requireAuth, requireRole('root'), (req, res) =>
  res.render('root', { title: 'Panel Root' })
);

// Panel Admin (admin + root)
router.get(
  '/admin',
  requireAuth,
  requireRole('admin', 'root'),
  listarAreasView
);

// Panel Supervisor (supervisor + root)
router.get(
  '/supervisor',
  requireAuth,
  requireRole('supervisor', 'root'),
  (req, res) => res.render('supervisor', { title: 'Panel Supervisor' })
);

// Panel Usuario (user + root)
router.get('/user', requireAuth, requireRole('user', 'root'), (req, res) =>
  res.render('user', { title: 'Panel Usuario' })
);

// ===============================
// ÁREAS
// ===============================

// Vista Admin de áreas (admin + root)
router.get(
  '/admin/areas',
  requireAuth,
  requireRole('admin', 'root'),
  listarAreasView
);

// API ÁREAS (JSON)
router.get(
  '/api/areas',
  requireAuth,
  requireRole('admin', 'supervisor', 'root'),
  listarAreasJSON
);

router.get(
  '/api/areas/:id',
  requireAuth,
  requireRole('admin', 'supervisor', 'root'),
  obtenerAreaJSON
);

router.post(
  '/api/areas',
  requireAuth,
  requireRole('admin', 'root'),
  crearArea
);

router.post(
  '/api/areas/:id/edit',
  requireAuth,
  requireRole('admin', 'root'),
  actualizarArea
);

router.post(
  '/api/areas/:id/delete',
  requireAuth,
  requireRole('admin', 'root'),
  desactivarArea
);

router.post(
  '/api/areas/:id/activate',
  requireAuth,
  requireRole('admin', 'root'),
  activarArea
);

// Alias para mantener compatible tu formulario actual (postForm('/areas', ...))
router.post(
  '/areas',
  requireAuth,
  requireRole('admin', 'root'),
  crearArea
);

// ===============================
// USUARIOS
// ===============================

router.get(
  '/api/users',
  requireAuth,
  requireRole('root', 'admin', 'supervisor'),
  listarUsuariosJSON
);

router.get(
  '/api/users/:id',
  requireAuth,
  requireRole('root', 'admin', 'supervisor'),
  obtenerUsuarioJSON
);

router.post(
  '/api/users',
  requireAuth,
  requireRole('root', 'admin', 'supervisor'),
  crearUsuario
);

router.post(
  '/api/users/:id/edit',
  requireAuth,
  requireRole('root', 'admin', 'supervisor'),
  actualizarUsuario
);

// 🔐 Resetear contraseña a la genérica
router.post(
  '/api/users/:id/reset-password',
  requireAuth,
  requireRole('root', 'admin', 'supervisor'),
  resetearPassword
);

// ===============================
// Logout
// ===============================
router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.set('Cache-Control', 'no-store');
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});

// ===============================
// Contacto (JSON)
// ===============================
router.post('/contacto', (req, res) => {
  const { nombre } = req.body;
  res.json({
    ok: true,
    message: 'gracias por contactarnos. Te responderemos pronto.'
  });
});

module.exports = router;
