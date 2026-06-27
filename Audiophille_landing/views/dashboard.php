<?php
require_once __DIR__ . '/../config/database.php';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (!isset($_SESSION['user_id'])) {
    header('Location: ' . BASE_URL);
    exit();
}
$user_name = $_SESSION['user_name'];
$user_id = $_SESSION['user_id'];
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>Audiophille's Player - Bienvenido <?= htmlspecialchars($user_name) ?></title>
    <link rel="icon" href="<?= BASE_URL ?>assets/img/icon.jpeg" type="image/jpeg">
    <link rel="stylesheet" href="<?= BASE_URL ?>assets/css/main.css">
    <script src="https://unpkg.com/lucide@latest"></script>
</head>

<body>
    <div class="mesh-background"></div>
    <div class="app-container">

        <!-- SIDEBAR -->
        <aside class="sidebar-left" id="sidebarLeft">
            <div class="sidebar-brand">
                <i data-lucide="disc" class="brand-logo"></i>
                <span class="brand-name">Audiophille's</span>
            </div>
            <nav class="sidebar-menu">
                <button class="menu-item active" id="navHome"><i data-lucide="home"></i> <span>Inicio</span></button>
                <button class="menu-item" id="navFavorites"><i data-lucide="heart" class="heart-icon-fixed"></i> <span>Canciones que te gustan</span></button>
                <button class="menu-item" id="navDiary"><i data-lucide="book-open" class="diary-icon-fixed"></i> <span>Diario & Reseñas</span></button>
                <button class="menu-item" id="navGame"><i data-lucide="gamepad-2"></i> <span>Juego</span></button>
                <button class="menu-item" id="navProfile"><i data-lucide="user"></i> <span>Mi perfil</span></button>
            </nav>
            <div class="sidebar-playlists">
                <div class="playlists-header">
                    <span>Tus Playlists</span>
                    <button id="btnCreatePlaylist" title="Crear nueva playlist"><i data-lucide="plus"></i></button>
                </div>
                <div class="playlists-scroll" id="playlistsDynamicContainer"></div>
            </div>
            <div class="sidebar-footer">
                <a href="<?= BASE_URL ?>controllers/LogoutController.php" class="menu-item"><i data-lucide="log-out"></i> <span>Cerrar sesión</span></a>
            </div>
        </aside>

        <!-- CONTENIDO PRINCIPAL -->
        <div class="main-content">
            <header class="global-header" id="globalHeader">
                <div class="search-container">
                    <i data-lucide="search" class="search-icon"></i>
                    <input type="text" id="globalSearch" placeholder="¿Qué quieres escuchar hoy?" autocomplete="off">
                </div>
            </header>

            <!-- Biblioteca (Inicio) -->
            <main class="content-wrapper" id="mainLibrary">
                <section class="section-container">
                    <h2 class="section-title">Tu Biblioteca - Álbumes</h2>
                    <div class="album-grid" id="albumGrid"></div>
                </section>
                <section class="section-container mt-48" id="playlistHomeSection">
                    <div class="playlist-header-row">
                        <h2 class="section-title no-margin">Playlists Creadas</h2>
                    </div>
                    <div class="album-grid" id="playlistsGrid"></div>
                </section>
            </main>

            <!-- Vista detalle de álbum / playlist -->
            <main class="content-wrapper hidden" id="albumDetailView">
                <button class="back-btn" onclick="closeAlbumView()"><i data-lucide="arrow-left"></i> Volver</button>
                <section class="album-header-detail">
                    <div class="detail-cover-wrapper"><img id="detailAlbumCover" src="" alt="Album Cover"></div>
                    <div class="album-header-text">
                        <h1 id="detailAlbumTitle">Título del Contenedor</h1>
                        <p id="detailAlbumArtist">Artista o Creador</p>
                        <div class="album-actions-row" id="albumActionsDetailRow">
                            <button id="btnEditAlbum" class="btn-action-edit"><i data-lucide="pencil"></i> Editar Álbum</button>
                            <button id="btnDeleteAlbum" class="btn-action-delete"><i data-lucide="trash-2"></i> Eliminar Álbum</button>
                        </div>
                    </div>
                </section>
                <section class="tracklist-container">
                    <div class="tracklist-header"><span>#</span><span>Título</span><span class="header-album-column">Álbum</span><span><i data-lucide="clock"></i></span><span></span></div>
                    <div id="tracksDynamicList"></div>
                    <div id="playlistAddSongInlineContainer" class="hidden"></div>
                </section>
            </main>

            <!-- Diario y reseñas (SongBox) -->
            <main class="content-wrapper hidden" id="diaryView">
                <section class="section-container">
                    <div class="diary-header">
                        <h2 class="section-title diary-no-margin">SongBox. Califica tus canciones</h2>
                        <span class="diary-badge"><i data-lucide="star" class="diary-badge-star"></i> Reseñas & Diario Integrado</span>
                    </div>
                    <div class="diary-layout">
                        <div class="diary-feed-section">
                            <div class="diary-stats-card">
                                <div class="diary-stat-item">
                                    <div class="diary-stat-number blue-accent" id="statTotalReviews">0</div>
                                    <div class="diary-stat-label">Reseñas totales</div>
                                </div>
                                <div class="diary-stat-divider"></div>
                                <div class="diary-stat-item">
                                    <div class="diary-stat-number gold-accent" id="statAvgRating">0.0 ★</div>
                                    <div class="diary-stat-label">Calificación media</div>
                                </div>
                                <div class="diary-stat-divider"></div>
                                <div class="diary-stat-item diary-stat-max-width">
                                    <div class="diary-stat-number pink-accent" id="statFavArtist">-</div>
                                    <div class="diary-stat-label">Artista Preferido</div>
                                </div>
                            </div>
                            <div class="diary-list-header">
                                <div class="diary-list-header-row">
                                    <h3 class="diary-list-title">Tus Críticas & Historial</h3>
                                    <div class="diary-sort-group">
                                        <button id="btnDiarySortRecent" class="diary-sort-btn active">Recientes</button>
                                        <button id="btnDiarySortRating" class="diary-sort-btn">Súper Valorados</button>
                                    </div>
                                </div>
                                <div class="diary-filter-search-row">
                                    <div class="diary-search-wrapper"><i data-lucide="search" class="diary-search-icon"></i><input type="text" id="diarySearchFilter" placeholder="Buscar por canción o artista..." class="diary-search-input"></div>
                                    <button id="btnDiaryFilterRewatched" class="diary-filter-rewatched-btn"><i data-lucide="repeat"></i> Solo Re-escuchadas</button>
                                </div>
                            </div>
                            <div id="integratedDiaryList" class="diary-items-container"></div>
                        </div>
                        <div class="diary-composer-section">
                            <div class="diary-composer-box">
                                <h3 class="diary-composer-title"><i data-lucide="pencil"></i> Añadir al Diario</h3>
                                <div class="diary-field-group">
                                    <label class="diary-field-label">1. Selecciona una Canción</label>
                                    <select id="diarySongSelector" class="diary-select-input"></select>
                                    <button id="btnSetCurrentPlayingToComposer" class="diary-current-playing-btn"><i data-lucide="play"></i> Pone la que está sonando ahora</button>
                                </div>
                                <div class="diary-field-group">
                                    <label class="diary-field-label">2. Calificación (Stars)</label>
                                    <div class="diary-rating-box">
                                        <div id="integratedRatingStars" class="diary-stars-input">
                                            <i data-lucide="star" class="star-i" data-value="1"></i><i data-lucide="star" class="star-i" data-value="2"></i>
                                            <i data-lucide="star" class="star-i" data-value="3"></i><i data-lucide="star" class="star-i" data-value="4"></i>
                                            <i data-lucide="star" class="star-i" data-value="5"></i>
                                        </div>
                                        <button id="btnDiaryRewatchToggle" class="diary-rewatch-toggle-btn"><i data-lucide="repeat-2"></i> Re-escuchada</button>
                                    </div>
                                </div>
                                <div class="diary-field-group">
                                    <label class="diary-field-label">3. Tu Reseña / Comentario</label>
                                    <textarea id="integratedReviewText" placeholder="Cuéntale al mundo por qué esta pieza musical es una obra de arte, o habla sobre su vibra..." class="diary-textarea-input"></textarea>
                                </div>
                                <button id="btnSaveIntegratedReview" class="btn-modal-primary diary-save-btn"><i data-lucide="check"></i> Guardar Entrada de Diario</button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <!-- Juego -->
            <main class="content-wrapper hidden" id="gameView">
                <div class="game-container">
                    <div class="game-header">
                        <h2>🎮 Adivina la Canción</h2>
                        <div id="gameScore" class="game-score">Puntuación: 0</div>
                    </div>
                    <div class="game-content">
                        <div class="game-cover-area">
                            <img id="gameCover" class="game-cover-blur" src="" alt="Portada borrosa">
                            <div id="gamePlayingIndicator" class="game-playing-indicator" style="display: none;"><i data-lucide="volume-2"></i><span>Sonando...</span>
                                <div class="wave-bar">
                                    <div class="wave"></div>
                                    <div class="wave"></div>
                                    <div class="wave"></div>
                                    <div class="wave"></div>
                                    <div class="wave"></div>
                                </div>
                            </div>
                        </div>
                        <div class="game-options" id="gameOptions"></div>
                        <div class="game-controls"><button id="gameNextBtn" class="game-next-btn"><i data-lucide="skip-forward"></i> Siguiente</button></div>
                        <div id="gameMessage" class="game-message"></div>
                    </div>
                </div>
            </main>

            <!-- Vista de perfil (IDs únicos) -->
            <main class="content-wrapper hidden" id="profileView">
                <div class="profile-container">
                    <div class="profile-header">
                        <img id="profileAvatar" class="profile-avatar" src="">
                        <div>
                            <h1 id="profileName"></h1>
                            <p id="profileEmail"></p>
                            <button id="editProfileBtn" class="btn-primary edit-profile-btn">Editar perfil</button>
                        </div>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number" id="statProfileReviews">0</div>
                            <div class="stat-label">Reseñas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="statProfileFavorites">0</div>
                            <div class="stat-label">Favoritas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="statProfilePlaylists">0</div>
                            <div class="stat-label">Playlists</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="statProfileImported">0</div>
                            <div class="stat-label">Importadas</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" id="statProfileAvgRating">0.0 ★</div>
                            <div class="stat-label">Calif. media</div>
                        </div>
                    </div>
                </div>
            </main>

            <div id="artistProfileView" class="hidden"></div>
        </div>
    </div>

    <!-- ==================== MODALES ==================== -->

    <!-- Modal de creación de playlist -->
    <div id="playlistModal" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Crear Nueva Playlist</h3>
                <button id="btnModalClose" class="btn-close-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <label for="modalPlaylistName">Nombre de la playlist</label>
                <input type="text" id="modalPlaylistName" placeholder="Ej. Rock para entrenar..." maxlength="32" autocomplete="off">
                <label for="imagenPlaylistInput" class="modal-label-block">Portada de la Playlist (Opcional)</label>
                <input type="file" id="imagenPlaylistInput" accept="image/*" class="modal-file-input">
            </div>
            <div class="modal-footer">
                <button id="btnModalCancel" class="btn-modal-secondary">Cancelar</button>
                <button id="btnModalConfirm" class="btn-modal-primary">Crear Playlist</button>
            </div>
        </div>
    </div>

    <!-- Modal de edición de álbum -->
    <div id="editAlbumModal" class="modal-overlay hidden">
        <div class="modal-content modal-content-medium">
            <div class="modal-header">
                <h3 id="editModalHeaderTitle">Editar Álbum</h3>
                <button id="btnEditAlbumClose" class="btn-close-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body modal-body-scrollable">
                <label for="editAlbumTitleInput" id="lblEditAlbumTitle">Título del Álbum</label>
                <input type="text" id="editAlbumTitleInput" placeholder="Ej. Discovery..." class="modal-input modal-input-compact" maxlength="64" autocomplete="off">
                <div id="editAlbumArtistGroup">
                    <label for="editAlbumArtistInput">Artista</label>
                    <input type="text" id="editAlbumArtistInput" placeholder="Ej. Daft Punk..." class="modal-input modal-input-compact" maxlength="64" autocomplete="off">
                </div>
                <label for="editAlbumCoverInput">URL de Portada / Imagen</label>
                <div class="modal-input-row">
                    <input type="text" id="editAlbumCoverInput" placeholder="https://images.unsplash.com/..." class="modal-input modal-input-row-flex" autocomplete="off">
                    <input type="file" id="editAlbumCoverFileInput" accept="image/*" style="display: none;">
                    <button id="btnEditUploadCover" class="btn-modal-secondary btn-modal-upload-cover">Subir Imagen</button>
                </div>
                <label class="modal-label-block">Canciones del Álbum</label>
                <div id="editAlbumSongsContainer" class="songs-container-box"></div>
                <div class="add-song-btn-container">
                    <button id="btnEditAlbumAddSong" class="btn-modal-secondary btn-add-song-dashed"><i data-lucide="plus"></i> Añadir Pista (.mp3, .wav)</button>
                    <input type="file" id="editAlbumAddSongFileInput" accept="audio/*" style="display: none;">
                </div>
            </div>
            <div class="modal-footer modal-footer-divided">
                <button id="btnEditAlbumCancel" class="btn-modal-secondary">Cancelar</button>
                <button id="btnEditAlbumConfirm" class="btn-modal-primary">Guardar Cambios</button>
            </div>
        </div>
    </div>

    <!-- Modal de edición de reseña -->
    <div id="editReviewModal" class="modal-overlay hidden edit-review-modal-overlay">
        <div class="modal-content edit-review-modal-content">
            <div class="modal-header">
                <h3 class="edit-review-header-title"><i data-lucide="pencil" class="edit-review-header-icon"></i> Editar Crítica</h3>
                <button id="btnEditReviewClose" class="btn-close-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body edit-review-body">
                <div class="edit-review-track-card">
                    <img id="editReviewTrackCover" src="" class="edit-review-track-cover">
                    <div>
                        <h4 id="editReviewTrackTitle" class="edit-review-track-title"></h4>
                        <p id="editReviewTrackArtist" class="edit-review-track-artist"></p>
                    </div>
                </div>
                <div class="edit-review-field">
                    <label class="edit-review-label">Calificación (Stars)</label>
                    <div class="edit-review-rating-bar">
                        <div id="editReviewStars" class="edit-review-stars-container">
                            <i data-lucide="star" class="star-edit" data-value="1"></i><i data-lucide="star" class="star-edit" data-value="2"></i>
                            <i data-lucide="star" class="star-edit" data-value="3"></i><i data-lucide="star" class="star-edit" data-value="4"></i>
                            <i data-lucide="star" class="star-edit" data-value="5"></i>
                        </div>
                        <button id="btnEditReviewRewatchToggle" class="edit-review-rewatch-btn"><i data-lucide="repeat-2"></i> Re-escuchada</button>
                    </div>
                </div>
                <div class="edit-review-field">
                    <label class="edit-review-label">Tu Reseña / Comentario</label>
                    <textarea id="editReviewTextarea" class="edit-review-textarea"></textarea>
                </div>
            </div>
            <div class="modal-footer edit-review-footer">
                <button id="btnEditReviewCancel" class="btn-modal-secondary">Cancelar</button>
                <button id="btnEditReviewConfirm" class="btn-modal-primary edit-review-confirm-btn"><i data-lucide="check"></i> Guardar Cambios</button>
            </div>
        </div>
    </div>

    <!-- Modal de edición de perfil -->
    <div id="editProfileModal" class="modal-overlay hidden">
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Editar perfil</h3>
                <button id="closeEditProfileModal" class="btn-close-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-group"><label>Nombre de usuario</label><input type="text" id="modalEditUsername" class="modal-input"></div>
                <div class="form-group"><label>Correo electrónico</label><input type="email" id="modalEditEmail" class="modal-input"></div>
                <div class="form-group"><label>Nueva contraseña (dejar vacío si no cambia)</label><input type="password" id="modalEditPassword" class="modal-input"><small class="form-helper">Mínimo 8 caracteres, mayúscula, minúscula, número y símbolo</small></div>
                <div class="form-group"><label>Avatar (imagen)</label><input type="file" id="modalEditAvatar" accept="image/*" class="file-input"></div>
            </div>
            <div class="modal-footer">
                <button id="saveProfileModalBtn" class="btn-modal-primary">Guardar cambios</button>
                <button id="cancelProfileModalBtn" class="btn-modal-secondary">Cancelar</button>
            </div>
        </div>
    </div>

    <!-- ==================== MENÚ CONTEXTUAL Y REPRODUCTORES ==================== -->

    <div id="contextMenuContainer" class="context-menu hidden">
        <button class="context-option" id="ctxAddToQueue"><i data-lucide="list-music"></i> Agregar a la Cola</button>
        <div class="context-divider"></div>
        <div class="context-submenu-title">Añadir a Playlist:</div>
        <div id="ctxPlaylistsList" class="context-playlists-list"></div>
    </div>

    <div id="miniPlayer" class="mini-player hidden" onclick="expandFullPlayer()">
        <div class="mini-player-content">
            <img id="miniCover" src="" alt="Cover Mini">
            <div class="mini-metadata">
                <h4 id="miniTitle">Canción</h4>
                <p id="miniArtist">Artista</p>
            </div>
            <div class="mini-controls" onclick="event.stopPropagation()"><button class="btn-mini-play" id="btnMiniPlay"><i data-lucide="play"></i></button></div>
        </div>
        <div class="mini-progress-bar">
            <div id="miniProgressFill" class="mini-progress-fill"></div>
        </div>
    </div>

    <section id="playerOverlay" class="player-overlay hidden">
        <div class="player-top-bar">
            <button class="minimize-btn" onclick="minimizeFullPlayer()" title="Minimizar"><i data-lucide="chevron-down"></i></button>
            <span class="player-view-indicator">Reproduciendo ahora</span>
            <div class="player-top-tools">
                <button class="toggle-queue-btn equalizer-btn" id="btnToggleEqualizer" title="Ecualizador"><i data-lucide="sliders"></i></button>
                <button class="toggle-queue-btn" id="btnToggleQueueSidebar" title="Ver / Ocultar Cola"><i data-lucide="list-video"></i></button>
            </div>
        </div>
        <div class="player-layout">
            <div class="player-visual">
                <div class="main-cover-wrapper"><img id="currentCover" src="" alt="Album Art"></div>
            </div>
            <div class="player-controls-container">
                <div class="track-metadata">
                    <div class="metadata-text">
                        <h1 id="currentTitle">Título de la canción</h1>
                        <p id="currentArtist" class="artist-clickable">Nombre del Artista</p>
                    </div>
                    <button class="btn-heart-favorite" id="btnMainFavorite" title="Me gusta"><i data-lucide="heart"></i></button>
                </div>
                <div class="timeline-container-premium">
                    <input type="range" id="timelineScrubber" class="timeline-scrubber-premium" min="0" max="100" value="0">
                    <div class="progress-bar-rail">
                        <div class="progress-bar-fill" id="premiumProgressFill"></div>
                    </div>
                </div>
                <div class="time-stamps"><span id="timeCurrent">0:00</span><span id="timeTotal">0:00</span></div>
                <div class="main-controls">
                    <button id="btnShuffle" class="btn-icon" title="Aleatorio"><i data-lucide="shuffle"></i></button>
                    <button id="btnPrev" class="btn-icon" title="Anterior"><i data-lucide="skip-back"></i></button>
                    <button id="btnMainPlay" class="btn-play-large" title="Reproducir / Pausar"><i data-lucide="play"></i></button>
                    <button id="btnNext" class="btn-icon" title="Siguiente"><i data-lucide="skip-forward"></i></button>
                    <button id="btnRepeat" class="btn-icon" title="Repetir"><i data-lucide="repeat"></i></button>
                </div>
                <div class="volume-group">
                    <i data-lucide="volume-2" class="vol-icon"></i>
                    <div class="vol-slider-wrapper"><input type="range" id="volSlider" class="vol-slider" min="0" max="100" value="80"></div>
                </div>
            </div>
            <aside class="queue-sidebar" id="queueSidebar">
                <div class="queue-panel">
                    <h3>A continuación</h3>
                    <div id="queueDynamicList" class="queue-list"></div>
                </div>
            </aside>
            <aside class="queue-sidebar collapsed" id="equalizerSidebar">
                <div class="queue-panel">
                    <div class="eq-panel-meta">
                        <h3 class="eq-title">Ecualizador Pro</h3><button id="btnResetEqualizer" class="btn-eq-reset">Reset</button>
                    </div>
                    <div class="eq-sliders-container">
                        <div class="eq-panel-row">
                            <div class="eq-panel-label-group"><span class="eq-label-text"><i data-lucide="music"></i> Bajos</span><span id="lblEqBass" class="eq-value-text">0 dB</span></div><input type="range" id="eqBass" class="eq-slider-input" min="-12" max="12" value="0" step="1">
                        </div>
                        <div class="eq-panel-row">
                            <div class="eq-panel-label-group"><span class="eq-label-text"><i data-lucide="mic"></i> Voz / Cantante</span><span id="lblEqVocals" class="eq-value-text">0 dB</span></div><input type="range" id="eqVocals" class="eq-slider-input" min="-12" max="12" value="0" step="1">
                        </div>
                        <div class="eq-panel-row">
                            <div class="eq-panel-label-group"><span class="eq-label-text"><i data-lucide="guitar"></i> Instrumental</span><span id="lblEqTreble" class="eq-value-text">0 dB</span></div><input type="range" id="eqTreble" class="eq-slider-input" min="-12" max="12" value="0" step="1">
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    </section>

    <!-- Asistente musik -->
    <div class="musik-container">
        <div id="musikChatWindow" class="musik-chat-window musik-hidden">
            <div class="musik-chat-header">
                <div class="musik-avatar-info"><i data-lucide="sparkles" class="musik-icon-spark"></i>
                    <div>
                        <h4>musik</h4><span class="musik-status">En línea y listo</span>
                    </div>
                </div>
                <div class="chat-header-buttons"><button id="btnExpandMusik" class="chat-expand-btn"><i data-lucide="maximize-2"></i></button><button id="btnMinimizeMusik" class="chat-minimize-btn"><i data-lucide="chevron-down"></i></button></div>
            </div>
            <div id="musikChatMessages" class="musik-chat-messages"></div>
            <div class="musik-chat-input-area">
                <input type="file" id="musikFileInput" accept="audio/*,image/*" style="display: none;">
                <button id="btnMusikImport" title="Importar música local" class="musik-import-btn"><i data-lucide="paperclip" class="musik-import-btn-icon"></i></button>
                <input type="text" id="musikInput" placeholder="Escribe un comando o adjunta música..." autocomplete="off">
                <button id="btnMusikSend"><i data-lucide="send"></i></button>
            </div>
        </div>
        <button id="btnMusikTrigger" class="musik-trigger-btn"><i data-lucide="sparkles" class="musik-btn-icon"></i><span class="musik-btn-text">musik</span></button>
    </div>

    <script>
        window.userId = <?= json_encode($user_id) ?>;
        window.baseUrl = <?= json_encode(BASE_URL) ?>;
        lucide.createIcons();
    </script>
    <script type="module" src="<?= BASE_URL ?>assets/js/app.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1"></script>
</body>

</html>