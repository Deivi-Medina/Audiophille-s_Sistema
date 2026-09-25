import { loadInitialData } from "./var.js";
import { api } from "./api.js";
import { addXpForAction } from "./achievements.js";

if (!window.curAlbumCreation) {
  window.curAlbumCreation = {
    active: false,
    titulo: "",
    artista: "",
    cover: null,
    coverAttempts: 0,
    songs: [],
    waitingForDetails: false,
  };
}
if (!window.curPlaylistCreation) {
  window.curPlaylistCreation = { active: false, step: 0, nombre: "" };
}

async function refreshUI() {
  await loadInitialData();
  const { renderPlaylistsSidebarLinks } = await import("./playlist.js");
  const { renderAlbumCards, renderPlaylistDetailView } = await import("./ui.js");
  renderPlaylistsSidebarLinks();
  renderAlbumCards();
  if (window.state?.activePlaylistName && renderPlaylistDetailView) {
    renderPlaylistDetailView(window.state.activePlaylistName);
  }
  if (window.lucide) window.lucide.createIcons();
}

export async function procesarComandoIA(instruccionUsuario, archivoAdjunto = null, callbackActualizarInterfaz) {
  const prompt = instruccionUsuario.toLowerCase().trim();

  if (archivoAdjunto) return procesarArchivo(archivoAdjunto, prompt, callbackActualizarInterfaz);

  if (window.curPlaylistCreation.active) {
    return manejarFlujoPlaylist(instruccionUsuario, prompt, callbackActualizarInterfaz);
  }
  if (window.curAlbumCreation.active) {
    return manejarFlujoAlbum(instruccionUsuario, prompt, callbackActualizarInterfaz);
  }

  if (prompt === "cancelar" || prompt === "salir" || prompt === "cancel") {
    if (window.curPlaylistCreation.active) {
      window.curPlaylistCreation.active = false;
      window.curPlaylistCreation.step = 0;
      return "❌ Creación de playlist cancelada.";
    }
    if (window.curAlbumCreation.active) {
      window.curAlbumCreation.active = false;
      window.curAlbumCreation.coverAttempts = 0;
      return "❌ Creación de álbum cancelada.";
    }
    return "👍 Entendido.";
  }

  if (prompt === "ayuda" || prompt === "comandos" || prompt === "help") return mostrarAyuda();
  if (prompt.match(/^(hola|buenas|qué tal|hey|oye|saludos|ola)$/i)) {
    return "👋 ¡Hola! Escribe <b>ayuda</b> para ver comandos.";
  }

  if (
    (prompt.includes("playlist") || prompt.includes("lista")) &&
    (prompt.includes("crea") || prompt.includes("crear") || prompt.includes("nueva") || prompt.includes("haz") || prompt.includes("genera"))
  ) {
    window.curPlaylistCreation.active = true;
    window.curPlaylistCreation.step = 1;
    return `<b>🎵 Vamos a crear una nueva playlist</b><br><br>Primero, <b>¿cómo quieres llamarla?</b><br><i>(Ejemplo: "Rock para entrenar")</i> ✨`;
  }

  if (prompt.includes("crear") || prompt.includes("crea") || prompt.includes("nuevo album") || prompt.includes("nuevo álbum")) {
    return iniciarCreacionAlbum(instruccionUsuario);
  }

  if (prompt.includes("estadística") || prompt.includes("estadisticas") || prompt === "stats") {
    return await generarEstadisticas();
  }

  if (prompt.includes("recomienda") || prompt.includes("sugiere") || prompt.includes("recomendación")) {
    return await recomendarCanciones();
  }

  if (prompt.includes("artista favorito") || prompt.includes("más escuchado") || prompt.includes("top artista")) {
    return await obtenerArtistaFavorito();
  }

  return procesarMensajeLocal(instruccionUsuario, callbackActualizarInterfaz);
}

function mostrarAyuda() {
  return `<div style="display: flex; flex-direction: column; gap: 6px;">
    <b>🎵 Comandos disponibles:</b>
    <span>• <i>"Crea una playlist"</i> → te guío paso a paso.</span>
    <span>• <i>"Crea el álbum [título] de [artista]"</i> → ejemplo: <i>"Crea el álbum Thriller de Michael Jackson"</i></span>
    <span>• <i>"¿Cuál es mi artista favorito?"</i> → analizo reproducciones y reseñas.</span>
    <span>• <i>"Recomiéndame canciones"</i> → basado en tu historial.</span>
    <span>• <i>"Estadísticas"</i> → resumen de tu biblioteca.</span>
    <span>• <i>"Agrega [canción] a [playlist]"</i> → añade una canción existente.</span>
    <span>• <i>"Elimina la playlist [nombre]"</i> → borra una playlist.</span>
    <span>• <i>"Cancelar"</i> → detiene cualquier proceso en curso.</span>
    <span>📎 También puedes <b>adjuntar imágenes o audios</b> directamente con tu mensaje.</span>
    <span>🔗 <b>NUEVO:</b> Pega un enlace de YouTube y lo añadiré a tu biblioteca.<br>
    <i>Ejemplo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"</i></span>
  </div>`;
}

async function generarEstadisticas() {
  const albums = window.albumsFromDB || [];
  let totalSongs = 0;
  albums.forEach((a) => a.songs && (totalSongs += a.songs.length));
  const totalPlaylists = Object.keys(window.state?.playlists || {}).length;
  const totalFavorites = window.state?.favorites?.length || 0;
  const totalReviews = window.reviews?.length || 0;
  return `<div><b>📊 Estadísticas</b><br>• Álbumes: ${albums.length}<br>• Canciones: ${totalSongs}<br>• Playlists: ${totalPlaylists}<br>• Favoritas: ${totalFavorites}<br>• Reseñas: ${totalReviews}</div>`;
}

async function recomendarCanciones() {
  let plays = {};
  try {
    const data = await api.get("get_play_stats");
    if (data.success) plays = data.plays;
  } catch (_) {}
  const albums = window.albumsFromDB || [];
  if (Object.keys(plays).length === 0) {
    const allSongs = [];
    albums.forEach((album) => album.songs.forEach((song) => allSongs.push(`${song.trackTitle} - ${album.artist}`)));
    const randomSongs = allSongs.sort(() => 0.5 - Math.random()).slice(0, 3);
    return `🎧 Te recomiendo:<br>• ${randomSongs.join("<br>• ")}`;
  }
  let topArtist = "",
    maxPlays = 0;
  for (const [artist, count] of Object.entries(plays)) {
    if (count > maxPlays) {
      maxPlays = count;
      topArtist = artist;
    }
  }
  const picks = [];
  albums.forEach((album) => {
    if (album.artist.toLowerCase().includes(topArtist.toLowerCase())) {
      album.songs.forEach((song) => picks.push(`${song.trackTitle} - ${album.artist}`));
    }
  });
  if (!picks.length) return `🎧 Basado en ${topArtist}, no encontré más canciones.`;
  return `🎧 Basado en tu artista más escuchado (${topArtist}):<br>• ${picks.slice(0, 3).join("<br>• ")}`;
}

async function obtenerArtistaFavorito() {
  if (!window.obtenerArtistaMasEscuchadoYValorado) {
    return "🔧 Sistema no listo. Reproduce y califica canciones.";
  }
  const res = await window.obtenerArtistaMasEscuchadoYValorado();
  if (!res || res.artista === "Ninguno todavía") {
    return "🎧 Aún no hay datos. Reproduce y califica canciones.";
  }
  return `<b>⭐ Tu artista favorito es ${res.artista}</b><br>• Puntuación: ${res.puntuacion} pts<br>• Reproducciones: ${res.reproducciones}<br>• Calificación media: ${res.ratingPromedio} ★`;
}

async function procesarArchivo(file, textoPrompt, callbackActualizarInterfaz) {
  const isImage = file.type.startsWith("image/");
  const isAudio = file.type.startsWith("audio/");

  if (window.curAlbumCreation.active && !window.curAlbumCreation.cover && isImage) {
    window.curAlbumCreation.cover = file;
    window.curAlbumCreation.coverAttempts = 0;
    return "🖼️ Portada recibida. Ahora sube canciones o escribe 'listo'.";
  }

  if (window.curAlbumCreation.active && window.curAlbumCreation.cover && isAudio) {
    window.curAlbumCreation.songs.push({ trackTitle: file.name.replace(/\.[^/.]+$/, ""), file });
    return `🎵 Canción "${file.name}" agregada. Llevas ${window.curAlbumCreation.songs.length} canción(es).`;
  }

  if (isAudio && !window.curAlbumCreation.active) {
    const formData = new FormData();
    formData.append("audio", file);
    try {
      const data = await api.post("import_song", formData);
      if (data.success) {
        if (callbackActualizarInterfaz) await callbackActualizarInterfaz();
        return `✨ Canción "${data.titulo}" importada.`;
      } else {
        return `❌ Error: ${data.message}`;
      }
    } catch (e) {
      console.error("Error en import_song:", e);
      return `❌ Error de red: ${e.message}`;
    }
  }

  return `📎 Archivo "${file.name}" recibido.`;
}

async function manejarFlujoPlaylist(mensajeUsuario, prompt, callbackActualizarInterfaz) {
  if (window.curPlaylistCreation.step === 1) {
    let nombre = mensajeUsuario.trim().replace(/["'«»]/g, "");
    if (nombre.length < 2) return "⚠️ Nombre muy corto (mínimo 2 caracteres).";
    if (nombre.length > 50) return "⚠️ Nombre muy largo (máximo 50).";
    window.curPlaylistCreation.nombre = nombre;
    window.curPlaylistCreation.step = 2;
    return `<b>✍️ Playlist "${nombre}"</b><br><br>Ahora, dime cómo llenarla:<br>• Escribe un <b>artista o género</b><br>• O escribe <b>"vacía"</b> para crearla sin canciones.`;
  }
  if (window.curPlaylistCreation.step === 2) {
    const criterio = prompt;
    const nombrePlaylist = window.curPlaylistCreation.nombre;
    let playlistId = null;
    try {
      const data = await api.post("create_playlist", { nombre: nombrePlaylist });
      playlistId = data.id_playlist;
    } catch (e) {
      return `❌ Error al crear playlist: ${e.message}`;
    }
    let agregadas = 0;
    if (criterio !== "vacía" && criterio !== "vacia") {
      const albums = window.albumsFromDB || [];
      for (const album of albums) {
        for (const song of album.songs) {
          if (
            album.artist.toLowerCase().includes(criterio) ||
            (album.genre && album.genre.toLowerCase().includes(criterio)) ||
            (song.genre && song.genre.toLowerCase().includes(criterio))
          ) {
            try {
              await api.post("add_to_playlist", { id_playlist: playlistId, id_cancion: song.id_cancion });
              agregadas++;
            } catch (_) {}
          }
        }
      }
    }
    if (callbackActualizarInterfaz) await callbackActualizarInterfaz();
    else await refreshUI();
    window.curPlaylistCreation.active = false;
    window.curPlaylistCreation.step = 0;
    if (agregadas > 0) {
      return `<b>🎉 Playlist "${nombrePlaylist}" creada</b><br>✅ Se añadieron ${agregadas} canciones (coinciden con "${criterio}").`;
    } else {
      return `<b>✨ Playlist "${nombrePlaylist}" creada (vacía).</b><br>Puedes llenarla manualmente.`;
    }
  }
  return "⚠️ Error. Escribe 'cancelar'.";
}

function iniciarCreacionAlbum(mensajeUsuario) {
  let titulo = "",
    artista = "";
  const match = mensajeUsuario.match(
    /(?:crea|crear|nuevo)\s+(?:el\s+)?(?:álbum|album|disco)\s+(?:llamado\s+)?["'«]?([^"'\n\r«]+?)["'»]?\s+(?:de|por)\s+["'«]?([^"'\n\r«]+?)["'»]?$/i,
  );
  if (match) {
    titulo = match[1].trim();
    artista = match[2].trim();
  } else {
    window.curAlbumCreation = {
      active: true,
      titulo: "",
      artista: "",
      cover: null,
      coverAttempts: 0,
      songs: [],
      waitingForDetails: true,
    };
    return `<b>📝 Para crear un álbum, dime el título y artista.</b><br>Ejemplo: <i>"crea el álbum Thriller de Michael Jackson"</i>`;
  }
  window.curAlbumCreation = {
    active: true,
    titulo,
    artista,
    cover: null,
    coverAttempts: 0,
    songs: [],
    waitingForDetails: false,
  };
  return `<b>✨ Creando álbum "${titulo}" de "${artista}"</b><br><br><b>Paso 1:</b> Sube una imagen de portada (clip 📎) o escribe <i>"omitir"</i>.`;
}

async function manejarFlujoAlbum(mensajeUsuario, prompt, callbackActualizarInterfaz) {
  const cur = window.curAlbumCreation;
  if (cur.waitingForDetails) {
    const match = mensajeUsuario.match(
      /(?:crea|crear)\s+(?:el\s+)?(?:álbum|album)?\s+["'«]?([^"'\n\r«]+?)["'»]?\s+(?:de|por)\s+["'«]?([^"'\n\r«]+?)["'»]?$/i,
    );
    if (match) {
      cur.titulo = match[1].trim();
      cur.artista = match[2].trim();
      cur.waitingForDetails = false;
      return `<b>✅ Álbum: ${cur.titulo} de ${cur.artista}</b><br><br>Sube portada o escribe "omitir".`;
    } else {
      return "❓ Formato incorrecto. Ej: 'crea el álbum X de Y' o 'cancelar'.";
    }
  }
  if (!cur.cover) {
    if (prompt === "omitir" || prompt === "defecto") {
      cur.cover = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400";
      cur.coverAttempts = 0;
      return "🖼️ Portada genérica. Ahora sube canciones o escribe 'listo'.";
    }
    cur.coverAttempts++;
    if (cur.coverAttempts >= 3) {
      return "❓ Varios intentos. Escribe 'omitir' para usar portada genérica.";
    }
    return `🖼️ Esperando portada para "${cur.titulo}". Sube imagen o escribe "omitir".`;
  }
  if (prompt === "listo" || prompt === "guardar" || prompt === "terminar") {
    if (cur.songs.length === 0) return "⚠️ El álbum no tiene canciones. Sube al menos un audio.";
    const formData = new FormData();
    formData.append("titulo", cur.titulo);
    formData.append("artista", cur.artista);
    if (cur.cover instanceof File) formData.append("cover_file", cur.cover);
    else formData.append("cover_url", cur.cover);
    for (let i = 0; i < cur.songs.length; i++) {
      formData.append(`song_${i}_title`, cur.songs[i].trackTitle);
      formData.append(`song_${i}_file`, cur.songs[i].file);
    }
    formData.append("songs_count", cur.songs.length);
    try {
      const data = await api.post("create_album", formData);
      if (data.success) {
        if (callbackActualizarInterfaz) await callbackActualizarInterfaz();
        else await refreshUI();
        window.curAlbumCreation.active = false;
        await addXpForAction("album");
        return `<b>🎉 Álbum "${cur.titulo}" publicado</b><br>Contiene ${cur.songs.length} canciones.`;
      } else {
        return `❌ Error: ${data.message}`;
      }
    } catch (err) {
      return `❌ Error: ${err.message}`;
    }
  }
  return `<b>💿 Editando "${cur.titulo}"</b><br>• Canciones: ${cur.songs.length}<br>• Sube más audios o escribe "listo".`;
}

async function procesarMensajeLocal(mensajeUsuario, callbackActualizarInterfaz) {
  const prompt = mensajeUsuario.toLowerCase().trim();

  // NUEVA FUNCIÓN: Detectar enlace de YouTube y agregar canción automáticamente
  const youtubeMatch = mensajeUsuario.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    try {
      const data = await api.post("add_youtube_song", { video_id: videoId });
      if (data.success) {
        if (callbackActualizarInterfaz) await callbackActualizarInterfaz();
        return `🎵 Canción "${data.titulo}" agregada desde YouTube.`;
      } else {
        return `❌ Error al agregar: ${data.message}`;
      }
    } catch (e) {
      console.error("Error al agregar canción de YouTube:", e);
      return `❌ Error de conexión al agregar la canción.`;
    }
  }

  if (prompt.includes("elimina") || prompt.includes("borra")) {
    const match = mensajeUsuario.match(/(?:elimina|borra)\s+playlist\s+["'«]?([^"'\n\r«]+?)["'»]?$/i);
    if (match) {
      const pName = match[1].trim();
      const playlists = window.state?.playlists || {};
      let pid = null;
      for (const [name, pl] of Object.entries(playlists)) {
        if (name.toLowerCase() === pName.toLowerCase()) {
          pid = pl.id_playlist;
          break;
        }
      }
      if (!pid) return `⚠️ No encontré la playlist "${pName}".`;
      try {
        const data = await api.post("delete_playlist", { id_playlist: pid });
        if (data.success) {
          if (callbackActualizarInterfaz) await callbackActualizarInterfaz();
          return `🗑️ Eliminada playlist "${pName}".`;
        } else {
          return `⚠️ Error: ${data.message}`;
        }
      } catch (e) {
        return "⚠️ Error de conexión.";
      }
    }
  }

  if (prompt.includes("agrega") || prompt.includes("añade") || prompt.includes("mete")) {
    const match = mensajeUsuario.match(
      /(?:agrega|añade|mete)\s+["'«]?([^"'\n\r«]+?)["'»]?\s+(?:a\s+la\s+playlist|a|en)\s+["'«]?([^"'\n\r«]+?)["'»]?$/i,
    );
    if (match) {
      const songName = match[1].trim().toLowerCase();
      const playlistName = match[2].trim();
      const playlists = window.state?.playlists || {};
      let playlistId = null,
        playlistRealName = null;
      for (const [name, pl] of Object.entries(playlists)) {
        if (name.toLowerCase() === playlistName.toLowerCase()) {
          playlistId = pl.id_playlist;
          playlistRealName = name;
          break;
        }
      }
      if (!playlistId) return `⚠️ No encuentro la playlist "${playlistName}".`;
      const albums = window.albumsFromDB || [];
      let foundSong = null;
      for (const album of albums) {
        for (const song of album.songs) {
          if (song.trackTitle.toLowerCase() === songName) {
            foundSong = song;
            break;
          }
        }
        if (foundSong) break;
      }
      if (!foundSong) return `⚠️ No encontré la canción "${match[1]}".`;
      try {
        const data = await api.post("add_to_playlist", {
          id_playlist: playlistId,
          id_cancion: foundSong.id_cancion,
        });
        if (data.success) {
          if (callbackActualizarInterfaz) await callbackActualizarInterfaz();
          if (window.state?.activePlaylistName === playlistRealName && window.renderPlaylistDetailView) {
            window.renderPlaylistDetailView(playlistRealName);
          }
          return `🎵 ¡Éxito! Agregué "${foundSong.trackTitle}" a la playlist "${playlistRealName}".`;
        } else {
          return `⚠️ Error: ${data.message}`;
        }
      } catch (e) {
        return "⚠️ Error de conexión.";
      }
    }
  }

  if (prompt.includes("playlist") && (prompt.includes("crea") || prompt.includes("crear") || prompt.includes("nueva"))) {
    const match = mensajeUsuario.match(/(?:crea|crear|nueva)\s+playlist\s+["'«]?([^"'\n\r«]+?)["'»]?$/i);
    if (match) {
      const pName = match[1].trim();
      try {
        const data = await api.post("create_playlist", { nombre: pName });
        if (data.success) {
          if (callbackActualizarInterfaz) await callbackActualizarInterfaz();
          return `🎉 Playlist "${pName}" creada.`;
        } else {
          return `⚠️ Error: ${data.message}`;
        }
      } catch (e) {
        return "⚠️ Error de conexión.";
      }
    }
  }

  return "🎵 No entendí. Escribe 'ayuda'.";
}
