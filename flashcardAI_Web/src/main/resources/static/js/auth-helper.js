/**
 * Helper dùng chung để bật/tắt hiển thị mật khẩu
 */
function togglePasswordVisibility(inputId, iconEl) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === "password") {
        input.type = "text";
        iconEl.classList.remove("bx-hide");
        iconEl.classList.add("bx-show");
    } else {
        input.type = "password";
        iconEl.classList.remove("bx-show");
        iconEl.classList.add("bx-hide");
    }
}