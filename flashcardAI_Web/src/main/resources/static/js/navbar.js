document.addEventListener('DOMContentLoaded', function () {
    // --- 1. Xử lý Dropdown Tài khoản ---
    const toggleBtn = document.getElementById('accountDropdownBtn');
    const dropdownMenu = document.getElementById('accountDropdownMenu');

    if (toggleBtn && dropdownMenu) {
        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        window.addEventListener('click', function () {
            if (dropdownMenu.classList.contains('show')) {
                dropdownMenu.classList.remove('show');
            }
        });
    }

    // --- 2. Xử lý Tự động nhận diện & Lưu trạng thái Tab Active ---
    const navItems = document.querySelectorAll('.nav-item');
    const currentPath = window.location.pathname;

    navItems.forEach(item => {
        const itemHref = item.getAttribute('href');

        // Kiểm tra nếu đường dẫn hiện tại chứa href của tab (hoặc trùng khớp tuyệt đối)
        let isActive = false;
        if (itemHref === '/' && currentPath === '/') {
            isActive = true;
        } else if (itemHref !== '/' && currentPath.includes(itemHref)) {
            isActive = true;
        }

        if (isActive) {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            localStorage.setItem('activeNavTab', itemHref);
        }

        // Click vào tab nào thì lưu lại tab đó
        item.addEventListener('click', function () {
            localStorage.setItem('activeNavTab', itemHref);
        });
    });

    // Khôi phục lại trạng thái đã lưu từ localStorage nếu có
    const savedTab = localStorage.getItem('activeNavTab');
    if (savedTab) {
        navItems.forEach(item => {
            if (item.getAttribute('href') === savedTab) {
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            }
        });
    }
});