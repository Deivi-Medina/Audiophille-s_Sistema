// js/app.js
import DOM, { state, loadInitialData, saveEqToAPI } from "./var.js";
import {
  bindAudioEvents,
  updateEqualizerNodeValues,
  togglePlayPause,
  playNextTrack,
  playPrevTrack,
  toggleShuffle,
  toggleRepeat,
  toggleFavoriteStatus,
  audio,
  queue,
  queueIndex,
} from "./audio.js";
import {
  renderAlbumCards,
  openAlbumView,
  closeAlbumView,
  renderFavoritesDetailView,
  renderPlaylistDetailView,
  addContextSongToQueue,
  addContextSongToSpecificPlaylist,
} from "./ui.js";
import { renderPlaylistsSidebarLinks, openPlaylistModal, closePlaylistModal, createPlaylistAction } from "./playlist.js";
import {
  openEditAlbumModal,
  closeEditAlbumModal,
  confirmEditAlbumChanges,
  handleEditAlbumAddLocalSong,
  deleteActiveAlbum,
} from "./album-crud.js";
import { triggerChatAction, handleLocalFileImport } from "./chat.js";
import { initKeyboardControls } from "./keyboard.js";
import { loadReviewsFromAPI, initReviewsSystem, updateDiarySongsSelector, renderIntegratedDiaryFeed } from "./reviews.js";
import { showSection } from "./navigation.js";
import { initGameDOM, startGame, stopGame, nextRound } from "./game.js";
import { openArtistProfile } from "./artists.js";

// Inicialización asíncrona
async function initApp() {
  const loader = document.createElement("div");
  loader.id = "app-loader";
  loader.textContent = "Cargando tu biblioteca musical...";
  loader.style.cssText =
    "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(0,0,0,0.8); color:white; padding:1rem 2rem; border-radius:30px; z-index:10000; backdrop-filter:blur(10px);";
  document.body.appendChild(loader);

  const success = await loadInitialData();
  if (!success) {
    alert("Error al cargar los datos. Intenta recargar la página.");
    loader.remove();
    return;
  }
  loader.remove();

  renderPlaylistsSidebarLinks();
  renderAlbumCards();
  bindAudioEvents();
  initKeyboardControls();
  initGameDOM();

  // Listeners de navegación
  if (DOM.sidebar.navHome) DOM.sidebar.navHome.addEventListener("click", () => showSection("home"));
  if (DOM.sidebar.navFavorites) DOM.sidebar.navFavorites.addEventListener("click", () => showSection("favorites"));
  if (DOM.sidebar.navDiary) DOM.sidebar.navDiary.addEventListener("click", () => showSection("diary"));

  // -------------------- CORRECCIÓN DEL JUEGO --------------------
  if (DOM.sidebar.navGame) {
    DOM.sidebar.navGame.addEventListener("click", () => {
      console.log("🎮 Click en Juego");
      showSection("game");
      // Esperamos a que el DOM del juego esté visible antes de iniciarlo
      setTimeout(() => {
        if (typeof startGame === "function") {
          console.log("🟢 Iniciando juego...");
          startGame();
        } else {
          console.warn("⚠️ startGame no está definida");
        }
      }, 100);
    });
  }
  // -------------------------------------------------------------

  if (DOM.sidebar.navProfile) {
    DOM.sidebar.navProfile.addEventListener("click", () => {
      showSection("profile");
      setTimeout(() => {
        if (typeof window.loadProfileData === "function") {
          window.loadProfileData();
        }
      }, 100);
    });
  }
  if (DOM.sidebar.btnCreatePlaylist) DOM.sidebar.btnCreatePlaylist.addEventListener("click", openPlaylistModal);
  if (DOM.modal.btnClose) DOM.modal.btnClose.addEventListener("click", closePlaylistModal);
  if (DOM.modal.btnCancel) DOM.modal.btnCancel.addEventListener("click", closePlaylistModal);
  if (DOM.modal.btnConfirm) DOM.modal.btnConfirm.addEventListener("click", createPlaylistAction);

  document.addEventListener("click", () => DOM.contextMenu.container?.classList.add("hidden"));
  if (DOM.contextMenu.container) {
    DOM.contextMenu.container.addEventListener("click", (e) => {
      const target = e.target.closest(".context-option");
      if (!target) return;
      if (target.id === "ctxAddToQueue") addContextSongToQueue();
      else if (target.dataset.playlistName) addContextSongToSpecificPlaylist(target.dataset.playlistName);
      DOM.contextMenu.container.classList.add("hidden");
    });
  }

  // Controles de audio
  if (DOM.audioControls.volSlider) DOM.audioControls.volSlider.addEventListener("input", (e) => (audio.volume = e.target.value / 100));
  if (DOM.audioControls.btnPlay) DOM.audioControls.btnPlay.addEventListener("click", togglePlayPause);
  if (DOM.miniPlayer.btnPlay) DOM.miniPlayer.btnPlay.addEventListener("click", togglePlayPause);
  if (DOM.audioControls.btnNext) DOM.audioControls.btnNext.addEventListener("click", playNextTrack);
  if (DOM.audioControls.btnPrev) DOM.audioControls.btnPrev.addEventListener("click", playPrevTrack);
  if (DOM.audioControls.btnShuffle) DOM.audioControls.btnShuffle.addEventListener("click", toggleShuffle);
  if (DOM.audioControls.btnRepeat) DOM.audioControls.btnRepeat.addEventListener("click", toggleRepeat);
  if (DOM.fullPlayer.btnFavorite) DOM.fullPlayer.btnFavorite.addEventListener("click", toggleFavoriteStatus);

  if (DOM.audioControls.scrubber)
    DOM.audioControls.scrubber.addEventListener("input", (e) => {
      if (audio.duration) audio.currentTime = (e.target.value / 100) * audio.duration;
    });
  if (DOM.views.searchBar) DOM.views.searchBar.addEventListener("input", (e) => renderAlbumCards(e.target.value));

  window.expandFullPlayer = () => {
    if (DOM.fullPlayer.container) DOM.fullPlayer.container.classList.remove("hidden");
    if (DOM.sidebar.navDiary) DOM.sidebar.navDiary.classList.add("hidden");
  };
  window.minimizeFullPlayer = () => {
    if (DOM.fullPlayer.container) DOM.fullPlayer.container.classList.add("hidden");
    if (DOM.sidebar.navDiary) DOM.sidebar.navDiary.classList.remove("hidden");
  };

  // Ecualizador
  if (DOM.equalizer.btnToggle && DOM.equalizer.sidebar) {
    DOM.equalizer.btnToggle.addEventListener("click", () => {
      DOM.equalizer.sidebar.classList.toggle("collapsed");
      if (!DOM.equalizer.sidebar.classList.contains("collapsed")) {
        if (DOM.queue.sidebar) DOM.queue.sidebar.classList.add("collapsed");
        if (DOM.extra.reviewsSidebar) DOM.extra.reviewsSidebar?.classList.add("collapsed");
      }
    });
  }
  if (DOM.queue.btnToggle && DOM.queue.sidebar) {
    DOM.queue.btnToggle.addEventListener("click", () => {
      DOM.queue.sidebar.classList.toggle("collapsed");
      if (!DOM.queue.sidebar.classList.contains("collapsed") && DOM.equalizer.sidebar) {
        DOM.equalizer.sidebar.classList.add("collapsed");
        if (DOM.extra.reviewsSidebar) DOM.extra.reviewsSidebar?.classList.add("collapsed");
      }
    });
  }
  if (DOM.equalizer.bassSlider) DOM.equalizer.bassSlider.addEventListener("input", updateEqualizerNodeValues);
  if (DOM.equalizer.vocalsSlider) DOM.equalizer.vocalsSlider.addEventListener("input", updateEqualizerNodeValues);
  if (DOM.equalizer.trebleSlider) DOM.equalizer.trebleSlider.addEventListener("input", updateEqualizerNodeValues);
  if (DOM.equalizer.btnReset) {
    DOM.equalizer.btnReset.addEventListener("click", () => {
      if (DOM.equalizer.bassSlider) DOM.equalizer.bassSlider.value = 0;
      if (DOM.equalizer.vocalsSlider) DOM.equalizer.vocalsSlider.value = 0;
      if (DOM.equalizer.trebleSlider) DOM.equalizer.trebleSlider.value = 0;
      updateEqualizerNodeValues();
      saveEqToAPI(0, 0, 0);
    });
  }

  // Asistente musik
  if (DOM.musikWidget.btnTrigger && DOM.musikWidget.chatWindow) {
    DOM.musikWidget.btnTrigger.addEventListener("click", () => DOM.musikWidget.chatWindow.classList.toggle("musik-hidden"));
  }
  if (DOM.musikWidget.btnMinimize && DOM.musikWidget.chatWindow) {
    DOM.musikWidget.btnMinimize.addEventListener("click", () => DOM.musikWidget.chatWindow.classList.add("musik-hidden"));
  }
  if (DOM.musikWidget.btnExpand && DOM.musikWidget.chatWindow) {
    DOM.musikWidget.btnExpand.addEventListener("click", () => {
      DOM.musikWidget.chatWindow.classList.toggle("expanded");
      const expanded = DOM.musikWidget.chatWindow.classList.contains("expanded");
      DOM.musikWidget.btnExpand.innerHTML = expanded ? `<i data-lucide="minimize-2"></i>` : `<i data-lucide="maximize-2"></i>`;
      if (window.lucide) window.lucide.createIcons();
    });
  }
  if (DOM.musikChat.btnSend) DOM.musikChat.btnSend.addEventListener("click", triggerChatAction);
  if (DOM.musikChat.input)
    DOM.musikChat.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") triggerChatAction();
    });
  if (DOM.musikChat.btnImport) DOM.musikChat.btnImport.addEventListener("click", () => DOM.musikChat.fileInput?.click());
  if (DOM.musikChat.fileInput) DOM.musikChat.fileInput.addEventListener("change", handleLocalFileImport);

  // Edición de álbumes
  if (DOM.albumActions.btnEdit) DOM.albumActions.btnEdit.addEventListener("click", openEditAlbumModal);
  if (DOM.albumActions.btnDelete) DOM.albumActions.btnDelete.addEventListener("click", deleteActiveAlbum);
  if (DOM.editAlbumModal.btnClose) DOM.editAlbumModal.btnClose.addEventListener("click", closeEditAlbumModal);
  if (DOM.editAlbumModal.btnCancel) DOM.editAlbumModal.btnCancel.addEventListener("click", closeEditAlbumModal);
  if (DOM.editAlbumModal.btnConfirm) DOM.editAlbumModal.btnConfirm.addEventListener("click", confirmEditAlbumChanges);
  if (DOM.editAlbumModal.btnUploadCover && DOM.editAlbumModal.coverFileInput) {
    DOM.editAlbumModal.btnUploadCover.addEventListener("click", () => DOM.editAlbumModal.coverFileInput.click());
  }
  if (DOM.editAlbumModal.btnAddSong && DOM.editAlbumModal.addSongFileInput) {
    DOM.editAlbumModal.btnAddSong.addEventListener("click", () => DOM.editAlbumModal.addSongFileInput.click());
    DOM.editAlbumModal.addSongFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleEditAlbumAddLocalSong(file);
    });
  }

  window.openAlbumView = openAlbumView;
  window.closeAlbumView = closeAlbumView;
  window.renderPlaylistsSidebarLinks = renderPlaylistsSidebarLinks;
  window.renderAlbumCards = renderAlbumCards;
  window.nextRound = nextRound;
  window.openArtistProfile = openArtistProfile;

  initReviewsSystem(
    () => (queue.length ? queue[queueIndex] : null),
    () => {
      const all = [];
      const albums = window.albumsFromDB || [];
      albums.forEach((album) => {
        if (album.songs) {
          album.songs.forEach((song) => {
            all.push({
              trackTitle: song.trackTitle,
              artistName: song.artistName || album.artist,
              albumCover: song.albumCover || album.cover,
              id_cancion: song.id_cancion,
            });
          });
        }
      });
      if (state.importedSongs) {
        state.importedSongs.forEach((song) => {
          all.push({
            trackTitle: song.trackTitle,
            artistName: song.artistName || "Importado",
            albumCover: song.albumCover || "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=500",
            id_cancion: song.id_cancion,
          });
        });
      }
      return all;
    },
  );
  if (window.lucide) window.lucide.createIcons();
}

// ================== FUNCIONES DE PERFIL ==================
window.loadProfileData = async function loadProfileData() {
  console.log("🔄 loadProfileData ejecutándose...");

  let tries = 0;
  while (!document.getElementById("statProfileAvgRating") && tries < 20) {
    await new Promise((r) => setTimeout(r, 100));
    tries++;
  }

  const avgElement = document.getElementById("statProfileAvgRating");
  if (!avgElement) {
    console.error("❌ No se encontró #statProfileAvgRating");
    return;
  }

  try {
    const profileRes = await fetch(`${window.baseUrl}api.php?action=get_user_profile`);
    const profile = await profileRes.json();
    if (profile.success) {
      document.getElementById("profileName").innerText = profile.user.nombre_usuario;
      document.getElementById("profileEmail").innerText = profile.user.email;
      const avatar = document.getElementById("profileAvatar");
      if (profile.user.avatar) {
        let avatarPath = profile.user.avatar;
        if (avatarPath.startsWith("/")) avatarPath = avatarPath.substring(1);
        let base = window.baseUrl.endsWith("/") ? window.baseUrl : window.baseUrl + "/";
        avatar.src = base + avatarPath + "?v=" + Date.now();
      } else {
        avatar.src = `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${encodeURIComponent(profile.user.nombre_usuario)}`;
      }
    }

    const statsRes = await fetch(`${window.baseUrl}api.php?action=get_user_stats`);
    const stats = await statsRes.json();
    console.log("📊 Estadísticas recibidas:", stats);

    if (stats.success) {
      document.getElementById("statProfileReviews").innerText = stats.total_reviews;
      document.getElementById("statProfileFavorites").innerText = stats.total_favorites;
      document.getElementById("statProfilePlaylists").innerText = stats.total_playlists;
      document.getElementById("statProfileImported").innerText = stats.total_imported;
      avgElement.innerText = stats.avg_rating + " ★";
      console.log(`✅ Calificación media actualizada a: ${stats.avg_rating} ★`);
    } else {
      console.error("Error en estadísticas:", stats.message);
    }
  } catch (err) {
    console.error("Error cargando perfil:", err);
  }
};

// Configurar eventos del modal de edición de perfil
function setupProfileEvents() {
  const editBtn = document.getElementById("editProfileBtn");
  const modal = document.getElementById("editProfileModal");
  const closeBtn = document.getElementById("closeEditProfileModal");
  const cancelBtn = document.getElementById("cancelProfileModalBtn");
  const saveBtn = document.getElementById("saveProfileModalBtn");

  if (!editBtn || !modal) {
    console.warn("Elementos del perfil no encontrados aún");
    return;
  }

  editBtn.addEventListener("click", async () => {
    const profileRes = await fetch(`${window.baseUrl}api.php?action=get_user_profile`);
    const profile = await profileRes.json();
    if (profile.success) {
      document.getElementById("modalEditUsername").value = profile.user.nombre_usuario;
      document.getElementById("modalEditEmail").value = profile.user.email;
      document.getElementById("modalEditPassword").value = "";
      document.getElementById("modalEditAvatar").value = "";
    }
    modal.classList.remove("hidden");
  });

  const closeModal = () => modal.classList.add("hidden");
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  saveBtn.addEventListener("click", async () => {
    const formData = new FormData();
    formData.append("action", "update_user_profile");
    formData.append("username", document.getElementById("modalEditUsername").value);
    formData.append("email", document.getElementById("modalEditEmail").value);
    const password = document.getElementById("modalEditPassword").value;
    if (password) formData.append("password", password);
    const avatarFile = document.getElementById("modalEditAvatar").files[0];
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      const res = await fetch(`${window.baseUrl}api.php`, { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        alert("Perfil actualizado correctamente");
        closeModal();
        window.loadProfileData();
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) {
      alert("Error de conexión");
    }
  });
}

// Arrancar la app
document.addEventListener("DOMContentLoaded", () => {
  setupProfileEvents();
  initApp();
});
