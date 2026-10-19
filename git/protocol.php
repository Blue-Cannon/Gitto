<?php
/**
 * Gitto - git/protocol.php
 * Pure PHP Git Smart HTTP Protocol
 * Works with CapRover / Railway / Coolify / Dokploy
 * Repos dir: /var/www/html/repos
 */

// ---------- CONFIG ----------
$REPOS_DIR = realpath(__DIR__ . '/../repos') ?: '/var/www/html/repos';
$GIT_BIN   = trim(shell_exec('which git')) ?: '/usr/bin/git';

// ---------- HELPERS ----------
function forbidden($msg = 'Forbidden') {
    http_response_code(403);
    exit($msg);
}
function notFound($msg = 'Not Found') {
    http_response_code(404);
    exit($msg);
}
function getRepoPath($reposDir, $repoParam) {
    // Allow: myrepo, myrepo.git, user/repo, user/repo.git
    $repoParam = trim($repoParam, '/');
    if (!preg_match('#^[a-zA-Z0-9._/-]+$#', $repoParam)) forbidden('Invalid repo name');
    // Prevent directory traversal
    if (strpos($repoParam, '..') !== false) forbidden();

    // Auto add .git if not present
    $candidate = $reposDir . '/' . $repoParam;
    $candidateGit = $candidate . '.git';
    
    // Check existence in order: exact -> + .git -> exact is dir
    if (is_dir($candidate) && is_dir($candidate . '/objects')) {
        return $candidate;
    }
    if (is_dir($candidateGit)) {
        return $candidateGit;
    }
    if (is_dir($candidate)) {
        return $candidate;
    }
    notFound('Repo not found: ' . htmlspecialchars($repoParam));
}

// ---------- ROUTING ----------
$repoName = $_GET['repo'] ?? $_GET['r'] ?? null;
$pathInfo = $_SERVER['PATH_INFO'] ?? $_SERVER['REQUEST_URI'] ?? '';

// Support: /git/protocol.php/repo.git/info/refs?service=git-upload-pack
// and: /git/protocol.php?repo=myrepo
if (!$repoName && $pathInfo) {
    // extract repo from path: /myrepo.git/info/refs
    if (preg_match('#/([^/]+\.git|[^/]+)/info/refs#', $pathInfo, $m)) {
        $repoName = $m[1];
    } elseif (preg_match('#/([^/]+\.git|[^/]+)/git-(upload|receive)-pack#', $pathInfo, $m)) {
        $repoName = $m[1];
    }
}

if (!$repoName) forbidden('Missing repo param');

$repoPath = getRepoPath($REPOS_DIR, $repoName);

// Ensure it's a bare repo
if (!is_dir($repoPath)) notFound();

// ---------- HANDLE INFO/REFS ----------
if (isset($_GET['service']) && strpos($_SERVER['REQUEST_URI'], 'info/refs') !== false) {
    $service = $_GET['service']; // git-upload-pack or git-receive-pack
    if (!in_array($service, ['git-upload-pack', 'git-receive-pack'], true)) forbidden('Invalid service');

    header('Content-Type: application/x-' . $service . '-advertisement');
    header('Cache-Control: no-cache');
    header('Expires: 0');
    header('Pragma: no-cache');

    // For push, you can add auth check here:
    // if ($service === 'git-receive-pack' && !isAuthenticated()) { header('WWW-Authenticate: Basic'); http_response_code(401); exit; }

    $cmd = sprintf('%s %s --stateless-rpc --advertise-refs %s', 
        escapeshellcmd($GIT_BIN), 
        escapeshellarg($service), 
        escapeshellarg($repoPath)
    );

    // Git smart header
    $advert = shell_exec($cmd);
    if ($advert === null) notFound('Failed to advertise refs');

    // Git protocol requires packet line for service
    $len = strlen("# service=$service\n");
    $pkt = sprintf("%04x# service=%s\n0000", $len + 4, $service);
    echo $pkt . $advert;
    exit;
}

// ---------- HANDLE UPLOAD/RECEIVE PACK POST ----------
$requestUri = $_SERVER['REQUEST_URI'];
if (strpos($requestUri, 'git-upload-pack') !== false) {
    $service = 'git-upload-pack';
} elseif (strpos($requestUri, 'git-receive-pack') !== false) {
    $service = 'git-receive-pack';
} else {
    forbidden('Invalid git action');
}

header('Content-Type: application/x-' . $service . '-result');
header('Cache-Control: no-cache');

$input = file_get_contents('php://input');

$descriptors = [
    0 => ['pipe', 'r'],
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w']
];

$cmd = sprintf('%s %s --stateless-rpc %s', 
    escapeshellcmd($GIT_BIN), 
    escapeshellarg($service), 
    escapeshellarg($repoPath)
);

$process = proc_open($cmd, $descriptors, $pipes);
if (!is_resource($process)) forbidden('Failed to start git');

fwrite($pipes[0], $input);
fclose($pipes[0]);

// Stream output back to client
fpassthru($pipes[1]);
fclose($pipes[1]);
fclose($pipes[2]);
proc_close($process);
