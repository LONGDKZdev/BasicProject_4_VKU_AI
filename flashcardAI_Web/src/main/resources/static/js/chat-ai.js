document.addEventListener('DOMContentLoaded', function () {
    const sendBtn = document.getElementById('sendBtn');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const welcomeTitle = welcomeScreen ? welcomeScreen.querySelector('h2') : null;
    const modelSelect = document.getElementById('modelSelect');
    const historyList = document.getElementById('historyList');
    const newChatBtn = document.querySelector('.new-chat-btn');

    const urlParams = new URLSearchParams(window.location.search);
    const promptParam = urlParams.get('prompt');
    const topicParam = urlParams.get('topic');
    const topicIdParam = urlParams.get('topicId');
    const modeParam = urlParams.get('mode');

    let currentChatId = null;
    let currentTopicId = topicIdParam || null;

    // Hàm tự động co giãn độ cao cho textarea (tối đa 5 dòng ~ 120px)
    function autoResizeTextarea() {
        if (!chatInput) return;
        chatInput.style.height = 'auto';
        const maxHeight = 120;
        if (chatInput.scrollHeight > maxHeight) {
            chatInput.style.height = maxHeight + 'px';
            chatInput.style.overflowY = 'auto';
        } else {
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
            chatInput.style.overflowY = 'hidden';
        }
    }

    // Nếu có tham số prompt trên URL (chuyển từ Flashcard qua)
    if (promptParam && chatInput) {
        chatInput.value = decodeURIComponent(promptParam);
        chatInput.focus();
        setTimeout(autoResizeTextarea, 50);
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', function () {
            createNewChatSession("Đoạn chat mới", null, "GENERAL");
        });
    }

    // Xử lý khi điều hướng từ trang Flashcard sang
    if (topicParam) {
        const decodedTopic = decodeURIComponent(topicParam);
        if (modeParam === 'new') {
            createNewChatSession(decodedTopic, topicIdParam, "TOPIC");
        } else if (modeParam === 'continue') {
            fetch('/api/ai/chat/histories')
                .then(res => res.json())
                .then(histories => {
                    const matched = histories.filter(h => h.topicId === topicIdParam);
                    if (matched.length > 0) {
                        matched.sort((a, b) => b.updatedAt - a.updatedAt);
                        const targetChat = matched[0];
                        currentChatId = targetChat.chatId;
                        currentTopicId = targetChat.topicId;
                        updateWelcomeTitle(targetChat.title);
                        renderMessages(targetChat.messagesJson);
                        loadChatHistories();
                    } else {
                        createNewChatSession(decodedTopic, topicIdParam, "TOPIC");
                    }
                })
                .catch(() => {
                    createNewChatSession(decodedTopic, topicIdParam, "TOPIC");
                });
        }
    } else {
        loadChatHistories();
    }

    if (chatInput) {
        chatInput.addEventListener('input', autoResizeTextarea);
    }

    function updateWelcomeTitle(titleText) {
        if (welcomeTitle) {
            welcomeTitle.innerHTML = titleText ? `Đoạn chat: ${escapeHtml(titleText)}` : `Chào bạn, tôi có thể giúp gì cho bạn?`;
        }
    }

    function renderMessages(messagesJson) {
        chatMessages.innerHTML = "";
        let hasMessages = false;
        if (messagesJson) {
            try {
                let rawJson = messagesJson.trim();
                if (!rawJson.startsWith("[")) rawJson = "[" + rawJson + "]";

                const messages = JSON.parse(rawJson);
                if (messages && messages.length > 0) {
                    hasMessages = true;
                    messages.forEach(msg => {
                        const cssClass = msg.sender === 'user' ? 'user' : 'ai';
                        let cleanContent = (msg.content || "").trim();

                        if (msg.sender === 'ai') {
                            const isPersonal = msg.modelType === 'ai-personal';
                            const badgeHtml = isPersonal
                                ? `<div class="ai-model-badge personal">🧠 AI Personal</div>`
                                : `<div class="ai-model-badge gemini">✨ API AI</div>`;

                            let toolbarHtml = "";
                            if (cleanContent.includes("englishVocabulary") || cleanContent.includes("{")) {
                                toolbarHtml = `<div class="ai-action-toolbar"><button class="ai-action-btn copy-json-btn" title="Sao chép JSON"><i class="bx bx-copy"></i></button><button class="ai-action-btn add-flashcard-btn" title="Thêm trực tiếp vào Flashcard"><i class="bx bx-plus-circle"></i></button></div>`;
                            }

                            // Dòng ghép HTML liền mạch để không sinh khoảng trắng thừa
                            contentHtml = `${toolbarHtml}${badgeHtml}<div class="message-text">${escapeHtml(cleanContent)}</div>`;
                        } else {
                            contentHtml = escapeHtml(cleanContent);
                        }

                        chatMessages.innerHTML += `<div class="message ${cssClass} position-relative" data-raw="${escapeHtml(cleanContent)}">${contentHtml}</div>`;
                    });
                }
            } catch (err) { console.error(err); }
        }

        if (hasMessages) {
            if (welcomeScreen) welcomeScreen.classList.add('d-none');
            chatMessages.classList.remove('d-none');
        } else {
            chatMessages.classList.add('d-none');
            if (welcomeScreen) welcomeScreen.classList.remove('d-none');
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // LẮNG NGHE SỰ KIỆN CLICK NÚT TRONG KHUNG TIN NHẮN
    if (chatMessages) {
        chatMessages.addEventListener('click', async function (e) {
            // 1. Nút Sao chép JSON
            if (e.target.closest('.copy-json-btn')) {
                const msgEl = e.target.closest('.message');
                const rawText = msgEl.getAttribute('data-raw');
                if (rawText) {
                    navigator.clipboard.writeText(rawText);
                    if (window.showToast) window.showToast("Đã sao chép JSON vào bộ nhớ đệm!", "success");
                }
            }
            // 2. Nút Thêm trực tiếp vào Flashcard (Tự unescape và gắn đúng editTopicId)
            else if (e.target.closest('.add-flashcard-btn')) {
                const addBtn = e.target.closest('.add-flashcard-btn');
                const msgEl = e.target.closest('.message');
                
                // Lấy nội dung text thuần bên trong .message-text để không bị dính HTML entities (&quot;)
                const textEl = msgEl.querySelector('.message-text');
                let rawText = textEl ? textEl.innerText.trim() : (msgEl.getAttribute('data-raw') || "");

                // Dọn dẹp sơ bộ để đảm bảo trả về dấu ngoặc kép JSON chuẩn
                rawText = rawText.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

                const activeTopicId = currentTopicId || urlParams.get('topicId');

                if (!activeTopicId || activeTopicId === 'null') {
                    if (window.showToast) window.showToast("Đoạn chat này là Chat thường (không gắn với Flashcard)!", "warning");
                    return;
                }

                // KHÓA CHỐNG SPAM
                addBtn.disabled = true;
                addBtn.style.pointerEvents = 'none';
                const originalIcon = addBtn.innerHTML;
                addBtn.innerHTML = `<i class="bx bx-loader-alt bx-spin"></i>`;

                try {
                    const res = await fetch('/api/topics/append-json', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ topicId: activeTopicId, json: rawText })
                    });

                    const messageText = await res.text();

                    if (res.ok) {
                        if (window.showToast) {
                            const isWarning = messageText.includes("Đã bỏ qua") || messageText.includes("đã tồn tại");
                            const toastType = isWarning ? "warning" : "success";
                            
                            // GẮN THAM SỐ editTopicId ĐỂ KHI CLICK SẼ MỞ THẲNG MODAL CHỈNH SỬA
                            window.showToast(
                                `${messageText} <a href='/?editTopicId=${encodeURIComponent(activeTopicId)}' class='text-white text-decoration-underline fw-bold ms-2'>Mở chỉnh sửa <i class='bx bx-right-arrow-alt'></i></a>`, 
                                toastType
                            );
                        }
                    } else {
                        if (window.showToast) window.showToast("Lỗi khi thêm từ vựng vào Flashcard!", "danger");
                    }
                } catch (err) {
                    console.error("Lỗi:", err);
                    if (window.showToast) window.showToast("Lỗi hệ thống kết nối!", "danger");
                } finally {
                    setTimeout(() => {
                        addBtn.disabled = false;
                        addBtn.style.pointerEvents = 'auto';
                        addBtn.innerHTML = originalIcon;
                    }, 1200);
                }
            }
        });
    }

    async function createNewChatSession(title, topicId, chatType) {
        try {
            const res = await fetch('/api/ai/chat/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    topicId: topicId,
                    chatType: chatType || "GENERAL"
                })
            });
            if (res.ok) {
                const newSession = await res.json();
                currentChatId = newSession.chatId;
                currentTopicId = newSession.topicId;

                chatMessages.innerHTML = "";
                chatMessages.classList.add('d-none');
                if (welcomeScreen) welcomeScreen.classList.remove('d-none');
                updateWelcomeTitle(newSession.title);

                loadChatHistories();
            }
        } catch (err) {
            console.error("Lỗi tạo phiên chat:", err);
        }
    }

    // Xử lý sự kiện click trên Sidebar (Async)
    historyList.addEventListener('click', async function (e) {
        const itemEl = e.target.closest('.history-item');

        if (e.target.classList.contains('action-toggle')) {
            document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show'));
            const menu = e.target.nextElementSibling;
            if (menu) menu.classList.toggle('show');
            e.stopPropagation();
        }
        else if (e.target.closest('.rename-btn')) {
            const wrapper = e.target.closest('.history-item-wrapper');
            const item = wrapper.querySelector('.history-item');
            const chatId = item.getAttribute('data-id');
            const oldTitle = item.textContent.trim();

            const renameModalEl = document.getElementById("renameChatModal");
            const renameInput = document.getElementById("renameChatInput");
            const btnSaveRename = document.getElementById("btnConfirmRenameChat");
            const modalInstance = bootstrap.Modal.getInstance(renameModalEl) || new bootstrap.Modal(renameModalEl);

            renameInput.value = oldTitle;

            const newBtnSave = btnSaveRename.cloneNode(true);
            btnSaveRename.parentNode.replaceChild(newBtnSave, btnSaveRename);

            newBtnSave.addEventListener("click", async () => {
                const newTitle = renameInput.value.trim();
                if (newTitle && newTitle !== oldTitle) {
                    modalInstance.hide();
                    await fetch('/api/ai/chat/rename', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chatId: chatId, title: newTitle })
                    });
                    if (window.showToast) window.showToast("Đã đổi tên thành công!", "success");
                    loadChatHistories();
                } else {
                    modalInstance.hide();
                }
            });

            modalInstance.show();
            setTimeout(() => renameInput.focus(), 300);
            e.stopPropagation();
        }
        else if (e.target.closest('.delete-btn')) {
            const wrapper = e.target.closest('.history-item-wrapper');
            const item = wrapper.querySelector('.history-item');
            const chatId = item.getAttribute('data-id');

            // Mở Modal xác nhận Bootstrap thay cho confirm()
            const confirmModalEl = document.getElementById("confirmChatModal");
            const modalInstance = bootstrap.Modal.getInstance(confirmModalEl) || new bootstrap.Modal(confirmModalEl);
            const btnConfirm = document.getElementById("btnConfirmDeleteChat");

            const newBtnConfirm = btnConfirm.cloneNode(true);
            btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);

            newBtnConfirm.addEventListener("click", async () => {
                modalInstance.hide();
                await fetch(`/api/ai/chat/${chatId}`, { method: 'DELETE' });
                if (currentChatId === chatId) {
                    currentChatId = null;
                    chatMessages.innerHTML = "";
                    chatMessages.classList.add('d-none');
                    if (welcomeScreen) welcomeScreen.classList.remove('d-none');
                    updateWelcomeTitle("");
                }
                if (window.showToast) window.showToast("Đã xóa đoạn chat!", "success");
                loadChatHistories();
            });

            modalInstance.show();
            e.stopPropagation();
        }
        else if (e.target.classList.contains('group-icon')) {
            const header = e.target.closest('.group-header');
            const childrenContainer = header.nextElementSibling;
            if (childrenContainer) {
                const isHidden = childrenContainer.style.display === 'none';
                childrenContainer.style.display = isHidden ? 'block' : 'none';
                e.target.classList.toggle('bx-chevron-right', !isHidden);
                e.target.classList.toggle('bx-chevron-down', isHidden);
            }
            e.stopPropagation();
        }
        else if (itemEl && itemEl.getAttribute('data-type') !== 'TOPIC_ORIGIN') {
            currentChatId = itemEl.getAttribute('data-id');
            currentTopicId = itemEl.getAttribute('data-topic-id');

            const messagesJson = itemEl.getAttribute('data-messages');
            const title = itemEl.getAttribute('data-title');

            updateWelcomeTitle(title);
            renderMessages(messagesJson);
            e.stopPropagation();
        }
    });

    window.addEventListener('click', () => {
        document.querySelectorAll('.action-menu').forEach(m => m.classList.remove('show'));
    });

    // Hàm gửi tin nhắn AI
    async function handleSendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        if (!currentChatId) {
            await createNewChatSession("Đoạn chat mới", null, "GENERAL");
        }

        if (welcomeScreen) welcomeScreen.classList.add('d-none');
        chatMessages.classList.remove('d-none');

        chatMessages.innerHTML += `<div class="message user">${escapeHtml(text)}</div>`;
        chatInput.value = '';
        autoResizeTextarea();
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const loadingId = 'loading-' + Date.now();
        chatMessages.innerHTML += `<div class="message ai" id="${loadingId}">Đang xử lý... ⏳</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const res = await fetch('/api/ai/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    modelType: modelSelect.value,
                    chatId: currentChatId
                })
            });
            const data = await res.json();

            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) {
                const replyText = (data.reply || data.message || "Không có phản hồi").trim();

                const isPersonal = modelSelect.value === 'ai-personal';
                const badgeHtml = isPersonal
                    ? `<div class="ai-model-badge personal">🧠 AI Personal</div>`
                    : `<div class="ai-model-badge gemini">✨ API AI</div>`;

                let toolbarHtml = "";
                if (replyText.includes("englishVocabulary") || replyText.includes("{")) {
                    toolbarHtml = `<div class="ai-action-toolbar"><button class="ai-action-btn copy-json-btn" title="Sao chép JSON"><i class="bx bx-copy"></i></button><button class="ai-action-btn add-flashcard-btn" title="Thêm trực tiếp vào Flashcard"><i class="bx bx-plus-circle"></i></button></div>`;
                }

                loadingElement.setAttribute('data-raw', escapeHtml(replyText));
                loadingElement.innerHTML = `${toolbarHtml}${badgeHtml}<div class="message-text">${escapeHtml(replyText)}</div>`;
            }
            chatMessages.scrollTop = chatMessages.scrollHeight;
            loadChatHistories();
        } catch (err) {
            const loadingElement = document.getElementById(loadingId);
            if (loadingElement) loadingElement.innerHTML = `Lỗi hệ thống kết nối AI!`;
        }
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

        const topicGroups = {};
        const generalList = [];

        histories.forEach(item => {
            if (item.chatType === "TOPIC" || item.chatType === "TOPIC_ORIGIN" || item.topicId) {
                const gid = item.groupId || item.chatId;
                if (!topicGroups[gid]) topicGroups[gid] = [];
                topicGroups[gid].push(item);
            } else {
                generalList.push(item);
            }
        });

        // Chat thường (GENERAL)
        if (generalList.length > 0) {
            const genHeader = document.createElement("div");
            genHeader.className = "text-muted small fw-bold px-2 mb-1 mt-2";
            genHeader.innerHTML = "💬 Chat thường";
            historyList.appendChild(genHeader);

            generalList.forEach(item => {
                const itemDiv = document.createElement("div");
                itemDiv.className = "history-item-wrapper mb-1";
                itemDiv.innerHTML = `
                    <i class="bx bx-message ms-2 me-1 text-muted"></i>
                    <div class="history-item" data-id="${item.chatId}" data-type="GENERAL" data-title="${escapeHtml(item.title)}" data-messages="${escapeHtml(item.messagesJson || '[]')}">${escapeHtml(item.title)}</div>
                    <div class="dropdown-action">
                        <i class="bx bx-dots-vertical-rounded action-toggle"></i>
                        <div class="action-menu">
                            <button class="rename-btn"><i class="bx bx-edit"></i> Đổi tên</button>
                            <button class="delete-btn"><i class="bx bx-trash"></i> Xóa</button>
                        </div>
                    </div>
                `;
                historyList.appendChild(itemDiv);
            });
        }

        // Chat theo chủ đề (TOPIC)
        if (Object.keys(topicGroups).length > 0) {
            const topicHeader = document.createElement("div");
            topicHeader.className = "text-muted small fw-bold px-2 mb-1 mt-3";
            topicHeader.innerHTML = "📁 Chat theo chủ đề";
            historyList.appendChild(topicHeader);

            for (const groupId in topicGroups) {
                const groupItems = topicGroups[groupId];

                let rootItem = groupItems.find(i => i.chatType === "TOPIC_ORIGIN" || i.chatId.endsWith("-origin"));
                if (!rootItem) rootItem = groupItems[0];

                const childItems = groupItems.filter(i => i.chatId !== rootItem.chatId);

                const groupDiv = document.createElement("div");
                groupDiv.className = "mb-2";

                const hasChildren = childItems.length > 0;
                const rootHtml = `
                    <div class="history-item-wrapper group-header" style="background-color: #eae2d8; font-weight: bold;">
                        <i class="bx ${hasChildren ? 'bx-chevron-down group-icon' : 'bx-folder'} me-2 ms-1" style="cursor: pointer;"></i>
                        <div class="history-item text-muted" data-id="${rootItem.chatId}" data-type="TOPIC_ORIGIN" style="cursor: default;">${escapeHtml(rootItem.title)}</div>
                        <div class="dropdown-action">
                            <i class="bx bx-dots-vertical-rounded action-toggle"></i>
                            <div class="action-menu">
                                <button class="rename-btn"><i class="bx bx-edit"></i> Đổi tên nhóm</button>
                            </div>
                        </div>
                    </div>
                `;

                let childrenHtml = `<div class="children-container" style="padding-left: 20px; border-left: 1px solid #dcd6ce; margin-left: 12px; margin-top: 4px;">`;
                childItems.forEach(child => {
                    childrenHtml += `
                        <div class="history-item-wrapper mt-1">
                            <div class="history-item" data-id="${child.chatId}" data-type="TOPIC" data-topic-id="${child.topicId || ''}" data-title="${escapeHtml(child.title)}" data-messages="${escapeHtml(child.messagesJson || '[]')}">${escapeHtml(child.title)}</div>
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
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
});