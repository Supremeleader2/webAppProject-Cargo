# Documentación del Proyecto: Mi Escuela Primero (MEP)

> Plataforma web para conectar donantes y aliados con escuelas públicas en contextos vulnerables de Jalisco.

---

## 1. Front-End [Ángel]

### 1.1 Descripción General de la Funcionalidad

La propuesta original era construir una plataforma pública donde cualquier persona pudiera explorar escuelas necesitadas, conocer sus necesidades y registrarse como donante o aliado, además de un panel de administración para gestionar toda la información.

**Lo que se logró:**

| Módulo | Descripción | Estado |
|---|---|---|
| Landing page (`index.html`) | Hero section, métricas de impacto, proceso de transformación en 5 pasos, testimonios y CTA final | ✅ Completado |
| Explorar Escuelas (`explorar.html`) | Catálogo de escuelas con filtros por municipio, tipo de donación y búsqueda por texto; vista de cuadrícula; modal de detalle con propuestas y progreso | ✅ Completado |
| Formas de Apoyar (`formas-apoyar.html`) | Navegación rápida y 12 categorías de apoyo expandibles (material educativo, deportivo, tecnológico, infraestructura, voluntariado, salud, etc.) | ✅ Completado |
| Ser Donante (`donante.html`) | Formulario estilo "carta" con validación en tiempo real, pre-llenado por URL params y envío al backend con folio de seguimiento | ✅ Completado |
| Admin Login (`admin-login.html`) | Autenticación JWT contra el backend, redirección automática si ya hay sesión activa | ✅ Completado |
| Admin Dashboard (`admin-dashboard.html`) | CRUD completo de escuelas, gestión de propuestas (vía Stored Procedures), visualización de solicitudes, importación/exportación Excel, estadísticas en tiempo real | ✅ Completado |
| Vista de mapa | Placeholder incluido, integración real pendiente | ⚠️ Parcial |

**Funcionalidades transversales implementadas:**
- Navegación responsive con menú hamburger y cierre automático
- Animaciones de entrada con `IntersectionObserver` (fade-up escalonado)
- Navbar con sombra dinámica al hacer scroll
- Botón flotante de donación con animación de latido periódico
- Protección contra XSS en todo el HTML generado dinámicamente
- Filtros de búsqueda en servidor (no en cliente) con debounce de 300ms
- Carga de imágenes desde URL o subida de archivo (Multer), con fallback a imagen por defecto
- Guard de autenticación: redirige a login si no hay token JWT en `sessionStorage`
- Exportación a Excel de necesidades desde el panel admin
- Importación masiva de necesidades desde Excel

---

### 1.2 Stack Utilizado

| Tecnología | Versión / Detalle |
|---|---|
| **HTML5** | Semántico (nav, main, section, article, header, footer, aside) |
| **CSS3 (Vanilla)** | Dos hojas globales (`styles.css`, `admin.css`) + hojas por página (`explorar.css`, `donante.css`, etc.) |
| **JavaScript (ES2020+)** | Vanilla JS, patrón IIFE, `async/await`, Fetch API, IntersectionObserver |
| **Google Fonts** | Fraunces (display/serif) + DM Sans (UI/sans-serif) |
| **Fetch API** | Comunicación con el backend REST |

No se usó ningún framework de UI (React, Vue, Angular) ni librería de CSS (Tailwind, Bootstrap).

---

### 1.3 Argumentación del Stack

**¿Por qué Vanilla HTML/CSS/JS?**

- **Simplicidad de despliegue**: al ser archivos estáticos, pueden servirse desde cualquier servidor o incluso Live Server durante desarrollo, sin necesidad de compilación ni bundler.
- **Control total de estilos**: el diseño personalizado (glassmorphism, paleta específica, animaciones a medida) sería más difícil de lograr con utilidades de Tailwind o los componentes de Bootstrap sin sobrescribir constantemente sus estilos.
- **Curva de aprendizaje del equipo**: el equipo tiene más dominio de JS vanilla que de frameworks modernos como React, lo que redujo el riesgo de bloqueos técnicos.
- **Tamaño del proyecto**: la escala del proyecto (6 páginas) no justificaba la complejidad de SPA con routing, gestión de estado global, etc.

**Tecnologías consideradas y descartadas:**

| Alternativa | Razón de descarte |
|---|---|
| React + Vite | Overkill para el tamaño del proyecto; habría requerido configurar bundler, JSX, y gestión de estado |
| Vue 3 | Similar a React; tiempo de aprendizaje y configuración innecesarios |
| Tailwind CSS | Dificulta diseños muy personalizados sin el plugin de diseño; se prefirió control total con CSS custom |
| Bootstrap | Componentes genéricos que habrían requerido sobreescritura para lograr el diseño propuesto |
| jQuery | Obsoleto para los casos de uso actuales; Fetch API y `querySelector` cubren las mismas necesidades |

---

## 2. Back-End [Ángel]

### 2.1 Descripción de la API

La API es RESTful, construida con **Node.js + Express**. Corre en `http://localhost:5000` y expone cuatro grupos de rutas bajo el prefijo `/api`. La autenticación de rutas protegidas se hace mediante **JWT** (Bearer token en el header `Authorization`). La validación de entrada se realiza con `express-validator`. La subida de archivos usa **Multer**.

---

### 2.2 Endpoints

#### Autenticación — `/api/auth`

| Método | URL | Descripción | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Autentica un admin, devuelve JWT y datos del usuario | ❌ Público |

#### Escuelas — `/api/schools`

| Método | URL | Descripción | Auth |
|---|---|---|---|
| GET | `/api/schools` | Lista todas las escuelas. Acepta query params: `?search=`, `?county=`, `?donationType=` | ❌ Público |
| GET | `/api/schools/:id` | Detalle completo de una escuela (necesidades, tipos de donación, progreso) | ❌ Público |
| POST | `/api/schools` | Crea una nueva escuela | ✅ JWT |
| PUT | `/api/schools/:id` | Actualiza campos de una escuela (campos opcionales, dinámico) | ✅ JWT |
| DELETE | `/api/schools/:id` | Elimina una escuela (cascade en tablas relacionadas) | ✅ JWT |
| POST | `/api/schools/:id/image` | Sube una imagen (multipart/form-data) para una escuela | ✅ JWT |

#### Propuestas de Necesidades — `/api/schools/:id/propuestas`

| Método | URL | Descripción | Auth |
|---|---|---|---|
| GET | `/api/schools/:id/propuestas` | Lista propuestas de una escuela (usa `vista_propuestas_escuela`) | ✅ JWT |
| POST | `/api/schools/:id/propuestas` | Agrega propuesta (llama `sp_upsert_propuesta`) | ✅ JWT |
| PUT | `/api/schools/:id/propuestas/:idNecesidad` | Actualiza propuesta (llama `sp_update_propuesta`) | ✅ JWT |
| DELETE | `/api/schools/:id/propuestas/:idNecesidad` | Elimina propuesta (llama `sp_delete_propuesta`) | ✅ JWT |

#### Solicitudes de Apoyo — `/api/support-requests`

| Método | URL | Descripción | Auth |
|---|---|---|---|
| GET | `/api/support-requests` | Lista todas las solicitudes recibidas | ✅ JWT |
| POST | `/api/support-requests` | Registra una nueva solicitud de donante (público) | ❌ Público |
| DELETE | `/api/support-requests/:id` | Elimina una solicitud | ✅ JWT |

#### Catálogos y Utilidades — `/api`

| Método | URL | Descripción | Auth |
|---|---|---|---|
| GET | `/api/municipalities` | Lista todos los municipios | ❌ Público |
| GET | `/api/donation-types` | Lista los tipos de donación | ❌ Público |
| GET | `/api/educational-levels` | Lista los niveles educativos | ❌ Público |
| GET | `/api/dashboard/stats` | Estadísticas generales (totales, promedio de progreso, distribución de condiciones) | ❌ Público |
| GET | `/api/global-progress` | Progreso global de escuelas hacia nivel "Básico" o superior | ❌ Público |
| GET | `/api/export/needs` | Exporta todas las necesidades a archivo `.xlsx` | ❌ Público |
| POST | `/api/import/school-needs` | Importa necesidades desde un archivo `.xlsx` | ✅ JWT |

---

### 2.3 Stack Utilizado

| Tecnología | Versión | Rol |
|---|---|---|
| **Node.js** | LTS | Runtime del servidor |
| **Express** | ^4.18.2 | Framework web / routing |
| **mysql2** | ^3.6.5 | Driver MySQL con soporte de Promises |
| **jsonwebtoken** | ^9.0.2 | Generación y verificación de tokens JWT |
| **express-validator** | ^7.0.1 | Validación de campos de entrada |
| **multer** | ^2.1.1 | Manejo de subida de archivos (imágenes, Excel) |
| **xlsx** | ^0.18.5 | Lectura y escritura de archivos Excel |
| **dotenv** | ^16.3.1 | Gestión de variables de entorno |
| **cors** | ^2.8.5 | Política de CORS (permite `localhost:5500`) |
| **nodemon** | ^3.0.2 | Recarga automática en desarrollo |

---

### 2.4 Argumentación del Stack

**¿Por qué Node.js + Express?**

- **Consistencia de lenguaje**: el mismo lenguaje (JavaScript) en frontend y backend reduce el contexto que el equipo debe manejar.
- **Ecosistema npm**: acceso inmediato a paquetes como `mysql2`, `multer`, `xlsx` y `jsonwebtoken` sin necesidad de buscar alternativas en otros ecosistemas.
- **Velocidad de desarrollo**: Express es minimalista; permite montar endpoints en pocas líneas, ideal para el alcance del proyecto.
- **mysql2 con Promises**: permite usar `async/await` de forma nativa, lo que simplifica el código asíncrono y el manejo de errores.

**Tecnologías consideradas y descartadas:**

| Alternativa | Razón de descarte |
|---|---|
| Django (Python) | Equipo con menor dominio de Python; curva de aprendizaje del ORM |
| Spring Boot (Java) | Excesivamente verboso para el tamaño del proyecto; configuración más compleja |
| FastAPI (Python) | Buena opción técnica, pero el equipo prefirió mantener JS en todo el stack |
| NestJS | Framework más estructurado sobre Node.js, pero con más overhead de configuración innecesario para este proyecto |
| Prisma ORM | Se evaluó, pero se prefirió `mysql2` directo para tener control total de las queries y poder invocar Stored Procedures de MySQL |
| bcrypt | Se consideró para hashear contraseñas pero no se implementó; las contraseñas se almacenan en texto plano (limitación conocida) |

---

## 3. Interacción con la Base de Datos [Iván]

### 3.1 Resumen de Operaciones

La base de datos es **MySQL** (`mieescuela_primero`). Las operaciones se realizan a través de un pool de conexiones (`mysql2/promise`, límite de 10 conexiones) configurado con variables de entorno.

**Operaciones principales:**

| Operación | Tabla(s) | Descripción |
|---|---|---|
| SELECT con JOINs | `escuela`, `municipio`, `nivel_educativo`, `escuela_necesidad`, `necesidad_catalogo`, `escuela_tipo_donacion`, `tipo_donacion` | Obtener escuelas con sus relaciones (filtros dinámicos con WHERE 1=1) |
| SELECT por ID | Mismas tablas | Detalle completo de una escuela |
| INSERT | `escuela` | Crear nueva escuela (UUID generado con `crypto.randomUUID()`) |
| UPDATE dinámico | `escuela` | Actualizar solo los campos enviados en el body (SET construido dinámicamente) |
| DELETE con CASCADE | `escuela` → `escuela_necesidad`, `escuela_tipo_donacion` | Eliminar escuela y sus relaciones |
| INSERT IGNORE | `escuela_tipo_donacion`, `escuela_necesidad` | Asignar tipos de donación y necesidades sin duplicados |
| DELETE + INSERT | `escuela_tipo_donacion` | Reemplazar tipos de donación al editar escuela |
| CALL SP | `sp_upsert_propuesta`, `sp_update_propuesta`, `sp_delete_propuesta` | CRUD de propuestas vía Stored Procedures |
| SELECT de vista | `vista_propuestas_escuela` | Listar propuestas de una escuela |
| INSERT | `solicitud_apoyo` | Registrar solicitud de donante |
| DELETE | `solicitud_apoyo` | Eliminar solicitud |
| Conteos y AVG | `escuela`, `escuela_necesidad`, `solicitud_apoyo` | Estadísticas del dashboard |
| INSERT/UPDATE masivo | `municipio`, `escuela`, `necesidad_catalogo`, `escuela_necesidad` | Importación desde Excel |
| SELECT para Excel | Todas las tablas relacionadas | Exportación a Excel |

---

### 3.2 Stored Procedures

> **Nota:** Los SPs actuales no implementan transacciones explícitas (`START TRANSACTION / COMMIT / ROLLBACK`). Se recomienda actualizarlos para garantizar atomicidad, especialmente en `sp_upsert_propuesta` que realiza dos operaciones (INSERT en `necesidad_catalogo` + INSERT en `escuela_necesidad`).

#### `sp_upsert_propuesta` — Agregar propuesta nueva

```sql
CALL sp_upsert_propuesta(p_id_escuela, p_subcategoria, p_categoria,
  p_propuesta, p_cantidad_requerida, p_unidad, p_estado, p_detalles)
```

- Inserta un registro en `necesidad_catalogo`.
- Obtiene el `LAST_INSERT_ID()` y lo vincula con la escuela en `escuela_necesidad` (INSERT IGNORE).
- Devuelve el `id_necesidad` generado.
- **Mejora sugerida**: envolver ambas operaciones en una transacción explícita.

#### `sp_update_propuesta` — Actualizar propuesta existente

```sql
CALL sp_update_propuesta(p_id_necesidad, p_subcategoria, p_categoria,
  p_propuesta, p_cantidad_requerida, p_unidad, p_estado, p_detalles)
```

- Actualiza los campos de un registro en `necesidad_catalogo` usando `COALESCE` para preservar valores no enviados.

#### `sp_delete_propuesta` — Eliminar propuesta

```sql
CALL sp_delete_propuesta(p_id_necesidad)
```

- Elimina el registro de `escuela_necesidad` (aunque ya existe CASCADE).
- Elimina el registro de `necesidad_catalogo`.
- **Mejora sugerida**: añadir transacción explícita.

---

### 3.3 Triggers

> **Estado actual**: No se han implementado triggers en el esquema actual (`database.sql`). Se recomienda añadir al menos los siguientes para el entregable final:

| Trigger sugerido | Evento | Tabla | Acción |
|---|---|---|---|
| `trg_after_propuesta_insert` | AFTER INSERT | `escuela_necesidad` | Llamar SP para recalcular `nivel_condicion` de la escuela |
| `trg_after_solicitud_insert` | AFTER INSERT | `solicitud_apoyo` | Registrar en tabla de log de actividad |
| `trg_before_escuela_delete` | BEFORE DELETE | `escuela` | Verificar reglas de negocio antes de eliminar |

---

### 3.4 Vistas (Views)

#### `vista_propuestas_escuela` — Vista de propuestas por escuela

```sql
SELECT nc.id_necesidad, nc.nombre_necesidad AS subcategoria,
  nc.categoria_general AS categoria, nc.propuesta,
  nc.cantidad_requerida, nc.cantidad_recibida, nc.unidad,
  nc.estado, nc.detalles, nc.prioridad,
  e.id_escuela, e.nombre AS escuela_nombre,
  m.nombre_municipio AS municipio
FROM necesidad_catalogo nc
JOIN escuela_necesidad en ON nc.id_necesidad = en.id_necesidad
JOIN escuela e ON en.id_escuela = e.id_escuela
JOIN municipio m ON e.id_municipio = m.id_municipio;
```

**Uso:** Es consultada directamente por `propuestaController.js` (`getPropuestas`) para listar todas las propuestas asociadas a una escuela específica mediante `WHERE id_escuela = ?`.

---

### 3.5 Queries Relevantes

**Listado de escuelas con filtros dinámicos** (schoolController.js — `getSchools`):
```sql
SELECT DISTINCT e.*, m.nombre_municipio, nv.nombre_nivel
FROM escuela e
JOIN municipio m ON e.id_municipio = m.id_municipio
LEFT JOIN nivel_educativo nv ON e.id_nivel = nv.id_nivel
LEFT JOIN escuela_tipo_donacion etd ON e.id_escuela = etd.id_escuela
LEFT JOIN tipo_donacion td ON etd.id_tipo_donacion = td.id_tipo_donacion
WHERE 1=1
  [AND m.nombre_municipio = ?]
  [AND td.nombre_tipo = ?]
  [AND (e.nombre LIKE ? OR e.descripcion LIKE ?)]
```

**Estadísticas del dashboard** (catalogController.js — `getDashboardStats`):
```sql
SELECT COUNT(*) FROM escuela;
SELECT COUNT(*) FROM escuela_necesidad;
SELECT COUNT(*) FROM solicitud_apoyo;
SELECT AVG(progreso_financiamiento) FROM escuela;
SELECT nivel_condicion, COUNT(*) FROM escuela GROUP BY nivel_condicion;
```

---

## 4. Pruebas Realizadas a los Endpoints [Gerardo]

### 4.1 Plan de Pruebas

Las pruebas se realizaron manualmente usando el navegador (para GETs públicos) y herramientas como Postman/Thunder Client (para endpoints con autenticación).

| ID | Endpoint | Método | Caso de Prueba | Resultado Esperado |
|---|---|---|---|---|
| T01 | `/api/auth/login` | POST | Credenciales válidas (`admin@miescuela.org` / `admin123`) | 200 + token JWT |
| T02 | `/api/auth/login` | POST | Contraseña incorrecta | 401 Credenciales inválidas |
| T03 | `/api/auth/login` | POST | Email con formato inválido | 400 (validación) |
| T04 | `/api/schools` | GET | Sin filtros | 200 + array de escuelas |
| T05 | `/api/schools` | GET | `?county=Zapopan` | 200 + solo escuelas de Zapopan |
| T06 | `/api/schools` | GET | `?search=esperanza` | 200 + escuelas que coinciden |
| T07 | `/api/schools/:id` | GET | ID válido | 200 + detalle completo |
| T08 | `/api/schools/:id` | GET | ID inexistente | 404 Escuela no encontrada |
| T09 | `/api/schools` | POST | Sin token | 401 Token no proporcionado |
| T10 | `/api/schools` | POST | Token válido + datos completos | 201 + ID de la escuela creada |
| T11 | `/api/schools` | POST | Escuela duplicada (mismo nombre y municipio) | 409 Ya existe una escuela |
| T12 | `/api/schools/:id` | PUT | Token válido + actualizar nombre | 200 Escuela actualizada |
| T13 | `/api/schools/:id` | DELETE | Token válido + ID válido | 204 No Content |
| T14 | `/api/schools/:id` | DELETE | ID inexistente | 404 Escuela no encontrada |
| T15 | `/api/schools/:id/image` | POST | Imagen válida (< 5MB) | 200 + imageUrl |
| T16 | `/api/schools/:id/propuestas` | GET | ID válido con propuestas | 200 + array de propuestas |
| T17 | `/api/schools/:id/propuestas` | POST | Token válido + datos de propuesta | 201 + id_necesidad |
| T18 | `/api/schools/:id/propuestas/:idNecesidad` | PUT | Actualizar estado a "Cubierto" | 200 Propuesta actualizada |
| T19 | `/api/schools/:id/propuestas/:idNecesidad` | DELETE | Eliminar propuesta | 200 Propuesta eliminada |
| T20 | `/api/support-requests` | POST | Datos completos del formulario donante | 201 + folio UUID |
| T21 | `/api/support-requests` | POST | Municipio no existente en BD | 201 (municipio se ignora, `id_municipio = null`) |
| T22 | `/api/support-requests` | GET | Sin token | 401 Token no proporcionado |
| T23 | `/api/support-requests` | GET | Token válido | 200 + array de solicitudes |
| T24 | `/api/support-requests/:id` | DELETE | Token válido + ID válido | 204 No Content |
| T25 | `/api/municipalities` | GET | — | 200 + lista de municipios |
| T26 | `/api/donation-types` | GET | — | 200 + tipos de donación |
| T27 | `/api/dashboard/stats` | GET | — | 200 + objeto de estadísticas |
| T28 | `/api/export/needs` | GET | — | Descarga archivo `.xlsx` |
| T29 | `/api/import/school-needs` | POST | Token válido + archivo Excel válido | 200 + `imported: N` |
| T30 | `/api/import/school-needs` | POST | Archivo con filas sin campos obligatorios | 200 + `errors: [...]` |

---

### 4.2 Resultados de las Pruebas

| ID | ¿Se realizó? | ¿Problemas encontrados? | Descripción del problema |
|---|---|---|---|
| T01 | ✅ Sí | No | Funcionó correctamente |
| T02 | ✅ Sí | No | Respuesta 401 correcta |
| T03 | ✅ Sí | No | Validación de express-validator funciona |
| T04 | ✅ Sí | No | Devuelve todas las escuelas |
| T05 | ✅ Sí | No | Filtro por municipio funciona correctamente |
| T06 | ✅ Sí | No | Búsqueda por texto funciona |
| T07 | ✅ Sí | No | Devuelve propuestas, donationTypes, progreso |
| T08 | ✅ Sí | No | 404 correcto |
| T09 | ✅ Sí | No | 401 correcto sin token |
| T10 | ✅ Sí | No | Escuela creada exitosamente |
| T11 | ✅ Sí | Sí (corregido) | Inicialmente generaba error 500 por duplicado en `escuela_tipo_donacion`; se corrigió usando `INSERT IGNORE` |
| T12 | ✅ Sí | Sí (corregido) | Al editar con `fundingProgress > 100` generaba error de CHECK constraint; se añadió `Math.min(100, Math.max(0, ...))` en el frontend |
| T13 | ✅ Sí | No | DELETE con CASCADE funciona correctamente |
| T14 | ✅ Sí | No | 404 correcto |
| T15 | ✅ Sí | No | Imagen sube y URL se guarda en BD |
| T16 | ✅ Sí | No | Vista `vista_propuestas_escuela` retorna correctamente |
| T17 | ✅ Sí | No | SP `sp_upsert_propuesta` ejecuta correctamente |
| T18 | ✅ Sí | No | SP `sp_update_propuesta` actualiza con COALESCE |
| T19 | ✅ Sí | No | SP `sp_delete_propuesta` elimina correctamente |
| T20 | ✅ Sí | No | Folio UUID retornado correctamente |
| T21 | ✅ Sí | Sí (comportamiento aceptado) | Municipio no existente: `id_municipio` queda NULL; no genera error pero tampoco inserta el municipio nuevo |
| T22 | ✅ Sí | No | 401 correcto |
| T23 | ✅ Sí | No | Lista de solicitudes correcta |
| T24 | ✅ Sí | No | 204 correcto |
| T25 | ✅ Sí | No | Lista de municipios correcta |
| T26 | ✅ Sí | No | Lista de tipos de donación correcta |
| T27 | ✅ Sí | No | Estadísticas correctas |
| T28 | ✅ Sí | No | Archivo Excel descargado correctamente |
| T29 | ✅ Sí | No | Importación masiva procesa filas correctamente |
| T30 | ✅ Sí | No | Filas con errores se reportan en el campo `errors` |

---

### 4.3 Resumen de Problemas Encontrados y Resueltos

1. **Error 500 al crear escuela con tipos de donación duplicados (T11)**
   - **Causa**: `INSERT INTO escuela_tipo_donacion` fallaba con `Duplicate entry` si se volvía a guardar la misma escuela.
   - **Solución**: Cambiar `INSERT` por `INSERT IGNORE`, que omite la inserción silenciosamente si la clave primaria compuesta ya existe.

2. **Error de CHECK constraint al actualizar progreso (T12)**
   - **Causa**: El campo `progreso_financiamiento` tiene `CHECK (BETWEEN 0 AND 100)` en MySQL. Si el formulario enviaba un valor fuera de rango (por ejemplo, 101), la query fallaba.
   - **Solución**: Añadir `Math.min(100, Math.max(0, Number(...)))` en el frontend antes de enviar el payload, y validación con `express-validator` en el backend.

3. **Municipio del donante no resuelto (T21)**
   - **Causa**: El select de municipios en `donante.html` tiene opciones que no existen en la tabla `municipio` de la BD (ej. "Tonalá", "Lagos de Moreno").
   - **Estado**: No se corrigió; el campo `id_municipio` queda NULL en esos casos. Se acepta como limitación conocida para el entregable.

---

## 5. Limitaciones y Deuda Técnica Conocida

| Ítem | Descripción |
|---|---|
| Contraseñas en texto plano | `admin_usuario.password_hash` almacena texto plano. Falta implementar `bcrypt` |
| Sin transacciones explícitas | Los SPs no usan `START TRANSACTION / COMMIT / ROLLBACK` |
| Sin triggers | No hay triggers implementados en el esquema actual |
| Mapa no integrado | La vista de mapa es un placeholder; requiere integración con Google Maps o Leaflet |
| CORS restringido a localhost | Solo permite `localhost:5500`; requiere configuración para producción |
| Sin paginación | El endpoint `GET /api/schools` devuelve todas las escuelas sin paginación |

---

*Documento generado el 30 de abril de 2026.*
