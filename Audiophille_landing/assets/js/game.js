// js/game.js
import { audio, isPlaying, queue, queueIndex, playActiveSong, setQueue } from "./audio.js";
import { state } from "./var.js";
import { setGameKeyboardMode } from "./keyboard.js";
import { addXpForAction } from "./achievements.js";
import { incrementarPartida } from "./services/gameService.js";
import { notifyAchievementUnlock, loadAchievements } from "./achievements.js";
import { getAchievements } from "./services/achievementService.js";

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
export function startGame() {
  setGameKeyboardMode(true);

  const hasQueue = queue && queue.length > 0;
  const isSongPlaying = isPlaying || !audio.paused;

  if (hasQueue && queue[queueIndex]) {
    wasPlayingBeforeGame = isSongPlaying;
    savedQueue = [...queue];
    savedQueueIndex = queueIndex;
    savedCurrentTime = audio.currentTime || 0;

    if (isSongPlaying) {
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
  loadNewRound();
}

export function stopGame() {
  setGameKeyboardMode(false);

  if (fragmentTimeout) {
    clearTimeout(fragmentTimeout);
    fragmentTimeout = null;
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

function restoreMainMusic() {
  if (savedQueue && savedQueue.length > 0) {
    setQueue(savedQueue, savedQueueIndex);

    const song = savedQueue[savedQueueIndex];
    if (song && song.file) {
      audio.src = song.file;
      audio.load();

      const onCanPlay = () => {
        audio.removeEventListener("canplay", onCanPlay);
        audio.currentTime = savedCurrentTime;

        if (wasPlayingBeforeGame) {
          audio.play().catch((err) => {
            console.warn("Error al reanudar:", err);
          });
        } else {
          audio.pause();
          if (typeof updatePlayingUIs === "function") {
            updatePlayingUIs(false);
          }
        }
      };

      audio.addEventListener("canplay", onCanPlay);
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

  const oldStatus = document.getElementById("gameStatusMessage");
  if (oldStatus) oldStatus.remove();

  if (isGameActive) {
    miniPlayer.classList.add("hidden");

    const statusMsg = document.createElement("div");
    statusMsg.id = "gameStatusMessage";
    statusMsg.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(168, 85, 247, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 30px;
      font-weight: 600;
      font-size: 14px;
      z-index: 9999;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(168, 85, 247, 0.3);
      animation: pulseGlow 2s infinite;
    `;
    statusMsg.innerHTML = `🎮 <span style="font-weight:700;">Juego activo</span> · La música está en pausa · <span style="opacity:0.8;font-weight:400;">Usa el mouse para jugar</span>`;
    document.body.appendChild(statusMsg);

    if (!document.getElementById("gameStatusStyles")) {
      const style = document.createElement("style");
      style.id = "gameStatusStyles";
      style.textContent = `
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 8px 32px rgba(168, 85, 247, 0.3); }
          50% { box-shadow: 0 8px 32px rgba(168, 85, 247, 0.6); }
        }
      `;
      document.head.appendChild(style);
    }
  } else {
    miniPlayer.classList.remove("hidden");
  }
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

    const allSongs = getAllSongs();

    if (allSongs.length === 0) {
      if (gameMessage) gameMessage.innerText = "No hay canciones. Importa alguna.";
      if (container) container.style.opacity = "1";
      return;
    }

    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * allSongs.length);
    } while (previousSongId === allSongs[randomIndex].file && allSongs.length > 1);

    currentGameSong = allSongs[randomIndex];
    previousSongId = currentGameSong.file;
    currentCorrectAnswer = currentGameSong.trackTitle;

    if (gameCover) {
      const coverUrl = currentGameSong.albumCover || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";
      gameCover.src = coverUrl;
    }

    const incorrectOptions = generateIncorrectOptions(allSongs, currentGameSong.file);
    currentOptions = [currentCorrectAnswer, ...incorrectOptions];
    shuffleArray(currentOptions);

    renderOptions();
    await playFragment();

    if (container) container.style.opacity = "1";
  }, 200);
}

function getAllSongs() {
  const albums = window.albumsFromDB || [];
  const allSongs = [];

  albums.forEach((album) => {
    if (album.songs && Array.isArray(album.songs)) {
      album.songs.forEach((song) => {
        let coverUrl = album.caratula_url || album.cover;

        if (!coverUrl || coverUrl === "" || coverUrl === "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400") {
          if (album.id_album) {
            coverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";
          }
          coverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";
        }

        allSongs.push({
          ...song,
          trackTitle: song.trackTitle,
          file: song.file || song.archivo_url,
          artistName: song.artistName || album.artist,
          albumCover: coverUrl,
          albumTitle: album.title,
          albumId: album.id_album,
        });
      });
    }
  });

  if (state.importedSongs && Array.isArray(state.importedSongs)) {
    state.importedSongs.forEach((song) => {
      allSongs.push({
        ...song,
        trackTitle: song.trackTitle,
        file: song.file || song.archivo_url,
        artistName: song.artistName || "Importado",
        albumCover: song.albumCover || "https://images.unsplash.com/photo-1487180142328-0c4e37023af5?q=80&w=500",
      });
    });
  }

  return allSongs;
}

function generateIncorrectOptions(allSongs, currentFile) {
  const incorrect = [];
  const otherSongs = allSongs.filter((s) => s.file !== currentFile);

  for (let i = 0; i < 2 && otherSongs.length > 0; i++) {
    const rand = Math.floor(Math.random() * otherSongs.length);
    incorrect.push(otherSongs[rand].trackTitle);
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

// ==================== REPRODUCCIÓN DEL FRAGMENTO ====================
async function playFragment() {
  if (currentPlayPromise) {
    audio.pause();
    try {
      await currentPlayPromise;
    } catch (_) {}
    currentPlayPromise = null;
  }

  audio.pause();
  audio.removeEventListener("timeupdate", stopFragment);
  audio.src = currentGameSong.file;
  audio.load();
  audio.currentTime = 0;

  try {
    currentPlayPromise = audio.play();
    await currentPlayPromise;
    currentPlayPromise = null;

    if (gamePlayingIndicator) {
      gamePlayingIndicator.style.display = "flex";
    }

    if (fragmentTimeout) {
      clearTimeout(fragmentTimeout);
    }

    fragmentTimeout = setTimeout(() => {
      if (!audio.paused) audio.pause();
      if (gamePlayingIndicator) {
        gamePlayingIndicator.style.display = "none";
      }
    }, 10000);

    audio.addEventListener("timeupdate", stopFragment);
  } catch (err) {
    console.warn("Error al reproducir fragmento:", err);
    currentPlayPromise = null;
    if (gamePlayingIndicator) {
      gamePlayingIndicator.style.display = "none";
    }
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
      if (gamePlayingIndicator) {
        gamePlayingIndicator.style.display = "none";
      }
      audio.removeEventListener("timeupdate", stopFragment);
    }
  }
}

// ==================== VERIFICACIÓN DE RESPUESTA ====================
function checkAnswer(btn, selected) {
  if (!currentRoundActive) return;
  currentRoundActive = false;
  enableOptions(false);

  const isCorrect = selected === currentCorrectAnswer;

  if (isCorrect) {
    score++;
    updateScore();
    addXpForAction("game_win");
    btn.classList.add("correct");
    if (gameMessage) {
      gameMessage.innerText = "✅ ¡Correcto!";
      gameMessage.classList.add("correct-msg");
    }
    playBeep("correct");
    launchConfetti();
  } else {
    btn.classList.add("incorrect");
    const btns = document.querySelectorAll(".game-option-btn");
    btns.forEach((b) => {
      if (b.innerText === currentCorrectAnswer) {
        b.classList.add("correct");
      }
    });
    if (gameMessage) {
      gameMessage.innerText = `❌ Incorrecto. Era "${currentCorrectAnswer}".`;
      gameMessage.classList.add("incorrect-msg");
    }
    playBeep("wrong");
    btn.style.transform = "translateX(4px)";
    setTimeout(() => {
      btn.style.transform = "";
    }, 150);
  }
}

// ==================== SIGUIENTE RONDA ====================
export function nextRound() {
  if (fragmentTimeout) {
    clearTimeout(fragmentTimeout);
    fragmentTimeout = null;
  }
  audio.pause();
  audio.removeEventListener("timeupdate", stopFragment);
  if (gamePlayingIndicator) {
    gamePlayingIndicator.style.display = "none";
  }
  loadNewRound();
}
