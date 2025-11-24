<?php
// reset_password.php - Xử lý đặt lại mật khẩu (Xác thực Token và Cập nhật Mật khẩu)
include 'db.php'; 

header('Content-Type: application/json');

// Đọc dữ liệu JSON
$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$newPassword = $data['new_password'] ?? '';

if (empty($token) || empty($newPassword)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Thiếu Token hoặc Mật khẩu mới.']);
    exit;
}

try {
    // 1. Tìm và Xác thực Token
    $currentDateTime = date("Y-m-d H:i:s");
    
    $stmt = $pdo->prepare("SELECT id FROM users WHERE reset_token = ? AND token_expiry > ?");
    $stmt->execute([$token, $currentDateTime]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401); // Unauthorized
        echo json_encode(['success' => false, 'message' => 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.']);
        exit;
    }

    // 2. Mã hóa Mật khẩu mới an toàn
    $passwordHash = password_hash($newPassword, PASSWORD_DEFAULT);

    // 3. Cập nhật Mật khẩu và Xóa Token
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, reset_token = NULL, token_expiry = NULL WHERE id = ?");
    $stmt->execute([$passwordHash, $user['id']]);

    echo json_encode(['success' => true, 'message' => '🎉 Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập bằng mật khẩu mới.']);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: ' . $e->getMessage()]);
}
?>