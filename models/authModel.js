// models/authModel.js
const { pool } = require('../config/db');
const argon2 = require('argon2');

const Roles = Object.freeze({
  ROOT: 'root',
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  USER: 'user'
});

const PEPPER = process.env.PEPPER || '';

async function getUserByEmailOrName(login) {
  const [rows] = await pool.query(
    `SELECT
        u.*,
        r.name       AS role_name,
        a.name       AS area_name,
        c.name       AS company_name,
        c.status     AS company_status
     FROM users u
     LEFT JOIN roles     r ON r.id = u.role_id
     LEFT JOIN areas     a ON a.id = u.area_id
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.email = ? OR u.name = ?
     LIMIT 1`,
    [login, login]
  );
  return rows[0] || null;
}

async function verifyLogin(login, plainPassword) {
  const user = await getUserByEmailOrName(login);
  if (!user) return null;

  const hashedPassword = user.password;

  // Verifica contraseña
  const ok = await argon2.verify(hashedPassword, plainPassword + PEPPER);
  if (!ok) return null;

  // No exponemos el campo "password" con ese nombre,
  // pero lo dejamos disponible como "password_hash" para capas superiores
  // (authController) que NECESITAN compararlo con DEFAULT_PASSWORD_HASH.
  const { password, ...rest } = user;

  const safeUser = {
    ...rest,
    password_hash: hashedPassword
  };

  return safeUser;
}

module.exports = { Roles, verifyLogin };
