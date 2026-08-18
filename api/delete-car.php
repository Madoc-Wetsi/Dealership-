<?php
/**
 * POST /api/delete-car.php  (admin only)
 *
 * Body: { "id": 5 }  or  { "slug": "my-car" }
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['error' => 'Method not allowed. Use POST.'], 405);
}

require_admin();

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    json_out(['error' => 'Invalid JSON body'], 400);
}

$id   = (int) ($input['id'] ?? 0);

if ($id <= 0) {
    json_out(['error' => 'Missing valid id'], 400);
}

try {
    // Remove the car's uploaded photo first (safe — only inside uploads/)
    $sel = db()->prepare('SELECT Image FROM cars WHERE ID = :id');
    $sel->execute([':id' => $id]);
    $existing = $sel->fetch();
    if ($existing) {
        delete_uploaded_file($existing['Image'] ?? null);
    }

    $stmt  = db()->prepare('DELETE FROM cars WHERE ID = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        json_out(['error' => 'Vehicle not found'], 404);
    }

    json_out(['ok' => true]);
} catch (PDOException $e) {
    json_out(['error' => 'Database error', 'message' => $e->getMessage()], 500);
}