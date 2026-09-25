<?php
require_once dirname(__DIR__) . '/models/User.php';
require_once dirname(__DIR__) . '/config/database.php';

$user = new User();
$user->logout();
header('Location: ' . BASE_URL);
exit();
