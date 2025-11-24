// models/areaModel.js
const { pool } = require('../config/db');

/**
 * Lista todas las áreas de una empresa
 */
async function getAreasByCompany(companyId) {
  const [rows] = await pool.query(
    `SELECT id, company_id, name, description, status, created_at
     FROM areas
     WHERE company_id = ?
     ORDER BY name`,
    [companyId]
  );
  return rows;
}

/**
 * Obtiene una sola área por id (validando la empresa)
 */
async function getAreaById(id, companyId) {
  const [rows] = await pool.query(
    `SELECT id, company_id, name, description, status, created_at
     FROM areas
     WHERE id = ? AND company_id = ?
     LIMIT 1`,
    [id, companyId]
  );
  return rows[0] || null;
}

/**
 * Crea un área nueva
 */
async function createArea({ company_id, name, description, status }) {
  const [result] = await pool.query(
    'INSERT INTO areas (company_id, name, description, status) VALUES (?, ?, ?, ?)',
    [company_id, name, description || null, status]
  );

  // Devolvemos el registro recién creado
  const [rows] = await pool.query(
    `SELECT id, company_id, name, description, status, created_at
     FROM areas
     WHERE id = ?`,
    [result.insertId]
  );

  return rows[0];
}

/**
 * Actualiza nombre / descripción / status de un área (sin cambiar company_id)
 */
async function updateArea({ id, company_id, name, description, status }) {
  const [result] = await pool.query(
    `UPDATE areas
     SET name = ?, description = ?, status = ?
     WHERE id = ? AND company_id = ?`,
    [name, description || null, status, id, company_id]
  );

  if (result.affectedRows === 0) {
    return null; // no existe o no pertenece a esa company
  }

  const [rows] = await pool.query(
    `SELECT id, company_id, name, description, status, created_at
     FROM areas
     WHERE id = ? AND company_id = ?`,
    [id, company_id]
  );

  return rows[0] || null;
}

/**
 * Actualiza solo el status (soft delete / activar / desactivar)
 */
async function updateAreaStatus({ id, company_id, status }) {
  const [result] = await pool.query(
    `UPDATE areas
     SET status = ?
     WHERE id = ? AND company_id = ?`,
    [status, id, company_id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const [rows] = await pool.query(
    `SELECT id, company_id, name, description, status, created_at
     FROM areas
     WHERE id = ? AND company_id = ?`,
    [id, company_id]
  );

  return rows[0] || null;
}

module.exports = {
  getAreasByCompany,
  getAreaById,
  createArea,
  updateArea,
  updateAreaStatus
};
