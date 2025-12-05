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

    return res.render('admin', {
      title: 'Panel Admin',
      user: req.user,
      areas,
      users,
      teams,
      projects,
      tasks
    });
  } catch (err) {
    console.error('Error en panelAdminView:', err);
    return res.status(500).send('Error al cargar panel admin');
  }
}

module.exports = {
  panelAdminView
};
