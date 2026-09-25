// assets/js/modals.js

function injectModalStyles() {
  if (document.getElementById("custom-modal-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "custom-modal-styles";
  style.textContent = `
        .custom-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(8px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            visibility: hidden;
            opacity: 0;
            transition: visibility 0.2s, opacity 0.2s;
        }

        .custom-modal-overlay.active {
            visibility: visible;
            opacity: 1;
        }

        .custom-modal-container {
            background: rgba(16, 12, 26, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            border: 1px solid rgba(157, 78, 221, 0.15);
            box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.5);
            width: 90%;
            max-width: 420px;
            padding: 24px;
            transform: scale(0.95);
            transition: transform 0.2s;
        }

        .active .custom-modal-container {
            transform: scale(1);
        }

        .custom-modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 12px;
            color: #f0edf5;
            letter-spacing: -0.5px;
        }

        .custom-modal-message {
            font-size: 1rem;
            color: #9a8aa8;
            margin-bottom: 24px;
            line-height: 1.6;
        }

        .custom-modal-message strong {
            color: #f0edf5;
            font-weight: 700;
        }

        .custom-modal-buttons {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }

        .custom-modal-btn {
            padding: 8px 20px;
            border-radius: 40px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            background: rgba(255, 255, 255, 0.05);
            color: #f0edf5;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .custom-modal-btn:hover {
            background: rgba(255, 255, 255, 0.12);
            transform: translateY(-2px);
        }

        .custom-modal-btn.confirm {
            background: #9d4edd;
            color: white;
            box-shadow: 0 4px 20px rgba(157, 78, 221, 0.25);
        }

        .custom-modal-btn.confirm:hover {
            background: #b5179e;
            box-shadow: 0 8px 30px rgba(157, 78, 221, 0.35);
            transform: translateY(-2px);
        }

        .custom-modal-btn.cancel:hover {
            background: rgba(255, 255, 255, 0.15);
        }

        .custom-modal-btn.danger {
            background: #ff3b30;
        }

        .custom-modal-btn.danger:hover {
            background: #cc2f25;
        }

        .custom-modal-btn:active {
            transform: scale(0.96);
        }

        input.custom-modal-input {
            width: 100%;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 12px 16px;
            color: #f0edf5;
            margin-bottom: 20px;
            font-size: 0.95rem;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            transition: border-color 0.2s;
        }

        input.custom-modal-input:focus {
            outline: none;
            border-color: #9d4edd;
            box-shadow: 0 0 0 3px rgba(157, 78, 221, 0.08);
        }

        input.custom-modal-input::placeholder {
            color: #6a5a78;
        }

        .custom-modal-icon {
            display: flex;
            justify-content: center;
            margin-bottom: 16px;
        }

        .custom-modal-icon .icon-wrapper {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .custom-modal-icon .icon-wrapper.success {
            background: rgba(16, 185, 129, 0.1);
            border: 2px solid #10b981;
        }

        .custom-modal-icon .icon-wrapper.error {
            background: rgba(239, 68, 68, 0.1);
            border: 2px solid #ef4444;
        }

        .custom-modal-icon .icon-wrapper.warning {
            background: rgba(245, 158, 11, 0.1);
            border: 2px solid #f59e0b;
        }

        .custom-modal-icon .icon-wrapper.info {
            background: rgba(157, 78, 221, 0.1);
            border: 2px solid #9d4edd;
        }

        .custom-modal-icon svg {
            width: 32px;
            height: 32px;
        }

        .custom-modal-icon .success svg {
            color: #10b981;
        }

        .custom-modal-icon .error svg {
            color: #ef4444;
        }

        .custom-modal-icon .warning svg {
            color: #f59e0b;
        }

        .custom-modal-icon .info svg {
            color: #9d4edd;
        }
    `;

  document.head.appendChild(style);
}

function createModalElements() {
  if (document.getElementById("custom-modal-root")) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "custom-modal-root";
  overlay.className = "custom-modal-overlay";
  overlay.innerHTML = `
        <div class="custom-modal-container">
            <div id="customModalIcon"></div>
            <div class="custom-modal-title" id="customModalTitle">Confirmar</div>
            <div class="custom-modal-message" id="customModalMessage"></div>
            <div id="customModalDynamicContent"></div>
            <div class="custom-modal-buttons" id="customModalButtons"></div>
        </div>
    `;

  document.body.appendChild(overlay);
  injectModalStyles();
}

let currentResolve = null;

function closeModal() {
  const overlay = document.getElementById("custom-modal-root");

  if (overlay) {
    overlay.classList.remove("active");

    setTimeout(() => {
      if (currentResolve) {
        currentResolve(null);
        currentResolve = null;
      }
    }, 200);
  }
}

const ERROR_MESSAGES = {
  connection: "No se pudo conectar al servidor. Verifica tu conexion a internet.",
  file_too_large: "El archivo es demasiado grande. El tamaño maximo permitido es 10MB.",
  invalid_file: "Tipo de archivo no valido. Solo se permiten MP3, WAV y OGG.",
  no_songs: "No hay canciones en tu biblioteca. Importa alguna cancion primero.",
  not_friend: "Debes ser amigo de este usuario para realizar esta accion.",
  already_exists: "Ya existe un elemento con ese nombre. Elige otro nombre.",
  session_expired: "Tu sesion expiro. Inicia sesion nuevamente.",
  unauthorized: "No tienes permiso para realizar esta accion.",
  not_found: "El elemento que buscas no existe o fue eliminado.",
  playlist_empty: "Esta playlist no tiene canciones. Agrega algunas canciones primero.",
};

export function showAlert(message, title = "Aviso", type = "info") {
  return new Promise((resolve) => {
    let finalMessage = message;

    if (typeof message === "string" && ERROR_MESSAGES[message]) {
      finalMessage = ERROR_MESSAGES[message];
    }

    createModalElements();

    const overlay = document.getElementById("custom-modal-root");
    const titleEl = document.getElementById("customModalTitle");
    const msgEl = document.getElementById("customModalMessage");
    const buttonsDiv = document.getElementById("customModalButtons");
    const dynamicDiv = document.getElementById("customModalDynamicContent");
    const iconDiv = document.getElementById("customModalIcon");

    dynamicDiv.innerHTML = "";
    iconDiv.innerHTML = "";
    titleEl.innerText = title;
    msgEl.innerHTML = finalMessage;

    const iconMap = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    const colorMap = {
      success: "success",
      error: "error",
      warning: "warning",
      info: "info",
    };

    const icon = iconMap[type] || "ℹ️";
    const color = colorMap[type] || "info";

    iconDiv.innerHTML = `
            <div class="custom-modal-icon">
                <div class="icon-wrapper ${color}">
                    <span style="font-size: 28px; line-height: 1;">${icon}</span>
                </div>
            </div>
        `;

    buttonsDiv.innerHTML = `<button class="custom-modal-btn confirm" id="customAlertOk">Aceptar</button>`;

    const okBtn = document.getElementById("customAlertOk");
    const handler = () => {
      okBtn.removeEventListener("click", handler);
      closeModal();
      resolve();
    };

    okBtn.addEventListener("click", handler);
    overlay.classList.add("active");
  });
}

export function showConfirm(message, title = "Confirmar", confirmText = "Si", cancelText = "No", isDanger = false) {
  return new Promise((resolve) => {
    createModalElements();

    const overlay = document.getElementById("custom-modal-root");
    const titleEl = document.getElementById("customModalTitle");
    const msgEl = document.getElementById("customModalMessage");
    const buttonsDiv = document.getElementById("customModalButtons");
    const dynamicDiv = document.getElementById("customModalDynamicContent");
    const iconDiv = document.getElementById("customModalIcon");

    dynamicDiv.innerHTML = "";
    iconDiv.innerHTML = "";
    titleEl.innerText = title;
    msgEl.innerHTML = message;

    const confirmClass = isDanger ? "danger" : "confirm";

    buttonsDiv.innerHTML = `
            <button class="custom-modal-btn cancel" id="customConfirmCancel">${cancelText}</button>
            <button class="custom-modal-btn ${confirmClass}" id="customConfirmOk">${confirmText}</button>
        `;

    const okBtn = document.getElementById("customConfirmOk");
    const cancelBtn = document.getElementById("customConfirmCancel");

    const cleanup = () => {
      okBtn.removeEventListener("click", okHandler);
      cancelBtn.removeEventListener("click", cancelHandler);
      closeModal();
    };

    const okHandler = () => {
      cleanup();
      resolve(true);
    };

    const cancelHandler = () => {
      cleanup();
      resolve(false);
    };

    okBtn.addEventListener("click", okHandler);
    cancelBtn.addEventListener("click", cancelHandler);

    overlay.classList.add("active");
  });
}

export function showPrompt(message, defaultValue = "", title = "Ingrese un valor") {
  return new Promise((resolve) => {
    createModalElements();

    const overlay = document.getElementById("custom-modal-root");
    const titleEl = document.getElementById("customModalTitle");
    const msgEl = document.getElementById("customModalMessage");
    const buttonsDiv = document.getElementById("customModalButtons");
    const dynamicDiv = document.getElementById("customModalDynamicContent");
    const iconDiv = document.getElementById("customModalIcon");

    const escapedDefault = defaultValue.replace(/"/g, "&quot;");

    dynamicDiv.innerHTML = `
            <input type="text" id="customPromptInput" class="custom-modal-input" value="${escapedDefault}" placeholder="${message}">
        `;

    iconDiv.innerHTML = "";
    titleEl.innerText = title;
    msgEl.innerHTML = "";

    buttonsDiv.innerHTML = `
            <button class="custom-modal-btn cancel" id="customPromptCancel">Cancelar</button>
            <button class="custom-modal-btn confirm" id="customPromptOk">Aceptar</button>
        `;

    const input = document.getElementById("customPromptInput");
    const okBtn = document.getElementById("customPromptOk");
    const cancelBtn = document.getElementById("customPromptCancel");

    const cleanup = () => {
      okBtn.removeEventListener("click", okHandler);
      cancelBtn.removeEventListener("click", cancelHandler);
      closeModal();
    };

    const okHandler = () => {
      cleanup();
      resolve(input ? input.value : null);
    };

    const cancelHandler = () => {
      cleanup();
      resolve(null);
    };

    okBtn.addEventListener("click", okHandler);
    cancelBtn.addEventListener("click", cancelHandler);

    overlay.classList.add("active");

    if (input) {
      input.focus();
      input.select();
    }
  });
}

window.showAlert = showAlert;
window.showConfirm = showConfirm;
window.showPrompt = showPrompt;
