document.addEventListener("DOMContentLoaded", function () {
    // Bộ sưu tập linh vật Emoji đa dạng
    const AVATARS = [
        { key: "avatar_0", icon: "👤", label: "Người dùng mới" },
        { key: "avatar_1", icon: "🦊", label: "Cáo đỏ" },
        { key: "avatar_2", icon: "🐱", label: "Mèo con" },
        { key: "avatar_3", icon: "🦉", label: "Cú thông thái" },
        { key: "avatar_4", icon: "🤖", label: "Robot" },
        { key: "avatar_5", icon: "🐼", label: "Gấu trúc" },
        { key: "avatar_6", icon: "🦁", label: "Sư tử" },
        { key: "avatar_7", icon: "🐯", label: "Hổ con" },
        { key: "avatar_8", icon: "🐶", label: "Cún cưng" },
        { key: "avatar_9", icon: "🦄", label: "Kỳ lân" },
        { key: "avatar_10", icon: "🐧", label: "Chim cánh cụt" },
        { key: "avatar_11", icon: "🐸", label: "Ếch xanh" },
        { key: "avatar_12", icon: "💀", label: "đầu lâu" }
    ];

    let selectedAvatarKey = "avatar_0";

    // Elements
    const navLinks = document.querySelectorAll(".settings-nav-link");
    const tabPanels = document.querySelectorAll(".settings-tab-panel");
    const avatarListContainer = document.getElementById("avatar-picker-list");

    const summaryAvatar = document.getElementById("summary-avatar");
    const summaryUsername = document.getElementById("summary-username");
    const summaryEmail = document.getElementById("summary-email");
    const statTopicsCount = document.getElementById("stat-topics-count");
    const statVocabCount = document.getElementById("stat-vocab-count");

    const inputUsername = document.getElementById("setting-username");
    const inputEmail = document.getElementById("setting-email");
    const btnSaveProfile = document.getElementById("btn-save-profile");

    const inputCurrentPass = document.getElementById("current-password");
    const inputNewPass = document.getElementById("new-password");
    const inputConfirmPass = document.getElementById("confirm-new-password");
    const btnChangePassword = document.getElementById("btn-change-password");

    const selectVoiceLang = document.getElementById("pref-voice-lang");
    const selectVoiceRate = document.getElementById("pref-voice-rate");
    const checkAutoSpeak = document.getElementById("pref-auto-speak");
    const btnSavePref = document.getElementById("btn-save-preferences");

    // 1. Chuyển đổi Tab
    navLinks.forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            navLinks.forEach((n) => n.classList.remove("active"));
            this.classList.add("active");

            const targetTab = this.getAttribute("data-tab");
            tabPanels.forEach((panel) => {
                panel.id === `tab-${targetTab}`
                    ? panel.classList.remove("d-none")
                    : panel.classList.add("d-none");
            });
        });
    });

    // 2. Render danh sách Avatar
    function renderAvatarPicker() {
        avatarListContainer.innerHTML = "";
        AVATARS.forEach((av) => {
            const el = document.createElement("div");
            el.className = `avatar-option ${av.key === selectedAvatarKey ? "active" : ""}`;
            el.innerHTML = av.icon;
            el.title = av.label;
            el.addEventListener("click", () => {
                selectedAvatarKey = av.key;
                summaryAvatar.innerHTML = av.icon;
                document.querySelectorAll(".avatar-option").forEach((a) => a.classList.remove("active"));
                el.classList.add("active");
            });
            avatarListContainer.appendChild(el);
        });
    }

    // 3. Tải thông tin tài khoản từ API
    function loadUserProfile() {
        fetch("/api/settings/profile")
            .then((res) => {
                if (!res.ok) throw new Error("Chưa đăng nhập");
                return res.json();
            })
            .then((user) => {
                if (user) {
                    inputUsername.value = user.username || "";
                    inputEmail.value = user.email || "";
                    summaryUsername.textContent = user.username || "Chưa đặt tên";
                    summaryEmail.textContent = user.email || "Chưa cập nhật email";

                    selectedAvatarKey = user.avatarKey || "avatar_0";
                    const foundAv = AVATARS.find((a) => a.key === selectedAvatarKey) || AVATARS[0];
                    summaryAvatar.innerHTML = foundAv.icon;

                    renderAvatarPicker();
                }
            })
            .catch((err) => console.error("Lỗi nạp profile:", err));
    }

    // 4. Đọc dữ liệu thống kê từ Topics
    function loadUserStats() {
        fetch("/api/topics")
            .then((res) => res.json())
            .then((topics) => {
                if (Array.isArray(topics)) {
                    statTopicsCount.textContent = topics.length;
                    let totalVocab = 0;
                    topics.forEach((t) => {
                        try {
                            let clean = (t.dataJson || "[]").trim();
                            if (!clean.startsWith("[")) clean = "[" + clean + "]";
                            const list = JSON.parse(clean);
                            totalVocab += list.length;
                        } catch (e) { }
                    });
                    statVocabCount.textContent = totalVocab;
                }
            })
            .catch((err) => console.error("Lỗi nạp thống kê:", err));
    }

    // 5. Lưu thông tin Profile
    btnSaveProfile.addEventListener("click", function () {
        const email = inputEmail.value.trim();

        fetch("/api/settings/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, avatarKey: selectedAvatarKey }),
        })
            .then((res) => {
                if (res.ok) {
                    summaryEmail.textContent = email || "Chưa cập nhật email";
                    if (window.showToast) window.showToast("Đã lưu thông tin tài khoản thành công!", "success");
                } else {
                    if (window.showToast) window.showToast("Lỗi khi lưu thông tin!", "danger");
                }
            })
            .catch(() => {
                if (window.showToast) window.showToast("Lỗi kết nối máy chủ!", "danger");
            });
    });

    // 6. Đổi mật khẩu
    btnChangePassword.addEventListener("click", function () {
        const currentPassword = inputCurrentPass.value;
        const newPassword = inputNewPass.value;
        const confirmPassword = inputConfirmPass.value;

        if (!currentPassword || !newPassword) {
            if (window.showToast) window.showToast("Vui lòng nhập đầy đủ thông tin mật khẩu!", "warning");
            return;
        }

        if (newPassword !== confirmPassword) {
            if (window.showToast) window.showToast("Mật khẩu xác nhận không khớp!", "danger");
            return;
        }

        if (newPassword.length < 6) {
            if (window.showToast) window.showToast("Mật khẩu mới phải có ít nhất 6 ký tự!", "warning");
            return;
        }

        fetch("/api/settings/change-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword }),
        })
            .then(async (res) => {
                const msg = await res.text();
                if (res.ok) {
                    if (window.showToast) window.showToast(msg, "success");
                    inputCurrentPass.value = "";
                    inputNewPass.value = "";
                    inputConfirmPass.value = "";
                } else {
                    if (window.showToast) window.showToast(msg || "Đổi mật khẩu thất bại!", "danger");
                }
            })
            .catch(() => {
                if (window.showToast) window.showToast("Lỗi kết nối máy chủ!", "danger");
            });
    });

    // Khởi chạy
    renderAvatarPicker();
    loadUserProfile();
    loadUserStats();
    loadPreferences();

    // Xử lý Quên mật khẩu & Gửi mail
    const linkForgotPass = document.getElementById("link-forgot-pass");
    const forgotModalEl = document.getElementById("forgotPassModal");
    const forgotModal = forgotModalEl ? new bootstrap.Modal(forgotModalEl) : null;
    const forgotTargetEmail = document.getElementById("forgot-target-email");
    const btnSendResetEmail = document.getElementById("btn-send-reset-email");

    if (linkForgotPass && forgotModal) {
        linkForgotPass.addEventListener("click", function () {
            const email = inputEmail.value.trim() || summaryEmail.textContent.trim();
            if (!email || email.includes("Chưa")) {
                if (window.showToast) window.showToast("Vui lòng cập nhật email trước khi dùng tính năng này!", "warning");
                return;
            }
            forgotTargetEmail.textContent = email;
            forgotModal.show();
        });
    }

    if (btnSendResetEmail) {
        btnSendResetEmail.addEventListener("click", function () {
            btnSendResetEmail.disabled = true;
            const originalText = btnSendResetEmail.innerHTML;
            btnSendResetEmail.innerHTML = `<i class="bx bx-loader-alt bx-spin me-1"></i> Đang gửi mail...`;

            fetch("/api/settings/forgot-password-mail", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            })
                .then(async (res) => {
                    const msg = await res.text();
                    if (res.ok) {
                        if (forgotModal) forgotModal.hide();
                        if (window.showToast) window.showToast(msg, "success");
                    } else {
                        if (window.showToast) window.showToast(msg || "Gửi email thất bại!", "danger");
                    }
                })
                .catch(() => {
                    if (window.showToast) window.showToast("Lỗi kết nối máy chủ gửi mail!", "danger");
                })
                .finally(() => {
                    btnSendResetEmail.disabled = false;
                    btnSendResetEmail.innerHTML = originalText;
                });
        });
    }
});