require('dotenv').config();

const mysql = require('mysql2/promise');

// Pool de conexiones DB
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Función de conexión DB
async function connectDB() {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        console.error('Error en la conexión con la base de datos:', error);
        throw error;
    }
}

// Función para cerrar la conexión
async function closeConnection(connection) {
    await connection.release();
}

module.exports = { connectDB, closeConnection };
