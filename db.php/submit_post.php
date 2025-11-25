<?php
// submit_post.php - Xử lý việc đăng bài và lưu vào CSDL (ĐÃ CẢI TIẾN FILE UPLOAD)
include 'db.php'; 
header('Content-Type: application/json');

// Đọc dữ liệu từ POST/FILES
$title = $_POST['title'] ?? '';
$content = $_POST['content'] ?? '';
$category = $_POST['category'] ?? '';
$author_username = $_POST['author'] ?? ''; 
$image_url = null; // Khởi tạo image_url

// Thư mục lưu trữ ảnh (CẦN ĐẢM BẢO THƯ MỤC 'uploads/' TỒN TẠI VÀ CÓ QUYỀN GHI)
$target_dir = "uploads/"; 


// --- LOGIC XỬ LÝ TỆP TIN (CẢI TIẾN) ---
if (isset($_FILES['post-media']) && $_FILES['post-media']['error'] == UPLOAD_ERR_OK) {
    
    // 1. Tạo tên file duy nhất để tránh trùng lặp
    $file_extension = pathinfo($_FILES['post-media']['name'], PATHINFO_EXTENSION);
    $new_file_name = uniqid() . time() . "." . strtolower($file_extension);
    $target_file = $target_dir . $new_file_name;
    
    // 2. Chỉ cho phép các định dạng ảnh phổ biến (Bảo mật)
    $allowed_types = ['jpg', 'jpeg', 'png', 'gif'];
    if (!in_array(strtolower($file_extension), $allowed_types)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Lỗi: Chỉ cho phép tải lên file ảnh (JPG, JPEG, PNG, GIF).']);
        exit;
    }
    
    // 3. Thực hiện di chuyển file
    if (move_uploaded_file($_FILES['post-media']['tmp_name'], $target_file)) {
        // Lưu URL tương đối của file vào CSDL
        $image_url = $target_file; 
    } else {
        // Lỗi khi di chuyển file (Thường do thiếu quyền ghi hoặc thư mục không tồn tại)
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Lỗi Server: Không thể lưu tệp tin đã tải lên. Vui lòng kiểm tra quyền thư mục "' . $target_dir . '".']);
        exit;
    }
}
// ------------------ KẾT THÚC LOGIC XỬ LÝ TỆP TIN ------------------


if (empty($title) || empty($content) || empty($category) || empty($author_username)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vui lòng điền đủ Tiêu đề, Nội dung, Phân loại và đăng nhập.']);
    exit;
}

try {
    // Cần thay đổi câu lệnh INSERT để thêm image_url
    $stmt = $pdo->prepare("
        INSERT INTO posts (author_username, title, content, category, image_url) 
        VALUES (?, ?, ?, ?, ?)
    ");
    // Sử dụng $image_url đã được cập nhật
    $stmt->execute([$author_username, $title, $content, $category, $image_url]);

    echo json_encode(['success' => true, 'message' => '🎉 Bài viết đã được gửi thành công, đang chờ quản trị viên duyệt!']);

} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Lỗi Server: Không thể lưu bài viết. Chi tiết: ' . $e->getMessage()]);
}
?>