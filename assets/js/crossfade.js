// assets/js/crossfade.js

const defaultDuration = 3;
const minDuration = 1;
const maxDuration = 8;

/**
 * Obtiene el estado completo de la configuración del crossfade
 * @returns {{enabled: boolean, duration: number}}
 */
export function getCrossfadeState() {
  return {
    enabled: localStorage.getItem("crossfade_enabled") === "true",
    duration: getCrossfadeDuration(),
  };
}

/**
 * Guarda si el crossfade está activo o inactivo
 * @param {boolean} enabled
 */
export function setCrossfadeEnabled(enabled) {
  localStorage.setItem("crossfade_enabled", String(enabled));
}

/**
 * Define y limita la duración en segundos del crossfade
 * @param {number} seconds
 * @returns {number} Duración sanitizada y aplicada
 */
export function setCrossfadeDuration(seconds) {
  const clamped = Math.min(Math.max(parseFloat(seconds) || defaultDuration, minDuration), maxDuration);
  localStorage.setItem("crossfade_duration", String(clamped));
  return clamped;
}

/**
 * Obtiene la duración actual configurada en segundos
 * @returns {number} Segundos de transición
 */
export function getCrossfadeDuration() {
  const saved = parseFloat(localStorage.getItem("crossfade_duration"));
  return isNaN(saved) ? defaultDuration : saved;
}

/**
 * Verifica de forma rápida si el módulo de desvanecimiento está activo
 * @returns {boolean}
 */
export function isCrossfadeEnabled() {
  return localStorage.getItem("crossfade_enabled") === "true";
}

// ============================================================================
// Métodos Adaptados para la compatibilidad con el sistema de audio.js
// ============================================================================

/**
 * Retorna el porcentaje exacto de la pista donde se debe disparar el cambio
 * según la duración solicitada y el tiempo total del track activo.
 * @param {number} durationTotal - Duración en segundos de la canción actual
 * @returns {number} Porcentaje de activación (ej: 92.5)
 */
export function getTriggerPercentage(durationTotal) {
  if (!durationTotal || durationTotal <= minDuration) return 99; // Fallback extremo
  const crossfadeSeconds = getCrossfadeDuration();

  // No permitir que el crossfade consuma más del 30% de la pista completa
  const secureSeconds = Math.min(crossfadeSeconds, durationTotal * 0.3);

  const triggerTime = durationTotal - secureSeconds;
  return (triggerTime / durationTotal) * 100;
}
