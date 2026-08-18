<?php
/**
 * GET /api/auth-status.php — returns { admin: true|false }
 * Used by the dashboard to check the session on load.
 */

require_once __DIR__ . '/auth.php';

json_out(['admin' => is_admin()]);