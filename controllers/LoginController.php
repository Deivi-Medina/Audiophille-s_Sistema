<?php
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . BASE_URL);
    exit();
}

$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($email) || empty($password)) {
    session_start();
    $_SESSION['modal_message'] = 'Por favor, complete todos los campos.';
    $_SESSION['modal_type'] = 'error';
    header('Location: ' . BASE_URL);
    exit();
}

$user = new User();
$result = $user->login($email, $password);

session_start();
if ($result['success']) {
    $_SESSION['user_id'] = $result['user_id'];
    $_SESSION['user_name'] = $result['user_name'];
    $_SESSION['user_email'] = $email;
    header('Location: ' . BASE_URL);
} else {
    $_SESSION['modal_message'] = $result['message'];
    $_SESSION['modal_type'] = 'error';
    header('Location: ' . BASE_URL);
}
exit();
