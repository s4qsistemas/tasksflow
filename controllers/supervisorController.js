// controllers/supervisorController.js
const dashboardSupModel = require('../models/supervisorDashboardModel');
const projectModel = require('../models/projectModel');
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
      projects,
      users
    ] = await Promise.all([
      dashboardSupModel.getSupervisorMetrics(companyId, supervisorId),
      dashboardSupModel.getTeamLoad(companyId, supervisorId),
      dashboardSupModel.getTodayTasks(companyId, supervisorId),
      dashboardSupModel.getTeamDeadlineHorizon(companyId, supervisorId),
      dashboardSupModel.getUpcomingTasks7d(companyId, supervisorId),
      dashboardSupModel.getKanbanTasks(companyId, supervisorId),
      dashboardSupModel.getUserProjects(companyId, supervisorId),
      projectModel.getAllByCompanyAndArea(companyId, user.area_id),
      userModel.getAllByCompany(companyId)
    ]);

    const tacticalAlerts = dashboardSupModel.buildTacticalAlerts(
      supervisorMetrics,
      teamLoad
    );

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
      projects,
      users,
      userProjects
    });
  } catch (err) {
    console.error('Error en panelSupervisorView:', err);
    res.status(500).send('Error al cargar panel del supervisor');
  }
}

module.exports = {
  panelSupervisorView
};
