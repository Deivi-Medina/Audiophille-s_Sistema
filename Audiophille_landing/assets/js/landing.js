// ==========================================
// Funciones para manejar modales
// ==========================================

function openModal(type) {
  const modalId = type === "login" ? "loginModal" : "registerModal";
  const modal = document.getElementById(modalId);
  modal.style.display = "flex";

  // --- Configurar validación en tiempo real para el input de password ---
  const passwordInput = modal.querySelector('input[type="password"]');
  if (passwordInput) {
    // Remover listeners previos para evitar duplicados
    passwordInput.removeEventListener("input", handlePasswordInput);
    passwordInput.addEventListener("input", handlePasswordInput);
    // Actualizar estado inicial
    updatePasswordRequirements(passwordInput);
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function switchModal(type) {
  closeModal("loginModal");
  closeModal("registerModal");
  openModal(type);
}

// Mostrar mensaje de éxito/error desde el servidor
function showModalMessage(title, message) {
  const modal = document.getElementById("messageModal");
  const titleEl = document.getElementById("modalTitle");
  const msgEl = document.getElementById("modalMessage");
  titleEl.innerText = title;
  msgEl.innerText = message;
  modal.style.display = "flex";
}

// ==========================================
// Funciones para auth (toggle password, validación)
// ==========================================

function togglePasswordVisibility(button) {
  const wrapper = button.closest(".password-wrapper");
  if (!wrapper) return;
  const input = wrapper.querySelector("input");
  if (!input) return;
  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";
  // Cambiar ícono
  const icon = button.querySelector("i");
  if (icon) {
    icon.setAttribute("data-lucide", isPassword ? "eye" : "eye-off");
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }
}

function validatePasswordStrength(password) {
  const rules = [
    { regex: /.{8,}/, id: "length", label: "Mínimo 8 caracteres" },
    { regex: /[A-Z]/, id: "uppercase", label: "Mayúscula" },
    { regex: /[a-z]/, id: "lowercase", label: "Minúscula" },
    { regex: /[0-9]/, id: "number", label: "Número" },
    { regex: /[^A-Za-z0-9]/, id: "symbol", label: "Símbolo" },
  ];
  return rules.map((rule) => ({
    ...rule,
    met: rule.regex.test(password),
  }));
}

function updatePasswordRequirements(input) {
  // Buscar el contenedor de requisitos: puede estar en el mismo .auth-input-group o en el modal
  let container = input.closest(".auth-input-group")?.querySelector(".password-requirements");
  if (!container) {
    // Fallback: buscar en todo el modal
    const modal = input.closest(".modal");
    if (modal) {
      container = modal.querySelector(".password-requirements");
    }
  }
  if (!container) {
    // Si no hay contenedor, no hacer nada
    return;
  }

  const password = input.value;
  const results = validatePasswordStrength(password);

  // Actualizar cada item usando su data-rule
  results.forEach((result) => {
    const item = container.querySelector(`.req-item[data-rule="${result.id}"]`);
    if (item) {
      const icon = item.querySelector(".req-icon");
      if (result.met) {
        item.classList.add("met");
        if (icon) icon.textContent = "✅";
      } else {
        item.classList.remove("met");
        if (icon) icon.textContent = "⬜";
      }
    }
  });
}

// Manejador específico para eventos input
function handlePasswordInput(e) {
  updatePasswordRequirements(e.target);
}

// ==========================================
// Inicialización
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  // --- Botones de la landing (abrir modales) ---
  document.getElementById("openLoginBtn").addEventListener("click", () => openModal("login"));
  document.getElementById("openRegisterBtn").addEventListener("click", () => openModal("register"));
  document.getElementById("heroRegisterBtn").addEventListener("click", () => openModal("register"));

  // --- Cerrar modales con la X ---
  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", function () {
      const modal = this.closest(".modal");
      if (modal) closeModal(modal.id);
    });
  });

  // --- Botón "Aceptar" del modal de mensaje ---
  document.querySelector("#messageModal .auth-btn-primary")?.addEventListener("click", function (e) {
    e.preventDefault();
    closeModal("messageModal");
  });

  // --- Enlaces de cambio de modal (switch) ---
  document.querySelectorAll("[data-switch]").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const type = this.getAttribute("data-switch");
      switchModal(type);
    });
  });

  // --- Cerrar modal al hacer clic fuera ---
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("modal")) {
      closeModal(event.target.id);
    }
  });

  // --- Toggle password (delegación) ---
  document.addEventListener("click", function (e) {
    const toggleBtn = e.target.closest(".toggle-password");
    if (toggleBtn) {
      e.preventDefault();
      togglePasswordVisibility(toggleBtn);
    }
  });

  // --- Validación en tiempo real (delegación global, por si acaso) ---
  document.addEventListener("input", function (e) {
    const input = e.target;
    if (input.matches('.auth-input-group input[type="password"]')) {
      updatePasswordRequirements(input);
    }
  });

  // --- Mensajes de sesión desde atributos data ---
  const body = document.body;
  const message = body.getAttribute("data-message");
  const type = body.getAttribute("data-type");
  if (message && message.trim() !== "") {
    const title = type === "error" ? "Error" : "Éxito";
    showModalMessage(title, message);
  }

  // --- Inicializar Lucide ---
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // --- Inicializar requisitos de contraseña para inputs que ya están visibles ---
  document.querySelectorAll('.auth-input-group input[type="password"]').forEach((input) => {
    // Si el input está dentro de un modal visible, actualizar
    if (input.closest(".modal") && input.closest(".modal").style.display !== "none") {
      updatePasswordRequirements(input);
    }
  });
});
