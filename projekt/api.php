<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['error' => 'Character ID is required']);
    exit;
}

$jsonFile = 'data.json';


$fp = fopen($jsonFile, 'r+');
if (!$fp) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not open data file']);
    exit;
}

if (!flock($fp, LOCK_EX)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not lock data file']);
    fclose($fp);
    exit;
}

$jsonContent = fread($fp, filesize($jsonFile));
$jsonData = json_decode($jsonContent, true);

if (!$jsonData || !isset($jsonData['characters'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid data file']);
    flock($fp, LOCK_UN);
    fclose($fp);
    exit;
}

$found = false;
foreach ($jsonData['characters'] as &$character) {
    if ($character['id'] == $id) {
        $character['votes']++;
        $found = true;
        break;
    }
}

if (!$found) {
    http_response_code(404);
    echo json_encode(['error' => 'Character not found']);
    flock($fp, LOCK_UN);
    fclose($fp);
    exit;
}


ftruncate($fp, 0);
rewind($fp);
if (fwrite($fp, json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save data']);
    flock($fp, LOCK_UN);
    fclose($fp);
    exit;
}

flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['success' => true, 'message' => 'Vote recorded']);
?>