// js/keyboard.js
import { togglePlayPause, playNextTrack, playPrevTrack, toggleShuffle, toggleRepeat, toggleFavoriteStatus, audio } from "./audio.js";
import DOM from "./var.js";

let isGameActive = false;

export function setGameKeyboardMode(active) {
  isGameActive = active;
}

export function initKeyboardControls() {
  window.addEventListener("keydown", (e) => {
    if (isGameActive) {
      const gameKeys = ["Enter", " ", "ArrowLeft", "ArrowRight"];
      if (gameKeys.includes(e.key)) {
        return;
      }
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
        const newVolUp = Math.min(audio.volume + 0.05, 1);
        audio.volume = newVolUp;
        if (DOM.audioControls.volSlider) DOM.audioControls.volSlider.value = newVolUp * 100;
        break;
      case "ArrowDown":
        const newVolDown = Math.max(audio.volume - 0.05, 0);
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
    }
  });
}
