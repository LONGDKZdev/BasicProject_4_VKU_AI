(function () {
  const API_BASE_URL = "/api/topics";
  let currentUserId = null;

  const COLORS = [
    "#4ade80", "#60a5fa", "#f472b6", "#facc15", "#f87171",
    "#a78bfa", "#34d399", "#fb923c", "#22d3ee", "#fbbf24"
  ];

  function getColorVariants(baseColor) {
    if (!baseColor || !baseColor.startsWith("#")) {
      baseColor = COLORS[0];
    }
    let r = parseInt(baseColor.slice(1, 3), 16);
    let g = parseInt(baseColor.slice(3, 5), 16);
    let b = parseInt(baseColor.slice(5, 7), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) { r = 74; g = 222; b = 128; }
    const light = `rgb(${Math.min(255, r + 120)}, ${Math.min(255, g + 120)}, ${Math.min(255, b + 120)})`;
    const veryLight = `rgb(${Math.min(255, r + 160)}, ${Math.min(255, g + 160)}, ${Math.min(255, b + 160)})`;
    return { base: baseColor, light, veryLight };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function showConfirmModal(message, onConfirm, onCancel = null) {
    const modalEl = document.getElementById("confirmModal");
    if (!modalEl) return;
    const modalInstance =
      bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    document.getElementById("confirmModalMessage").innerText = message;

    const btnConfirm = document.getElementById("confirmModalBtn");
    const btnCancel = document.querySelector(
      "#confirmModal [data-bs-dismiss='modal']"
    );

    const newBtnConfirm = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);
    newBtnConfirm.addEventListener("click", () => {
      if (onConfirm) onConfirm();
      modalInstance.hide();
    });

    if (onCancel) {
      const newBtnCancel = btnCancel.cloneNode(true);
      btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
      newBtnCancel.addEventListener("click", onCancel);
    }

    modalInstance.show();
  }

  let currentTopicId = null;
  let selectedColor = COLORS[0];
  let topics = [];
  let allVocabularies = [];

  document.addEventListener("DOMContentLoaded", function () {
    const elements = {
      topicInput: document.getElementById("topic-input"),
      countInput: document.getElementById("count-input"),
      btnGeneratePrompt: document.getElementById("btn-generate-prompt"),
      topicsList: document.getElementById("topics-list"),
      topicsEmpty: document.getElementById("topics-empty"),
      topicSearchInput: document.getElementById("topic-search-input"),
      editTopicModal: new bootstrap.Modal(document.getElementById("editTopicModal")),
      editTopicName: document.getElementById("edit-topic-name"),
      editTopicData: document.getElementById("edit-topic-data"),
      colorPickerContainer: document.getElementById("color-picker-container"),
      btnSaveEdit: document.getElementById("btn-save-edit"),
      btnCopyEditPrompt: document.getElementById("btn-copy-edit-prompt"),
      // Dashboard Elements
      dashTopicsCount: document.getElementById("dash-topics-count"),
      dashVocabCount: document.getElementById("dash-vocab-count"),
      resumeCardBox: document.getElementById("resume-card-box"),
      resumeTopicTitle: document.getElementById("resume-topic-title"),
      btnQuickResume: document.getElementById("btn-quick-resume"),
      spotlightEng: document.getElementById("spotlight-eng"),
      spotlightPosIpa: document.getElementById("spotlight-pos-ipa"),
      spotlightVie: document.getElementById("spotlight-vie"),
      spotlightExample: document.getElementById("spotlight-example"),
      btnRefreshSpotlight: document.getElementById("btn-refresh-spotlight")
    };

    renderColorPicker(elements);
    bindEvents(elements);

    fetch(`${API_BASE_URL}/current-user`)
      .then(res => {
        if (!res.ok) throw new Error("Chưa đăng nhập");
        return res.text();
      })
      .then(username => {
        currentUserId = username.trim();
        loadTopicsFromServer();
      })
      .catch(err => {
        console.error("Lỗi xác thực người dùng:", err);
      });

    function renderColorPicker(els) {
      els.colorPickerContainer.innerHTML = "";
      COLORS.forEach((color) => {
        const option = document.createElement("div");
        option.className = "color-option";
        option.style.backgroundColor = color;
        if (color === selectedColor) option.classList.add("active");
        option.addEventListener("click", function () {
          selectedColor = color;
          els.colorPickerContainer.querySelectorAll(".color-option").forEach((n) => n.classList.remove("active"));
          option.classList.add("active");
        });
        els.colorPickerContainer.appendChild(option);
      });
    }

    //HÀM FORMAT TỰ ĐỘNG THAY VÌ CẮT CHUỖI CŨ
    function formatJsonDisplay(rawJson) {
      try {
        let clean = (rawJson || "[]").trim();
        if (!clean.startsWith("[")) clean = "[" + clean + "]";
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let formatted = JSON.stringify(parsed, null, 2).trim();
          if (formatted.startsWith("[")) formatted = formatted.substring(1).trim();
          if (formatted.endsWith("]")) formatted = formatted.substring(0, formatted.length - 1).trim();
          return formatted;
        }
      } catch (e) {}
      return rawJson || "";
    }

    function loadTopicsFromServer() {
      fetch(API_BASE_URL)
        .then(res => res.json())
        .then(data => {
          topics = data || [];
          renderTopics(topics);
          updateDashboard();

          const urlParams = new URLSearchParams(window.location.search);
          const autoEditTopicId = urlParams.get("editTopicId");

          if (autoEditTopicId) {
            const targetTopic = topics.find((t) => t.topicId === autoEditTopicId);
            if (targetTopic) {
              currentTopicId = targetTopic.topicId;
              elements.editTopicName.value = targetTopic.name;

              // DÙNG HÀM FORMAT TỰ ĐỘNG THAY VÌ CẮT CHUỖI CŨ
              elements.editTopicData.value = formatJsonDisplay(targetTopic.dataJson);

              selectedColor = targetTopic.color || COLORS[0];
              renderColorPicker(elements);
              elements.editTopicModal.show();
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        })
        .catch(err => console.error("Lỗi tải chủ đề:", err));
    }

    function updateDashboard() {
      let totalVocab = 0;
      let validTopicsCount = 0;
      allVocabularies = [];

      topics.forEach(t => {
        try {
          let clean = (t.dataJson || "[]").trim();
          if (!clean.startsWith("[")) clean = "[" + clean + "]";
          const list = JSON.parse(clean);
          if (Array.isArray(list) && list.length > 0) {
            validTopicsCount++;
            totalVocab += list.length;
            list.forEach(v => allVocabularies.push(v));
          }
        } catch (e) {}
      });

      if (elements.dashTopicsCount) elements.dashTopicsCount.textContent = topics.length;
      if (elements.dashVocabCount) elements.dashVocabCount.textContent = totalVocab;

      // Cập nhật thanh tiến độ hoạt động
      const readyRatioEl = document.getElementById("dash-ready-ratio");
      const readyProgressEl = document.getElementById("dash-ready-progress-bar");
      const statusTextEl = document.getElementById("dash-status-text");

      if (readyRatioEl && readyProgressEl) {
        const total = topics.length;
        const percent = total > 0 ? Math.round((validTopicsCount / total) * 100) : 0;
        readyRatioEl.textContent = `${validTopicsCount}/${total} Hoạt động`;
        readyProgressEl.style.width = `${percent}%`;

        if (statusTextEl) {
          if (total === 0) {
            statusTextEl.textContent = "Chưa có chủ đề nào. Hãy tạo bộ thẻ đầu tiên!";
          } else if (validTopicsCount === total) {
            statusTextEl.textContent = "Toàn bộ các chủ đề đã hợp lệ và sẵn sàng học!";
          } else {
            statusTextEl.textContent = `Còn ${total - validTopicsCount} chủ đề chưa có dữ liệu từ vựng.`;
          }
        }
      }

      // Thẻ Resume gần nhất & Spotlight giữ nguyên...
      const savedState = JSON.parse(localStorage.getItem("study-space.flashcard-study.v1") || "null");
      if (savedState && savedState.topicId) {
        const lastTopic = topics.find(t => String(t.topicId) === String(savedState.topicId));
        if (lastTopic && elements.resumeCardBox) {
          elements.resumeTopicTitle.textContent = lastTopic.name;
          elements.resumeCardBox.style.display = "block";
          elements.btnQuickResume.onclick = () => {
            window.location.href = `/study-flashcard?id=${lastTopic.topicId}`;
          };
        }
      }

      showRandomSpotlight();
    }

    function showRandomSpotlight() {
      if (allVocabularies.length === 0) return;

      const spotlightContent = document.getElementById("spotlight-content");
      const randWord = allVocabularies[Math.floor(Math.random() * allVocabularies.length)];

      if (!spotlightContent || !randWord) return;

      // 1. Thêm class xoay lật úp xuống (rotateX 90deg)
      spotlightContent.classList.add("flipping");

      // 2. Chờ 250ms khi thẻ đang úp ngang -> Cập nhật text mới
      setTimeout(() => {
        if (elements.spotlightEng) {
          elements.spotlightEng.textContent = randWord.englishVocabulary || randWord.english || "Vocabulary";
          elements.spotlightPosIpa.textContent = `${randWord.wordPos || "(n)"} ${randWord.pronunciation || ""}`;
          elements.spotlightVie.textContent = randWord.vietnameseVocabulary || randWord.vietnamese || "Nghĩa tiếng Việt";
          elements.spotlightExample.textContent = `"${randWord.example || "No example available."}"`;
        }

        // 3. Xoay lật mở lại bình thường
        spotlightContent.classList.remove("flipping");
      }, 250);
    }

    function bindEvents(els) {
      // Tìm kiếm chủ đề theo tên
      if (els.topicSearchInput) {
        els.topicSearchInput.addEventListener("input", function (e) {
          const keyword = e.target.value.toLowerCase().trim();
          const filtered = topics.filter(t => (t.name || "").toLowerCase().includes(keyword));
          renderTopics(filtered);
        });
      }

      // Đổi từ spotlight khác
      if (els.btnRefreshSpotlight) {
        els.btnRefreshSpotlight.addEventListener("click", showRandomSpotlight);
      }

      els.btnGeneratePrompt.addEventListener("click", function () {
        const topicName = els.topicInput.value.trim();
        const count = parseInt(els.countInput.value, 10) || 10;

        if (!topicName) {
          if (window.showToast) showToast("Vui lòng nhập tên chủ đề tiếng Anh!", "warning");
          return;
        }

        const newTopic = {
          name: topicName,
          color: COLORS[0],
          count: count,
          dataJson: "[]",
          orderIndex: topics.length
        };

        fetch(API_BASE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTopic)
        })
          .then(res => {
            if (res.ok) {
              loadTopicsFromServer();
              els.topicInput.value = "";
              const modalEl = document.getElementById('addTopicModal');
              const modal = bootstrap.Modal.getInstance(modalEl);
              if (modal) modal.hide();
              if (window.showToast) showToast("Đã tạo chủ đề mới thành công!", "success");
            } else {
              if (window.showToast) showToast("Lỗi khi tạo chủ đề!", "danger");
            }
          })
          .catch(err => console.error("Lỗi:", err));
      });

      if (els.btnCopyEditPrompt) {
        els.btnCopyEditPrompt.addEventListener("click", function () {
          const topicName = els.editTopicName.value.trim() || "Chủ đề mới";

          fetch('/api/ai/chat/histories')
            .then(res => res.json())
            .then(histories => {
              const btnContinue = document.getElementById("btn-continue-chat");
              const hasHistory = histories && histories.some(h => h.topicId === currentTopicId);

              if (btnContinue) {
                if (hasHistory) {
                  btnContinue.disabled = false;
                  btnContinue.classList.remove("disabled", "opacity-50");
                } else {
                  btnContinue.disabled = true;
                  btnContinue.classList.add("disabled", "opacity-50");
                }
              }

              const choiceModalEl = document.getElementById('chatChoiceModal');
              if (choiceModalEl) {
                const choiceModal = new bootstrap.Modal(choiceModalEl);
                choiceModal.show();
              }
            })
            .catch(() => {
              redirectToChat(topicName, currentTopicId, 'new');
            });

          const btnCreateNew = document.getElementById("btn-create-new-chat");
          if (btnCreateNew) {
            btnCreateNew.onclick = function () {
              redirectToChat(topicName, currentTopicId, 'new');
            };
          }

          const btnContinue = document.getElementById("btn-continue-chat");
          if (btnContinue) {
            btnContinue.onclick = function () {
              redirectToChat(topicName, currentTopicId, 'continue');
            };
          }
        });
      }

      function redirectToChat(topicName, topicId, mode) {
        const promptText = `Bạn hãy tạo 10 cặp thẻ flashcard cho chủ đề: "${topicName}".\n\nMỗi thẻ có cấu trúc JSON:\n{\n  "englishVocabulary": "Beautiful",\n  "vietnameseVocabulary": "Xinh đẹp",\n  "example": "She has a beautiful smile. Dịch: Cô ấy có nụ cười xinh đẹp.",\n  "pronunciation": "/ˈbjuːtɪfl/",\n  "wordPos": "(adj)"\n}\n\nYÊU CẦU BẮT BUỘC:\n1. Chỉ trả về CÁC OBJECT NGOẶC NHỌN {...} ngăn cách bằng dấu phẩy. KHÔNG bọc ngoặc vuông [...] ở ngoài.\n2. Phân bổ đồng đều loại từ (n), (v), (adj), (adv).`;

        if (mode === 'new') {
          window.location.href = `/chat-ai?prompt=` + encodeURIComponent(promptText) + `&topic=` + encodeURIComponent(topicName) + `&topicId=` + encodeURIComponent(topicId || '') + `&mode=new`;
        } else {
          window.location.href = `/chat-ai?topic=` + encodeURIComponent(topicName) + `&topicId=` + encodeURIComponent(topicId || '') + `&mode=continue`;
        }
      }

      els.btnSaveEdit.addEventListener("click", function () {
        handleSaveEdit(elements);
      });
    }

    function renderTopics(topicList) {
      const els = elements;
      els.topicsList.innerHTML = "";
      if (!topicList || topicList.length === 0) {
        els.topicsEmpty.classList.add("show");
        return;
      }
      els.topicsEmpty.classList.remove("show");

      topicList.forEach((topic, idx) => {
        const col = document.createElement("div");
        const colorVars = getColorVariants(topic.color);

        let parsedData = [];
        let isValidData = false;
        try {
          let clean = (topic.dataJson || "[]").trim();
          if (!clean.startsWith("[")) clean = "[" + clean + "]";
          parsedData = JSON.parse(clean);
          isValidData = Array.isArray(parsedData) && parsedData.length > 0;
        } catch (e) {
          isValidData = false;
        }

        col.className = "col position-relative";
        col.setAttribute("draggable", "true");
        col.dataset.index = idx;

        col.innerHTML = `
          <div class="topic-card" style="border-left: 4px solid ${topic.color}; background: linear-gradient(to right, ${colorVars.veryLight}, white);">
            ${isValidData
            ? '<i class="bx bx-check-circle text-success topic-status-icon" title="Dữ liệu hợp lệ"></i>'
            : '<i class="bx bx-x-circle text-danger topic-status-icon" title="Thiếu hoặc sai dữ liệu JSON"></i>'}
            <h6 class="fw-bold mb-1 text-truncate">${escapeHtml(topic.name)}</h6>
            <p class="text-muted small mb-2"><i class="bx bx-collection me-1"></i>${parsedData.length} từ vựng</p>
            <div class="d-flex flex-wrap gap-1">
              <button class="btn btn-sm rounded-pill text-white btn-start ${!isValidData ? 'disabled opacity-50' : ''}" style="background-color: ${topic.color};" ${!isValidData ? 'disabled' : ''}>
                <i class="bx bx-play me-1"></i>Bắt đầu
              </button>
              <button class="btn btn-outline-secondary btn-sm rounded-pill btn-edit">
                <i class="bx bx-edit me-1"></i>Sửa
              </button>
              <button class="btn btn-outline-danger btn-sm rounded-pill btn-delete">
                <i class="bx bx-trash me-1"></i>Xóa
              </button>
            </div>
          </div>
        `;

        // Bắt đầu lật thẻ
        col.querySelector(".btn-start").addEventListener("click", function () {
          if (isValidData) {
            window.location.href = `/study-flashcard?id=${topic.topicId}`;
          }
        });

        // Chỉnh sửa
        col.querySelector(".btn-edit").addEventListener("click", function () {
          currentTopicId = topic.topicId;
          els.editTopicName.value = topic.name;

          // DÙNG HÀM FORMAT TỰ ĐỘNG THAY VÌ CẮT CHUỖI CŨ
          els.editTopicData.value = formatJsonDisplay(topic.dataJson);

          selectedColor = topic.color || COLORS[0];
          renderColorPicker(els);
          els.editTopicModal.show();
        });

        // Xóa
        col.querySelector(".btn-delete").addEventListener("click", function () {
          showConfirmModal("Bạn chắc chắn muốn xóa chủ đề này?", () => {
            fetch(`${API_BASE_URL}/${topic.topicId}`, { method: "DELETE" })
              .then(() => {
                loadTopicsFromServer();
                if (window.showToast) showToast("Đã xóa chủ đề!", "success");
              });
          });
        });

        els.topicsList.appendChild(col);
      });

      if (window.initDragAndDropList) {
        window.initDragAndDropList(
          "#topics-list",
          topics,
          function (updatedData) {
            topics = updatedData;
            topics.forEach((topic, index) => {
              topic.orderIndex = index;
              fetch(API_BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(topic)
              }).catch(err => console.error("Lỗi cập nhật vị trí:", err));
            });
            renderTopics(topics);
            if (window.showToast) showToast("Đã lưu vị trí sắp xếp mới!", "success");
          }
        );
      }
    }

    function handleSaveEdit(els) {
      if (!currentTopicId) return;
      const name = els.editTopicName.value.trim();
      let rawInput = els.editTopicData.value.trim();

      if (!name) {
        if (window.showToast) showToast("Vui lòng nhập tên chủ đề!", "warning");
        return;
      }

      let formattedJsonToSave = "[]";

      if (rawInput) {
        // 1. Dọn dẹp Markdown và giải mã HTML Entities
        rawInput = rawInput.replaceAll("```json", "").replaceAll("```", "").trim();
        rawInput = rawInput.replace(/&quot;/g, '"').replace(/&#34;/g, '"')
                            .replace(/&amp;/g, '&').replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>').replace(/&#39;/g, "'");

        // 2. Bỏ ngoặc vuông ngoài cùng nếu có
        if (rawInput.startsWith("[")) rawInput = rawInput.substring(1).trim();
        if (rawInput.endsWith("]")) rawInput = rawInput.substring(0, rawInput.length - 1).trim();

        // 3. 🪄 TỰ ĐỘNG VÁ LỖI THIẾU DẤU PHẨY / THIẾU NGOẶC VÀ THÊM XUỐNG DÒNG
        rawInput = rawInput.replace(/\}\s*(?="englishVocabulary"|"vietnameseVocabulary")/g, "},\n{");
        rawInput = rawInput.replace(/}\s*\{/g, "},\n{");

        // 4. Đảm bảo mở đầu bằng { và kết thúc bằng }
        if (!rawInput.startsWith("{")) rawInput = "{" + rawInput;
        if (!rawInput.endsWith("}")) rawInput = rawInput + "}";

        // Bọc lại thành mảng JSON
        rawInput = "[" + rawInput + "]";

        try {
          const parsedArr = JSON.parse(rawInput);
          if (!Array.isArray(parsedArr)) throw new Error();
          
          // 🪄 Format thụt lề 2 dấu cách giúp toàn bộ dữ liệu luôn ngay hàng thẳng lối
          formattedJsonToSave = JSON.stringify(parsedArr, null, 2);
        } catch (e) {
          if (window.showToast) {
            showToast("Dữ liệu JSON bị sai cú pháp nghiêm trọng! Vui lòng kiểm tra lại.", "danger");
          }
          return;
        }
      }

      const existingTopic = topics.find(t => t.topicId === currentTopicId);

      const updatedTopic = {
        topicId: currentTopicId,
        name: name,
        color: selectedColor,
        dataJson: formattedJsonToSave,
        orderIndex: existingTopic ? existingTopic.orderIndex : 0
      };

      fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTopic)
      })
        .then(res => {
          if (res.ok) {
            els.editTopicModal.hide();
            loadTopicsFromServer();
            if (window.showToast) showToast("Đã lưu thay đổi chủ đề thành công!", "success");
          } else {
            if (window.showToast) showToast("Lỗi từ máy chủ khi lưu chủ đề!", "danger");
          }
        })
        .catch(err => console.error("Lỗi:", err));
    }
  });
})();