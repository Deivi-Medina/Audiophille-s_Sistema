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
  renderProfileAlbums,
  addContextSongToQueue,
  addContextSongToSpecificPlaylist,
  initMobileSidebar,
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
import { initCommunityTabs } from "./community.js";
import { openPublicProfile } from "./social/profiles.js";
import { getUserProfile, getUserStats, updateUserProfile } from "./services/userService.js";
import { initAchievements, addXpForAction } from "./achievements.js";
import { initTheme } from "./theme.js";
import { initSettings, openSettings, closeSettings } from "./settings.js";
import { isCrossfadeEnabled, setCrossfadeEnabled } from "./crossfade.js";
import { showAlert } from "./modals.js";
import { initExplore } from "./explore.js";

window.isScrubbing = false;

async function initApp() {
  const loader = document.createElement("div");
  loader.id = "app-loader";
  loader.textContent = "Cargando tu biblioteca musical...";
  loader.style.cssText =
    "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:rgba(0,0,0,0.8); color:white; padding:1rem 2rem; border-radius:30px; z-index:10000; backdrop-filter:blur(10px);";
  document.body.appendChild(loader);

  const success = await loadInitialData();
  if (!success) {
    await showAlert("Error al cargar los datos. Intenta recargar la página.", "Error");
    loader.remove();
    return;
  }
  loader.remove();

  renderPlaylistsSidebarLinks();
  renderAlbumCards();
  bindAudioEvents();
  initKeyboardControls();
  initGameDOM();
  initMobileSidebar();
  await initAchievements();
  initTheme();
  initSettings();
  initExplore();

  // Navegación del sidebar
  if (DOM.sidebar.navHome) {
    DOM.sidebar.navHome.addEventListener("click", () => showSection("home"));
  }
  if (DOM.sidebar.navFavorites) {
    DOM.sidebar.navFavorites.addEventListener("click", () => showSection("favorites"));
  }
  if (DOM.sidebar.navDiary) {
    DOM.sidebar.navDiary.addEventListener("click", () => showSection("diary"));
  }
  if (DOM.sidebar.navGame) {
    DOM.sidebar.navGame.addEventListener("click", () => {
      showSection("game");
      setTimeout(() => {
        if (typeof startGame === "function") startGame();
      }, 100);
    });
  }
  if (DOM.sidebar.navExplore) {
    DOM.sidebar.navExplore.addEventListener("click", () => showSection("explore"));
  }
  if (DOM.sidebar.navCommunity) {
    DOM.sidebar.navCommunity.addEventListener("click", () => showSection("community"));
  }

  // Botón de perfil en el header
  if (DOM.header && DOM.header.profileBtn) {
    DOM.header.profileBtn.addEventListener("click", () => showSection("profile"));
  }

  // Botón de ajustes en el sidebar
  const settingsSidebarBtn = document.getElementById("btnSettingsSidebar");
  if (settingsSidebarBtn) {
    settingsSidebarBtn.addEventListener("click", () => {
      if (typeof openSettings === "function") openSettings();
    });
  }

  // Modal de creación de playlist
  if (DOM.sidebar.btnCreatePlaylist) {
    DOM.sidebar.btnCreatePlaylist.addEventListener("click", openPlaylistModal);
  }
  if (DOM.modal.btnClose) {
    DOM.modal.btnClose.addEventListener("click", closePlaylistModal);
  }
  if (DOM.modal.btnCancel) {
    DOM.modal.btnCancel.addEventListener("click", closePlaylistModal);
  }
  if (DOM.modal.btnConfirm) {
    DOM.modal.btnConfirm.addEventListener("click", createPlaylistAction);
  }

  // Menú contextual
  document.addEventListener("click", () => {
    if (DOM.contextMenu.container) DOM.contextMenu.container.classList.add("hidden");
  });
  if (DOM.contextMenu.container) {
    DOM.contextMenu.container.addEventListener("click", (e) => {
      const target = e.target.closest(".context-option");
      if (!target) return;
      if (target.id === "ctxAddToQueue") {
        addContextSongToQueue();
      } else if (target.dataset.playlistName) {
        addContextSongToSpecificPlaylist(target.dataset.playlistName);
      }
      DOM.contextMenu.container.classList.add("hidden");
    });
  }

  // Controles de audio (volumen, play, siguiente, anterior, shuffle, repeat, favorito)
  if (DOM.audioControls.volSlider) {
    DOM.audioControls.volSlider.addEventListener("input", (e) => {
      audio.volume = e.target.value / 100;
    });
  }
  if (DOM.audioControls.btnPlay) {
    DOM.audioControls.btnPlay.addEventListener("click", togglePlayPause);
  }
  if (DOM.miniPlayer.btnPlay) {
    DOM.miniPlayer.btnPlay.addEventListener("click", togglePlayPause);
  }
  if (DOM.audioControls.btnNext) {
    DOM.audioControls.btnNext.addEventListener("click", playNextTrack);
  }
  if (DOM.audioControls.btnPrev) {
    DOM.audioControls.btnPrev.addEventListener("click", playPrevTrack);
  }
  if (DOM.audioControls.btnShuffle) {
    DOM.audioControls.btnShuffle.addEventListener("click", toggleShuffle);
  }
  if (DOM.audioControls.btnRepeat) {
    DOM.audioControls.btnRepeat.addEventListener("click", toggleRepeat);
  }
  if (DOM.fullPlayer.btnFavorite) {
    DOM.fullPlayer.btnFavorite.addEventListener("click", toggleFavoriteStatus);
  }

  // Crossfade (opcional)
  const crossfadeBtn = document.getElementById("btnCrossfade");
  if (crossfadeBtn) {
    const updateCrossfadeButton = () => {
      const enabled = isCrossfadeEnabled();
      crossfadeBtn.classList.toggle("active", enabled);
    };

    crossfadeBtn.addEventListener("click", () => {
      const newState = !isCrossfadeEnabled();
      setCrossfadeEnabled(newState);
      updateCrossfadeButton();

      const settingsToggle = document.getElementById("settingsCrossfadeToggle");
      if (settingsToggle) {
        settingsToggle.checked = newState;
      }
    });

    updateCrossfadeButton();
  }

  // Botón de ajustes (settings)
  const settingsBtn = document.getElementById("btnSettings");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      if (typeof openSettings === "function") openSettings();
    });
  }

  // NOTA: El scrubber (barra de progreso) ahora se maneja completamente en audio.js
  // para que funcione tanto con MP3 como con YouTube, incluso en pausa.
  // NO agregar listener del scrubber aquí para evitar conflictos.

  // Buscador global
  if (DOM.views.searchBar) {
    DOM.views.searchBar.addEventListener("input", (e) => {
      renderAlbumCards(e.target.value);
    });
  }

  // Expansión / minimización del reproductor completo
  window.expandFullPlayer = () => {
    if (DOM.fullPlayer.container) {
      DOM.fullPlayer.container.classList.remove("hidden");
    }
    if (DOM.sidebar.navDiary) {
      DOM.sidebar.navDiary.classList.add("hidden");
    }
  };
  window.minimizeFullPlayer = () => {
    if (DOM.fullPlayer.container) {
      DOM.fullPlayer.container.classList.add("hidden");
    }
    if (DOM.sidebar.navDiary) {
      DOM.sidebar.navDiary.classList.remove("hidden");
    }
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
  if (DOM.equalizer.bassSlider) {
    DOM.equalizer.bassSlider.addEventListener("input", updateEqualizerNodeValues);
  }
  if (DOM.equalizer.vocalsSlider) {
    DOM.equalizer.vocalsSlider.addEventListener("input", updateEqualizerNodeValues);
  }
  if (DOM.equalizer.trebleSlider) {
    DOM.equalizer.trebleSlider.addEventListener("input", updateEqualizerNodeValues);
  }
  if (DOM.equalizer.btnReset) {
    DOM.equalizer.btnReset.addEventListener("click", () => {
      if (DOM.equalizer.bassSlider) DOM.equalizer.bassSlider.value = 0;
      if (DOM.equalizer.vocalsSlider) DOM.equalizer.vocalsSlider.value = 0;
      if (DOM.equalizer.trebleSlider) DOM.equalizer.trebleSlider.value = 0;
      updateEqualizerNodeValues();
      saveEqToAPI(0, 0, 0);
    });
  }

  // Asistente musik (chat)
  if (DOM.musikWidget.btnTrigger && DOM.musikWidget.chatWindow) {
    DOM.musikWidget.btnTrigger.addEventListener("click", () => {
      DOM.musikWidget.chatWindow.classList.toggle("musik-hidden");
    });
  }
  if (DOM.musikWidget.btnMinimize && DOM.musikWidget.chatWindow) {
    DOM.musikWidget.btnMinimize.addEventListener("click", () => {
      DOM.musikWidget.chatWindow.classList.add("musik-hidden");
    });
  }
  if (DOM.musikWidget.btnExpand && DOM.musikWidget.chatWindow) {
    DOM.musikWidget.btnExpand.addEventListener("click", () => {
      DOM.musikWidget.chatWindow.classList.toggle("expanded");
      const expanded = DOM.musikWidget.chatWindow.classList.contains("expanded");
      DOM.musikWidget.btnExpand.innerHTML = expanded ? '<i data-lucide="minimize-2"></i>' : '<i data-lucide="maximize-2"></i>';
      if (window.lucide) window.lucide.createIcons();
    });
  }
  if (DOM.musikChat.btnSend) {
    DOM.musikChat.btnSend.addEventListener("click", triggerChatAction);
  }
  if (DOM.musikChat.input) {
    DOM.musikChat.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") triggerChatAction();
    });
  }
  if (DOM.musikChat.btnImport) {
    DOM.musikChat.btnImport.addEventListener("click", () => {
      if (DOM.musikChat.fileInput) DOM.musikChat.fileInput.click();
    });
  }
  if (DOM.musikChat.fileInput) {
    DOM.musikChat.fileInput.addEventListener("change", handleLocalFileImport);
  }

  // Acciones de álbum (editar, eliminar)
  if (DOM.albumActions.btnEdit) {
    DOM.albumActions.btnEdit.addEventListener("click", openEditAlbumModal);
  }
  if (DOM.albumActions.btnDelete) {
    DOM.albumActions.btnDelete.addEventListener("click", deleteActiveAlbum);
  }
  if (DOM.editAlbumModal.btnClose) {
    DOM.editAlbumModal.btnClose.addEventListener("click", closeEditAlbumModal);
  }
  if (DOM.editAlbumModal.btnCancel) {
    DOM.editAlbumModal.btnCancel.addEventListener("click", closeEditAlbumModal);
  }
  if (DOM.editAlbumModal.btnConfirm) {
    DOM.editAlbumModal.btnConfirm.addEventListener("click", confirmEditAlbumChanges);
  }
  if (DOM.editAlbumModal.btnUploadCover && DOM.editAlbumModal.coverFileInput) {
    DOM.editAlbumModal.btnUploadCover.addEventListener("click", () => {
      DOM.editAlbumModal.coverFileInput.click();
    });
  }
  if (DOM.editAlbumModal.btnAddSong && DOM.editAlbumModal.addSongFileInput) {
    DOM.editAlbumModal.btnAddSong.addEventListener("click", () => {
      DOM.editAlbumModal.addSongFileInput.click();
    });
    DOM.editAlbumModal.addSongFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleEditAlbumAddLocalSong(file);
    });
  }

  // Exponer funciones globales
  window.openAlbumView = openAlbumView;
  window.closeAlbumView = closeAlbumView;
  window.renderPlaylistsSidebarLinks = renderPlaylistsSidebarLinks;
  window.renderAlbumCards = renderAlbumCards;
  window.nextRound = nextRound;
  window.openArtistProfile = openArtistProfile;
  window.openSettings = openSettings;
  window.closeSettings = closeSettings;

  // Inicializar sistema de reseñas
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

  // Inicializar pestañas de comunidad
  initCommunityTabs();

  // Recargar iconos de Lucide
  if (window.lucide) window.lucide.createIcons();

  console.log("Audiophille inicializado correctamente");
}

// ============================================================
// CARGAR DATOS DEL PERFIL (con álbumes del usuario)
// ============================================================
window.loadProfileData = async function loadProfileData() {
  const avgElement = document.getElementById("statProfileAvgRating");
  if (!avgElement) {
    console.error("No se encontró #statProfileAvgRating");
    return;
  }

  try {
    const profile = await getUserProfile();
    if (profile.success) {
      document.getElementById("profileName").innerText = profile.user.nombre_usuario;
      document.getElementById("profileEmail").innerText = profile.user.email;
      const avatar = document.getElementById("profileAvatar");
      if (profile.user.avatar) {
        let avatarPath = profile.user.avatar;
        if (avatarPath.startsWith("/")) avatarPath = avatarPath.substring(1);
        const base = window.baseUrl.endsWith("/") ? window.baseUrl : window.baseUrl + "/";
        avatar.src = base + avatarPath + "?v=" + Date.now();
      } else {
        avatar.src = "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=" + encodeURIComponent(profile.user.nombre_usuario);
      }
    }

    const stats = await getUserStats();
    if (stats.success) {
      document.getElementById("statProfileReviews").innerText = stats.total_reviews;
      document.getElementById("statProfileFavorites").innerText = stats.total_favorites;
      document.getElementById("statProfilePlaylists").innerText = stats.total_playlists;
      document.getElementById("statProfileImported").innerText = stats.total_imported;
      avgElement.innerText = stats.avg_rating + " ★";
    } else {
      console.error("Error en estadísticas:", stats.message);
    }

    // Renderizar los álbumes del usuario en su perfil
    renderProfileAlbums();
  } catch (err) {
    console.error("Error cargando perfil:", err);
  }
};

// ============================================================
// EVENTOS DEL PERFIL (edición)
// ============================================================
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
    try {
      const profile = await getUserProfile();
      if (profile.success) {
        document.getElementById("modalEditUsername").value = profile.user.nombre_usuario;
        document.getElementById("modalEditEmail").value = profile.user.email;
        document.getElementById("modalEditPassword").value = "";
        document.getElementById("modalEditAvatar").value = "";
      }
    } catch (err) {
      console.error("Error al cargar perfil para edición:", err);
      await showAlert("Error al cargar los datos del perfil", "Error");
    }
    modal.classList.remove("hidden");
  });

  const closeModal = () => {
    modal.classList.add("hidden");
  };
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  saveBtn.addEventListener("click", async () => {
    const username = document.getElementById("modalEditUsername").value;
    const email = document.getElementById("modalEditEmail").value;
    const password = document.getElementById("modalEditPassword").value;
    const avatarFile = document.getElementById("modalEditAvatar").files[0];

    try {
      const data = await updateUserProfile(username, email, password, avatarFile);
      if (data.success) {
        await showAlert("Perfil actualizado correctamente", "Éxito");
        closeModal();
        window.loadProfileData();
      } else {
        await showAlert("Error: " + data.message, "Error");
      }
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      await showAlert("Error de conexión", "Error");
    }
  });
}

// ============================================================
// PERFIL PÚBLICO
// ============================================================
window.closePublicProfile = () => {
  const container = document.getElementById("publicProfileView");
  if (container) {
    container.classList.add("hidden");
    container.innerHTML = "";
  }
  showSection("home");
};
window.openPublicProfile = openPublicProfile;

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  setupProfileEvents();
  initApp();
});
