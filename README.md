# SaludHogar — Catálogo + Panel de analítica (Neon DB + Vercel Functions)

Landing pública con catálogo de servicios de salud, rastreo de visitas/clics con
consentimiento de cookies, y un panel de administración protegido con métricas
en tiempo real.

## Arquitectura (por qué es segura)

```
Navegador (HTML/CSS/JS)  ──fetch('/api/...')──►  Vercel Serverless Functions  ──►  Neon DB
   sin credenciales                               process.env.DATABASE_URL          (PostgreSQL)
                                                  process.env.SESSION_SECRET
```

La cadena de conexión de Neon **solo existe en el servidor** (variables de
entorno de Vercel). Ningún archivo que descarga el visitante la contiene.

## Estructura

```
├── index.html            Landing pública completa (hero, servicios, profesionales,
│                         por qué elegirnos, nos respalda, nosotros, testimonios,
│                         contacto + mapa, FAQ)
├── login.html            Acceso del administrador
├── panel.html            Dashboard (protegido)
├── api/                  Funciones serverless (única capa que toca la BD)
│   ├── visitas.js        POST  registra una visita
│   ├── solicitudes.js    POST  registra interés en un servicio (+1 al contador)
│   ├── login.js          POST  autentica y emite token firmado
│   ├── stats.js          GET   métricas (exige Bearer token válido)
│   └── productos.js      GET   catálogo (disponible; la landing actual no lo usa)
├── lib/                  Código compartido SOLO de servidor (db, token, password)
├── js/
│   ├── script.js         Interfaz de la landing (módulo ES) + conexión con el rastreo
│   ├── tracker/          Banner de cookies y rastreo (solo con consentimiento)
│   ├── auth/ admin/ config/   Login, panel y cliente fetch hacia /api
├── css/
│   ├── style.css         Estilos de la landing pública (paleta azul médico + naranja)
│   ├── animations.css    Keyframes y efectos (compartido con login/panel)
│   ├── main.css          Base del login/panel
│   └── dashboard.css     Estilos exclusivos del panel
├── db/                   schema.sql y generador del hash del admin
└── assets/images/        Logo y placeholders SVG
```

### Cómo se mide el interés por servicio
Cada especialidad de la landing equivale a una fila de `productos_salud` (ids 1–7, mapa
`SERVICE_PRODUCT_IDS` en `js/script.js`). Si el visitante **aceptó las cookies**, abrir el
detalle de un servicio o pulsar su botón de WhatsApp suma **una** solicitud por servicio y
visita. El panel lee esos contadores. Tras ejecutar `schema.sql`, comprueba el orden con:
`SELECT id, categoria FROM productos_salud ORDER BY id;`

## Puesta en marcha

1. **Neon**: crea un proyecto en https://console.neon.tech y copia la
   *connection string* (Connection Details).
2. **Dependencias**: `npm install`
3. **Hash del admin** (la contraseña nunca se guarda en texto plano):
   `node db/generate-admin-hash.js "TuContraseñaSegura"`
4. **Base de datos**: abre `db/schema.sql`, reemplaza `REEMPLAZA_CON_TU_HASH`
   por el hash del paso 3 y ejecútalo completo en el *SQL Editor* de Neon.
5. **Variables de entorno**: copia `.env.example` a `.env` y completa
   `DATABASE_URL` y `SESSION_SECRET` (`openssl rand -hex 32`).
6. **Probar en local**: `npx vercel dev` y abre http://localhost:3000
   (los módulos ES y `/api` requieren servidor; abrir el HTML con doble clic no funciona).
7. **Publicar**: sube el proyecto a GitHub e impórtalo en Vercel, o ejecuta
   `npx vercel --prod`. En *Project Settings → Environment Variables* agrega
   las mismas dos variables.

## Qué protege cada capa

| Riesgo | Mitigación |
|---|---|
| Robo de la cadena de Neon | Solo vive en `process.env` del servidor |
| Inyección SQL | Todas las consultas usan *tagged templates* parametrizados |
| XSS | El HTML dinámico escapa `& < > " '`; URLs de imagen validadas |
| Contraseñas filtradas | `scrypt` con *salt* único por usuario |
| Tokens falsificados | HMAC-SHA256 + comparación en tiempo constante + expiración (2 h); sin `SESSION_SECRET` el sistema falla cerrado |
| Acceso al dashboard | `/api/stats` verifica el token en cada petición (el redirect del navegador es solo cortesía de UI) |
| Rastreo sin permiso | No se envía ningún POST hasta aceptar el banner de cookies |

## Limitaciones conocidas (conviene saberlas)

- El límite de intentos de `/api/login` vive en memoria de cada instancia
  serverless; frena abusos básicos pero no es un rate-limit distribuido.
  Para producción seria, usa un almacén compartido (p. ej. Upstash Redis).
- El token se guarda en `sessionStorage` (se borra al cerrar la pestaña). Es
  razonable aquí porque el HTML dinámico está escapado; si el panel crece,
  considera cookies `HttpOnly` emitidas por el servidor.
- Se guarda la **IP** del visitante. La IP es dato personal (Ley N.º 29733,
  Perú): publica una política de privacidad y enlázala en el banner de cookies.
- El contador por clic usa dos sentencias secuenciales, no una transacción;
  es suficiente para analítica, no para inventario o pagos.
- El logo real (`logo-icon.png`, `logo-full.png`) ya está en `assets/images`; el login y el
  panel todavía usan el placeholder `logo-icon.svg` (cámbialo cuando quieras).
- Las fotos de la landing se cargan por URL desde Unsplash (licencia libre): necesitan
  internet y, si alguna URL deja de existir, el diseño muestra un respaldo (color/iniciales).
  Para producción conviene descargarlas a `assets/images`.
- Los testimonios, las cifras (7 especialidades, 100 %, < 45 min) y la fila "Nos respalda"
  son **contenido de ejemplo**: reemplázalos por datos verificables antes de publicar.
