<?php
// get_technical_posts.php - Lấy bài viết kỹ thuật với filter và phân trang
include 'db.php';
header('Content-Type: application/json');

$topic = $_GET['topic'] ?? '';
$keyword = $_GET['keyword'] ?? '';
$page = $_GET['page'] ?? 1;
$limit = $_GET['limit'] ?? 10;

try {
    // Base query
    $sql = "SELECT id, author_username, title, content, category, created_at, image_url 
            FROM posts 
            WHERE status = 'approved' 
            AND category IN ('kinh-nghiem', 'kythuat-nuoi')";
    
    $params = [];
    
    // Filter theo chủ đề (tôm/cá)
    if (!empty($topic)) {
        $sql .= " AND (title LIKE ? OR content LIKE ?)";
        $params[] = "%$topic%";
        $params[] = "%$topic%";
    }
    
    // Filter theo từ khóa
    if (!empty($keyword)) {
        $sql .= " AND (title LIKE ? OR content LIKE ?)";
        $params[] = "%$keyword%";
        $params[] = "%$keyword%";
    }
    
    // Đếm tổng số bài viết
    $countSql = str_replace("SELECT id, author_username, title, content, category, created_at, image_url", "SELECT COUNT(*)", $sql);
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $totalPosts = $countStmt->fetchColumn();
    
    // Tính phân trang
    $offset = ((int)$page - 1) * (int)$limit;
    $totalPages = ceil($totalPosts / $limit);
    
    // Thêm ORDER BY, LIMIT và OFFSET
    $sql .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $params[] = (int)$limit;
    $params[] = (int)$offset;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'posts' => $posts,
        'pagination' => [
            'currentPage' => (int)$page,
            'totalPages' => (int)$totalPages,
            'totalPosts' => (int)$totalPosts,
            'limit' => (int)$limit
        ]
    ]);
    
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server.']);
}
?>
