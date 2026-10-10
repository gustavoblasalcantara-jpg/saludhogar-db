/**
 * Genera el hash scrypt de una contraseña para pegarlo en el
 * INSERT INTO usuarios (...) de db/schema.sql.
 *
 * Uso:
 *   node db/generate-admin-hash.js "MiContraseñaSegura123"
 */

const { hashPassword } = require('../lib/password');

const plainText = process.argv[2];

if (!plainText) {
  console.error('Uso: node db/generate-admin-hash.js "TuContraseña"');
  process.exit(1);
}

hashPassword(plainText).then((hash) => {
  console.log('\nHash generado — cópialo en la columna `contrasena` de tu INSERT:\n');
  console.log(hash);
  console.log('');
});
