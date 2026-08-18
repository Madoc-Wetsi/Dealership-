<?php
/**
 * GET /api/check.php — Setup diagnosis for XAMPP/mysql.
 * Visit this URL after importing the schema to confirm PHP -> MySQL -> tables
 * are all connected. No configuration needed.
 */

require_once __DIR__ . '/db.php';

header('Content-Type: text/plain; charset=utf-8');

echo "Mofty Dealership — setup check\n";
echo "==============================\n\n";

// 1. PHP version
echo 'PHP version     : ' . PHP_VERSION . "\n";

// 2. pdo_mysql extension
echo 'pdo_mysql loaded: ' . (extension_loaded('pdo_mysql') ? 'yes' : 'NO — enable pdo_mysql in php.ini') . "\n";

// 3. Connection + database
try {
    $pdo = db();
    echo 'MySQL connected : yes (user ' . DB_USER . ', db ' . DB_NAME . ")\n";
} catch (PDOException $e) {
    echo 'MySQL connected : NO — ' . $e->getMessage() . "\n";
    echo "\nFix: start MySQL in XAMPP, import sql/schema.sql, then adjust api/config.php.\n";
    exit;
}

// 4. Cars table
try {
    $count = (int) $pdo->query('SELECT COUNT(*) FROM cars')->fetchColumn();
    echo 'cars table      : yes (' . $count . " rows)\n";
} catch (PDOException $e) {
    echo 'cars table      : NO — ' . $e->getMessage() . "\n";
    echo "\nFix: import sql/schema.sql in phpMyAdmin or MySQL CLI.\n";
    exit;
}

// 5. Sample row readable
try {
    $row = $pdo->query('SELECT ID, Brand, Model FROM cars LIMIT 1')->fetch(PDO::FETCH_ASSOC);
    echo 'sample vehicle  : ' . (($row && $row['Brand']) ? $row['Brand'] . ' ' . ($row['Model'] ?? '') : '-') . "\n";
} catch (PDOException $e) {
    echo 'sample vehicle  : read failed — ' . $e->getMessage() . "\n";
}

// 6. Admin login database (car_system.admin)
echo "\n-- Admin login (" . ADMIN_DB_NAME . ") --\n";
try {
    $adminCount = (int) admin_db()->query('SELECT COUNT(*) FROM admin')->fetchColumn();
    echo 'admin db/table  : yes (' . $adminCount . " user row(s))\n";

    if ($adminCount === 0) {
        echo "  NOTE: the admin table is empty — no one can log in yet.\n";
        echo "  Run:  INSERT INTO " . ADMIN_DB_NAME . ".admin (user_name, password) VALUES ('admin', 'your-password');\n";
    }
} catch (PDOException $e) {
    echo 'admin db/table  : NO — ' . $e->getMessage() . "\n";
    echo "  Fix: create database car_system with a table `admin`\n";
    echo "       (columns: user_name VARCHAR, password VARCHAR).\n";
}

echo "\nAll systems ready. Open http://localhost/dealership/admin/login.html\n";