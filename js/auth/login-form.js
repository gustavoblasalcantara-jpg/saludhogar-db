/**
 * ============================================================
 * login-form.js — Envío del formulario de login del admin
 * ============================================================
 */

import { api } from '../config/api-client.js';
import { saveSession, getSession } from './session.js';

const form = document.getElementById('login-form');
const errorBox = document.getElementById('login-error');
const submitBtn = document.getElementById('login-submit');

// Si ya hay sesión guardada, no tiene sentido mostrar el login de nuevo.
if (getSession()?.token) {
  window.location.href = 'panel.html';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.style.display = 'none';
  submitBtn.disabled = true;
  submitBtn.classList.add('is-loading');

  const correo = form.correo.value.trim();
  const contrasena = form.contrasena.value;

  const { data } = await api.login(correo, contrasena);

  submitBtn.disabled = false;
  submitBtn.classList.remove('is-loading');

  if (data?.ok) {
    saveSession({ token: data.token, nombre: data.nombre, rol: data.rol });
    window.location.href = 'panel.html';
  } else {
    errorBox.textContent = data?.error || 'No se pudo iniciar sesión. Intenta de nuevo.';
    errorBox.style.display = 'block';
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 500);
  }
});
