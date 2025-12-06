// controllers/projectController.js
const projectModel = require('../models/projectModel');

// Helpers simples basados en req.user
function getUserRole(req) {
  // requireRole ya valida, aquí solo leemos
  return req.user && req.user.role ? req.user.role : null;
}

function getUserAreaId(req) {
  return req.user && req.user.area_id ? req.user.area_id : null;
}

// ===============================
// LISTAR PROJECTS (JSON)
// ===============================
async function listarProjectsJSON(req, res) {
  try {
    const companyId = req.user.company_id;
    const projects = await projectModel.getAllByCompany(companyId);

    return res.json({
      ok: true,
      data: projects
    });
  } catch (err) {
    console.error('Error listarProjectsJSON:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al listar proyectos'
    });
  }
}

// ===============================
// OBTENER 1 PROJECT (JSON)
// ===============================
async function obtenerProjectJSON(req, res) {
  try {
    const companyId = req.user.company_id;
    const projectId = req.params.id;

    const project = await projectModel.getById(companyId, projectId);

    if (!project) {
      return res.status(404).json({
        ok: false,
        message: 'Proyecto no encontrado'
      });
    }

    return res.json({
      ok: true,
      data: project
    });
  } catch (err) {
    console.error('Error obtenerProjectJSON:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener proyecto'
    });
  }
}

// ===============================
// CREAR PROJECT
// ===============================
// Usado por: POST /api/projects
// ===============================
// CREAR PROJECT
// ===============================
// Usado por: POST /api/projects
async function crearProject(req, res) {
  try {
    const companyId   = req.user.company_id;
    const creatorId   = req.user.id;
    const userAreaId  = req.user.area_id || null;   // 👈 directo
    const role        = req.user.role_name || null; // 👈 USAMOS role_name

    const { name, description, status, start_date, end_date, area_id } = req.body;

    console.log('▶️ crearProject - req.user:', req.user);
    console.log('▶️ crearProject - role:', role, 'userAreaId:', userAreaId);
    console.log('▶️ crearProject - req.body:', req.body);

    if (!name || !name.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'El nombre del proyecto es obligatorio'
      });
    }

    let areaIdToUse = null;

    if (role === 'supervisor' || role === 'user') {
      // Supervisor y user: siempre su propia área
      areaIdToUse = userAreaId;
    } else if (role === 'admin' || role === 'root') {
      // Admin/root: pueden elegir área o dejar sin área
      if (area_id && area_id !== '__NO_AREA__') {
        areaIdToUse = parseInt(area_id, 10) || null;
      } else {
        areaIdToUse = null; // proyecto sin área
      }
    }

    const projectData = {
      companyId,
      areaId: areaIdToUse,
      name: name.trim(),
      description: description || '',
      status: status || 'active',
      startDate: start_date || null,
      endDate: end_date || null,
      creatorId
    };

    console.log('▶️ crearProject - projectData a guardar:', projectData);

    const newId = await projectModel.create(projectData);

    return res.json({
      ok: true,
      message: 'Proyecto creado correctamente',
      data: { id: newId }
    });
  } catch (err) {
    console.error('❌ Error crearProject:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al crear proyecto'
    });
  }
}

// ===============================
// ACTUALIZAR PROJECT
// ===============================
// Usado por: POST /api/projects/update
async function actualizarProject(req, res) {
  try {
    const companyId = req.user.company_id;
    const role = getUserRole(req);
    const userAreaId = getUserAreaId(req);

    // En el formEditarProyecto el ID viene como project_id
    const {
      project_id,
      name,
      description,
      status,
      start_date,
      end_date,
      area_id // opcional (si algún día editas el área)
    } = req.body;

    if (!project_id) {
      return res.status(400).json({
        ok: false,
        message: 'Falta el ID del proyecto a editar'
      });
    }

    const project = await projectModel.getById(companyId, project_id);
    if (!project) {
      return res.status(404).json({
        ok: false,
        message: 'Proyecto no encontrado'
      });
    }

    let areaIdToUse = project.area_id; // por defecto mantenemos
    if (role === 'supervisor' || role === 'user') {
      areaIdToUse = userAreaId || project.area_id;
    } else if (role === 'admin' || role === 'root') {
      areaIdToUse = area_id || project.area_id;
    }

    const patch = {
      id: project_id,
      companyId,
      areaId: areaIdToUse,
      name: name || project.name,
      description: description || project.description,
      status: status || project.status,
      startDate: start_date || project.start_date,
      endDate: end_date || project.end_date
    };

    await projectModel.update(patch);

    return res.json({
      ok: true,
      message: 'Proyecto actualizado correctamente'
    });
  } catch (err) {
    console.error('Error actualizarProject:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al actualizar proyecto'
    });
  }
}

module.exports = {
  listarProjectsJSON,
  obtenerProjectJSON,
  crearProject,
  actualizarProject
};