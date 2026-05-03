/* ============================================================
   MI ESCUELA PRIMERO — donante.js (versión API)
   Letter form: validation, inline field styling, submit to backend
   ============================================================ */

(function () {
  'use strict';

  const API_URL = CONFIG.API_URL;


  /* ── DOM REFS ───────────────────────────────────────────── */
  const form = document.getElementById('donorForm');
  const formState = document.getElementById('formState');
  const successState = document.getElementById('successState');
  const successName = document.getElementById('successName');
  const submitBtn = document.getElementById('submitBtn');
  const folioSpan = document.getElementById('folioNumero'); // Asegúrate de tener este elemento en el HTML

  const fields = {
    nombreContacto: document.getElementById('nombreContacto'),
    nombreInstitucion: document.getElementById('nombreInstitucion'),
    municipio: document.getElementById('municipio'),
    tipoInstitucion: document.getElementById('tipoInstitucion'),
    formaParticipacion: document.getElementById('formaParticipacion'),
    telefono: document.getElementById('telefono'),
    correo: document.getElementById('correo'),
    notasAdicionales: document.getElementById('notasAdicionales'),
  };

  const required = ['nombreContacto', 'nombreInstitucion', 'municipio',
    'tipoInstitucion', 'formaParticipacion', 'telefono', 'correo'];

  /* ── PRE-FILL FROM URL PARAMS (sin cambios) ─────────────── */
  function prefillFromParams() {
    const params = new URLSearchParams(window.location.search);
    const school = params.get('school');
    const category = params.get('category');
    const origen = params.get('origen'); // opcional, para analytics

    if (!school && !category) return;

    const banner = document.createElement('div');
    banner.className = 'context-banner';

    if (school) {
      banner.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        Apoyando a: <strong>${escapeHtml(school)}</strong>`;
      fields.notasAdicionales.value = `Me gustaría apoyar específicamente a la escuela: ${school}.`;
    } else if (category) {
      banner.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        Área de interés: <strong>${escapeHtml(category)}</strong>`;
      fields.notasAdicionales.value = `Me interesa apoyar en el área de: ${category}.`;
    }

    const letterBody = document.querySelector('.letter-body');
    letterBody.parentNode.insertBefore(banner, letterBody);
    markFilled(fields.notasAdicionales);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }

  /* ── VALIDATION (igual) ─────────────────────────────────── */
  function isValid() {
    return required.every(key => {
      const el = fields[key];
      return el && el.value.trim() !== '';
    });
  }

  function updateSubmitBtn() {
    submitBtn.disabled = !isValid();
  }

  /* ── FILLED STATE STYLING (igual) ───────────────────────── */
  function markFilled(el) {
    if (el.value.trim()) {
      el.classList.add('is-filled');
    } else {
      el.classList.remove('is-filled');
    }
  }

  /* ── WIRE UP FIELDS (igual) ─────────────────────────────── */
  Object.values(fields).forEach(el => {
    if (!el) return;
    const events = el.tagName === 'SELECT' ? ['change'] : ['input', 'change'];
    events.forEach(ev => {
      el.addEventListener(ev, () => {
        markFilled(el);
        updateSubmitBtn();
      });
    });
  });

  /* ── SUBMIT (ahora con fetch a la API) ──────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isValid()) return;

    // Deshabilitar botón mientras se envía
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    const payload = {
      nombreContacto: fields.nombreContacto.value.trim(),
      nombreInstitucion: fields.nombreInstitucion.value.trim(),
      municipio: fields.municipio.value,
      tipoInstitucion: fields.tipoInstitucion.value,
      formaParticipacion: fields.formaParticipacion.value,
      telefono: fields.telefono.value.trim(),
      correo: fields.correo.value.trim(),
      notasAdicionales: fields.notasAdicionales.value.trim(),
      // Si en el futuro agregas escuelaInteres o categoriaInteres, se pueden incluir aquí
    };

    try {
      const response = await fetch(`${API_URL}/support-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar la solicitud');
      }

      // Mostrar éxito con folio
      const nombre = fields.nombreContacto.value.trim();
      successName.textContent = nombre;
      if (folioSpan) folioSpan.textContent = data.folio;
      formState.classList.add('hidden');
      successState.classList.remove('hidden');

      // Limpiar formulario (opcional, para una nueva donación si se recarga la página)
      form.reset();
      Object.values(fields).forEach(el => el && el.classList.remove('is-filled'));
      updateSubmitBtn();

    } catch (error) {
      let errorMsg = error.message;
      if (error.response && error.response.data && error.response.data.error) {
        errorMsg = error.response.data.error;
      }
      alert('Error: ' + errorMsg);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Quiero sumarme';
    }
  });

  /* ── INIT ───────────────────────────────────────────────── */
  prefillFromParams();
  updateSubmitBtn();
})();