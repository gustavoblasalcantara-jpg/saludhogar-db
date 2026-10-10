/**
 * POST /api/login
 * Body: { correo: string, contrasena: string }
 *
 * Verifica las credenciales contra la tabla `usuarios` (hash scrypt,
 * ver lib/password.js) y, si son válidas, devuelve un token de sesión
 * firmado (ver lib/token.js) que el panel guarda en sessionStorage y
 * reenvía como `Authorization: Bearer <token>` en /api/stats.
 */

const { sql } = require('../lib/db');
const { verifyPassword } = require('../lib/password');
const { sign } = require('../lib/token');

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas

// Limita intentos de fuerza bruta por IP (muy básico: en memoria, se
// reinicia en cada cold start — suficiente para una demo; en producción
// real usar un store compartido como Upstash Redis).
const intentos = new Map();
const MAX_INTENTOS = 8;
const VENTANA_MS = 10 * 60 * 1000;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .toString()
    .split(',')[0]
    .trim();

  const registro = intentos.get(ip);
  if (registro && registro.count >= MAX_INTENTOS && Date.now() - registro.first < VENTANA_MS) {
    return res.status(429).json({ ok: false, error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const correo = typeof body.correo === 'string' ? body.correo.trim().toLowerCase().slice(0, 150) : '';
    const contrasena = typeof body.contrasena === 'string' ? body.contrasena : '';

    if (!correo || !contrasena) {
      return res.status(400).json({ ok: false, error: 'Ingresa tu correo y tu contraseña.' });
    }

    const rows = await sql`
      SELECT id, nombre, rol, contrasena FROM usuarios WHERE correo = ${correo} LIMIT 1
    `;

    const user = rows[0];
    const valido = user ? await verifyPassword(contrasena, user.contrasena) : false;

    if (!valido) {
      const prev = intentos.get(ip) || { count: 0, first: Date.now() };
      intentos.set(ip, { count: prev.count + 1, first: prev.first });
      return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos.' });
    }

    intentos.delete(ip);

    const token = sign({
      id: user.id,
      nombre: user.nombre,
      rol: user.rol,
      exp: Date.now() + SESSION_DURATION_MS,
    });

    return res.status(200).json({ ok: true, token, nombre: user.nombre, rol: user.rol });
  } catch (err) {
    console.error('[api/login] Error:', err.message);
    return res.status(500).json({ ok: false, error: 'No se pudo iniciar sesión.' });
  }
};
