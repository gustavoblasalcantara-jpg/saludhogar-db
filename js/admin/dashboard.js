/**
 * ============================================================
 * dashboard.js — Panel de administración (solo lectura de métricas)
 * ============================================================
 */

import { api } from '../config/api-client.js';
import { getSession, requireSessionOrRedirect, clearSession } from '../auth/session.js';

const els = {
  skeleton: document.getElementById('dash-skeleton'),
  content: document.getElementById('dash-content'),
  error: document.getElementById('dash-error'),
  adminName: document.getElementById('admin-name'),
  totalVisitas: document.getElementById('stat-visitas'),
  totalSolicitudes: document.getElementById('stat-solicitudes'),
  topNombre: document.getElementById('top-nombre'),
  topCategoria: document.getElementById('top-categoria'),
  topCount: document.getElementById('top-count'),
  rankingBody: document.getElementById('ranking-body'),
  chart: document.getElementById('visits-chart'),
  logoutBtn: document.getElementById('logout-btn'),
};

function showError(message) {
  els.skeleton.style.display = 'none';
  els.content.style.display = 'none';
  els.error.style.display = 'block';
  els.error.textContent = message;
}

function renderChart(visitasPorDia) {
  els.chart.innerHTML = '';
  if (!visitasPorDia.length) {
    els.chart.innerHTML = '<p class="chart-empty">Todavía no hay visitas registradas esta semana.</p>';
    return;
  }
  const max = Math.max(...visitasPorDia.map((d) => d.total), 1);
  visitasPorDia.forEach((d, i) => {
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    const pct = Math.round((d.total / max) * 100);
    bar.innerHTML = `
      <span class="chart-bar__value">${d.total}</span>
      <span class="chart-bar__fill" style="--target-height:${pct}%; animation-delay:${i * 60}ms;"></span>
      <span class="chart-bar__label">${new Date(d.dia).toLocaleDateString('es-PE', { weekday: 'short' })}</span>
    `;
    els.chart.appendChild(bar);
  });
}

function renderRanking(ranking) {
  els.rankingBody.innerHTML = ranking
    .map(
      (p, i) => `
      <tr style="animation-delay:${i * 50}ms">
        <td>${i + 1}</td>
        <td>${escapeHtml(p.nombre)}</td>
        <td><span class="badge-categoria">${escapeHtml(p.categoria)}</span></td>
        <td class="num">${p.solicitudes_count}</td>
      </tr>
    `
    )
    .join('');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadDashboard() {
  const session = requireSessionOrRedirect('login.html');
  if (!session) return;

  els.adminName.textContent = session.nombre || 'Administrador';

  const { status, ok, data } = await api.stats(session.token);

  if (status === 401) {
    clearSession();
    window.location.href = 'login.html';
    return;
  }

  if (!ok || !data?.ok) {
    showError(data?.error || 'No se pudieron cargar las métricas. Intenta recargar la página.');
    return;
  }

  const totalSolicitudes = data.ranking.reduce((acc, p) => acc + p.solicitudes_count, 0);

  els.totalVisitas.textContent = data.totalVisitas.toLocaleString('es-PE');
  els.totalSolicitudes.textContent = totalSolicitudes.toLocaleString('es-PE');

  if (data.productoTop) {
    els.topNombre.textContent = data.productoTop.nombre;
    els.topCategoria.textContent = data.productoTop.categoria;
    els.topCount.textContent = `${data.productoTop.solicitudes_count} solicitudes`;
  } else {
    els.topNombre.textContent = 'Todavía sin datos';
    els.topCategoria.textContent = '—';
    els.topCount.textContent = '';
  }

  renderChart(data.visitasPorDia);
  renderRanking(data.ranking);

  els.skeleton.style.display = 'none';
  els.content.style.display = 'block';
  els.content.classList.add('fade-in-up');
}

els.logoutBtn?.addEventListener('click', () => {
  clearSession();
  window.location.href = 'login.html';
});

loadDashboard();
