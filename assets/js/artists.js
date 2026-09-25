// js/artists.js
import DOM, { state } from "./var.js";
import { showSection } from "./navigation.js";
import { openAlbumView, refreshUI } from "./ui.js";
import { toggleFollowArtist } from "./services/artistService.js";
import { showAlert } from "./modals.js";
import { get } from "./api.js";
import { addAlbumToLibrary, removeAlbumFromLibrary } from "./services/explorerService.js";

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"]/g, (m) => {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    if (m === '"') return "&quot;";
    return m;
  });
}

async function fetchArtistData(artistName) {
  try {
    const data = await get("get_artist_details", { name: artistName });
    if (data.success && data.artist) {
      return data.artist;
    }
    return null;
  } catch (error) {
    console.error("Error al obtener datos del artista:", error);
    return null;
  }
}

async function fetchArtistAlbums(artistName) {
  try {
    const data = await get("get_artist_albums", { artist: artistName });
    if (data.success && data.albums) {
      return data.albums;
    }
    return [];
  } catch (error) {
    console.error("Error al obtener álbumes del artista:", error);
    return [];
  }
}

export async function openArtistProfile(artistName) {
  showSection(`artist:${artistName}`);

  const mainContainer = DOM.views.artistProfile;
  if (!mainContainer) return;

  mainContainer.classList.remove("hidden");
  mainContainer.style.display = "block";

  const artistData = await fetchArtistData(artistName);
  const artistAlbums = await fetchArtistAlbums(artistName);

  const isFollowing = state.followedArtists.includes(artistName);

  const artistImage =
    artistData?.imagen_url ||
    (artistAlbums.length > 0 ? artistAlbums[0].caratula_url : null) ||
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";

  mainContainer.innerHTML = `
    <div class="artist-profile-container" style="max-width: 1200px; margin: 0 auto; padding: 1rem;">
      <button id="btnBackFromArtist" class="back-btn" style="margin-bottom: 1.5rem;">
        ← Volver a la Biblioteca
      </button>
      <div class="artist-profile-banner" style="position: relative; padding: 4rem 2rem 2rem; border-radius: 24px; overflow: hidden; margin-bottom: 2rem;">
        <div class="artist-banner-blur" style="position: absolute; top:0; left:0; width:100%; height:100%; background: url('${artistImage}') center/cover; filter: blur(16px) brightness(0.4) scale(1.1); z-index: 1;"></div>
        <div class="artist-banner-overlay" style="position: absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(180deg, rgba(2,2,4,0.2) 0%, var(--bg-dark) 100%); z-index: 2;"></div>
        <div class="artist-banner-content" style="position: relative; z-index: 3; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start;">
          <span class="artist-verified-badge" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(4px); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; color: #a78bfa; font-weight: 600; border: 1px solid rgba(167,139,250,0.2);">
            ✓ Artista Verificado
          </span>
          <div style="display: flex; align-items: center; gap: 1.5rem; width: 100%;">
            <div style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; border: 3px solid var(--accent); box-shadow: 0 0 30px var(--accent-glow); flex-shrink: 0;">
              <img src="${artistImage}" alt="${escapeHtml(artistName)}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div>
              <h1 class="artist-profile-name" style="font-size: 2.5rem; font-weight: 800; color: var(--text-primary); letter-spacing: -1px; margin: 0.5rem 0;">${escapeHtml(artistName)}</h1>
              <p class="artist-listeners" id="artistListenersCount" style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">
                ${isFollowing ? "1,450,231" : "1,450,230"} oyentes mensuales
              </p>
              <button id="btnFollowArtist" class="artist-follow-btn ${isFollowing ? "following" : ""}">
                ${isFollowing ? "✕ Dejar de seguir" : "✓ Seguir"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="artist-profile-body" style="padding: 0 1rem;">
        <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.5rem;">
          Álbumes y sencillos
          <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-secondary); margin-left: 12px;">
            (${artistAlbums.length} álbumes)
          </span>
        </h2>
        <div class="album-grid" id="artistAlbumsGrid"></div>
      </div>
    </div>
  `;

  const btnBack = mainContainer.querySelector("#btnBackFromArtist");
  if (btnBack) btnBack.onclick = () => showSection("home");

  const btnFollow = mainContainer.querySelector("#btnFollowArtist");
  const listenersText = mainContainer.querySelector("#artistListenersCount");

  if (btnFollow) {
    btnFollow.addEventListener("click", async () => {
      const currentlyFollowing = state.followedArtists.includes(artistName);
      const newFollowing = !currentlyFollowing;

      btnFollow.classList.toggle("following", newFollowing);
      btnFollow.innerHTML = newFollowing ? "✕ Dejar de seguir" : "✓ Seguir";
      if (listenersText) {
        listenersText.innerText = newFollowing ? "1,450,231 oyentes mensuales" : "1,450,230 oyentes mensuales";
      }

      try {
        const success = await toggleFollowArtist(artistName, newFollowing);
        if (success) {
          if (newFollowing) {
            state.followedArtists.push(artistName);
          } else {
            state.followedArtists = state.followedArtists.filter((name) => name !== artistName);
          }
        } else {
          btnFollow.classList.toggle("following", currentlyFollowing);
          btnFollow.innerHTML = currentlyFollowing ? "✕ Dejar de seguir" : "✓ Seguir";
          if (listenersText) {
            listenersText.innerText = currentlyFollowing ? "1,450,231 oyentes mensuales" : "1,450,230 oyentes mensuales";
          }
          await showAlert("Error al actualizar el seguimiento del artista", "Error");
        }
      } catch (error) {
        console.error("Error en toggleFollowArtist:", error);
        btnFollow.classList.toggle("following", currentlyFollowing);
        btnFollow.innerHTML = currentlyFollowing ? "✕ Dejar de seguir" : "✓ Seguir";
        if (listenersText) {
          listenersText.innerText = currentlyFollowing ? "1,450,231 oyentes mensuales" : "1,450,230 oyentes mensuales";
        }
        await showAlert("Error de conexión al seguir al artista", "Error");
      }
    });
  }

  const grid = mainContainer.querySelector("#artistAlbumsGrid");
  if (grid) {
    grid.innerHTML = "";

    if (artistAlbums.length === 0) {
      grid.innerHTML = `
        <div class="explore-empty" style="grid-column:1/-1;">
          <i data-lucide="music" style="width:48px;height:48px;opacity:0.3;"></i>
          <h3>No hay álbumes disponibles de este artista</h3>
          <p style="color: var(--text-secondary);">Puede que aún no se hayan agregado álbumes al sistema.</p>
        </div>
      `;
    } else {
      artistAlbums.forEach((album) => {
        const card = document.createElement("article");
        card.className = "album-card explore-album-card";
        card.dataset.albumId = album.id_album;

        const isAdded = album.added === "1" || album.added === 1;

        card.innerHTML = `
          <div class="card-media-wrapper">
            <div class="card-media">
              <img src="${album.caratula_url || "https://picsum.photos/seed/" + album.id_album + "/300/300"}" alt="${escapeHtml(album.titulo)}">
              <div class="play-hint" data-action="preview">
                <i data-lucide="play"></i>
              </div>
            </div>
            <div class="card-reflection"></div>
            <span class="grid-card-tag tag-album">Álbum</span>
          </div>
          <div class="card-info">
            <h3>${escapeHtml(album.titulo)}</h3>
            <p class="artist-name">${escapeHtml(artistName)}</p>
            <p class="album-meta">${album.anio || ""} ${album.genero ? "· " + escapeHtml(album.genero) : ""}</p>
            <button class="btn-add-to-library ${isAdded ? "added" : ""}" data-action="toggle-library" data-album-id="${album.id_album}">
              <i data-lucide="${isAdded ? "check" : "plus-circle"}"></i>
              ${isAdded ? "En tu biblioteca" : "Añadir a biblioteca"}
            </button>
          </div>
        `;

        card.addEventListener("click", (e) => {
          if (e.target.closest(".btn-add-to-library")) return;
          if (e.target.closest(".play-hint")) return;
          openAlbumView(album, true);
        });

        const addBtn = card.querySelector(".btn-add-to-library");
        addBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const isCurrentlyAdded = addBtn.classList.contains("added");

          if (isCurrentlyAdded) {
            await showAlert("Este álbum ya está en tu biblioteca.", "Información", "info");
            return;
          }

          try {
            const data = await addAlbumToLibrary(album.id_album);
            if (data.success) {
              // Actualizar la biblioteca en segundo plano
              await refreshUI();
              // Recargar la vista del artista para actualizar el estado del botón
              openArtistProfile(artistName);
              await showAlert("Álbum añadido a tu biblioteca", "Éxito", "success");
            } else {
              await showAlert(data.message || "Error al añadir el álbum", "Error");
            }
          } catch (error) {
            console.error("Error al añadir álbum:", error);
            await showAlert("Error de conexión al añadir el álbum", "Error");
          }
        });

        const playHint = card.querySelector(".play-hint");
        if (playHint) {
          playHint.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (album.songs && album.songs.length > 0) {
              const { setQueue, playActiveSong } = await import("./audio.js");
              const songsWithMetadata = album.songs.map((song) => ({
                ...song,
                artistName: artistName,
                albumCover: album.caratula_url || "https://picsum.photos/seed/" + album.id_album + "/300/300",
                originalAlbumIdx: null,
              }));
              setQueue(songsWithMetadata, 0);
              playActiveSong();
              showSection("home");
            } else {
              await showAlert("Este álbum no tiene canciones disponibles para previsualizar.", "Sin canciones");
            }
          });
        }

        grid.appendChild(card);
      });
    }
  }

  if (window.lucide) window.lucide.createIcons();
}
