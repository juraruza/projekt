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
$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$message = trim($data['message'] ?? '');

if (!$name || !$email || !$message) {
    http_response_code(400);
    echo json_encode(['error' => 'Všechna pole jsou povinná']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Neplatný formát emailu']);
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
$currentData = json_decode($jsonContent, true);

if (!$currentData) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid data file']);
    flock($fp, LOCK_UN);
    fclose($fp);
    exit;
}


$newMessage = [
    'timestamp' => date('Y-m-d H:i:s'),
    'name' => $name,
    'email' => $email,
    'message' => $message
];


if (!isset($currentData['messages'])) {
    $currentData['messages'] = [];
}


$currentData['messages'][] = $newMessage;


ftruncate($fp, 0);
rewind($fp);
if (fwrite($fp, json_encode($currentData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Nepodařilo se uložit zprávu']);
    flock($fp, LOCK_UN);
    fclose($fp);
    exit;
}

flock($fp, LOCK_UN);
fclose($fp);


$recipient = $currentData['author']['email'] ?? 'default@example.com';
$subject = 'Nova zprava od: ' . $name;
$headers = "From: $email\r\nReply-To: $email\r\n";
$mailSent = mail($recipient, $subject, $message, $headers);

echo json_encode(['success' => true, 'message' => 'Zpráva byla úspěšně odeslána']);
?>