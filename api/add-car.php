<?php
/**
 * POST /api/add-car.php  (admin only)
 *
 * Adds a vehicle to car_system.cars. Accepts a JSON body, e.g.:
 *
 *   {
 *     "brand": "Porsche", "model": "911 Turbo S", "price": 231000,
 *     "image": "images/911.jpg", "transmission": "8-Speed PDK",
 *     "fuel": "Petrol", "body": "Coupe"
 *   }
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

if (!car_validate($input, $error)) {
    json_out(['error' => $error], 400);
}

try {
    $stmt = db()->prepare(
        'INSERT INTO cars (Brand, Model, Price, Image, Transmission, Fuel, Body, Description)
         VALUES (:brand, :model, :price, :image, :transmission, :fuel, :body, :description)'
    );

    $stmt->execute(car_payload($input));

    json_out(['ok' => true, 'id' => (int) db()->lastInsertId()], 201);
} catch (PDOException $e) {
    json_out(['error' => 'Database error', 'message' => $e->getMessage()], 500);
}