<?php

require __DIR__ . '/vendor/autoload.php';

use AltchaOrg\Altcha\Altcha;
use AltchaOrg\Altcha\ChallengeOptions;

// --- CONFIG ---
$HMAC_KEY = $_ENV['ALTCHA_HMAC_KEY'] ?? 'bfb4b63f86a3263106ccd6c9de60823c';

$altcha = new Altcha($HMAC_KEY);

// --- ROUTE 1: CREATE CHALLENGE ---
// Frontend calls: /altcha.php?action=challenge
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['action'] ?? '') === 'challenge') {
    $options = new ChallengeOptions(
        maxNumber: 100000,
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
            'message' => 'FAILURE: You are currently identified as Hacker or a Bot.'
        ]));
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'SUCCESSFUL: Your are currently identified as Human.'
    ]);
    exit;
}
?>
