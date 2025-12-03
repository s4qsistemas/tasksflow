// controllers/supervisorController.js
const taskModel = require('../models/taskModel');

async function panelSupervisorView(req, res) {
  try {
    const supervisorId = req.user.id;
    const areaId = req.user.area_id; // si lo tienes en el JWT / sesión

    // 👇 Ejemplo: obtener tareas del área del supervisor
    const tasks = await taskModel.getByAreaForSupervisor(areaId);

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

    res.render('supervisor', {
      title: 'Panel Supervisor',
      kanbanTasks,
      statsByStatus,
    });
  } catch (err) {
    console.error('Error en panelSupervisorView:', err);
    res.status(500).send('Error en panel supervisor');
  }
}

module.exports = {
  panelSupervisorView,
};
