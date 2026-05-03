/* ============================================================
   MI ESCUELA PRIMERO — admin-dashboard.js (versión API)
   ============================================================ */

(function () {
  'use strict';

  const API_URL = CONFIG.API_URL;
  const SERVER_URL = CONFIG.SERVER_URL;


  function resolveImageUrl(img) {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    return SERVER_URL + img;
  }

  /* ── AUTH GUARD (nuevo token JWT) ── */
  const token = sessionStorage.getItem('mep_admin_token');
  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  // Mostrar nombre del usuario desde el token o sesión
  let adminUser = sessionStorage.getItem('mep_admin_user');
  try {
    const userObj = JSON.parse(adminUser);
    adminUser = userObj.nombre || userObj.email || 'Administrador';
  } catch (e) {
    adminUser = adminUser || 'Administrador';
  }
  document.getElementById('topbarUserName').textContent = adminUser.split('@')[0];

  /* ── FUNCIONES DE AUTENTICACIÓN PARA FETCH ── */
  function getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async function fetchWithAuth(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { ...getAuthHeaders(), ...options.headers }
    });
    if (res.status === 401) {
      sessionStorage.removeItem('mep_admin_token');
      sessionStorage.removeItem('mep_admin_user');
      window.location.href = 'admin-login.html';
      throw new Error('Sesión expirada');
    }
    return res;
  }

  /* ── DATOS GLOBALES (se cargarán desde la API) ── */
  let schools = [];
  let solicitudes = [];
  let needs = [];
  let editingId = null;
  let deleteTarget = null;
  let searchQuery = '';

  // Datos estáticos (actividad reciente, no viene de la API)
  const RECENT_ACTIVITY = [
    { type: 'Nueva solicitud', message: 'Solicitud de alianza de Empresa XYZ', time: 'Hace 2 horas' },
    { type: 'Escuela actualizada', message: 'Escuela La Esperanza actualizó su progreso', time: 'Hace 5 horas' },
    { type: 'Nueva necesidad', message: 'Escuela Comunidad Unida agregó nueva necesidad', time: 'Hace 1 día' },
    { type: 'Aliado confirmado', message: 'Fundación ABC confirmó apoyo', time: 'Hace 2 días' },
  ];

  /* ── CARGA DE DATOS DESDE LA API ── */
  async function loadSchools() {
    try {
      const res = await fetch(`${API_URL}/schools`);
      if (!res.ok) throw new Error('Error al cargar escuelas');
      schools = await res.json();
    } catch (error) {
      console.error(error);
      showToast('Error al cargar escuelas');
      schools = [];
    }
  }

  async function loadSolicitudes() {
    try {
      const res = await fetchWithAuth(`${API_URL}/support-requests`);
      solicitudes = await res.json();
    } catch (error) {
      console.error(error);
      solicitudes = [];
    }
  }

  async function loadDashboardStats() {
    try {
      const res = await fetch(`${API_URL}/dashboard/stats`);
      if (!res.ok) throw new Error('Error al cargar estadísticas');
      return await res.json();
    } catch (error) {
      console.error(error);
      return { totalEscuelas: 0, necesidadesPendientes: 0, solicitudesRecibidas: 0, progresoPromedio: 0 };
    }
  }

  async function loadAllData() {
    await loadSchools();
    await loadSolicitudes();
    // Forzar re-renderizado de todas las secciones
    renderDashboard();
    renderEscuelas();
    renderPropuestas();
    renderSolicitudes();
  }

  /* ── SECTION NAVIGATION (sin cambios) ── */
  const titleMap = { dashboard: 'Dashboard', escuelas: 'Gestión de Escuelas', 'school-form': 'Gestión de Escuelas', propuestas: 'Propuestas', solicitudes: 'Solicitudes' };
  const allSections = ['dashboard', 'escuelas', 'school-form', 'propuestas', 'solicitudes'];

  function showSection(name) {
    allSections.forEach(s => {
      document.getElementById('section-' + s).classList.toggle('hidden', s !== name);
    });
    document.getElementById('pageTitle').textContent = titleMap[name] || name;
    const activeKey = name === 'school-form' ? 'escuelas' : name;
    document.querySelectorAll('.admin-nav-link[data-section]').forEach(link => {
      link.classList.toggle('admin-nav-link--active', link.dataset.section === activeKey);
    });
    if (name === 'dashboard') renderDashboard();
    if (name === 'escuelas') renderEscuelas();
    if (name === 'propuestas') renderPropuestas();
    if (name === 'solicitudes') renderSolicitudes();
  }

  document.querySelectorAll('.admin-nav-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      showSection(link.dataset.section);
      closeSidebar();
    });
  });

  /* ── SIDEBAR MOBILE (sin cambios) ── */
  const sidebar = document.getElementById('adminSidebar');
  document.getElementById('sidebarToggle').addEventListener('click', () => sidebar.classList.toggle('is-open'));
  function closeSidebar() { sidebar.classList.remove('is-open'); }
  document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('is-open') && !sidebar.contains(e.target) && e.target !== document.getElementById('sidebarToggle')) closeSidebar();
  });

  /* ── LOGOUT (limpia token) ── */
  document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('mep_admin_token');
    sessionStorage.removeItem('mep_admin_user');
    window.location.href = 'admin-login.html';
  });

  /* ── DASHBOARD (usa datos actuales) ── */
  async function renderDashboard() {
    const stats = await loadDashboardStats();
    const activeSchools = schools.filter(s => s.fundingProgress < 100).length;
    const pendingNeeds = schools.reduce((a, s) => a + (s.needs?.length || 0), 0);

    document.getElementById('dashboardMetrics').innerHTML =
      metricCard('Escuelas Activas', activeSchools, schoolIcon(), '+12% vs mes anterior') +
      metricCard('Necesidades Pendientes', pendingNeeds, listIcon(), '-8% vs mes anterior') +
      metricCard('Solicitudes Recibidas', stats.solicitudesRecibidas, docIcon(), '+24% vs mes anterior') +
      metricCard('Aliades Activos', 23, usersIcon(), '+5% vs mes anterior');

    document.getElementById('recentActivity').innerHTML = RECENT_ACTIVITY.map(a => `
      <div class="activity-item"><div class="activity-dot"></div><div><div class="activity-type">${a.type}</div><div class="activity-message">${a.message}</div><div class="activity-time">${a.time}</div></div></div>
    `).join('');

    document.getElementById('schoolProgress').innerHTML = schools.slice(0, 4).map(s => `
      <div class="progress-row"><div class="progress-row__header"><span class="progress-row__name">${s.name}</span><span class="progress-row__pct">${s.fundingProgress}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${s.fundingProgress}%"></div></div></div>
    `).join('');
  }



  function metricCard(label, value, iconSvg, trend) {
    return `<div class="metric-card"><div class="metric-card__left"><div class="metric-card__label">${label}</div><div class="metric-card__value">${value}</div><div class="metric-card__trend">${trendArrow()}${trend}</div></div><div class="metric-card__icon">${iconSvg}</div></div>`;
  }
  function trendArrow() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>'; }
  function schoolIcon() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'; }
  function listIcon() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'; }
  function docIcon() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'; }
  function usersIcon() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'; }

  /* ── ESCUELAS TABLE (renderizado, sin cambios de estructura) ── */
  function renderEscuelas() {
    const q = searchQuery.toLowerCase();
    const filtered = schools.filter(s => s.name.toLowerCase().includes(q) || (s.county && s.county.toLowerCase().includes(q)));

    const tbody = document.getElementById('schoolsTableBody');
    const empty = document.getElementById('schoolsEmpty');
    empty.classList.toggle('hidden', filtered.length > 0);

    tbody.innerHTML = filtered.map(school => `
      <tr>
        <td><div style="font-weight:600">${school.name}</div><div style="font-size:0.8125rem;color:var(--color-fg-muted);margin-top:2px">${school.needs?.length || 0} necesidades</div></td>
        <td>${school.county || ''}</td>
        <td style="font-size:0.8125rem">${(school.donationTypes || []).join(', ')}</td>
        <td>${statusBadge(school.fundingProgress)}</td>
        <td><div class="tbl-progress"><div class="tbl-progress-track"><div class="tbl-progress-fill" style="width:${school.fundingProgress}%"></div></div><span style="font-size:0.8125rem;font-weight:600;min-width:36px">${school.fundingProgress}%</span></div></td>
        <td><div class="tbl-actions">
          <button class="tbl-btn" data-action="edit" data-id="${school.id}" title="Editar">${editIcon()}</button>
          <button class="tbl-btn tbl-btn--danger" data-action="delete" data-id="${school.id}" title="Eliminar">${trashIcon()}</button>
        </div></td>
      </tr>
    `).join('');

    const avg = schools.length ? Math.round(schools.reduce((a, s) => a + (s.fundingProgress || 0), 0) / schools.length) : 0;
    document.getElementById('schoolStats').innerHTML = `
      <div class="stat-card"><div class="stat-card__number">${schools.length}</div><div class="stat-card__label">Total de Escuelas</div></div>
      <div class="stat-card"><div class="stat-card__number">${schools.reduce((a, s) => a + (s.needs?.length || 0), 0)}</div><div class="stat-card__label">Necesidades Registradas</div></div>
      <div class="stat-card"><div class="stat-card__number">${avg}%</div><div class="stat-card__label">Progreso Promedio</div></div>
    `;
  }

  function statusBadge(p) {
    if (p >= 80) return '<span class="tbl-badge tbl-badge--green">Casi completa</span>';
    if (p >= 50) return '<span class="tbl-badge tbl-badge--orange">En progreso</span>';
    return '<span class="tbl-badge tbl-badge--gray">Iniciando</span>';
  }
  function editIcon() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'; }
  function trashIcon() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>'; }

  /* Search */
  document.getElementById('schoolSearch').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderEscuelas();
  });

  /* Table click delegation (editar/eliminar) */
  document.getElementById('schoolsTableBody').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'edit') openEditForm(btn.dataset.id);
    if (btn.dataset.action === 'delete') openDeleteModal(btn.dataset.id);
  });

  /* ── ADD / EDIT SCHOOL FORM ── */
  document.getElementById('showAddSchoolBtn').addEventListener('click', openAddForm);
  document.getElementById('cancelSchoolFormBtn').addEventListener('click', () => showSection('escuelas'));
  document.getElementById('cancelSchoolFormBtn2').addEventListener('click', () => showSection('escuelas'));
  document.getElementById('saveSchoolBtnTop').addEventListener('click', () => document.getElementById('schoolForm').requestSubmit());

  // Donation type checkbox styling
  document.getElementById('sf-donationTypes').addEventListener('change', () => {
    document.querySelectorAll('.donation-type-option').forEach(label => {
      label.classList.toggle('is-checked', label.querySelector('input').checked);
    });
  });

  // Image preview
  document.getElementById('sf-image').addEventListener('input', function () {
    const url = this.value.trim();
    const wrap = document.getElementById('imagePreviewWrap');
    const img = document.getElementById('imagePreview');
    if (url) { img.src = url; wrap.style.display = 'block'; }
    else { wrap.style.display = 'none'; }
  });

  function openAddForm() {
    editingId = null;
    document.getElementById('schoolFormTitle').textContent = 'Agregar Nueva Escuela';
    resetSchoolForm();
    showSection('school-form');
    window.scrollTo(0, 0);
  }

  function openEditForm(id) {
    const school = schools.find(s => s.id === id);
    if (!school) return;
    editingId = id;
    document.getElementById('schoolFormTitle').textContent = 'Editar Escuela';
    document.getElementById('sf-name').value = school.name || '';
    document.getElementById('sf-county').value = school.county || '';
    document.getElementById('sf-nivel').value = school.nivel || '';
    document.getElementById('sf-students').value = school.students || '';
    document.getElementById('sf-teachers').value = school.teachers || '';
    document.getElementById('sf-phone').value = school.phone || '';
    document.getElementById('sf-email').value = school.email || '';
    document.getElementById('sf-address').value = school.address || '';
    document.getElementById('sf-description').value = school.description || '';
    document.getElementById('sf-image').value = school.image || '';
    document.getElementById('sf-funding').value = school.fundingProgress || 0;
    document.getElementById('sf-materials').value = school.materialsProgress || 0;
    document.getElementById('sf-volunteer').value = school.volunteerHoursProgress || 0;

    const imgUrl = resolveImageUrl(school.image);
    document.getElementById('imagePreviewWrap').style.display = imgUrl ? 'block' : 'none';
    document.getElementById('imagePreview').src = imgUrl;

    document.querySelectorAll('#sf-donationTypes input[type=checkbox]').forEach(cb => {
      cb.checked = (school.donationTypes || []).includes(cb.value);
      cb.closest('.donation-type-option')?.classList.toggle('is-checked', cb.checked);
    });
    showSection('school-form');
    window.scrollTo(0, 0);
  }

  function resetSchoolForm() {
    document.getElementById('schoolForm').reset();
    document.getElementById('sf-funding').value = 0;
    document.getElementById('sf-materials').value = 0;
    document.getElementById('sf-volunteer').value = 0;
    document.getElementById('imagePreviewWrap').style.display = 'none';
    document.querySelectorAll('.donation-type-option').forEach(l => l.classList.remove('is-checked'));
  }

  // Image file preview
  document.getElementById('sf-image-file').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      document.getElementById('imagePreview').src = url;
      document.getElementById('imagePreviewWrap').style.display = 'block';
    }
  });

  /* Form submit (guarda en API) */
  document.getElementById('schoolForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const donationTypes = Array.from(document.querySelectorAll('#sf-donationTypes input:checked')).map(cb => cb.value);
    if (!donationTypes.length) { showToast('Selecciona al menos un tipo de apoyo.'); return; }

    const data = {
      name: document.getElementById('sf-name').value.trim(),
      county: document.getElementById('sf-county').value,
      nivel: document.getElementById('sf-nivel').value,
      students: Number(document.getElementById('sf-students').value) || 0,
      teachers: Number(document.getElementById('sf-teachers').value) || 0,
      phone: document.getElementById('sf-phone').value.trim(),
      email: document.getElementById('sf-email').value.trim(),
      address: document.getElementById('sf-address').value.trim(),
      description: document.getElementById('sf-description').value.trim(),
      image: document.getElementById('sf-image').value.trim() || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
      donationTypes,
      fundingProgress: Math.min(100, Math.max(0, Number(document.getElementById('sf-funding').value))),
      materialsProgress: Math.min(100, Math.max(0, Number(document.getElementById('sf-materials').value))),
      volunteerHoursProgress: Math.min(100, Math.max(0, Number(document.getElementById('sf-volunteer').value))),
    };

    try {
      const url = editingId ? `${API_URL}/schools/${editingId}` : `${API_URL}/schools`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetchWithAuth(url, { method, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());

      const resData = await res.json();
      const schoolIdResult = editingId || resData.id;

      // Handle image file upload if selected
      const imageFileInput = document.getElementById('sf-image-file');
      if (imageFileInput.files.length > 0) {
        const file = imageFileInput.files[0];
        const formData = new FormData();
        formData.append('image', file);

        const uploadRes = await fetch(`${API_URL}/schools/${schoolIdResult}/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}` // FormData handles Content-Type implicitly for multipart
          },
          body: formData
        });

        if (!uploadRes.ok) throw new Error('Escuela guardada pero falló al subir la imagen');
      }

      showToast(editingId ? 'Escuela actualizada correctamente.' : 'Escuela agregada correctamente.');
      await loadAllData();  // Recargar todo
      showSection('escuelas');
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  });

  /* ── DELETE MODAL (usa API) ── */
  function openDeleteModal(id) {
    const school = schools.find(s => s.id === id);
    if (!school) return;
    deleteTarget = id;
    document.getElementById('deleteModalBody').textContent = `¿Estás seguro de que quieres eliminar "${school.name}"? Esta acción no se puede deshacer.`;
    document.getElementById('deleteModal').classList.remove('hidden');
  }

  document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    document.getElementById('deleteModal').classList.add('hidden');
    deleteTarget = null;
  });

  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!deleteTarget) return;
    try {
      await fetchWithAuth(`${API_URL}/schools/${deleteTarget}`, { method: 'DELETE' });
      showToast('Escuela eliminada.');
      await loadAllData();
      renderEscuelas();
    } catch (err) {
      showToast('Error al eliminar: ' + err.message);
    }
    document.getElementById('deleteModal').classList.add('hidden');
    deleteTarget = null;
  });

  document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('deleteModal')) {
      document.getElementById('deleteModal').classList.add('hidden');
      deleteTarget = null;
    }
  });

  /* ── PROPUESTAS (CRUD & UI) ── */
  let currentPropuestas = [];
  let editingPropuestaId = null;

  async function renderPropuestas() {
    const schoolSelect = document.getElementById('propuestaSchoolSelect');

    // Populate select if empty
    if (schoolSelect.options.length <= 1) {
      schoolSelect.innerHTML = '<option value="">-- Selecciona una escuela --</option>' +
        schools.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }

    const schoolId = schoolSelect.value;
    const addBtn = document.getElementById('addPropuestaBtn');
    const tbody = document.getElementById('propuestasTableBody');
    const emptyMsg = document.getElementById('propuestasEmpty');

    if (!schoolId) {
      addBtn.disabled = true;
      tbody.innerHTML = '';
      emptyMsg.classList.remove('hidden');
      return;
    }

    addBtn.disabled = false;
    emptyMsg.classList.add('hidden');

    try {
      const res = await fetchWithAuth(`${API_URL}/schools/${schoolId}/propuestas`);
      currentPropuestas = await res.json();

      if (currentPropuestas.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.textContent = 'Esta escuela no tiene propuestas registradas.';
        emptyMsg.classList.remove('hidden');
        return;
      }

      tbody.innerHTML = currentPropuestas.map(p => `
        <tr>
          <td>${p.categoria || '-'}</td>
          <td><strong>${p.subcategoria}</strong></td>
          <td>${p.propuesta || '-'}</td>
          <td>${p.cantidad_requerida || 0}</td>
          <td>${p.unidad || '-'}</td>
          <td><span class="tbl-badge tbl-badge--${p.estado === 'Cubierto' ? 'green' : p.estado === 'Cubierto parcialmente' ? 'orange' : 'gray'}">${p.estado}</span></td>
          <td>
            <div class="tbl-actions">
              <button class="tbl-btn" data-edit-prop="${p.id_necesidad}" title="Editar">${editIcon()}</button>
              <button class="tbl-btn tbl-btn--danger" data-del-prop="${p.id_necesidad}" title="Eliminar">${trashIcon()}</button>
            </div>
          </td>
        </tr>
      `).join('');

      // Add event listeners for edit and delete buttons
      document.querySelectorAll('[data-edit-prop]').forEach(btn => {
        btn.addEventListener('click', () => openPropuestaModal(btn.dataset.editProp));
      });
      document.querySelectorAll('[data-del-prop]').forEach(btn => {
        btn.addEventListener('click', () => deletePropuesta(btn.dataset.delProp));
      });

    } catch (err) {
      showToast('Error al cargar propuestas');
      console.error(err);
    }
  }

  // Event listener for school selection change
  document.getElementById('propuestaSchoolSelect').addEventListener('change', renderPropuestas);

  // Modal logic
  const propModal = document.getElementById('propuestaModal');
  const propForm = document.getElementById('propuestaForm');

  document.getElementById('addPropuestaBtn').addEventListener('click', () => {
    openPropuestaModal(null);
  });

  document.getElementById('closePropuestaModalBtn').addEventListener('click', () => propModal.classList.add('hidden'));
  document.getElementById('cancelPropuestaBtn').addEventListener('click', () => propModal.classList.add('hidden'));

  function openPropuestaModal(id) {
    editingPropuestaId = id;
    propForm.reset();

    if (id) {
      document.getElementById('propuestaModalTitle').textContent = 'Editar Propuesta';
      const prop = currentPropuestas.find(p => p.id_necesidad == id);
      if (prop) {
        document.getElementById('prop-subcategoria').value = prop.subcategoria || '';
        document.getElementById('prop-categoria').value = prop.categoria || '';
        document.getElementById('prop-propuesta').value = prop.propuesta || '';
        document.getElementById('prop-cantidad').value = prop.cantidad_requerida || 0;
        document.getElementById('prop-unidad').value = prop.unidad || '';
        document.getElementById('prop-estado').value = prop.estado || 'Pendiente';
        document.getElementById('prop-detalles').value = prop.detalles || '';
      }
    } else {
      document.getElementById('propuestaModalTitle').textContent = 'Agregar Propuesta';
    }

    propModal.classList.remove('hidden');
  }

  propForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const schoolId = document.getElementById('propuestaSchoolSelect').value;
    if (!schoolId) return;

    const data = {
      subcategoria: document.getElementById('prop-subcategoria').value.trim(),
      categoria: document.getElementById('prop-categoria').value.trim(),
      propuesta: document.getElementById('prop-propuesta').value.trim(),
      cantidad_requerida: Number(document.getElementById('prop-cantidad').value) || 0,
      unidad: document.getElementById('prop-unidad').value.trim(),
      estado: document.getElementById('prop-estado').value,
      detalles: document.getElementById('prop-detalles').value.trim()
    };

    try {
      const url = editingPropuestaId
        ? `${API_URL}/schools/${schoolId}/propuestas/${editingPropuestaId}`
        : `${API_URL}/schools/${schoolId}/propuestas`;
      const method = editingPropuestaId ? 'PUT' : 'POST';

      const res = await fetchWithAuth(url, { method, body: JSON.stringify(data) });
      if (!res.ok) throw new Error(await res.text());

      showToast(editingPropuestaId ? 'Propuesta actualizada' : 'Propuesta agregada');
      propModal.classList.add('hidden');
      renderPropuestas(); // reload table
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  });

  async function deletePropuesta(id) {
    if (!confirm('¿Estás seguro de eliminar esta propuesta?')) return;
    const schoolId = document.getElementById('propuestaSchoolSelect').value;
    try {
      const res = await fetchWithAuth(`${API_URL}/schools/${schoolId}/propuestas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      showToast('Propuesta eliminada');
      renderPropuestas();
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  }

  /* ── SOLICITUDES (renderizado + eliminar) ── */
  function renderSolicitudes() {
    const container = document.getElementById('solicitudesContent');
    if (!solicitudes.length) {
      container.innerHTML = '<p style="color:var(--color-fg-muted)">No hay solicitudes recibidas.</p>';
      return;
    }
    container.innerHTML = solicitudes.map(s => `
      <div class="solicitud-card">
        <div>
          <div class="solicitud-card__name">${s.nombreContacto || s.nombre}</div>
          <div class="solicitud-card__inst">${s.institucion || s.nombreInstitucion} · ${s.municipio}</div>
          <div class="solicitud-card__detail"><strong>Tipo:</strong> ${s.tipoInstitucion || s.tipo} &nbsp;|&nbsp; <strong>Participación:</strong> ${s.formaParticipacion || s.forma}</div>
          <div class="solicitud-card__detail"><strong>Contacto:</strong> ${s.telefono} · ${s.correo}</div>
          ${(s.notasAdicionales || s.notas) ? `<div class="solicitud-card__detail"><strong>Notas:</strong> ${s.notasAdicionales || s.notas}</div>` : ''}
        </div>
        <div class="solicitud-card__actions">
          <button class="tbl-btn tbl-btn--danger" data-del-sol="${s.id}" title="Eliminar">${trashIcon()}</button>
        </div>
      </div>
    `).join('');
    container.querySelectorAll('[data-del-sol]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('¿Eliminar esta solicitud?')) {
          try {
            await fetchWithAuth(`${API_URL}/support-requests/${btn.dataset.delSol}`, { method: 'DELETE' });
            await loadSolicitudes();
            renderSolicitudes();
            showToast('Solicitud eliminada.');
          } catch (err) {
            showToast('Error al eliminar solicitud');
          }
        }
      });
    });
  }

  /* ── TOAST (sin cambios) ── */
  let toastTimer;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toastText').textContent = msg;
    toast.classList.remove('hidden', 'is-leaving');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.classList.add('hidden'), 250);
    }, 3000);
  }

  /* ── INIT ── */
  (async () => {
    await loadAllData();
    showSection('dashboard');
  })();

  // =====================================================
  // IMPORTAR NECESIDADES DESDE EXCEL
  // =====================================================
  const importExcelBtn = document.getElementById('importExcelBtn');
  const excelImportInput = document.getElementById('excelImportInput');

  if (importExcelBtn && excelImportInput) {
    importExcelBtn.addEventListener('click', () => {
      excelImportInput.click();
    });

    excelImportInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      const token = sessionStorage.getItem('mep_admin_token');
      if (!token) {
        showToast('No hay sesión activa. Inicia sesión nuevamente.');
        return;
      }

      try {
        showToast('Subiendo archivo...');
        const response = await fetch(`${API_URL}/import/school-needs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Error al importar');

        let msg = `Importación completada: ${data.imported} registros procesados.`;
        if (data.errors && data.errors.length) {
          msg += ` ${data.errors.length} errores (ver consola).`;
          console.error('Errores de importación:', data.errors);
        }
        showToast(msg);

        // Recargar datos (ajusta según las funciones que tengas)
        if (typeof loadAllData === 'function') {
          await loadAllData();
        } else {
          // Recargar escuelas y propuestas manualmente
          await loadSchools();
          renderEscuelas();
          if (document.getElementById('section-propuestas').classList.contains('hidden') === false) {
            renderPropuestas();
          }
        }
      } catch (error) {
        console.error(error);
        showToast('Error: ' + error.message);
      } finally {
        excelImportInput.value = ''; // limpiar input
      }
    });
  }

  const exportNeedsBtn = document.getElementById('exportNeedsBtn');
  if (exportNeedsBtn) {
    exportNeedsBtn.addEventListener('click', () => {
      const token = sessionStorage.getItem('mep_admin_token');
      if (!token) {
        showToast('No hay sesión activa. Inicia sesión nuevamente.');
        return;
      }
      // Redirigir al endpoint de exportación (el backend generará el archivo)
      window.location.href = `${API_URL}/export/needs`;
    });
  }

})();