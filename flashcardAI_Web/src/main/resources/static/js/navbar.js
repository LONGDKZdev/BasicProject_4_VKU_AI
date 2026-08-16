document.addEventListener('DOMContentLoaded', function () {
    const AVATAR_ICONS = {
        avatar_0: "👤", // Avatar mặc định
        avatar_1: "🦊", avatar_2: "🐱", avatar_3: "🦉", avatar_4: "🤖", avatar_5: "🐼",
        avatar_6: "🦁", avatar_7: "🐯", avatar_8: "🐶", avatar_9: "🦄", avatar_10: "🐧",
        avatar_11 : "🐸", avatar_12 : "💀"
    };

    const navAvatarEl = document.getElementById('nav-avatar-icon');
    if (navAvatarEl) {
        fetch('/api/settings/profile')
            .then(res => res.ok ? res.json() : null)
            .then(user => {
                const key = (user && user.avatarKey) ? user.avatarKey : "avatar_0";
                navAvatarEl.textContent = AVATAR_ICONS[key] || "👤";
            })
            .catch(() => {
                navAvatarEl.textContent = "👤";
            });
    }

    // Các phần xử lý Dropdown và Active tab phía dưới giữ nguyên
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

    const navItems = document.querySelectorAll('.nav-item');
    const currentPath = window.location.pathname;

    navItems.forEach(item => {
        const itemHref = item.getAttribute('href');
        let isActive = (itemHref === '/' && currentPath === '/') || (itemHref !== '/' && currentPath.includes(itemHref));

        if (isActive) {
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            localStorage.setItem('activeNavTab', itemHref);
        }

        item.addEventListener('click', function () {
            localStorage.setItem('activeNavTab', itemHref);
        });
    });

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