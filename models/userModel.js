// models/userModel.js
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
    `SELECT u.*, r.name AS role_name, a.name AS area_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       LEFT JOIN areas a ON a.id = u.area_id
      WHERE u.email = ? OR u.name = ?
      LIMIT 1`,
    [login, login]
  );
  return rows[0] || null;
}

async function verifyLogin(login, plainPassword) {
  const user = await getUserByEmailOrName(login);
  if (!user) return null;
  const ok = await argon2.verify(user.password, plainPassword + PEPPER);
  if (!ok) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

module.exports = { Roles, verifyLogin };