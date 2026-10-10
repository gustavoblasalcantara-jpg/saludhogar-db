/**
 * ============================================================
 * cookie-banner.js — Consentimiento de cookies de analítica
 * ============================================================
 * El rastreo (tracker.js) solo se activa después de que el
 * visitante acepta explícitamente. La decisión se guarda en
 * localStorage para no volver a preguntar en visitas futuras.
 */

const CONSENT_KEY = 'saludhogar_cookie_consent'; // 'accepted' | 'rejected'

export function getConsent() {
  return localStorage.getItem(CONSENT_KEY);
}

export function hasAnalyticsConsent() {
  return getConsent() === 'accepted';
}

export function initCookieBanner({ onAccept } = {}) {
  const existing = getConsent();
  if (existing) {
    if (existing === 'accepted' && onAccept) onAccept();
    return;
  }

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.innerHTML = `
    <div class="cookie-banner__text">
      <strong>Usamos cookies de analítica</strong>
      <p>Solo para entender qué servicios interesan más, nunca para identificarte personalmente. Puedes aceptar o rechazar cuando quieras.</p>
    </div>
    <div class="cookie-banner__actions">
      <button type="button" class="btn-cookie btn-cookie--reject" id="cookie-reject">Rechazar</button>
      <button type="button" class="btn-cookie btn-cookie--accept" id="cookie-accept">Aceptar</button>
    </div>
  `;
  document.body.appendChild(banner);

  // Forzamos un reflow antes de añadir la clase, para que la animación
  // de entrada (translateY + opacity) se dispare de verdad.
  requestAnimationFrame(() => banner.classList.add('is-visible'));

  function close() {
    banner.classList.remove('is-visible');
    banner.classList.add('is-leaving');
    setTimeout(() => banner.remove(), 400);
  }

  banner.querySelector('#cookie-accept').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    close();
    if (onAccept) onAccept();
  });

  banner.querySelector('#cookie-reject').addEventListener('click', () => {
    localStorage.setItem(CONSENT_KEY, 'rejected');
    close();
  });
}
