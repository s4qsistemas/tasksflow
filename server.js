const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const routes = require('./routes/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
// Procesar JSON y datos URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración CORS
const corsOptions = {
    origin: process.env.CORS_ALLOWED_ORIGINS.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Servir archivos estáticos carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Vistas
app.get('/', (req, res) => res.render('index', { title: 'Inicio' }));
app.get('/login', (req, res) => res.render('login', { title: 'Login' }));

/*
// Ruta para servir el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
*/

// Rutas de la API
//app.use('/api', routes);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack); // Log de errores

    const isProduction = process.env.NODE_ENV === 'production' || false;

    // Código de error
    let statusCode = err.status || 500;

    // Enviar la respuesta
    res.status(statusCode).json({
        message: isProduction ? 'Error interno del servidor' : err.message,
        ...(isProduction ? {} : { stack: err.stack }) // Stack en desarrollo
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// npm run dev:css
// node server.js
