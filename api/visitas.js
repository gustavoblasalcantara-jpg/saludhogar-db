/**
 * POST /api/visitas
 * Body: { pagina_visitada?: string }
 *
 * Registra una visita en `registro_visitas`. El navegador solo llama
 * a este endpoint después de que el visitante aceptó las cookies de
 * analítica (ver js/tracker/cookie-banner.js) — la decisión de
 * rastrear o no se toma del lado del cliente antes de hacer el fetch.
 */

const { sql } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    // Saneamos: solo aceptamos un slug corto, nunca HTML/markup arbitrario.
    const paginaRaw = typeof body.pagina_visitada === 'string' ? body.pagina_visitada : 'inicio';
    const pagina = paginaRaw.replace(/[^a-zA-Z0-9/_-]/g, '').slice(0, 100) || 'inicio';

    // IP del visitante: Vercel la entrega en x-forwarded-for.
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || '')
      .toString()
      .split(',')[0]
      .trim()
      .slice(0, 45);

    // Consulta parametrizada: el driver de Neon escapa `ip` y `pagina`
    // automáticamente, no hay forma de inyectar SQL desde aquí.
    await sql`
      INSERT INTO registro_visitas (ip_visitante, pagina_visitada)
      VALUES (${ip}, ${pagina})
    `;

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[api/visitas] Error:', err.message);
    return res.status(500).json({ ok: false, error: 'No se pudo registrar la visita.' });
  }
};
