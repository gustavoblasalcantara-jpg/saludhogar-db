/**
 * GET /api/productos
 *
 * Lista pública del catálogo (sin autenticación: es lo mismo que ya se
 * ve en la landing, solo que ahora viene de la base de datos en vez de
 * estar escrito a mano en el HTML). No expone nada sensible: ninguna
 * columna de `usuarios` pasa por aquí.
 */

const { sql } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }

  try {
    const productos = await sql`
      SELECT id, nombre, categoria, descripcion, precio, imagen_url
      FROM productos_salud
      ORDER BY id ASC
    `;
    return res.status(200).json({ ok: true, productos });
  } catch (err) {
    console.error('[api/productos] Error:', err.message);
    return res.status(500).json({ ok: false, error: 'No se pudo cargar el catálogo.' });
  }
};
