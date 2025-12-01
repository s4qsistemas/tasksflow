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

      // 🔹 Proyectos (nuevo)
      if (id === 'modalNuevoProyecto' && typeof window.switchProjectTab === 'function') {
        window.switchProjectTab('registrar');
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
  function toggleKanbanView(checkbox) {
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

    } else {
      // --- MODO DASHBOARD ---
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
    }
  }

  window.toggleKanbanView = toggleKanbanView;

  const kanbanToggle = document.getElementById('kanbanToggle');
  if (kanbanToggle) {
    toggleKanbanView(kanbanToggle);
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
  // Edición de proyectos
  // ===============================
  const formEditarProyecto = document.getElementById('formEditarProyecto');

  if (formEditarProyecto) {
    formEditarProyecto.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        // Aquí suponemos que el backend espera PUT/PATCH a /api/projects/:id
        // pero como postForm probablemente haga POST, podemos usar una ruta tipo /api/projects/update
        // o enviar _method=PUT. Por ahora usamos una ruta genérica de ejemplo:
        const resp = await postForm('/api/projects/update', formEditarProyecto);
        notify(resp);

        if (resp.ok) {
          toggleModal('modalNuevoProyecto', false);
          window.location.reload();
        }
      } catch (err) {
        console.error('Error al actualizar proyecto:', err);
        notify({ ok: false, message: 'Error inesperado al actualizar el proyecto' });
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
  // Filtro de tareas en el Kanban (vista usuario)
  // ===============================
  const filtroTarea = document.getElementById('filtroTarea');

  if (filtroTarea) {
    filtroTarea.addEventListener('change', (e) => {
      const selectedId = e.target.value;
      const cards = document.querySelectorAll('#userKanbanView [data-task-id]');

      cards.forEach((card) => {
        const cardId = card.getAttribute('data-task-id');

        if (!selectedId || cardId === selectedId) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  }

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
  }
});