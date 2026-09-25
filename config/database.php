<?php
// config/database.php - Configuración de la base de datos y URL base

// --- CONFIGURACIÓN DE BASE DE DATOS ---
define('DB_HOST', 'localhost');
define('DB_NAME', 'audiophiles_db');
define('DB_USER', 'root');
define('DB_PASS', '1');
define('DB_CHARSET', 'utf8mb4');

// --- URL BASE (cambia esto si tu proyecto está en una subcarpeta) ---
// Ejemplo: si accedes por http://localhost/Audiophille_landing/
define('BASE_URL', '/Audiophille_landing/');

// --- CONFIGURACIÓN DE SESIÓN ---
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 0); // Cambiar a 1 si usas HTTPS
session_name('AUDIOPHILLE_SID');
