// controllers/companyController.js
const Company = require('../models/companyModel');

/**
 * Vista root con listado de companies
 * (Solo root, protegido en las rutas con requireRole('root'))
 */
async function listarCompaniesView(req, res, next) {
  try {
    const companies = await Company.getCompanies();

    res.render('root', {
      title: 'Panel Root',
      user: req.user,
      companies
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Listar companies en JSON (útil para AJAX / modals en root)
 */
async function listarCompaniesJSON(req, res, next) {
  try {
    const companies = await Company.getCompanies();
    res.json({ ok: true, data: companies });
  } catch (err) {
    next(err);
  }
}

/**
 * Obtener una sola company en JSON (para editar en modal, por ejemplo)
 */
async function obtenerCompanyJSON(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, message: 'ID de empresa inválido' });
    }

    const company = await Company.getCompanyById(id);

    if (!company) {
      return res.status(404).json({ ok: false, message: 'Empresa no encontrada' });
    }

    res.json({ ok: true, data: company });
  } catch (err) {
    next(err);
  }
}

/**
 * Crear company (desde modal root, via fetch/JSON)
 */
async function crearCompany(req, res, next) {
  try {
    const { name, description, status } = req.body;

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: 'El nombre de la empresa es obligatorio' });
    }

    // Normalizar estado
    const finalStatus = status === 'inactive' ? 'inactive' : 'active';

    const nueva = await Company.createCompany({
      name: name.trim(),
      description: description?.trim() || null,
      status: finalStatus
    });

    res.status(201).json({
      ok: true,
      message: 'Empresa creada correctamente',
      data: nueva
    });
  } catch (err) {
    console.error('❌ [crearCompany] Error:', err);
    next(err);
  }
}

/**
 * Actualizar company (nombre / descripción / status)
 * Ruta típica: PUT /companies/:id  o  POST /companies/:id/edit
 */
async function actualizarCompany(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, description, status } = req.body;

    if (!id) {
      return res.status(400).json({ ok: false, message: 'ID de empresa inválido' });
    }

    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: 'El nombre de la empresa es obligatorio' });
    }

    const finalStatus =
      status === 'inactive'
        ? 'inactive'
        : 'active';

    const actualizada = await Company.updateCompany({
      id,
      name: name.trim(),
      description: description?.trim() || null,
      status: finalStatus
    });

    if (!actualizada) {
      return res
        .status(404)
        .json({ ok: false, message: 'Empresa no encontrada' });
    }

    res.json({
      ok: true,
      message: 'Empresa actualizada correctamente',
      data: actualizada
    });
  } catch (err) {
    console.error('❌ [actualizarCompany] Error:', err);
    next(err);
  }
}

/**
 * "Eliminar" company = marcar como inactive (soft delete)
 * Ruta típica: PATCH /companies/:id/status  o  POST /companies/:id/delete
 */
async function desactivarCompany(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, message: 'ID de empresa inválido' });
    }

    const company = await Company.updateCompanyStatus({
      id,
      status: 'inactive'
    });

    if (!company) {
      return res
        .status(404)
        .json({ ok: false, message: 'Empresa no encontrada' });
    }

    res.json({
      ok: true,
      message: 'Empresa desactivada correctamente',
      data: company
    });
  } catch (err) {
    console.error('❌ [desactivarCompany] Error:', err);
    next(err);
  }
}

/**
 * (Opcional) Activar empresa de nuevo
 */
async function activarCompany(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, message: 'ID de empresa inválido' });
    }

    const company = await Company.updateCompanyStatus({
      id,
      status: 'active'
    });

    if (!company) {
      return res
        .status(404)
        .json({ ok: false, message: 'Empresa no encontrada' });
    }

    res.json({
      ok: true,
      message: 'Empresa activada correctamente',
      data: company
    });
  } catch (err) {
    console.error('❌ [activarCompany] Error:', err);
    next(err);
  }
}

module.exports = {
  listarCompaniesView,
  listarCompaniesJSON,
  obtenerCompanyJSON,
  crearCompany,
  actualizarCompany,
  desactivarCompany,
  activarCompany
};
