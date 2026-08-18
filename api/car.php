<?php
/**
 * GET /api/car.php?id={slug|id}
 *
 * Returns a single vehicle (by unique slug or numeric id).
 */

require_once __DIR__ . '/db.php';

$id = $_GET['id'] ?? '';

if ($id === '') {
    json_out(['error' => 'Missing id parameter'], 400);
}

try {
    // Ids are numeric in car_system.cars
    if (!is_numeric($id)) {
        json_out(['error' => 'Invalid vehicle id'], 400);
    }

    $stmt = db()->prepare('SELECT * FROM cars WHERE ID = :id LIMIT 1');
    $stmt->execute([':id' => (int) $id]);

    $row = $stmt->fetch();

    if (!$row) {
        json_out(['error' => 'Vehicle not found'], 404);
    }

    json_out(car_map($row));
} catch (PDOException $e) {
    json_out(['error' => 'Database error', 'message' => $e->getMessage()], 500);
}