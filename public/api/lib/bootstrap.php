<?php
// Shared setup for every API endpoint: config, errors, JSON in/out,
// validation, rate limiting and admin sessions.
declare(strict_types=1);

define('HELSY_API', true);
date_default_timezone_set('Asia/Colombo');

require __DIR__ . '/db.php';
require __DIR__ . '/data.php';
require __DIR__ . '/pricing.php';
require __DIR__ . '/mailer.php';

/* ------------------------------------------------------------------
   Config
   Defaults below, overridden by (first found wins per key):
     1. helsy-config.php one folder ABOVE public_html (recommended – it
        survives re-uploading the site)
     2. api/config.local.php
------------------------------------------------------------------- */
function helsy_config(): array
{
    static $cfg = null;
    if ($cfg !== null) return $cfg;

    $outside = dirname(__DIR__, 3);
    $cfg = [
        'debug' => false,
        // Needed to create the first admin account on a live server.
        'setup_key' => '',
        // Database file, uploads, logs. Kept outside public_html by default.
        'data_dir' => $outside . '/helsy-data',
        'db' => [
            'driver' => 'sqlite', // or 'mysql'
            'path' => '',         // sqlite file; default <data_dir>/helsy.sqlite
            'host' => 'localhost',
            'port' => 3306,
            'name' => '',
            'user' => '',
            'pass' => '',
        ],
        'mail' => [
            // auto = SMTP when smtp.host is set, otherwise PHP mail().
            // log = write emails to <data_dir>/mail.log (local testing). off = send nothing.
            'mode' => 'auto',
            'from_email' => '',
            'from_name' => 'The Helsy Bentota',
            'smtp' => ['host' => '', 'port' => 465, 'secure' => 'ssl', 'user' => '', 'pass' => ''],
        ],
    ];

    $files = [dirname(__DIR__) . '/config.local.php', $outside . '/helsy-config.php'];
    foreach ($files as $file) {
        if (is_file($file)) {
            $local = require $file;
            if (is_array($local)) $cfg = array_replace_recursive($cfg, $local);
        }
    }
    return $cfg;
}

// Folder for the database, uploads and logs. Falls back to api/data (locked
// with .htaccess) when the folder above public_html can't be written.
function data_dir(): string
{
    static $dir = null;
    if ($dir !== null) return $dir;

    $want = rtrim(helsy_config()['data_dir'], '/\\');
    if (ensure_dir($want)) return $dir = $want;

    $fallback = dirname(__DIR__) . '/data';
    if (!ensure_dir($fallback)) {
        throw new RuntimeException('No writable data folder. Create "helsy-data" next to public_html.');
    }
    return $dir = $fallback;
}

function ensure_dir(string $dir): bool
{
    if (!is_dir($dir) && !@mkdir($dir, 0750, true)) return false;
    if (!is_writable($dir)) return false;
    // In case the folder is ever web-reachable, keep visitors out.
    $ht = $dir . '/.htaccess';
    if (!is_file($ht)) @file_put_contents($ht, "Require all denied\nDeny from all\n");
    return true;
}

function now(): string
{
    return date('Y-m-d H:i:s');
}

/* ------------------------------------------------------------------
   Errors and JSON responses
------------------------------------------------------------------- */
class ApiError extends Exception
{
    public int $status;
    public array $extra;

    public function __construct(string $message, int $status = 400, array $extra = [])
    {
        parent::__construct($message);
        $this->status = $status;
        $this->extra = $extra;
    }
}

function fail(string $message, int $status = 400, array $extra = []): never
{
    throw new ApiError($message, $status, $extra);
}

function json_out(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(['ok' => $status < 400] + $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function log_error(string $line): void
{
    try {
        @file_put_contents(data_dir() . '/error.log', '[' . now() . '] ' . $line . "\n", FILE_APPEND);
    } catch (Throwable $e) {
        error_log($line);
    }
}

set_exception_handler(function (Throwable $e) {
    if ($e instanceof ApiError) {
        json_out(['error' => $e->getMessage()] + $e->extra, $e->status);
    }
    log_error(get_class($e) . ': ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    $msg = helsy_config()['debug'] ? $e->getMessage() : 'Something went wrong on our side. Please try again or call us.';
    json_out(['error' => $msg], 500);
});

set_error_handler(function (int $no, string $str, string $file, int $line) {
    if (!(error_reporting() & $no)) return false;
    throw new ErrorException($str, 0, $no, $file, $line);
});

function require_method(string ...$methods): string
{
    $m = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($m, $methods, true)) {
        header('Allow: ' . implode(', ', $methods));
        fail('Method not allowed', 405);
    }
    return $m;
}

// JSON body (or regular form fields) as an array
function input(): array
{
    static $in = null;
    if ($in !== null) return $in;
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($type, 'application/json') !== false) {
        $raw = file_get_contents('php://input', false, null, 0, 200000);
        $in = json_decode($raw ?: '[]', true);
        if (!is_array($in)) fail('Invalid request.');
    } else {
        $in = $_POST;
    }
    return $in;
}

function client_ip(): string
{
    return substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}

/* ------------------------------------------------------------------
   Validation helpers – each returns a clean value or fails with a
   message the visitor can read.
------------------------------------------------------------------- */
function v_str(array $in, string $key, string $label, int $max = 200, bool $required = true): string
{
    $v = $in[$key] ?? '';
    if (is_int($v) || is_float($v)) $v = (string)$v;
    if (!is_string($v)) fail("$label is not valid.");
    $v = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '');
    if ($required && $v === '') fail("Please enter $label.", 422, ['field' => $key]);
    if (mb_strlen($v) > $max) fail(ucfirst($label) . " is too long (max $max characters).", 422, ['field' => $key]);
    return $v;
}

function v_email(array $in, string $key = 'email', bool $required = true): string
{
    $v = v_str($in, $key, 'your email address', 190, $required);
    if ($v !== '' && !filter_var($v, FILTER_VALIDATE_EMAIL)) fail('Please enter a valid email address.', 422, ['field' => $key]);
    return $v;
}

function v_int(array $in, string $key, string $label, int $min, int $max, ?int $default = null): int
{
    $v = $in[$key] ?? $default;
    if ($v === null || $v === '') {
        if ($default !== null) return $default;
        fail("Please enter $label.", 422, ['field' => $key]);
    }
    if (!is_numeric($v) || (int)$v != $v) fail(ucfirst($label) . ' must be a whole number.', 422, ['field' => $key]);
    $v = (int)$v;
    if ($v < $min || $v > $max) fail(ucfirst($label) . " must be between $min and $max.", 422, ['field' => $key]);
    return $v;
}

function v_date(array $in, string $key, string $label): string
{
    $v = $in[$key] ?? '';
    if (!is_string($v) || !is_valid_date($v)) fail("Please choose $label.", 422, ['field' => $key]);
    return $v;
}

function is_valid_date(string $v): bool
{
    if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m)) return false;
    return checkdate((int)$m[2], (int)$m[3], (int)$m[1]);
}

function v_md(string $v, string $label): string
{
    if (!preg_match('/^(\d{2})-(\d{2})$/', $v, $m) || !checkdate((int)$m[1], (int)$m[2], 2024)) {
        fail("$label must be a date like 12-25 (month-day).", 422);
    }
    return $v;
}

function v_bool(array $in, string $key): bool
{
    $v = $in[$key] ?? false;
    return $v === true || $v === 1 || $v === '1' || $v === 'true' || $v === 'on' || $v === 'yes';
}

/* ------------------------------------------------------------------
   Rate limiting: at most $limit hits per $window seconds per key.
------------------------------------------------------------------- */
function throttle(string $key, int $limit, int $window): bool
{
    $pdo = db();
    $t = time();
    $pdo->prepare('DELETE FROM throttle WHERE at < ?')->execute([$t - 86400]);
    $q = $pdo->prepare('SELECT COUNT(*) FROM throttle WHERE k = ? AND at > ?');
    $q->execute([$key, $t - $window]);
    if ((int)$q->fetchColumn() >= $limit) return false;
    $pdo->prepare('INSERT INTO throttle (k, at) VALUES (?, ?)')->execute([$key, $t]);
    return true;
}

function throttle_or_fail(string $key, int $limit, int $window): void
{
    if (!throttle($key, $limit, $window)) {
        fail('Too many requests. Please wait a little and try again, or call us.', 429);
    }
}

/* ------------------------------------------------------------------
   Admin sessions
------------------------------------------------------------------- */
function admin_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $dir = data_dir() . '/sessions';
    if (ensure_dir($dir)) session_save_path($dir);
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    session_name('helsy_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.gc_maxlifetime', '28800');
    session_start();

    // Sign out after 8 hours without activity
    if (isset($_SESSION['admin_id']) && time() - ($_SESSION['seen'] ?? 0) > 28800) {
        $_SESSION = [];
    }
    $_SESSION['seen'] = time();
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
}

function current_admin(): ?array
{
    admin_session();
    if (empty($_SESSION['admin_id'])) return null;
    $q = db()->prepare('SELECT id, email, name FROM admins WHERE id = ?');
    $q->execute([$_SESSION['admin_id']]);
    $row = $q->fetch();
    return $row ?: null;
}

function require_admin(): array
{
    $admin = current_admin();
    if (!$admin) fail('Please sign in again.', 401);
    return $admin;
}

function require_csrf(): void
{
    admin_session();
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($sent) || !hash_equals($_SESSION['csrf'] ?? '', $sent)) {
        fail('Your session expired. Please reload the page.', 403);
    }
}
