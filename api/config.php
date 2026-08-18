<?php
/**
 * Mofty Dealership — Database configuration.
 * Update these values to match your MySQL server.
 */

/* Inventory database (vehicles live here). */
define('DB_HOST', 'localhost');
define('DB_NAME', 'car_system');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

/* Admin login database — used to authenticate against its `admin` table
   (columns: user_name, password). Same server/db as the inventory here. */
define('ADMIN_DB_NAME', 'car_system');

/* Uploaded car photos are stored here (relative to the site root). */
define('UPLOADS_REL', 'uploads/cars');
define('UPLOADS_MAX_BYTES', 8 * 1024 * 1024); // 8 MB