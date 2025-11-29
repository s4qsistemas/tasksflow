// controllers/projectController.js
const projectModel = require('../models/projectModel');

// Helpers locales para rol y área
function getUserRole(req) {
  const user = req.user;
  if (!user) return null;

  // Si viene role_name (ej. desde un JOIN)
  if (user.role_name) {
    return String(user.role_name).toLowerCase();
  }

  // Si solo viene role_id (numérico)
  const map = { 1: 'root', 2: 'admin', 3: 'supervisor', 4: 'user' };

  if (typeof user.role_id === 'number') {
    return map[user.role_id] || null;
  }

  if (typeof user.role_id === 'string') {
    const asNumber = Number(user.role_id);
    return map[asNumber] || null;
  }

  return null;
}

function getUserAreaId(req) {
  return (req.user && req.user.area_id) || null;
}

// GET /api/projects  → lista proyectos visibles para el usuario
async function listarProjectsJSON(req, res) {
  try {
    const companyId = req.user.company_id;
    const role = getUserRole(req);
    const areaId = getUserAreaId(req);

    let projects = [];

    if (role === 'supervisor') {
      if (!areaId) {
        return res.status(400).json({
          ok: false,
          message: 'No se encontró área asociada al supervisor'
        });
      }
      // Supervisor: solo proyectos de su área
      projects = await projectModel.getAllByCompanyAndArea(companyId, areaId);
    } else {
      // Admin / Root: todos los proyectos de la empresa
      projects = await projectModel.getAllByCompany(companyId);
    }

    return res.json({
      ok: true,
      data: projects
    });
  } catch (err) {
    console.error('Error al listar proyectos:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al listar proyectos'
    });
  }
}

// GET /api/projects/:id  → obtener un proyecto dentro del scope del usuario
async function obtenerProjectJSON(req, res) {
  try {
    const companyId = req.user.company_id;
    const role = getUserRole(req);
    const areaId = getUserAreaId(req);
    const id = parseInt(req.params.id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: 'ID de proyecto inválido'
      });
    }

    let project = null;

    if (role === 'supervisor') {
      if (!areaId) {
        return res.status(400).json({
          ok: false,
          message: 'No se encontró área asociada al supervisor'
        });
      }
      project = await projectModel.getByIdForArea(id, companyId, areaId);
    } else {
      project = await projectModel.getById(id, companyId);
    }

    if (!project) {
      return res.status(404).json({
        ok: false,
        message: 'Proyecto no encontrado o fuera de tu área/empresa'
      });
    }

    return res.json({
      ok: true,
      data: project
    });
  } catch (err) {
    console.error('Error al obtener proyecto:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener proyecto'
    });
  }
}

// POST /api/projects  → crear proyecto
async function crearProject(req, res) {
  try {
    const companyId = req.user.company_id;
    const role = getUserRole(req);
    const userAreaId = getUserAreaId(req);

    const { name, description, status, start_date, end_date, area_id } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        ok: false,
        message: 'El nombre del proyecto es obligatorio'
      });
    }

    let areaIdToUse = null;

    if (role === 'supervisor') {
      // Supervisor: siempre su propia área
      if (!userAreaId) {
        return res.status(400).json({
          ok: false,
          message: 'No se encontró área asociada al supervisor'
        });
      }
      areaIdToUse = userAreaId;
    } else {
      // Admin / Root: pueden elegir área (o dejar null si quieres permitir proyectos transversales)
      areaIdToUse = area_id || null;
    }

    const project = await projectModel.createProject(companyId, areaIdToUse, {
      name: name.trim(),
      description: description || null,
      status: status || 'active',
      start_date: start_date || null,
      end_date: end_date || null
    });

    return res.json({
      ok: true,
      message: 'Proyecto creado correctamente',
      data: project
    });
  } catch (err) {
    console.error('Error al crear proyecto:', err);
    return res.status(500).json({
      ok: false,
      message: 'Error al crear proyecto'
    });
  }
}

// POST /api/projects/update  → actualizar proyecto (usado por formEditarProyecto)
async function actualizarProject(req, res) {
  try {
    const companyId = req.user.company_id;
    const {
      project_id,
      name,
      description,
      status,
      start_date,
      end_date
    } = req.body;

    const id = parseInt(project_id, 10);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        message: 'ID de proyecto inválido'
      });
    }

    // 👇 armamos un objeto de actualización “inteligente”
    const updateData = {
      name: typeof name !== 'undefined' ? name.trim() : undefined,
      description,
      status
    };

    // Solo actualizamos fechas si vienen con valor (no vacío)
    if (typeof start_date !== 'undefined' && start_date !== '') {
      updateData.start_date = start_date;
    }

    if (typeof end_date !== 'undefined' && end_date !== '') {
      updateData.end_date = end_date;
    }

    const project = await projectModel.updateProject(id, companyId, updateData);

    if (!project) {
      return res.status(404).json({
        ok: false,
        message: 'Proyecto no encontrado o no pertenece a tu empresa'
      });
    }

    return res.json({
      ok: true,
      message: 'Proyecto actualizado correctamente',
      data: project
    });
  } catch (err) {
    console.error('Error al actualizar proyecto:', err);
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
