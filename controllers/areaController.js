// controllers/areaController.js
const Area = require('../models/areaModel');

/**
 * Vista admin con listado de áreas
 */
async function listarAreasView(req, res, next) {
  try {
    const companyId = req.user?.company_id || 1;

    const areas = await Area.getAreasByCompany(companyId);

    res.render('admin', {
      title: 'Panel Admin',
      user: req.user,
      areas
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Listar áreas en JSON (útil para AJAX)
 */
async function listarAreasJSON(req, res, next) {
  try {
    const companyId = req.user?.company_id || 1;
    const areas = await Area.getAreasByCompany(companyId);
    res.json({ ok: true, data: areas });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener una sola área en JSON (para editar en modal, por ejemplo)
 */
async function obtenerAreaJSON(req, res, next) {
  try {
    const companyId = req.user?.company_id || 1;
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, message: 'ID de área inválido' });
    }

    const area = await Area.getAreaById(id, companyId);

    if (!area) {
      return res.status(404).json({ ok: false, message: 'Área no encontrada' });
    }

    res.json({ ok: true, data: area });
  } catch (err) {
    next(err);
  }
}

/**
 * Crear área (desde modal, via fetch/JSON)
 */
async function crearArea(req, res, next) {
  try {
    const companyId = req.user?.company_id || 1;
    const { name, description, status } = req.body;

    // DEBUG opcional:
    // console.log('🔎 [crearArea] req.body:', req.body);

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: 'El nombre del área es obligatorio' });
    }

    // Normalizar estado
    const finalStatus = status === 'inactive' ? 'inactive' : 'active';

    const nueva = await Area.createArea({
      company_id: companyId,
      name: name.trim(),
      description: description?.trim() || null,
      status: finalStatus
    });

    res.status(201).json({
      ok: true,
      message: 'Área creada correctamente',
      data: nueva
    });
  } catch (err) {
    console.error('❌ [crearArea] Error:', err);
    next(err);
  }
}

/**
 * Actualizar área (nombre / descripción / status)
 * Ruta típica: PUT /areas/:id  o  POST /areas/:id/edit
 */
async function actualizarArea(req, res, next) {
  try {
    const companyId = req.user?.company_id || 1;
    const id = Number(req.params.id);
    const { name, description, status } = req.body;

    if (!id) {
      return res.status(400).json({ ok: false, message: 'ID de área inválido' });
    }

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: 'El nombre del área es obligatorio' });
    }

    const finalStatus =
      status === 'inactive'
        ? 'inactive'
        : 'active';

    const actualizada = await Area.updateArea({
      id,
      company_id: companyId,
      name: name.trim(),
      description: description?.trim() || null,
      status: finalStatus
    });

    if (!actualizada) {
      return res
        .status(404)
        .json({ ok: false, message: 'Área no encontrada o no pertenece a esta empresa' });
    }

    res.json({
      ok: true,
      message: 'Área actualizada correctamente',
      data: actualizada
    });
  } catch (err) {
    console.error('❌ [actualizarArea] Error:', err);
    next(err);
  }
}

/**
 * "Eliminar" área = marcar como inactive (soft delete)
 * Ruta típica: PATCH /areas/:id/status  o  POST /areas/:id/delete
 */
async function desactivarArea(req, res, next) {
  try {
    const companyId = req.user?.company_id || 1;
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, message: 'ID de área inválido' });
    }

    const area = await Area.updateAreaStatus({
      id,
      company_id: companyId,
      status: 'inactive'
    });

    if (!area) {
      return res
        .status(404)
        .json({ ok: false, message: 'Área no encontrada o no pertenece a esta empresa' });
    }

    res.json({
      ok: true,
      message: 'Área desactivada correctamente',
      data: area
    });
  } catch (err) {
    console.error('❌ [desactivarArea] Error:', err);
    next(err);
  }
}

/**
 * (Opcional) Activar área de nuevo
 */
async function activarArea(req, res, next) {
  try {
    const companyId = req.user?.company_id || 1;
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, message: 'ID de área inválido' });
    }

    const area = await Area.updateAreaStatus({
      id,
      company_id: companyId,
      status: 'active'
    });

    if (!area) {
      return res
        .status(404)
        .json({ ok: false, message: 'Área no encontrada o no pertenece a esta empresa' });
    }

    res.json({
      ok: true,
      message: 'Área activada correctamente',
      data: area
    });
  } catch (err) {
    console.error('❌ [activarArea] Error:', err);
    next(err);
  }
}

module.exports = {
  listarAreasView,
  listarAreasJSON,
  obtenerAreaJSON,
  crearArea,
  actualizarArea,
  desactivarArea,
  activarArea
};
