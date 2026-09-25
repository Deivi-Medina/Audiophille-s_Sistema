-- ============================================================
-- SCRIPT SQL COMPLETO - AUDIOPHILLE DATABASE
-- VERSIÓN COMPATIBLE CON Database.php
-- ============================================================

-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS `audiophiles_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE `audiophiles_db`;

-- ============================================================
-- 1. TABLA USUARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
    `id_usuario` int NOT NULL AUTO_INCREMENT,
    `nombre_usuario` varchar(50) NOT NULL,
    `email` varchar(100) NOT NULL,
    `password_hash` varchar(255) NOT NULL,
    `avatar` varchar(255) DEFAULT NULL,
    `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
    `ultimo_acceso` datetime DEFAULT NULL,
    PRIMARY KEY (`id_usuario`),
    UNIQUE KEY `nombre_usuario` (`nombre_usuario`),
    UNIQUE KEY `email` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 2. TABLA ARTISTAS
-- ============================================================
CREATE TABLE IF NOT EXISTS `artistas` (
    `id_artista` int NOT NULL AUTO_INCREMENT,
    `nombre_artista` varchar(100) NOT NULL,
    `pais` varchar(50) DEFAULT NULL,
    `imagen_url` varchar(255) DEFAULT NULL,
    `biografia` text,
    PRIMARY KEY (`id_artista`),
    UNIQUE KEY `nombre_artista` (`nombre_artista`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 3. TABLA ÁLBUMES (CON es_publico Y id_usuario)
-- ============================================================
CREATE TABLE IF NOT EXISTS `albumes` (
    `id_album` int NOT NULL AUTO_INCREMENT,
    `titulo` varchar(100) NOT NULL,
    `id_artista` int NOT NULL,
    `anio` int DEFAULT NULL,
    `caratula_url` varchar(255) NOT NULL DEFAULT '',
    `genero` varchar(50) DEFAULT NULL,
    `es_sistema` tinyint(1) DEFAULT '1',
    `es_publico` tinyint(1) DEFAULT '1', -- ✅ AÑADIDO
    `id_usuario` int DEFAULT NULL,
    PRIMARY KEY (`id_album`),
    KEY `id_artista` (`id_artista`),
    CONSTRAINT `albumes_ibfk_1` FOREIGN KEY (`id_artista`) REFERENCES `artistas` (`id_artista`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 4. TABLA CANCIONES (archivo_url PERMITE NULL)
-- ============================================================
CREATE TABLE IF NOT EXISTS `canciones` (
    `id_cancion` int NOT NULL AUTO_INCREMENT,
    `titulo` varchar(100) NOT NULL,
    `id_album` int DEFAULT NULL,
    `archivo_url` varchar(255) DEFAULT NULL, -- ✅ PERMITE NULL
    `duracion_segundos` int DEFAULT NULL,
    `numero_pista` int DEFAULT NULL,
    `genero` varchar(50) DEFAULT NULL,
    `es_sistema` tinyint(1) DEFAULT '1',
    `id_usuario_subio` int DEFAULT NULL,
    `reproducciones` int DEFAULT '0',
    PRIMARY KEY (`id_cancion`),
    KEY `idx_canciones_album` (`id_album`),
    KEY `idx_canciones_usuario` (`id_usuario_subio`),
    CONSTRAINT `canciones_ibfk_1` FOREIGN KEY (`id_album`) REFERENCES `albumes` (`id_album`) ON DELETE SET NULL,
    CONSTRAINT `canciones_ibfk_2` FOREIGN KEY (`id_usuario_subio`) REFERENCES `usuarios` (`id_usuario`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 5. TABLA PLAYLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `playlists` (
    `id_playlist` int NOT NULL AUTO_INCREMENT,
    `nombre` varchar(50) NOT NULL,
    `id_usuario` int NOT NULL,
    `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
    `portada_url` text,
    `descripcion` text,
    PRIMARY KEY (`id_playlist`),
    KEY `idx_playlists_usuario` (`id_usuario`),
    CONSTRAINT `playlists_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 6. TABLA PLAYLIST_CANCIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS `playlist_canciones` (
    `id_playlist` int NOT NULL,
    `id_cancion` int NOT NULL,
    `orden` int DEFAULT NULL,
    PRIMARY KEY (`id_playlist`, `id_cancion`),
    KEY `id_cancion` (`id_cancion`),
    CONSTRAINT `playlist_canciones_ibfk_1` FOREIGN KEY (`id_playlist`) REFERENCES `playlists` (`id_playlist`) ON DELETE CASCADE,
    CONSTRAINT `playlist_canciones_ibfk_2` FOREIGN KEY (`id_cancion`) REFERENCES `canciones` (`id_cancion`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 7. TABLA FAVORITOS
-- ============================================================
CREATE TABLE IF NOT EXISTS `favoritos` (
    `id_usuario` int NOT NULL,
    `id_cancion` int NOT NULL,
    `fecha_agregado` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_usuario`, `id_cancion`),
    KEY `id_cancion` (`id_cancion`),
    CONSTRAINT `favoritos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
    CONSTRAINT `favoritos_ibfk_2` FOREIGN KEY (`id_cancion`) REFERENCES `canciones` (`id_cancion`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 8. TABLA RESEÑAS
-- ============================================================
CREATE TABLE IF NOT EXISTS `resenas` (
    `id_review` int NOT NULL AUTO_INCREMENT,
    `id_usuario` int NOT NULL,
    `id_cancion` int NOT NULL,
    `puntuacion` decimal(2, 1) NOT NULL,
    `comentario` text NOT NULL,
    `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
    `escuchada_nuevamente` tinyint(1) DEFAULT '0',
    `titulo_cancion_texto` varchar(100) NOT NULL,
    `artista_texto` varchar(100) NOT NULL,
    PRIMARY KEY (`id_review`),
    KEY `idx_resenas_usuario` (`id_usuario`),
    KEY `idx_resenas_cancion` (`id_cancion`),
    CONSTRAINT `resenas_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
    CONSTRAINT `resenas_ibfk_2` FOREIGN KEY (`id_cancion`) REFERENCES `canciones` (`id_cancion`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 9. TABLA CONFIGURACIÓN EQ
-- ============================================================
CREATE TABLE IF NOT EXISTS `configuracion_eq` (
    `id_usuario` int NOT NULL,
    `bass` int DEFAULT '0',
    `vocals` int DEFAULT '0',
    `treble` int DEFAULT '0',
    PRIMARY KEY (`id_usuario`),
    CONSTRAINT `configuracion_eq_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 10. TABLA ARTISTAS_SEGUIDOS
-- ============================================================
CREATE TABLE IF NOT EXISTS `artistas_seguidos` (
    `id_usuario` int NOT NULL,
    `nombre_artista` varchar(100) NOT NULL,
    PRIMARY KEY (
        `id_usuario`,
        `nombre_artista`
    ),
    CONSTRAINT `artistas_seguidos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 11. TABLA REPRODUCCIONES_ARTISTA
-- ============================================================
CREATE TABLE IF NOT EXISTS `reproducciones_artista` (
    `id_reproduccion` int NOT NULL AUTO_INCREMENT,
    `id_usuario` int NOT NULL,
    `id_artista` int DEFAULT NULL,
    `nombre_artista` varchar(100) DEFAULT NULL,
    `fecha` datetime NOT NULL,
    PRIMARY KEY (`id_reproduccion`),
    KEY `id_artista` (`id_artista`),
    KEY `idx_reproducciones_usuario` (`id_usuario`),
    CONSTRAINT `reproducciones_artista_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
    CONSTRAINT `reproducciones_artista_ibfk_2` FOREIGN KEY (`id_artista`) REFERENCES `artistas` (`id_artista`) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 12. TABLA SESIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS `sesiones` (
    `id_sesion` int NOT NULL AUTO_INCREMENT,
    `token` varchar(255) NOT NULL,
    `id_usuario` int NOT NULL,
    `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
    `fecha_expiracion` datetime NOT NULL,
    PRIMARY KEY (`id_sesion`),
    UNIQUE KEY `token` (`token`),
    KEY `id_usuario` (`id_usuario`),
    CONSTRAINT `sesiones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 13. TABLA SEGUIDORES (SOCIAL)
-- ============================================================
CREATE TABLE IF NOT EXISTS `seguidores` (
    `id_seguidor` int NOT NULL AUTO_INCREMENT,
    `id_usuario` int NOT NULL,
    `id_seguido` int NOT NULL,
    `fecha_seguimiento` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_seguidor`),
    UNIQUE KEY `unique_seguimiento` (`id_usuario`, `id_seguido`),
    KEY `id_seguido` (`id_seguido`),
    CONSTRAINT `seguidores_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
    CONSTRAINT `seguidores_ibfk_2` FOREIGN KEY (`id_seguido`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 14. TABLA ACTIVIDAD SOCIAL (FEED)
-- ============================================================
CREATE TABLE IF NOT EXISTS `actividad_social` (
    `id_actividad` int NOT NULL AUTO_INCREMENT,
    `id_usuario` int NOT NULL,
    `tipo_actividad` enum(
        'reseña',
        'playlist_creada',
        'favorito',
        'seguimiento'
    ) NOT NULL,
    `id_referencia` int DEFAULT NULL,
    `descripcion` text,
    `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_actividad`),
    KEY `idx_actividad_usuario` (`id_usuario`),
    KEY `idx_actividad_fecha` (`fecha` DESC),
    CONSTRAINT `actividad_social_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 15. TABLA AMIGOS (OPCIONAL - PARA FUTURAS MEJORAS)
-- ============================================================
CREATE TABLE IF NOT EXISTS `amigos` (
    `id_usuario1` int NOT NULL,
    `id_usuario2` int NOT NULL,
    `fecha_amistad` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_usuario1`, `id_usuario2`),
    KEY `id_usuario2` (`id_usuario2`),
    CONSTRAINT `amigos_ibfk_1` FOREIGN KEY (`id_usuario1`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
    CONSTRAINT `amigos_ibfk_2` FOREIGN KEY (`id_usuario2`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 16. TABLA PLAYLISTS_COMPARTIDAS (PARA FUTURAS MEJORAS)
-- ============================================================
CREATE TABLE IF NOT EXISTS `playlists_compartidas` (
    `id_compartida` int NOT NULL AUTO_INCREMENT,
    `id_playlist` int NOT NULL,
    `id_usuario_creador` int NOT NULL,
    `id_usuario_invitado` int NOT NULL,
    `permisos` enum('lectura', 'escritura') DEFAULT 'lectura',
    `fecha_compartida` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_compartida`),
    UNIQUE KEY `unique_compartida` (
        `id_playlist`,
        `id_usuario_invitado`
    ),
    KEY `id_usuario_creador` (`id_usuario_creador`),
    KEY `id_usuario_invitado` (`id_usuario_invitado`),
    CONSTRAINT `playlists_compartidas_ibfk_1` FOREIGN KEY (`id_playlist`) REFERENCES `playlists` (`id_playlist`) ON DELETE CASCADE,
    CONSTRAINT `playlists_compartidas_ibfk_2` FOREIGN KEY (`id_usuario_creador`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
    CONSTRAINT `playlists_compartidas_ibfk_3` FOREIGN KEY (`id_usuario_invitado`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 17. TABLA NIVELES (GAMIFICACIÓN)
-- ============================================================
CREATE TABLE IF NOT EXISTS `niveles` (
    `id_nivel` int PRIMARY KEY,
    `nombre` varchar(50) NOT NULL,
    `icono` varchar(10) NOT NULL,
    `xp_minimo` int NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 18. TABLA LOGROS (GAMIFICACIÓN)
-- ============================================================
CREATE TABLE IF NOT EXISTS `logros` (
    `id_logro` varchar(50) PRIMARY KEY,
    `nombre` varchar(100) NOT NULL,
    `descripcion` text,
    `icono` varchar(10) NOT NULL,
    `rareza` enum(
        'comun',
        'raro',
        'epico',
        'legendario'
    ) DEFAULT 'comun',
    `xp` int NOT NULL,
    `condicion_tipo` varchar(50) NOT NULL,
    `condicion_cantidad` int NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 19. TABLA PROGRESO_USUARIO (GAMIFICACIÓN)
-- ============================================================
CREATE TABLE IF NOT EXISTS `progreso_usuario` (
    `id_usuario` int PRIMARY KEY,
    `xp_total` int DEFAULT 0,
    `nivel_actual` int DEFAULT 1,
    `partidas_jugadas` int DEFAULT 0,
    CONSTRAINT `progreso_usuario_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 20. TABLA LOGROS_USUARIO (GAMIFICACIÓN)
-- ============================================================
CREATE TABLE IF NOT EXISTS `logros_usuario` (
    `id_usuario` int,
    `id_logro` varchar(50),
    `fecha_desbloqueo` timestamp DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_usuario`, `id_logro`),
    CONSTRAINT `logros_usuario_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
    CONSTRAINT `logros_usuario_ibfk_2` FOREIGN KEY (`id_logro`) REFERENCES `logros` (`id_logro`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 21. TABLA USUARIO_ALBUMES (para biblioteca personal)
-- ============================================================
CREATE TABLE IF NOT EXISTS `usuario_albumes` (
    `id_usuario` int NOT NULL,
    `id_album` int NOT NULL,
    `fecha_agregado` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id_usuario`, `id_album`),
    KEY `idx_usuario_busqueda` (`id_usuario`),
    KEY `idx_album_usuario` (`id_album`),
    CONSTRAINT `usuario_albumes_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
    CONSTRAINT `usuario_albumes_ibfk_2` FOREIGN KEY (`id_album`) REFERENCES `albumes` (`id_album`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- 22. TABLA YOUTUBE_GLOBAL_CACHE (para lazy loading)
-- ============================================================
CREATE TABLE IF NOT EXISTS `youtube_global_cache` (
    `hash_busqueda` char(32) NOT NULL,
    `youtube_id` varchar(20) NOT NULL,
    `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`hash_busqueda`),
    KEY `idx_youtube_id` (`youtube_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- ============================================================
-- DATOS INICIALES (INSERTADOS SOLO SI NO EXISTEN)
-- ============================================================

-- Insertar artistas (si no existen)
INSERT IGNORE INTO
    `artistas` (
        `nombre_artista`,
        `pais`,
        `biografia`
    )
VALUES (
        'The Beatles',
        'Reino Unido',
        'Banda de rock británica formada en Liverpool.'
    ),
    (
        'Pink Floyd',
        'Reino Unido',
        'Banda de rock progresivo y psicodélico.'
    ),
    (
        'suei',
        NULL,
        'Artista venezolano de música electrónica y VGM.'
    ),
    (
        'Michael Jackson',
        'Estados Unidos',
        'Cantante, compositor y bailarín estadounidense.'
    );

-- Insertar álbumes (si no existen)
INSERT IGNORE INTO
    `albumes` (
        `titulo`,
        `id_artista`,
        `anio`,
        `caratula_url`,
        `genero`,
        `es_sistema`,
        `es_publico`
    )
VALUES (
        'A Hard Day\'s Night',
        (
            SELECT id_artista
            FROM artistas
            WHERE
                nombre_artista = 'The Beatles'
        ),
        1964,
        'https://i.ytimg.com/vi/5en2JMLA8Z0/maxresdefault.jpg',
        'Rock \'n\' Roll',
        1,
        1
    ),
    (
        'The Dark Side of the Moon',
        (
            SELECT id_artista
            FROM artistas
            WHERE
                nombre_artista = 'Pink Floyd'
        ),
        1973,
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpKDuWTcpap2UJCkmnVBhDJwuh2y3aD-6iPrS6nohjKOUaivKLf7mB9zU&s=10',
        'Progressive Rock',
        1,
        1
    ),
    (
        'Teselia',
        (
            SELECT id_artista
            FROM artistas
            WHERE
                nombre_artista = 'suei'
        ),
        2020,
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSshQdcG--1OpDBbvgkGDbICgjP2pIeMGhQ7g&s',
        'Soundtrack / VGM',
        1,
        1
    ),
    (
        'Thriller',
        (
            SELECT id_artista
            FROM artistas
            WHERE
                nombre_artista = 'Michael Jackson'
        ),
        1982,
        'https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png',
        'Pop / R&B',
        1,
        1
    );

-- Insertar canciones (si no existen)
INSERT IGNORE INTO
    `canciones` (
        `titulo`,
        `id_album`,
        `archivo_url`,
        `numero_pista`,
        `genero`,
        `es_sistema`
    )
VALUES (
        'And I Love Her',
        (
            SELECT id_album
            FROM albumes
            WHERE
                titulo = 'A Hard Day\'s Night'
        ),
        'uploads/audios/AHDN/AndILoveHer.mp3',
        1,
        'Rock Ballad',
        1
    ),
    (
        'If I Fell',
        (
            SELECT id_album
            FROM albumes
            WHERE
                titulo = 'A Hard Day\'s Night'
        ),
        'uploads/audios/AHDN/IfIFell.mp3',
        2,
        'Rock',
        1
    ),
    (
        'Money',
        (
            SELECT id_album
            FROM albumes
            WHERE
                titulo = 'The Dark Side of the Moon'
        ),
        'uploads/audios/TDSOTM/money.mp3',
        1,
        'Rock / Blues',
        1
    ),
    (
        'Time',
        (
            SELECT id_album
            FROM albumes
            WHERE
                titulo = 'The Dark Side of the Moon'
        ),
        'uploads/audios/TDSOTM/Time.mp3',
        2,
        'Rock',
        1
    ),
    (
        'Kaku',
        (
            SELECT id_album
            FROM albumes
            WHERE
                titulo = 'Teselia'
        ),
        'uploads/audios/Teselia/kaku.mp3',
        1,
        'Acoustic',
        1
    ),
    (
        'Knousee',
        (
            SELECT id_album
            FROM albumes
            WHERE
                titulo = 'Teselia'
        ),
        'uploads/audios/Teselia/knousee.mp3',
        2,
        'Jazz Fusion',
        1
    ),
    (
        'The Girl Is Mine',
        (
            SELECT id_album
            FROM albumes
            WHERE
                titulo = 'Thriller'
        ),
        'uploads/audios/Thriller/TheGirlIsMine.mp3',
        1,
        'Pop',
        1
    ),
    (
        'Billie Jean',
        (
            SELECT id_album
            FROM albumes
            WHERE
                titulo = 'Thriller'
        ),
        'uploads/audios/Thriller/BillieJean.mp3',
        2,
        'Dance-Pop',
        1
    );

-- Insertar niveles (si no existen)
INSERT IGNORE INTO
    `niveles` (
        `id_nivel`,
        `nombre`,
        `icono`,
        `xp_minimo`
    )
VALUES (1, 'Novato', '🌱', 0),
    (2, 'Oyente', '🎧', 50),
    (3, 'Melómano', '🎵', 150),
    (4, 'Audiófilo', '🔊', 350),
    (5, 'Maestro', '🎶', 700),
    (6, 'AudioPhille', '👑', 1200);

-- Insertar logros (si no existen)
INSERT IGNORE INTO
    `logros` (
        `id_logro`,
        `nombre`,
        `descripcion`,
        `icono`,
        `rareza`,
        `xp`,
        `condicion_tipo`,
        `condicion_cantidad`
    )
VALUES (
        'first_play',
        'Primera escucha',
        'Reproduce tu primera canción',
        '🎵',
        'comun',
        10,
        'plays',
        1
    ),
    (
        'first_review',
        'Primer crítico',
        'Escribe tu primera reseña',
        '✍️',
        'comun',
        10,
        'reviews',
        1
    ),
    (
        'first_playlist',
        'Creador',
        'Crea tu primera playlist',
        '📁',
        'comun',
        10,
        'playlists',
        1
    ),
    (
        'gamer',
        'Jugador',
        'Juega tu primera partida',
        '🎮',
        'comun',
        10,
        'partidas_jugadas',
        1
    ),
    (
        'collector',
        'Coleccionista',
        'Tienes 50 canciones en tu biblioteca',
        '📀',
        'raro',
        20,
        'songs',
        50
    ),
    (
        'curator',
        'Curador',
        'Crea 10 playlists',
        '🎨',
        'raro',
        30,
        'playlists',
        10
    ),
    (
        'social',
        'Sociable',
        'Tienes 5 seguidores',
        '👥',
        'raro',
        15,
        'followers',
        5
    ),
    (
        'album_filia',
        'Álbum filia',
        'Crea 5 álbumes',
        '💿',
        'raro',
        25,
        'albums',
        5
    ),
    (
        'critic',
        'Crítico musical',
        'Escribe 50 reseñas',
        '⭐',
        'epico',
        50,
        'reviews',
        50
    ),
    (
        'melomano',
        'Melómano',
        'Has escuchado 1000 canciones',
        '🎧',
        'epico',
        50,
        'plays',
        1000
    ),
    (
        'influencer',
        'Influencer',
        'Tienes 50 seguidores',
        '🔥',
        'epico',
        40,
        'followers',
        50
    ),
    (
        'expert',
        'Experto musical',
        'Acierta 10 canciones en el juego',
        '🏆',
        'legendario',
        30,
        'correct_guesses',
        10
    );

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================