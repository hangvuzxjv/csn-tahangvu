<?php
// submit_post.php - Xử lý việc đăng bài và lưu vào CSDL
include 'db.php'; 
header('Content-Type: application/json');

// Đọc dữ liệu JSON từ frontend
$data = json_decode(file_get_contents('php://input'), true);

$title = $data['title'] ?? '';
$content = $data['content'] ?? '';
$category = $data['category'] ?? '';
$author_username = $data['author'] ?? ''; // Lấy từ LocalStorage

if (empty($title) || empty($content) || empty($category) || empty($author_username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vui lòng điền đủ Tiêu đề, Nội dung, Phân loại và đăng nhập.']);
    exit;
}

try {
    // Chèn bài viết vào bảng posts với status mặc định là 'pending'
    $stmt = $pdo->prepare("
        INSERT INTO posts (author_username, title, content, category) 
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([$author_username, $title, $content, $category]);

    echo json_encode(['success' => true, 'message' => '🎉 Bài viết đã được gửi thành công, đang chờ quản trị viên duyệt!']);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: Không thể lưu bài viết. Chi tiết: ' . $e->getMessage()]);
}
?>