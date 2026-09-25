<?php
// views/landing.php
require_once __DIR__ . '/../config/database.php';
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Leer mensajes de sesión
$modal_message = $_SESSION['modal_message'] ?? null;
$modal_type = $_SESSION['modal_type'] ?? null;
unset($_SESSION['modal_message'], $_SESSION['modal_type']);
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
    <title>Audiophille's – La música no solo se escucha...</title>

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap" rel="stylesheet">

    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@0.294.0"></script>

    <!-- Favicon -->
    <link rel="icon" href="<?= BASE_URL ?>assets/img/icon.jpeg" type="image/jpeg">

    <!-- CSS -->
    <link rel="stylesheet" href="<?= BASE_URL ?>assets/css/style.css">
    <link rel="stylesheet" href="<?= BASE_URL ?>assets/css/components.css">
</head>

<body data-message="<?= htmlspecialchars($modal_message ?? '', ENT_QUOTES, 'UTF-8') ?>"
    data-type="<?= htmlspecialchars($modal_type ?? '', ENT_QUOTES, 'UTF-8') ?>">

    <!-- Fondos animados -->
    <div class="mesh-background"></div>
    <div class="cosmic-glow-overlay"></div>

    <!-- ==================== NAVBAR ==================== -->
    <nav class="navbar" id="dynamicNavbar">
        <div class="container nav-container">
            <a href="<?= BASE_URL ?>" class="logo-brand">
                <img src="<?= BASE_URL ?>assets/img/icon.jpeg" alt="Audiophille's Logo" class="brand-icon">
                <span class="brand-name">Audiophille's</span>
            </a>
            <ul class="nav-links">
                <li><a href="#hero">Inicio</a></li>
                <li><a href="#features">Ecosistema</a></li>
                <li><a href="#orbits">Órbitas</a></li>
                <li><a href="#system">Sistema</a></li>
                <li><a href="#stats">Análisis</a></li>
            </ul>
            <div class="nav-buttons">
                <button class="btn-outline" id="openLoginBtn">Iniciar Sesión</button>
                <button class="btn-primary" id="openRegisterBtn">Registrarse</button>
            </div>
        </div>
    </nav>

    <!-- ==================== HERO ==================== -->
    <section id="hero" class="hero-cosmic">
        <div class="container hero-content">
            <div class="hero-badge">
                <span class="badge-text">✦ Ecosistema Autónomo</span>
            </div>
            <h1 class="hero-title">
                Audiophille's — <br>
                <span class="gradient-text">La música no solo se escucha...</span>
            </h1>
            <p class="hero-subtitle">
                La música es un cosmos en constante expansión. No basta con darle play; necesitas mapear tus hábitos, conectar órbitas musicales con tus amigos mediante la fusión de ADN y dejar que el asistente musik te guíe a través del ecosistema de nuestro reproductor.
            </p>
            <div class="hero-buttons">
                <button class="btn-primary-glow" id="heroRegisterBtn">Construir tu espacio</button>
                <a href="#system" class="btn-secondary-link">Explorar el sistema <i data-lucide="arrow-right"></i></a>
            </div>
            <div class="hero-scroll-indicator">
                <span class="scroll-text">Desliza para explorar</span>
                <i data-lucide="chevron-down" class="scroll-chevron"></i>
            </div>
        </div>
    </section>

    <!-- ==================== CARACTERÍSTICAS ==================== -->
    <section id="features" class="features-clean">
        <div class="container">
            <header class="section-header">
                <span class="section-tagline">✦ Ecosistema Autónomo</span>
                <h2 class="section-title">Tu sonido. Bajo tu control.</h2>
                <p class="section-description">
                    Tres pilares que transforman la escucha pasiva en una experiencia analítica y personal.
                </p>
            </header>

            <div class="features-grid">
                <div class="flip-card">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <div class="icon-wrapper">
                                <i data-lucide="sliders-horizontal"></i>
                            </div>
                            <h3>Fidelidad Absoluta</h3>
                            <p>Calibración física de frecuencias en tiempo real.</p>
                        </div>
                        <div class="flip-card-back">
                            <h3>Aislamiento Acústico Nativo</h3>
                            <p>Moldea canales de audio locales, frecuencias graves y agudos sin intermediarios ni compresión algorítmica.</p>
                        </div>
                    </div>
                </div>

                <div class="flip-card">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <div class="icon-wrapper">
                                <i data-lucide="orbit"></i>
                            </div>
                            <h3>Asistente musik</h3>
                            <p>La mente inteligente de tu biblioteca local.</p>
                        </div>
                        <div class="flip-card-back">
                            <h3>IA Conversacional</h3>
                            <p>Automatiza colas de reproducción complejas, indexa metadatos y organiza directorios locales mediante comandos analíticos.</p>
                        </div>
                    </div>
                </div>

                <div class="flip-card">
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <div class="icon-wrapper">
                                <i data-lucide="book-open-check"></i>
                            </div>
                            <h3>Diario Crítico</h3>
                            <p>Registra la experiencia detrás de cada re-escucha.</p>
                        </div>
                        <div class="flip-card-back">
                            <h3>Bitácora de Escucha</h3>
                            <p>Escribe reseñas detalladas, califica álbumes y consolida un historial clínico de tu evolución musical a lo largo del tiempo.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== COMUNIDAD ==================== -->
    <section id="orbits" class="community-orbits">
        <div class="container orbits-wrapper">
            <div class="orbits-text">
                <span class="section-tagline">✦ Conexión Simbiótica</span>
                <h2>El Choque de Órbitas</h2>
                <p>
                    No creamos redes sociales de consumo masivo; enlazamos constelaciones personales. Nuestro algoritmo inteligente de <strong>Fusión de ADN Musical</strong> analiza las discrepancias y afinidades de tus diarios de reseñas para colisionar tus gustos con los de tus amigos, generando una playlist híbrida con un equilibrio matemático perfecto.
                </p>
                <div class="orbits-features">
                    <div class="orbit-feature-item">
                        <i data-lucide="git-merge"></i>
                        <span>Fusión algorítmica de playlists</span>
                    </div>
                    <div class="orbit-feature-item">
                        <i data-lucide="users"></i>
                        <span>Compatibilidad basada en reseñas</span>
                    </div>
                    <div class="orbit-feature-item">
                        <i data-lucide="activity"></i>
                        <span>Análisis de hábitos compartidos</span>
                    </div>
                </div>
            </div>
            <div class="orbits-visualization">
                <div class="cosmic-rings-animation">
                    <div class="ring core-ring"></div>
                    <div class="ring satellite-ring-1"></div>
                    <div class="ring satellite-ring-2"></div>
                    <div class="ring satellite-ring-3"></div>
                    <i data-lucide="sparkles" class="center-spark"></i>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== SISTEMA DE REPRODUCCIÓN ==================== -->
    <section id="system" class="interface-santuario">
        <div class="container">
            <header class="section-header text-center">
                <span class="section-tagline">✦ Familiar y Avanzado</span>
                <h2 class="section-title">El Sistema de Escucha</h2>
                <p class="section-description">
                    Una interfaz que respira la misma atmósfera oscura y precisa que tu reproductor favorito, ahora potenciada con análisis en tiempo real.
                </p>
            </header>
            <div class="mockup-clean-wrapper">
                <div class="mockup-display">
                    <!-- BARRA DE TÍTULO SIMULADA -->
                    <div class="mockup-titlebar">
                        <div class="dots">
                            <span class="dot red"></span>
                            <span class="dot yellow"></span>
                            <span class="dot green"></span>
                        </div>
                        <span class="title-text">Audiophille's — Sistema de Escucha</span>
                    </div>

                    <!-- IMAGEN DE VISTA PREVIA (REEMPLAZA ESTA RUTA) -->
                    <img src="<?= BASE_URL ?>assets\img\ref.png"
                        alt="Vista previa del sistema Audiophille's"
                        class="mockup-image"
                        loading="lazy">

                    <!-- BADGE FLOTANTE -->
                    <div class="mockup-badge">
                        <i data-lucide="sparkles"></i>
                        <span>Autónomo</span>
                    </div>
                </div>

                <div class="mockup-features-list">
                    <div class="mockup-feature">
                        <i data-lucide="sliders"></i>
                        <span>Ecualizador en tiempo real</span>
                    </div>
                    <div class="mockup-feature">
                        <i data-lucide="list-music"></i>
                        <span>Cola inteligente</span>
                    </div>
                    <div class="mockup-feature">
                        <i data-lucide="shuffle"></i>
                        <span>Modos de reproducción</span>
                    </div>
                    <div class="mockup-feature">
                        <i data-lucide="bot"></i>
                        <span>Asistente musik integrado</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- ==================== ENTRETENIMIENTO ==================== -->
    <section class="entertainment-game">
        <div class="container game-box-layout">
            <div class="game-icon-side">
                <i data-lucide="binary" class="deco-icon"></i>
                <span class="game-badge">Entretenimiento</span>
            </div>
            <div class="game-text-side">
                <h3>Pon a prueba tu oído analítico</h3>
                <p>
                    Mueve el juego interactivo directamente en tu reproductor. Escucha micro-fragmentos aislados de tus archivos locales, descifra frecuencias ocultas e identifica las pistas para acumular registros de precisión auditiva.
                </p>
                <div class="game-stats-mini">
                    <span><i data-lucide="clock"></i> Fragmentos de 10s</span>
                    <span><i data-lucide="target"></i> Puntuación acumulativa</span>
                    <span><i data-lucide="trophy"></i> Registro de aciertos</span>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== ESTADÍSTICAS ==================== -->
    <section id="stats" class="analytics-preview">
        <div class="container">
            <header class="section-header text-center">
                <span class="section-tagline">✦ Mapeo Clínico</span>
                <h2 class="section-title">Tu comportamiento musical en datos</h2>
                <p class="section-description">
                    Una vez dentro del ecosistema, Audiophille's disecciona minuciosamente tus patrones de escucha para estructurar métricas exactas:
                </p>
            </header>

            <div class="stats-preview-grid">
                <div class="stat-preview-card">
                    <div class="card-head">
                        <i data-lucide="library"></i>
                        <span class="stat-counter-placeholder">—</span>
                    </div>
                    <h4>Base de Datos</h4>
                    <p>Diagramamos una DB desde cero totalmente funcional para nuestro sistema.</p>
                </div>

                <div class="stat-preview-card">
                    <div class="card-head">
                        <i data-lucide="activity"></i>
                        <span class="stat-counter-placeholder">—</span>
                    </div>
                    <h4>Curva de Frecuencias</h4>
                    <p>Monitoreo constante de tus rangos de ecualización preferidos y géneros dominantes.</p>
                </div>

                <div class="stat-preview-card">
                    <div class="card-head">
                        <i data-lucide="git-merge"></i>
                        <span class="stat-counter-placeholder">—</span>
                    </div>
                    <h4>Colisiones de ADN</h4>
                    <p>Índice cuantitativo de playlists combinadas exitosamente mediante choques de órbitas.</p>
                </div>

                <div class="stat-preview-card">
                    <div class="card-head">
                        <i data-lucide="pen-tool"></i>
                        <span class="stat-counter-placeholder">—</span>
                    </div>
                    <h4>Densidad Crítica</h4>
                    <p>Total de reseñas archivadas e impactos estadísticos generados en tu diario de análisis.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== CTA ==================== -->
    <section class="cta-closure">
        <div class="container cta-box">
            <div class="cta-inner-content">
                <div class="cta-icon-decoration">
                    <i data-lucide="sparkles"></i>
                </div>
                <h2>Crea tu espacio local</h2>
                <p>
                    Establece un entorno seguro, autónomo y privado para tus archivos. Tu música te está esperando en su forma más pura.
                </p>
                <div class="cta-action-area">
                    <button class="btn-primary" id="ctaRegisterDirectBtn">Iniciar Configuración Nativa</button>
                    <span class="cta-subtext">Sin dependencias externas. 100% local.</span>
                </div>
            </div>
        </div>
    </section>

    <!-- ==================== FOOTER ==================== -->
    <footer class="footer-minimal">
        <div class="container footer-content">
            <div class="footer-meta">
                <div class="footer-brand">
                    <img src="<?= BASE_URL ?>assets/img/icon.jpeg" alt="Audiophille's" class="footer-icon">
                    <span>Audiophille's</span>
                </div>
                <p>&copy; 2026 Audiophille's. Arquitectura y desarrollo local. Caracas, Venezuela.</p>
            </div>
            <div class="footer-links">
                <a href="#">Política de Privacidad</a>
                <a href="#">Términos de Uso</a>
                <a href="https://github.com" target="_blank" aria-label="GitHub"><i data-lucide="github"></i></a>
                <a href="#" aria-label="Twitter"><i data-lucide="twitter"></i></a>
                <a href="#" aria-label="Instagram"><i data-lucide="instagram"></i></a>
            </div>
        </div>
    </footer>

    <!-- ==================== MODALES ==================== -->

    <!-- Modal de Login -->
    <div id="loginModal" class="modal">
        <div class="modal-card">
            <span class="close-modal" data-modal="loginModal">&times;</span>
            <h2>Iniciar Sesión</h2>
            <form action="<?= BASE_URL ?>controllers/LoginController.php" method="POST" id="loginForm">
                <div class="auth-input-group">
                    <input type="email" name="email" placeholder="Correo electrónico" autocomplete="email" required>
                </div>
                <div class="auth-input-group">
                    <div class="password-wrapper">
                        <input type="password" name="password" placeholder="Contraseña" autocomplete="current-password" required>
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

    <!-- Modal de Registro -->
    <div id="registerModal" class="modal">
        <div class="modal-card">
            <span class="close-modal" data-modal="registerModal">&times;</span>
            <h2>Crear espacio musical</h2>
            <form action="<?= BASE_URL ?>controllers/RegisterController.php" method="POST" id="registerForm">
                <div class="auth-input-group">
                    <input type="text" name="username" placeholder="Nombre de usuario" autocomplete="username" required>
                </div>
                <div class="auth-input-group">
                    <input type="email" name="email" placeholder="Correo electrónico" autocomplete="email" required>
                </div>
                <div class="auth-input-group">
                    <div class="password-wrapper">
                        <input type="password" name="password" id="registerPasswordModal" placeholder="Contraseña de acceso" autocomplete="new-password" required>
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
                <button type="submit" class="auth-btn-primary">Inicializar Cuenta</button>
            </form>
            <p class="auth-link">¿Ya tienes cuenta? <a href="#" data-switch="login">Inicia sesión aquí</a></p>
        </div>
    </div>

    <!-- ===== MODAL DE ÉXITO ===== -->
    <div id="successModal" class="modal">
        <div class="modal-card success-modal">
            <div class="success-icon-wrapper">
                <div class="success-icon">
                    <i data-lucide="check-circle"></i>
                </div>
            </div>
            <h2 id="successTitle">¡Éxito!</h2>
            <p id="successMessage">Operación realizada correctamente.</p>
            <button class="auth-btn-primary" id="successBtn">Continuar</button>
        </div>
    </div>

    <!-- ===== MODAL DE ERROR ===== -->
    <div id="errorModal" class="modal">
        <div class="modal-card error-modal">
            <div class="error-icon-wrapper">
                <div class="error-icon">
                    <i data-lucide="alert-circle"></i>
                </div>
            </div>
            <h2 id="errorTitle">Error</h2>
            <p id="errorMessage">Ha ocurrido un error.</p>
            <button class="auth-btn-primary" id="errorBtn">Intentar de nuevo</button>
        </div>
    </div>

    <!-- ==================== SCRIPTS ==================== -->
    <script src="<?= BASE_URL ?>assets/js/landing.js"></script>

</body>

</html>