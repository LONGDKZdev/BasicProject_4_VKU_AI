document.addEventListener("DOMContentLoaded", function () {
    let PRESET_TOPICS = [];
    let USER_TOPICS = [];

    const storeListEl = document.getElementById("store-list");
    const storeSearchEl = document.getElementById("store-search");
    const previewModal = new bootstrap.Modal(document.getElementById("previewModal"));
    const previewTitleEl = document.getElementById("preview-title");
    const previewCountEl = document.getElementById("preview-count");
    const previewTbodyEl = document.getElementById("preview-tbody");
    const btnImportFromPreview = document.getElementById("btn-import-from-preview");

    let activePreviewTopic = null;

    function loadUserTopics() {
        fetch("/api/topics")
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                USER_TOPICS = data || [];
            })
            .catch(err => console.error("Lỗi nạp danh sách chủ đề cá nhân:", err));
    }

    function loadSampleTopics() {
        fetch("/api/sample-topics")
            .then(res => res.json())
            .then(data => {
                PRESET_TOPICS = data || [];
                renderStore(PRESET_TOPICS);
            })
            .catch(err => {
                console.error("Lỗi nạp chủ đề mẫu:", err);
                storeListEl.innerHTML = `<div class="col-12 text-center text-muted py-5"><p>Không thể kết nối máy chủ để lấy kho chủ đề mẫu.</p></div>`;
            });
    }

    function renderStore(list) {
        storeListEl.innerHTML = "";
        if (!list || list.length === 0) {
            storeListEl.innerHTML = `<div class="col-12 text-center text-muted py-5"><p>Chưa có chủ đề mẫu nào trong kho lưu trữ.</p></div>`;
            return;
        }

        list.forEach((topic) => {
            let cardCount = topic.count || 0;
            try {
                let clean = (topic.dataJson || "[]").trim();
                if (!clean.startsWith("[")) clean = "[" + clean + "]";
                const parsed = JSON.parse(clean);
                if (Array.isArray(parsed)) cardCount = parsed.length;
            } catch (e) { }

            const col = document.createElement("div");
            col.className = "col";
            col.innerHTML = `
        <div class="store-card" style="border-top: 4px solid ${topic.color || '#60a5fa'};">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="store-tag">${topic.category || 'Mẫu'}</span>
              <span class="text-muted small fw-semibold"><i class="bx bx-collection me-1"></i>${cardCount} từ vựng</span>
            </div>
            <h5 class="fw-bold text-dark mb-2">${topic.name}</h5>
            <p class="text-muted small mb-4" style="line-height: 1.6;">${topic.description || 'Chủ đề từ vựng chuẩn được tuyển chọn.'}</p>
          </div>
          <div class="d-flex gap-2 pt-2 border-top">
            <button class="btn btn-outline-secondary btn-sm rounded-pill flex-fill btn-preview" data-id="${topic.id}">
              <i class="bx bx-show me-1"></i> Xem trước
            </button>
            <button class="btn btn-primary btn-sm rounded-pill flex-fill btn-add-topic" data-id="${topic.id}">
              <i class="bx bx-plus me-1"></i> Thêm bộ này
            </button>
          </div>
        </div>
      `;
            storeListEl.appendChild(col);
        });
    }

    function openPreview(topicId) {
        activePreviewTopic = PRESET_TOPICS.find((t) => String(t.id) === String(topicId));
        if (!activePreviewTopic) return;

        let parsedList = [];
        try {
            let clean = (activePreviewTopic.dataJson || "[]").trim();
            if (!clean.startsWith("[")) clean = "[" + clean + "]";
            parsedList = JSON.parse(clean);
        } catch (e) {
            parsedList = [];
        }

        previewTitleEl.textContent = activePreviewTopic.name;
        previewCountEl.textContent = `${parsedList.length} từ vựng chuẩn`;
        previewTbodyEl.innerHTML = "";

        parsedList.forEach((item) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td class="ps-4 fw-bold text-primary">${item.englishVocabulary || item.english || ''}</td>
        <td><span class="badge bg-light text-dark border">${item.wordPos || '(n)'}</span></td>
        <td class="font-monospace text-muted small">${item.pronunciation || ''}</td>
        <td class="fw-semibold text-dark">${item.vietnameseVocabulary || item.vietnamese || ''}</td>
        <td class="pe-4 small text-secondary fst-italic">${item.example || ''}</td>
      `;
            previewTbodyEl.appendChild(tr);
        });

        previewModal.show();
    }

    async function importTopicToMyAccount(topic) {
        if (!topic) return;

        try {
            const targetName = (topic.name || "").trim().toLowerCase();
            const existingTopic = USER_TOPICS.find(
                (t) => (t.name || "").trim().toLowerCase() === targetName
            );

            if (existingTopic) {
                const res = await fetch("/api/topics/append-json", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        topicId: existingTopic.topicId,
                        json: topic.dataJson || "[]"
                    })
                });

                const msg = await res.text();
                if (res.ok) {
                    loadUserTopics();
                    const toastType = msg.includes("Đã bỏ qua") || msg.includes("đã tồn tại") ? "warning" : "success";
                    if (window.showToast) {
                        window.showToast(
                            `[Chủ đề đã có sẵn] ${msg} <a href="/" class="text-white text-decoration-underline ms-2 fw-bold">Về trang chủ</a>`,
                            toastType
                        );
                    }
                } else {
                    if (window.showToast) window.showToast(msg || "Không thể cập nhật từ vựng!", "danger");
                }
            } else {
                let cardCount = topic.count || 0;
                try {
                    let clean = (topic.dataJson || "[]").trim();
                    if (!clean.startsWith("[")) clean = "[" + clean + "]";
                    const arr = JSON.parse(clean);
                    if (Array.isArray(arr)) cardCount = arr.length;
                } catch (e) { }

                const newTopicPayload = {
                    name: topic.name,
                    color: topic.color || "#60a5fa",
                    count: cardCount,
                    dataJson: topic.dataJson || "[]",
                    orderIndex: Date.now()
                };

                const res = await fetch("/api/topics", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newTopicPayload)
                });

                if (res.ok) {
                    loadUserTopics();
                    if (window.showToast) {
                        window.showToast(
                            `Đã thêm <strong>${topic.name}</strong> vào bộ từ vựng của bạn! <a href="/" class="text-white text-decoration-underline ms-2 fw-bold">Về trang chủ</a>`,
                            "success"
                        );
                    }
                } else {
                    if (window.showToast) window.showToast("Không thể sao chép chủ đề!", "danger");
                }
            }
        } catch (err) {
            console.error(err);
            if (window.showToast) window.showToast("Lỗi kết nối máy chủ!", "danger");
        }
    }

    storeListEl.addEventListener("click", function (e) {
        const btnPreview = e.target.closest(".btn-preview");
        const btnAdd = e.target.closest(".btn-add-topic");

        if (btnPreview) {
            const id = btnPreview.getAttribute("data-id");
            openPreview(id);
        } else if (btnAdd) {
            const id = btnAdd.getAttribute("data-id");
            const targetTopic = PRESET_TOPICS.find((t) => String(t.id) === String(id));
            importTopicToMyAccount(targetTopic);
        }
    });

    if (btnImportFromPreview) {
        btnImportFromPreview.addEventListener("click", function () {
            if (activePreviewTopic) {
                importTopicToMyAccount(activePreviewTopic);
                previewModal.hide();
            }
        });
    }

    if (storeSearchEl) {
        storeSearchEl.addEventListener("input", function (e) {
            const keyword = e.target.value.toLowerCase().trim();
            const filtered = PRESET_TOPICS.filter(
                (t) => (t.name || "").toLowerCase().includes(keyword) || (t.category || "").toLowerCase().includes(keyword)
            );
            renderStore(filtered);
        });
    }

    loadUserTopics();
    loadSampleTopics();
});