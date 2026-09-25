// assets/js/audio.js
import DOM, { state, formatTimerString } from "./var.js";
import { renderReviews } from "./reviews.js";
import { renderQueueSidebarList, renderTrackActiveStylings, updatePlayingUIs } from "./ui.js";
import { toggleFavorite } from "./services/favoriteService.js";
import { registerPlay } from "./services/playStatsService.js";
import { notifyAchievementUnlock, loadAchievements } from "./achievements.js";
import { getAchievements } from "./services/achievementService.js";
import { getYouTubeId, checkYouTubeCache } from "./services/explorerService.js";
import { showAlert } from "./modals.js";

export const audio = new Audio();
audio.crossOrigin = "anonymous";
audio.preload = "auto";
audio.volume = 1;

export let isPlaying = false;
export let isShuffleActive = false;
export let isRepeatActive = false;
let currentPlayPromise = null;

// ============================================================
// GESTOR DE COLA DE REPRODUCCIÓN (estilo Spotify)
// ============================================================
class QueueManager {
  constructor() {
    this.userQueue = [];
    this.contextSongs = [];
    this.contextIndex = 0;
    this.history = [];
    this.currentSong = null;
    this.currentSource = null;
    this.shuffleList = [];
    this.shuffleIndex = 0;
    this.originalContextOrder = [];
    this._shuffleActive = false;
  }

  setContext(songs, startIndex = 0) {
    this.contextSongs = Array.isArray(songs) ? [...songs] : [];
    this.originalContextOrder = [...this.contextSongs];
    this.contextIndex = Math.max(0, Math.min(startIndex, this.contextSongs.length - 1));
    this.userQueue = [];
    this.history = [];
    this.currentSong = this.contextSongs[this.contextIndex] || null;
    this.currentSource = "context";

    if (this._shuffleActive) {
      this._buildShuffleList();
    }

    this._notifyQueueChanged();
  }

  getCurrentSong() {
    return this.currentSong;
  }

  getCurrentIndex() {
    return this.contextIndex;
  }

  setCurrentIndex(index) {
    if (index >= 0 && index < this.contextSongs.length) {
      this.contextIndex = index;
      this.currentSong = this.contextSongs[index];
      this.currentSource = "context";
      this._notifyQueueChanged();
    }
  }

  addUserQueue(song) {
    if (this.userQueue.length > 0 && this.userQueue[this.userQueue.length - 1].id_cancion === song.id_cancion) {
      return;
    }
    this.userQueue.push(song);
    this._notifyQueueChanged();
  }

  toggleShuffle() {
    this._shuffleActive = !this._shuffleActive;
    if (this._shuffleActive) {
      this._buildShuffleList();
    } else {
      this.shuffleList = [];
      this.shuffleIndex = 0;
      if (this.originalContextOrder.length > 0) {
        this.contextSongs = [...this.originalContextOrder];
        if (this.currentSong) {
          const newIdx = this.contextSongs.findIndex((s) => s.id_cancion === this.currentSong.id_cancion);
          this.contextIndex = newIdx !== -1 ? newIdx : 0;
        } else {
          this.contextIndex = 0;
        }
        this.currentSong = this.contextSongs[this.contextIndex] || null;
      }
    }
    this._notifyQueueChanged();
    return this._shuffleActive;
  }

  _buildShuffleList() {
    if (this.contextSongs.length <= 1) {
      this.shuffleList = [...this.contextSongs];
      this.shuffleIndex = 0;
      if (this.shuffleList.length > 0) {
        this.currentSong = this.shuffleList[0];
        this.contextIndex = 0;
      }
      return;
    }

    const current = this.currentSong;
    const rest = this.contextSongs.filter((s) => s.id_cancion !== current?.id_cancion);

    // Barajar el resto
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    this.shuffleList = current ? [current, ...rest] : [...rest];
    this.shuffleIndex = 0;
    this.contextSongs = [...this.shuffleList];
    this.contextIndex = 0;
    this.currentSong = this.shuffleList[0] || null;
  }

  getNextSong() {
    // 1. Prioridad: Cola de usuario
    if (this.userQueue.length > 0) {
      const nextSong = this.userQueue.shift();
      if (this.currentSong) this.history.push(this.currentSong);
      this.currentSong = nextSong;
      this.currentSource = "user";
      this._notifyQueueChanged();
      return nextSong;
    }

    // Si no hay contexto, terminar
    if (this.contextSongs.length === 0) {
      this.currentSong = null;
      this.currentSource = null;
      this._notifyQueueChanged();
      return null;
    }

    // Guardar la canción actual en el historial (si existe)
    if (this.currentSong) {
      this.history.push(this.currentSong);
    }

    // Shuffle activo
    if (this._shuffleActive && this.shuffleList.length > 0) {
      this.shuffleIndex++;
      if (this.shuffleIndex < this.shuffleList.length) {
        const nextSong = this.shuffleList[this.shuffleIndex];
        // Actualizar contextIndex para sincronizar con la lista barajada
        const idx = this.contextSongs.findIndex((s) => s.id_cancion === nextSong.id_cancion);
        if (idx !== -1) {
          this.contextIndex = idx;
        }
        this.currentSong = nextSong;
        this.currentSource = "context";
        this._notifyQueueChanged();
        return nextSong;
      } else {
        // Fin de la lista shuffle
        this.currentSong = null;
        this.currentSource = null;
        this._notifyQueueChanged();
        return null;
      }
    }

    // Shuffle inactivo: avanzar en orden normal
    this.contextIndex = (this.contextIndex + 1) % this.contextSongs.length;
    this.currentSong = this.contextSongs[this.contextIndex];
    this.currentSource = "context";
    this._notifyQueueChanged();
    return this.currentSong;
  }

  getPrevSong() {
    if (this.history.length > 0) {
      this.currentSong = this.history.pop();
      this.currentSource = "history";
      this._notifyQueueChanged();
      return this.currentSong;
    }

    if (this.contextSongs.length === 0) {
      this.currentSong = null;
      this.currentSource = null;
      this._notifyQueueChanged();
      return null;
    }

    // Retroceder en el contexto (respetando shuffle si está activo)
    if (this._shuffleActive && this.shuffleList.length > 0) {
      // En shuffle, retroceder en la lista shuffle
      if (this.shuffleIndex > 0) {
        this.shuffleIndex--;
        const prevSong = this.shuffleList[this.shuffleIndex];
        const idx = this.contextSongs.findIndex((s) => s.id_cancion === prevSong.id_cancion);
        if (idx !== -1) {
          this.contextIndex = idx;
        }
        this.currentSong = prevSong;
        this.currentSource = "context";
        this._notifyQueueChanged();
        return prevSong;
      }
      // Si estamos al inicio de la lista shuffle, no hay anterior
      return null;
    }

    // Sin shuffle
    this.contextIndex = (this.contextIndex - 1 + this.contextSongs.length) % this.contextSongs.length;
    this.currentSong = this.contextSongs[this.contextIndex];
    this.currentSource = "context";
    this._notifyQueueChanged();
    return this.currentSong;
  }

  getFlattenedQueue() {
    const current = this.currentSong;
    const result = current ? [current] : [];

    let contextRemaining = [];
    if (this._shuffleActive && this.shuffleList.length > 0) {
      // Mostrar el resto de la lista shuffle a partir del siguiente índice
      const start = this.shuffleIndex + 1;
      contextRemaining = this.shuffleList.slice(start);
    } else {
      // Mostrar el resto del contexto a partir del siguiente índice
      const start = this.contextIndex + 1;
      contextRemaining = this.contextSongs.slice(start);
    }

    return result.concat(this.userQueue).concat(contextRemaining);
  }

  _notifyQueueChanged() {
    if (typeof window !== "undefined") {
      window.queueIndex = this.contextIndex;
    }
    if (typeof renderQueueSidebarList === "function") {
      renderQueueSidebarList();
    }
    document.dispatchEvent(
      new CustomEvent("queueChanged", {
        detail: {
          queue: this.getFlattenedQueue(),
          currentSong: this.currentSong,
          source: this.currentSource,
        },
      }),
    );
  }

  reset() {
    this.userQueue = [];
    this.contextSongs = [];
    this.contextIndex = 0;
    this.history = [];
    this.currentSong = null;
    this.currentSource = null;
    this.shuffleList = [];
    this.shuffleIndex = 0;
    this.originalContextOrder = [];
    this._shuffleActive = false;
    this._notifyQueueChanged();
  }
}

const queueManager = new QueueManager();

// ============================================================
// EXPOSICIÓN DE LA COLA PARA COMPATIBILIDAD (Proxy)
// ============================================================
export const queue = new Proxy([], {
  get(target, prop) {
    const flat = queueManager.getFlattenedQueue();
    if (prop === "length") return flat.length;
    if (prop === Symbol.iterator) return flat[Symbol.iterator].bind(flat);
    if (prop === "0") return flat[0];
    return flat[prop];
  },
  set() {
    return true;
  },
});

export let queueIndex = 0;

const originalNotify = queueManager._notifyQueueChanged.bind(queueManager);
queueManager._notifyQueueChanged = function () {
  queueIndex = this.contextIndex;
  originalNotify();
};

// ============================================================
// NODOS DEL ECUALIZADOR (AudioContext)
// ============================================================
let audioCtx = null;
let audioSource = null;
let filterBass = null;
let filterVocals = null;
let filterTreble = null;

// ============================================================
// REPRODUCTOR DE YOUTUBE (Iframe API State)
// ============================================================
let youtubePlayer = null;
let youtubeReady = false;
let youtubeCurrentVideoId = null;
let isYouTubePlaying = false;
let youtubeTimeUpdateInterval = null;
let youtubeErrorCount = 0;
let youtubeApiAvailable = true;
let youtubeApiKeyMissing = false;
let youtubePistaContabilizada = false;
let youtubeActive = false;
let pistaContabilizada = false;

// ============================================================
// INICIALIZACIÓN DEL ECUALIZADOR
// ============================================================
function initAudioContext() {
  if (audioCtx) return;
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtxClass) return;
  try {
    audioCtx = new AudioCtxClass();
    audioSource = audioCtx.createMediaElementSource(audio);
    filterBass = audioCtx.createBiquadFilter();
    filterBass.type = "lowshelf";
    filterBass.frequency.value = 150;
    filterBass.gain.value = parseFloat(DOM.equalizer.bassSlider?.value || 0);
    filterVocals = audioCtx.createBiquadFilter();
    filterVocals.type = "peaking";
    filterVocals.frequency.value = 1500;
    filterVocals.Q.value = 1.0;
    filterVocals.gain.value = parseFloat(DOM.equalizer.vocalsSlider?.value || 0);
    filterTreble = audioCtx.createBiquadFilter();
    filterTreble.type = "highshelf";
    filterTreble.frequency.value = 6000;
    filterTreble.gain.value = parseFloat(DOM.equalizer.trebleSlider?.value || 0);
    audioSource.connect(filterBass);
    filterBass.connect(filterVocals);
    filterVocals.connect(filterTreble);
    filterTreble.connect(audioCtx.destination);
  } catch (e) {
    audioCtx = null;
  }
}

export function prepareAudio() {
  if (!audioCtx) initAudioContext();
  else if (audioCtx.state === "suspended") audioCtx.resume();
}

export function updateEqualizerNodeValues() {
  const bassVal = parseFloat(DOM.equalizer.bassSlider?.value || 0);
  const vocalsVal = parseFloat(DOM.equalizer.vocalsSlider?.value || 0);
  const trebleVal = parseFloat(DOM.equalizer.trebleSlider?.value || 0);
  if (DOM.equalizer.lblBass) DOM.equalizer.lblBass.innerText = `${bassVal > 0 ? "+" : ""}${bassVal} dB`;
  if (DOM.equalizer.lblVocals) DOM.equalizer.lblVocals.innerText = `${vocalsVal > 0 ? "+" : ""}${vocalsVal} dB`;
  if (DOM.equalizer.lblTreble) DOM.equalizer.lblTreble.innerText = `${trebleVal > 0 ? "+" : ""}${trebleVal} dB`;
  if (filterBass) filterBass.gain.value = bassVal;
  if (filterVocals) filterVocals.gain.value = vocalsVal;
  if (filterTreble) filterTreble.gain.value = trebleVal;
}

// ============================================================
// CONTROLADOR UNIFICADO (Core del Player)
// ============================================================
const player = {
  _currentType: null,
  _isLoading: false,

  getType() {
    const song = queueManager.getCurrentSong();
    if (!song) return null;
    const url = song.file || song.archivo_url;
    if (!url || url === "null" || url === "") return null;
    if (url.startsWith("youtube:")) return "youtube";
    return "mp3";
  },

  async play() {
    let song = queueManager.getCurrentSong();

    if (!song) {
      const next = queueManager.getNextSong();
      if (!next) {
        await showAlert("No hay más canciones en la cola", "Fin de la cola");
        return;
      }
      song = queueManager.getCurrentSong();
      if (!song) return;
    }

    const url = song.file || song.archivo_url;

    if (url && url !== "null" && url !== "" && !url.startsWith("youtube:")) {
      await this._playMP3(url);
      return;
    }

    if (url && url.startsWith("youtube:")) {
      if (!youtubeApiAvailable || youtubeApiKeyMissing) {
        this._setLoading(false);
        this.next();
        return;
      }
      await this._playYouTube(url.replace("youtube:", ""));
      return;
    }

    if (song.id_cache || song.cache_id) {
      console.warn("Canción omitida: tiene ID de caché.");
      this.next();
      return;
    }

    if (!youtubeApiAvailable || youtubeApiKeyMissing) {
      this._setLoading(false);
      this.next();
      return;
    }
    await this._playYouTubeLazy(song);
  },

  async _playMP3(url) {
    this._setLoading(true);
    this._currentType = "mp3";
    prepareAudio();

    if (youtubePlayer && youtubeReady && youtubeActive) {
      try {
        youtubePlayer.setVolume(0);
        youtubePlayer.stopVideo();
      } catch (_) {}
    }
    youtubeActive = false;
    isYouTubePlaying = false;
    stopYouTubeTimeUpdate();

    if (currentPlayPromise) {
      try {
        audio.pause();
        await currentPlayPromise;
      } catch (_) {}
      currentPlayPromise = null;
    }

    if (audio.src !== url) {
      audio.src = url;
      audio.load();
      pistaContabilizada = false;
    } else {
      audio.load();
    }

    try {
      currentPlayPromise = audio.play();
      await currentPlayPromise;
      isPlaying = true;
      updatePlayingUIs(true);
      if (typeof renderTrackActiveStylings === "function") renderTrackActiveStylings();
      this._setLoading(false);
    } catch (err) {
      if (err.name === "AbortError") {
        this._setLoading(false);
        return;
      }
      console.warn("Fallo real en reproducción de archivo MP3 local:", err);
      this._setLoading(false);
      this.next();
    } finally {
      currentPlayPromise = null;
    }
  },

  async _playYouTube(videoId) {
    if (!videoId) {
      this._setLoading(false);
      this.next();
      return;
    }

    this._setLoading(true);
    this._currentType = "youtube";
    const masterVol = parseFloat(DOM.audioControls.volSlider?.value || 100);

    if (!youtubePlayer || !youtubeReady) {
      initYouTubePlayer();
      if (!youtubeReady) {
        await new Promise((resolve) => {
          const checkReady = setInterval(() => {
            if (youtubeReady && youtubePlayer) {
              clearInterval(checkReady);
              resolve();
            }
          }, 100);
          setTimeout(() => resolve(), 5000);
        });
      }
    }

    if (!youtubePlayer || !youtubeReady) {
      this._setLoading(false);
      this.next();
      return;
    }

    if (currentPlayPromise) {
      try {
        audio.pause();
        await currentPlayPromise;
      } catch (_) {}
      currentPlayPromise = null;
    } else {
      audio.pause();
    }

    youtubeActive = true;
    youtubeCurrentVideoId = videoId;
    youtubePistaContabilizada = false;

    try {
      youtubePlayer.setVolume(masterVol);
      youtubePlayer.loadVideoById(videoId);
      if (typeof renderTrackActiveStylings === "function") renderTrackActiveStylings();
    } catch (_) {
      this._setLoading(false);
      this.next();
    }
  },

  async _playYouTubeLazy(song) {
    if (!song.id_cancion) {
      this._setLoading(false);
      this.next();
      return;
    }

    try {
      const result = await getYouTubeId(song.id_cancion);
      if (!result || !result.success || !result.youtube_id) {
        this._setLoading(false);
        this.next();
        return;
      }
      await this._playYouTube(result.youtube_id);
    } catch (error) {
      this._setLoading(false);
      this.next();
    }
  },

  pause() {
    if (this._currentType === "youtube" && youtubePlayer && youtubeReady && youtubeActive) {
      youtubePlayer.pauseVideo();
      isYouTubePlaying = false;
    } else if (this._currentType === "mp3") {
      audio.pause();
    }
    isPlaying = false;
    updatePlayingUIs(false);
    stopYouTubeTimeUpdate();
    this._setLoading(false);
  },

  async togglePlayPause() {
    if (queueManager.getFlattenedQueue().length === 0) return;

    if (isPlaying) {
      this.pause();
    } else {
      if (this._currentType === "mp3" && audio.src) {
        try {
          this._setLoading(true);
          currentPlayPromise = audio.play();
          await currentPlayPromise;
          isPlaying = true;
          updatePlayingUIs(true);
          this._setLoading(false);
        } catch (e) {
          if (e.name !== "AbortError") this.play();
        }
      } else if (this._currentType === "youtube" && youtubePlayer && youtubeReady && youtubeActive) {
        youtubePlayer.playVideo();
      } else {
        this.play();
      }
    }
  },

  next() {
    if (isRepeatActive) {
      this.seek(0);
      if (this._currentType === "mp3") audio.play().catch(() => {});
      else if (this._currentType === "youtube" && youtubePlayer && youtubeReady && youtubeActive) youtubePlayer.playVideo();
      return;
    }

    this._stopCurrentOutputs();
    const nextSong = queueManager.getNextSong();
    if (nextSong) {
      this.play();
    } else {
      this.reset();
    }
  },

  prev() {
    this._stopCurrentOutputs();
    const prevSong = queueManager.getPrevSong();
    if (prevSong) {
      this.play();
    } else {
      this.reset();
    }
  },

  _stopCurrentOutputs() {
    if (youtubePlayer && youtubeReady && youtubeActive) {
      try {
        youtubePlayer.stopVideo();
      } catch (_) {}
      isYouTubePlaying = false;
      stopYouTubeTimeUpdate();
    }
    audio.pause();
    audio.currentTime = 0;
  },

  seek(percent) {
    if (this._isLoading) return;
    const clamped = Math.max(0, Math.min(1, percent));

    if (this._currentType === "youtube" && youtubePlayer && youtubeReady && youtubeActive) {
      const d = youtubePlayer.getDuration();
      if (d > 0 && isFinite(d)) youtubePlayer.seekTo(clamped * d, true);
    } else if (this._currentType === "mp3") {
      if (audio.duration && !isNaN(audio.duration)) audio.currentTime = clamped * audio.duration;
    }
    this.updateVisualBars(clamped * 100);
  },

  updateVisualBars(progressPercent) {
    if (DOM.miniPlayer.progressFill) DOM.miniPlayer.progressFill.style.width = `${progressPercent}%`;
    if (DOM.audioControls.progressFill) DOM.audioControls.progressFill.style.width = `${progressPercent}%`;
    if (DOM.audioControls.scrubber && !window.isScrubbing) DOM.audioControls.scrubber.value = progressPercent;
  },

  setVolume(volume) {
    const vol = Math.min(Math.max(volume, 0), 100);
    audio.volume = vol / 100;
    if (youtubePlayer && youtubeReady && youtubeActive) {
      try {
        youtubePlayer.setVolume(vol);
      } catch (_) {}
    }
  },

  getCurrentTime() {
    return this._currentType === "youtube" && youtubePlayer && youtubeReady && youtubeActive
      ? youtubePlayer.getCurrentTime()
      : audio.currentTime || 0;
  },

  getDuration() {
    return this._currentType === "youtube" && youtubePlayer && youtubeReady && youtubeActive
      ? youtubePlayer.getDuration()
      : audio.duration || 0;
  },

  isLoading() {
    return this._isLoading;
  },
  _setLoading(l) {
    this._isLoading = l;
    document.dispatchEvent(new CustomEvent("playerLoading", { detail: { loading: l } }));
  },

  reset() {
    this._setLoading(false);
    this._currentType = null;
    this._stopCurrentOutputs();
    audio.src = "";
    audio.load();
    isPlaying = false;
    youtubeErrorCount = 0;
    youtubeActive = false;
    updatePlayingUIs(false);
  },
};

// ============================================================
// FUNCIONES DE COLA Y REPRODUCCIÓN COMPATIBLES
// ============================================================
export function setQueue(newQueue, startIndex = 0) {
  queueManager.setContext(newQueue, startIndex);
  youtubePistaContabilizada = false;
  player.reset();
}

export function injectSongIntoMainQueue(song) {
  queueManager.addUserQueue(song);
}

export async function playActiveSong() {
  await player.play();
}

export async function togglePlayPause() {
  await player.togglePlayPause();
}

export function playNextTrack() {
  player.next();
}

export function playPrevTrack() {
  player.prev();
}

export function toggleShuffle() {
  const newState = queueManager.toggleShuffle();
  const btn = document.getElementById("btnShuffle");
  if (btn) btn.classList.toggle("active-control", newState);
  return newState;
}

export function toggleRepeat() {
  isRepeatActive = !isRepeatActive;
  const btn = document.getElementById("btnRepeat");
  if (btn) btn.classList.toggle("active-control", isRepeatActive);
  return isRepeatActive;
}

export async function toggleFavoriteStatus() {
  const currentSong = queueManager.getCurrentSong();
  if (!currentSong || !currentSong.id_cancion) return;

  try {
    const result = await toggleFavorite(currentSong.id_cancion);
    if (result.success) {
      if (result.favorito) {
        if (!state.favorites.some((s) => s.id_cancion === currentSong.id_cancion)) state.favorites.push(currentSong);
      } else {
        state.favorites = state.favorites.filter((s) => s.id_cancion !== currentSong.id_cancion);
      }
      updatePlayingUIs(isPlaying);
    }
  } catch (error) {
    console.error(error);
  }
}

export function reorderQueue(fromIndex, toIndex) {
  const userLen = queueManager.userQueue.length;
  if (fromIndex < userLen && toIndex < userLen) {
    const [removed] = queueManager.userQueue.splice(fromIndex, 1);
    queueManager.userQueue.splice(toIndex, 0, removed);
    queueManager._notifyQueueChanged();
  } else {
    console.warn("No se puede reordenar elementos del contexto");
  }
}

// ============================================================
// GESTIÓN DE PERSISTENCIA DE ESTADOS (para game.js)
// ============================================================
export function getPlaybackState() {
  return {
    queueContext: [...queueManager.contextSongs],
    contextIndex: queueManager.getCurrentIndex(),
    userQueue: [...queueManager.userQueue],
    history: [...queueManager.history],
    currentTime: player.getCurrentTime(),
    wasPlaying: isPlaying,
    currentType: player._currentType,
  };
}

export function setPlaybackState(stateData) {
  if (!stateData) return;
  queueManager.contextSongs = Array.isArray(stateData.queueContext) ? stateData.queueContext : [];
  queueManager.contextIndex = stateData.contextIndex || 0;
  queueManager.userQueue = Array.isArray(stateData.userQueue) ? stateData.userQueue : [];
  queueManager.history = Array.isArray(stateData.history) ? stateData.history : [];

  player.reset();

  if (queueManager.getCurrentSong()) {
    player.play().then(() => {
      if (!stateData.wasPlaying) {
        player.pause();
      }
      setTimeout(() => {
        if (stateData.currentTime) {
          const dur = player.getDuration();
          if (dur > 0) player.seek(stateData.currentTime / dur);
        }
      }, 300);
    });
  }
}

// ============================================================
// EVENTOS AUDIO (MP3) Y SINCRONIZACIÓN YOUTUBE
// ============================================================
async function onAudioTimeUpdate() {
  if (!audio.duration || window.isScrubbing) return;
  const progressPercent = (audio.currentTime / audio.duration) * 100;
  player.updateVisualBars(progressPercent);

  if (DOM.audioControls.timeCurrent) DOM.audioControls.timeCurrent.innerText = formatTimerString(audio.currentTime);
  if (DOM.audioControls.timeTotal) DOM.audioControls.timeTotal.innerText = formatTimerString(audio.duration);

  if (progressPercent >= 70 && !pistaContabilizada) {
    pistaContabilizada = true;
    const current = queueManager.getCurrentSong();
    if (current) {
      const result = await registerPlay(current);
      if (result && result.unlocked && result.unlocked.length > 0) {
        await loadAchievements();
        const data = await getAchievements();
        if (data.success) {
          const unlockedAchievements = data.achievements.filter((a) => result.unlocked.includes(a.id_logro));
          unlockedAchievements.forEach((ach) => notifyAchievementUnlock(ach));
        }
      }
    }
  }
}

function onAudioEnded() {
  player.next();
}

export function bindAudioEvents() {
  audio.removeEventListener("timeupdate", onAudioTimeUpdate);
  audio.removeEventListener("ended", onAudioEnded);
  audio.addEventListener("timeupdate", onAudioTimeUpdate);
  audio.addEventListener("ended", onAudioEnded);
}

function initYouTubePlayer() {
  if (youtubePlayer) return;
  const container = document.getElementById("youtubePlayerContainer");
  if (!container) {
    youtubeApiAvailable = false;
    return;
  }

  if (typeof YT === "undefined" || typeof YT.Player === "undefined") return;

  try {
    youtubePlayer = new YT.Player("youtubePlayerContainer", {
      height: "0",
      width: "0",
      videoId: "",
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0, showinfo: 0, mute: 0 },
      events: {
        onReady: () => {
          youtubeReady = true;
          youtubeApiAvailable = true;
        },
        onStateChange: onYouTubeStateChange,
        onError: onYouTubeError,
      },
    });
  } catch (e) {
    youtubeApiAvailable = false;
  }
}

function onYouTubeStateChange(event) {
  switch (event.data) {
    case YT.PlayerState.PLAYING:
      isYouTubePlaying = true;
      isPlaying = true;
      player._setLoading(false);
      youtubeErrorCount = 0;
      updatePlayingUIs(true);
      startYouTubeTimeUpdate();
      break;
    case YT.PlayerState.PAUSED:
      isYouTubePlaying = false;
      isPlaying = false;
      updatePlayingUIs(false);
      stopYouTubeTimeUpdate();
      break;
    case YT.PlayerState.ENDED:
      isYouTubePlaying = false;
      isPlaying = false;
      updatePlayingUIs(false);
      stopYouTubeTimeUpdate();
      player.next();
      break;
    case YT.PlayerState.BUFFERING:
      player._setLoading(true);
      break;
  }
}

function onYouTubeError(error) {
  youtubeActive = false;
  isYouTubePlaying = false;
  isPlaying = false;
  player._setLoading(false);
  updatePlayingUIs(false);
  stopYouTubeTimeUpdate();
  player.next();
}

function startYouTubeTimeUpdate() {
  stopYouTubeTimeUpdate();
  youtubeTimeUpdateInterval = setInterval(() => {
    if (isYouTubePlaying && youtubePlayer && youtubeReady && youtubeActive) updateYouTubeProgress();
  }, 250);
}

function stopYouTubeTimeUpdate() {
  if (youtubeTimeUpdateInterval) {
    clearInterval(youtubeTimeUpdateInterval);
    youtubeTimeUpdateInterval = null;
  }
}

async function updateYouTubeProgress() {
  try {
    if (window.isScrubbing || !youtubeActive) return;
    const current = youtubePlayer.getCurrentTime();
    const duration = youtubePlayer.getDuration();
    if (duration > 0 && isFinite(duration)) {
      const progressPercent = (current / duration) * 100;
      player.updateVisualBars(progressPercent);
      if (DOM.audioControls.timeCurrent) DOM.audioControls.timeCurrent.innerText = formatTimerString(current);
      if (DOM.audioControls.timeTotal) DOM.audioControls.timeTotal.innerText = formatTimerString(duration);

      if (progressPercent >= 70 && !youtubePistaContabilizada) {
        youtubePistaContabilizada = true;
        const currentSong = queueManager.getCurrentSong();
        if (currentSong) {
          const result = await registerPlay(currentSong);
          if (result && result.unlocked && result.unlocked.length > 0) {
            await loadAchievements();
            const data = await getAchievements();
            if (data.success) {
              const unlockedAchievements = data.achievements.filter((a) => result.unlocked.includes(a.id_logro));
              unlockedAchievements.forEach((ach) => notifyAchievementUnlock(ach));
            }
          }
        }
      }
    }
  } catch (e) {}
}

// ============================================================
// SCRUBBER Y EVENT BINDINGS
// ============================================================
if (DOM.audioControls.volSlider) {
  DOM.audioControls.volSlider.addEventListener("input", function () {
    player.setVolume(parseFloat(this.value));
    if (DOM.fullPlayer.lblMasterVol) DOM.fullPlayer.lblMasterVol.textContent = this.value + "%";
  });
}

if (DOM.audioControls.scrubber) {
  DOM.audioControls.scrubber.addEventListener("pointerdown", () => {
    window.isScrubbing = true;
  });
  DOM.audioControls.scrubber.addEventListener("input", function () {
    if (window.isScrubbing) {
      const pct = parseFloat(this.value);
      if (DOM.audioControls.progressFill) DOM.audioControls.progressFill.style.width = `${pct}%`;
      if (DOM.miniPlayer.progressFill) DOM.miniPlayer.progressFill.style.width = `${pct}%`;
    }
  });
  DOM.audioControls.scrubber.addEventListener("pointerup", function () {
    window.isScrubbing = false;
    player.seek(parseFloat(this.value) / 100);
  });
}

window.onYouTubeIframeAPIReady = initYouTubePlayer;
if (typeof YT !== "undefined" && YT.loaded) initYouTubePlayer();

// ============================================================
// EXPORTACIONES CENTRALIZADAS
// ============================================================
export { player, queueManager, youtubePlayer, youtubeReady, isYouTubePlaying, youtubeActive };

export const isLoading = () => player.isLoading();

export async function playYouTubeSong(videoId) {
  await player._playYouTube(videoId);
}
