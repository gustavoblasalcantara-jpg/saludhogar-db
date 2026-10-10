/**
 * ============================================================
 * lib/token.js — Tokens de sesión firmados (SOLO SERVIDOR)
 * ============================================================
 * Implementación mínima de un token tipo JWT usando únicamente el
 * módulo `crypto` nativo de Node.js (sin dependencias externas):
 *
 *   token = base64url(payload) + "." + base64url(HMAC-SHA256(payload))
 *
 * El navegador solo ve el token ya firmado (se lo entrega
 * /api/login.js); no puede fabricarlo ni modificarlo porque no
 * conoce SESSION_SECRET, que vive únicamente en el servidor.
 */

const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  console.error(
    '[SaludHogar] Falta la variable de entorno SESSION_SECRET. ' +
    'Genera una con, por ejemplo: openssl rand -hex 32'
  );
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payloadObj) {
  // Falla cerrado: sin secreto no se emite ningún token (una clave vacía
  // permitiría a cualquiera fabricar un token de administrador válido).
  if (!SECRET) throw new Error('SESSION_SECRET no está configurada.');
  const payload = base64url(JSON.stringify(payloadObj));
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verify(token) {
  if (!SECRET) return null; // sin secreto, ningún token es válido
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');

  // Comparación en tiempo constante para evitar timing attacks.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && Date.now() > data.exp) return null; // expirado
    return data;
  } catch {
    return null;
  }
}

/** Extrae el token del header `Authorization: Bearer <token>`. */
function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' ? token : null;
}

module.exports = { sign, verify, getBearerToken };
