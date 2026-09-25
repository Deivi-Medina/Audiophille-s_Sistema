// helpers/loading.js
export function setLoading(button, isLoading, loadingText = "Cargando...") {
  if (!button) return;

  if (isLoading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.classList.add("btn-loading");
    button.innerHTML = `<span class="spinner"></span> ${loadingText}`;
  } else {
    button.disabled = false;
    button.classList.remove("btn-loading");
    button.textContent = button.dataset.originalText || button.textContent;
  }
}
