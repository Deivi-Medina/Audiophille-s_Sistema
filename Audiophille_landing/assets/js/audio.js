// assets/js/audio.js
import DOM, { state, formatTimerString } from "./var.js";
import { renderReviews } from "./reviews.js";
import { renderQueueSidebarList, renderTrackActiveStylings, updatePlayingUIs } from "./ui.js";
import { toggleFavorite } from "./services/favoriteService.js";
import { registerPlay } from "./services/playStatsService.js";
import { notifyAchievementUnlock, loadAchievements } from "./achievements.js";
import { getAchievements } from "./services/achievementService.js";

// ============================================================
// ELEMENTO DE AUDIO ÚNICO
// ============================================================
export const audio = new Audio();
audio.crossOrigin = "anonymous";
audio.preload = "auto";
audio.volume = 1;

export let queue = [];
export let queueIndex = 0;
export let isPlaying = false;
export let isShuffleActive = false;
export let isRepeatActive = false;
let pistaContabilizada = false;
let currentPlayPromise = null;

// ============================================================
// NODOS DEL ECUALLIZADOR (AudioContext)
// ============================================================
let audioCtx = null;
let audioSource = null;
let filterBass = null;
let filterVocals = null;
let filterTreble = null;

// ============================================================
// FUNCIONES DE COLA Y REPRODUCCIÓN
// ============================================================
export function setQueue(newQueue, newIndex = 0) {
  queue = newQueue;
  queueIndex = newIndex;
  audio.src = "";
  audio.load();
}

export async function playActiveSong() {
  if (queue.length === 0) return;
  const song = queue[queueIndex];
  prepareAudio();

  if (currentPlayPromise) {
    audio.pause();
    try {
      await currentPlayPromise;
    } catch (_) {}
    currentPlayPromise = null;
  }

  audio.src = song.file;
  pistaContabilizada = false;

  try {
    currentPlayPromise = audio.play();
    await currentPlayPromise;
    isPlaying = true;
    updatePlayingUIs(true);
  } catch (err) {
    console.warn("Error al reproducir:", err);
  } finally {
    currentPlayPromise = null;
  }
}

export async function togglePlayPause() {
  if (queue.length === 0) return;
  prepareAudio();

  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    updatePlayingUIs(false);
  } else {
    try {
      if (currentPlayPromise) {
        try {
          await currentPlayPromise;
        } catch (_) {}
        currentPlayPromise = null;
      }
      currentPlayPromise = audio.play();
      await currentPlayPromise;
      isPlaying = true;
      updatePlayingUIs(true);
    } catch (err) {
      console.warn("Error al reanudar:", err);
    } finally {
      currentPlayPromise = null;
    }
  }
}

export function playNextTrack() {
  if (queue.length === 0) return;

  if (isShuffleActive && queue.length > 1) {
    let nIdx;
    do {
      nIdx = Math.floor(Math.random() * queue.length);
    } while (nIdx === queueIndex);
    queueIndex = nIdx;
  } else {
    queueIndex = (queueIndex + 1) % queue.length;
  }

  const nextSong = queue[queueIndex];
  audio.pause();
  audio.currentTime = 0;
  audio.src = nextSong.file;
  audio.load();
  audio
    .play()
    .then(() => {
      isPlaying = true;
      updatePlayingUIs(true);
      renderQueueSidebarList();
    })
    .catch(() => {});
}

export function playPrevTrack() {
  if (queue.length === 0) return;
  queueIndex = (queueIndex - 1 + queue.length) % queue.length;
  const song = queue[queueIndex];
  audio.pause();
  audio.currentTime = 0;
  audio.src = song.file;
  audio.load();
  audio
    .play()
    .then(() => {
      isPlaying = true;
      updatePlayingUIs(true);
    })
    .catch(() => {});
}

// ============================================================
// CONTROLES ADICIONALES (Shuffle, Repeat, Favoritos)
// ============================================================
export function toggleShuffle() {
  isShuffleActive = !isShuffleActive;
  const btn = document.getElementById("btnShuffle");
  if (btn) {
    btn.classList.toggle("active-control", isShuffleActive);
  }
}

export function toggleRepeat() {
  isRepeatActive = !isRepeatActive;
  const btn = document.getElementById("btnRepeat");
  if (btn) {
    btn.classList.toggle("active-control", isRepeatActive);
  }
}

export async function toggleFavoriteStatus() {
  if (queue.length === 0) return;
  const currentSong = queue[queueIndex];
  if (!currentSong.id_cancion) return;

  try {
    const result = await toggleFavorite(currentSong.id_cancion);
    if (result.success) {
      if (result.favorito) {
        if (!state.favorites.some((s) => s.id_cancion === currentSong.id_cancion)) {
          state.favorites.push(currentSong);
        }
      } else {
        state.favorites = state.favorites.filter((s) => s.id_cancion !== currentSong.id_cancion);
      }
      updatePlayingUIs(isPlaying);
    }
  } catch (error) {
    console.error("Error al cambiar favorito:", error);
  }
}

// ============================================================
// EVENTOS DEL AUDIO (timeupdate, ended)
// ============================================================
async function onAudioTimeUpdate() {
  if (!audio.duration) return;
  const progressPercent = (audio.currentTime / audio.duration) * 100;

  if (DOM.miniPlayer.progressFill) {
    DOM.miniPlayer.progressFill.style.width = `${progressPercent}%`;
  }
  if (DOM.audioControls.progressFill) {
    DOM.audioControls.progressFill.style.width = `${progressPercent}%`;
  }
  if (DOM.audioControls.scrubber && !window.isScrubbing) {
    DOM.audioControls.scrubber.value = progressPercent;
  }
  if (DOM.audioControls.timeCurrent) {
    DOM.audioControls.timeCurrent.innerText = formatTimerString(audio.currentTime);
  }
  if (DOM.audioControls.timeTotal) {
    DOM.audioControls.timeTotal.innerText = formatTimerString(audio.duration);
  }

  // Registrar reproducción y verificar logros
  if (progressPercent >= 70 && !pistaContabilizada && queue.length > 0) {
    const result = await registerPlay(queue[queueIndex]);
    if (result && result.unlocked && result.unlocked.length > 0) {
      await loadAchievements(); // recarga la lista en memoria
      const data = await getAchievements();
      if (data.success) {
        const unlockedAchievements = data.achievements.filter((a) => result.unlocked.includes(a.id_logro));
        unlockedAchievements.forEach((ach) => {
          notifyAchievementUnlock(ach);
        });
      }
    }
    pistaContabilizada = true;
  }
}

function onAudioEnded() {
  if (isRepeatActive && queue.length === 1) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } else {
    playNextTrack();
  }
}

export function bindAudioEvents() {
  audio.removeEventListener("timeupdate", onAudioTimeUpdate);
  audio.removeEventListener("ended", onAudioEnded);
  audio.addEventListener("timeupdate", onAudioTimeUpdate);
  audio.addEventListener("ended", onAudioEnded);
}

// ============================================================
// INICIALIZACIÓN DEL AUDIO CONTEXT Y ECUALLIZADOR
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
    console.error("Error al inicializar AudioContext:", e);
    audioCtx = null;
    audioSource = null;
    filterBass = null;
    filterVocals = null;
    filterTreble = null;
  }
}

export function prepareAudio() {
  if (!audioCtx) {
    initAudioContext();
  } else if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

export function updateEqualizerNodeValues() {
  const bassVal = parseFloat(DOM.equalizer.bassSlider?.value || 0);
  const vocalsVal = parseFloat(DOM.equalizer.vocalsSlider?.value || 0);
  const trebleVal = parseFloat(DOM.equalizer.trebleSlider?.value || 0);

  if (DOM.equalizer.lblBass) {
    DOM.equalizer.lblBass.innerText = `${bassVal > 0 ? "+" : ""}${bassVal} dB`;
  }
  if (DOM.equalizer.lblVocals) {
    DOM.equalizer.lblVocals.innerText = `${vocalsVal > 0 ? "+" : ""}${vocalsVal} dB`;
  }
  if (DOM.equalizer.lblTreble) {
    DOM.equalizer.lblTreble.innerText = `${trebleVal > 0 ? "+" : ""}${trebleVal} dB`;
  }

  if (filterBass) filterBass.gain.value = bassVal;
  if (filterVocals) filterVocals.gain.value = vocalsVal;
  if (filterTreble) filterTreble.gain.value = trebleVal;
}

// ============================================================
// 🆕 VINCULACIÓN DEL VOLUMEN GENERAL CON EL SLIDER DEL ECUALLIZADOR
// ============================================================
const volSlider = DOM.audioControls.volSlider;
const lblMasterVol = DOM.fullPlayer.lblMasterVol;

if (volSlider) {
  // Cuando el usuario mueve el slider
  volSlider.addEventListener("input", function () {
    const val = parseFloat(this.value);
    // Ajustar el volumen del audio (0 a 1)
    audio.volume = val / 100;
    // Actualizar la etiqueta del porcentaje
    if (lblMasterVol) {
      lblMasterVol.textContent = val + "%";
    }
  });

  // Inicializar el volumen y la etiqueta con el valor del slider
  const initialVal = parseFloat(volSlider.value);
  audio.volume = initialVal / 100;
  if (lblMasterVol) {
    lblMasterVol.textContent = initialVal + "%";
  }
}

/**
 * Reordena la cola de reproducción
 * @param {number} fromIndex - Índice de origen
 * @param {number} toIndex - Índice de destino
 */
export function reorderQueue(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;

  // Extraer el elemento de la posición origen
  const [removed] = queue.splice(fromIndex, 1);
  // Insertarlo en la posición destino
  queue.splice(toIndex, 0, removed);

  // Ajustar queueIndex si la canción actual se movió
  if (queueIndex === fromIndex) {
    // Si la canción actual es la que se movió, su nuevo índice es toIndex
    queueIndex = toIndex;
  } else if (fromIndex < queueIndex && toIndex >= queueIndex) {
    // Si la canción actual está entre origen y destino, y el origen estaba antes que el actual
    queueIndex--;
  } else if (fromIndex > queueIndex && toIndex <= queueIndex) {
    // Si la canción actual está entre destino y origen, y el origen estaba después del actual
    queueIndex++;
  }
}
