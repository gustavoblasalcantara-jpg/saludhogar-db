/**
 * ============================================================
 * lib/db.js — Conexión a Neon DB (SOLO SERVIDOR)
 * ============================================================
 * Este módulo únicamente se importa desde /api/*.js, que corren
 * como Serverless Functions de Vercel (entorno Node.js del lado
 * del servidor). Nunca se importa desde código que corre en el
 * navegador — por eso `DATABASE_URL` puede leerse de forma segura
 * desde `process.env`, sin quedar expuesta en el HTML/JS que
 * descarga el visitante.
 *
 * `DATABASE_URL` se configura como variable de entorno:
 *   - En local: archivo `.env` (ver `.env.example`), nunca subido a git.
 *   - En Vercel: Project Settings → Environment Variables.
 */

const { neon } = require('@neondatabase/serverless');

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'Falta la variable de entorno DATABASE_URL. Configúrala en .env (local) o en Vercel → Environment Variables.'
      );
    }
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

// `sql` se usa igual que el cliente de Neon (tagged template, consultas
// parametrizadas), pero el cliente real se crea en la primera consulta.
// Así, si falta DATABASE_URL, el error cae dentro del try/catch de cada
// endpoint y responde un JSON claro en vez de un 500 opaco al cargar el módulo.
const sql = (...args) => getClient()(...args);

module.exports = { sql };
