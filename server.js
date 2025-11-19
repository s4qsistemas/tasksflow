const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const session = require('express-session');

const routes = require('./routes/routes');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(session({
  secret: process.env.SESSION_SECRET || 'cambia_este_secreto',
  resave: false,
  saveUninitialized: false,
  cookie: { sameSite: 'lax', httpOnly: true, secure: false }
}));

// View engine: configura el motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Static: configura la entrega de archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
//app.use('/css', express.static(path.join(__dirname, 'public/css')));

// Middleware: procesar el cuerpo de la solicitud (Body Parsing)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CORS: configura las políticas de origen cruzado
app.use(cors({ origin: true }));

// ✅ NUEVO: silenciar ruido DevTools (evita 404 en /.well-known/...)
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.sendStatus(204));

// Rutas: configura el enrutador principa
app.use(routes);

// Errores
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

//const PORT = 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
