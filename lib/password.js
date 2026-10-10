/**
 * ============================================================
 * lib/password.js — Hash de contraseñas con scrypt (SOLO SERVIDOR)
 * ============================================================
 * Usa `crypto.scrypt`, parte del núcleo de Node.js — no agrega
 * dependencias externas (ni necesita bindings nativos como bcrypt,
 * lo que lo hace más simple de desplegar en Vercel Functions).
 * Cada contraseña lleva un "salt" aleatorio distinto, así dos
 * usuarios con la misma contraseña nunca producen el mismo hash
 * almacenado.
 *
 * Formato guardado en la columna `contrasena`: "<salt-hex>:<hash-hex>"
 */

const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);

async function hashPassword(plainText) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scrypt(plainText, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(plainText, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hashHex] = stored.split(':');
  const derivedKey = await scrypt(plainText, salt, 64);
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (storedBuf.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(storedBuf, derivedKey);
}

module.exports = { hashPassword, verifyPassword };
