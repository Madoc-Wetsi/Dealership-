<?php
/**
 * POST /api/login.php
 *
 * Authenticates against the `admin` table in the car_system database
 * (columns: user_name, password — plain text).
 *
 * Body: { "username": "...", "password": "..." } -> { ok: true }
 * Invalid credentials -> 401
 */

require_once __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['error' => 'Method not allowed. Use POST.'], 405);
}

$input    = json_decode(file_get_contents('php://input'), true);
$username = is_array($input) ? trim((string) ($input['username'] ?? '')) : '';
$password = is_array($input) ? (string) ($input['password'] ?? '') : '';

if ($username === '' || $password === '') {
    json_out(['error' => 'Username and password are required'], 400);
}

try {
    $stmt = admin_db()->prepare(
        'SELECT user_name, password FROM admin WHERE user_name = :u LIMIT 1'
    );
    $stmt->execute([':u' => $username]);
    $row = $stmt->fetch();

    if ($row && hash_equals((string) $row['password'], $password)) {
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        json_out(['ok' => true]);
    }

    json_out(['error' => 'Invalid username or password'], 401);
} catch (PDOException $e) {
    json_out([
        'error'   => 'Login database not available',
        'message' => $e->getMessage(),
    ], 500);
}