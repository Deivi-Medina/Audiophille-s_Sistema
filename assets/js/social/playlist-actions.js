// assets/js/social/playlist-actions.js
import { state, loadInitialData } from "../var.js";
import { renderAlbumCards, renderPlaylistDetailView } from "../ui.js";
import { renderPlaylistsSidebarLinks } from "../playlist.js";
import { showAlert, showConfirm } from "../modals.js";
import { addPlaylistToLibraryAPI, mergePlaylistsAPI, checkFriendsAPI, checkMergedPlaylistAPI } from "../services/socialService.js";

/**
 * Refresca toda la interfaz después de cambios
 */
async function refreshAllUI() {
  try {
    await loadInitialData();
    renderPlaylistsSidebarLinks();
    renderAlbumCards();
    if (state.activePlaylistName) {
      renderPlaylistDetailView(state.activePlaylistName);
    }
    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    console.warn("Error al refrescar UI:", e);
  }
}

/**
 * Añade una playlist de otro usuario a la biblioteca del usuario actual
 */
export async function addPlaylistToLibrary(playlistId, playlistName) {
  try {
    const data = await addPlaylistToLibraryAPI(playlistId);
    if (data.success) {
      await showAlert(
        `<strong>✅ Playlist añadida!</strong><br><br>La playlist "<strong>${data.nombre}</strong>" se ha añadido a tu biblioteca.`,
        "Éxito",
      );
      await refreshAllUI();
      return true;
    } else {
      await showAlert(`❌ ${data.message}`, "Error");
      return false;
    }
  } catch (error) {
    console.error("Error al añadir playlist:", error);
    await showAlert("❌ Error de conexión al añadir la playlist", "Error");
    return false;
  }
}

/**
 * Fusiona playlists con un amigo
 * Maneja 3 casos:
 * 1. Ambos tienen datos → playlist normal con algoritmo
 * 2. Uno tiene datos, otro no → playlist con advertencia
 * 3. Ambos son nuevos → error educativo
 */
export async function mergePlaylistsWithFriend(friendId, friendName) {
  try {
    // 1. Verificar si ya existe una playlist fusionada con este amigo
    const checkData = await checkMergedPlaylistAPI(friendId);
    if (checkData.success && checkData.exists) {
      await showAlert(
        `⚠️ Ya tienes una playlist fusionada con "${friendName}".<br><br>Puedes editarla desde tu biblioteca.`,
        "Playlist existente",
      );
      return false;
    }

    // 2. Confirmar con el usuario
    const confirm = await showConfirm(
      `¿Quieres fusionar tus playlists con las de "<strong>${friendName}</strong>"?<br><br>Se creará una playlist combinando las mejores canciones de ambos.`,
      "Fusionar Playlists",
      "Sí, fusionar",
      "Cancelar",
      false,
    );

    if (!confirm) return false;

    // 3. Ejecutar la fusión
    const data = await mergePlaylistsAPI(friendId);

    // ============================================================
    // 🔥 CASO 1: AMBOS SON NUEVOS → NO PERMITIR
    // ============================================================
    if (!data.success && data.code === "NO_DATA") {
      await showAlert(
        `❌ <strong>No se puede fusionar playlists</strong><br><br>
        ${data.message}<br><br>
        💡 <strong>¿Qué pueden hacer?</strong><br>
        1. 📀 Explorar la biblioteca y escuchar canciones<br>
        2. ⭐ Calificar las que les gusten<br>
        3. 📝 Escribir reseñas en el Diario<br><br>
        🎵 ¡Vuelvan a intentarlo cuando tengan actividad!`,
        "Sin datos suficientes",
      );
      return false;
    }

    // ============================================================
    // 🔥 CASO 2: UNO ES NUEVO → PERMITIR CON ADVERTENCIA
    // ============================================================
    if (data.success && data.warning) {
      const usuarioSinDatos = data.copied_from_friend ? "el otro usuario" : "uno de los usuarios";

      await showAlert(
        `⚠️ <strong>Playlist creada con advertencia</strong><br><br>
        "<strong>${data.nombre}</strong>"<br>
        Contiene <strong>${data.total_canciones}</strong> canciones.<br><br>
        ${usuarioSinDatos} aún no tiene actividad musical.<br>
        La playlist está basada en los gustos del otro usuario.<br><br>
        💡 ¡Escuchen y califiquen para personalizarla!`,
        "Playlist creada",
      );
      await refreshAllUI();
      return true;
    }

    // ============================================================
    // ✅ CASO 3: AMBOS TIENEN DATOS → ÉXITO NORMAL
    // ============================================================
    if (data.success) {
      let mensaje = `<strong>✅ Playlist fusionada creada exitosamente!</strong><br><br>`;
      mensaje += `"<strong>${data.nombre}</strong>"<br>`;
      mensaje += `Contiene <strong>${data.total_canciones}</strong> canciones.`;

      if (data.copied_from_friend) {
        mensaje += `<br><br>📌 Esta playlist ya existía en la biblioteca de ${friendName}, se ha copiado a tu biblioteca.`;
      }

      await showAlert(mensaje, "¡Fusión exitosa!");
      await refreshAllUI();
      return true;
    }

    // ============================================================
    // ❌ ERROR GENÉRICO
    // ============================================================
    await showAlert(`❌ ${data.message || "Error desconocido"}`, "Error");
    return false;
  } catch (error) {
    console.error("Error al fusionar playlists:", error);
    await showAlert("❌ Error de conexión al fusionar playlists", "Error");
    return false;
  }
}

/**
 * Verifica si dos usuarios son amigos mutuos
 */
export async function checkAreFriends(userId) {
  try {
    const data = await checkFriendsAPI(userId);
    return data.success && data.are_friends;
  } catch (error) {
    console.error("Error verificando amistad:", error);
    return false;
  }
}
