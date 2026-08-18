<?php
/**
 * POST /api/upload.php  (admin only, multipart/form-data)
 *
 * Uploads a car photo into /uploads/cars and returns its web path:
 *   { "ok": true, "path": "uploads/cars/car_....jpg" }
 * The returned path is stored in the cars.Image column.
 *
 * Field name: "image"
 * Accepted:   JPG, PNG, WEBP, GIF  (verified by content, max 8 MB)
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['error' => 'Method not allowed. Use POST.'], 405);
}

require_admin();

if (empty($_FILES['image'])) {
    json_out(['error' => 'No file provided (field name "image")'], 400);
}

$file = $_FILES['image'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    $messages = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds the server upload limit',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds the form size limit',
        UPLOAD_ERR_PARTIAL    => 'Upload was interrupted',
        UPLOAD_ERR_NO_FILE    => 'No file selected',
    ];
    $reason = $messages[$file['error']] ?? 'Upload failed';
    json_out(['error' => $reason], 400);
}

if ($file['size'] > UPLOADS_MAX_BYTES) {
    json_out(['error' => 'File too large (max 8 MB)'], 400);
}

// Verify it is a real image by inspecting content, and pick a safe extension
$info = @getimagesize($file['tmp_name']);
$extByType = [
    IMAGETYPE_JPEG => 'jpg',
    IMAGETYPE_PNG  => 'png',
    IMAGETYPE_WEBP => 'webp',
    IMAGETYPE_GIF  => 'gif',
];

if ($info === false || !isset($extByType[$info[2]])) {
    json_out(['error' => 'Invalid image. Allowed: JPG, PNG, WEBP, GIF'], 400);
}

$dir  = __DIR__ . '/../' . UPLOADS_REL;
if (!is_dir($dir)) {
    mkdir($dir, 0775, true);
}

$name = 'car_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $extByType[$info[2]];

if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $name)) {
    json_out(['error' => 'Could not save the file. Check folder permissions.'], 500);
}

json_out([
    'ok'   => true,
    'path' => UPLOADS_REL . '/' . $name,
    'url'  => UPLOADS_REL . '/' . $name,
]);