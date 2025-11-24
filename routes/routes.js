// routes/routes.js
const express = require('express');
const router = express.Router();

const { postLogin } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');

const {
  listarAreasView,
  listarAreasJSON,
  obtenerAreaJSON,
  crearArea,
  actualizarArea,
  desactivarArea,
  activarArea
} = require('../controllers/areaController');

// Home -> portal
router.get('/', (req, res) =>
  res.render('portal', { title: 'TasksFlow — Portal' })
);

// Login (JSON)
router.post('/login', postLogin);

// ===============================
// Vistas por rol
// ===============================
router.get('/root', requireAuth, (req, res) =>
  res.render('root', { title: 'Panel Root' })
);

router.get('/admin', requireAuth, listarAreasView);

router.get('/supervisor', requireAuth, (req, res) =>
  res.render('supervisor', { title: 'Panel Supervisor' })
);
router.get('/user', requireAuth, (req, res) =>
  res.render('user', { title: 'Panel Usuario' })
);

// ===============================
// ÁREAS
// ===============================

// (Opcional) si quieres mantener una ruta específica para solo áreas:
router.get('/admin/areas', requireAuth, listarAreasView);

// API ÁREAS (JSON) - prefijo /api

// Listar todas las áreas de la empresa actual
router.get('/api/areas', requireAuth, listarAreasJSON);

// Obtener una sola área por id
router.get('/api/areas/:id', requireAuth, obtenerAreaJSON);

// Crear área (JSON) - para integraciones / fetch
router.post('/api/areas', requireAuth, crearArea);

// Actualizar área (nombre, descripción, status)
router.post('/api/areas/:id/edit', requireAuth, actualizarArea);

// Desactivar área (soft delete: status = 'inactive')
router.post('/api/areas/:id/delete', requireAuth, desactivarArea);

// Activar área (status = 'active')
router.post('/api/areas/:id/activate', requireAuth, activarArea);

// Alias para mantener compatible tu formulario actual (postForm('/areas', ...))
router.post('/areas', requireAuth, crearArea);

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
