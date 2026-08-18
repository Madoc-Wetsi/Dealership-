<?php
/**
 * Mofty Dealership — Admin session helpers.
 */

require_once __DIR__ . '/db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/** True when the current session is logged in as admin. */
function is_admin(): bool
{
    return isset($_SESSION['admin']) && $_SESSION['admin'] === true;
}

/** Stops the request with 401 JSON if the session is not admin. */
function require_admin(): void
{
    if (!is_admin()) {
        json_out(['error' => 'Unauthorized'], 401);
    }
}