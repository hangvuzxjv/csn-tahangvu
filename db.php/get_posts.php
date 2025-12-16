<?php
// db.php/get_posts.php - Lấy danh sách bài viết từ CSDL (ĐÃ CẢI TIẾN BẢO MẬT)
include 'db.php'; 
header('Content-Type: application/json');

// Include session để kiểm tra quyền
include 'session_manager.php';

// Đọc tham số tùy chọn từ URL query string
$statusFilter = $_GET['status'] ?? 'approved';
$authorFilter = $_GET['author'] ?? null;
$postId = $_GET['id'] ?? null;
$limit = $_GET['limit'] ?? null;

// Lấy thông tin user hiện tại (nếu đăng nhập)
$currentUser = getCurrentUser();

// --- BẢO MẬT: XỬ LÝ YÊU CẦU XEM CHI TIẾT ĐỘC LẬP VÀ BẢO MẬT ---
if ($postId) {
    // 1. Lấy vai trò từ session
    $role = $currentUser ? $currentUser['role'] : 'user';
    $loggedInUsername = $currentUser ? $currentUser['username'] : null;

    // 2. Lấy bài viết dựa trên ID, bao gồm image_url (Đã cập nhật cho tính năng tiếp theo)
    $stmtPost = $pdo->prepare("SELECT id, author_username, title, content, category, created_at, status, admin_note, approved_by_admin, image_url FROM posts WHERE id = ?");
    $stmtPost->execute([$postId]);
    $post = $stmtPost->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
         http_response_code(404);
         echo json_encode(['success' => false, 'message' => 'Bài viết không tồn tại.']);
         exit;
    }

    // 3. Kiểm tra quyền truy cập
    $isAuthor = $post['author_username'] === $loggedInUsername;
    $isAdmin = $role === 'admin';
    $isApproved = $post['status'] === 'approved';

    if ($isApproved || $isAuthor || $isAdmin) {
        // Cho phép hiển thị
        echo json_encode(['success' => true, 'posts' => [$post], 'debug' => ['query_type' => 'single_secure']]);
        exit;
    } else {
        // Không có quyền truy cập
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Bài viết này chưa được phê duyệt hoặc bạn không có quyền xem.']);
        exit;
    }
}
// --- KẾT THÚC XỬ LÝ YÊU CẦU XEM CHI TIẾT ---


$sql = "SELECT id, author_username, title, content, category, created_at, status, admin_note, approved_by_admin, image_url FROM posts WHERE 1=1";
$params = [];

// Lọc theo tác giả (cho trang profile) - Logic danh sách
if ($authorFilter) {
    // Nếu author='me', lấy từ session
    if ($authorFilter === 'me') {
        if (!$currentUser) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Bạn cần đăng nhập.']);
            exit;
        }
        $sql .= " AND author_username = ?";
        $params[] = $currentUser['username'];
    } else {
        $sql .= " AND author_username = ?";
        $params[] = $authorFilter;
    }
    
    // LOGIC FIX LỖI: Nếu lọc theo Tác giả VÀ status là 'all' thì không cần thêm status vào mệnh đề WHERE
    if ($statusFilter !== 'all') {
        $sql .= " AND status = ?";
        $params[] = $statusFilter;
    }
} else {
    // Nếu không có authorFilter, chỉ lấy bài APPROVED cho các trang công cộng (index, tintuc)
    if ($statusFilter === 'approved') {
        $sql .= " AND status = 'approved'";
    } else if ($statusFilter !== 'all') {
        // Áp dụng các trạng thái khác (pending, rejected) nếu được truyền rõ ràng
        $sql .= " AND status = ?";
        $params[] = $statusFilter;
    }
}


$sql .= " ORDER BY created_at DESC";

try {
    // Đếm tổng số bài viết (cho phân trang)
    $countSql = str_replace("SELECT id, author_username, title, content, category, created_at, status, admin_note, approved_by_admin, image_url FROM posts", "SELECT COUNT(*) FROM posts", $sql);
    $countSql = preg_replace('/\s+LIMIT\s+\?$/i', '', $countSql); // Bỏ LIMIT khỏi count query
    
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $totalPosts = $countStmt->fetchColumn();
    
    // Tính toán phân trang
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 9; // Mặc định 9 bài/trang cho tin tức
    $offset = ((int)$page - 1) * (int)$limit;
    $totalPages = ceil($totalPosts / $limit);
    
    // Thêm LIMIT và OFFSET cho phân trang (chỉ khi không phải single post)
    if (!$postId) {
        $sql .= " LIMIT ? OFFSET ?";
        $params[] = (int)$limit;
        $params[] = (int)$offset;
    }
    
    // Lấy dữ liệu bài viết
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Trả về kết quả với thông tin phân trang
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
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: Không thể tải bài viết.']);
}
?>