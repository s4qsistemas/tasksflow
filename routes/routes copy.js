const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/controller');
const { getUserById } = require('../models/models');

// Auth DEV: x-user-id
router.use(async (req, res, next) => {
  try {
    if (req.path === '/api/login') return next();
    const headerId = req.header('x-user-id');
    if (!headerId) return res.status(401).json({ message: 'Falta x-user-id (DEV auth)' });
    const user = await getUserById(headerId);
    if (!user) return res.status(401).json({ message: 'Usuario no válido' });
    req.user = user;
    next();
  } catch (e) { next(e); }
});

// API
router.post('/api/login', express.urlencoded({ extended: true }), ctrl.login);
router.get('/api/tasks', ctrl.listMyTasks);
router.post('/api/tasks/personal', express.json(), ctrl.createPersonalTask);
router.post('/api/tasks', express.json(), ctrl.createDirectedTask);
router.patch('/api/tasks/:id', express.json(), ctrl.patchTask);

// Commits
router.get('/api/tasks/:id/commits', ctrl.listTaskCommits);
router.post('/api/tasks/:id/revert', express.json(), ctrl.revertTaskToCommit);
router.patch('/api/tasks/:id/status', express.json(), ctrl.updateTaskStatus);

// Vistas
router.get('/', (req, res) => res.redirect('/dashboard'));
router.get('/dashboard', ctrl.renderDashboard);

module.exports = router;