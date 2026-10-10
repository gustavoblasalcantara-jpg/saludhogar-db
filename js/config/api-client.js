/**
 * ============================================================
 * api-client.js — Único punto de contacto del navegador con /api
 * ============================================================
 * Este módulo corre en el navegador y NO conoce ninguna credencial
 * de base de datos: solo hace fetch() a rutas relativas /api/...,
 * que Vercel resuelve como Serverless Functions en el mismo dominio.
 */

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return { status: res.status, ok: res.ok, data };
}

export const api = {
  productos: () => request('/api/productos', { method: 'GET' }),
  registrarVisita: (pagina_visitada) => request('/api/visitas', { method: 'POST', body: { pagina_visitada } }),
  registrarSolicitud: (id_producto) => request('/api/solicitudes', { method: 'POST', body: { id_producto } }),
  login: (correo, contrasena) => request('/api/login', { method: 'POST', body: { correo, contrasena } }),
  stats: (token) => request('/api/stats', { method: 'GET', token }),
};
