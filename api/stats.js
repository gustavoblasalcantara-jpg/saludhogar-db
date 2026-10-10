/**
 * GET /api/stats
 * Header: Authorization: Bearer <token>
 *
 * Devuelve las métricas del dashboard: total de visitas, visitas de
 * los últimos 7 días, producto más solicitado y el ranking completo.
 * Protegido: sin un token de sesión válido (emitido por /api/login),
 * responde 401 y el panel redirige a login.html.
 */

const { sql } = require('../lib/db');
const { verify, getBearerToken } = require('../lib/token');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }

  const token = getBearerToken(req);
  const session = verify(token);
  if (!session || session.rol !== 'admin') {
    return res.status(401).json({ ok: false, error: 'Sesión inválida o expirada.' });
  }

  try {
    const [totalVisitasRows, visitasPorDia, ranking] = await Promise.all([
      sql`SELECT COUNT(*)::int AS total FROM registro_visitas`,
      sql`
        SELECT DATE(fecha_visita) AS dia, COUNT(*)::int AS total
        FROM registro_visitas
        WHERE fecha_visita >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(fecha_visita)
        ORDER BY dia ASC
      `,
      sql`
        SELECT id, nombre, categoria, solicitudes_count
        FROM productos_salud
        ORDER BY solicitudes_count DESC, nombre ASC
      `,
    ]);

    return res.status(200).json({
      ok: true,
      totalVisitas: totalVisitasRows[0]?.total ?? 0,
      visitasPorDia,
      productoTop: ranking[0] || null,
      ranking,
    });
  } catch (err) {
    console.error('[api/stats] Error:', err.message);
    return res.status(500).json({ ok: false, error: 'No se pudieron cargar las métricas.' });
  }
};
