// controllers/supervisorController.js
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
      projectsCreator,
      users
    ] = await Promise.all([
      dashboardSupModel.getSupervisorMetrics(companyId, supervisorId),
      dashboardSupModel.getTeamLoad(companyId, supervisorId),
      dashboardSupModel.getTodayTasks(companyId, supervisorId),
      dashboardSupModel.getTeamDeadlineHorizon(companyId, supervisorId),
      dashboardSupModel.getUpcomingTasks7d(companyId, supervisorId),
      dashboardSupModel.getKanbanTasks(companyId, supervisorId),
      dashboardSupModel.getUserProjects(companyId, supervisorId),

      // ➜ todos los proyectos del área del supervisor
      projectModel.getAllByCompanyAndArea(companyId, user.area_id),

      // ➜ proyectos creados por el supervisor actual
      projectModel.getAllByCompanyAndCreator(companyId, supervisorId),

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

      // OJO: aquí defines qué conjunto usar en la vista
      projects: projectsCreator.length ? projectsCreator : projects,

      users,
      userProjects
    });
  } catch (err) {
    console.error('Error en panelSupervisorView:', err);
    res.status(500).send('Error al cargar panel del supervisor');
  }
}
