/**
 * POST /api/solicitudes
 * Body: { id_producto: number }
 *
 * Registra un clic en "Solicitar información" / "Ver detalles" sobre
 * un producto/servicio, e incrementa su contador `solicitudes_count`.
 */

const { sql } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const idProducto = Number.parseInt(body.id_producto, 10);

    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      return res.status(400).json({ ok: false, error: 'id_producto inválido.' });
    }

    // Confirmamos que el producto existe antes de registrar nada, para
    // no acumular filas huérfanas ni IDs inventados por el cliente.
    const existe = await sql`SELECT id FROM productos_salud WHERE id = ${idProducto} LIMIT 1`;
    if (existe.length === 0) {
      return res.status(404).json({ ok: false, error: 'Producto no encontrado.' });
    }

    // Nota: son dos sentencias secuenciales (no una transacción interactiva),
    // suficiente para un contador de analítica. Si más adelante esto maneja
    // pagos o inventario real, pasar a `Pool`/`Client` con BEGIN/COMMIT.
    await sql`INSERT INTO solicitudes_productos (id_producto) VALUES (${idProducto})`;
    await sql`UPDATE productos_salud SET solicitudes_count = solicitudes_count + 1 WHERE id = ${idProducto}`;

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[api/solicitudes] Error:', err.message);
    return res.status(500).json({ ok: false, error: 'No se pudo registrar la solicitud.' });
  }
};
