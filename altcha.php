<?php
/**
 * ALTCHA - Friendly, Self-Hosted CAPTCHA for PHP
 * Project: gittofirebase
 * 
 * HOW TO USE:
 * 1. composer require altcha-org/altcha-lib
 * 2. Put your HMAC secret in .env -> ALTCHA_HMAC_KEY
 * 
 * This one file handles BOTH:
 * - Creating challenge (GET ?action=challenge)
 * - Verifying solution (POST)
 */

require __DIR__ . '/vendor/autoload.php';

use AltchaOrg\Altcha\Altcha;
use AltchaOrg\Altcha\ChallengeOptions;

// --- CONFIG ---
$HMAC_KEY = $_ENV['ALTCHA_HMAC_KEY'];

$altcha = new Altcha($HMAC_KEY);

// --- ROUTE 1: CREATE CHALLENGE ---
// Frontend calls: /altcha.php?action=challenge
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['action'] ?? '') === 'challenge') {
    $options = new ChallengeOptions(
        maxNumber: 100000, // 50k=easy, 100k=medium, 500k=hard for bots
        expires: new DateTime('+1 hour'),
    );
    
    $challenge = $altcha->createChallenge($options);
    
    header('Content-Type: application/json');
    echo json_encode($challenge);
    exit;
}

// --- ROUTE 2: VERIFY FUNCTION ---
function verifyAltcha(string $payload): bool {
    global $altcha;
    
    if (empty($payload)) {
        return false;
    }
    
    try {
        return $altcha->verifySolution($payload, true);
    } catch (Exception $e) {
        error_log("ALTCHA error: " . $e->getMessage());
        return false;
    }
}

// --- EXAMPLE VERIFY ON POST ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = $_POST['altcha'] ?? '';
    
    if (!verifyAltcha($payload)) {
        http_response_code(400);
        die(json_encode([
            'success' => false,
            'message' => 'Target FALSE. Currently indentify as hacker or a bot.'
        ]));
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Target TRUE. Currently indentify as normal human.'
    ]);
    exit;
}
?>
