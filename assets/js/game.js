// js/game.js
import { audio, isPlaying, queue, queueIndex, playActiveSong, setQueue } from "./audio.js";
import { state } from "./var.js";
import { setGameKeyboardMode } from "./keyboard.js";
import { addXpForAction } from "./achievements.js";
import { incrementarPartida } from "./services/gameService.js";
import { notifyAchievementUnlock, loadAchievements } from "./achievements.js";
import { getAchievements } from "./services/achievementService.js";
import { checkYouTubeCache } from "./services/explorerService.js";

// ✅ Importaciones del reproductor global de YouTube
import { youtubePlayer, youtubeReady, isYouTubePlaying, playYouTubeSong } from "./audio.js";

// ✅ Importación necesaria para actualizar la UI al restaurar la música
import { updatePlayingUIs } from "./ui.js";

// ==================== ESTADO DEL JUEGO ====================
let currentGameSong = null;
let currentOptions = [];
let currentCorrectAnswer = "";
let currentRoundActive = true;
let score = 0;
let previousSongId = null;
let fragmentTimeout = null;
let audioCtx = null;

// ==================== ESTADO DE LA MÚSICA PRINCIPAL ====================
let savedQueue = null;
let savedQueueIndex = 0;
let savedCurrentTime = 0;
let wasPlayingBeforeGame = false;

// ==================== DOM ELEMENTS ====================
let gameCover, gameScore, gameOptionsContainer, gameNextBtn, gameMessage, gamePlayingIndicator;
let currentPlayPromise = null;

async function handleUnlockedAchievements(result) {
  if (result && result.unlocked && result.unlocked.length > 0) {
    await loadAchievements();
    const data = await getAchievements();
    if (data.success) {
      const unlockedAchievements = data.achievements.filter((a) => result.unlocked.includes(a.id_logro));
      unlockedAchievements.forEach((ach) => {
        notifyAchievementUnlock(ach);
      });
    }
  }
}

// ==================== INICIALIZACIÓN ====================
export function initGameDOM() {
  gameCover = document.getElementById("gameCover");
  gameScore = document.getElementById("gameScore");
  gameOptionsContainer = document.getElementById("gameOptions");
  gameNextBtn = document.getElementById("gameNextBtn");
  gameMessage = document.getElementById("gameMessage");
  gamePlayingIndicator = document.getElementById("gamePlayingIndicator");

  if (gameNextBtn) {
    gameNextBtn.addEventListener("click", () => nextRound());
  }
}

// ==================== SONIDOS Y EFECTOS ====================
function playBeep(type) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = "sine";
  const frequency = type === "correct" ? 880 : 440;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.5);
  osc.start();
  osc.stop(now + 0.3);
}

function launchConfetti() {
  if (typeof confetti === "function") {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#a855f7", "#c084fc", "#e0b0ff"],
    });
  }
}

// ==================== FUNCIONES PRINCIPALES ====================
export async function startGame() {
  setGameKeyboardMode(true);

  const hasQueue = queue && queue.length > 0;
  const isSongPlaying = isPlaying || !audio.paused;

  if (hasQueue && queue[queueIndex]) {
    wasPlayingBeforeGame = isSongPlaying;
    savedQueue = [...queue];
    savedQueueIndex = queueIndex;
    savedCurrentTime = audio.currentTime || 0;

    // Pausar de forma segura según el tipo de origen activo antes de la trivia
    if (isSongPlaying) {
      if (youtubePlayer && youtubeReady && typeof youtubePlayer.pauseVideo === "function") {
        youtubePlayer.pauseVideo();
      }
      audio.pause();
    }
  } else {
    wasPlayingBeforeGame = false;
    savedQueue = null;
    savedQueueIndex = 0;
    savedCurrentTime = 0;
  }

  score = 0;
  previousSongId = null;
  updateScore();
  updateMiniPlayerStatus(true);
  loadNewRound();
}

export function stopGame() {
  setGameKeyboardMode(false);

  if (fragmentTimeout) {
    clearTimeout(fragmentTimeout);
    fragmentTimeout = null;
  }

  // Limpieza segura del Iframe de YouTube de la trivia
  if (youtubePlayer && youtubeReady) {
    try {
      youtubePlayer.pauseVideo();
    } catch (_) {}
  }

  audio.removeEventListener("timeupdate", stopFragment);
  audio.pause();

  restoreMainMusic();

  currentGameSong = null;
  currentOptions = [];
  currentCorrectAnswer = "";
  currentRoundActive = true;

  incrementarPartida()
    .then((result) => handleUnlockedAchievements(result))
    .catch((err) => console.warn("Error al incrementar partida:", err));
}

// ✅ CORREGIDO: Evita inyectar strings corruptos a audio.src al salir
function restoreMainMusic() {
  if (savedQueue && savedQueue.length > 0) {
    setQueue(savedQueue, savedQueueIndex);

    if (wasPlayingBeforeGame) {
      // Usamos el core de reproducción inteligente que tú programaste para la SPA
      playActiveSong()
        .then(() => {
          // Si el track recuperado es local, le restauramos el tiempo exacto donde quedó
          const currentSong = savedQueue[savedQueueIndex];
          if (currentSong && currentSong.file && !currentSong.file.startsWith("youtube:")) {
            audio.currentTime = savedCurrentTime;
          }
        })
        .catch((err) => console.warn("Error al restaurar música asíncrona:", err));
    } else {
      if (typeof updatePlayingUIs === "function") {
        updatePlayingUIs(false);
      }
    }
  } else {
    audio.src = "";
    audio.load();
  }

  updateMiniPlayerStatus(false);
}

// ==================== MANEJO DEL MINI REPRODUCTOR ====================
export function updateMiniPlayerStatus(isGameActive) {
  const miniPlayer = document.getElementById("miniPlayer");
  if (!miniPlayer) return;

  // Eliminar cualquier mensaje residual
  const oldStatus = document.getElementById("gameStatusMessage");
  if (oldStatus) oldStatus.remove();

  if (isGameActive) {
    miniPlayer.classList.add("hidden");
  } else {
    miniPlayer.classList.remove("hidden");
  }
}

// ==================== OBTENER TODAS LAS CANCIONES ====================
function getAllSongs() {
  const albums = window.albumsFromDB || [];
  const allSongs = [];

  albums.forEach((album) => {
    if (album.songs && Array.isArray(album.songs)) {
      album.songs.forEach((song) => {
        let coverUrl = album.caratula_url || album.cover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";
        allSongs.push({
          ...song,
          trackTitle: song.trackTitle,
          file: song.file || song.archivo_url || null,
          artistName: song.artistName || album.artist,
          albumCover: coverUrl,
          albumTitle: album.title,
          albumId: album.id_album,
          id_cancion: song.id_cancion,
        });
      });
    }
  });

  if (state.importedSongs && Array.isArray(state.importedSongs)) {
    state.importedSongs.forEach((song) => {
      if (song.file && song.file !== "null" && song.file !== "") {
        allSongs.push({
          ...song,
          trackTitle: song.trackTitle,
          file: song.file,
          artistName: song.artistName || "Importado",
          albumCover: song.albumCover || "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=500",
          albumTitle: "Importados",
          albumId: null,
          id_cancion: song.id_cancion,
        });
      }
    });
  }

  return allSongs;
}

// ==================== OBTENER UNA CANCIÓN VÁLIDA ====================
async function getValidSong(maxAttempts = 15) {
  const allSongs = getAllSongs();
  if (allSongs.length === 0) return null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    const candidate = allSongs[randomIndex];
    const url = candidate.file || candidate.archivo_url;

    if (url && url !== "null" && url !== "") {
      return candidate;
    }

    if (candidate.id_cancion) {
      try {
        const cacheResult = await checkYouTubeCache(candidate.id_cancion);
        if (cacheResult && cacheResult.success && cacheResult.cached && cacheResult.youtube_id) {
          candidate.file = "youtube:" + cacheResult.youtube_id;
          candidate.archivo_url = "youtube:" + cacheResult.youtube_id;
          return candidate;
        }
      } catch (error) {}
    }
  }
  return null;
}

// ==================== LÓGICA DEL JUEGO ====================
async function loadNewRound() {
  const container = document.querySelector(".game-container");
  if (container) container.style.opacity = "0";

  setTimeout(async () => {
    if (gameMessage) {
      gameMessage.innerText = "";
      gameMessage.className = "";
    }
    enableOptions(true);
    if (gameNextBtn) gameNextBtn.disabled = false;
    currentRoundActive = true;

    const song = await getValidSong();

    if (!song) {
      if (gameMessage) {
        gameMessage.innerText = "🎵 No hay canciones disponibles en caché o MP3 locales.";
        gameMessage.classList.add("info-msg");
      }
      if (container) container.style.opacity = "1";
      if (gameNextBtn) gameNextBtn.disabled = true;
      return;
    }

    if (previousSongId === song.file && getAllSongs().length > 1) {
      await loadNewRound();
      return;
    }

    currentGameSong = song;
    previousSongId = song.file;
    currentCorrectAnswer = song.trackTitle;

    if (gameCover) {
      gameCover.src = song.albumCover;
    }

    const allSongs = getAllSongs();
    const incorrectOptions = generateIncorrectOptions(allSongs, song.file);
    currentOptions = [currentCorrectAnswer, ...incorrectOptions];
    shuffleArray(currentOptions);

    renderOptions();
    await playFragment();

    if (container) container.style.opacity = "1";
  }, 200);
}

function generateIncorrectOptions(allSongs, currentFile) {
  const incorrect = [];
  const otherSongs = allSongs.filter((s) => s.file !== currentFile);

  for (let i = 0; i < 2 && otherSongs.length > 0; i++) {
    const rand = Math.floor(Math.random() * otherSongs.length);
    if (!incorrect.includes(otherSongs[rand].trackTitle) && otherSongs[rand].trackTitle !== currentCorrectAnswer) {
      incorrect.push(otherSongs[rand].trackTitle);
    }
    otherSongs.splice(rand, 1);
  }

  while (incorrect.length < 2) {
    incorrect.push("???");
  }

  return incorrect;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ==================== UI DEL JUEGO ====================
function renderOptions() {
  if (!gameOptionsContainer) return;
  gameOptionsContainer.innerHTML = "";

  currentOptions.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "game-option-btn";
    btn.innerText = option;
    btn.addEventListener("click", () => checkAnswer(btn, option));
    gameOptionsContainer.appendChild(btn);
  });
}

function enableOptions(enable) {
  const btns = document.querySelectorAll(".game-option-btn");
  btns.forEach((btn) => {
    if (enable) {
      btn.disabled = false;
      btn.classList.remove("correct", "incorrect");
    } else {
      btn.disabled = true;
    }
  });
}

function updateScore() {
  if (gameScore) gameScore.innerText = `Puntuación: ${score}`;
}

// ==================== REPRODUCCIÓN DEL FRAGMENTO HÍBRIDO ====================
async function playFragment() {
  if (currentPlayPromise) {
    audio.pause();
    try {
      await currentPlayPromise;
    } catch (_) {}
    currentPlayPromise = null;
  }

  // Detener de golpe cualquier residuo de YouTube antes de empezar la ronda
  if (youtubePlayer && youtubeReady) {
    try {
      youtubePlayer.pauseVideo();
    } catch (_) {}
  }

  audio.pause();
  audio.removeEventListener("timeupdate", stopFragment);

  const song = currentGameSong;
  const url = song.file || song.archivo_url;

  // ✅ CASO 1: Procesar reproducción con el Iframe de YouTube
  if (url && url.startsWith("youtube:")) {
    const videoId = url.replace("youtube:", "");

    if (!youtubePlayer || !youtubeReady) {
      if (gameMessage) {
        gameMessage.innerText = "❌ El Frame de YouTube no responde. Saltando ronda.";
        gameMessage.className = "incorrect-msg";
      }
      return;
    }

    // Cargar fragmento desde el segundo 0
    youtubePlayer.loadVideoById({ videoId: videoId, startSeconds: 0 });
    youtubePlayer.playVideo();

    if (gamePlayingIndicator) gamePlayingIndicator.style.display = "flex";

    if (fragmentTimeout) clearTimeout(fragmentTimeout);
    fragmentTimeout = setTimeout(() => {
      if (youtubePlayer && youtubeReady) {
        try {
          youtubePlayer.pauseVideo();
        } catch (_) {}
      }
      if (gamePlayingIndicator) gamePlayingIndicator.style.display = "none";
    }, 10000);

    return;
  }

  // ✅ CASO 2: Procesar reproducción de archivo local MP3
  audio.src = url;
  audio.load();
  audio.currentTime = 0;

  try {
    currentPlayPromise = audio.play();
    await currentPlayPromise;
    currentPlayPromise = null;

    if (gamePlayingIndicator) gamePlayingIndicator.style.display = "flex";

    if (fragmentTimeout) clearTimeout(fragmentTimeout);
    fragmentTimeout = setTimeout(() => {
      if (!audio.paused) audio.pause();
      if (gamePlayingIndicator) gamePlayingIndicator.style.display = "none";
    }, 10000);

    audio.addEventListener("timeupdate", stopFragment);
  } catch (err) {
    console.warn("Error en reproducción local de la trivia:", err);
    currentPlayPromise = null;
    if (gamePlayingIndicator) gamePlayingIndicator.style.display = "none";
  }
}

function stopFragment() {
  if (audio.currentTime >= 10) {
    if (currentPlayPromise) {
      currentPlayPromise
        .then(() => {
          audio.pause();
          cleanup();
        })
        .catch(() => cleanup());
    } else {
      audio.pause();
      cleanup();
    }

    function cleanup() {
      if (fragmentTimeout) {
        clearTimeout(fragmentTimeout);
        fragmentTimeout = null;
      }
      if (gamePlayingIndicator) gamePlayingIndicator.style.display = "none";
      audio.removeEventListener("timeupdate", stopFragment);
    }
  }
}

// ==================== VERIFICACIÓN DE RESPUESTA ====================
function checkAnswer(btn, selected) {
  if (!currentRoundActive) return;
  currentRoundActive = false;
  enableOptions(false);

  // Forzar pausa del audio (sea YouTube o local) al responder para comodidad del usuario
  if (youtubePlayer && youtubeReady) {
    try {
      youtubePlayer.pauseVideo();
    } catch (_) {}
  }
  audio.pause();

  const isCorrect = selected === currentCorrectAnswer;

  if (isCorrect) {
    score++;
    updateScore();
    addXpForAction("game_win");
    btn.classList.add("correct");

    // ✅ TU LÓGICA DE PUENTE: Inyectar la canción en tu cola (Play Next)
    injectSongIntoMainQueue(currentGameSong);

    if (gameMessage) {
      gameMessage.innerHTML = `✅ ¡Correcto! <span style="display:block; font-size:11px; opacity:0.7; margin-top:4px;">Se añadió a continuación en tu Cola</span>`;
      gameMessage.className = "correct-msg";
    }
    playBeep("correct");
    launchConfetti();
  } else {
    btn.classList.add("incorrect");
    const btns = document.querySelectorAll(".game-option-btn");
    btns.forEach((b) => {
      if (b.innerText === currentCorrectAnswer) b.classList.add("correct");
    });
    if (gameMessage) {
      gameMessage.innerText = `❌ Incorrecto. Era "${currentCorrectAnswer}".`;
      gameMessage.className = "incorrect-msg";
    }
    playBeep("wrong");
    btn.style.transform = "translateX(4px)";
    setTimeout(() => {
      btn.style.transform = "";
    }, 150);
  }
}

// ✅ TU LÓGICA DE COLA: Inserción limpia utilizando arreglos nativos en la cola salvada
function injectSongIntoMainQueue(song) {
  if (savedQueue && savedQueue.length > 0) {
    const nextIndex = savedQueueIndex + 1;

    // Evitar meter el mismo track duplicado seguido si ya estaba programado
    const alreadyNext = savedQueue[nextIndex];
    if (alreadyNext && alreadyNext.id_cancion === song.id_cancion) return;

    savedQueue.splice(nextIndex, 0, song);
  } else {
    savedQueue = [song];
    savedQueueIndex = 0;
  }
}

// ==================== SIGUIENTE RONDA ====================
export function nextRound() {
  // Detener YouTube si está reproduciendo
  if (youtubePlayer && youtubeReady) {
    try {
      youtubePlayer.pauseVideo();
    } catch (_) {}
  }

  if (fragmentTimeout) {
    clearTimeout(fragmentTimeout);
    fragmentTimeout = null;
  }
  audio.pause();
  audio.removeEventListener("timeupdate", stopFragment);
  if (gamePlayingIndicator) {
    gamePlayingIndicator.style.display = "none";
  }

  // ✅ Mantener el mini reproductor oculto mientras el juego está activo
  updateMiniPlayerStatus(true);

  loadNewRound();
}
