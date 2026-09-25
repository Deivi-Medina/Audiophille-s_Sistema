<?php
// index.php - Punto de entrada único
require_once 'config/database.php';
session_start();

require_once 'models/Database.php';
$db = new Database();
$conn = $db->getConnection(); // Esto crea la BD y tablas si es necesario

if (isset($_SESSION['user_id'])) {
    // Usuario logueado → mostrar el reproductor
    include 'views/dashboard.php';
} else {
    // Usuario no logueado → mostrar landing
    include 'views/landing.php';
}
