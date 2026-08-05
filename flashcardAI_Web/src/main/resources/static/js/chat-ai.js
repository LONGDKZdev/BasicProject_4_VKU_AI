document.addEventListener('DOMContentLoaded', function () {
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const modelSelect = document.getElementById('modelSelect');
    const historyList = document.getElementById('historyList');

    // --- 1. Nhận Prompt tự động từ Flashcard bên ngoài ---
    const urlParams = new URLSearchParams(window.location.search);
    const promptParam = urlParams.get('prompt');
    if (promptParam) {
        chatInput.value = decodeURIComponent(promptParam);
        chatInput.focus();
    }

    // --- 2. Xử lý hiển thị màn hình chào mừng vs khung chat ---
    function startChatMode() {
        welcomeScreen.classList.add('d-none');
        chatMessages.classList.remove('d-none');
    }

    // --- 3. Xử lý Menu 3 chấm (Đổi tên / Xóa lịch sử) ---
    historyList.addEventListener('click', function(e) {
        if (e.target.classList.contains('action-toggle')) {
            // Đóng tất cả menu khác trước
            document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show'));
            const menu = e.target.nextElementSibling;
            menu.classList.toggle('show');
            e.stopPropagation();
        } else if (e.target.classList.contains('delete-btn')) {
            e.target.closest('.history-item-wrapper').remove();
        } else if (e.target.classList.contains('rename-btn')) {
            const item = e.target.closest('.history-item-wrapper').querySelector('.history-item');
            const newName = prompt("Nhập tên mới cho cuộc trò chuyện:", item.innerText);
            if (newName) item.innerText = newName;
        }
    });

    // Click ra ngoài thì ẩn menu 3 chấm
    window.addEventListener('click', () => {
        document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show'));
    });

    // --- 4. Gửi tin nhắn với delay 3s giả lập ML ---
    async function handleSendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        startChatMode();

        chatMessages.innerHTML += `<div class="message user">${text}</div>`;
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const loadingId = 'loading-' + Date.now();
        chatMessages.innerHTML += `<div class="message ai" id="${loadingId}">Đang xử lý thuật toán học máy... ⏳</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(async () => {
            try {
                const res = await fetch('/api/ai/chat/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, modelType: modelSelect.value })
                });
                const data = await res.json();
                
                const loadingElement = document.getElementById(loadingId);
                if (loadingElement) {
                    loadingElement.innerHTML = `<strong>[${modelSelect.value.toUpperCase()}]</strong><br>${data.reply}`;
                }
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } catch (err) {
                document.getElementById(loadingId).innerHTML = `Lỗi hệ thống kết nối AI!`;
            }
        }, 3000); // Delay 3 giây
    }

    sendBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
});