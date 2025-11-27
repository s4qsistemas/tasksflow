const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const routes = require('./routes/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================
// 1) Sesión + user global
// ========================
if (!process.env.SESSION_SECRET) {
  throw new Error('Falta configurar SESSION_SECRET en el archivo .env');
}
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: 'lax', httpOnly: true, secure: false }
}));

// user disponible en todas las vistas EJS
app.use((req, res, next) => {
  res.locals.user = req.session?.user || null;
  next();
});

// ========================
// 2) Middlewares globales
// ========================

// CORS: políticas de origen cruzado
app.use(cors({ origin: true }));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ========================
// 2.1) Logger sencillo de requests
// ========================
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(
      `[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl} ` +
      `status=${res.statusCode} time=${ms}ms`
    );
  });

  next();
});

// ========================
// 3) Motor de vistas (EJS)
// ========================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// ========================
// 4) Archivos estáticos
// ========================
app.use(express.static(path.join(__dirname, 'public')));

// ========================
// 5) Rutas especiales
// ========================

// Silenciar ruido DevTools (evita 404 en /.well-known/...)
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) =>
  res.sendStatus(204)
);

// ========================
// 6) Rutas principales
// ========================
app.use(routes);

// ========================
// 7) Manejador de errores
// ========================
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    message: isProduction ? 'Error interno del servidor' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// ========================
// 8) Arrancar servidor
// ========================
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});