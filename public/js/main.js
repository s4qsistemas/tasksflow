// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const contactForm = document.getElementById('contactForm');

  // helper: POST con form-urlencoded (compatible con express.urlencoded)
  async function postForm(url, form) {
    const body = new URLSearchParams(new FormData(form));
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body
    });
    // Soporta texto o JSON
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  }

  // helper: muestra mensaje simple (puedes reemplazar por toast/alert)
  function notify(msg) {
    alert(typeof msg === 'string' ? msg : (msg?.message || 'OK'));
  }

  // helper: toggle modal (igual a tu función)
  function toggleModal(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', !show);
  }
  // expón por si ya la usas en HTML inline
  window.toggleModal = toggleModal;

  // LOGIN
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const resp = await postForm('/login', loginForm);
        //notify(resp);
        if (resp.ok && resp.redirect) {
          toggleModal('loginModal', false);
          loginForm.reset();
          window.location.href = resp.redirect; // << redirige según rol
        }
      } catch (err) {
        console.error(err);
        notify('Error al iniciar sesión');
      }
    });
  }

  // LOGOUT
  async function doLogout() {
    try {
      await fetch('/logout', { method: 'GET', credentials: 'same-origin' });
    } catch (_) {
      // si falla el fetch, igual seguimos
    } finally {
      window.location.href = '/';
    }
    return false; // evita la navegación por href si JS está activo
  }

  // CONTACTO
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData(contactForm);
        const nombre = (formData.get('nombre') || 'Gracias').toString().trim();

        const resp = await postForm('/contacto', contactForm);
        const msg = (typeof resp === 'string') ? resp : (resp?.message || 'Gracias por contactarnos.');

        notify(`${nombre}, ${msg}`);
        toggleModal('contactModal', false);
        contactForm.reset();
      } catch (err) {
        console.error(err);
        notify('Error al enviar el mensaje');
      }
    });
  }
});
