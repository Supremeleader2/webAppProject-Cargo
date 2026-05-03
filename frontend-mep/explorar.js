/* ============================================================
   MI ESCUELA PRIMERO — explorar.js (versión API)
   Filter logic, card rendering, view toggle con datos dinámicos
   ============================================================ */

(function () {
  'use strict';

  const API_URL = CONFIG.API_URL;
  const SERVER_URL = CONFIG.SERVER_URL;
  const DEFAULT_IMG = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80';

  function resolveImageUrl(img) {
    if (!img) return DEFAULT_IMG;
    if (img.startsWith('http')) return img;
    return SERVER_URL + img; // e.g. /uploads/images/1234.jpg
  }

  /* ── STATE ──────────────────────────────────────────────── */
  let schoolsData = [];           // Escuelas cargadas desde la API
  let isLoading = false;          // Para evitar múltiples peticiones simultáneas

  let state = {
    search: '',
    county: 'Todos los Municipios',
    donationType: 'Todos los Tipos',
    view: 'grid',
  };

  /* ── DOM REFS ───────────────────────────────────────────── */
  const searchInput = document.getElementById('searchInput');
  const countySelect = document.getElementById('countySelect');
  const donationTypeSelect = document.getElementById('donationTypeSelect');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const resultsCount = document.getElementById('resultsCount');
  const resultsLabel = document.getElementById('resultsLabel');
  const showingText = document.getElementById('showingText');
  const schoolsGrid = document.getElementById('schoolsGrid');
  const mapView = document.getElementById('mapView');
  const mapCountText = document.getElementById('mapCountText');
  const emptyState = document.getElementById('emptyState');
  const gridViewBtn = document.getElementById('gridViewBtn');
  const mapViewBtn = document.getElementById('mapViewBtn');

  /* ── CARGAR ESCUELAS DESDE LA API CON FILTROS ───────────── */
  async function loadSchools() {
    if (isLoading) return;
    isLoading = true;

    // Mostrar indicador de carga (opcional)
    schoolsGrid.innerHTML = '<div class="loading-spinner">Cargando escuelas...</div>';

    try {
      const params = new URLSearchParams();
      if (state.search.trim()) params.append('search', state.search.trim());
      if (state.county !== 'Todos los Municipios') params.append('county', state.county);
      if (state.donationType !== 'Todos los Tipos') params.append('donationType', state.donationType);

      const url = `${API_URL}/schools${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar escuelas');
      schoolsData = await response.json();
    } catch (error) {
      console.error(error);
      schoolsData = [];
      schoolsGrid.innerHTML = '<div class="empty-state">Error al cargar escuelas. Intenta más tarde.</div>';
    } finally {
      isLoading = false;
      render(); // Renderiza con los datos obtenidos (o vacío)
    }
  }

  /* ── FILTROS (ya no se aplican localmente, se envían a la API) ── */
  // La función getFiltered ya no es necesaria porque los filtros se aplican en el backend.
  // Toda la lógica de render usa directamente schoolsData.

  /* ── CONSTRUCTOR DE TARJETAS (igual que antes) ──────────── */
  function buildProgressRow(label, value) {
    return `
      <div class="progress-row">
        <div class="progress-row__meta">
          <span class="progress-row__label">${label}</span>
          <span class="progress-row__value">${value}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${value}%"></div>
        </div>
      </div>`;
  }

  function buildCard(school) {
    const visibleNeeds = (school.needs || []).slice(0, 3);
    const extraNeeds = (school.needs || []).length - 3;
    const tags = visibleNeeds.map(n => `<span class="tag">${escapeHtml(n)}</span>`).join('');
    const extra = extraNeeds > 0 ? `<span class="tag">+${extraNeeds} más</span>` : '';
    const donorUrl = `donante.html?school=${encodeURIComponent(school.name)}`;

    return `
      <article class="school-card fade-up" onclick="window.openSchoolModal('${school.id}')" style="cursor: pointer;">
        <div class="school-card__image-wrap">
          <img
            class="school-card__image"
            src="${resolveImageUrl(school.image)}"
            alt="${escapeHtml(school.name)}"
            loading="lazy"
            onerror="this.src='${DEFAULT_IMG}'"
          />
          <span class="school-card__county-badge">${escapeHtml(school.county || '')}</span>
        </div>
        <div class="school-card__body">
          <div>
            <h3 class="school-card__title">${escapeHtml(school.name)}</h3>
            <p class="school-card__location">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              ${escapeHtml(school.county || '')}
            </p>
          </div>
          <p class="school-card__desc">${escapeHtml(school.description || '')}</p>
          <div class="school-card__tags">${tags}${extra}</div>
          <div class="school-card__progress">
            ${buildProgressRow('Financiamiento', school.fundingProgress || 0)}
            ${buildProgressRow('Materiales', school.materialsProgress || 0)}
            ${buildProgressRow('Horas de Voluntariado', school.volunteerHoursProgress || 0)}
          </div>
          <div class="school-card__actions">
            <button class="btn btn--outline-primary school-card__cta school-card__cta--outline" onclick="event.stopPropagation(); window.openSchoolModal('${school.id}')">Ver Detalle</button>
            <a href="${donorUrl}" class="btn btn--primary school-card__cta" onclick="event.stopPropagation();">Apoyar</a>
          </div>
        </div>
      </article>`;
  }

  // Función simple para escapar HTML (evitar XSS)
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (c) {
      return c;
    });
  }

  /* ── RENDER ─────────────────────────────────────────────── */
  function render() {
    const count = schoolsData.length;

    // Actualizar contadores
    resultsCount.textContent = count;
    resultsLabel.textContent = count === 1 ? 'Escuela coincide con tus criterios' : 'Escuelas coinciden con tus criterios';
    showingText.textContent = `Mostrando ${count} ${count === 1 ? 'escuela' : 'escuelas'}`;
    mapCountText.innerHTML = `Mapa interactivo que muestra ${count} ${count === 1 ? 'escuela' : 'escuelas'} en tu área seleccionada.<br>Esto mostraría una integración de mapa real en producción.`;

    // Mostrar/ocultar paneles según vista
    const isGrid = state.view === 'grid';
    schoolsGrid.classList.toggle('hidden', !isGrid);
    mapView.classList.toggle('hidden', isGrid);
    emptyState.classList.toggle('hidden', count > 0);

    if (count === 0) {
      schoolsGrid.innerHTML = '';
      return;
    }

    if (isGrid) {
      schoolsGrid.innerHTML = schoolsData.map(buildCard).join('');

      // Re-aplicar animaciones de entrada
      requestAnimationFrame(() => {
        schoolsGrid.querySelectorAll('.fade-up').forEach((el, i) => {
          el.style.transitionDelay = `${i * 60}ms`;
          requestAnimationFrame(() => el.classList.add('is-visible'));
        });
      });
    }
  }

  /* ── EVENT LISTENERS (actualizan filtros y recargan) ────── */
  let searchDebounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.search = searchInput.value;
      loadSchools();  // Recargar con nuevos filtros
    }, 300);
  });

  countySelect.addEventListener('change', () => {
    state.county = countySelect.value;
    loadSchools();
  });

  donationTypeSelect.addEventListener('change', () => {
    state.donationType = donationTypeSelect.value;
    loadSchools();
  });

  clearFiltersBtn.addEventListener('click', () => {
    state.search = '';
    state.county = 'Todos los Municipios';
    state.donationType = 'Todos los Tipos';
    searchInput.value = '';
    countySelect.value = 'Todos los Municipios';
    donationTypeSelect.value = 'Todos los Tipos';
    loadSchools();
  });

  // Cambio de vista (cuadrícula / mapa)
  gridViewBtn.addEventListener('click', () => {
    state.view = 'grid';
    gridViewBtn.classList.add('view-toggle__btn--active');
    gridViewBtn.setAttribute('aria-pressed', 'true');
    mapViewBtn.classList.remove('view-toggle__btn--active');
    mapViewBtn.setAttribute('aria-pressed', 'false');
    render();
  });

  mapViewBtn.addEventListener('click', () => {
    state.view = 'map';
    mapViewBtn.classList.add('view-toggle__btn--active');
    mapViewBtn.setAttribute('aria-pressed', 'true');
    gridViewBtn.classList.remove('view-toggle__btn--active');
    gridViewBtn.setAttribute('aria-pressed', 'false');
    render();
  });

  /* ── INICIALIZACIÓN ─────────────────────────────────────── */
  loadSchools();

  /* ── SCHOOL MODAL LOGIC ─────────────────────────────────── */
  const schoolModal = document.getElementById('schoolModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalBody = document.getElementById('modalBody');

  window.openSchoolModal = async function (schoolId) {
    // Open modal with loading state
    schoolModal.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // prevent background scrolling
    modalBody.innerHTML = '<div class="modal-loading">Cargando detalles...</div>';

    try {
      const response = await fetch(`${API_URL}/schools/${schoolId}`);
      if (!response.ok) throw new Error('Error al cargar detalles de la escuela');
      const school = await response.json();

      const donorUrl = `donante.html?school=${encodeURIComponent(school.name)}`;

      // Build Propuestas HTML
      let needsHtml = '<p class="modal-desc">No hay propuestas registradas.</p>';
      if (school.needs && school.needs.length > 0) {
        const withPropuesta = school.needs.filter(n => n.propuesta);
        if (withPropuesta.length > 0) {
          needsHtml = `
            <div class="modal-needs-grid">
              ${withPropuesta.map(need => {
            const cantidad = need.cantidad_requerida || 0;
            const unidad = need.unidad || '';
            const estado = (need.estado || 'Pendiente').toLowerCase();
            const estadoClass = estado === 'cubierto' ? 'baja' : estado === 'en proceso' ? 'media' : 'alta';
            return `
                  <div class="need-item">
                    <div class="need-header">
                      <span class="need-name">${escapeHtml(need.propuesta)}</span>
                      <span class="need-priority need-priority--${estadoClass}">${escapeHtml(need.estado || 'Pendiente')}</span>
                    </div>
                    <div class="need-progress-wrap">
                      <div class="need-progress-text" style="text-align: left; color: var(--color-fg-muted);">
                        ${need.nombre_necesidad ? '<strong>' + escapeHtml(need.nombre_necesidad) + '</strong>' : ''}
                        ${cantidad > 0 ? ' — ' + cantidad + (unidad ? ' ' + escapeHtml(unidad) : '') : ''}
                      </div>
                      ${need.detalles ? '<div class="need-progress-text" style="text-align: left; font-style: italic;">' + escapeHtml(need.detalles) + '</div>' : ''}
                    </div>
                  </div>
                `;
          }).join('')}
            </div>
          `;
        }
      }

      // Build Contact HTML
      let contactHtml = '';
      if (school.phone || school.email || school.address) {
        contactHtml = `
          <h4 class="modal-section-title" style="margin-top: 1.5rem;">Información de Contacto</h4>
          <div class="modal-contact">
            ${school.phone ? `<p><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> ${escapeHtml(school.phone)}</p>` : ''}
            ${school.email ? `<p><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> ${escapeHtml(school.email)}</p>` : ''}
            ${school.address ? `<p><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${escapeHtml(school.address)}</p>` : ''}
          </div>
        `;
      }

      modalBody.innerHTML = `
        <img class="modal-header-img" src="${resolveImageUrl(school.image)}" alt="${escapeHtml(school.name)}" onerror="this.src='${DEFAULT_IMG}'">
        <div class="modal-body-content">
          <div class="modal-title-wrap">
            <h2 class="modal-title">${escapeHtml(school.name)}</h2>
            <div class="modal-subtitle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              ${escapeHtml(school.county || '')}
            </div>
          </div>

          <div class="modal-stats">
            <div class="modal-stat-item">
              <span class="modal-stat-label">Estudiantes</span>
              <span class="modal-stat-value">${school.students || 0}</span>
            </div>
            <div class="modal-stat-item">
              <span class="modal-stat-label">Maestros</span>
              <span class="modal-stat-value">${school.teachers || 0}</span>
            </div>
            <div class="modal-stat-item">
              <span class="modal-stat-label">Nivel</span>
              <span class="modal-stat-value">${escapeHtml(school.nivel || 'N/A')}</span>
            </div>
            <div class="modal-stat-item">
              <span class="modal-stat-label">Condición</span>
              <span class="modal-stat-value">${escapeHtml(school.nivelCondicion || 'N/A')}</span>
            </div>
          </div>

          <div>
            <h4 class="modal-section-title">Sobre la escuela</h4>
            <p class="modal-desc">${escapeHtml(school.description || 'Sin descripción disponible.')}</p>
          </div>

          <div>
            <h4 class="modal-section-title">Propuestas</h4>
            ${needsHtml}
          </div>

          <div>
            <h4 class="modal-section-title">Progreso General</h4>
            <div style="display: flex; flex-direction: column; gap: var(--space-4);">
              ${buildProgressRow('Financiamiento', school.fundingProgress || 0)}
              ${buildProgressRow('Materiales', school.materialsProgress || 0)}
              ${buildProgressRow('Horas de Voluntariado', school.volunteerHoursProgress || 0)}
            </div>
          </div>

          ${contactHtml}

          <div class="modal-footer">
            <a href="${donorUrl}" class="btn btn--primary" style="width: 100%;">Apoyar esta escuela</a>
          </div>
        </div>
      `;
    } catch (error) {
      modalBody.innerHTML = '<div class="modal-loading" style="color: #ef4444;">Error al cargar los datos. Intenta nuevamente.</div>';
    }
  };

  function closeSchoolModal() {
    schoolModal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  closeModalBtn.addEventListener('click', closeSchoolModal);

  schoolModal.addEventListener('click', (e) => {
    if (e.target === schoolModal) {
      closeSchoolModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && schoolModal.classList.contains('is-open')) {
      closeSchoolModal();
    }
  });

})();