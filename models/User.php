<?php
// models/User.php - Modelo de usuario con validaciones y métodos
require_once 'Database.php';

class User
{
    private $conn;
    private $table = 'usuarios';

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * Validar email (debe contener @ y formato válido)
     */
    private function validateEmail($email)
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validar contraseña: mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial
     */
    private function validatePassword($password)
    {
        $pattern = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/';
        return preg_match($pattern, $password) === 1;
    }

    /**
     * Registrar un nuevo usuario
     * @return array ['success' => bool, 'message' => string]
     */
    public function register($nombre_usuario, $email, $password)
    {
        // Validar email
        if (!$this->validateEmail($email)) {
            return ['success' => false, 'message' => 'El correo electrónico no es válido (debe contener @ y un dominio).'];
        }
        // Validar contraseña
        if (!$this->validatePassword($password)) {
            return ['success' => false, 'message' => 'La contraseña debe tener mínimo 8 caracteres, incluir mayúscula, minúscula, número y símbolo.'];
        }
        // Verificar si el email o nombre de usuario ya existen
        $checkQuery = "SELECT id_usuario FROM " . $this->table . " WHERE email = :email OR nombre_usuario = :nombre LIMIT 1";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bindParam(':email', $email);
        $checkStmt->bindParam(':nombre', $nombre_usuario);
        $checkStmt->execute();
        if ($checkStmt->rowCount() > 0) {
            return ['success' => false, 'message' => 'El correo electrónico o el nombre de usuario ya están registrados.'];
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $query = "INSERT INTO " . $this->table . " (nombre_usuario, email, password_hash) VALUES (:nombre, :email, :hash)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $nombre_usuario);
        $stmt->bindParam(':email', $email);
        $stmt->bindParam(':hash', $hashed);

        try {
            $stmt->execute();
            return ['success' => true, 'message' => 'Usuario registrado correctamente. Ya puedes iniciar sesión.'];
        } catch (PDOException $e) {
            error_log("Error en registro: " . $e->getMessage());
            return ['success' => false, 'message' => 'Error interno al registrar. Intente más tarde.'];
        }
    }

    /**
     * Iniciar sesión
     * @return array ['success' => bool, 'message' => string, 'user_id' => int|null, 'user_name' => string|null]
     */
    public function login($email, $password)
    {
        $query = "SELECT id_usuario, nombre_usuario, email, password_hash FROM " . $this->table . " WHERE email = :email LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() == 1) {
            $user = $stmt->fetch();
            if (password_verify($password, $user['password_hash'])) {
                // Actualizar último acceso
                $update = "UPDATE " . $this->table . " SET ultimo_acceso = NOW() WHERE id_usuario = :id";
                $updStmt = $this->conn->prepare($update);
                $updStmt->bindParam(':id', $user['id_usuario']);
                $updStmt->execute();

                return [
                    'success' => true,
                    'message' => 'Inicio de sesión exitoso.',
                    'user_id' => $user['id_usuario'],
                    'user_name' => $user['nombre_usuario']
                ];
            }
        }
        return ['success' => false, 'message' => 'Correo o contraseña incorrectos.'];
    }

    /**
     * Cerrar sesión (solo destruye la sesión PHP, no requiere BD)
     */
    public function logout()
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $_SESSION = [];
        session_destroy();
        return ['success' => true, 'message' => 'Sesión cerrada.'];
    }
}
