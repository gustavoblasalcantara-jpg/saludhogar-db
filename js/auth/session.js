/**
 * ============================================================
 * session.js — Sesión del panel, 100% del lado del cliente
 * ============================================================
 * El navegador solo guarda el TOKEN que /api/login.js ya validó y
 * firmó — nunca una contraseña ni el DATABASE_URL. El token se
 * verifica de verdad en cada llamada a /api/stats (del lado del
 * servidor); esto de aquí solo evita parpadeos de UI y redirige
 * cuanto antes si claramente no hay sesión.
 */

const SESSION_KEY = 'saludhogar_admin_session';

export function saveSession({ token, nombre, rol }) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, nombre, rol }));
}

export function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Route guard "optimista" para panel.html: si no hay ni rastro de
 * sesión guardada, redirige de inmediato sin esperar al fetch. La
 * verificación real ocurre igual cuando dashboard.js llama a
 * /api/stats — si el token fuera inválido o hubiese expirado, esa
 * llamada responde 401 y se redirige también desde ahí.
 */
export function requireSessionOrRedirect(redirectTo = 'login.html') {
  const session = getSession();
  if (!session || !session.token) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}
