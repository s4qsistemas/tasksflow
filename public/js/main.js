document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const contactForm = document.getElementById('contactForm');

  // helper: POST con form-urlencoded (compatible con express.urlencoded)
  async function postForm(url, form) {
    const body = new URLSearchParams(new FormData(form));
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body
    });

    // Soporta texto o JSON
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      return res.json();
    }
    return res.text();
  }

  // helper: muestra mensaje simple
  function notify(msg) {
    // msg puede ser string o { ok, message, ... }
    if (typeof msg === 'string') {
      alert(msg);
    } else if (msg && typeof msg === 'object') {
      alert(msg.message || 'OK');
    } else {
      alert('OK');
    }

    // Exponer notify de forma global para usarlo en los EJS
    window.notify = notify;
  }

  // helper: toggle modal (versión con reset + tabs para admin/root)
  function toggleModal(id, show) {
    const el = document.getElementById(id);
    if (!el) return;

    if (show) {
      // Mostrar modal
      el.classList.remove('hidden');
      el.classList.add('flex');
    } else {
      // 🔹 Al cerrar el modal, reseteamos todos los formularios internos
      const forms = el.querySelectorAll('form');
      forms.forEach((f) => f.reset());

      // 🔹 Y, si aplica, volvemos siempre a la pestaña "Registrar"
      if (id === 'modalNuevaArea' && typeof window.switchAreaTab === 'function') {
        window.switchAreaTab('registrar');
      }

      if (id === 'modalNuevoUsuario' && typeof window.switchUsuarioTab === 'function') {
        window.switchUsuarioTab('registrar');
      }

      // 🔹 Companies (root)
      if (id === 'modalNuevaCompany' && typeof window.switchCompanyTab === 'function') {
        window.switchCompanyTab('registrar');
      }

      // 🔹 Admin del root
      if (id === 'modalRootAdminUsers' && typeof window.switchRootAdminTab === 'function') {
        window.switchRootAdminTab('registrar');
      }

      // 🔹 Grupos de trabajo (admin)
      if (id === 'modalNuevoGrupo' && typeof window.switchTeamTab === 'function') {
        window.switchTeamTab('registrar');
      }

      // 🔹 Proyectos (admin)
      if (id === 'modalNuevoProyecto' && typeof window.switchProyectoTab === 'function') {
        window.switchProyectoTab('registrar');
      }

      // 🔹 Nueva tarea: volver siempre a asignación por TEAM
      if (id === 'modalNuevaTarea' && typeof window.switchTaskAssignment === 'function') {
        window.switchTaskAssignment('team');
      }

      // Ocultar modal
      el.classList.add('hidden');
      el.classList.remove('flex');
    }
  }

  // Exponer toggleModal globalmente (para usar en onclick en el HTML)
  window.toggleModal = toggleModal;

  // ============================ 
  // TOGGLE DASHBOARD / KANBAN (Admin, Supervisor, User)
  // ============================
  function toggleKanbanView(checkbox, opts) {
    opts = opts || {};
    const isInit = !!opts.init;   // 👈 para saber si es llamada de inicialización

    const candidates = [
      { dashId: 'adminDashboardView',      kanbanId: 'adminKanbanView',      role: 'admin' },
      { dashId: 'supervisorDashboardView', kanbanId: 'supervisorKanbanView', role: 'supervisor' },
      { dashId: 'userDashboardView',       kanbanId: 'userKanbanView',       role: 'user' }
    ];

    let dash = null;
    let kanban = null;
    let currentRole = null;

    // Detectar qué par (dashboard/kanban) existe en esta vista
    for (const cfg of candidates) {
      const d = document.getElementById(cfg.dashId);
      const k = document.getElementById(cfg.kanbanId);
      if (d && k) {
        dash = d;
        kanban = k;
        currentRole = cfg.role;
        break;
      }
    }

    if (!dash || !kanban) return;

    const label = document.getElementById('kanbanToggleLabel');
    const isOn = checkbox && checkbox.checked;

    if (isOn) {
      // --- MODO KANBAN ---
      dash.classList.add('hidden');
      kanban.classList.remove('hidden');

      if (label) {
        label.style.backgroundColor = '#C6FF00';
        label.style.color = '#111827';
        label.style.borderColor = '#AEEA00';
      }

      // 🔹 Lógica especial SOLO para SUPERVISOR
      if (currentRole === 'supervisor') {
        const btnNuevoUsuario  = document.getElementById('btnSupervisorNuevoUsuario');
        const btnNuevaTarea    = document.getElementById('btnSupervisorNuevaTarea');
        const btnProyectos     = document.getElementById('btnSupervisorProyectos');

        if (btnNuevoUsuario) btnNuevoUsuario.classList.add('hidden');
        if (btnNuevaTarea)   btnNuevaTarea.classList.remove('hidden');
        if (btnProyectos)    btnProyectos.classList.remove('hidden'); // 👈 mostrar en Kanban
      }

      // 🔹 Lógica especial SOLO para ADMIN
      if (currentRole === 'admin') {
        const btnArea         = document.getElementById('btnAdminNuevaArea');
        const btnUsuario      = document.getElementById('btnAdminNuevoUsuario');
        const btnNuevoGrupo   = document.getElementById('btnAdminNuevoGrupo');
        const btnEditarGrupo  = document.getElementById('btnAdminEditarGrupo');
        const btnProyectos    = document.getElementById('btnAdminProyectos');
        const btnNuevaTarea   = document.getElementById('btnAdminNuevaTarea');

        // Ocultar áreas/usuarios/teams (romper también el sm:inline-flex)
        if (btnArea) {
          btnArea.classList.add('hidden');
          btnArea.classList.remove('sm:inline-flex');
        }
        if (btnUsuario) {
          btnUsuario.classList.add('hidden');
          btnUsuario.classList.remove('sm:inline-flex');
        }
        if (btnNuevoGrupo) {
          btnNuevoGrupo.classList.add('hidden');
          btnNuevoGrupo.classList.remove('sm:inline-flex');
        }
        if (btnEditarGrupo) {
          btnEditarGrupo.classList.add('hidden');
          btnEditarGrupo.classList.remove('sm:inline-flex');
        }

        // Mostrar proyectos y tareas
        if (btnProyectos)   btnProyectos.classList.remove('hidden');
        if (btnNuevaTarea)  btnNuevaTarea.classList.remove('hidden');
      }

    } else {
      // --- VOLVER DESDE KANBAN A DASHBOARD ---
      // Si NO es la llamada de inicialización => recargar la página
      if (!isInit) {
        window.location.reload();
        return; // importante para que no siga ejecutando
      }

      // Solo en la inicialización (al cargar la vista) queremos ajustar clases sin recargar
      kanban.classList.add('hidden');
      dash.classList.remove('hidden');

      if (label) {
        label.style.backgroundColor = '';
        label.style.color = '';
        label.style.borderColor = '';
      }

      // 🔹 Lógica especial SOLO para SUPERVISOR
      if (currentRole === 'supervisor') {
        const btnNuevoUsuario  = document.getElementById('btnSupervisorNuevoUsuario');
        const btnNuevaTarea    = document.getElementById('btnSupervisorNuevaTarea');
        const btnProyectos     = document.getElementById('btnSupervisorProyectos');

        if (btnNuevoUsuario) btnNuevoUsuario.classList.remove('hidden');
        if (btnNuevaTarea)   btnNuevaTarea.classList.add('hidden');
        if (btnProyectos)    btnProyectos.classList.add('hidden'); // 👈 ocultar en Dashboard
      }

      // 🔹 Lógica especial SOLO para ADMIN (solo en inicialización)
      if (currentRole === 'admin') {
        const btnArea         = document.getElementById('btnAdminNuevaArea');
        const btnUsuario      = document.getElementById('btnAdminNuevoUsuario');
        const btnNuevoGrupo   = document.getElementById('btnAdminNuevoGrupo');
        const btnEditarGrupo  = document.getElementById('btnAdminEditarGrupo');
        const btnProyectos    = document.getElementById('btnAdminProyectos');
        const btnNuevaTarea   = document.getElementById('btnAdminNuevaTarea');

        // En dashboard: mostrar áreas/usuarios/teams (de nuevo con sm:inline-flex)
        if (btnArea) {
          btnArea.classList.remove('hidden');
          btnArea.classList.add('sm:inline-flex');
        }
        if (btnUsuario) {
          btnUsuario.classList.remove('hidden');
          btnUsuario.classList.add('sm:inline-flex');
        }
        if (btnNuevoGrupo) {
          btnNuevoGrupo.classList.remove('hidden');
          btnNuevoGrupo.classList.add('sm:inline-flex');
        }
        if (btnEditarGrupo) {
          btnEditarGrupo.classList.remove('hidden');
          btnEditarGrupo.classList.add('sm:inline-flex');
        }

        // Ocultar proyectos y tareas en dashboard
        if (btnProyectos)   btnProyectos.classList.add('hidden');
        if (btnNuevaTarea)  btnNuevaTarea.classList.add('hidden');
      }
    }
  }

  window.toggleKanbanView = toggleKanbanView;

  const kanbanToggle = document.getElementById('kanbanToggle');
  if (kanbanToggle) {
    // 👇 Inicializa el estado visual SIN recargar
    toggleKanbanView(kanbanToggle, { init: true });
  }

  // ================
  // LOGIN
  // ================
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const resp = await postForm('/login', loginForm);
        // resp = { ok, message, redirect, mustChangePassword? } (JSON)

        if (resp.ok && resp.redirect) {
          if (resp.mustChangePassword) {
            // Fuerza flujo de cambio obligatorio
            alert(
              'Estás usando la contraseña genérica del sistema. ' +
              'Debes cambiarla antes de continuar.'
            );
            toggleModal('loginModal', false);
            loginForm.reset();
            window.location.href = '/cambiar-password';
            return;
          }

          // Caso normal: no requiere cambio
          toggleModal('loginModal', false);
          loginForm.reset();
          window.location.href = resp.redirect;
        } else if (!resp.ok) {
          notify(resp);
        }
      } catch (err) {
        console.error(err);
        notify('Error al iniciar sesión');
      }
    });
  }

  // ================
  // LOGOUT
  // ================
  function doLogout() {
    // Navegación simple hacia la ruta /logout
    window.location.href = '/logout';
    return false; // evita que el <a> navegue por su cuenta
  }

  // Exponer logout globalmente (navbar usa onclick="return doLogout()")
  window.doLogout = doLogout;

  // ================
  // CONTACTO
  // ================
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData(contactForm);
        const nombre = (formData.get('nombre') || 'Gracias').toString().trim();

        const resp = await postForm('/contacto', contactForm);
        const msg =
          typeof resp === 'string'
            ? resp
            : (resp && resp.message) || 'Gracias por contactarnos.';

        notify(`${nombre}, ${msg}`);
        toggleModal('contactModal', false);
        contactForm.reset();
      } catch (err) {
        console.error(err);
        notify('Error al enviar el mensaje');
      }
    });
  }

  // ================
  // ÁREAS: alta de áreas desde el modal
  // ================
  const formNuevaArea = document.getElementById('formNuevaArea');

  if (formNuevaArea) {
    formNuevaArea.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        // Usamos la API JSON de áreas
        const resp = await postForm('/api/areas', formNuevaArea);
        // resp = { ok: true/false, message, data }

        notify(resp);

        if (resp.ok) {
          toggleModal('modalNuevaArea', false);
          formNuevaArea.reset();
          // recargar para ver la nueva área en la tabla
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
        notify({
          ok: false,
          message: 'Error inesperado al crear el área'
        });
      }
    });
  }

  // ================
  // USUARIOS: alta desde el modal
  // ================
  const formNuevoUsuario = document.getElementById('formNuevoUsuario');

  if (formNuevoUsuario) {
    formNuevoUsuario.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        const resp = await postForm('/api/users', formNuevoUsuario);
        // resp = { ok, message, data }

        notify(resp);

        if (resp.ok) {
          toggleModal('modalNuevoUsuario', false);
          formNuevoUsuario.reset();
          // recargar para ver el nuevo usuario donde lo muestres
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
        notify({
          ok: false,
          message: 'Error inesperado al crear el usuario'
        });
      }
    });
  }

  // ================
  // ROOT: alta de USUARIOS ADMIN desde el modal de root
  // ================
  const formRootNuevoAdmin = document.getElementById('formRootNuevoAdmin');

  if (formRootNuevoAdmin) {
    formRootNuevoAdmin.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        // Usa el mismo helper postForm
        const resp = await postForm('/api/root/admins', formRootNuevoAdmin);
        // resp = { ok, message, data }

        notify(resp);

        if (resp.ok) {
          toggleModal('modalRootAdminUsers', false);
          formRootNuevoAdmin.reset();
          // recargar para ver el nuevo admin en la tabla de root
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
        notify({
          ok: false,
          message: 'Error inesperado al crear el usuario Admin'
        });
      }
    });
  }

  // ================
  // COMPAÑIAS: alta desde el modal
  // ================
  const formNuevaCompany = document.getElementById('formNuevaCompany');

  if (formNuevaCompany) {
    formNuevaCompany.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        const resp = await postForm('/api/companies', formNuevaCompany);
        // resp = { ok: true/false, message, data }

        notify(resp);

        if (resp.ok) {
          toggleModal('modalNuevaCompany', false);
          formNuevaCompany.reset();
          // Por ahora, lo simple:
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
        notify({ ok: false, message: 'Error inesperado al crear la empresa' });
      }
    });
  }

  // ===============================
  // Alta de teams (grupo de trabajo)
  // ===============================
  const formNuevoGrupo = document.getElementById('formNuevoGrupo');

  if (formNuevoGrupo) {
    formNuevoGrupo.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        // Enviamos a /api/teams usando el helper postForm
        const resp = await postForm('/api/teams', formNuevoGrupo);

        // resp = { ok, message, data }
        notify(resp);

        if (resp.ok) {
          toggleModal('modalNuevoGrupo', false);
          formNuevoGrupo.reset();
          // De momento lo más simple para ver el nuevo grupo disponible:
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
        notify({
          ok: false,
          message: 'Error inesperado al crear el grupo de trabajo'
        });
      }
    });
  }

  // ===============================
  // Alta de tareas (modalNuevaTarea)
  // ===============================
  const formNuevaTarea = document.getElementById('formNuevaTarea');

  if (formNuevaTarea) {
    formNuevaTarea.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        // Enviamos el form al backend
        const resp = await postForm('/api/tasks', formNuevaTarea);
        // resp = { ok: true/false, message, data? }
        notify(resp);

        if (resp.ok) {
          // Cerrar modal y refrescar Kanban / Dashboard (por ahora recargamos página)
          toggleModal('modalNuevaTarea', false);
          window.location.reload();
        }
      } catch (err) {
        console.error('Error al crear tarea:', err);
        notify({ ok: false, message: 'Error inesperado al crear la tarea' });
      }
    });
  }

  // ===============================
  // Alta de proyectos (modalNuevoProyecto)
  // ===============================
  const formNuevoProyecto = document.getElementById('formNuevoProyecto');

  if (formNuevoProyecto) {
    formNuevoProyecto.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        const resp = await postForm('/api/projects', formNuevoProyecto);
        notify(resp);

        if (resp.ok) {
          toggleModal('modalNuevoProyecto', false);
          window.location.reload();
        }
      } catch (err) {
        console.error('Error al crear proyecto:', err);
        notify({ ok: false, message: 'Error inesperado al crear el proyecto' });
      }
    });
  }

// ===============================
// Edición de proyectos (admin + user)
// ===============================
const formEditarProyecto = document.getElementById('formEditarProyecto');

if (formEditarProyecto) {
  formEditarProyecto.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Detectar ID según la vista:
    //  - admin:  editProyectoId / editProyectoSelect
    //  - user:   selectProyectoEditar
    let id = null;

    const inputIdAdmin = document.getElementById('editProyectoId');
    const selectAdmin  = document.getElementById('editProyectoSelect');
    const selectUser   = document.getElementById('selectProyectoEditar');

    if (inputIdAdmin && inputIdAdmin.value) {
      id = inputIdAdmin.value;
    } else if (selectAdmin && selectAdmin.value) {
      id = selectAdmin.value;
    } else if (selectUser && selectUser.value) {
      id = selectUser.value;
    }

    if (!id) {
      alert('Selecciona un proyecto para editar.');
      return;
    }

    const formData = new FormData(formEditarProyecto);

    // Construimos el body para el endpoint /api/projects/update
    const body = {
      project_id: id   // 👈 lo que espera el backend
    };

    formData.forEach((value, key) => {
      // evitamos duplicar project_id si viene en el form
      if (key === 'project_id') return;
      if (key === 'id') return;
      body[key] = value || null;
    });

    try {
      const resp = await fetch('/api/projects/update', {
        method: 'POST', // 👈 NO es PUT, es POST
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        console.error('Error al actualizar proyecto:', data);
        if (window.notify) {
          window.notify('error', data.message || 'Error al actualizar proyecto');
        } else {
          alert(data.message || 'Error al actualizar proyecto');
        }
        return;
      }

      if (window.notify) {
        window.notify('success', 'Proyecto actualizado correctamente');
      } else {
        alert('Proyecto actualizado correctamente');
      }

      // Cerrar modal y refrescar para ver cambios
      toggleModal('modalNuevoProyecto', false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      if (window.notify) {
        window.notify('error', 'Error inesperado al actualizar proyecto');
      } else {
        alert('Error inesperado al actualizar proyecto');
      }
    }
  });
}

  // Cargar datos de proyecto en el formulario de edición
  // Más adelante, cuando tengas /api/projects/:id, podemos agregar algo tipo:
  const selectProyectoEditar = document.getElementById('selectProyectoEditar');

  if (selectProyectoEditar && formEditarProyecto) {
    selectProyectoEditar.addEventListener('change', async (e) => {
      const projectId = e.target.value;
      if (!projectId) return;

      try {
        const res = await fetch(`/api/projects/${projectId}`, { credentials: 'same-origin' });
        const data = await res.json();

        if (!data.ok) {
          notify({ ok: false, message: data.message || 'No se pudo cargar el proyecto' });
          return;
        }

        const p = data.data; // ajustamos esto cuando definamos el JSON

        document.getElementById('editarProyectoName').value = p.name || '';
        document.getElementById('editarProyectoStatus').value = p.status || 'active';
        document.getElementById('editarProyectoStartDate').value = p.start_date || '';
        document.getElementById('editarProyectoEndDate').value = p.end_date || '';
        document.getElementById('editarProyectoDescription').value = p.description || '';
      } catch (err) {
        console.error('Error al cargar proyecto:', err);
        notify({ ok: false, message: 'Error inesperado al cargar el proyecto' });
      }
    });
  }

// ===============================
// Filtro de tareas en el Kanban (user / supervisor) POR PROYECTO
// ===============================
const filtroTarea = document.getElementById('filtroTarea');

if (filtroTarea) {
  filtroTarea.addEventListener('change', (e) => {
    const selected = e.target.value;

    // Detectar qué Kanban está presente en la vista actual
    let rootSelector = '#userKanbanView';
    if (document.getElementById('supervisorKanbanView')) {
      rootSelector = '#supervisorKanbanView';
    }

    const cards = document.querySelectorAll(`${rootSelector} [data-task-id]`);

    cards.forEach((card) => {
      const cardProjectId = card.getAttribute('data-project-id') || '';

      // 1) Sin filtro: mostrar todo
      if (!selected) {
        card.classList.remove('hidden');
        return;
      }

      // 2) Solo tareas sin proyecto
      if (selected === '__no_project__') {
        if (!cardProjectId) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
        return;
      }

      // 3) Filtro por proyecto específico
      if (cardProjectId === selected) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
}
/*
    // ===============================
  // Kanban drag & drop (vista usuario)
  // ===============================
  const kanbanView = document.getElementById('userKanbanView');
  const STATUS_LABELS_ES = {
    pending: 'pendiente',
    in_progress: 'en progreso',
    review: 'en revisión',
    done: 'completada'
  };

  let draggedCard = null;
  let originColumn = null;

  async function updateTaskStatus(taskId, newStatus) {
    try {
      const resp = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await resp.json();
      if (!data.ok) {
        throw new Error(data.message || 'No se pudo actualizar el estado');
      }

      if (typeof notify === 'function') {
        notify({ ok: true, message: 'Estado de tarea actualizado' });
      } else {
        console.log('Estado de tarea actualizado');
      }
    } catch (err) {
      console.error('Error actualizando estado de tarea:', err);
      if (typeof notify === 'function') {
        notify({ ok: false, message: 'Error al actualizar el estado de la tarea' });
      } else {
        alert('Error al actualizar el estado de la tarea');
      }
      // Revertir visualmente
      if (originColumn && draggedCard) {
        originColumn.querySelector('.kanban-column-body').appendChild(draggedCard);
      }
    }
  }

  if (kanbanView) {
    // Delegación de eventos para dragstart / dragend
    kanbanView.addEventListener('dragstart', (e) => {
      const card = e.target.closest('[data-task-id]');
      if (!card) return;

      draggedCard = card;
      originColumn = card.closest('[data-column-status]');
      card.classList.add('opacity-50');
      e.dataTransfer.effectAllowed = 'move';
    });

    kanbanView.addEventListener('dragend', (e) => {
      if (draggedCard) {
        draggedCard.classList.remove('opacity-50');
      }
      draggedCard = null;
      originColumn = null;
    });

    // Permitir soltar en columnas
    const columns = kanbanView.querySelectorAll('[data-column-status]');
    columns.forEach((col) => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault(); // necesario para permitir drop
        e.dataTransfer.dropEffect = 'move';
      });

      col.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedCard) return;

        const newStatus = col.getAttribute('data-column-status');
        const taskId = draggedCard.getAttribute('data-task-id');

        // Mover visualmente la tarjeta
        const body = col.querySelector('.kanban-column-body') || col;
        body.appendChild(draggedCard);
        draggedCard.setAttribute('data-task-status', newStatus);

        // Actualizar etiqueta de estado en español
        const label = draggedCard.querySelector('[data-role="task-status-label"]');
        if (label && STATUS_LABELS_ES[newStatus]) {
          label.textContent = 'Estado: ' + STATUS_LABELS_ES[newStatus];
        }

        // Llamar al backend para actualizar en BD
        updateTaskStatus(taskId, newStatus);
      });
    });

        // ===============================
    // Doble click en tarjeta = abrir modal de commits
    // ===============================
    kanbanView.addEventListener('dblclick', (e) => {
      const card = e.target.closest('[data-task-id]');
      if (!card) return;

      const taskId = card.getAttribute('data-task-id');
      const currentStatus = card.getAttribute('data-task-status') || 'pending';
      const titleEl = card.querySelector('h4');
      const title = titleEl ? titleEl.textContent.trim() : `Tarea #${taskId}`;

      // Función que definimos más abajo
      if (typeof window.openTaskCommitModal === 'function') {
        window.openTaskCommitModal({
          id: taskId,
          title,
          status: currentStatus
        });
      }
    });
  }
*/

  // ===============================
  // Kanban drag & drop (user / supervisor)
  // ===============================
  const STATUS_LABELS_ES = {
    pending: 'pendiente',
    in_progress: 'en progreso',
    review: 'en revisión',
    done: 'completada'
  };

  let draggedCard = null;
  let originColumn = null;

  async function updateTaskStatus(taskId, newStatus) {
    try {
      const resp = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await resp.json();
      if (!data.ok) {
        throw new Error(data.message || 'No se pudo actualizar el estado');
      }

      if (typeof notify === 'function') {
        notify({ ok: true, message: 'Estado de tarea actualizado' });
      } else {
        console.log('Estado de tarea actualizado');
      }
    } catch (err) {
      console.error('Error actualizando estado de tarea:', err);
      if (typeof notify === 'function') {
        notify({ ok: false, message: 'Error al actualizar el estado de la tarea' });
      } else {
        alert('Error al actualizar el estado de la tarea');
      }
      // Revertir visualmente
      if (originColumn && draggedCard) {
        const bodyOrigin =
          originColumn.querySelector('.kanban-column-body') || originColumn;
        bodyOrigin.appendChild(draggedCard);
      }
    }
  }

  function initKanbanDragAndDrop(kanbanRoot) {
    if (!kanbanRoot) return;

    // Delegación de eventos para dragstart / dragend
    kanbanRoot.addEventListener('dragstart', (e) => {
      const card = e.target.closest('[data-task-id]');
      if (!card) return;

      draggedCard = card;
      originColumn = card.closest('[data-column-status]');
      card.classList.add('opacity-50');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    kanbanRoot.addEventListener('dragend', () => {
      if (draggedCard) {
        draggedCard.classList.remove('opacity-50');
      }
      draggedCard = null;
      originColumn = null;
    });

    // Permitir soltar en columnas
    const columns = kanbanRoot.querySelectorAll('[data-column-status]');
    columns.forEach((col) => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault(); // necesario para permitir drop
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'move';
        }
      });

      col.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedCard) return;

        const newStatus = col.getAttribute('data-column-status');
        const taskId = draggedCard.getAttribute('data-task-id');

        // Mover visualmente la tarjeta
        const body = col.querySelector('.kanban-column-body') || col;
        body.appendChild(draggedCard);
        draggedCard.setAttribute('data-task-status', newStatus);

        // Actualizar etiqueta de estado en español
        const label = draggedCard.querySelector('[data-role="task-status-label"]');
        if (label && STATUS_LABELS_ES[newStatus]) {
          label.textContent = 'Estado: ' + STATUS_LABELS_ES[newStatus];
        }

        // Llamar al backend para actualizar en BD
        updateTaskStatus(taskId, newStatus);
      });
    });

    // ===============================
    // Doble click en tarjeta = abrir modal de commits
    // ===============================
    kanbanRoot.addEventListener('dblclick', (e) => {
      const card = e.target.closest('[data-task-id]');
      if (!card) return;

      const taskId = card.getAttribute('data-task-id');
      const currentStatus = card.getAttribute('data-task-status') || 'pending';
      const titleEl = card.querySelector('h4');
      const title = titleEl ? titleEl.textContent.trim() : `Tarea #${taskId}`;

      if (typeof window.openTaskCommitModal === 'function') {
        window.openTaskCommitModal({
          id: taskId,
          title,
          status: currentStatus
        });
      }
    });
  }

  const userKanbanView       = document.getElementById('userKanbanView');
  const supervisorKanbanView = document.getElementById('supervisorKanbanView');
  const adminKanbanView      = document.getElementById('adminKanbanView');

  // Inicializar Kanban en la vista que corresponda
  initKanbanDragAndDrop(userKanbanView);
  initKanbanDragAndDrop(supervisorKanbanView);
  initKanbanDragAndDrop(adminKanbanView);

  // ===============================
  // Modal de commits de tarea (vista usuario)
  // ===============================
  const modalTaskCommit       = document.getElementById('modalTaskCommit');
  const formNuevoCommit       = document.getElementById('formNuevoCommit');
  const commitTaskTitle       = document.getElementById('commitTaskTitle');
  const commitTaskIdLabel     = document.getElementById('commitTaskIdLabel');
  const commitTaskStatusBadge = document.getElementById('commitTaskStatusBadge');
  const commitTaskIdInput     = document.getElementById('commitTaskId');
  const commitFromStatus      = document.getElementById('commitFromStatus');
  const commitToStatus        = document.getElementById('commitToStatus');
  const commitMessage         = document.getElementById('commitMessage');
  const commitList            = document.getElementById('commitList');

  // OJO: STATUS_LABELS_ES ya existe en el bloque del Kanban, reutilizamos esa constante.

  function applyStatusBadgeStyle(badgeEl, status) {
    if (!badgeEl) return;

    badgeEl.className =
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs';

    switch (status) {
      case 'pending':
        badgeEl.classList.add('bg-[#F1F8E9]', 'text-[#33691E]');
        break;
      case 'in_progress':
        badgeEl.classList.add('bg-[#E3F2FD]', 'text-[#1565C0]');
        break;
      case 'review':
        badgeEl.classList.add('bg-[#F3E5F5]', 'text-[#6A1B9A]');
        break;
      case 'done':
        badgeEl.classList.add('bg-[#FFF3E0]', 'text-[#EF6C00]');
        break;
      default:
        badgeEl.classList.add('bg-gray-100', 'text-gray-700');
        break;
    }
  }

  function renderCommitList(commits) {
    if (!commitList) return;

    commitList.innerHTML = '';

    if (!commits || !commits.length) {
      commitList.innerHTML = `
        <p class="text-xs text-gray-400">
          Aún no hay commits registrados para esta tarea.
        </p>
      `;
      return;
    }

    commits.forEach((c) => {
      const item = document.createElement('article');
      item.className =
        'rounded-lg bg-white border border-gray-200 px-3 py-2 text-sm';

      const autor = c.author_name || 'Usuario';
      const fecha = c.created_at
        ? new Date(c.created_at).toLocaleString()
        : '';

      const fromSt = c.from_status;
      const toSt   = c.to_status;

      let statusLine = '';
      if (fromSt || toSt) {
        const fromLabel = STATUS_LABELS_ES[fromSt] || fromSt || '—';
        const toLabel   = STATUS_LABELS_ES[toSt]   || toSt   || '—';
        statusLine = `
          <p class="text-[11px] text-gray-500 mt-0.5">
            Estado: <strong>${fromLabel}</strong> → <strong>${toLabel}</strong>
          </p>
        `;
      }

      item.innerHTML = `
        <header class="flex justify-between items-center mb-1">
          <span class="text-xs font-medium text-gray-700">${autor}</span>
          <span class="text-[11px] text-gray-400">${fecha}</span>
        </header>
        <p class="text-sm text-gray-800 whitespace-pre-wrap">
          ${c.message || ''}
        </p>
        ${statusLine}
      `;

      commitList.appendChild(item);
    });
  }

  async function loadTaskCommits(taskId) {
    if (!taskId || !commitList) return;

    commitList.innerHTML = `
      <p class="text-xs text-gray-400">
        Cargando commits...
      </p>
    `;

    try {
      const res = await fetch(`/api/tasks/${taskId}/commits`, {
        credentials: 'same-origin'
      });
      const data = await res.json();

      if (!data.ok) {
        renderCommitList([]);
        if (typeof notify === 'function') {
          notify({
            ok: false,
            message: data.message || 'No se pudo cargar el historial de commits'
          });
        }
        return;
      }

      // Backend: { ok: true, data: commits[] }
      const commits = Array.isArray(data.data) ? data.data : [];

      renderCommitList(commits);
    } catch (err) {
      console.error('Error cargando commits de tarea:', err);
      renderCommitList([]);
      if (typeof notify === 'function') {
        notify({ ok: false, message: 'Error al cargar el historial de commits' });
      }
    }
  }

  function openTaskCommitModal(task) {
    if (!modalTaskCommit || !task) return;

    const { id, title, status } = task;

    if (commitTaskTitle) {
      commitTaskTitle.textContent = title || `Tarea #${id}`;
    }
    if (commitTaskIdLabel) {
      commitTaskIdLabel.textContent = `Tarea #${id}`;
    }
    if (commitTaskStatusBadge) {
      const label = STATUS_LABELS_ES[status] || status || '—';
      commitTaskStatusBadge.textContent = label;
      applyStatusBadgeStyle(commitTaskStatusBadge, status);
    }

    if (commitTaskIdInput) {
      commitTaskIdInput.value = id;
    }
    if (commitFromStatus) {
      commitFromStatus.value = status || '';
    }
    if (commitToStatus) {
      commitToStatus.value = '';
    }
    if (commitMessage) {
      commitMessage.value = '';
    }

    // Cargar historial
    loadTaskCommits(id);

    // Abrir modal
    toggleModal('modalTaskCommit', true);
  }

  // Exponer global
  window.openTaskCommitModal = openTaskCommitModal;

  // Envío del formulario de nuevo commit
  if (formNuevoCommit) {
    formNuevoCommit.addEventListener('submit', async (e) => {
      e.preventDefault();

      const taskId = commitTaskIdInput ? commitTaskIdInput.value : null;
      if (!taskId) {
        if (typeof notify === 'function') {
          notify({ ok: false, message: 'No se pudo identificar la tarea' });
        }
        return;
      }

      try {
        const resp = await postForm(
          `/api/tasks/${taskId}/commits`,
          formNuevoCommit
        );
        // resp = { ok, message, data }
        if (typeof notify === 'function') {
          notify(resp);
        }

        if (resp && resp.ok) {
          // limpiar textarea
          if (commitMessage) commitMessage.value = '';

          // ✅ Recargar toda la página para ver los cambios reflejados
          window.location.reload();
        }
      } catch (err) {
        console.error('Error al guardar commit:', err);
        if (typeof notify === 'function') {
          notify({ ok: false, message: 'Error inesperado al guardar el commit' });
        }
      }
    });
  }

  // Mueve la tarjeta desde el modal de commits
function moverTarjetaKanban(taskId, newStatus) {
  const card = document.querySelector(`[data-task-id="${taskId}"]`);

  if (!card) return;

  const column = document.querySelector(
    `[data-column-status="${newStatus}"] .kanban-column-body`
  );

  if (!column) return;

  // mover tarjeta
  column.appendChild(card);

  // actualizar dataset
  card.dataset.taskStatus = newStatus;

  // actualizar etiqueta de estado
  const label = card.querySelector('[data-role="task-status-label"]');
  if (label) {
    label.textContent = 'Estado: ' + (STATUS_LABELS_ES[newStatus] || newStatus);
  }
}

  // 🔹 Tabs del modal de proyectos (admin)
window.switchProyectoTab = function (tab) {
  const formNuevo  = document.getElementById('formNuevoProyecto');
  const formEditar = document.getElementById('formEditarProyecto');
  const btnNuevo   = document.getElementById('btnGuardarProyectoNuevo');
  const btnEditar  = document.getElementById('btnGuardarProyectoEditar');

  const tabRegistrar = document.getElementById('tabProyectoRegistrar');
  const tabEditar    = document.getElementById('tabProyectoEditar');

  if (!formNuevo || !formEditar || !btnNuevo || !btnEditar || !tabRegistrar || !tabEditar) {
    return;
  }

  if (tab === 'registrar') {
    // Formularios
    formNuevo.classList.remove('hidden');
    formEditar.classList.add('hidden');

    // Botones
    btnNuevo.classList.remove('hidden');
    btnEditar.classList.add('hidden');

    // Tabs: activar "Registrar"
    tabRegistrar.classList.add('border-[#7B1FA2]', 'text-[#7B1FA2]');
    tabRegistrar.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700');

    // Tabs: desactivar "Editar"
    tabEditar.classList.remove('border-[#7B1FA2]', 'text-[#7B1FA2]');
    tabEditar.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700');

  } else if (tab === 'editar') {
    // Formularios
    formNuevo.classList.add('hidden');
    formEditar.classList.remove('hidden');

    // Botones
    btnNuevo.classList.add('hidden');
    btnEditar.classList.remove('hidden');

    // Tabs: activar "Editar"
    tabEditar.classList.add('border-[#7B1FA2]', 'text-[#7B1FA2]');
    tabEditar.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700');

    // Tabs: desactivar "Registrar"
    tabRegistrar.classList.remove('border-[#7B1FA2]', 'text-[#7B1FA2]');
    tabRegistrar.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700');
  }
};

  // 🔹 Cargar datos del proyecto al cambiar el select en "Editar proyecto"
  const editProyectoSelect = document.getElementById('editProyectoSelect');
  if (editProyectoSelect && Array.isArray(window.projectsAdmin)) {
    editProyectoSelect.addEventListener('change', function () {
      const id = parseInt(this.value, 10);
      const proyecto = window.projectsAdmin.find(function (p) {
        return p.id === id;
      });

      if (!proyecto) {
        // Si no se encontró, limpia el form
        document.getElementById('editProyectoId').value = '';
        document.getElementById('editProyectoName').value = '';
        document.getElementById('editProyectoDescription').value = '';
        document.getElementById('editProyectoStatus').value = 'pending';
        document.getElementById('editProyectoArea').value = '';
        document.getElementById('editProyectoStart').value = '';
        document.getElementById('editProyectoEnd').value = '';
        return;
      }

      // Llenar inputs
      document.getElementById('editProyectoId').value = proyecto.id;
      document.getElementById('editProyectoName').value = proyecto.name || '';
      document.getElementById('editProyectoDescription').value = proyecto.description || '';
      document.getElementById('editProyectoStatus').value = proyecto.status || 'pending';
      document.getElementById('editProyectoArea').value = proyecto.area_id || '';

      // Fechas: si vienen con hora tipo '2025-11-28T00:00:00.000Z', cortamos a YYYY-MM-DD
      const start = proyecto.start_date ? String(proyecto.start_date).substring(0, 10) : '';
      const end   = proyecto.end_date ? String(proyecto.end_date).substring(0, 10) : '';

      document.getElementById('editProyectoStart').value = start;
      document.getElementById('editProyectoEnd').value = end;
    });
  }

  // ==================================================
// SINCRONIZAR ADMIN: cargar proyecto al cambiar select
// (Admin usa editProyectoSelect, Supervisor usa selectProyectoEditar)
// ==================================================
(function () {

  const adminSelect = document.getElementById('editProyectoSelect');
  const adminProjects = Array.isArray(window.projectsAdmin) ? window.projectsAdmin : [];

  if (adminSelect) {
    adminSelect.addEventListener('change', function () {
      const id = Number(this.value);
      const p = adminProjects.find(x => x.id === id);
      if (!p) return;

      document.getElementById('editProyectoId').value = p.id;
      document.getElementById('editProyectoName').value = p.name || '';
      document.getElementById('editProyectoDescription').value = p.description || '';
      document.getElementById('editProyectoStatus').value = p.status || 'active';
      document.getElementById('editProyectoArea').value = p.area_id || '';

      const start = p.start_date ? String(p.start_date).substring(0, 10) : '';
      const end   = p.end_date   ? String(p.end_date).substring(0, 10) : '';

      document.getElementById('editProyectoStart').value = start;
      document.getElementById('editProyectoEnd').value = end;
    });
  }

})();

});

