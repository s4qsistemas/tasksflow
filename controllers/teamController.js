// controllers/teamController.js
const teamModel = require('../models/teamModel');

// Helper de respuesta estándar
function jsonOk(res, data = null, message = 'OK') {
  return res.json({ ok: true, data, message });
}

function jsonError(res, message = 'Error interno', status = 500) {
  return res.status(status).json({ ok: false, message });
}

// ===============================
// TEAMS
// ===============================

// GET /api/teams
async function listarTeamsJSON(req, res) {
  try {
    const companyId = req.user.company_id;
    if (!companyId) return jsonError(res, 'Empresa no definida para el usuario', 400);

    const teams = await teamModel.listarTeamsPorCompany(companyId);
    return jsonOk(res, teams);
  } catch (err) {
    console.error('Error listarTeamsJSON:', err);
    return jsonError(res);
  }
}

// GET /api/teams/:id
async function obtenerTeamJSON(req, res) {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const team = await teamModel.obtenerTeamPorId(id, companyId);
    if (!team) return jsonError(res, 'Team no encontrado', 404);

    return jsonOk(res, team);
  } catch (err) {
    console.error('Error obtenerTeamJSON:', err);
    return jsonError(res);
  }
}

// POST /api/teams
async function crearTeam(req, res) {
  try {
    const companyId = req.user.company_id;
    if (!companyId) return jsonError(res, 'Empresa no definida para el usuario', 400);

    const { name, description, type, status } = req.body;

    if (!name || !name.trim()) {
      return jsonError(res, 'El nombre del grupo es obligatorio', 400);
    }

    const id = await teamModel.crearTeam({
      company_id: companyId,
      name: name.trim(),
      description: description?.trim() || null,
      type: type || 'other',
      status: status || 'active'
    });

    const team = await teamModel.obtenerTeamPorId(id, companyId);
    return jsonOk(res, team, 'Grupo creado correctamente');
  } catch (err) {
    console.error('Error crearTeam:', err);
    return jsonError(res);
  }
}

// POST /api/teams/:id/edit
async function actualizarTeam(req, res) {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;
    const { name, description, type, status } = req.body;

    if (!name || !name.trim()) {
      return jsonError(res, 'El nombre del grupo es obligatorio', 400);
    }

    const ok = await teamModel.actualizarTeam(id, companyId, {
      name: name.trim(),
      description: description?.trim() || null,
      type: type || 'other',
      status: status || 'active'
    });

    if (!ok) return jsonError(res, 'Team no encontrado o sin cambios', 404);

    const team = await teamModel.obtenerTeamPorId(id, companyId);
    return jsonOk(res, team, 'Grupo actualizado correctamente');
  } catch (err) {
    console.error('Error actualizarTeam:', err);
    return jsonError(res);
  }
}

// ===============================
// MEMBERS
// ===============================

// GET /api/teams/:id/members
async function listarMiembrosTeamJSON(req, res) {
  try {
    const { id } = req.params;
    const companyId = req.user.company_id;

    const miembros = await teamModel.listarMiembrosTeam(id, companyId);
    return jsonOk(res, miembros);
  } catch (err) {
    console.error('Error listarMiembrosTeamJSON:', err);
    return jsonError(res);
  }
}

// POST /api/teams/:id/members/add
async function agregarMiembroTeam(req, res) {
  try {
    const { id } = req.params; // team_id
    const companyId = req.user.company_id;
    const { user_id, role_in_team } = req.body;

    if (!user_id) return jsonError(res, 'user_id obligatorio', 400);

    const ok = await teamModel.agregarMiembroTeam(
      id,
      companyId,
      user_id,
      role_in_team || 'member'
    );

    if (!ok) return jsonError(res, 'No se pudo agregar el miembro (team inválido)', 400);

    const miembros = await teamModel.listarMiembrosTeam(id, companyId);
    return jsonOk(res, miembros, 'Miembro agregado correctamente');
  } catch (err) {
    console.error('Error agregarMiembroTeam:', err);
    return jsonError(res);
  }
}

// POST /api/teams/:id/members/remove
async function quitarMiembroTeam(req, res) {
  try {
    const { id } = req.params; // team_id
    const companyId = req.user.company_id;
    const { user_id } = req.body;

    if (!user_id) return jsonError(res, 'user_id obligatorio', 400);

    const ok = await teamModel.quitarMiembroTeam(id, companyId, user_id);
    if (!ok) return jsonError(res, 'No se pudo quitar el miembro', 400);

    const miembros = await teamModel.listarMiembrosTeam(id, companyId);
    return jsonOk(res, miembros, 'Miembro quitado correctamente');
  } catch (err) {
    console.error('Error quitarMiembroTeam:', err);
    return jsonError(res);
  }
}

module.exports = {
  listarTeamsJSON,
  obtenerTeamJSON,
  crearTeam,
  actualizarTeam,
  listarMiembrosTeamJSON,
  agregarMiembroTeam,
  quitarMiembroTeam
};
