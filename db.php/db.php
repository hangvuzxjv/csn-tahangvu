// Nội dung file db.php (Đã bỏ thẻ đóng ?>)
<?php
// BẬT BÁO CÁO LỖI PHP MỨC CAO
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Chứa thông tin kết nối tới CSDL và thiết lập PDO
define('DB_HOST', 'localhost');
define('DB_NAME', 'lab1'); // Tên CSDL bạn đã tạo
define('DB_USER', 'root');
define('DB_PASS', '');

function consolePrint($string) {
    echo '<script>console.log(' . json_encode((string)$string) . ');</script>';
}

// Khởi tạo kết nối PDO để các script khác sử dụng ($pdo)
try {
    // Tạo đối tượng PDO
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    // Bắt buộc PDO phải thông báo lỗi CSDL dưới dạng Exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); 
    // Vô hiệu hóa tính năng chuẩn bị mô phỏng của MySQL để đảm bảo kiểu dữ liệu
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); 
} catch (\PDOException $e) {
    // Lỗi kết nối sẽ hiển thị ngay lập tức
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'LỖI KẾT NỐI SERVER/CSDL: ' . $e->getMessage()]);
    exit;
}
// KHÔNG CÓ THẺ ĐÓNG ?>