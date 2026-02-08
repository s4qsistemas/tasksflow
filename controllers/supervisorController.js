// controllers/supervisorController.js
const dashboardSupModel = require('../models/supervisorDashboardModel');
const projectModel = require('../models/projectModel');
const taskModel = require('../models/taskModel');
const userModel = require('../models/userModel');
async function panelSupervisorView(req, res) {
  try {
    const user = req.user;
    const companyId = user.company_id;
    const supervisorId = user.id;

    const [
      supervisorMetrics,
      teamLoad,
      todayTasks,
      teamDeadlineHorizon,
      upcomingTasks,
      kanbanTasks,
      userProjects,
      projectsArea,
      projectsCreator,
      userTasks,   // 👈 NUEVO
      users        // 👈 ahora sí son los usuarios
    ] = await Promise.all([
      dashboardSupModel.getSupervisorMetrics(companyId, supervisorId),
      dashboardSupModel.getTeamLoad(companyId, supervisorId),
      dashboardSupModel.getTodayTasks(companyId, supervisorId),
      dashboardSupModel.getTeamDeadlineHorizon(companyId, supervisorId),
      dashboardSupModel.getUpcomingTasks7d(companyId, supervisorId),
      dashboardSupModel.getKanbanTasks(companyId, supervisorId),
      dashboardSupModel.getUserProjects(companyId, supervisorId),

      // ✅ todos los proyectos del ÁREA del supervisor
      projectModel.getAllByCompanyAndArea(companyId, user.area_id),

      // ✅ proyectos creados por el supervisor actual
      projectModel.getProjectsByParticipationSubquery(companyId, supervisorId),

      // ✅ Tareas asignadas al user actual
      taskModel.getByAssignee(user.id, companyId),

      // ✅ Usuarios de la empresa
      userModel.getAllByCompany(companyId)
    ]);

    const tacticalAlerts = dashboardSupModel.buildTacticalAlerts(
      supervisorMetrics,
      teamLoad
    );

    // Unificar proyectos del área + proyectos donde participa el supervisor
    // Usamos un Map para eliminar duplicados por ID
    const allProjectsMap = new Map();

    // 1. Agregar proyectos del área
    if (projectsArea && projectsArea.length) {
      projectsArea.forEach(p => allProjectsMap.set(p.id, p));
    }

    // 2. Agregar proyectos donde participa (puede que algunos ya estén, se sobrescriben)
    if (projectsCreator && projectsCreator.length) {
      projectsCreator.forEach(p => allProjectsMap.set(p.id, p));
    }

    const finalProjects = Array.from(allProjectsMap.values());

    res.render('supervisor', {
      title: 'Panel Supervisor',
      user,
      supervisorMetrics,
      teamLoad,
      todayTasks,
      teamRecurring: teamDeadlineHorizon,
      upcomingRecurring: upcomingTasks,
      tacticalAlerts,
      kanbanTasks,

      // ✅ Enviamos la lista unificada
      projects: finalProjects,

      users,
      userProjects,
      userTasks // 👈 si quieres usarlo en la vista
    });
  } catch (err) {
    console.error('Error en panelSupervisorView:', err);
    res.status(500).send('Error al cargar panel del supervisor');
  }
}

module.exports = {
  panelSupervisorView
};
