// routes/routes.js
const express = require('express');
const router = express.Router();
const { postLogin } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');

// Home -> portal
router.get('/', (req, res) => res.render('portal', { title: 'TasksFlow — Portal' }));

// Login (JSON)
router.post('/login', postLogin);

// Vistas por rol
router.get('/root', requireAuth, (req, res) => res.render('root', { title: 'Panel Root' }));
router.get('/admin', requireAuth, (req, res) => res.render('admin', { title: 'Panel Admin' }));
router.get('/supervisor', requireAuth, (req, res) => res.render('supervisor', { title: 'Panel Supervisor' }));
router.get('/user', requireAuth, (req, res) => res.render('user', { title: 'Panel Usuario' }));

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

// contacto
router.post('/contacto', (req, res) => {
  const { nombre } = req.body;
  res.json({ ok: true, message: 'gracias por contactarnos. Te responderemos pronto.' });
});

module.exports = router;
