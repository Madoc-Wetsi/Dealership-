<?php
/**
 * Mofty Dealership — Shared DB helpers and JSON output.
 */

require_once __DIR__ . '/config.php';

/**
 * Returns a shared PDO connection to the given database (one per request).
 */
function db_for(string $database): PDO
{
    static $conns = [];

    if (!isset($conns[$database])) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST,
            $database,
            DB_CHARSET
        );

        $conns[$database] = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }

    return $conns[$database];
}

/** Inventory connection (mofty_dealership). */
function db(): PDO
{
    return db_for(DB_NAME);
}

/** Admin-login connection (car_system). */
function admin_db(): PDO
{
    return db_for(ADMIN_DB_NAME);
}

/** Sends a JSON response and stops execution. */
function json_out($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Maps a car_system.cars row to the client shape.
 * The live table uses these columns:
 *   ID, Brand, Model, Price, Image, Transmission, Fuel, Body, Description
 */
function car_map(array $row): array
{
    $image = isset($row['Image']) && $row['Image'] !== ''
        ? (string) $row['Image']
        : null;

    return [
        'id'           => (int) $row['ID'],
        'slug'         => 'car-' . (int) $row['ID'],
        'brand'        => (string) ($row['Brand'] ?? ''),
        'model'        => (string) ($row['Model'] ?? ''),
        'year'         => 0,
        'type'         => (string) ($row['Body'] ?? ''),
        'price'        => (float) ($row['Price'] ?? 0),
        'oldPrice'     => null,
        'fuel'         => (string) ($row['Fuel'] ?? ''),
        'mpg'          => 0,
        'power'        => 0,
        'engine'       => '',
        'transmission' => (string) ($row['Transmission'] ?? ''),
        'drive'        => '',
        'seats'        => 0,
        'color'        => '#a61426',
        'image'        => $image,
        'tag'          => '',
        'featured'     => false,
        'description'  => (string) ($row['Description'] ?? ''),
    ];
}

/** Returns true when a query param is set and not "all". */
function want(string $key): bool
{
    return isset($_GET[$key]) && $_GET[$key] !== '' && $_GET[$key] !== 'all';
}

/**
 * Normalizes a client payload (camelCase) into prepared-statement params
 * matching the columns of car_system.cars.
 */
function car_payload(array $in): array
{
    $image = $in['image'] ?? null;

    return [
        ':brand'        => (string) ($in['brand'] ?? ''),
        ':model'        => (string) ($in['model'] ?? ''),
        ':price'        => (float) ($in['price'] ?? 0),
        ':image'        => ($image !== null && $image !== '')
                            ? (string) $image
                            : null,
        ':transmission' => (string) ($in['transmission'] ?? ''),
        ':fuel'         => (string) ($in['fuel'] ?? ''),
        ':body'         => (string) ($in['body'] ?? $in['type'] ?? ''),
        ':description'  => (string) ($in['description'] ?? ''),
    ];
}

/** Validates the required fields shared by add and update. */
function car_validate(array $in, ?string &$error): bool
{
    foreach (['brand', 'model', 'price'] as $field) {
        if (empty($in[$field])) {
            $error = "Missing required field: {$field}";
            return false;
        }
    }
    $error = null;
    return true;
}

/**
 * Deletes a car image file, but ONLY if it lives inside the uploads folder
 * (path-traversal guard). Missing files are silently ignored.
 */
function delete_uploaded_file(?string $path): void
{
    if (!$path || $path === '') {
        return;
    }

    // Only manage files we uploaded — never arbitrary paths
    if (strpos($path, UPLOADS_REL . '/') !== 0) {
        return;
    }

    $root = realpath(__DIR__ . '/..');
    $file = realpath($root . '/' . $path);

    if ($file !== false && strncmp($file, realpath($root . '/' . UPLOADS_REL), strlen(realpath($root . '/' . UPLOADS_REL))) === 0) {
        @unlink($file);
    }
}