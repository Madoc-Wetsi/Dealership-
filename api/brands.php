<?php
/**
 * GET /api/brands.php
 *
 * Returns the distinct list of brands currently in the inventory,
 * used to populate the inventory filter dropdown dynamically.
 */

require_once __DIR__ . '/db.php';

try {
    $rows = db()
        ->query('SELECT DISTINCT Brand FROM cars WHERE Brand IS NOT NULL AND Brand <> \'\' ORDER BY Brand ASC')
        ->fetchAll();

    json_out(array_column($rows, 'Brand'));
} catch (PDOException $e) {
    json_out(['error' => 'Database error', 'message' => $e->getMessage()], 500);
}