// js/keyboard.js
import { togglePlayPause, playNextTrack, playPrevTrack, toggleShuffle, toggleRepeat, toggleFavoriteStatus, audio } from "./audio.js";
import DOM from "./var.js";

// ✅ Variable para saber si el juego está activo
let isGameActive = false;

// ✅ Función para activar/desactivar el modo juego
export function setGameKeyboardMode(active) {
  isGameActive = active;
  console.log(`🎮 Modo teclado del juego: ${active ? "ACTIVO" : "INACTIVO"}`);
}

export function initKeyboardControls() {
  window.addEventListener("keydown", (e) => {
    // ✅ Si el juego está activo, bloquear TODOS los atajos
    if (isGameActive) {
      // Solo permitir teclas específicas del juego (si las hay)
      const gameKeys = ["Enter", " ", "ArrowLeft", "ArrowRight"];
      if (gameKeys.includes(e.key)) {
        // Permitir estas teclas para el juego (opcional)
        return;
      }
      // Bloquear el resto
      e.preventDefault();
      return;
    }

    const activeTag = document.activeElement?.tagName;
    if (activeTag === "INPUT" || activeTag === "TEXTAREA" || document.activeElement?.id === "musikInput") return;

    const preventKeys = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "s", "S", "r", "R", "f", "F"];
    if (preventKeys.includes(e.key)) e.preventDefault();

    switch (e.key) {
      case " ":
      case "Space":
        togglePlayPause();
        break;
      case "ArrowLeft":
        playPrevTrack();
        break;
      case "ArrowRight":
        playNextTrack();
        break;
      case "ArrowUp":
        let newVolUp = Math.min(audio.volume + 0.05, 1);
        audio.volume = newVolUp;
        if (DOM.audioControls.volSlider) DOM.audioControls.volSlider.value = newVolUp * 100;
        break;
      case "ArrowDown":
        let newVolDown = Math.max(audio.volume - 0.05, 0);
        audio.volume = newVolDown;
        if (DOM.audioControls.volSlider) DOM.audioControls.volSlider.value = newVolDown * 100;
        break;
      case "s":
      case "S":
        toggleShuffle();
        break;
      case "r":
      case "R":
        toggleRepeat();
        break;
      case "f":
      case "F":
        toggleFavoriteStatus();
        break;
      default:
        break;
    }
  });
}
