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

      // 🔹 Grupos de trabajo (admin): por ahora sin tabs, solo reset de formularios
      if (id === 'modalNuevoGrupo' || id === 'modalEditarGrupo') {
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
      { dashId: 'adminDashboardView',       kanbanId: 'adminKanbanView' },
      { dashId: 'supervisorDashboardView',  kanbanId: 'supervisorKanbanView' },
      { dashId: 'userDashboardView',        kanbanId: 'userKanbanView' }
    ];

    let dash = null;
    let kanban = null;

    for (const cfg of candidates) {
      const d = document.getElementById(cfg.dashId);
      const k = document.getElementById(cfg.kanbanId);
      if (d && k) {
        dash = d;
        kanban = k;
        break;
      }
    }

    if (!dash || !kanban) return;

    const label = document.getElementById('kanbanToggleLabel');
    const isOn = checkbox && checkbox.checked;

    if (isOn) {
      dash.classList.add('hidden');
      kanban.classList.remove('hidden');

      if (label) {
        label.style.backgroundColor = '#C6FF00';
        label.style.color = '#111827';
        label.style.borderColor = '#AEEA00';
      }
    } else {
      kanban.classList.add('hidden');
      dash.classList.remove('hidden');

      if (label) {
        label.style.backgroundColor = '';
        label.style.color = '';
        label.style.borderColor = '';
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
});