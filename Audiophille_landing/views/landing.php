<?php
// views/landing.php
require_once __DIR__ . '/../config/database.php';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Leer mensajes de sesión (para errores de login/registro)
$modal_message = $_SESSION['modal_message'] ?? null;
$modal_type = $_SESSION['modal_type'] ?? null;
unset($_SESSION['modal_message'], $_SESSION['modal_type']);
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>Audiophille's – Tu música, en otro nivel</title>
    <!-- Fuente y librería de iconos -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/lucide@latest"></script>
    <!-- Archivos externos -->
    <link rel="stylesheet" href="<?= BASE_URL ?>assets/css/style.css">
    <link rel="stylesheet" href="<?= BASE_URL ?>assets/css/components.css">
    <script src="<?= BASE_URL ?>assets/js/main.js" defer></script>
    <script src="<?= BASE_URL ?>assets/js/landing.js" defer></script>
</head>

<body data-message="<?= htmlspecialchars($modal_message ?? '', ENT_QUOTES, 'UTF-8') ?>"
    data-type="<?= htmlspecialchars($modal_type ?? '', ENT_QUOTES, 'UTF-8') ?>">

    <!-- ==================== NAVBAR ==================== -->
    <nav class="navbar">
        <div class="container nav-container">
            <a href="<?= BASE_URL ?>" class="logo">🎧 Audiophille's</a>
            <ul class="nav-links">
                <li><a href="#hero">Inicio</a></li>
                <li><a href="#features">Características</a></li>
                <li><a href="#player">Reproductor</a></li>
                <li><a href="#contact">Contacto</a></li>
            </ul>
            <div class="nav-buttons">
                <button class="btn-outline" id="openLoginBtn">Iniciar Sesión</button>
                <button class="btn-primary" id="openRegisterBtn">Registrarse</button>
            </div>
        </div>
    </nav>

    <!-- ==================== HERO ==================== -->
    <section id="hero" class="hero">
        <div class="container hero-content">
            <h1 class="hero-title">Tu música,<br><span class="gradient-text">en otro nivel</span></h1>
            <p>Ecualizador profesional, asistente IA, cola inteligente y un juego para poner a prueba tus oídos.</p>
            <div class="hero-buttons">
                <button class="btn-primary" id="heroRegisterBtn">Comenzar ahora</button>
                <a href="#player" class="btn-outline">Ver reproductor</a>
            </div>
        </div>
    </section>

    <!-- ==================== CARACTERÍSTICAS (FLIP CARDS) ==================== -->
    <section id="features" class="features">
        <div class="container">
            <h2 class="section-title">¿Por qué Audiophille's?</h2>
            <div class="features-grid">
                <div class="flip-card">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <i data-lucide="sliders" class="feature-icon"></i>
                            <h3>Ecualizador profesional</h3>
                            <p>Control total sobre bajos, medios y agudos.</p>
                        </div>
                        <div class="flip-card-back">
                            <h3>Personaliza tu sonido</h3>
                            <p>Ajusta frecuencias en tiempo real con respuesta visual.</p>
                        </div>
                    </div>
                </div>
                <div class="flip-card">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <i data-lucide="bot" class="feature-icon"></i>
                            <h3>Asistente musik</h3>
                            <p>Comandos de voz y texto para crear playlists.</p>
                        </div>
                        <div class="flip-card-back">
                            <h3>IA integrada</h3>
                            <p>"Crea una playlist de rock", "reproduce mi favorita" y más.</p>
                        </div>
                    </div>
                </div>
                <div class="flip-card">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <i data-lucide="gamepad-2" class="feature-icon"></i>
                            <h3>Adivina la canción</h3>
                            <p>Pon a prueba tu oído y gana puntos.</p>
                        </div>
                        <div class="flip-card-back">
                            <h3>Juego interactivo</h3>
                            <p>Escucha fragmentos y elige la respuesta correcta.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== MOCKUP DEL REPRODUCTOR (DEMO) ==================== -->
    <section id="player" class="demo">
        <div class="container">
            <h2 class="section-title">Experimenta la interfaz</h2>
            <div class="mockup-wrapper">
                <img src="assets/img/mockup.png" alt="Vista previa del reproductor" class="mockup-img">
                <div class="mockup-placeholder">
                    <i data-lucide="monitor"></i>
                    <p>Captura de pantalla del reproductor</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== ASISTENTE MUSIK ==================== -->
    <section class="assistant">
        <div class="container assistant-content">
            <div class="assistant-text">
                <h2>🎤 Conoce a <span class="gradient-text">musik</span></h2>
                <p>Tu asistente musical con inteligencia artificial. Puedes pedirle cosas como:</p>
                <ul class="assistant-list">
                    <li>📀 <i>"Crea el álbum Discovery de Daft Punk"</i></li>
                    <li>🎵 <i>"Agrega 'Billie Jean' a mi playlist Favoritas"</i></li>
                    <li>📊 <i>"Estadísticas de mi biblioteca"</i></li>
                    <li>🎮 <i>"Juguemos a adivinar la canción"</i></li>
                </ul>
            </div>
            <div class="assistant-avatar">
                <i data-lucide="sparkles"></i>
            </div>
        </div>
    </section>

    <!-- ==================== ESTADÍSTICAS DE USUARIO ==================== -->
    <section class="stats">
        <div class="container stats-grid">
            <div class="stat-card">
                <i data-lucide="music"></i>
                <span class="stat-number" id="totalSongs">0</span>
                <p>Canciones en tu biblioteca</p>
            </div>
            <div class="stat-card">
                <i data-lucide="heart"></i>
                <span class="stat-number" id="totalFavorites">0</span>
                <p>Favoritas</p>
            </div>
            <div class="stat-card">
                <i data-lucide="list-music"></i>
                <span class="stat-number" id="totalPlaylists">0</span>
                <p>Playlists creadas</p>
            </div>
            <div class="stat-card">
                <i data-lucide="star"></i>
                <span class="stat-number" id="totalReviews">0</span>
                <p>Reseñas escritas</p>
            </div>
        </div>
    </section>

    <!-- ==================== CONTACTO Y NEWSLETTER ==================== -->
    <section id="contact" class="contact">
        <div class="container contact-wrapper">
            <div class="contact-form">
                <h2>Suscríbete a novedades</h2>
                <p>Recibe lanzamientos, actualizaciones y consejos musicales.</p>
                <form action="#" method="POST" class="newsletter-form">
                    <input type="email" name="email" placeholder="tu@correo.com" required>
                    <button type="submit" class="btn-primary">Suscribirme</button>
                </form>
            </div>
            <div class="contact-info">
                <h3>¿Necesitas ayuda?</h3>
                <p>📧 soporte@audiophiles.com</p>
                <p>📍 Caracas, Venezuela</p>
                <div class="social-links">
                    <a href="#"><i data-lucide="instagram"></i></a>
                    <a href="#"><i data-lucide="twitter"></i></a>
                    <a href="#"><i data-lucide="github"></i></a>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== FOOTER ==================== -->
    <footer class="footer">
        <div class="container">
            <p>&copy; 2026 Audiophille's. Todos los derechos reservados. | <a href="#">Política de privacidad</a> | <a href="#">Términos de uso</a></p>
        </div>
    </footer>

    <!-- ==================== MODALES ==================== -->
    <!-- Modal de Inicio de Sesión -->
    <div id="loginModal" class="modal">
        <div class="modal-card">
            <span class="close-modal" data-modal="loginModal">&times;</span>
            <h2>Iniciar Sesión</h2>
            <form action="<?= BASE_URL ?>controllers/LoginController.php" method="POST">
                <div class="auth-input-group">
                    <input type="email" name="email" placeholder="Correo electrónico" required>
                </div>
                <div class="auth-input-group">
                    <div class="password-wrapper">
                        <input type="password" name="password" placeholder="Contraseña" required>
                        <button type="button" class="toggle-password" aria-label="Mostrar contraseña">
                            <i data-lucide="eye"></i>
                        </button>
                    </div>
                </div>
                <button type="submit" class="auth-btn-primary">Ingresar</button>
            </form>
            <p class="auth-link">¿No tienes cuenta? <a href="#" data-switch="register">Regístrate aquí</a></p>
        </div>
    </div>

    <!-- Modal de Registro (con validación en tiempo real) -->
    <div id="registerModal" class="modal">
        <div class="modal-card">
            <span class="close-modal" data-modal="registerModal">&times;</span>
            <h2>Crear cuenta</h2>
            <form action="<?= BASE_URL ?>controllers/RegisterController.php" method="POST">
                <div class="auth-input-group">
                    <input type="text" name="username" placeholder="Nombre de usuario" required>
                </div>
                <div class="auth-input-group">
                    <input type="email" name="email" placeholder="Correo electrónico" required>
                </div>
                <div class="auth-input-group">
                    <div class="password-wrapper">
                        <input type="password" name="password" id="registerPasswordModal" placeholder="Contraseña" required>
                        <button type="button" class="toggle-password" aria-label="Mostrar contraseña">
                            <i data-lucide="eye"></i>
                        </button>
                    </div>
                    <div class="password-requirements" id="passwordRequirementsModal">
                        <span class="req-item" data-rule="length"><span class="req-icon">⬜</span> Mínimo 8 caracteres</span>
                        <span class="req-item" data-rule="uppercase"><span class="req-icon">⬜</span> Mayúscula</span>
                        <span class="req-item" data-rule="lowercase"><span class="req-icon">⬜</span> Minúscula</span>
                        <span class="req-item" data-rule="number"><span class="req-icon">⬜</span> Número</span>
                        <span class="req-item" data-rule="symbol"><span class="req-icon">⬜</span> Símbolo</span>
                    </div>
                </div>
                <button type="submit" class="auth-btn-primary">Registrarse</button>
            </form>
            <p class="auth-link">¿Ya tienes cuenta? <a href="#" data-switch="login">Inicia sesión aquí</a></p>
        </div>
    </div>

    <!-- Modal de mensajes general (errores, éxito) -->
    <div id="messageModal" class="modal">
        <div class="modal-card">
            <span class="close-modal" data-modal="messageModal">&times;</span>
            <h2 id="modalTitle">Aviso</h2>
            <p id="modalMessage"></p>
            <button class="auth-btn-primary" id="modalAcceptBtn">Aceptar</button>
        </div>
    </div>

</body>

</html>