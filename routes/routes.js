// routes/routes.js
const express = require('express');
const router = express.Router();

const companyController = require('../controllers/companyController');

const teamController = require('../controllers/teamController');

const projectController = require('../controllers/projectController');

const projectModel = require('../models/projectModel');

const taskController = require('../controllers/taskController');

const User = require('../models/userModel');

const { panelUserView } = require('../controllers/userController');

const taskCommitController = require('../controllers/taskCommitController');

const taskModel = require('../models/taskModel');

const { panelAdminView } = require('../controllers/adminController');

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
  panelAdminView
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

      // ==========================
      // 1) Proyectos del área + proyectos creados por mí
      // ==========================
      let projectsArea = [];
      if (areaId) {
        projectsArea = await projectModel.getAllByCompanyAndArea(companyId, areaId);
      }

      // Proyectos creados por el supervisor actual (independiente del área)
      const projectsCreator = await projectModel.getAllByCompanyAndCreator(
        companyId,
        req.user.id
      );

      // Unión: proyectos del área ∪ proyectos donde soy creator_id
      const projectMap = new Map();

      // Primero los del área
      projectsArea.forEach((p) => {
        projectMap.set(p.id, p);
      });

      // Luego los que yo creé (si alguno ya está, se pisa con la misma info)
      projectsCreator.forEach((p) => {
        projectMap.set(p.id, p);
      });

      // Array final para pasar a la vista
      const projects = Array.from(projectMap.values());

      // ==========================
      // 2) Usuarios de la misma empresa
      // ==========================
      const allUsers = await User.getUsersByCompany(companyId);

      // 3) Solo usuarios del MISMA área y activos
      const users = allUsers.filter(
        (u) => u.area_id === areaId && u.status === 'active'
      );

      // ==========================
      // 4) TAREAS DEL ÁREA PARA EL KANBAN
      // ==========================
      const tasks = await taskModel.getByCompanyAndArea(companyId, areaId);
      const statuses = ['pending', 'in_progress', 'review', 'done'];

      const kanbanTasks = {
        pending: [],
        in_progress: [],
        review: [],
        done: [],
      };

      tasks.forEach((t) => {
        const st = statuses.includes(t.status) ? t.status : 'pending';
        kanbanTasks[st].push(t);
      });

      const statsByStatus = {};
      statuses.forEach((st) => {
        statsByStatus[st] = kanbanTasks[st].length;
      });

      // ==========================
      // 5) PROYECTOS DONDE TENGO PARTICIPACIÓN
      // ==========================
      const projectIdsWithTasks = new Set(
        tasks
          .filter((t) => t.project_id != null)
          .map((t) => Number(t.project_id))
      );

      const userProjects = projects.filter((p) =>
        projectIdsWithTasks.has(Number(p.id))
      );

      // ==========================
      // 6) MÉTRICAS TÁCTICAS
      // ==========================

      // Helpers de fecha
      const now = new Date();
      const startToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const endToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const sevenDaysAgo = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7
      );
      const next7 = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 7
      );
      const next30 = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 30
      );

      function parseDate(value) {
        if (!value) return null;
        return new Date(value);
      }

      // Tomamos un campo de deadline cualquiera que tengas
      function getDeadline(t) {
        return (
          parseDate(t.deadline_at) ||
          parseDate(t.due_date) ||
          parseDate(t.deadline) ||
          null
        );
      }

      function formatDateHuman(d) {
        if (!d) return null;
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${dd}-${mm}-${yyyy} ${hh}:${mi}`;
      }

      // ---- 6.1 supervisorMetrics (stats) ----
      const tasksOpen = tasks.filter((t) =>
        ['pending', 'in_progress', 'review'].includes(t.status)
      ).length;

      const tasksOverdue = tasks.filter((t) => {
        const d = getDeadline(t);
        return d && d < now && t.status !== 'done';
      }).length;

      // % cierre últimos 7 días (aprox: tareas con deadline en últimos 7 días)
      const last7 = tasks.filter((t) => {
        const d = getDeadline(t);
        return d && d >= sevenDaysAgo && d <= now;
      });
      const last7Done = last7.filter((t) => t.status === 'done');

      const completionLast7d =
        last7.length > 0
          ? Math.round((last7Done.length * 100) / last7.length)
          : 0;

      const supervisorMetrics = {
        tasksOpen,
        tasksOverdue,
        completionLast7d,
      };

      // ---- 6.2 teamLoad (carga por persona) ----
      const teamMap = {};

      tasks.forEach((t) => {
        const assigneeId =
          t.assignee_id || t.user_id || t.assigned_to_id || null;
        const assigneeName =
          t.assignee_name || t.user_name || t.assigned_to_name || 'Sin asignar';

        const key = assigneeId || `no-user-${assigneeName}`;

        if (!teamMap[key]) {
          teamMap[key] = {
            id: assigneeId,
            name: assigneeName,
            tasksOpen: 0,
            tasksInProgress: 0,
            tasksOverdue: 0,
          };
        }

        const d = getDeadline(t);
        const isOverdue = d && d < now && t.status !== 'done';

        if (['pending', 'in_progress', 'review'].includes(t.status)) {
          teamMap[key].tasksOpen += 1;
        }
        if (t.status === 'in_progress') {
          teamMap[key].tasksInProgress += 1;
        }
        if (isOverdue) {
          teamMap[key].tasksOverdue += 1;
        }
      });

      const teamLoad = Object.values(teamMap).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      // ---- 6.3 todayTasks (tareas que vencen hoy) ----
      const todayTasks = tasks
        .map((t) => {
          const d = getDeadline(t);
          const assigneeName =
            t.assignee_name || t.user_name || t.assigned_to_name || 'Sin asignar';
          return {
            id: t.id,
            title: t.title,
            assignee_name: assigneeName,
            status: t.status,
            dueDate: d,
            due_human: d ? formatDateHuman(d) : '-',
          };
        })
        .filter((t) => t.dueDate && t.dueDate >= startToday && t.dueDate < endToday);

      // ---- 6.4 teamRecurring (horizonte de plazos) ----
      let daily = 0;
      let weekly = 0;
      let monthly = 0;

      tasks.forEach((t) => {
        const d = getDeadline(t);
        if (!d) return;

        if (d >= startToday && d < endToday) {
          daily++;
        } else if (d >= endToday && d <= next7) {
          weekly++;
        } else if (d > next7 && d <= next30) {
          monthly++;
        }
      });

      const teamRecurring = { daily, weekly, monthly };

      // ---- 6.5 upcomingRecurring (próximas 7 días) ----
      const upcomingRecurring = tasks
        .map((t) => {
          const d = getDeadline(t);
          const assigneeName =
            t.assignee_name || t.user_name || t.assigned_to_name || 'Sin asignar';
          return {
            id: t.id,
            title: t.title,
            assignee_name: assigneeName,
            status: t.status,
            deadlineDate: d,
            next_run_human: d ? formatDateHuman(d) : '-',
          };
        })
        .filter((t) => {
          const d = t.deadlineDate;
          return (
            d &&
            d > now &&
            d <= next7 &&
            ['pending', 'in_progress', 'review'].includes(t.status)
          );
        })
        .sort((a, b) => a.deadlineDate - b.deadlineDate)
        .slice(0, 10);

      // ---- 6.6 tacticalAlerts ----
      const tacticalAlerts = [];

      if (tasksOverdue > 0) {
        tacticalAlerts.push({
          title: 'Tareas vencidas en el área',
          detail: `Hay ${tasksOverdue} tareas vencidas en tu área. Revisa la carga por persona y el tablero Kanban.`,
        });
      }

      teamLoad
        .filter((u) => (u.tasksOverdue || 0) >= 3)
        .forEach((u) => {
          tacticalAlerts.push({
            title: `Posible sobrecarga de ${u.name}`,
            detail: `${u.name} tiene ${u.tasksOverdue} tareas vencidas y ${u.tasksOpen} abiertas. Podrías re-asignar o apoyar.`,
          });
        });

      if (!tacticalAlerts.length) {
        tacticalAlerts.push({
          title: 'Sin alertas críticas',
          detail:
            'La carga del equipo está razonablemente distribuida y sin grandes atrasos.',
        });
      }

      // ==========================
      // 7) Render con TODO
      // ==========================
      res.render('supervisor', {
        title: 'Panel Supervisor',
        user: req.user,

        // lo que ya tenías
        projects,
        users,
        kanbanTasks,
        statsByStatus,
        tasks,
        userProjects,

        // lo nuevo para tu dashboard táctico
        supervisorMetrics,
        teamLoad,
        todayTasks,
        teamRecurring,
        upcomingRecurring,
        tacticalAlerts,
      });
    } catch (err) {
      console.error('Error al renderizar /supervisor:', err);
      res.status(500).send('Error al cargar panel supervisor');
    }
  }
);



// Panel Usuario (user + root)
router.get(
  '/user',
  requireAuth,
  requireRole('user', 'root'),
  panelUserView
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
  requireRole('admin', 'supervisor', 'root', 'user'),
  projectController.listarProjectsJSON
);

router.get(
  '/api/projects/:id',
  requireAuth,
  requireRole('admin', 'supervisor', 'root', 'user'),
  projectController.obtenerProjectJSON
);

router.post(
  '/api/projects',
  requireAuth,
  requireRole('admin', 'supervisor', 'root', 'user'),
  projectController.crearProject
);

router.post(
  '/api/projects/update',
  requireAuth,
  requireRole('admin', 'supervisor', 'root', 'user'),
  projectController.actualizarProject
);

// ===============================
// API TAREAS
// ===============================
router.post(
  '/api/tasks',
  requireAuth,
  requireRole('admin', 'supervisor', 'user'),
  taskController.crearTarea
);

router.patch(
  '/api/tasks/:id/status',
  requireAuth,
  requireRole('user', 'supervisor', 'admin', 'root'),
  taskController.updateStatus
);

// ===============================
// API: Commits de tareas
// ===============================
router.get(
  '/api/tasks/:id/commits',
  requireAuth,
  taskCommitController.listarCommitsPorTarea
);

router.post(
  '/api/tasks/:id/commits',
  requireAuth,
  taskCommitController.crearCommitParaTarea
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
