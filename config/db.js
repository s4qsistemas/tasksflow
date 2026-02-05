require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function connectDB() {
  const connection = await pool.getConnection();
  return connection;
}

async function closeConnection(connection) {
  if (connection) connection.release();
}

module.exports = { connectDB, closeConnection, pool };


// mkdir config
// touch db.js | echo > db.js
// rm db.js | del db.js
// rm -r config | RMDIR /S /Q config

// chcp 65001
// mysql -u root -p --default-character-set=utf8mb4 tasksflow