document.addEventListener('DOMContentLoaded', function () {
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const modelSelect = document.getElementById('modelSelect');
    const historyList = document.getElementById('historyList');

    const urlParams = new URLSearchParams(window.location.search);
    const promptParam = urlParams.get('prompt');
    const topicParam = urlParams.get('topic');
    const modeParam = urlParams.get('mode');

    if (promptParam) {
        chatInput.value = decodeURIComponent(promptParam);
        chatInput.focus();
    }

    // Chỉ tự động tạo phiên bản chat khi User chọn "Tạo đoạn chat mới"
    if (topicParam && modeParam === 'new') {
        const decodedTopic = decodeURIComponent(topicParam);
        fetch('/api/ai/chat/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: decodedTopic })
        }).then(() => {
            loadChatHistories();
        }).catch(err => console.error("Lỗi tạo phiên chat tự động:", err));
    } else {
        loadChatHistories();
    }
    if (chatInput) {
    chatInput.addEventListener('input', function () {
        this.style.height = 'auto'; // Reset chiều cao để tính toán lại
        
        // Tính toán chiều cao tương ứng với khoảng 5 dòng (mỗi dòng ~24px, tổng khoảng 120px)
        const maxHeight = 120; 
        if (this.scrollHeight > maxHeight) {
            this.style.height = maxHeight + 'px';
            this.style.overflowY = 'auto'; // Hiện thanh kéo khi vượt quá 5 dòng
        } else {
            this.style.height = (this.scrollHeight) + 'px';
            this.style.overflowY = 'hidden'; // Ẩn thanh kéo khi dưới 5 dòng
        }
    });
}

    function startChatMode() {
        welcomeScreen.classList.add('d-none');
        chatMessages.classList.remove('d-none');
    }

    historyList.addEventListener('click', function(e) {
        // Toggle mở/đóng menu 3 chấm
        if (e.target.classList.contains('action-toggle')) {
            document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show'));
            const menu = e.target.nextElementSibling;
            menu.classList.toggle('show');
            e.stopPropagation();
        } 
        // Logic xổ xuống (Toggle Group)
        else if (e.target.closest('.group-header')) {
            const header = e.target.closest('.group-header');
            const childrenContainer = header.nextElementSibling;
            if (childrenContainer) {
                const isHidden = childrenContainer.style.display === 'none';
                childrenContainer.style.display = isHidden ? 'block' : 'none';
                header.querySelector('.group-icon').classList.toggle('bx-chevron-right', !isHidden);
                header.querySelector('.group-icon').classList.toggle('bx-chevron-down', isHidden);
            }
        }
    });

    window.addEventListener('click', () => {
        document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show'));
    });

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
                    const replyText = data.reply || data.message || "Không có phản hồi từ AI";
                    // Lấy text hiển thị từ thẻ select thay vì value (sẽ hiện [🤖 CHAT BOT])
                    const modelName = modelSelect.options[modelSelect.selectedIndex].text.toUpperCase();
                    loadingElement.innerHTML = `<strong>[${modelName}]</strong><br>${replyText}`;
                }
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } catch (err) {
                document.getElementById(loadingId).innerHTML = `Lỗi hệ thống kết nối AI!`;
            }
        }, 3000);
    }

    sendBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    async function loadChatHistories() {
        try {
            const res = await fetch('/api/ai/chat/histories');
            if (res.ok) {
                const histories = await res.json();
                renderGroupedHistories(histories);
            }
        } catch (err) {
            console.error("Lỗi tải lịch sử chat:", err);
        }
    }

    function renderGroupedHistories(histories) {
        historyList.innerHTML = "";
        if (!histories || histories.length === 0) return;

        // Gom nhóm theo groupId
        const groups = {};
        histories.forEach(item => {
            const gid = item.groupId || item.chatId;
            if (!groups[gid]) groups[gid] = [];
            groups[gid].push(item);
        });

        for (const groupId in groups) {
            // Sắp xếp cũ lên trước để lấy bản gốc (No.x sẽ nằm sau)
            const sortedGroup = groups[groupId].sort((a, b) => a.updatedAt - b.updatedAt);
            const rootItem = sortedGroup[0];
            const childItems = sortedGroup.slice(1);

            const groupDiv = document.createElement("div");
            groupDiv.className = "mb-2";

            // Render Mục Gốc (Root)
            const hasChildren = childItems.length > 0;
            const rootHtml = `
                <div class="history-item-wrapper group-header" style="background-color: #eae2d8; font-weight: bold;">
                    <i class="bx ${hasChildren ? 'bx-chevron-down group-icon' : 'bx-message'} me-2 ms-1"></i>
                    <div class="history-item" data-id="${rootItem.chatId}">${escapeHtml(rootItem.title)}</div>
                    <div class="dropdown-action">
                        <i class="bx bx-dots-vertical-rounded action-toggle"></i>
                        <div class="action-menu">
                            <button class="rename-btn"><i class="bx bx-edit"></i> Đổi tên</button>
                            <button class="delete-btn"><i class="bx bx-trash"></i> Xóa</button>
                        </div>
                    </div>
                </div>
            `;

            // Render Các mục con (No.1, No.2...)
            let childrenHtml = `<div class="children-container" style="padding-left: 20px; border-left: 1px solid #dcd6ce; margin-left: 12px; margin-top: 4px;">`;
            childItems.forEach(child => {
                childrenHtml += `
                    <div class="history-item-wrapper mt-1">
                        <div class="history-item" data-id="${child.chatId}">${escapeHtml(child.title)}</div>
                        <div class="dropdown-action">
                            <i class="bx bx-dots-vertical-rounded action-toggle"></i>
                            <div class="action-menu">
                                <button class="rename-btn"><i class="bx bx-edit"></i> Đổi tên</button>
                                <button class="delete-btn"><i class="bx bx-trash"></i> Xóa</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            childrenHtml += `</div>`;

            groupDiv.innerHTML = rootHtml + (hasChildren ? childrenHtml : "");
            historyList.appendChild(groupDiv);
        }
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
});