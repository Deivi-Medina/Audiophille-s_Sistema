<?php
// models/Database.php - Clase para la conexión PDO con creación automática de BD y tablas
require_once dirname(__DIR__) . '/config/database.php';

class Database
{
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $conn;

    public function getConnection()
    {
        if ($this->conn !== null) {
            return $this->conn;
        }

        // Primero conectamos sin seleccionar base de datos para verificar si existe
        try {
            $pdo = new PDO(
                "mysql:host=" . $this->host . ";charset=" . DB_CHARSET,
                $this->username,
                $this->password
            );
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Verificar si la base de datos existe
            $stmt = $pdo->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
            $stmt->execute([$this->db_name]);
            $dbExists = $stmt->fetchColumn();

            if (!$dbExists) {
                // Crear la base de datos
                $pdo->exec("CREATE DATABASE `{$this->db_name}` CHARACTER SET " . DB_CHARSET);
            }

            // Ahora conectarnos a la BD
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . DB_CHARSET,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

            // Crear tablas si no existen
            $this->createTables();
        } catch (PDOException $e) {
            error_log("Error de conexión: " . $e->getMessage());
            die("Error interno del servidor. Intente más tarde.");
        }

        return $this->conn;
    }

    private function createTables()
    {
        // Array con las sentencias SQL para crear tablas (ordenadas por dependencias)
        $sqls = [];

        // 1. Tabla usuarios
        $sqls[] = "CREATE TABLE IF NOT EXISTS `usuarios` (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";

        // 2. Tabla artistas
        $sqls[] = "CREATE TABLE IF NOT EXISTS `artistas` (
            `id_artista` int NOT NULL AUTO_INCREMENT,
            `nombre_artista` varchar(100) NOT NULL,
            `pais` varchar(50) DEFAULT NULL,
            `imagen_url` varchar(255) DEFAULT NULL,
            `biografia` text,
            PRIMARY KEY (`id_artista`),
            UNIQUE KEY `nombre_artista` (`nombre_artista`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";

        // 3. Tabla albumes
        $sqls[] = "CREATE TABLE IF NOT EXISTS `albumes` (
            `id_album` int NOT NULL AUTO_INCREMENT,
            `titulo` varchar(100) NOT NULL,
            `id_artista` int NOT NULL,
            `anio` int DEFAULT NULL,
            `caratula_url` varchar(255) NOT NULL DEFAULT '',
            `genero` varchar(50) DEFAULT NULL,
            `es_sistema` tinyint(1) DEFAULT '1',
            `id_usuario` int DEFAULT NULL,
            PRIMARY KEY (`id_album`),
            KEY `id_artista` (`id_artista`),
            CONSTRAINT `albumes_ibfk_1` FOREIGN KEY (`id_artista`) REFERENCES `artistas` (`id_artista`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";

        // 4. Tabla canciones
        $sqls[] = "CREATE TABLE IF NOT EXISTS `canciones` (
            `id_cancion` int NOT NULL AUTO_INCREMENT,
            `titulo` varchar(100) NOT NULL,
            `id_album` int DEFAULT NULL,
            `archivo_url` varchar(255) NOT NULL,
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";

        // 5. Tabla playlists
        $sqls[] = "CREATE TABLE IF NOT EXISTS `playlists` (
            `id_playlist` int NOT NULL AUTO_INCREMENT,
            `nombre` varchar(50) NOT NULL,
            `id_usuario` int NOT NULL,
            `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
            `portada_url` text,
            `descripcion` text,
            PRIMARY KEY (`id_playlist`),
            KEY `idx_playlists_usuario` (`id_usuario`),
            CONSTRAINT `playlists_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";

        // 6. Tabla playlist_canciones
        $sqls[] = "CREATE TABLE IF NOT EXISTS `playlist_canciones` (
            `id_playlist` int NOT NULL,
            `id_cancion` int NOT NULL,
            `orden` int DEFAULT NULL,
            PRIMARY KEY (`id_playlist`,`id_cancion`),
            KEY `id_cancion` (`id_cancion`),
            CONSTRAINT `playlist_canciones_ibfk_1` FOREIGN KEY (`id_playlist`) REFERENCES `playlists` (`id_playlist`) ON DELETE CASCADE,
            CONSTRAINT `playlist_canciones_ibfk_2` FOREIGN KEY (`id_cancion`) REFERENCES `canciones` (`id_cancion`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";

        // 7. Tabla favoritos
        $sqls[] = "CREATE TABLE IF NOT EXISTS `favoritos` (
            `id_usuario` int NOT NULL,
            `id_cancion` int NOT NULL,
            `fecha_agregado` datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id_usuario`,`id_cancion`),
            KEY `id_cancion` (`id_cancion`),
            CONSTRAINT `favoritos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE,
            CONSTRAINT `favoritos_ibfk_2` FOREIGN KEY (`id_cancion`) REFERENCES `canciones` (`id_cancion`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";

        // 8. Tabla resenas
        $sqls[] = "CREATE TABLE IF NOT EXISTS `resenas` (
            `id_review` int NOT NULL AUTO_INCREMENT,
            `id_usuario` int NOT NULL,
            `id_cancion` int NOT NULL,
            `puntuacion` decimal(2,1) NOT NULL,
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";

        // 9. Tabla configuracion_eq
        $sqls[] = "CREATE TABLE IF NOT EXISTS `configuracion_eq` (
            `id_usuario` int NOT NULL,
            `bass` int DEFAULT '0',
            `vocals` int DEFAULT '0',
            `treble` int DEFAULT '0',
            PRIMARY KEY (`id_usuario`),
            CONSTRAINT `configuracion_eq_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";

        // 10. Tabla artistas_seguidos
        $sqls[] = "CREATE TABLE IF NOT EXISTS `artistas_seguidos` (
            `id_usuario` int NOT NULL,
            `nombre_artista` varchar(100) NOT NULL,
            PRIMARY KEY (`id_usuario`,`nombre_artista`),
            CONSTRAINT `artistas_seguidos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";

        // 11. Tabla reproducciones_artista
        $sqls[] = "CREATE TABLE IF NOT EXISTS `reproducciones_artista` (
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";

        // 12. Tabla sesiones
        $sqls[] = "CREATE TABLE IF NOT EXISTS `sesiones` (
            `id_sesion` int NOT NULL AUTO_INCREMENT,
            `token` varchar(255) NOT NULL,
            `id_usuario` int NOT NULL,
            `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
            `fecha_expiracion` datetime NOT NULL,
            PRIMARY KEY (`id_sesion`),
            UNIQUE KEY `token` (`token`),
            KEY `id_usuario` (`id_usuario`),
            CONSTRAINT `sesiones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci";

        foreach ($sqls as $sql) {
            $this->conn->exec($sql);
        }

        // Después de crear las tablas, insertamos los datos iniciales si las tablas están vacías
        $this->insertInitialData();
    }

    private function insertInitialData()
    {
        // Verificar si ya existen artistas (para no duplicar)
        $stmt = $this->conn->query("SELECT COUNT(*) FROM artistas");
        $countArtists = $stmt->fetchColumn();

        if ($countArtists == 0) {
            // Insertar artistas
            $stmt = $this->conn->prepare("INSERT INTO artistas (nombre_artista, pais, biografia) VALUES 
                ('The Beatles', 'Reino Unido', 'Banda de rock británica formada en Liverpool.'),
                ('Pink Floyd', 'Reino Unido', 'Banda de rock progresivo y psicodélico.'),
                ('suei', NULL, 'Artista venezolano de música electrónica y VGM.'),
                ('Michael Jackson', 'Estados Unidos', 'Cantante, compositor y bailarín estadounidense.')");
            $stmt->execute();
        }

        // Verificar si ya existen álbumes
        $stmt = $this->conn->query("SELECT COUNT(*) FROM albumes");
        $countAlbums = $stmt->fetchColumn();

        if ($countAlbums == 0) {
            // Obtener IDs de artistas recién insertados (usando los nombres)
            $artists = [];
            $stmt = $this->conn->query("SELECT id_artista, nombre_artista FROM artistas");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $artists[$row['nombre_artista']] = $row['id_artista'];
            }

            // Insertar álbumes
            $albums = [
                ['A Hard Day\'s Night', $artists['The Beatles'], 1964, 'https://i.ytimg.com/vi/5en2JMLA8Z0/maxresdefault.jpg', 'Rock \'n\' Roll'],
                ['The Dark Side of the Moon', $artists['Pink Floyd'], 1973, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpKDuWTcpap2UJCkmnVBhDJwuh2y3aD-6iPrS6nohjKOUaivKLf7mB9zU&s=10', 'Progressive Rock'],
                ['Teselia', $artists['suei'], 2020, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSshQdcG--1OpDBbvgkGDbICgjP2pIeMGhQ7g&s', 'Soundtrack / VGM'],
                ['Thriller', $artists['Michael Jackson'], 1982, 'https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png', 'Pop / R&B']
            ];

            $stmt = $this->conn->prepare("INSERT INTO albumes (titulo, id_artista, anio, caratula_url, genero, es_sistema) VALUES (?, ?, ?, ?, ?, 1)");
            foreach ($albums as $album) {
                $stmt->execute($album);
            }

            // Obtener IDs de álbumes insertados
            $albumsIds = [];
            $stmt = $this->conn->query("SELECT id_album, titulo FROM albumes");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $albumsIds[$row['titulo']] = $row['id_album'];
            }

            // Insertar canciones (rutas relativas a uploads/audios/...)
            $songs = [
                ['And I Love Her', $albumsIds["A Hard Day's Night"], 'uploads/audios/AHDN/AndILoveHer.mp3', 1, 'Rock Ballad'],
                ['If I Fell', $albumsIds["A Hard Day's Night"], 'uploads/audios/AHDN/IfIFell.mp3', 2, 'Rock'],
                ['Money', $albumsIds['The Dark Side of the Moon'], 'uploads/audios/TDSOTM/money.mp3', 1, 'Rock / Blues'],
                ['Time', $albumsIds['The Dark Side of the Moon'], 'uploads/audios/TDSOTM/Time.mp3', 2, 'Rock'],
                ['Kaku', $albumsIds['Teselia'], 'uploads/audios/Teselia/kaku.mp3', 1, 'Acoustic'],
                ['Knousee', $albumsIds['Teselia'], 'uploads/audios/Teselia/knousee.mp3', 2, 'Jazz Fusion'],
                ['The Girl Is Mine', $albumsIds['Thriller'], 'uploads/audios/Thriller/TheGirlIsMine.mp3', 1, 'Pop'],
                ['Billie Jean', $albumsIds['Thriller'], 'uploads/audios/Thriller/BillieJean.mp3', 2, 'Dance-Pop']
            ];

            $stmt = $this->conn->prepare("INSERT INTO canciones (titulo, id_album, archivo_url, numero_pista, genero, es_sistema) VALUES (?, ?, ?, ?, ?, 1)");
            foreach ($songs as $song) {
                $stmt->execute($song);
            }
        }
    }
}
