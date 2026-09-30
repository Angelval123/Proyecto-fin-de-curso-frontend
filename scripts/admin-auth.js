// Acceso de trabajadores: botón "Trabajador" en la cabecera, formulario de login y sesión.
(() => {
  const sessionKey = 'estore-admin-session';
  const lockKey = 'estore-admin-lock';
  const sessionDuration = 2 * 60 * 60 * 1000;
  const maxAttempts = 5;
  const lockDuration = 60 * 1000;

  // La contraseña no se guarda en texto plano: solo el hash SHA-256 de "salt:contraseña".
  const workers = [
    {
      user: 'admin',
      name: 'Administrador',
      salt: 'estore-admin-2026',
      hash: 'd839b1aaf98dc985166e60d29a2174a52923880057702ed86e3bb1a275a25ca9'
    }
  ];

  const sha256 = async (text) => {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  const readJson = (storage, key) => {
    try {
      return JSON.parse(storage.getItem(key) || 'null');
    } catch {
      return null;
    }
  };

  const getSession = () => {
    const session = readJson(sessionStorage, sessionKey);
    if (!session || !session.user || Date.now() > session.expiresAt) {
      sessionStorage.removeItem(sessionKey);
      return null;
    }
    return session;
  };

  const logout = () => sessionStorage.removeItem(sessionKey);

  const getLock = () => readJson(localStorage, lockKey) || { attempts: 0, lockedUntil: 0 };
  const lockRemaining = () => Math.max(0, getLock().lockedUntil - Date.now());

  const registerFailure = () => {
    const lock = getLock();
    const attempts = lock.lockedUntil && Date.now() > lock.lockedUntil ? 1 : lock.attempts + 1;
    const lockedUntil = attempts >= maxAttempts ? Date.now() + lockDuration : 0;
    localStorage.setItem(lockKey, JSON.stringify({ attempts: lockedUntil ? 0 : attempts, lockedUntil }));
    return maxAttempts - attempts;
  };

  const login = async (user, password) => {
    if (lockRemaining()) return { ok: false, locked: true };
    if (!window.crypto?.subtle) {
      return { ok: false, error: 'Tu navegador no permite verificar la contraseña. Abre el sitio desde http://localhost o https.' };
    }

    const worker = workers.find((item) => item.user === user.trim().toLowerCase());
    const hash = await sha256(`${worker?.salt || 'estore-admin-2026'}:${password}`);
    if (!worker || hash !== worker.hash) {
      const remaining = registerFailure();
      if (lockRemaining()) return { ok: false, locked: true };
      return {
        ok: false,
        error: `Usuario o contraseña incorrectos. Te quedan ${remaining} ${remaining === 1 ? 'intento' : 'intentos'}.`
      };
    }

    localStorage.removeItem(lockKey);
    const session = { user: worker.user, name: worker.name, expiresAt: Date.now() + sessionDuration };
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    return { ok: true, session };
  };

  let formCount = 0;

  const createLoginForm = ({ onSuccess }) => {
    formCount += 1;
    const userId = `worker-user-${formCount}`;
    const passwordId = `worker-password-${formCount}`;
    const form = document.createElement('form');
    form.className = 'worker-login';
    form.noValidate = true;
    form.innerHTML = `
      <label class="worker-login__label" for="${userId}">Usuario</label>
      <input class="worker-login__input" id="${userId}" name="user" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" required>
      <label class="worker-login__label" for="${passwordId}">Contraseña</label>
      <div class="worker-login__password">
        <input class="worker-login__input" id="${passwordId}" name="password" type="password" autocomplete="current-password" required>
        <button class="worker-login__toggle" type="button" aria-controls="${passwordId}" aria-pressed="false">Mostrar</button>
      </div>
      <p class="worker-login__error" role="alert" aria-live="assertive"></p>
      <button class="btn btn-primary worker-login__submit" type="submit">Ingresar al panel</button>
    `;

    const userInput = form.querySelector(`#${userId}`);
    const passwordInput = form.querySelector(`#${passwordId}`);
    const toggle = form.querySelector('.worker-login__toggle');
    const errorMessage = form.querySelector('.worker-login__error');
    const submit = form.querySelector('.worker-login__submit');
    let lockTimer = null;

    const showError = (message, field) => {
      errorMessage.textContent = message;
      [userInput, passwordInput].forEach((input) => input.removeAttribute('aria-invalid'));
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.focus();
      }
    };

    const watchLock = () => {
      clearInterval(lockTimer);
      const update = () => {
        const seconds = Math.ceil(lockRemaining() / 1000);
        if (!seconds) {
          clearInterval(lockTimer);
          submit.disabled = false;
          showError('');
          return;
        }
        submit.disabled = true;
        showError(`Demasiados intentos fallidos. Intenta de nuevo en ${seconds} s.`);
      };
      update();
      lockTimer = setInterval(update, 1000);
    };

    toggle.addEventListener('click', () => {
      const isVisible = passwordInput.type === 'text';
      passwordInput.type = isVisible ? 'password' : 'text';
      toggle.textContent = isVisible ? 'Mostrar' : 'Ocultar';
      toggle.setAttribute('aria-pressed', String(!isVisible));
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!userInput.value.trim()) {
        showError('Ingresa tu usuario.', userInput);
        return;
      }
      if (!passwordInput.value) {
        showError('Ingresa tu contraseña.', passwordInput);
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Verificando...';
      const result = await login(userInput.value, passwordInput.value);
      submit.textContent = 'Ingresar al panel';
      submit.disabled = false;

      if (result.ok) {
        form.reset();
        showError('');
        onSuccess(result.session);
        return;
      }
      passwordInput.value = '';
      if (result.locked) {
        watchLock();
        return;
      }
      showError(result.error, passwordInput);
    });

    if (lockRemaining()) watchLock();
    form.focusFirst = () => userInput.focus();
    return form;
  };

  const goToDashboard = () => {
    window.location.href = 'admin.html';
  };

  let loginModal = null;
  let lastFocused = null;

  const closeLogin = () => {
    if (!loginModal) return;
    loginModal.hidden = true;
    lastFocused?.focus();
  };

  const openLogin = () => {
    if (getSession()) {
      goToDashboard();
      return;
    }
    if (!loginModal) {
      loginModal = document.createElement('div');
      loginModal.className = 'quantity-modal worker-modal';
      loginModal.hidden = true;
      loginModal.innerHTML = `
        <div class="quantity-modal__backdrop" data-close-worker-modal></div>
        <section class="quantity-modal__dialog worker-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="worker-modal-title">
          <button class="quantity-modal__close" type="button" aria-label="Cerrar" data-close-worker-modal>&times;</button>
          <p class="eyebrow worker-modal__eyebrow">Acceso de trabajadores</p>
          <h2 id="worker-modal-title">Ingresa al panel de gestión</h2>
          <p class="worker-modal__intro">Solo para personal de E-Store. Desde el panel puedes añadir y editar los productos publicados.</p>
        </section>
      `;
      const form = createLoginForm({ onSuccess: goToDashboard });
      loginModal.querySelector('.worker-modal__dialog').appendChild(form);
      loginModal.focusFirst = form.focusFirst;
      loginModal.querySelectorAll('[data-close-worker-modal]').forEach((element) => {
        element.addEventListener('click', closeLogin);
      });
      loginModal.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeLogin();
      });
      document.body.appendChild(loginModal);
    }
    lastFocused = document.activeElement;
    loginModal.hidden = false;
    loginModal.focusFirst();
  };

  const workerIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.4 0-8 2.2-8 5v1.5h16V19c0-2.8-3.6-5-8-5Z"/>
    </svg>
  `;

  const addHeaderButton = () => {
    const actions = document.querySelector('.site-header .nav-actions');
    if (!actions || document.body.dataset.page === 'admin') return;
    const session = getSession();
    const button = document.createElement(session ? 'a' : 'button');
    button.className = 'worker-button';
    button.innerHTML = `${workerIcon}<span class="worker-button__label">${session ? 'Panel' : 'Trabajador'}</span>`;
    if (session) {
      button.href = 'admin.html';
      button.setAttribute('aria-label', 'Ir al panel de gestión');
    } else {
      button.type = 'button';
      button.setAttribute('aria-label', 'Acceso de trabajadores');
      button.addEventListener('click', openLogin);
    }
    actions.insertBefore(button, actions.querySelector('.cart-button'));
  };

  window.EStoreAuth = { getSession, login, logout, openLogin, createLoginForm };
  addHeaderButton();
})();
