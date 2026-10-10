/**
 * ============================================================
 * tracker.js — Registro de visitas y clics, vía /api (sin DB directa)
 * ============================================================
 */

import { api } from '../config/api-client.js';
import { initCookieBanner, hasAnalyticsConsent } from './cookie-banner.js';

/** Llama esto una vez, al cargar index.html. */
export function initTracking() {
  initCookieBanner({
    onAccept: () => registrarVisitaActual(),
  });

  // Si ya había consentimiento de una visita anterior, registramos de una vez.
  if (hasAnalyticsConsent()) {
    registrarVisitaActual();
  }
}

function registrarVisitaActual() {
  const pagina = document.body.dataset.pagina || 'inicio';
  api.registrarVisita(pagina).catch(() => {
    /* Fallo silencioso: la analítica nunca debe romper la experiencia del visitante. */
  });
}

/**
 * Registra el clic de "Solicitar información" / "Ver detalles" sobre
 * un producto. Se llama solo si hay consentimiento de cookies.
 */
const serviciosYaRegistrados = new Set();

export function trackProductClick(idProducto) {
  if (!hasAnalyticsConsent()) return;
  // Un servicio cuenta una sola vez por visita: abrir el detalle y luego pulsar
  // WhatsApp es el mismo interés, y así un visitante no infla el ranking.
  if (!idProducto || serviciosYaRegistrados.has(idProducto)) return;
  serviciosYaRegistrados.add(idProducto);
  api.registrarSolicitud(idProducto).catch(() => {});
}
