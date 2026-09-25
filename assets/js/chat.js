// js/chat.js
import DOM, { loadInitialData } from "./var.js";
import { renderAlbumCards } from "./ui.js";
import { renderPlaylistsSidebarLinks } from "./playlist.js";
import { procesarComandoIA } from "./ia.js";

function addChatMessage(sender, htmlText) {
  const msg = document.createElement("div");
  msg.className = sender === "bot" ? "msg-bot" : "msg-user";
  msg.innerHTML = htmlText;
  if (DOM.musikChat.contenedorMensajes) {
    DOM.musikChat.contenedorMensajes.appendChild(msg);
    DOM.musikChat.contenedorMensajes.scrollTop = DOM.musikChat.contenedorMensajes.scrollHeight;
  }
}

// Mensaje de bienvenida
const welcomeMessage = `
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
    <i data-lucide="sparkles" style="width: 20px; color: #ffcc00;"></i>
    <b style="font-size: 1.1rem;">musik</b>
    <span style="font-size: 0.7rem; background: #007aff20; padding: 2px 8px; border-radius: 20px;">IA activa</span>
  </div>
  <p>¡Hola! Soy <b>musik</b>, tu asistente musical. Esto es lo que puedo hacer por ti:</p>
  <ul style="margin: 8px 0 0 20px; line-height: 1.6;">
    <li>🎵 <b>Crear una playlist</b> – solo escribe <i>"Crea una playlist"</i> y te guiaré paso a paso.</li>
    <li>📀 <b>Crear un álbum</b> – escribe exactamente: <i>"Crea el álbum [título] de [artista]"</i><br>
        Ejemplo: <i>"Crea el álbum Thriller de Michael Jackson"</i></li>
    <li>⭐ <b>Ver mi artista favorito</b> – escribe <i>"¿Cuál es mi artista favorito?"</i></li>
    <li>🎧 <b>Recomendaciones</b> – escribe <i>"Recomiéndame canciones"</i></li>
    <li>📊 <b>Estadísticas</b> – escribe <i>"Estadísticas"</i></li>
    <li>➕ <b>Agregar canción a playlist</b> – <i>"Agrega 'Billie Jean' a mi playlist Favoritas"</i></li>
    <li>❌ <b>Eliminar playlist</b> – <i>"Elimina la playlist 'Rock'"</i></li>
    <li>📎 <b>Subir archivos</b> – adjunta una imagen o audio junto con tu mensaje.</li>
  </ul>
  <p style="margin-top: 10px;">✍️ Escribe <b>"ayuda"</b> para volver a ver esta lista.</p>
`;

// Inyectar bienvenida si el chat está vacío
if (DOM.musikChat.contenedorMensajes && DOM.musikChat.contenedorMensajes.children.length === 0) {
  addChatMessage("bot", welcomeMessage);
  if (window.lucide) window.lucide.createIcons();
}

// Función para refrescar la interfaz después de cambios realizados por la IA
async function refreshAfterAIChanges() {
  await loadInitialData(); // Recargar datos globales desde la API
  renderPlaylistsSidebarLinks(); // Actualizar lista de playlists en sidebar
  renderAlbumCards(); // Actualizar galería de álbumes
  if (window.lucide) window.lucide.createIcons();
}

export async function triggerChatAction() {
  let text = DOM.musikChat.input?.value.trim();
  const fileInput = DOM.musikChat.fileInput;
  let file = fileInput?.files[0];

  if (!text && !file) return;

  let userMsg = text || "📎 Archivo adjunto";
  if (file) userMsg += ` <span style="font-size:0.7rem;">📎 ${file.name}</span>`;
  addChatMessage("user", userMsg);

  DOM.musikChat.input.value = "";
  const fileToProcess = file;
  if (fileInput) fileInput.value = "";

  const typingMsg = document.createElement("div");
  typingMsg.className = "msg-bot";
  typingMsg.innerHTML = "🎧 Pensando...";
  DOM.musikChat.contenedorMensajes.appendChild(typingMsg);
  DOM.musikChat.contenedorMensajes.scrollTop = DOM.musikChat.contenedorMensajes.scrollHeight;

  // Llamar a la IA con el callback que refresca la UI
  const replyText = await procesarComandoIA(text || "", fileToProcess, refreshAfterAIChanges);

  typingMsg.remove();
  addChatMessage("bot", replyText);
}

// Manejo de importación de archivos locales
export function handleLocalFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (DOM.musikChat.input) DOM.musikChat.input.value = "";
  triggerChatAction();
}
