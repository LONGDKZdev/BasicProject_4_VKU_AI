let lastToastMessage = "";
let lastToastTime = 0;

function getOrCreateToastContainer() {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;";
    document.body.appendChild(container);
  }
  return container;
}

window.showToast = function (message, type = "success") {
  const now = Date.now();

  if (message === lastToastMessage && now - lastToastTime < 1500) {
    return;
  }
  
  lastToastMessage = message;
  lastToastTime = now;

  const container = getOrCreateToastContainer();

  const toast = document.createElement("div");
  // Sử dụng class riêng biệt custom-toast để tránh đụng độ với Bootstrap Toast
  toast.className = `custom-toast custom-toast-${type}`;
  toast.style.cssText = `
    pointer-events: auto;
    min-width: 280px;
    padding: 12px 20px;
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background-color: ${type === 'danger' || type === 'error' ? '#ef4444' : (type === 'warning' ? '#f59e0b' : '#10b981')};
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;

  toast.innerHTML = `
    <span style="flex-grow: 1; margin-right: 12px;">${message}</span>
    <span style="cursor: pointer; font-size: 18px; opacity: 0.8; font-weight: bold;" onclick="this.parentElement.remove()">×</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  }, 10);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50%)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

window.notify = function (msg, type = 'success') {
  window.showToast(msg, type);
};

//  GHI ĐÈ HÀM alert() CỦA TRÌNH DUYỆT BẰNG TOAST
window.alert = function (message) {
  window.showToast(message, "warning");
};