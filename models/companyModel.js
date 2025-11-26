// models/companyModel.js
const { pool } = require('../config/db');

/**
 * Lista todas las companies
 */
async function getCompanies() {
  const [rows] = await pool.query(
    `SELECT id, name, description, status, created_at
     FROM companies
     ORDER BY name`
  );
  return rows;
}

/**
 * Obtiene una sola company por id
 */
async function getCompanyById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, description, status, created_at
     FROM companies
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Crea una company nueva
 */
async function createCompany({ name, description, status }) {
  const [result] = await pool.query(
    'INSERT INTO companies (name, description, status) VALUES (?, ?, ?)',
    [name, description || null, status]
  );

  // Devolvemos el registro recién creado
  const [rows] = await pool.query(
    `SELECT id, name, description, status, created_at
     FROM companies
     WHERE id = ?`,
    [result.insertId]
  );

  return rows[0];
}

/**
 * Actualiza nombre / descripción / status de una company
 */
async function updateCompany({ id, name, description, status }) {
  const [result] = await pool.query(
    `UPDATE companies
     SET name = ?, description = ?, status = ?
     WHERE id = ?`,
    [name, description || null, status, id]
  );

  if (result.affectedRows === 0) {
    return null; // no existe
  }

  const [rows] = await pool.query(
    `SELECT id, name, description, status, created_at
     FROM companies
     WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
}

/**
 * Actualiza solo el status (soft delete / activar / desactivar)
 */
async function updateCompanyStatus({ id, status }) {
  const [result] = await pool.query(
    `UPDATE companies
     SET status = ?
     WHERE id = ?`,
    [status, id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const [rows] = await pool.query(
    `SELECT id, name, description, status, created_at
     FROM companies
     WHERE id = ?`,
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  updateCompanyStatus
};
