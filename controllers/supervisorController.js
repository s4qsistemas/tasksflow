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
      projectModel.getAllByCompanyAndCreator(companyId, supervisorId),

      // ✅ Tareas asignadas al user actual
      taskModel.getByAssignee(user.id, companyId),

      // ✅ Usuarios de la empresa
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

      // ✅ si el supervisor tiene proyectos propios, usa esos; si no, usa los del área
      projects: projectsCreator.length ? projectsCreator : projectsArea,

      users,
      userProjects,
      userTasks // 👈 si quieres usarlo en la vista
    });
  } catch (err) {
    console.error('Error en panelSupervisorView:', err);
    res.status(500).send('Error al cargar panel del supervisor');
  }
}
