<?php
// GET /api/file.php?f=<name> – photos uploaded in the admin panel. They're
// stored outside public_html so re-uploading the website never deletes them.
require __DIR__ . '/lib/bootstrap.php';

require_method('GET');
$f = (string)($_GET['f'] ?? '');
if (!preg_match('/^[a-f0-9]{24}\.(jpg|png|webp)$/', $f, $m)) fail('Not found', 404);
$path = data_dir() . '/uploads/' . $f;
if (!is_file($path)) fail('Not found', 404);

$types = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
header('Content-Type: ' . $types[$m[1]]);
header('Content-Length: ' . filesize($path));
header('Cache-Control: public, max-age=31536000, immutable');
header('X-Content-Type-Options: nosniff');
readfile($path);
