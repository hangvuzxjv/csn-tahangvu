<?php
// register.php - Đã sửa để sử dụng JSON input, bảng 'users' và password_hash

// Giả định db.php đã khởi tạo kết nối PDO ($pdo)
include 'db.php';
header('Content-Type: application/json');

// Đọc dữ liệu JSON từ frontend (theo cách fetch trong script.js)
$data = json_decode(file_get_contents('php://input'), true);
$username = $data['username'] ?? '';
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// Kiểm tra dữ liệu
if (empty($username) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vui lòng điền đủ Tên tài khoản, Email và Mật khẩu.']);
    exit;
}

try {
    // 1. Kiểm tra username hoặc email đã tồn tại chưa
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    if ($stmt->fetchColumn() > 0) {
        http_response_code(409); // Conflict
        echo json_encode(['success' => false, 'message' => 'Tên tài khoản hoặc Email đã được sử dụng.']);
        exit;
    }

    // 2. Mã hóa mật khẩu an toàn
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // 3. Chèn người dùng mới vào bảng 'users' với các cột mới
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
    $stmt->execute([$username, $email, $passwordHash]);

    echo json_encode(['success' => true, 'message' => 'Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.']);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: Không thể đăng ký tài khoản.']);
}
?>