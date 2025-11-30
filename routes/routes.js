// routes/routes.js
const express = require('express');
const router = express.Router();

const companyController = require('../controllers/companyController');

const teamController = require('../controllers/teamController');

const projectController = require('../controllers/projectController');

const projectModel = require('../models/projectModel');

const taskController = require('../controllers/taskController');

const User = require('../models/userModel');

const {
  panelRootView,
  obtenerAdminRootJSON,
  crearAdminRoot,
  actualizarAdminRoot
} = require('../controllers/rootController');

const {
  postLogin,
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
  resetearPassword
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
router.get(
  '/root',
  requireAuth,
  requireRole('root'),
  panelRootView
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
  async (req, res) => {
    try {
      const companyId = req.user.company_id;
      const areaId = req.user.area_id;

      // 1) Proyectos del área (como ya tenías)
      let projects = [];
      if (areaId) {
        projects = await projectModel.getAllByCompanyAndArea(companyId, areaId);
      }

      // 2) Usuarios de la misma empresa (usamos el modelo existente)
      const allUsers = await User.getUsersByCompany(companyId);

      // 3) Filtramos solo los de la MISMA área del supervisor
      const users = allUsers.filter(
        (u) => u.area_id === areaId && u.status === 'active'
      );

      res.render('supervisor', {
        title: 'Panel Supervisor',
        user: req.user,
        projects,
        users   // 👈 ahora la vista ya tiene los usuarios disponibles
      });
    } catch (err) {
      console.error('Error al renderizar /supervisor:', err);
      res.status(500).send('Error al cargar panel supervisor');
    }
  }
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
// COMPANY
// ===============================
// Listar todas (JSON)

// Listar todas (JSON)
router.get(
  '/api/companies',
  requireAuth,
  requireRole('root'),
  companyController.listarCompaniesJSON
);

// Obtener una
router.get(
  '/api/companies/:id',
  requireAuth,
  requireRole('root'),
  companyController.obtenerCompanyJSON
);

// Crear
router.post(
  '/api/companies',
  requireAuth,
  requireRole('root'),
  companyController.crearCompany
);

// Actualizar (puedes cambiar a PUT si quieres)
router.post(
  '/api/companies/:id/edit',
  requireAuth,
  requireRole('root'),
  companyController.actualizarCompany
);

// Desactivar (soft delete)
router.post(
  '/api/companies/:id/delete',
  requireAuth,
  requireRole('root'),
  companyController.desactivarCompany
);

// Activar
router.post(
  '/api/companies/:id/activate',
  requireAuth,
  requireRole('root'),
  companyController.activarCompany
);

// ===============================
// APIs especiales root (admins)
// ===============================
router.get(
  '/api/root/admins/:id',
  requireAuth,
  requireRole('root'),
  obtenerAdminRootJSON
);

router.post(
  '/api/root/admins',
  requireAuth,
  requireRole('root'),
  crearAdminRoot
);

router.post(
  '/api/root/admins/:id/edit',
  requireAuth,
  requireRole('root'),
  actualizarAdminRoot
);

// ===============================
// TEAMS (grupos de trabajo)
// ===============================

// Listar teams de la empresa actual
router.get(
  '/api/teams',
  requireAuth,
  requireRole('admin', 'root', 'supervisor'),
  teamController.listarTeamsJSON
);

// Obtener un team
router.get(
  '/api/teams/:id',
  requireAuth,
  requireRole('admin', 'root', 'supervisor'),
  teamController.obtenerTeamJSON
);

// Crear team (solo admin/root)
router.post(
  '/api/teams',
  requireAuth,
  requireRole('admin', 'root'),
  teamController.crearTeam
);

// Actualizar team (solo admin/root)
router.post(
  '/api/teams/:id/edit',
  requireAuth,
  requireRole('admin', 'root'),
  teamController.actualizarTeam
);

// Miembros de un team
router.get(
  '/api/teams/:id/members',
  requireAuth,
  requireRole('admin', 'root'),
  teamController.listarMiembrosTeamJSON
);

router.post(
  '/api/teams/:id/members/add',
  requireAuth,
  requireRole('admin', 'root'),
  teamController.agregarMiembroTeam
);

router.post(
  '/api/teams/:id/members/remove',
  requireAuth,
  requireRole('admin', 'root'),
  teamController.quitarMiembroTeam
);

// ===============================
// API Projects
// ===============================
router.get(
  '/api/projects',
  requireAuth,
  requireRole('admin', 'supervisor', 'root'),
  projectController.listarProjectsJSON
);

router.get(
  '/api/projects/:id',
  requireAuth,
  requireRole('admin', 'supervisor', 'root'),
  projectController.obtenerProjectJSON
);

router.post(
  '/api/projects',
  requireAuth,
  requireRole('admin', 'supervisor', 'root'),
  projectController.crearProject
);

router.post(
  '/api/projects/update',
  requireAuth,
  requireRole('admin', 'supervisor', 'root'),
  projectController.actualizarProject
);

// ===============================
// API TAREAS
// ===============================
router.post(
  '/api/tasks',
  requireAuth,
  requireRole('admin', 'supervisor'),
  taskController.crearTarea
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
