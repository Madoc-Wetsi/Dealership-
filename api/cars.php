<?php
/**
 * GET /api/cars.php
 *
 * Lists vehicles with optional filters.
 *
 * Query params:
 *   search    string   matches brand, model or year
 *   brand     string   exact brand
 *   body      string   exact body style (type)
 *   fuel      string   exact fuel type
 *   price_min number   lower price bound
 *   price_max number   upper price bound
 *   featured  1        only featured cars
 *   sort      default|newest|price-asc|price-desc|featured
 *   limit     number   cap results
 *   count     1        instead of rows, return { total: n }
 */

require_once __DIR__ . '/db.php';

try {
    $pdo   = db();
    $where = [];
    $args  = [];

    if (want('search')) {
        $where[] = '(Brand LIKE :search OR Model LIKE :search)';
        $args[':search'] = '%' . trim($_GET['search']) . '%';
    }

    if (want('brand')) {
        $where[]        = 'Brand = :brand';
        $args[':brand'] = (string) $_GET['brand'];
    }

    if (want('body')) {
        $where[]      = 'Body = :body';
        $args[':body'] = (string) $_GET['body'];
    }

    if (want('fuel')) {
        $where[]      = 'Fuel = :fuel';
        $args[':fuel'] = (string) $_GET['fuel'];
    }

    if (isset($_GET['price_min']) && $_GET['price_min'] !== '') {
        $where[]            = 'Price >= :price_min';
        $args[':price_min'] = (float) $_GET['price_min'];
    }

    if (isset($_GET['price_max']) && $_GET['price_max'] !== '') {
        $where[]            = 'Price <= :price_max';
        $args[':price_max'] = (float) $_GET['price_max'];
    }

    // --- Count mode: return just the total matching the filters ---
    if (isset($_GET['count']) && $_GET['count'] === '1') {
        $sql  = 'SELECT COUNT(*) AS total FROM cars';
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute($args);
        json_out(['total' => (int) $stmt->fetch()['total']]);
    }

    $orderBy = [
        'default'     => 'ID DESC',
        'featured'    => 'ID DESC',
        'newest'      => 'ID DESC',
        'price-asc'   => 'Price ASC, ID DESC',
        'price-desc'  => 'Price DESC, ID DESC',
    ];
    $sort = $_GET['sort'] ?? 'default';
    $sql  = 'SELECT * FROM cars';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= ' ORDER BY ' . ($orderBy[$sort] ?? $orderBy['default']);

    if (isset($_GET['limit']) && is_numeric($_GET['limit'])) {
        $sql .= ' LIMIT ' . max(1, (int) $_GET['limit']);
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($args);

    $rows = array_map('car_map', $stmt->fetchAll());

    json_out($rows);
} catch (PDOException $e) {
    json_out(['error' => 'Database error', 'message' => $e->getMessage()], 500);
}