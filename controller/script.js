// =========================================================
// script.js - SCRIPT VẬN HÀNH TOÀN TRANG (FRONTEND HOÀN CHỈNH)
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. KHỞI TẠO CÁC PHẦN TỬ CHUNG
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userMenu = document.getElementById('user-menu');
    
    initializeMobileMenu(mobileMenuToggle, mobileMenu);
    initializeUserMenu(userMenuBtn, userMenu);
    checkLoginStatus(); 
    initializeCarousel(); 

    // 2. XỬ LÝ FORM ĐĂNG KÝ/ĐĂNG NHẬP/ĐĂNG TIN
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
        postForm.addEventListener('submit', handlePostSubmit);
    }

    // 3. HIỂN THỊ BÀI ĐĂNG TRÊN CÁC TRANG
    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        renderPosts('post-list', 6); // Trang Chủ: 6 bài
    }
    if (window.location.pathname.endsWith('tintuc.html')) {
        renderPosts('news-list'); // Trang Tin Tức: Tất cả bài
    }
    
    // --> LOGIC MỚI: Tải nội dung chi tiết bài viết
    if (window.location.pathname.endsWith('chitiet.html')) {
        renderPostDetail();
    }
});


// =========================================================
// CHỨC NĂNG A: HEADER & NAVIGATION
// =========================================================
// ... (các hàm initializeMobileMenu, initializeUserMenu, performSearch, handleLoginSubmit, logout, v.v. không thay đổi) ...

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

function checkLoginStatus() {
    const authButtons = document.getElementById('auth-buttons');
    const userProfileDiv = document.getElementById('user-profile');

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username') || 'Người Dùng';
    const postCount = localStorage.getItem('postCount') || 0;

    if (authButtons && userProfileDiv) {
        if (isLoggedIn) {
            authButtons.classList.add('hidden');
            userProfileDiv.classList.remove('hidden');
            
            userProfileDiv.querySelector('span').textContent = username;
            const profileLink = userProfileDiv.querySelector('a[href="profile.html"]');
            if(profileLink) {
                 profileLink.textContent = `👤 Profile (${postCount} bài)`;
            }
           
        } else {
            authButtons.classList.remove('hidden');
            userProfileDiv.classList.add('hidden');
        }
    }
    if (window.location.pathname.endsWith('profile.html') && isLoggedIn) {
        const profileUsername = document.getElementById('profile-username');
        const profilePostCount = document.getElementById('profile-post-count');
        if (profileUsername && profilePostCount) {
             profileUsername.textContent = username;
             profilePostCount.textContent = postCount;
        }
    }
}

function handleRegisterSubmit(event) {
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
    
    alert('✅ Đăng ký thành công! Chuyển hướng đến trang Đăng nhập.');
    window.location.href = 'dangnhap.html'; 
}

function handleLoginSubmit(event) {
    event.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-password').value;
    
    if (user && pass) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', user.split('@')[0] || 'UserMoi');
        
        let posts = JSON.parse(localStorage.getItem('userPosts')) || [];
        localStorage.setItem('postCount', posts.length); 
        
        alert(`Chào mừng, ${localStorage.getItem('username')}! Đăng nhập thành công.`);
        window.location.href = 'index.html'; 
    } else {
        alert('Vui lòng nhập tên tài khoản/email và mật khẩu.');
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('postCount');
    alert('➡️ Bạn đã đăng xuất.');
    window.location.reload();
}
window.logout = logout; 

function handlePostSubmit(event) {
    event.preventDefault();
    
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        alert('Bạn cần đăng nhập để đăng bài.');
        window.location.href = 'dangnhap.html';
        return;
    }

    const title = document.getElementById('post-title').value.trim();
    const content = document.getElementById('post-content').value.trim(); 
    const category = document.getElementById('post-category').value;
    const username = localStorage.getItem('username') || 'Người Dùng';
    
    if (!title || !content || !category) {
        alert('Vui lòng điền đầy đủ Tiêu đề, Nội dung và Chọn Phân loại chính.');
        return;
    }

    const newPost = {
        id: Date.now(), 
        title: title,
        content: content, // LƯU NỘI DUNG ĐẦY ĐỦ
        summary: content.substring(0, 100) + '...', 
        author: username,
        date: new Date().toLocaleDateString('vi-VN'),
        category: category,
        image: 'default-post-image.jpg' 
    };

    let posts = JSON.parse(localStorage.getItem('userPosts')) || [];
    posts.unshift(newPost); 
    localStorage.setItem('userPosts', JSON.stringify(posts));

    localStorage.setItem('postCount', posts.length);
    
    alert(`🎉 Bài viết "${title}" đã được đăng thành công!`);
    
    window.location.href = 'tintuc.html'; 
}

function deletePost(postId) {
    const currentUser = localStorage.getItem('username');
    let posts = JSON.parse(localStorage.getItem('userPosts')) || [];

    const postIdToDelete = Number(postId);
    const postToDelete = posts.find(post => post.id === postIdToDelete);
    
    if (!postToDelete) {
        alert('Lỗi: Bài viết không tồn tại.');
        return;
    }
    
    if (postToDelete.author !== currentUser) {
        alert('Bạn chỉ có quyền xóa bài viết của chính mình.');
        return; 
    }
    
    if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${postToDelete.title}" không?`)) {
        return; 
    }

    const updatedPosts = posts.filter(post => post.id !== postIdToDelete);

    localStorage.setItem('userPosts', JSON.stringify(updatedPosts));
    localStorage.setItem('postCount', updatedPosts.length);

    alert('Bài viết của bạn đã được xóa thành công!');
    window.location.reload(); 
}
window.deletePost = deletePost;

// =========================================================
// CHỨC NĂNG MỚI: HIỂN THỊ CHI TIẾT BÀI VIẾT (renderPostDetail)
// =========================================================

function renderPostDetail() {
    const container = document.getElementById('post-detail-container');
    const urlParams = new URLSearchParams(window.location.search);
    const postId = Number(urlParams.get('id'));

    if (!postId) {
        if(container) container.innerHTML = '<h1 class="text-3xl font-bold text-red-500 text-center">Lỗi: Không tìm thấy ID bài viết!</h1>';
        return;
    }

    // Lấy danh sách bài viết từ LocalStorage
    const posts = JSON.parse(localStorage.getItem('userPosts')) || [];
    
    // Tìm bài viết khớp với ID
    const post = posts.find(p => p.id === postId);

    if (container) {
        if (post) {
            // Tải tiêu đề trang
            document.getElementById('page-title').textContent = post.title + ' | TV FishFarm';
            
            // Xây dựng nội dung HTML chi tiết
            const contentHtml = `
                <span class="text-sm font-semibold text-teal-600 bg-teal-100 px-3 py-1 rounded">${post.category}</span>
                <h1 class="text-4xl font-extrabold text-gray-900 mt-3 mb-4">${post.title}</h1>
                
                <div class="flex items-center text-sm text-gray-500 mb-6 border-b pb-4">
                    <span class="mr-4">👤 Tác giả: <span class="font-medium text-teal-600">${post.author}</span></span>
                    <span>🗓️ Ngày đăng: ${post.date}</span>
                </div>

                <img src="${post.image}" alt="${post.title}" class="w-full h-80 object-cover rounded-lg mb-8 shadow-lg">

                <div class="prose max-w-none text-gray-700 leading-relaxed">
                    <p>${post.content.replace(/\n/g, '</p><p>')}</p>
                </div>

                <div class="mt-10 pt-6 border-t">
                    <a href="tintuc.html" class="inline-flex items-center text-teal-600 hover:text-teal-800 font-medium">
                        ← Quay lại trang Tin Tức
                    </a>
                </div>
            `;
            container.innerHTML = contentHtml;
            
        } else {
            container.innerHTML = '<h1 class="text-3xl font-bold text-red-500 text-center">Bài viết không tồn tại.</h1>';
        }
    }
}


// ... (các hàm createPostCard, renderPosts, initializeCarousel không thay đổi) ...

function createPostCard(post) {
    const currentUser = localStorage.getItem('username');
    const isAuthor = currentUser === post.author;
    
    const deleteButtonHtml = isAuthor ? 
        `<button onclick="deletePost(${post.id})" class="text-xs text-red-500 hover:text-red-700 transition font-medium ml-3">🗑️ Xóa</button>` : 
        '';

    return `
        <article class="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 overflow-hidden">
            <img src="${post.image}" alt="${post.title}" class="w-full h-48 object-cover">
            <div class="p-5">
                <span class="text-xs font-semibold text-teal-600 bg-teal-100 px-2 py-0.5 rounded">${post.category}</span>
                <h3 class="text-xl font-semibold text-gray-800 my-2 hover:text-teal-600">
                    <a href="chitiet.html?id=${post.id}">${post.title}</a>
                </h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">${post.summary}</p>
                <div class="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                    <span class="flex items-center">
                        Ngày đăng: ${post.date}
                        ${deleteButtonHtml} 
                    </span>
                    <span class="font-medium text-teal-600">👤 Tác giả: ${post.author}</span>
                </div>
            </div>
        </article>
    `;
}

function renderPosts(targetElementId, limit = Infinity) {
    const container = document.getElementById(targetElementId);
    if (!container) return;

    let posts = JSON.parse(localStorage.getItem('userPosts')) || [];
    
    if (limit !== Infinity) {
        posts = posts.slice(0, limit);
    }
    
    let postsHtml = posts.map(createPostCard).join('');

    container.innerHTML = postsHtml; 

    if (posts.length === 0) {
         container.innerHTML = `<p class="text-center text-gray-500 py-10">Chưa có bài đăng nào từ cộng đồng. Hãy là người đầu tiên đăng bài!</p>`;
    }
}

function initializeCarousel() {
    const carousel = document.getElementById('hero-carousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.carousel-slide');
    if (slides.length === 0) return;

    let currentIndex = 0;

    function updateCarousel() {
        slides.forEach(slide => {
            slide.classList.remove('opacity-100');
            slide.classList.add('opacity-0');
            slide.style.zIndex = 1; 
        });

        slides[currentIndex].classList.remove('opacity-0');
        slides[currentIndex].classList.add('opacity-100');
        slides[currentIndex].style.zIndex = 10; 

        currentIndex = (currentIndex + 1) % slides.length;
    }

    updateCarousel(); 
    setInterval(updateCarousel, 5000);
}