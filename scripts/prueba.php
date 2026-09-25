<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Database.php';

$db = new Database();
$pdo = $db->getConnection();

// ============================================================
// CONFIGURACIÓN DEL USUARIO DE PRUEBA
// ============================================================
$TEST_USER = [
    'nombre_usuario' => 'demo_user',
    'email'          => 'demo@audiophilles.local',
    'password'       => 'Demo1234!', // Contraseña en texto plano (se hashea)
    'avatar'         => null,
];

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function log_msg($msg) {
    echo $msg . "\n";
}

function getUserOrCreate($pdo, $userData) {
    // Buscar si ya existe
    $stmt = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE email = ? OR nombre_usuario = ?");
    $stmt->execute([$userData['email'], $userData['nombre_usuario']]);
    $id = $stmt->fetchColumn();
    if ($id) {
        log_msg("  ℹ️  Usuario '{$userData['nombre_usuario']}' ya existe (id=$id). Reutilizando...");
        return $id;
    }

    // Crear
    $hash = password_hash($userData['password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO usuarios (nombre_usuario, email, password_hash, avatar) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userData['nombre_usuario'], $userData['email'], $hash, $userData['avatar']]);
    $id = $pdo->lastInsertId();
    log_msg("  ✅ Usuario '{$userData['nombre_usuario']}' creado (id=$id)");
    log_msg("     📧 Email: {$userData['email']}");
    log_msg("     🔑 Password: {$userData['password']}");
    return $id;
}

function getRandomItems($array, $count) {
    if (count($array) <= $count) return $array;
    shuffle($array);
    return array_slice($array, 0, $count);
}

// ============================================================
// PROCESO PRINCIPAL
// ============================================================
log_msg("🚀 Iniciando seeding de datos de prueba...\n");

// ------------------------------------------------------------
// 1. Crear usuario de prueba
// ------------------------------------------------------------
log_msg("📌 Paso 1: Creando usuario de prueba...");
$userId = getUserOrCreate($pdo, $TEST_USER);
log_msg("");

// ------------------------------------------------------------
// 2. Añadir álbumes del sistema a la biblioteca del usuario
// ------------------------------------------------------------
log_msg("📌 Paso 2: Añadiendo álbumes a la biblioteca...");
$stmt = $pdo->query("SELECT id_album FROM albumes WHERE es_sistema = 1 ORDER BY RAND() LIMIT 8");
$albums = $stmt->fetchAll(PDO::FETCH_COLUMN);

foreach ($albums as $albumId) {
    $stmt = $pdo->prepare("INSERT IGNORE INTO usuario_albumes (id_usuario, id_album) VALUES (?, ?)");
    $stmt->execute([$userId, $albumId]);
}
log_msg("  ✅ " . count($albums) . " álbumes añadidos a la biblioteca\n");

// ------------------------------------------------------------
// 3. Obtener todas las canciones del sistema para trabajar
// ------------------------------------------------------------
$stmt = $pdo->query("
    SELECT c.id_cancion, c.titulo, c.id_album, a.titulo as album_titulo, ar.nombre_artista as artista
    FROM canciones c
    JOIN albumes a ON c.id_album = a.id_album
    JOIN artistas ar ON a.id_artista = ar.id_artista
    WHERE c.es_sistema = 1
    ORDER BY RAND()
    LIMIT 50
");
$allSongs = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($allSongs)) {
    log_msg("⚠️  No hay canciones en el sistema. Ejecuta primero seed_metadata.php");
    exit(1);
}
log_msg("📌 Paso 3: Encontradas " . count($allSongs) . " canciones para trabajar\n");

// ------------------------------------------------------------
// 4. Crear playlists
// ------------------------------------------------------------
log_msg("📌 Paso 4: Creando playlists...");
$playlistNames = [
    'Mis Favoritas del Rock',
    'Para estudiar',
    'Clásicos inolvidables',
    'Descubrimientos 2026',
];

foreach ($playlistNames as $idx => $name) {
    // Verificar si ya existe
    $stmt = $pdo->prepare("SELECT id_playlist FROM playlists WHERE nombre = ? AND id_usuario = ?");
    $stmt->execute([$name, $userId]);
    $playlistId = $stmt->fetchColumn();

    if (!$playlistId) {
        $stmt = $pdo->prepare("INSERT INTO playlists (nombre, id_usuario, portada_url, descripcion) VALUES (?, ?, ?, ?)");
        $stmt->execute([
            $name,
            $userId,
            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400',
            'Playlist de prueba #' . ($idx + 1)
        ]);
        $playlistId = $pdo->lastInsertId();
        log_msg("  ✅ Playlist '$name' creada (id=$playlistId)");
    } else {
        log_msg("  ℹ️  Playlist '$name' ya existe (id=$playlistId)");
    }

    // Añadir 5-8 canciones aleatorias a cada playlist
    $songsForPlaylist = getRandomItems($allSongs, rand(5, 8));
    foreach ($songsForPlaylist as $order => $song) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO playlist_canciones (id_playlist, id_cancion, orden) VALUES (?, ?, ?)");
        $stmt->execute([$playlistId, $song['id_cancion'], $order]);
    }
    log_msg("     🎵 " . count($songsForPlaylist) . " canciones añadidas");
}
log_msg("");

// ------------------------------------------------------------
// 5. Marcar canciones como favoritas
// ------------------------------------------------------------
log_msg("📌 Paso 5: Marcando canciones como favoritas...");
$favorites = getRandomItems($allSongs, 15);
foreach ($favorites as $song) {
    $stmt = $pdo->prepare("INSERT IGNORE INTO favoritos (id_usuario, id_cancion) VALUES (?, ?)");
    $stmt->execute([$userId, $song['id_cancion']]);
}
log_msg("  ✅ " . count($favorites) . " canciones marcadas como favoritas\n");

// ------------------------------------------------------------
// 6. Registrar reproducciones para el top artist
// ------------------------------------------------------------
log_msg("📌 Paso 6: Registrando reproducciones...");
$playSongs = getRandomItems($allSongs, 30);
foreach ($playSongs as $song) {
    $stmt = $pdo->prepare("INSERT INTO reproducciones_artista (id_usuario, nombre_artista, fecha) VALUES (?, ?, NOW())");
    $stmt->execute([$userId, $song['artista']]);
}
log_msg("  ✅ " . count($playSongs) . " reproducciones registradas\n");

// ------------------------------------------------------------
// 7. Escribir reseñas
// ------------------------------------------------------------
log_msg("📌 Paso 7: Escribiendo reseñas...");

$reviewTexts = [
    "Una obra maestra atemporal. La producción y la letra son simplemente perfectas.",
    "Me encanta cómo mezcla diferentes géneros en una sola canción. Muy innovador.",
    "Un clásico que nunca pasa de moda. La voz del cantante es única.",
    "La melodía es pegajosa y la instrumentación es impecable. La recomiendo totalmente.",
    "No soy muy fan de este género, pero esta canción me atrapó desde la primera escucha.",
    "Un viaje emocional de principio a fin. La letra me llegó al corazón.",
    "Definitivamente una de las mejores canciones de la historia. Un 10/10.",
    "El solo de guitarra es épico. Escucharla en vivo debe ser increíble.",
    "Me transporta a otra época. La producción suena atemporal.",
    "La estructura de la canción es perfecta. Cada parte encaja como un rompecabezas.",
];

$reviewSongs = getRandomItems($allSongs, 12);
$reviewCount = 0;
foreach ($reviewSongs as $song) {
    $rating = rand(30, 50) / 10; // 3.0 - 5.0
    $text = $reviewTexts[array_rand($reviewTexts)];
    $rewatch = rand(0, 1);

    // Verificar que no exista ya una reseña de este usuario para esta canción
    $stmt = $pdo->prepare("SELECT 1 FROM resenas WHERE id_usuario = ? AND id_cancion = ?");
    $stmt->execute([$userId, $song['id_cancion']]);
    if ($stmt->fetchColumn()) continue;

    $stmt = $pdo->prepare("
        INSERT INTO resenas 
        (id_usuario, id_cancion, puntuacion, comentario, escuchada_nuevamente, titulo_cancion_texto, artista_texto) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $userId,
        $song['id_cancion'],
        $rating,
        $text,
        $rewatch,
        $song['titulo'],
        $song['artista']
    ]);
    $reviewId = $pdo->lastInsertId();
    $reviewCount++;

    // Registrar actividad social
    $stmt = $pdo->prepare("
        INSERT INTO actividad_social (id_usuario, tipo_actividad, id_referencia, descripcion) 
        VALUES (?, 'reseña', ?, ?)
    ");
    $stmt->execute([
        $userId,
        $reviewId,
        "{$TEST_USER['nombre_usuario']} reseñó '{$song['titulo']}' de {$song['artista']} ⭐ $rating/5"
    ]);
}
log_msg("  ✅ $reviewCount reseñas creadas\n");

// ------------------------------------------------------------
// 8. Seguir artistas
// ------------------------------------------------------------
log_msg("📌 Paso 8: Siguiendo artistas...");
$stmt = $pdo->query("SELECT DISTINCT nombre_artista FROM artistas WHERE imagen_url IS NOT NULL LIMIT 10");
$artists = $stmt->fetchAll(PDO::FETCH_COLUMN);
foreach ($artists as $artistName) {
    $stmt = $pdo->prepare("INSERT IGNORE INTO artistas_seguidos (id_usuario, nombre_artista) VALUES (?, ?)");
    $stmt->execute([$userId, $artistName]);
}
log_msg("  ✅ " . count($artists) . " artistas seguidos\n");

// ------------------------------------------------------------
// 9. Configurar ecualizador
// ------------------------------------------------------------
log_msg("📌 Paso 9: Configurando ecualizador...");
$stmt = $pdo->prepare("
    INSERT INTO configuracion_eq (id_usuario, bass, vocals, treble) 
    VALUES (?, 5, 3, -2)
    ON DUPLICATE KEY UPDATE bass = 5, vocals = 3, treble = -2
");
$stmt->execute([$userId]);
log_msg("  ✅ Ecualizador configurado (bass=5, vocals=3, treble=-2)\n");

// ------------------------------------------------------------
// 10. Inicializar progreso y desbloquear logros
// ------------------------------------------------------------
log_msg("📌 Paso 10: Inicializando progreso y logros...");

// Crear o actualizar progreso
$stmt = $pdo->prepare("
    INSERT INTO progreso_usuario (id_usuario, xp_total, nivel_actual, partidas_jugadas) 
    VALUES (?, 250, 3, 5)
    ON DUPLICATE KEY UPDATE xp_total = 250, nivel_actual = 3, partidas_jugadas = 5
");
$stmt->execute([$userId]);

// Desbloquear logros básicos
$achievements = [
    'first_play'     => 'Reproduce tu primera canción',
    'first_review'   => 'Escribe tu primera reseña',
    'first_playlist' => 'Crea tu primera playlist',
    'gamer'          => 'Juega tu primera partida',
    'social'         => 'Tienes 5 seguidores',
];

foreach ($achievements as $idLogro => $desc) {
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO logros_usuario (id_usuario, id_logro) 
        VALUES (?, ?)
    ");
    $stmt->execute([$userId, $idLogro]);
    log_msg("  🏆 Logro desbloqueado: $idLogro");
}
log_msg("");

// ------------------------------------------------------------
// 11. Registrar actividades sociales variadas
// ------------------------------------------------------------
log_msg("📌 Paso 11: Creando actividad social...");
$activities = [
    ['favorito',  null, "{$TEST_USER['nombre_usuario']} marcó una canción como favorita"],
    ['playlist_creada', null, "{$TEST_USER['nombre_usuario']} creó la playlist 'Mis Favoritas del Rock'"],
    ['playlist_creada', null, "{$TEST_USER['nombre_usuario']} creó la playlist 'Para estudiar'"],
];

foreach ($activities as $act) {
    $stmt = $pdo->prepare("
        INSERT INTO actividad_social (id_usuario, tipo_actividad, id_referencia, descripcion) 
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$userId, $act[0], $act[1], $act[2]]);
}
log_msg("  ✅ " . count($activities) . " actividades creadas\n");

// ------------------------------------------------------------
// RESUMEN FINAL
// ------------------------------------------------------------
echo "═══════════════════════════════════════════════════════════\n";
echo "🎉 ¡Seeding de pruebas completado!\n";
echo "═══════════════════════════════════════════════════════════\n";
echo "👤 Usuario de prueba:\n";
echo "   📧 Email:    {$TEST_USER['email']}\n";
echo "   🔑 Password: {$TEST_USER['password']}\n";
echo "   🆔 User ID:  $userId\n";
echo "\n📊 Resumen de datos creados:\n";

$stats = [
    'Álbumes en biblioteca' => "SELECT COUNT(*) FROM usuario_albumes WHERE id_usuario = $userId",
    'Playlists'             => "SELECT COUNT(*) FROM playlists WHERE id_usuario = $userId",
    'Canciones en playlists'=> "SELECT COUNT(*) FROM playlist_canciones pc JOIN playlists p ON pc.id_playlist = p.id_playlist WHERE p.id_usuario = $userId",
    'Favoritos'             => "SELECT COUNT(*) FROM favoritos WHERE id_usuario = $userId",
    'Reseñas'               => "SELECT COUNT(*) FROM resenas WHERE id_usuario = $userId",
    'Reproducciones'        => "SELECT COUNT(*) FROM reproducciones_artista WHERE id_usuario = $userId",
    'Artistas seguidos'     => "SELECT COUNT(*) FROM artistas_seguidos WHERE id_usuario = $userId",
    'Logros desbloqueados'  => "SELECT COUNT(*) FROM logros_usuario WHERE id_usuario = $userId",
    'XP total'              => "SELECT xp_total FROM progreso_usuario WHERE id_usuario = $userId",
    'Nivel actual'          => "SELECT nivel_actual FROM progreso_usuario WHERE id_usuario = $userId",
];

foreach ($stats as $label => $query) {
    $value = $pdo->query($query)->fetchColumn();
    echo "   • " . str_pad($label . ':', 25) . $value . "\n";
}

echo "\n🚀 Ahora puedes iniciar sesión con esas credenciales y probar todo.\n";
echo "═══════════════════════════════════════════════════════════\n";