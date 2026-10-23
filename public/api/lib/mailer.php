<?php
// Sending email. Uses SMTP (e.g. Gmail or Hostinger email) through PHPMailer
// when configured, otherwise PHP's mail(). Failures are logged, never shown
// to visitors – a booking is still saved even if an email can't be sent.
defined('HELSY_API') || exit;

function e(?string $s): string
{
    return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * @param string|string[] $to
 */
function send_mail($to, string $subject, string $html, ?string $replyTo = null, ?string $replyName = null): bool
{
    $cfg = helsy_config()['mail'];
    $to = array_values(array_filter((array)$to, fn($a) => filter_var($a, FILTER_VALIDATE_EMAIL)));
    if (!$to || $cfg['mode'] === 'off') return false;

    $smtp = $cfg['smtp'];
    $host = preg_replace('/^www\./', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost'));
    $host = preg_replace('/:\d+$/', '', $host);
    $from = $cfg['from_email'] ?: ($smtp['user'] ?: 'no-reply@' . $host);
    $fromName = $cfg['from_name'] ?: 'The Helsy Bentota';

    if ($cfg['mode'] === 'log') {
        $entry = "==== " . now() . "\nTo: " . implode(', ', $to) . "\nFrom: $fromName <$from>\n"
            . ($replyTo ? "Reply-To: $replyTo\n" : '') . "Subject: $subject\n\n"
            . trim(html_entity_decode(strip_tags(preg_replace('/<(br|\/p|\/tr|\/h\d)[^>]*>/i', "\n", $html)))) . "\n\n";
        file_put_contents(data_dir() . '/mail.log', $entry, FILE_APPEND);
        return true;
    }

    try {
        if ($cfg['mode'] === 'smtp' || ($cfg['mode'] === 'auto' && $smtp['host'])) {
            require_once __DIR__ . '/PHPMailer/Exception.php';
            require_once __DIR__ . '/PHPMailer/PHPMailer.php';
            require_once __DIR__ . '/PHPMailer/SMTP.php';
            $m = new PHPMailer\PHPMailer\PHPMailer(true);
            $m->isSMTP();
            $m->Host = $smtp['host'];
            $m->Port = (int)$smtp['port'];
            $m->SMTPAuth = true;
            $m->Username = $smtp['user'];
            $m->Password = $smtp['pass'];
            $m->SMTPSecure = $smtp['secure'];
            $m->CharSet = 'UTF-8';
            $m->setFrom($from, $fromName);
            foreach ($to as $addr) $m->addAddress($addr);
            if ($replyTo) $m->addReplyTo($replyTo, $replyName ?? '');
            $m->isHTML(true);
            $m->Subject = $subject;
            $m->Body = $html;
            $m->AltBody = trim(html_entity_decode(strip_tags(preg_replace('/<(br|\/p|\/tr|\/h\d)[^>]*>/i', "\n", $html))));
            $m->send();
            return true;
        }

        $headers = [
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'From: ' . mb_encode_mimeheader($fromName) . " <$from>",
        ];
        if ($replyTo) $headers[] = "Reply-To: $replyTo";
        $ok = @mail(implode(', ', $to), mb_encode_mimeheader($subject), $html, implode("\r\n", $headers));
        if (!$ok) log_error('mail() failed for: ' . $subject);
        return $ok;
    } catch (Throwable $ex) {
        log_error('Email failed (' . $subject . '): ' . $ex->getMessage());
        return false;
    }
}

function notify_emails(): array
{
    $s = get_settings();
    $list = $s['notifyEmails'] ?? [];
    return is_array($list) && $list ? $list : ['helsyofbentota@gmail.com'];
}

// Simple, mobile-friendly email layout. $rows = [label => value] shown as a table.
function email_html(string $title, string $intro, array $rows = [], string $outro = ''): string
{
    $table = '';
    foreach ($rows as $label => $value) {
        if ($value === '' || $value === null) continue;
        $table .= '<tr><td style="padding:8px 12px 8px 0;color:#777;vertical-align:top;white-space:nowrap">' . e($label)
            . '</td><td style="padding:8px 0;color:#222">' . nl2br(e((string)$value)) . '</td></tr>';
    }
    return '<!doctype html><html><body style="margin:0;background:#f3f1ec;font-family:Arial,Helvetica,sans-serif">'
        . '<div style="max-width:600px;margin:0 auto;padding:24px">'
        . '<div style="background:#0f1010;color:#f4f2ee;padding:22px 26px;border-radius:8px 8px 0 0">'
        . '<div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b3a35a">The Helsy Bentota</div>'
        . '<div style="font-size:22px;margin-top:6px">' . e($title) . '</div></div>'
        . '<div style="background:#fff;padding:24px 26px;border-radius:0 0 8px 8px;font-size:15px;line-height:1.6;color:#333">'
        . '<p style="margin:0 0 16px">' . $intro . '</p>'
        . ($table ? '<table style="border-collapse:collapse;width:100%;font-size:14px">' . $table . '</table>' : '')
        . ($outro ? '<p style="margin:18px 0 0">' . $outro . '</p>' : '')
        . '</div><p style="font-size:12px;color:#999;text-align:center;margin-top:16px">'
        . 'The Helsy Bentota · 2km Post, Circular Road, Kommalta, Bentota 80500, Sri Lanka</p></div></body></html>';
}
