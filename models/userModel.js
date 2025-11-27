// models/userModel.js
const { pool } = require('../config/db');

// Hash por defecto para nuevos usuarios y reseteos
// OJO: este valor debe ser el hash Argon2 de la contraseña genérica
// y se guardará en la columna `password` de la tabla `users`.
const DEFAULT_PASSWORD_HASH = process.env.DEFAULT_USER_PASSWORD_HASH || null;

/**
 * Lista todos los usuarios de una empresa
 */
async function getUsersByCompany(companyId) {
  const [rows] = await pool.query(
    `SELECT
       id,
       company_id,
       area_id,
       manager_id,
       role_id,
       name,
       email,
       telephone,
       status,
       created_at
     FROM users
     WHERE company_id = ?
     ORDER BY name`,
    [companyId]
  );
  return rows;
}

/**
 * Obtiene un usuario por id (validando empresa)
 */
async function getUserById(id, companyId) {
  const [rows] = await pool.query(
    `SELECT
       id,
       company_id,
       area_id,
       manager_id,
       role_id,
       name,
       email,
       telephone,
       status,
       created_at
     FROM users
     WHERE id = ? AND company_id = ?
     LIMIT 1`,
    [id, companyId]
  );
  return rows[0] || null;
}

/**
 * Obtiene un usuario por email (por si lo necesitas en otro lado)
 * Nota: tampoco exponemos el hash aquí.
 */
async function getUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT
       id,
       company_id,
       area_id,
       manager_id,
       role_id,
       name,
       email,
       telephone,
       status,
       created_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Crea un usuario nuevo
 * En la BD, el hash se guarda en la columna `password`.
 */
async function createUser({
  company_id,
  area_id,
  manager_id,
  role_id,
  name,
  email,
  telephone,
  status,
  password_hash
}) {
  const [result] = await pool.query(
    `INSERT INTO users
       (company_id, area_id, manager_id, role_id, name, email, telephone, status, password)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      company_id,
      area_id || null,
      manager_id || null,
      role_id,
      name,
      email,
      telephone || null,
      status,
      password_hash || DEFAULT_PASSWORD_HASH
    ]
  );

  const [rows] = await pool.query(
    `SELECT
       id, company_id, area_id, manager_id, role_id,
       name, email, telephone, status, created_at
     FROM users
     WHERE id = ?`,
    [result.insertId]
  );

  return rows[0];
}

/**
 * Actualiza datos de usuario (sin cambiar company_id ni password)
 */
async function updateUser({
  id,
  company_id,
  area_id,
  manager_id,
  role_id,
  name,
  email,
  telephone,
  status
}) {
  const [result] = await pool.query(
    `UPDATE users
     SET
       area_id = ?,
       manager_id = ?,
       role_id = ?,
       name = ?,
       email = ?,
       telephone = ?,
       status = ?
     WHERE id = ? AND company_id = ?`,
    [
      area_id || null,
      manager_id || null,
      role_id,
      name,
      email,
      telephone || null,
      status,
      id,
      company_id
    ]
  );

  if (result.affectedRows === 0) return null;

  const [rows] = await pool.query(
    `SELECT
       id, company_id, area_id, manager_id, role_id,
       name, email, telephone, status, created_at
     FROM users
     WHERE id = ? AND company_id = ?`,
    [id, company_id]
  );

  return rows[0] || null;
}

/**
 * Reset password -> vuelve a la genérica del .env
 * Actualiza la columna `password`
 */
async function resetPassword(id, company_id) {
  if (!DEFAULT_PASSWORD_HASH) {
    throw new Error('DEFAULT_USER_PASSWORD_HASH no está definido en .env');
  }

  const [result] = await pool.query(
    `UPDATE users
     SET password = ?
     WHERE id = ? AND company_id = ?`,
    [DEFAULT_PASSWORD_HASH, id, company_id]
  );

  return result.affectedRows > 0;
}

/**
 * Actualiza la password a un hash específico (cambio de contraseña del usuario)
 * Actualiza la columna `password`
 */
async function updatePassword(id, company_id, newHash) {
  const [result] = await pool.query(
    `UPDATE users
     SET password = ?
     WHERE id = ? AND company_id = ?`,
    [newHash, id, company_id]
  );

  return result.affectedRows > 0;
}

// Lista todos los usuarios con rol "admin" (role_id = 2) junto con el nombre de la empresa
async function getAdminsWithCompany() {
  const [rows] = await pool.query(
    `SELECT
       u.id,
       u.company_id,
       u.area_id,
       u.manager_id,
       u.role_id,
       u.name,
       u.email,
       u.telephone,
       u.status,
       u.created_at,
       c.name AS company_name
     FROM users u
     LEFT JOIN companies c ON c.id = u.company_id
     WHERE u.role_id = 2
     ORDER BY c.name, u.name`
  );
  return rows;
}

// Obtiene un usuario por id, sin validar empresa (uso exclusivo para root)
async function getUserByIdAnyCompany(id) {
  const [rows] = await pool.query(
    `SELECT
       id,
       company_id,
       area_id,
       manager_id,
       role_id,
       name,
       email,
       telephone,
       status,
       created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  getUsersByCompany,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  resetPassword,
  updatePassword,
  getAdminsWithCompany,
  getUserByIdAnyCompany
};
