// js/reviews.js
import { showAlert, showConfirm } from "./modals.js";
import { getReviews, saveReview, deleteReview, updateReview, getTopArtist } from "./services/reviewService.js";
import { setLoading } from "./helpers/loading.js";
import { addXpForAction } from "./achievements.js";

let reviews = [];
let currentRating = 5;
let currentIntegratedRating = 5;
let currentTab = "current";
let diarySortMethod = "recent";
let diarySearchQuery = "";
let diaryFilterOnlyRewatched = false;
let isIntegratedRewatchActive = false;

let editingReviewId = null;
let currentEditingRating = 5;
let isEditingRewatchActive = false;

let getPlayingTrackGlobal = null;
let getAllTracksInLibraryGlobal = null;

export async function loadReviewsFromAPI() {
  try {
    const data = await getReviews();
    if (data.success) {
      reviews = data.reviews.map((r) => ({
        id_review: r.id_review,
        trackTitle: r.titulo_cancion_texto,
        artistName: r.artista_texto,
        albumCover: r.albumCover || "",
        rating: parseFloat(r.puntuacion) || 0,
        text: r.comentario,
        rewatch: r.escuchada_nuevamente === 1,
        timestamp: new Date(r.fecha).getTime(),
      }));
      window.reviews = reviews;
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error cargando reseñas:", e);
    return false;
  }
}

async function saveReviewToAPI(trackTitle, artistName, albumCover, rating, text, rewatch, id_cancion) {
  try {
    const data = await saveReview(id_cancion, rating, text, rewatch, trackTitle, artistName);
    addXpForAction("review");
    if (data.success) {
      await loadReviewsFromAPI();
      window.reviews = reviews;
      return true;
    } else {
      await showAlert(data.message || "Error al guardar reseña", "Error");
      return false;
    }
  } catch (e) {
    console.error(e);
    await showAlert("Error de conexión", "Error");
    return false;
  }
}

async function deleteReviewFromAPI(id_review) {
  try {
    const data = await deleteReview(id_review);
    if (data.success) {
      await loadReviewsFromAPI();
      window.reviews = reviews;
      return true;
    }
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function updateReviewInAPI(id_review, rating, text, rewatch) {
  try {
    const data = await updateReview(id_review, rating, text, rewatch);
    if (data.success) {
      await loadReviewsFromAPI();
      window.reviews = reviews;
      return true;
    }
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}

function updateStateStats() {
  const totalEl = document.getElementById("statTotalReviews");
  const avgEl = document.getElementById("statAvgRating");
  const favArtistEl = document.getElementById("statFavArtist");

  if (totalEl) totalEl.innerText = reviews.length;

  if (avgEl) {
    if (reviews.length === 0) {
      avgEl.innerText = "0.0 ★";
    } else {
      let sum = 0;
      let validCount = 0;
      reviews.forEach((r) => {
        const rating = Number(r.rating);
        if (!isNaN(rating)) {
          sum += rating;
          validCount++;
        }
      });
      const avg = validCount > 0 ? sum / validCount : 0;
      avgEl.innerText = `${avg.toFixed(1)} ★`;
    }
  }

  if (favArtistEl) {
    if (reviews.length === 0) {
      favArtistEl.innerText = "Ninguno";
      return;
    }

    const artistStats = {};
    reviews.forEach((r) => {
      const art = r.artistName || "Desconocido";
      if (!artistStats[art]) {
        artistStats[art] = { count: 0, totalRating: 0, ratings: [] };
      }
      artistStats[art].count += 1;
      artistStats[art].totalRating += Number(r.rating) || 0;
      artistStats[art].ratings.push(Number(r.rating) || 0);
    });

    let bestArtist = "Ninguno";
    let bestScore = -1;

    for (const [artist, stats] of Object.entries(artistStats)) {
      const avgRating = stats.totalRating / stats.count;
      const score = stats.count * 2 + avgRating * 3;
      if (score > bestScore) {
        bestScore = score;
        bestArtist = artist;
      }
    }

    favArtistEl.innerText = bestArtist;
  }
}

function applyStarHoverEffect(starElement) {
  if (!starElement) return;
  starElement.addEventListener("mouseenter", () => {
    starElement.style.transform = "scale(1.35) rotate(4deg)";
    starElement.style.filter = "drop-shadow(0 0 8px rgba(250, 204, 21, 0.6))";
    starElement.style.transition = "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease";
  });
  starElement.addEventListener("mouseleave", () => {
    starElement.style.transform = "";
    starElement.style.filter = "";
  });
}

function setupStarHoverEffects(container) {
  if (!container) return;
  const stars = container.querySelectorAll("i[data-value]");
  stars.forEach((star) => {
    const svg = star.querySelector("svg");
    if (svg) applyStarHoverEffect(svg);
    else applyStarHoverEffect(star);
  });
}

function highlightStars(rating) {
  const starContainer = document.getElementById("reviewRatingStars");
  if (!starContainer) return;
  const stars = starContainer.querySelectorAll("[data-value]");
  stars.forEach((star) => {
    const val = parseInt(star.getAttribute("data-value") || "0");
    if (val <= Math.floor(rating)) {
      star.setAttribute("fill", "#ffd700");
      star.style.color = "#ffd700";
      star.style.clipPath = "none";
    } else if (val === Math.ceil(rating) && rating % 1 !== 0) {
      star.setAttribute("fill", "#ffd700");
      star.style.color = "#ffd700";
      star.style.clipPath = "polygon(0 0, 50% 0, 50% 100%, 0% 100%)";
    } else {
      star.setAttribute("fill", "none");
      star.style.color = "var(--text-secondary)";
      star.style.clipPath = "none";
    }
  });
  setupStarHoverEffects(starContainer);
}

function highlightIntegratedStars(rating) {
  const starContainer = document.getElementById("integratedRatingStars");
  if (!starContainer) return;
  const stars = starContainer.querySelectorAll("[data-value]");
  stars.forEach((star) => {
    const val = parseInt(star.getAttribute("data-value") || "0");
    if (val <= Math.floor(rating)) {
      star.setAttribute("fill", "#ffd700");
      star.style.color = "#ffd700";
      star.style.clipPath = "none";
    } else if (val === Math.ceil(rating) && rating % 1 !== 0) {
      star.setAttribute("fill", "#ffd700");
      star.style.color = "#ffd700";
      star.style.clipPath = "polygon(0 0, 50% 0, 50% 100%, 0% 100%)";
    } else {
      star.setAttribute("fill", "none");
      star.style.color = "var(--text-secondary)";
      star.style.clipPath = "none";
    }
  });
  setupStarHoverEffects(starContainer);
}

function highlightEditStars(rating) {
  const starContainer = document.getElementById("editReviewStars");
  if (!starContainer) return;
  const stars = starContainer.querySelectorAll("[data-value]");
  stars.forEach((star) => {
    const val = parseInt(star.getAttribute("data-value") || "0");
    if (val <= Math.floor(rating)) {
      star.setAttribute("fill", "#ffd700");
      star.style.color = "#ffd700";
      star.style.clipPath = "none";
    } else if (val === Math.ceil(rating) && rating % 1 !== 0) {
      star.setAttribute("fill", "#ffd700");
      star.style.color = "#ffd700";
      star.style.clipPath = "polygon(0 0, 50% 0, 50% 100%, 0% 100%)";
    } else {
      star.setAttribute("fill", "none");
      star.style.color = "var(--text-secondary)";
      star.style.clipPath = "none";
    }
  });
  setupStarHoverEffects(starContainer);
}

function generarEstrellas(rating, rewatch) {
  let starsHTML = "";
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      starsHTML += `<i data-lucide="star" fill="#ffd700" style="color: #ffd700; width: 14px; height: 14px;"></i>`;
    } else if (i === fullStars + 1 && hasHalf) {
      starsHTML += `<span style="position:relative; display:inline-block; width:14px; height:14px;">
                <i data-lucide="star" style="color:rgba(255,255,255,0.15); width:14px; height:14px; position:absolute; left:0; top:0;"></i>
                <span style="position:absolute; left:0; top:0; width:50%; overflow:hidden;">
                    <i data-lucide="star" fill="#ffd700" style="color:#ffd700; width:14px; height:14px;"></i>
                </span>
            </span>`;
    } else {
      starsHTML += `<i data-lucide="star" style="color:rgba(255,255,255,0.15); width:14px; height:14px;"></i>`;
    }
  }
  if (rewatch) {
    starsHTML += `<i data-lucide="repeat" style="color:#00e054; width:14px; height:14px; margin-left:6px;" title="Re-escuchada"></i>`;
  }
  return starsHTML;
}

function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} m`;
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${days} d`;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

export function selectTrackInComposerDropdown(trackTitle) {
  const selectEl = document.getElementById("diarySongSelector");
  if (!selectEl) return;
  for (let i = 0; i < selectEl.options.length; i++) {
    try {
      const optVal = JSON.parse(selectEl.options[i].value);
      if (optVal.trackTitle.toLowerCase() === trackTitle.toLowerCase()) {
        selectEl.selectedIndex = i;
        break;
      }
    } catch (_) {}
  }
}

export function updateDiarySongsSelector() {
  const selector = document.getElementById("diarySongSelector");
  if (!selector || !getAllTracksInLibraryGlobal) return;
  selector.innerHTML = "";
  const tracksList = getAllTracksInLibraryGlobal();
  if (tracksList.length === 0) {
    const opt = document.createElement("option");
    opt.innerText = "No hay canciones cargadas.";
    opt.value = "";
    selector.appendChild(opt);
    return;
  }
  tracksList.forEach((t) => {
    const opt = document.createElement("option");
    opt.value = JSON.stringify({
      trackTitle: t.trackTitle,
      artistName: t.artistName,
      albumCover: t.albumCover,
      id_cancion: t.id_cancion,
    });
    opt.innerText = `${t.trackTitle} - ${t.artistName}`;
    selector.appendChild(opt);
  });
}

export function renderIntegratedDiaryFeed() {
  updateStateStats();
  const container = document.getElementById("integratedDiaryList");
  if (!container) return;
  container.innerHTML = "";

  let displayList = [...reviews];
  if (diarySearchQuery) {
    const q = diarySearchQuery.toLowerCase().trim();
    displayList = displayList.filter(
      (r) =>
        (r.trackTitle && r.trackTitle.toLowerCase().includes(q)) ||
        (r.artistName && r.artistName.toLowerCase().includes(q)) ||
        (r.text && r.text.toLowerCase().includes(q)),
    );
  }
  if (diaryFilterOnlyRewatched) displayList = displayList.filter((r) => r.rewatch);
  if (diarySortMethod === "rating") displayList.sort((a, b) => b.rating - a.rating || b.timestamp - a.timestamp);
  else displayList.sort((a, b) => b.timestamp - a.timestamp);

  if (displayList.length === 0) {
    container.innerHTML = `<div style="padding: 60px 20px; text-align: center; color: var(--text-secondary); background: rgba(255,255,255,0.01); border: 1px dashed var(--glass-border); border-radius: 16px;">
            <i data-lucide="book-open" style="width: 40px; height: 40px; margin-bottom: 12px; opacity: 0.3; color: var(--blue-accent);"></i>
            <h4 style="font-size: 16px; color:#fff; font-weight: 600;">Ninguna coincidencia encontrada</h4>
            <p style="font-size: 13px; margin-top: 4px;">Prueba ajustando tus filtros o escribe una nueva crítica.</p>
        </div>`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  displayList.forEach((rev) => {
    const starsHTML = generarEstrellas(rev.rating, rev.rewatch);
    const dateStr = formatTimeAgo(rev.timestamp);
    const item = document.createElement("div");
    item.className = "review-item";
    item.style.cssText =
      "background: rgba(10, 10, 15, 0.4); border-radius: 16px; padding: 20px; border: 1px solid var(--glass-border); display: grid; grid-template-columns: 56px 1fr; gap: 16px;";
    item.innerHTML = `
            <img src="${rev.albumCover || "https://via.placeholder.com/56"}" style="width:56px; height:56px; border-radius:10px; object-fit:cover; border:1px solid rgba(255,255,255,0.08);" onerror="this.src='https://via.placeholder.com/56'">
            <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
                    <div>
                        <h4 style="font-size:15px; font-weight:700; color:#fff;">${escapeHtml(rev.trackTitle)}</h4>
                        <p style="font-size:12px; color:var(--text-secondary);">de <span style="color:#fff;">${escapeHtml(rev.artistName)}</span></p>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:11px; background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:12px;">${dateStr}</span>
                        <button class="btn-edit-integrated-review" data-id="${rev.id_review}" style="background:none; border:none; color:rgba(0,122,255,0.7); cursor:pointer; padding:6px; border-radius:50%;"><i data-lucide="pencil" style="width:14px; height:14px;"></i></button>
                        <button class="btn-delete-integrated-review" data-id="${rev.id_review}" style="background:none; border:none; color:rgba(255,69,58,0.5); cursor:pointer; padding:6px; border-radius:50%;"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>
                    </div>
                </div>
                <div style="display:flex; gap:2px; align-items:center;">${starsHTML}</div>
                <p style="font-size:13.5px; color:#e4e4e7; line-height:1.6; border-left:2px solid var(--blue-accent); padding-left:12px;">${escapeHtml(rev.text)}</p>
            </div>
        `;
    item.querySelector(".btn-delete-integrated-review")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      setLoading(btn, true, "Eliminando...");
      try {
        if (await showConfirm("¿Eliminar esta reseña?", "Eliminar", "Eliminar", "Cancelar", true)) {
          await deleteReviewFromAPI(rev.id_review);
          renderIntegratedDiaryFeed();
          if (getPlayingTrackGlobal) renderReviews(getPlayingTrackGlobal());
        }
      } finally {
        setLoading(btn, false);
      }
    });
    item.querySelector(".btn-edit-integrated-review")?.addEventListener("click", (e) => {
      e.stopPropagation();
      window.openEditReviewModal(rev.id_review);
    });
    container.appendChild(item);
  });
  if (window.lucide) window.lucide.createIcons();
  document.querySelectorAll(".diary-stars-input, #integratedRatingStars").forEach((cont) => setupStarHoverEffects(cont));
}

export function renderReviews(playingTrack) {
  const container = document.getElementById("reviewsList");
  if (!container) return;
  container.innerHTML = "";
  let filtered = [];
  if (currentTab === "current") {
    if (!playingTrack) {
      container.innerHTML = `<div style="padding:30px; text-align:center; color:var(--text-secondary);">Reproduce una canción para ver sus críticas.</div>`;
      if (window.lucide) window.lucide.createIcons();
      return;
    }
    filtered = reviews.filter((r) => r.trackTitle.toLowerCase() === playingTrack.trackTitle.toLowerCase());
  } else {
    filtered = reviews;
  }
  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding:30px; text-align:center; color:var(--text-secondary);">Aún no hay críticas. ¡Sé el primero!</div>`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }
  filtered.forEach((rev) => {
    let starHTML = "";
    const fullStars = Math.floor(rev.rating);
    const hasHalf = rev.rating % 1 !== 0;
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) starHTML += `<i data-lucide="star" fill="#ffd700" style="color:#ffd700; width:12px; height:12px;"></i>`;
      else if (i === fullStars + 1 && hasHalf)
        starHTML += `<span style="position:relative; display:inline-block; width:12px; height:12px;">
                <i data-lucide="star" style="color:rgba(255,255,255,0.15); width:12px; height:12px; position:absolute; left:0; top:0;"></i>
                <span style="position:absolute; left:0; top:0; width:50%; overflow:hidden;">
                    <i data-lucide="star" fill="#ffd700" style="color:#ffd700; width:12px; height:12px;"></i>
                </span>
            </span>`;
      else starHTML += `<i data-lucide="star" style="color:rgba(255,255,255,0.2); width:12px; height:12px;"></i>`;
    }
    if (rev.rewatch)
      starHTML += `<i data-lucide="repeat" style="color:#00e054; width:12px; height:12px; margin-left:4px;" title="Re-escuchada"></i>`;
    const timeStr = formatTimeAgo(rev.timestamp);
    const item = document.createElement("div");
    item.className = "review-item";
    item.style.cssText =
      "background: rgba(255,255,255,0.03); border-radius: 10px; padding: 10px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 6px;";
    item.innerHTML = `
            <div style="display:flex; gap:8px; align-items:center;">
                <img src="${rev.albumCover || "https://via.placeholder.com/32"}" style="width:32px; height:32px; border-radius:6px; object-fit:cover;" onerror="this.src='https://via.placeholder.com/32'">
                <div style="flex:1; overflow:hidden;">
                    <h4 style="font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:white;">${escapeHtml(rev.trackTitle)}</h4>
                    <p style="font-size:11px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(rev.artistName)}</p>
                </div>
                <div style="display:flex; gap:4px;">
                    <button class="btn-edit-review" data-id="${rev.id_review}" style="background:none; border:none; color:rgba(0,122,255,0.8); cursor:pointer; padding:4px; border-radius:50%;"><i data-lucide="pencil" style="width:12px; height:12px;"></i></button>
                    <button class="btn-delete-review" data-id="${rev.id_review}" style="background:none; border:none; color:rgba(255,69,58,0.6); cursor:pointer; padding:4px; border-radius:50%;"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; gap:2px;">${starHTML}</div>
                <span style="font-size:10px; color:var(--text-secondary);">${timeStr}</span>
            </div>
            <p style="font-size:12px; color:#e4e4e7; line-height:1.4;">${escapeHtml(rev.text)}</p>
        `;
    item.querySelector(".btn-delete-review")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      setLoading(btn, true, "Eliminando...");
      try {
        if (await showConfirm("¿Eliminar esta reseña?", "Eliminar", "Eliminar", "Cancelar", true)) {
          await deleteReviewFromAPI(rev.id_review);
          renderReviews(playingTrack);
          renderIntegratedDiaryFeed();
        }
      } finally {
        setLoading(btn, false);
      }
    });
    item.querySelector(".btn-edit-review")?.addEventListener("click", (e) => {
      e.stopPropagation();
      window.openEditReviewModal(rev.id_review);
    });
    container.appendChild(item);
  });
  if (window.lucide) window.lucide.createIcons();
  const sidebarStars = document.getElementById("reviewRatingStars");
  if (sidebarStars) setupStarHoverEffects(sidebarStars);
}

export async function initReviewsSystem(getPlayingTrackFn, getAllTracksInLibraryFn) {
  getPlayingTrackGlobal = getPlayingTrackFn;
  getAllTracksInLibraryGlobal = getAllTracksInLibraryFn;

  await loadReviewsFromAPI();
  window.reviews = reviews;

  const btnToggleReviews = document.getElementById("btnToggleReviews");
  const reviewsSidebar = document.getElementById("reviewsSidebar");
  const queueSidebar = document.getElementById("queueSidebar");
  const equalizerSidebar = document.getElementById("equalizerSidebar");
  const starContainer = document.getElementById("reviewRatingStars");
  const btnSaveReview = document.getElementById("btnSaveReview");
  const reviewTextInput = document.getElementById("reviewTextInput");
  const btnTabCurrentTrack = document.getElementById("btnTabCurrentTrack");
  const btnTabMyDiary = document.getElementById("btnTabMyDiary");

  if (btnToggleReviews && reviewsSidebar) {
    btnToggleReviews.addEventListener("click", () => {
      reviewsSidebar.classList.toggle("collapsed");
      if (!reviewsSidebar.classList.contains("collapsed")) {
        if (queueSidebar) queueSidebar.classList.add("collapsed");
        if (equalizerSidebar) equalizerSidebar.classList.add("collapsed");
        renderReviews(getPlayingTrackGlobal());
      }
    });
  }
  if (starContainer) {
    starContainer.addEventListener("click", (e) => {
      const star = e.target.closest("[data-value]");
      if (star) {
        const rect = star.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const starVal = parseInt(star.getAttribute("data-value"));
        currentRating = clickX < rect.width / 2 ? starVal - 0.5 : starVal;
        highlightStars(currentRating);
      }
    });
  }
  if (btnTabCurrentTrack && btnTabMyDiary) {
    btnTabCurrentTrack.addEventListener("click", () => {
      currentTab = "current";
      btnTabCurrentTrack.style.color = "var(--blue-accent)";
      btnTabCurrentTrack.style.borderBottomColor = "var(--blue-accent)";
      btnTabMyDiary.style.color = "var(--text-secondary)";
      btnTabMyDiary.style.borderBottomColor = "transparent";
      renderReviews(getPlayingTrackGlobal());
    });
    btnTabMyDiary.addEventListener("click", () => {
      currentTab = "diary";
      btnTabMyDiary.style.color = "var(--blue-accent)";
      btnTabMyDiary.style.borderBottomColor = "var(--blue-accent)";
      btnTabCurrentTrack.style.color = "var(--text-secondary)";
      btnTabCurrentTrack.style.borderBottomColor = "transparent";
      renderReviews(getPlayingTrackGlobal());
    });
  }
  if (btnSaveReview && reviewTextInput) {
    btnSaveReview.addEventListener("click", async () => {
      setLoading(btnSaveReview, true, "Guardando...");
      try {
        const text = reviewTextInput.value.trim();
        const track = getPlayingTrackGlobal();
        if (!track) {
          setLoading(btnSaveReview, false);
          return showAlert("Debes reproducir una canción.", "Sin reproducción");
        }
        if (!text) {
          setLoading(btnSaveReview, false);
          return showAlert("Escribe tu reseña.", "Texto vacío");
        }
        if (!track.id_cancion) {
          setLoading(btnSaveReview, false);
          return showAlert("Canción sin identificador.", "Error");
        }
        await saveReviewToAPI(track.trackTitle, track.artistName, track.albumCover, currentRating, text, false, track.id_cancion);
        reviewTextInput.value = "";
        currentRating = 5;
        highlightStars(5);
        renderReviews(getPlayingTrackGlobal());
        renderIntegratedDiaryFeed();
      } finally {
        setLoading(btnSaveReview, false);
      }
    });
  }
  highlightStars(5);

  const integratedStarsContainer = document.getElementById("integratedRatingStars");
  const btnSaveIntegratedReview = document.getElementById("btnSaveIntegratedReview");
  const integratedReviewText = document.getElementById("integratedReviewText");
  const btnSetCurrentPlaying = document.getElementById("btnSetCurrentPlayingToComposer");
  const btnDiaryRewatchToggle = document.getElementById("btnDiaryRewatchToggle");
  const btnSortRecent = document.getElementById("btnDiarySortRecent");
  const btnSortRating = document.getElementById("btnDiarySortRating");
  const diarySearchFilter = document.getElementById("diarySearchFilter");
  const btnDiaryFilterRewatched = document.getElementById("btnDiaryFilterRewatched");

  if (integratedStarsContainer) {
    integratedStarsContainer.addEventListener("click", (e) => {
      const star = e.target.closest("[data-value]");
      if (star) {
        const rect = star.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const starVal = parseInt(star.getAttribute("data-value"));
        currentIntegratedRating = clickX < rect.width / 2 ? starVal - 0.5 : starVal;
        highlightIntegratedStars(currentIntegratedRating);
      }
    });
  }
  if (btnSetCurrentPlaying) {
    btnSetCurrentPlaying.addEventListener("click", () => {
      const track = getPlayingTrackGlobal();
      if (track) selectTrackInComposerDropdown(track.trackTitle);
      else alert("No hay ninguna pista en reproducción.");
    });
  }
  if (btnDiaryRewatchToggle) {
    btnDiaryRewatchToggle.addEventListener("click", () => {
      isIntegratedRewatchActive = !isIntegratedRewatchActive;
      btnDiaryRewatchToggle.style.background = isIntegratedRewatchActive ? "rgba(0,224,84,0.1)" : "rgba(255,255,255,0.04)";
      btnDiaryRewatchToggle.style.borderColor = isIntegratedRewatchActive ? "rgba(0,224,84,0.35)" : "rgba(255,255,255,0.08)";
      btnDiaryRewatchToggle.style.color = isIntegratedRewatchActive ? "#00e054" : "#a0a0a8";
    });
  }
  if (btnSaveIntegratedReview && integratedReviewText) {
    btnSaveIntegratedReview.addEventListener("click", async () => {
      setLoading(btnSaveIntegratedReview, true, "Guardando...");
      try {
        const selectEl = document.getElementById("diarySongSelector");
        if (!selectEl || !selectEl.value) {
          setLoading(btnSaveIntegratedReview, false);
          return showAlert("Selecciona una canción.", "Canción no seleccionada");
        }
        const text = integratedReviewText.value.trim();
        if (!text) {
          setLoading(btnSaveIntegratedReview, false);
          return showAlert("Escribe tu reseña.", "Comentario vacío");
        }
        let trackData;
        try {
          trackData = JSON.parse(selectEl.value);
        } catch {
          setLoading(btnSaveIntegratedReview, false);
          return showAlert("Error al leer datos.", "Error");
        }
        if (!trackData.id_cancion) {
          setLoading(btnSaveIntegratedReview, false);
          return showAlert("Canción sin identificador.", "Error");
        }
        await saveReviewToAPI(
          trackData.trackTitle,
          trackData.artistName,
          trackData.albumCover,
          currentIntegratedRating,
          text,
          isIntegratedRewatchActive,
          trackData.id_cancion,
        );
        integratedReviewText.value = "";
        currentIntegratedRating = 5;
        highlightIntegratedStars(5);
        renderReviews(getPlayingTrackGlobal());
        renderIntegratedDiaryFeed();
      } finally {
        setLoading(btnSaveIntegratedReview, false);
      }
    });
  }
  if (diarySearchFilter)
    diarySearchFilter.addEventListener("input", (e) => {
      diarySearchQuery = e.target.value;
      renderIntegratedDiaryFeed();
    });
  if (btnDiaryFilterRewatched)
    btnDiaryFilterRewatched.addEventListener("click", () => {
      diaryFilterOnlyRewatched = !diaryFilterOnlyRewatched;
      renderIntegratedDiaryFeed();
    });
  if (btnSortRecent)
    btnSortRecent.addEventListener("click", () => {
      diarySortMethod = "recent";
      renderIntegratedDiaryFeed();
    });
  if (btnSortRating)
    btnSortRating.addEventListener("click", () => {
      diarySortMethod = "rating";
      renderIntegratedDiaryFeed();
    });

  const editReviewModal = document.getElementById("editReviewModal");
  const btnEditReviewClose = document.getElementById("btnEditReviewClose");
  const btnEditReviewCancel = document.getElementById("btnEditReviewCancel");
  const btnEditReviewConfirm = document.getElementById("btnEditReviewConfirm");
  const editReviewStarsContainer = document.getElementById("editReviewStars");
  const btnEditReviewRewatchToggle = document.getElementById("btnEditReviewRewatchToggle");

  if (btnEditReviewClose) btnEditReviewClose.addEventListener("click", () => editReviewModal?.classList.add("hidden"));
  if (btnEditReviewCancel) btnEditReviewCancel.addEventListener("click", () => editReviewModal?.classList.add("hidden"));
  if (editReviewStarsContainer) {
    editReviewStarsContainer.addEventListener("click", (e) => {
      const star = e.target.closest("[data-value]");
      if (star) {
        const rect = star.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const starVal = parseInt(star.getAttribute("data-value"));
        currentEditingRating = clickX < rect.width / 2 ? starVal - 0.5 : starVal;
        highlightEditStars(currentEditingRating);
      }
    });
  }
  if (btnEditReviewRewatchToggle) {
    btnEditReviewRewatchToggle.addEventListener("click", () => {
      isEditingRewatchActive = !isEditingRewatchActive;
      btnEditReviewRewatchToggle.style.background = isEditingRewatchActive ? "rgba(0,224,84,0.1)" : "rgba(255,255,255,0.04)";
      btnEditReviewRewatchToggle.style.borderColor = isEditingRewatchActive ? "rgba(0,224,84,0.35)" : "rgba(255,255,255,0.08)";
      btnEditReviewRewatchToggle.style.color = isEditingRewatchActive ? "#00e054" : "#a0a0a8";
    });
  }
  if (btnEditReviewConfirm) {
    btnEditReviewConfirm.addEventListener("click", async () => {
      setLoading(btnEditReviewConfirm, true, "Guardando...");
      try {
        const textEl = document.getElementById("editReviewTextarea");
        const text = textEl ? textEl.value.trim() : "";
        if (!text) {
          setLoading(btnEditReviewConfirm, false);
          return showAlert("Escribe tu reseña.", "Crítica vacía");
        }
        if (editingReviewId) {
          await updateReviewInAPI(editingReviewId, currentEditingRating, text, isEditingRewatchActive);
          editReviewModal?.classList.add("hidden");
          renderReviews(getPlayingTrackGlobal());
          renderIntegratedDiaryFeed();
        }
      } finally {
        setLoading(btnEditReviewConfirm, false);
      }
    });
  }

  window.openEditReviewModal = function (id) {
    const rev = reviews.find((r) => r.id_review === id);
    if (!rev) return;
    editingReviewId = id;
    currentEditingRating = rev.rating || 5;
    isEditingRewatchActive = !!rev.rewatch;
    const coverEl = document.getElementById("editReviewTrackCover");
    const titleEl = document.getElementById("editReviewTrackTitle");
    const artistEl = document.getElementById("editReviewTrackArtist");
    const textEl = document.getElementById("editReviewTextarea");
    if (coverEl) coverEl.src = rev.albumCover || "";
    if (titleEl) titleEl.innerText = rev.trackTitle || "";
    if (artistEl) artistEl.innerText = rev.artistName || "";
    if (textEl) textEl.value = rev.text || "";
    highlightEditStars(currentEditingRating);
    if (btnEditReviewRewatchToggle) {
      btnEditReviewRewatchToggle.style.background = isEditingRewatchActive ? "rgba(0,224,84,0.1)" : "rgba(255,255,255,0.04)";
      btnEditReviewRewatchToggle.style.borderColor = isEditingRewatchActive ? "rgba(0,224,84,0.35)" : "rgba(255,255,255,0.08)";
      btnEditReviewRewatchToggle.style.color = isEditingRewatchActive ? "#00e054" : "#a0a0a8";
    }
    if (editReviewModal) editReviewModal.classList.remove("hidden");
  };

  window.obtenerArtistaMasEscuchadoYValorado = async function () {
    try {
      const data = await getTopArtist();
      if (data.success) {
        return {
          artista: data.artista,
          puntuacion: data.puntuacion,
          reproducciones: data.reproducciones,
          ratingPromedio: data.ratingPromedio,
        };
      }
    } catch (e) {
      console.error("Error obteniendo top artist:", e);
    }
    return { artista: "Ninguno todavía", puntuacion: 0, reproducciones: 0, ratingPromedio: 0 };
  };

  renderReviews(getPlayingTrackGlobal());
  renderIntegratedDiaryFeed();
  highlightIntegratedStars(5);
}

window.reviews = reviews;
