// controllers/adminController.js
const areaModel = require('../models/areaModel');
const userModel = require('../models/userModel');
const teamModel = require('../models/teamModel');
const projectModel = require('../models/projectModel');
const taskModel = require('../models/taskModel');

async function panelAdminView(req, res) {
  try {
    const companyId = req.user.company_id;

    // Admin ve TODO lo de su compañía (todas las áreas)
    const [areas, users, teams, projects, tasks] = await Promise.all([
      areaModel.getAreasByCompany(companyId),
      userModel.getAllByCompany(companyId),
      teamModel.listarTeamsPorCompany(companyId),
      projectModel.getAllByCompany(companyId),
      taskModel.getAllByCompany(companyId)
    ]);

    // ===============================
    // Armar estructura Kanban (igual idea que supervisor)
    // ===============================
    const kanbanTasks = {
      pending: [],
      in_progress: [],
      review: [],
      done: []
    };

    // tasks viene con todas las tareas de la company (cualquier área)
    tasks.forEach((t) => {
      if (t && t.status && kanbanTasks[t.status]) {
        kanbanTasks[t.status].push(t);
      }
    });

    return res.render('admin', {
      title: 'Panel Admin',
      user: req.user,
      areas,
      users,
      teams,
      projects,
      tasks,
      // 👇 nuevo: tablero Kanban para admin (company-wide)
      kanbanTasks
    });
  } catch (err) {
    console.error('Error en panelAdminView:', err);
    return res.status(500).send('Error al cargar panel admin');
  }
}

module.exports = {
  panelAdminView
};