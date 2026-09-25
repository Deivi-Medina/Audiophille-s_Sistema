<?php
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . BASE_URL);
    exit();
}

$nombre = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($nombre) || empty($email) || empty($password)) {
    session_start();
    $_SESSION['modal_message'] = 'Todos los campos son obligatorios.';
    $_SESSION['modal_type'] = 'error';
    header('Location: ' . BASE_URL);
    exit();
}

$user = new User();
$result = $user->register($nombre, $email, $password);

session_start();
if ($result['success']) {
    $_SESSION['modal_message'] = $result['message'];
    $_SESSION['modal_type'] = 'success';
} else {
    $_SESSION['modal_message'] = $result['message'];
    $_SESSION['modal_type'] = 'error';
}
header('Location: ' . BASE_URL);
exit();
