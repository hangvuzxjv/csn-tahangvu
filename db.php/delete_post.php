<?php
// db.php/delete_post.php - Xử lý xóa bài viết
include 'db.php'; 
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

$postId = $data['post_id'] ?? null;
$username = $data['username'] ?? ''; // Tác giả hoặc Admin
$role = $data['role'] ?? 'user'; // Vai trò

if (!$postId || empty($username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Thiếu thông tin cần thiết (ID bài viết hoặc Tên người dùng).']);
    exit;
}

try {
    // 1. Lấy thông tin bài viết
    $stmt = $pdo->prepare("SELECT author_username, status FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    $post = $stmt->fetch();

    if (!$post) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Bài viết không tồn tại.']);
        exit;
    }
    
    $isAuthor = $post['author_username'] === $username;
    $isAdmin = $role === 'admin';
    $canDelete = false;

    // Logic xóa: Admin có thể xóa. Tác giả chỉ có thể xóa bài chưa duyệt (pending/rejected).
    if ($isAdmin) {
        $canDelete = true;
    } else if ($isAuthor && ($post['status'] === 'pending' || $post['status'] === 'rejected')) {
        $canDelete = true;
    }

    if (!$canDelete) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Bạn không có quyền xóa bài viết này (Chỉ có thể xóa bài chưa duyệt).']);
        exit;
    }

    // 2. Thực hiện xóa bài viết
    $stmt = $pdo->prepare("DELETE FROM posts WHERE id = ?");
    $stmt->execute([$postId]);

    echo json_encode(['success' => true, 'message' => '🗑️ Bài viết đã được xóa thành công.']);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: Không thể xóa bài viết.']);
}
?>