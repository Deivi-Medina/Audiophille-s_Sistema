<?php
// scripts/seed_metadata.php
// Pobla la base de datos usando TheAudioDB (imágenes de artista) + iTunes (álbumes y canciones)

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Database.php';

$db = new Database();
$pdo = $db->getConnection();

// ============================================================
// CONFIGURACIÓN DE ARTISTAS
// ============================================================
$ARTISTS = [
    'Queen',
    'The Beatles',
    'Michael Jackson',
    "Guns N' Roses",
    'Radiohead',
    'Pink Floyd',
    'The Rolling Stones',
    'David Bowie',
    'Fleetwood Mac',
    'U2',
    'Led Zeppelin',
    'The Who',
    'The Doors',
    'The Beach Boys',
    'Nirvana',
    'Evanescence',
    'AC/DC',
    'The Smiths',
    'System Of A Down',
    'King Crimson',
    'Eminem',
    'Canserbero',
    'The Police',
    'Deftones',
    'Gorillaz',
    'Linkin Park',
    'The Killers',
    'Metallica',
    'Wings',
    'Limp Bizkit',
    'Lady Gaga',
    'Britney Spears',
    'Green Day',
    'Mac Miller',
    'Imagine Dragons',
    'Mac DeMarco'
];

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Petición HTTP con cURL
 */
function fetchApi($url)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (compatible; AudiophilleSeeder/1.0)');
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode !== 200) {
        return null;
    }

    $data = json_decode($response, true);
    return json_last_error() === JSON_ERROR_NONE ? $data : null;
}

/**
 * Obtiene imagen y biografía del artista desde TheAudioDB
 */
function getArtistInfoFromAudioDB($artist)
{
    $url = "https://www.theaudiodb.com/api/v1/json/123/search.php?s=" . urlencode($artist);
    $data = fetchApi($url);
    return $data['artists'][0] ?? null;
}

/**
 * Obtiene TODOS los álbumes de un artista desde iTunes
 */
function getAlbumsFromiTunes($artist, $limit = 5)
{
    $url = "https://itunes.apple.com/search?term=" . urlencode($artist) . "&entity=album&limit=" . $limit;
    $data = fetchApi($url);
    return $data['results'] ?? [];
}

/**
 * Obtiene TODAS las canciones de un álbum desde iTunes
 */
function getSongsFromiTunes($collectionId, $limit = 50)
{
    $url = "https://itunes.apple.com/lookup?id=" . urlencode($collectionId) . "&entity=song&limit=" . $limit;
    $data = fetchApi($url);
    $results = $data['results'] ?? [];

    // El primer resultado es el álbum, el resto son canciones
    $songs = [];
    foreach ($results as $item) {
        if (isset($item['wrapperType']) && $item['wrapperType'] === 'track') {
            $songs[] = $item;
        }
    }
    return $songs;
}

/**
 * Convierte milisegundos a segundos
 */
function msToSeconds($ms)
{
    return $ms > 0 ? (int)round($ms / 1000) : 0;
}

/**
 * Obtiene la URL de la carátula en alta resolución
 */
function getHighResArtwork($url)
{
    if (!$url) return null;
    return str_replace('100x100bb', '600x600bb', $url);
}

/**
 * Busca o crea un artista
 */
function getOrCreateArtist($pdo, $artistName, $imageUrl = null)
{
    $stmt = $pdo->prepare("SELECT id_artista FROM artistas WHERE nombre_artista = ?");
    $stmt->execute([$artistName]);
    $id = $stmt->fetchColumn();
    if ($id) {
        if ($imageUrl) {
            $stmt = $pdo->prepare("UPDATE artistas SET imagen_url = ? WHERE id_artista = ? AND (imagen_url IS NULL OR imagen_url = '')");
            $stmt->execute([$imageUrl, $id]);
        }
        return $id;
    }

    $stmt = $pdo->prepare("INSERT INTO artistas (nombre_artista, imagen_url) VALUES (?, ?)");
    $stmt->execute([$artistName, $imageUrl]);
    return $pdo->lastInsertId();
}

/**
 * Busca o crea un álbum
 */
function getOrCreateAlbum($pdo, $titulo, $idArtista, $anio, $caratula, $genero = 'Various')
{
    $stmt = $pdo->prepare("SELECT id_album FROM albumes WHERE titulo = ? AND id_artista = ? LIMIT 1");
    $stmt->execute([$titulo, $idArtista]);
    $id = $stmt->fetchColumn();
    if ($id) return $id;

    $stmt = $pdo->prepare("INSERT INTO albumes (titulo, id_artista, anio, caratula_url, genero, es_sistema, es_publico) VALUES (?, ?, ?, ?, ?, 1, 1)");
    $stmt->execute([$titulo, $idArtista, $anio, $caratula, $genero]);
    return $pdo->lastInsertId();
}

/**
 * Busca o crea una canción
 */
function getOrCreateCancion($pdo, $titulo, $idAlbum, $duracionSeg, $numeroPista, $genero = 'Various')
{
    $stmt = $pdo->prepare("SELECT id_cancion FROM canciones WHERE titulo = ? AND id_album = ? LIMIT 1");
    $stmt->execute([$titulo, $idAlbum]);
    $id = $stmt->fetchColumn();
    if ($id) return $id;

    $stmt = $pdo->prepare("INSERT INTO canciones (titulo, id_album, archivo_url, duracion_segundos, numero_pista, genero, es_sistema) VALUES (?, ?, ?, ?, ?, ?, 1)");
    $stmt->execute([$titulo, $idAlbum, null, $duracionSeg, $numeroPista, $genero]);
    return $pdo->lastInsertId();
}

// ============================================================
// PROCESO PRINCIPAL
// ============================================================
echo "🚀 Iniciando seeding (TheAudioDB + iTunes)...\n\n";

$total = count($ARTISTS);
$actual = 0;

foreach ($ARTISTS as $artistName) {
    $actual++;
    $porcentaje = round(($actual / $total) * 100);
    echo "\n📌 [$porcentaje%] Procesando artista: $artistName\n";

    // 1. Obtener imagen del artista desde TheAudioDB
    $artistInfo = getArtistInfoFromAudioDB($artistName);
    $artistImage = $artistInfo['strArtistThumb'] ?? null;
    if ($artistImage) {
        echo "  🖼️ Imagen del artista obtenida\n";
    }

    $artistId = getOrCreateArtist($pdo, $artistName, $artistImage);

    // 2. Obtener álbumes desde iTunes
    $albums = getAlbumsFromiTunes($artistName, 5);

    if (empty($albums)) {
        echo "  ⚠️ No se encontraron álbumes en iTunes para $artistName\n";
        continue;
    }

    $albumCount = 0;
    foreach ($albums as $albumData) {
        if ($albumCount >= 3) break; // Máximo 3 álbumes por artista

        $collectionId = $albumData['collectionId'] ?? null;
        if (!$collectionId) continue;

        $albumTitle = substr($albumData['collectionName'] ?? 'Álbum sin título', 0, 100);
        $year = null;
        if (!empty($albumData['releaseDate'])) {
            $year = (int)substr($albumData['releaseDate'], 0, 4);
        }
        $cover = getHighResArtwork($albumData['artworkUrl100'] ?? null);
        $genre = $albumData['primaryGenreName'] ?? 'Various';

        echo "  📀 Álbum: $albumTitle ($year)\n";

        $albumId = getOrCreateAlbum($pdo, $albumTitle, $artistId, $year, $cover, $genre);
        $albumCount++;

        // 3. Obtener TODAS las canciones del álbum
        $songs = getSongsFromiTunes($collectionId);

        if (empty($songs)) {
            echo "    ⚠️ No se encontraron canciones\n";
            continue;
        }

        foreach ($songs as $songData) {
            $trackName = substr($songData['trackName'] ?? 'Canción sin título', 0, 100);
            $duration = msToSeconds($songData['trackTimeMillis'] ?? 0);
            $trackNumber = $songData['trackNumber'] ?? 1;

            if (!$trackName) continue;

            getOrCreateCancion($pdo, $trackName, $albumId, $duration, $trackNumber, $genre);
            $durStr = $duration > 0 ? round($duration / 60) . ':' . str_pad($duration % 60, 2, '0', STR_PAD_LEFT) : '?';
            echo "    🎵 $trackName ($durStr)\n";
        }

        // Esperar 1 segundo entre álbumes para no saturar iTunes
        usleep(1000000);
    }

    // Esperar 2 segundos entre artistas
    usleep(2000000);
}

// ============================================================
// RESUMEN FINAL
// ============================================================
echo "\n🎉 ¡Seeding completado!\n";
echo "📊 Resumen:\n";
echo "  • Artistas: " . $pdo->query("SELECT COUNT(*) FROM artistas")->fetchColumn() . "\n";
echo "  • Álbumes del sistema: " . $pdo->query("SELECT COUNT(*) FROM albumes WHERE es_sistema = 1")->fetchColumn() . "\n";
echo "  • Canciones del sistema: " . $pdo->query("SELECT COUNT(*) FROM canciones WHERE es_sistema = 1")->fetchColumn() . "\n";
echo "  • Canciones con duración: " . $pdo->query("SELECT COUNT(*) FROM canciones WHERE es_sistema = 1 AND duracion_segundos > 0")->fetchColumn() . "\n";
echo "  • Artistas con imagen: " . $pdo->query("SELECT COUNT(*) FROM artistas WHERE imagen_url IS NOT NULL AND imagen_url != ''")->fetchColumn() . "\n";