<?php
/**
 * POST /api/update-car.php  (admin only)
 *
 * Body: { "id": 5, ...same fields as add-car.php... }
 * Updates the vehicle with the given numeric id.
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

$id = (int) ($input['id'] ?? 0);
if ($id <= 0) {
    json_out(['error' => 'Missing vehicle id'], 400);
}

if (!car_validate($input, $error)) {
    json_out(['error' => $error], 400);
}

try {
    // Fetch the current photo so we can clean it up if it gets replaced
    $sel = db()->prepare('SELECT Image FROM cars WHERE ID = :id');
    $sel->execute([':id' => $id]);
    $existing = $sel->fetch();
    $oldImage = $existing ? ($existing['Image'] ?? null) : null;

    $params = car_payload($input);
    $params[':id'] = $id;

    $stmt = db()->prepare(
        'UPDATE cars SET
            Brand = :brand, Model = :model, Price = :price,
            Image = :image, Transmission = :transmission,
            Fuel = :fuel, Body = :body, Description = :description
         WHERE ID = :id'
    );

    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        json_out(['error' => 'Vehicle not found or no changes'], 404);
    }

    // If the photo was replaced with a new one, remove the old file
    $newImage = $params[':image'];
    if ($oldImage && $newImage && $oldImage !== $newImage) {
        delete_uploaded_file($oldImage);
    }

    json_out(['ok' => true, 'id' => $id]);
} catch (PDOException $e) {
    json_out(['error' => 'Database error', 'message' => $e->getMessage()], 500);
}