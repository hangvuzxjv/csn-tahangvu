// =========================================================
// script.js - SCRIPT VẬN HÀNH TOÀN TRANG (FRONTEND HOÀN CHỈNH)
// =========================================================


    //const PUBLIC_UPLOAD_PREFIX = 'db.php/'; 

document.addEventListener('DOMContentLoaded', () => {
    // 1. KHỞI TẠO CÁC PHẦN TỬ CHUNG
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenu = document.getElementById('user-menu');
    
    // 2. XỬ LÝ FORM ĐĂNG KÝ/ĐĂNG NHẬP/ĐĂNG TIN (Cần lắng nghe sự kiện)
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    const postForm = document.getElementById('post-form');
    if (postForm) {
        postForm.addEventListener('submit', handleSubmitPost); 
    }
    // Forgot password form đã được xử lý ở phần SMS bên dưới
    // Thêm lắng nghe cho form reset password
    const resetPasswordForm = document.getElementById('reset-password-form');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPasswordSubmit);
    }

    // 3. HIỂN THỊ BÀI ĐĂNG TRÊN CÁC TRANG (DÙNG API MỚI)
    const currentPath = window.location.pathname;
    
    // Kiểm tra trang chủ
    if (currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
        renderPostsToContainer('post-list', { status: 'approved', limit: 6 }); // Trang Chủ: 6 bài đã duyệt
    }
    if (window.location.pathname.endsWith('tintuc.html')) {
        renderPostsToContainer('news-list', { status: 'approved' }); // Trang Tin Tức: Tất cả bài đã duyệt
    }
    
    // Tải nội dung chi tiết bài viết
    if (window.location.pathname.endsWith('chitiet.html')) {
        renderPostDetail();
    }
    
    // RENDER BÀI VIẾT TRÊN TRANG PROFILE (LOGIC MỚI)
    if (window.location.pathname.endsWith('profile.html')) {
        renderMyPosts(); 
    }
    
    
    // =========================================================================
    // FIX QUAN TRỌNG: GỌI HÀM KHỞI TẠO Ở CUỐI ĐỂ ĐẢM BẢO TẤT CẢ HÀM ĐƯỢC LOAD
    // =========================================================================
    initializeMobileMenu(mobileMenuToggle, mobileMenu);
    initializeUserMenu(userMenuBtn, userMenu);
    checkLoginStatus(); 
    initializeCarousel(); 
    
    // FIX: Gắn lại event listener cho các nút động sau khi DOMContentLoaded hoàn tất
    if (window.location.pathname.endsWith('admin.html')) {
        initializeAdminButtonDelegation();
    }
    
});

// THÊM HÀM MỚI ĐỂ GẮN SỰ KIỆN CHO CÁC NÚT ADMIN ĐỘNG
function initializeAdminButtonDelegation() {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    mainContent.addEventListener('click', (e) => {
        const target = e.target.closest('button'); // Tìm nút BUTTON gần nhất
        if (!target) return;
        
        const action = target.getAttribute('data-action');
        // Lấy postId từ thẻ cha chứa data-post-id (div admin-post-item hoặc div p-6)
        const postIdContainer = target.closest('[data-post-id]'); 
        
        if (action && postIdContainer) {
            const postId = postIdContainer.getAttribute('data-post-id');

            if (action === 'approve' || action === 'reject') {
                // Dùng handleApproval cho tab Pending
                const adminNote = document.getElementById(`admin-note-${postId}`).value.trim();
                handleApproval(postId, action, adminNote);
            } else if (action === 'delete') {
                // Dùng deletePost cho tab All Posts và Profile
                deletePost(postId); 
            }
        }
    });
}


// =========================================================
// CHỨC NĂNG A: HEADER & NAVIGATION
// =========================================================
function initializeMobileMenu(toggle, menu) {
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('hidden');
        });
    }
}

function initializeUserMenu(btn, menu) {
    if (btn && menu) {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            menu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!btn.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.add('hidden');
            }
        });
    }
}

function performSearch() {
    const query = document.getElementById('search-input').value.trim();
    // FIX: Đảm bảo lấy giá trị từ province-select nếu có
    const provinceSelect = document.getElementById('province-select');
    const province = provinceSelect ? provinceSelect.value : 'travinh';
    
    if (query.length === 0) {
        alert('Vui lòng nhập từ khóa tìm kiếm.');
        return; 
    }

    const encodedQuery = encodeURIComponent(query);
    window.location.href = `search.html?q=${encodedQuery}&province=${province}`;
}
window.performSearch = performSearch; 

// TRONG script.js, HÀM checkLoginStatus (ĐÃ SỬA - DÙNG SESSION)
async function checkLoginStatus() {
    const authButtons = document.getElementById('auth-buttons');
    const userProfileDiv = document.getElementById('user-profile');

    if (!authButtons || !userProfileDiv) return;

    try {
        // Gọi API kiểm tra session
        const response = await fetch(apiUrl('db.php/check_session.php'));
        const result = await response.json();
        
        if (!result.success) {
            // Nếu API lỗi, hiển thị nút đăng nhập
            authButtons.classList.remove('hidden');
            userProfileDiv.classList.add('hidden');
            return;
        }

        const isLoggedIn = result.isLoggedIn;
        const username = result.username || 'Người Dùng';
        const userRole = result.role || 'user';
        const postCount = result.postCount || 0;
        
        console.log('Login status:', { isLoggedIn, username, userRole, postCount }); 
        
        // Cập nhật thông tin trên trang profile
        if (window.location.pathname.endsWith('profile.html')) {
            const profileUsernameElement = document.getElementById('profile-username');
            const profilePostCountElement = document.getElementById('profile-post-count');
            const profileEmailElement = document.getElementById('profile-email');
            const profileAvatarElement = document.getElementById('profile-avatar');

            // Hiển thị username (tên đăng nhập)
            if (profileUsernameElement) {
                profileUsernameElement.textContent = username; 
            }

            if (profilePostCountElement) {
                profilePostCountElement.textContent = postCount; 
            }

            if (profileEmailElement && result.email) {
                profileEmailElement.textContent = result.email; 
            }
            
            // Hiển thị email chi tiết
            const profileEmailDetailElement = document.getElementById('profile-email-detail');
            if (profileEmailDetailElement && result.email) {
                profileEmailDetailElement.textContent = result.email;
            }

            // Hiển thị số điện thoại
            const profilePhoneElement = document.getElementById('profile-phone');
            if (profilePhoneElement) {
                profilePhoneElement.textContent = result.phone || 'Chưa cập nhật';
            }
        }

        if (isLoggedIn) {
            authButtons.classList.add('hidden');
            userProfileDiv.classList.remove('hidden');
            
            // Cập nhật tên user trong header
            const userButton = userProfileDiv.querySelector('#user-menu-btn');
            if (userButton) {
                // Tìm span chứa text "user_tv" hoặc span cuối cùng
                const spans = userButton.querySelectorAll('span');
                if (spans.length >= 2) {
                    // Span thứ 2 là tên user (span đầu là chữ "U")
                    spans[1].textContent = username;
                    console.log('Updated username to:', username);
                }
            }
            
            // Cập nhật số bài viết trên menu
            const profileLink = userProfileDiv.querySelector('a[href="profile.html"]');
            if(profileLink) {
                profileLink.textContent = `👤 Profile (${postCount} bài)`;
            }

            // THÊM NÚT ADMIN CHO ADMIN
            const userMenu = document.getElementById('user-menu');
            if (userRole === 'admin' && userMenu) {
                if (!userMenu.querySelector('a[href="admin.html"]')) {
                    const adminLink = document.createElement('a');
                    adminLink.href = 'admin.html';
                    adminLink.className = 'block px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50';
                    adminLink.textContent = '🛠️ Quản Trị Bài Viết';
                    userMenu.insertBefore(adminLink, userMenu.firstChild); 
                }
            }
           
        } else {
            authButtons.classList.remove('hidden');
            userProfileDiv.classList.add('hidden');
        }
        
    } catch (error) {
        console.error('Lỗi kiểm tra session:', error);
        // Nếu lỗi, hiển thị nút đăng nhập
        authButtons.classList.remove('hidden');
        userProfileDiv.classList.add('hidden');
    }
}
    
    
// =========================================================
// CHỨC NĂNG B: XỬ LÝ FORM AUTH
// =========================================================

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
    }
    if (password !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp.');
        return;
    }
    
    const formData = {
        username: document.getElementById('reg-username').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: password
    };
    
    try {
        const response = await fetch(apiUrl('db.php/register.php'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            alert(result.message + ' Chuyển hướng đến trang Đăng nhập.');
            window.location.href = 'dangnhap.html'; 
        } else {
            alert('Lỗi Đăng ký: ' + (result.message || 'Lỗi không xác định.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối:', error);
        alert('Lỗi kết nối server. Vui lòng kiểm tra console log để xem lỗi.');
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-password').value;
    
    if (!user || !pass) {
        alert('Vui lòng nhập tên tài khoản/email và mật khẩu.');
        return;
    }

    const formData = {
        user: user,
        password: pass
    };
    
    try {
        const response = await fetch(apiUrl('db.php/login.php'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Đăng nhập thành công - Session được tạo ở server
            alert(result.message);
            window.location.href = 'index.html'; 
        } else {
            alert('Lỗi Đăng nhập: ' + (result.message || 'Tên tài khoản/Email hoặc Mật khẩu không đúng.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối:', error);
        alert('Lỗi kết nối server. Vui lòng kiểm tra console log để xem lỗi.');
    }
}

async function logout() {
    try {
        const response = await fetch(apiUrl('db.php/logout.php'), {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            alert('➡️ Bạn đã đăng xuất.');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Lỗi đăng xuất:', error);
        alert('Có lỗi xảy ra khi đăng xuất.');
    }
}
window.logout = logout; 


// Hàm handleForgotPasswordSubmit cũ đã được thay thế bằng handleSendOTP (SMS) ở cuối file


    // =========================================================
    // CHỨC NĂNG C: XỬ LÝ BÀI ĐĂNG VÀ HIỂN THỊ
    // =========================================================
async function fetchPosts(params = {}) {
    const query = new URLSearchParams(params).toString();
    
    try {
        const url = window.apiUrl ? apiUrl(`db.php/get_posts.php?${query}`) : `/Project/db.php/get_posts.php?${query}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            return result.posts;
        } else {
            console.error('Lỗi API fetchPosts:', result.message);
            return [];
        }
    } catch (error) {
        console.error('Lỗi kết nối server khi tải bài viết:', error);
        return [];
    }
}

function createPostCard(post) {
    // Tạo tóm tắt tạm thời
    const summary = post.content.substring(0, 150) + '...'; 

    // Xử lý ảnh - ảnh được lưu trong thư mục uploads/
    let imageUrl;
    if (post.image_url && post.image_url.trim() !== '') {
        // Có ảnh upload - lấy từ thư mục uploads/
        imageUrl = 'uploads/' + post.image_url;
    } else {
        // Không có ảnh - dùng ảnh mặc định dựa trên ID của post (1-5)
        const imageNum = ((post.id - 1) % 5) + 1;
        imageUrl = 'img/' + imageNum + '.jpg';
    }

    // Định dạng lại ngày tháng
    const postDate = new Date(post.created_at).toLocaleDateString('vi-VN');
    
    // Logic nút xóa (chỉ hiển thị trên trang profile)
    const currentUser = localStorage.getItem('username');
    // FIX: Đảm bảo nút xóa chỉ hiện cho bài chưa duyệt trên trang tin tức/trang chủ
    const deleteButtonHtml = (window.location.pathname.endsWith('profile.html') && post.status !== 'approved' && currentUser === post.author_username) ? 
        `<button data-action="delete" data-post-id="${post.id}" class="text-xs text-red-500 hover:text-red-700 transition font-medium ml-3">🗑️ Xóa</button>` : 
        '';
        
    // Hiển thị trạng thái duyệt trên Card
    const statusText = post.status === 'pending' ? 'Chờ Duyệt' : (post.status === 'rejected' ? 'Bị Từ Chối' : 'Đã Duyệt');
    const statusClass = post.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : (post.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-600');
    // Nếu không phải trang profile, chỉ hiển thị bài đã duyệt, nên ẩn trạng thái
    const statusBadge = (window.location.pathname.endsWith('profile.html')) ? 
        `<span class="text-xs font-semibold ${statusClass} px-2 py-0.5 rounded">${post.category} - ${statusText}</span>` : 
        `<span class="text-xs font-semibold bg-blue-100 text-blue-600 px-2 py-0.5 rounded">${post.category}</span>`;


    return `
        <article class="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden">
            <img src="${imageUrl}" alt="${post.title}" class="w-full h-48 object-cover">
            <div class="p-5">
                ${statusBadge}
                <h3 class="text-xl font-semibold text-gray-800 my-2 hover:text-teal-600">
                    <a href="chitiet.html?id=${post.id}">${post.title}</a>
                </h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">${summary}</p>
                <div class="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                    <span class="flex items-center">
                        Ngày đăng: ${postDate}
                        ${deleteButtonHtml} 
                    </span>
                    <span class="font-medium text-teal-600">👤 Tác giả: ${post.author_username}</span>
                </div>
            </div>
        </article>
    `;
}

async function renderPostsToContainer(targetElementId, params = {}) {
    const container = document.getElementById(targetElementId);
    if (!container) return;

    container.innerHTML = '<p class="text-center text-teal-600 py-10">Đang tải bài viết...</p>';

    // Dùng hàm fetchPosts mới
    const posts = await fetchPosts(params);
    
    if (posts.length === 0) {
         container.innerHTML = `<p class="text-center text-gray-500 py-10">Chưa có bài đăng nào từ cộng đồng.</p>`;
         return;
    }
    
    const postsHtml = posts.map(createPostCard).join('');
    container.innerHTML = postsHtml; 
}


// LOGIC MỚI: RENDER BÀI VIẾT CỦA USER TRÊN TRANG PROFILE
async function renderMyPosts() {
    const container = document.getElementById('my-posts-list');
    if (!container) return;

    // Fetch bài viết của user hiện tại (session được kiểm tra ở server)
    const myPosts = await fetchPosts({ author: 'me', status: 'all' });
    
    // Cập nhật header sau khi load bài viết
    checkLoginStatus(); 
    
    if (myPosts.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-6">Bạn chưa có bài viết nào. Hãy <a href="dangtin.html" class="text-teal-600 hover:underline">Đăng Tin</a> để chia sẻ kinh nghiệm!</p>`;
        return;
    }

    // Tạo HTML cho các bài viết trong danh sách Profile
    const postsHtml = myPosts.map(post => {
        const statusClass = post.status === 'approved' ? 'text-green-600' : (post.status === 'pending' ? 'text-yellow-600' : 'text-red-600');
        const statusText = post.status === 'approved' ? '✅ Đã Duyệt' : (post.status === 'pending' ? '⏳ Chờ Duyệt' : '❌ Bị Từ Chối');
        
        // Nút xóa chỉ hiển thị nếu KHÔNG phải là bài đã duyệt
        const deleteButton = (post.status !== 'approved') ?
            `<button data-action="delete" data-post-id="${post.id}" class="text-sm text-red-500 hover:text-red-700 transition font-medium ml-3">🗑️ Xóa</button>` : '';

        return `
            <div class="bg-white p-4 rounded-lg shadow flex justify-between items-center hover:shadow-md transition" data-post-id="${post.id}">
                <div>
                    <a href="chitiet.html?id=${post.id}" class="text-lg font-semibold text-gray-800 hover:text-teal-600">${post.title}</a>
                    <p class="text-sm text-gray-500 mt-1">Đăng ngày: ${new Date(post.created_at).toLocaleDateString('vi-VN')} | <span class="${statusClass} font-medium">${statusText}</span></p>
                </div>
                ${deleteButton}
            </div>
        `;
    }).join('');

    container.innerHTML = postsHtml;
    
    // Gắn event listener cho nút xóa
    container.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const postId = btn.getAttribute('data-post-id');
            deletePost(postId);
        });
    });
}

// Cập nhật renderPostDetail để dùng API và hiển thị Admin Note
async function renderPostDetail() {
    const container = document.getElementById('post-detail-container');
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        if(container) container.innerHTML = '<h1 class="text-3xl font-bold text-red-500 text-center">Lỗi: Không tìm thấy ID bài viết!</h1>';
        return;
    }
    
    // Fetch bài viết chi tiết (session được kiểm tra ở server)
    const posts = await fetchPosts({ id: postId });
    const post = posts[0];
    
    if (!post) {
         if(container) container.innerHTML = '<h1 class="text-3xl font-bold text-red-500 text-center">Bài viết không tồn tại.</h1>';
         return;
    }
    
    // Xử lý ảnh - ảnh được lưu trong thư mục uploads/
    let imageUrl;
    if (post.image_url && post.image_url.trim() !== '') {
        // Có ảnh upload - lấy từ thư mục uploads/
        imageUrl = 'uploads/' + post.image_url;
    } else {
        // Không có ảnh - dùng ảnh mặc định dựa trên ID
        const imageNum = ((post.id - 1) % 5) + 1;
        imageUrl = 'img/' + imageNum + '.jpg';
    }
    
    // Logic kiểm tra quyền truy cập đã được xử lý ở server
    // Nếu post tồn tại, nghĩa là user có quyền xem
    
    // --- Bắt đầu tạo HTML ---
    document.title = post.title + ' | SeaTech';
    const postDate = new Date(post.created_at).toLocaleDateString('vi-VN');
    
    // Xử lý Admin Note (Phân tích/Hướng dẫn)
    let adminNoteHtml = '';
    if (post.status === 'approved' && post.admin_note) {
        adminNoteHtml = `
            <div class="mt-8 p-6 bg-teal-50 border-l-4 border-teal-600 rounded-lg">
                <h2 class="text-xl font-bold text-teal-700 mb-2">💡 Phân Tích & Hướng Dẫn từ Quản Trị Viên</h2>
                <div class="prose max-w-none text-gray-700 leading-relaxed">
                    <p>${post.admin_note.replace(/\n/g, '</p><p>')}</p>
                </div>
                <p class="text-xs text-gray-500 mt-2">Được phê duyệt bởi: ${post.approved_by_admin}</p>
            </div>
        `;
    }
    
    // Thẻ trạng thái (cho tác giả/admin xem)
    let statusBadge = '';
    if (post.status !== 'approved') {
        const statusClass = post.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
        statusBadge = `<span class="ml-3 px-3 py-1 rounded-full text-xs font-semibold ${statusClass}">${post.status === 'pending' ? 'Đang Chờ Duyệt' : 'Đã Bị Từ Chối'}</span>`;
    }

    const contentHtml = `
        <div class="max-w-4xl mx-auto">
            <div id="post-detail-content">
                <span class="text-sm font-semibold text-teal-600 bg-teal-100 px-3 py-1 rounded">${post.category}</span>
                ${statusBadge}
                <h1 class="text-4xl font-extrabold text-teal-700 mb-3">${post.title}</h1>
                <p class="text-sm text-gray-500">
                    Ngày đăng: ${postDate} | Tác giả: <span class="font-medium text-teal-600">${post.author_username}</span>
                </p>
            </div>

            <figure class="mb-8">
                <img src="${imageUrl}" alt="${post.title}" class="w-full h-auto rounded-xl shadow-lg object-cover">
                <figcaption class="text-center text-sm text-gray-500 mt-2">Ảnh minh họa (Tạm thời)</figcaption>
            </figure>

            <div class="prose max-w-none bg-white p-6 rounded-xl shadow-md">
                <div class="text-gray-700 leading-relaxed">
                    <p>${post.content.replace(/\n/g, '</p><p>')}</p>
                </div>
            </div>
            
            ${adminNoteHtml}

            <div class="mt-8 pt-4 border-t-2 border-dashed border-gray-300 flex items-center justify-end space-x-4">
                <div class="text-right">
                    <p class="text-sm text-gray-500">Bài viết được chia sẻ bởi:</p>
                    <a href="profile.html" class="text-lg font-bold text-teal-600 hover:text-teal-800">${post.author_username}</a>
                    <p class="text-xs text-gray-500">Người nuôi có kinh nghiệm</p>
                </div>
                <a href="profile.html">
                    <img src="img/avt1.jpg" alt="Avatar" class="w-16 h-16 rounded-full border-2 border-teal-500">
                </a>
            </div>

            <div class="mt-10 pt-6 border-t">
                <a href="tintuc.html" class="inline-flex items-center text-teal-600 hover:text-teal-800 font-medium">
                    ← Quay lại trang Tin Tức
                </a>
            </div>
        </div>
    `;
    
    container.innerHTML = contentHtml;
}
window.renderPostDetail = renderPostDetail;


// Hàm xóa bài viết (Sử dụng lại logic từ trang Profile)
async function deletePost(postId) {
    if (!confirm('Bạn có chắc chắn muốn XÓA bài viết này không? Hành động này không thể hoàn tác.')) {
        return;
    }

    const formData = {
        post_id: postId
    };
    
    try {
        const response = await fetch(apiUrl('db.php/delete_post.php'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            
            // Tải lại tab Admin đang xem
            if (window.location.pathname.endsWith('admin.html')) {
                const pendingTab = document.querySelector('.admin-tab[data-tab="pending"]');
                if (pendingTab && pendingTab.classList.contains('active')) {
                    renderAdminDashboard();
                } else {
                    renderAllPostsForAdmin();
                }
            } else if (window.location.pathname.endsWith('profile.html')) {
                renderMyPosts(); 
            }
            
        } else if (response.status === 401) {
            alert('Bạn cần đăng nhập để thực hiện hành động này.');
            window.location.href = 'dangnhap.html';
        } else if (response.status === 403) {
            alert('Bạn không có quyền xóa bài viết này.');
        } else {
            alert('Lỗi Xóa bài viết: ' + (result.message || 'Lỗi không xác định.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối server:', error);
        alert('Lỗi kết nối server. Vui lòng kiểm tra console log.');
    }
}
window.deletePost = deletePost;


// --- LOGIC MỚI: Hiển thị TẤT CẢ Bài viết cho Admin (Bao gồm nút xóa Admin) ---

async function renderAllPostsForAdmin() {
    const container = document.getElementById('all-posts-list');
    if (!container) return;
    
    container.innerHTML = '<p class="text-center text-teal-600 py-10">Đang tải TẤT CẢ bài viết...</p>';

    // SỬA LỖI: Bỏ authorFilter để Admin có thể thấy TẤT CẢ bài viết.
    const allPosts = await fetchPosts({ status: 'all' }); 

    if (allPosts.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-10">Không có bài viết nào trong hệ thống.</p>`;
        return;
    }

    const postsHtml = allPosts.map(post => {
        const statusClass = post.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            (post.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700');
        const statusBorder = post.status === 'approved' ? 'border-green-500' : 
                             (post.status === 'pending' ? 'border-yellow-500' : 'border-red-500');
        const statusText = post.status === 'approved' ? 'Đã Duyệt' : (post.status === 'pending' ? 'Chờ Duyệt' : 'Bị Từ Chối');
        
        // Nút Xóa dành cho ADMIN (Admin có quyền xóa mọi bài)
        const adminDeleteButton = 
            // FIX: Sử dụng data-action và data-post-id
            `<button data-action="delete" data-post-id="${post.id}" class="text-sm px-3 py-1 bg-red-100 text-red-600 font-semibold rounded-lg hover:bg-red-200 transition">
                🗑️ Xóa Bài
            </button>`;

        return `
            <div class="admin-post-item bg-white p-4 rounded-xl shadow-md space-y-3 mb-4 border-l-4 ${statusBorder}" data-post-id="${post.id}">
                <div class="flex justify-between items-start">
                    <div>
                        <a href="chitiet.html?id=${post.id}" class="text-lg font-bold text-gray-800 hover:text-red-600">${post.title}</a>
                        <p class="text-xs text-gray-500 mt-1">Tác giả: ${post.author_username} | Phân loại: ${post.category}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-semibold ${statusClass} px-2 py-0.5 rounded">${statusText}</span>
                    </div>
                </div>
                <div class="flex justify-end mt-3 border-t pt-2">
                    ${adminDeleteButton}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = postsHtml;
}
window.renderAllPostsForAdmin = renderAllPostsForAdmin;

// --- LOGIC HIỂN THỊ BÀI CHỜ DUYỆT (Đã có sẵn, chỉ sửa để dùng CSS mới) ---

async function renderAdminDashboard() {
    const container = document.getElementById('pending-posts-list');
    if (!container) return;
    
    container.innerHTML = '<p class="text-center text-teal-600 py-10">Đang tải bài viết đang chờ duyệt...</p>';

    // SỬA LỖI: Bỏ authorFilter để Admin có thể thấy TẤT CẢ bài viết CHỜ DUYỆT
    const pendingPosts = await fetchPosts({ status: 'pending' });

    if (pendingPosts.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-10">Không có bài viết nào đang chờ duyệt. 🎉</p>`;
        return;
    }

    const postsHtml = pendingPosts.map(post => {
        return `
            <div class="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500" data-post-id="${post.id}">
                <h3 class="text-xl font-bold text-gray-800 mb-2">${post.title}</h3>
                <p class="text-sm text-gray-600 mb-3">Tác giả: ${post.author_username} | Phân loại: ${post.category}</p>
                <div class="prose max-w-none text-gray-700 leading-relaxed mb-4 border p-3 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                    ${post.content.replace(/\n/g, '<br>')}
                </div>

                <div class="mb-4">
                    <label for="admin-note-${post.id}" class="block text-sm font-medium text-gray-700 mb-1">Phân Tích & Hướng Dẫn (Tùy chọn)</label>
                    <textarea id="admin-note-${post.id}" rows="3" class="w-full p-2 border rounded-lg focus:ring-teal-500"></textarea>
                </div>

                <div class="flex justify-end space-x-3">
                    <button data-action="reject" data-post-id="${post.id}" class="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition">
                        ❌ Từ Chối
                    </button>
                    <button data-action="approve" data-post-id="${post.id}" class="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition">
                        ✅ Phê Duyệt
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = postsHtml;
}
    window.handleApproval = handleApproval;
    window.renderAdminDashboard = renderAdminDashboard;

async function handleSubmitPost(event) {
    event.preventDefault();

    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim();
    const category = document.getElementById('post-category').value;
    const postMedia = document.getElementById('post-media').files[0];

    if (title.length < 5 || content.length < 10 || category.length === 0) {
        alert('Vui lòng điền đủ Tiêu đề (tối thiểu 5 ký tự), Nội dung (tối thiểu 10 ký tự) và chọn Phân loại.');
        return;
    }

    // Tạo FormData để gửi file
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    if (postMedia) {
        formData.append('post-media', postMedia);
    }

    try {
        const response = await fetch(apiUrl('db.php/submit_post.php'), {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            window.location.href = 'profile.html'; 
        } else if (response.status === 401) {
            alert('Bạn cần đăng nhập để đăng bài viết.');
            window.location.href = 'dangnhap.html';
        } else {
            alert('Lỗi Đăng bài: ' + (result.message || 'Lỗi không xác định.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối:', error);
        alert('Lỗi kết nối server. Vui lòng kiểm tra console log để xem lỗi.');
    }
}
window.handleSubmitPost = handleSubmitPost;


// Thêm hàm này vào script.js
async function handleApproval(postId, action, adminNote) {
    if (!confirm(`Bạn có chắc muốn ${action === 'approve' ? 'Phê duyệt' : 'Từ chối'} bài viết ID: ${postId}?`)) {
        return;
    }

    const formData = {
        post_id: postId,
        action: action,
        admin_note: adminNote
    };
    
    try {
        const response = await fetch(apiUrl('db.php/approve_post.php'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            renderAdminDashboard(); 
        } else if (response.status === 403) {
            alert('Bạn không có quyền thực hiện hành động này.');
            window.location.href = 'index.html';
        } else {
            alert('Lỗi: ' + (result.message || 'Lỗi không xác định.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối server:', error);
        alert('Lỗi kết nối server. Vui lòng kiểm tra console log.');
    }
}
window.handleApproval = handleApproval;
// =========================================================
// CHỨC NĂNG D: XỬ LÝ ĐẶT LẠI MẬT KHẨU
// =========================================================

async function handleResetPasswordSubmit(event) {
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-new-password').value;
    
    if (!token) {
        alert('Liên kết đặt lại mật khẩu không hợp lệ.');
        return;
    }

    if (newPassword.length < 6) {
        alert('Mật khẩu mới phải có ít nhất 6 ký tự.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp.');
        return;
    }

    const formData = {
        token: token,
        new_password: newPassword
    };
    
    try {
        const response = await fetch(apiUrl('db.php/reset_password.php'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message + ' Chuyển hướng đến trang đăng nhập.');
            window.location.href = 'dangnhap.html'; 
        } else {
            alert('Lỗi: ' + (result.message || 'Không thể đặt lại mật khẩu.'));
        }

    } catch (error) {
        console.error('Lỗi kết nối server:', error);
        alert('Lỗi kết nối server. Vui lòng thử lại sau.');
    }
}





// Thêm khối chức năng này vào file script.js (ví dụ: ở cuối file)

function initializeCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    
    // Đặt slide đầu tiên hiển thị
    slides[currentSlide].classList.add('opacity-100');
    slides[currentSlide].classList.remove('opacity-0');
    
    function nextSlide() {
        // Ẩn slide hiện tại
        slides[currentSlide].classList.add('opacity-0');
        slides[currentSlide].classList.remove('opacity-100');
        
        // Chuyển sang slide kế tiếp
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Hiển thị slide mới
        slides[currentSlide].classList.add('opacity-100');
        slides[currentSlide].classList.remove('opacity-0');
    }

    // Tự động chuyển slide mỗi 5 giây
    setInterval(nextSlide, 5000); 
}
window.initializeCarousel = initializeCarousel; // Cần thiết để hàm được gọi

// =========================================================
// CHỨC NĂNG: CHỈNH SỬA THÔNG TIN PROFILE
// =========================================================

window.openEditModal = function() {
    // Lấy thông tin hiện tại từ session
    const url = window.apiUrl ? apiUrl('db.php/check_session.php') : '/Project/db.php/check_session.php';
    fetch(url)
        .then(response => response.json())
        .then(result => {
            if (result.isLoggedIn) {
                document.getElementById('edit-username').value = result.username;
                document.getElementById('edit-email').value = result.email;
                document.getElementById('edit-modal').classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Lỗi load thông tin:', error);
            alert('Không thể tải thông tin. Vui lòng thử lại.');
        });
};

window.closeEditModal = function() {
    document.getElementById('edit-modal').classList.add('hidden');
    // Reset form
    const form = document.getElementById('edit-profile-form');
    if (form) form.reset();
};

// Xử lý submit form chỉnh sửa
document.addEventListener('DOMContentLoaded', () => {
    const editForm = document.getElementById('edit-profile-form');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('edit-username').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const currentPassword = document.getElementById('edit-current-password').value;
            const newPassword = document.getElementById('edit-new-password').value;

            // Validate
            if (!username || !email) {
                alert('Vui lòng điền đủ thông tin.');
                return;
            }

            if (newPassword && newPassword.length < 6) {
                alert('Mật khẩu mới phải có ít nhất 6 ký tự.');
                return;
            }

            if (newPassword && !currentPassword) {
                alert('Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu.');
                return;
            }

            const formData = {
                username: username,
                email: email,
                current_password: currentPassword,
                new_password: newPassword
            };

            try {
                const url = window.apiUrl ? apiUrl('db.php/update_profile.php') : '/Project/db.php/update_profile.php';
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    alert(result.message);
                    closeEditModal();
                    // Reload trang để cập nhật thông tin
                    window.location.reload();
                } else {
                    alert('Lỗi: ' + (result.message || 'Không thể cập nhật thông tin.'));
                }

            } catch (error) {
                console.error('Lỗi kết nối:', error);
                alert('Lỗi kết nối server.');
            }
        });
    }
});

// Functions đã được export ở trên


// =========================================================
// CHỨC NĂNG: CHATBOT AI
// =========================================================

let chatbotVisible = false;

function toggleChatbot() {
    const window = document.getElementById('chatbot-window');
    if (!window) return;
    
    chatbotVisible = !chatbotVisible;
    
    if (chatbotVisible) {
        window.classList.remove('hidden');
    } else {
        window.classList.add('hidden');
    }
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Hiển thị tin nhắn của user
    addChatMessage(message, 'user');
    input.value = '';
    
    // Hiển thị typing indicator
    addChatMessage('Đang suy nghĩ...', 'bot', true);
    
    try {
        const url = window.apiUrl ? apiUrl('db.php/chatbot.php') : '/Project/db.php/chatbot.php';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message })
        });
        
        const result = await response.json();
        
        // Xóa typing indicator
        removeTypingIndicator();
        
        if (result.success) {
            addChatMessage(result.response, 'bot');
        } else {
            addChatMessage('Xin lỗi, tôi không thể trả lời câu hỏi này lúc này.', 'bot');
        }
    } catch (error) {
        console.error('Lỗi chatbot:', error);
        removeTypingIndicator();
        addChatMessage('Lỗi kết nối. Vui lòng thử lại sau.', 'bot');
    }
}

function addChatMessage(message, sender, isTyping = false) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    
    if (sender === 'user') {
        messageDiv.className = 'bg-teal-600 text-white p-3 rounded-lg ml-8 shadow-sm';
    } else {
        messageDiv.className = 'bg-white p-3 rounded-lg mr-8 shadow-sm';
        if (isTyping) {
            messageDiv.id = 'typing-indicator';
        }
    }
    
    messageDiv.innerHTML = `<p class="text-sm">${message}</p>`;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Export functions
window.toggleChatbot = toggleChatbot;
window.handleChatKeyPress = handleChatKeyPress;
window.sendChatMessage = sendChatMessage;


// =========================================================
// CHỨC NĂNG: TRANG TIN TỨC
// =========================================================

let newsCurrentPage = 1;

// Lọc tin tức
async function filterNews() {
    const category = document.getElementById('category-filter')?.value || '';
    const sort = document.getElementById('sort-filter')?.value || 'created_at';
    const keyword = document.getElementById('keyword-filter')?.value || '';
    
    newsCurrentPage = 1;
    await loadNews(category, sort, keyword, 1);
}

// Load tin tức
async function loadNews(category = '', sort = 'created_at', keyword = '', page = 1) {
    const container = document.getElementById('news-list');
    if (!container) return;
    
    container.innerHTML = '<p class="col-span-full text-center text-gray-500 py-10">Đang tải...</p>';
    
    try {
        const params = new URLSearchParams({
            category: category,
            sort: sort,
            keyword: keyword,
            page: page,
            limit: 9,
            status: 'approved'
        });
        
        const url = window.apiUrl ? apiUrl(`db.php/get_posts.php?${params}`) : `/Project/db.php/get_posts.php?${params}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.posts.length > 0) {
            const newsHtml = result.posts.map(post => {
                // Xử lý ảnh giống như createPostCard
                let imageUrl;
                if (post.image_url && post.image_url.trim() !== '') {
                    // Có ảnh upload - lấy từ thư mục uploads/
                    imageUrl = 'uploads/' + post.image_url;
                } else {
                    // Không có ảnh - dùng ảnh mặc định dựa trên ID của post (1-5)
                    const imageNum = ((post.id - 1) % 5) + 1;
                    imageUrl = 'img/' + imageNum + '.jpg';
                }
                
                const summary = post.content.substring(0, 120) + '...';
                const postDate = new Date(post.created_at).toLocaleDateString('vi-VN');
                
                const categoryColors = {
                    'kinh-nghiem': 'blue',
                    'tin-tuc': 'green',
                    'hoi-dap': 'purple',
                    'thi-truong': 'orange'
                };
                const color = categoryColors[post.category] || 'gray';
                
                const categoryNames = {
                    'kinh-nghiem': 'Kinh Nghiệm',
                    'tin-tuc': 'Tin Tức',
                    'hoi-dap': 'Hỏi Đáp',
                    'thi-truong': 'Thị Trường'
                };
                const categoryName = categoryNames[post.category] || post.category;
                
                return `
                    <article class="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden">
                        <img src="${imageUrl}" alt="${post.title}" class="w-full h-48 object-cover">
                        <div class="p-5">
                            <span class="text-xs font-semibold text-${color}-600 bg-${color}-100 px-2 py-0.5 rounded">${categoryName}</span>
                            <h3 class="text-xl font-semibold text-gray-800 my-2 hover:text-teal-600">
                                <a href="chitiet.html?id=${post.id}">${post.title}</a>
                            </h3>
                            <p class="text-gray-600 text-sm mb-4 line-clamp-3">${summary}</p>
                            <div class="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                                <span>Ngày: ${postDate}</span>
                                <span class="font-medium text-teal-600">👤 ${post.author_username}</span>
                            </div>
                            <div class="flex justify-between items-center text-xs text-gray-500 mt-2">
                                <span>👁️ ${post.views || 0} lượt xem</span>
                                <span>⭐ ${post.rating_count > 0 ? (post.rating_total / post.rating_count).toFixed(1) : '0'}</span>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
            
            container.innerHTML = newsHtml;
            
            // Tạo phân trang với thông tin từ API
            if (result.pagination) {
                createNewsPagination(result.pagination.totalPages, result.pagination.currentPage);
            }
        } else {
            container.innerHTML = '<p class="col-span-full text-center text-gray-500 py-10">Không tìm thấy tin tức nào.</p>';
        }
    } catch (error) {
        console.error('Lỗi:', error);
        container.innerHTML = '<p class="col-span-full text-center text-red-500 py-10">Lỗi kết nối server.</p>';
    }
}

// Tạo phân trang cho tin tức
function createNewsPagination(totalPages, currentPage = newsCurrentPage) {
    const container = document.getElementById('news-pagination');
    if (!container || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    newsCurrentPage = currentPage; // Cập nhật trang hiện tại
    
    let paginationHtml = '<div class="flex items-center justify-center space-x-2">';
    
    // Nút Previous
    if (newsCurrentPage > 1) {
        paginationHtml += `<button onclick="changeNewsPage(${newsCurrentPage - 1})" class="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition">‹ Trước</button>`;
    }
    
    // Hiển thị trang đầu nếu cần
    if (newsCurrentPage > 3) {
        paginationHtml += `<button onclick="changeNewsPage(1)" class="px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg">1</button>`;
        if (newsCurrentPage > 4) {
            paginationHtml += `<span class="px-2 text-gray-500">...</span>`;
        }
    }
    
    // Các số trang xung quanh trang hiện tại
    for (let i = Math.max(1, newsCurrentPage - 2); i <= Math.min(totalPages, newsCurrentPage + 2); i++) {
        const activeClass = i === newsCurrentPage ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100';
        paginationHtml += `<button onclick="changeNewsPage(${i})" class="px-3 py-2 text-sm font-medium ${activeClass} border rounded-lg transition">${i}</button>`;
    }
    
    // Hiển thị trang cuối nếu cần
    if (newsCurrentPage < totalPages - 2) {
        if (newsCurrentPage < totalPages - 3) {
            paginationHtml += `<span class="px-2 text-gray-500">...</span>`;
        }
        paginationHtml += `<button onclick="changeNewsPage(${totalPages})" class="px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg">${totalPages}</button>`;
    }
    
    // Nút Next
    if (newsCurrentPage < totalPages) {
        paginationHtml += `<button onclick="changeNewsPage(${newsCurrentPage + 1})" class="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition">Tiếp ›</button>`;
    }
    
    paginationHtml += '</div>';
    
    // Thêm thông tin trang
    paginationHtml += `<div class="text-center mt-4 text-sm text-gray-600">Trang ${newsCurrentPage} / ${totalPages}</div>`;
    
    container.innerHTML = paginationHtml;
}

// Chuyển trang tin tức
function changeNewsPage(page) {
    newsCurrentPage = page;
    const category = document.getElementById('category-filter')?.value || '';
    const sort = document.getElementById('sort-filter')?.value || 'created_at';
    const keyword = document.getElementById('keyword-filter')?.value || '';
    loadNews(category, sort, keyword, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Export functions
window.filterNews = filterNews;
window.changeNewsPage = changeNewsPage;

// Auto load khi vào trang tin tức
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('tintuc.html')) {
        loadNews();
    }
});


// =========================================================
// CHỨC NĂNG: TRANG KỸ THUẬT NUÔI
// =========================================================

let kyThuatNuoiCurrentPage = 1;

// Lọc kỹ thuật nuôi
async function filterKyThuatNuoi() {
    // Lấy giá trị từ radio button
    const topicRadio = document.querySelector('input[name="topic"]:checked');
    const topic = topicRadio ? topicRadio.value : '';
    const keyword = document.getElementById('keyword-search')?.value || '';
    
    kyThuatNuoiCurrentPage = 1;
    await loadKyThuatNuoi(topic, keyword, 1);
}

// Reset filter
function resetFilter() {
    document.getElementById('keyword-search').value = '';
    document.querySelector('input[name="topic"][value=""]').checked = true;
    filterKyThuatNuoi();
}

// Xử lý URL parameters khi load trang kỹ thuật nuôi
function handleKyThuatNuoiParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category) {
        // Tự động chọn radio button tương ứng
        const topicValue = category === 'tom' ? 'tôm' : (category === 'ca' ? 'cá' : '');
        const radioButton = document.querySelector(`input[name="topic"][value="${topicValue}"]`);
        
        if (radioButton) {
            radioButton.checked = true;
            // Tự động lọc theo category
            filterKyThuatNuoi();
        }
    }
}

// Load kỹ thuật nuôi
async function loadKyThuatNuoi(topic = '', keyword = '', page = 1) {
    const container = document.getElementById('kythuat-nuoi-list');
    if (!container) return;
    
    container.innerHTML = '<p class="text-center text-gray-500 py-10">Đang tải...</p>';
    
    try {
        const params = new URLSearchParams({
            topic: topic,
            keyword: keyword,
            page: page,
            limit: 10,
            status: 'approved'
        });
        
        const url = window.apiUrl ? apiUrl(`db.php/get_technical_posts.php?${params}`) : `/Project/db.php/get_technical_posts.php?${params}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.posts.length > 0) {
            const postsHtml = result.posts.map(post => {
                const summary = post.content.substring(0, 150) + '...';
                const postDate = new Date(post.created_at).toLocaleDateString('vi-VN');
                
                const colors = ['blue', 'green', 'purple', 'orange', 'red'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                return `
                    <article class="bg-white p-6 rounded-xl shadow hover:shadow-lg transition border-l-4 border-${color}-600">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <span class="text-xs font-semibold text-${color}-600 bg-${color}-100 px-2 py-0.5 rounded">${post.category || 'Kỹ Thuật'}</span>
                                <h3 class="text-2xl font-bold text-gray-800 mt-1 mb-2 hover:text-teal-600">
                                    <a href="chitiet.html?id=${post.id}">${post.title}</a>
                                </h3>
                            </div>
                            <span class="text-sm text-gray-500">Ngày: ${postDate}</span>
                        </div>
                        <p class="text-gray-600 line-clamp-3 text-sm mt-2">${summary}</p>
                        <div class="flex justify-between items-center mt-3">
                            <a href="chitiet.html?id=${post.id}" class="text-teal-600 font-medium hover:underline text-sm">Xem chi tiết →</a>
                            <div class="flex items-center space-x-3 text-xs text-gray-500">
                                <span>👁️ ${post.views || 0}</span>
                                <span>⭐ ${post.rating_count > 0 ? (post.rating_total / post.rating_count).toFixed(1) : '0'}</span>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');
            
            container.innerHTML = postsHtml;
            
            // Tạo phân trang với thông tin từ API
            if (result.pagination) {
                createKyThuatNuoiPagination(result.pagination.totalPages, result.pagination.currentPage);
            }
        } else {
            container.innerHTML = '<p class="text-center text-gray-500 py-10">Không tìm thấy bài viết nào.</p>';
        }
    } catch (error) {
        console.error('Lỗi:', error);
        container.innerHTML = '<p class="text-center text-red-500 py-10">Lỗi kết nối server.</p>';
    }
}

// Tạo phân trang cho kỹ thuật nuôi
function createKyThuatNuoiPagination(totalPages, currentPage = kyThuatNuoiCurrentPage) {
    const container = document.getElementById('kythuat-nuoi-pagination');
    if (!container || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    kyThuatNuoiCurrentPage = currentPage;
    
    let paginationHtml = '<div class="flex items-center justify-center space-x-2">';
    
    // Nút Previous
    if (kyThuatNuoiCurrentPage > 1) {
        paginationHtml += `<button onclick="changeKyThuatNuoiPage(${kyThuatNuoiCurrentPage - 1})" class="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition">‹ Trước</button>`;
    }
    
    // Hiển thị trang đầu nếu cần
    if (kyThuatNuoiCurrentPage > 3) {
        paginationHtml += `<button onclick="changeKyThuatNuoiPage(1)" class="px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg">1</button>`;
        if (kyThuatNuoiCurrentPage > 4) {
            paginationHtml += `<span class="px-2 text-gray-500">...</span>`;
        }
    }
    
    // Các số trang xung quanh trang hiện tại
    for (let i = Math.max(1, kyThuatNuoiCurrentPage - 2); i <= Math.min(totalPages, kyThuatNuoiCurrentPage + 2); i++) {
        const activeClass = i === kyThuatNuoiCurrentPage ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100';
        paginationHtml += `<button onclick="changeKyThuatNuoiPage(${i})" class="px-3 py-2 text-sm font-medium ${activeClass} border rounded-lg transition">${i}</button>`;
    }
    
    // Hiển thị trang cuối nếu cần
    if (kyThuatNuoiCurrentPage < totalPages - 2) {
        if (kyThuatNuoiCurrentPage < totalPages - 3) {
            paginationHtml += `<span class="px-2 text-gray-500">...</span>`;
        }
        paginationHtml += `<button onclick="changeKyThuatNuoiPage(${totalPages})" class="px-3 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg">${totalPages}</button>`;
    }
    
    // Nút Next
    if (kyThuatNuoiCurrentPage < totalPages) {
        paginationHtml += `<button onclick="changeKyThuatNuoiPage(${kyThuatNuoiCurrentPage + 1})" class="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition">Tiếp ›</button>`;
    }
    
    paginationHtml += '</div>';
    
    // Thêm thông tin trang
    paginationHtml += `<div class="text-center mt-4 text-sm text-gray-600">Trang ${kyThuatNuoiCurrentPage} / ${totalPages}</div>`;
    
    container.innerHTML = paginationHtml;
}

// Chuyển trang
function changeKyThuatNuoiPage(page) {
    kyThuatNuoiCurrentPage = page;
    const topicRadio = document.querySelector('input[name="topic"]:checked');
    const topic = topicRadio ? topicRadio.value : '';
    const keyword = document.getElementById('keyword-search')?.value || '';
    loadKyThuatNuoi(topic, keyword, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Export functions
window.filterKyThuatNuoi = filterKyThuatNuoi;
window.changeKyThuatNuoiPage = changeKyThuatNuoiPage;
window.resetFilter = resetFilter;

// Auto load
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('kythuat-nuoi.html')) {
        // Xử lý URL parameters trước khi load
        handleKyThuatNuoiParams();
        // Nếu không có parameters, load tất cả
        if (!window.location.search) {
            loadKyThuatNuoi();
        }
    }
});


// =========================================================
// CHỨC NĂNG AVATAR ĐÃ TẠM THỜI VÔ HIỆU HÓA
// =========================================================
// Các chức năng avatar đã được tạm thời vô hiệu hóa để tránh lỗi


// =========================================================
// HELPER FUNCTION: SHOW MESSAGE
// =========================================================

function showMessage(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.className = 'mt-4 p-3 rounded-lg';
    
    if (type === 'success') {
        element.classList.add('bg-green-100', 'text-green-800', 'border', 'border-green-300');
    } else if (type === 'error') {
        element.classList.add('bg-red-100', 'text-red-800', 'border', 'border-red-300');
    }
    
    element.classList.remove('hidden');
}

// =========================================================
// CHỨC NĂNG: QUÊN MẬT KHẨU QUA SMS
// =========================================================

let userPhone = '';  // Lưu số điện thoại để dùng cho verify OTP

// Xử lý form gửi OTP
document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgot-password-form');
    const verifyForm = document.getElementById('verify-otp-form');
    
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleSendOTP);
    }
    
    if (verifyForm) {
        verifyForm.addEventListener('submit', handleVerifyOTP);
    }
});

async function handleSendOTP(event) {
    event.preventDefault();
    
    const phone = document.getElementById('fp-phone').value.trim();
    const messageDiv = document.getElementById('forgot-message');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    if (!phone) {
        showMessage(messageDiv, 'Vui lòng nhập số điện thoại.', 'error');
        return;
    }
    
    // Validate số điện thoại Việt Nam
    if (!validateVietnamesePhone(phone)) {
        showMessage(messageDiv, 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam.', 'error');
        return;
    }
    
    userPhone = phone;  // Lưu lại
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Đang gửi...';
    
    try {
        const url = window.apiUrl ? apiUrl('db.php/forgot_password_sms.php') : '/Project/db.php/forgot_password_sms.php';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(messageDiv, '✅ ' + result.message, 'success');
            
            // Chuyển sang form nhập OTP sau 2 giây
            setTimeout(() => {
                showOTPForm();
            }, 2000);
        } else {
            showMessage(messageDiv, '❌ ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showMessage(messageDiv, '❌ Lỗi kết nối server.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '📨 Gửi Mã OTP';
    }
}

async function handleVerifyOTP(event) {
    event.preventDefault();
    
    const otp = document.getElementById('otp-code').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const messageDiv = document.getElementById('verify-message');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    if (!otp || !newPassword || !confirmPassword) {
        showMessage(messageDiv, 'Vui lòng điền đầy đủ thông tin.', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage(messageDiv, 'Mật khẩu xác nhận không khớp.', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage(messageDiv, 'Mật khẩu phải có ít nhất 6 ký tự.', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '⏳ Đang xử lý...';
    
    try {
        const url = window.apiUrl ? apiUrl('db.php/verify_otp.php') : '/Project/db.php/verify_otp.php';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: userPhone,
                otp: otp,
                new_password: newPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(messageDiv, '✅ ' + result.message, 'success');
            
            // Redirect về trang đăng nhập sau 2 giây
            setTimeout(() => {
                window.location.href = 'dangnhap.html';
            }, 2000);
        } else {
            showMessage(messageDiv, '❌ ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        showMessage(messageDiv, '❌ Lỗi kết nối server.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '✅ Đặt Lại Mật Khẩu';
    }
}

function showOTPForm() {
    document.getElementById('forgot-password-form').classList.add('hidden');
    document.getElementById('verify-otp-form').classList.remove('hidden');
}

function showPhoneForm() {
    document.getElementById('verify-otp-form').classList.add('hidden');
    document.getElementById('forgot-password-form').classList.remove('hidden');
    document.getElementById('forgot-message').classList.add('hidden');
}

function validateVietnamesePhone(phone) {
    // Số điện thoại Việt Nam: 10 số, bắt đầu bằng 0
    const regex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
    return regex.test(phone.replace(/[\s\-]/g, ''));
}

// Export functions
window.handleSendOTP = handleSendOTP;
window.handleVerifyOTP = handleVerifyOTP;
window.showOTPForm = showOTPForm;
window.showPhoneForm = showPhoneForm;

// =========================================================
// CHỨC NĂNG: WIDGETS CHO TRANG CHỦ
// =========================================================

// Load thống kê cho sidebar
async function loadHomeStats() {
    try {
        // Load tổng số bài viết
        const postsResponse = await fetch(apiUrl('db.php/get_posts.php?status=approved&limit=1000'));
        const postsResult = await postsResponse.json();
        
        if (postsResult.success) {
            const totalPostsElement = document.getElementById('total-posts');
            const todayPostsElement = document.getElementById('today-posts');
            
            if (totalPostsElement) {
                totalPostsElement.textContent = postsResult.posts.length;
            }
            
            // Đếm bài viết hôm nay
            const today = new Date().toDateString();
            const todayPosts = postsResult.posts.filter(post => {
                const postDate = new Date(post.created_at).toDateString();
                return postDate === today;
            });
            
            if (todayPostsElement) {
                todayPostsElement.textContent = todayPosts.length;
            }
        }
        
        // Giả lập số thành viên (có thể tạo API riêng sau)
        const totalUsersElement = document.getElementById('total-users');
        if (totalUsersElement) {
            totalUsersElement.textContent = '150+';
        }
        
    } catch (error) {
        console.error('Lỗi load thống kê:', error);
    }
}

// Load bài viết mới nhất cho sidebar
async function loadLatestPosts() {
    try {
        const response = await fetch(apiUrl('db.php/get_posts.php?status=approved&limit=5'));
        const result = await response.json();
        
        const latestPostsElement = document.getElementById('latest-posts');
        if (!latestPostsElement) return;
        
        if (result.success && result.posts.length > 0) {
            const latestHtml = result.posts.map(post => {
                const postDate = new Date(post.created_at).toLocaleDateString('vi-VN');
                const shortTitle = post.title.length > 40 ? post.title.substring(0, 40) + '...' : post.title;
                
                return `
                    <div class="border-b border-gray-100 pb-2 mb-2 last:border-b-0">
                        <a href="chitiet.html?id=${post.id}" class="block hover:text-teal-600 transition">
                            <div class="text-sm font-medium text-gray-800 leading-tight">${shortTitle}</div>
                            <div class="text-xs text-gray-500 mt-1">${postDate}</div>
                        </a>
                    </div>
                `;
            }).join('');
            
            latestPostsElement.innerHTML = latestHtml;
        } else {
            latestPostsElement.innerHTML = '<div class="text-sm text-gray-500">Chưa có bài viết</div>';
        }
    } catch (error) {
        console.error('Lỗi load bài mới:', error);
        const latestPostsElement = document.getElementById('latest-posts');
        if (latestPostsElement) {
            latestPostsElement.innerHTML = '<div class="text-sm text-red-500">Lỗi tải dữ liệu</div>';
        }
    }
}

// Load bài viết phổ biến (giả lập - có thể cải thiện với view count thực tế)
async function loadPopularPosts() {
    try {
        const response = await fetch(apiUrl('db.php/get_posts.php?status=approved&limit=5'));
        const result = await response.json();
        
        if (result.success && result.posts.length > 0) {
            // Giả lập popularity bằng cách sắp xếp ngẫu nhiên
            const shuffled = result.posts.sort(() => 0.5 - Math.random()).slice(0, 4);
            
            const popularHtml = shuffled.map((post, index) => {
                const shortTitle = post.title.length > 35 ? post.title.substring(0, 35) + '...' : post.title;
                const views = Math.floor(Math.random() * 500) + 100; // Giả lập view count
                
                return `
                    <div class="border-b border-gray-100 pb-2 mb-2 last:border-b-0">
                        <a href="chitiet.html?id=${post.id}" class="block hover:text-teal-600 transition">
                            <div class="flex items-start space-x-2">
                                <span class="text-xs font-bold text-orange-500 mt-1">#${index + 1}</span>
                                <div class="flex-1">
                                    <div class="text-sm font-medium text-gray-800 leading-tight">${shortTitle}</div>
                                    <div class="text-xs text-gray-500 mt-1">👁️ ${views} lượt xem</div>
                                </div>
                            </div>
                        </a>
                    </div>
                `;
            }).join('');
            
            document.getElementById('popular-posts').innerHTML = popularHtml;
        }
    } catch (error) {
        console.error('Lỗi load bài phổ biến:', error);
        document.getElementById('popular-posts').innerHTML = '<div class="text-sm text-red-500">Lỗi tải dữ liệu</div>';
    }
}

// Khởi tạo widgets khi load trang chủ
document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    
    if (currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
        loadHomeStats();
        loadLatestPosts();
    }
});

// =========================================================
// PHÂN TRANG CHO PROFILE
// =========================================================

let profileCurrentPage = 1;

// Cập nhật renderMyPosts để hỗ trợ phân trang
async function renderMyPostsPaginated(page = 1) {
    const container = document.getElementById('my-posts-list');
    if (!container) return;

    container.innerHTML = '<p class="text-center text-gray-500 py-6">Đang tải...</p>';

    try {
        const params = new URLSearchParams({
            author: 'me',
            status: 'all',
            page: page,
            limit: 5
        });
        
        const url = window.apiUrl ? apiUrl(`db.php/get_posts.php?${params}`) : `/Project/db.php/get_posts.php?${params}`;
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success && result.posts.length > 0) {
            const postsHtml = result.posts.map(post => {
                const statusClass = post.status === 'approved' ? 'text-green-600' : (post.status === 'pending' ? 'text-yellow-600' : 'text-red-600');
                const statusText = post.status === 'approved' ? '✅ Đã Duyệt' : (post.status === 'pending' ? '⏳ Chờ Duyệt' : '❌ Bị Từ Chối');
                
                const deleteButton = (post.status !== 'approved') ?
                    `<button data-action="delete" data-post-id="${post.id}" class="text-sm text-red-500 hover:text-red-700 transition font-medium ml-3">🗑️ Xóa</button>` : '';

                return `
                    <div class="bg-white p-4 rounded-lg shadow flex justify-between items-center hover:shadow-md transition" data-post-id="${post.id}">
                        <div>
                            <a href="chitiet.html?id=${post.id}" class="text-lg font-semibold text-gray-800 hover:text-teal-600">${post.title}</a>
                            <p class="text-sm text-gray-500 mt-1">Đăng ngày: ${new Date(post.created_at).toLocaleDateString('vi-VN')} | <span class="${statusClass} font-medium">${statusText}</span></p>
                        </div>
                        ${deleteButton}
                    </div>
                `;
            }).join('');

            container.innerHTML = postsHtml;
            
            // Tạo phân trang
            if (result.pagination && result.pagination.totalPages > 1) {
                createProfilePagination(result.pagination.totalPages, result.pagination.currentPage);
            } else {
                document.getElementById('profile-pagination').innerHTML = '';
            }
            
        } else {
            container.innerHTML = `<p class="text-center text-gray-500 py-6">Bạn chưa có bài viết nào. Hãy <a href="dangtin.html" class="text-teal-600 hover:underline">Đăng Tin</a> để chia sẻ kinh nghiệm!</p>`;
            document.getElementById('profile-pagination').innerHTML = '';
        }
        
    } catch (error) {
        console.error('Lỗi load bài viết profile:', error);
        container.innerHTML = '<p class="text-center text-red-500 py-6">Lỗi tải dữ liệu</p>';
    }
}

// Tạo phân trang cho profile
function createProfilePagination(totalPages, currentPage = profileCurrentPage) {
    const container = document.getElementById('profile-pagination');
    if (!container || totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    profileCurrentPage = currentPage;
    
    let paginationHtml = '<div class="flex items-center justify-center space-x-2">';
    
    if (profileCurrentPage > 1) {
        paginationHtml += `<button onclick="changeProfilePage(${profileCurrentPage - 1})" class="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition">‹ Trước</button>`;
    }
    
    for (let i = Math.max(1, profileCurrentPage - 2); i <= Math.min(totalPages, profileCurrentPage + 2); i++) {
        const activeClass = i === profileCurrentPage ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100';
        paginationHtml += `<button onclick="changeProfilePage(${i})" class="px-3 py-2 text-sm font-medium ${activeClass} border rounded-lg transition">${i}</button>`;
    }
    
    if (profileCurrentPage < totalPages) {
        paginationHtml += `<button onclick="changeProfilePage(${profileCurrentPage + 1})" class="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition">Tiếp ›</button>`;
    }
    
    paginationHtml += '</div>';
    paginationHtml += `<div class="text-center mt-4 text-sm text-gray-600">Trang ${profileCurrentPage} / ${totalPages}</div>`;
    
    container.innerHTML = paginationHtml;
}

// Chuyển trang profile
function changeProfilePage(page) {
    profileCurrentPage = page;
    renderMyPostsPaginated(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Export functions
window.changeProfilePage = changeProfilePage;

// Cập nhật renderMyPosts gốc để sử dụng phiên bản có phân trang
window.renderMyPosts = function() {
    renderMyPostsPaginated(1);
};