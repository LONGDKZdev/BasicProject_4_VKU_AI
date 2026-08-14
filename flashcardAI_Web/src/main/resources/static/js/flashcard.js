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

  document.addEventListener("DOMContentLoaded", function () {
    const elements = {
      topicInput: document.getElementById("topic-input"),
      countInput: document.getElementById("count-input"),
      btnGeneratePrompt: document.getElementById("btn-generate-prompt"),
      topicsList: document.getElementById("topics-list"),
      topicsEmpty: document.getElementById("topics-empty"),
      editTopicModal: new bootstrap.Modal(document.getElementById("editTopicModal")),
      editTopicName: document.getElementById("edit-topic-name"),
      editTopicData: document.getElementById("edit-topic-data"),
      colorPickerContainer: document.getElementById("color-picker-container"),
      btnSaveEdit: document.getElementById("btn-save-edit"),
      btnCopyEditPrompt: document.getElementById("btn-copy-edit-prompt")
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

    function loadTopicsFromServer() {
      fetch(API_BASE_URL)
        .then(res => res.json())
        .then(data => {
          topics = data || [];
          renderTopics();

          const urlParams = new URLSearchParams(window.location.search);
          const autoEditTopicId = urlParams.get("editTopicId");

          if (autoEditTopicId) {
            const targetTopic = topics.find((t) => t.topicId === autoEditTopicId);
            if (targetTopic) {
              currentTopicId = targetTopic.topicId;
              elements.editTopicName.value = targetTopic.name;

              let displayData = (targetTopic.dataJson || "").trim();
              if (displayData.startsWith("[")) displayData = displayData.substring(1).trim();
              if (displayData.endsWith("]")) displayData = displayData.substring(0, displayData.length - 1).trim();

              elements.editTopicData.value = displayData;
              selectedColor = targetTopic.color || COLORS[0];
              renderColorPicker(elements);
              elements.editTopicModal.show();

              // 🪄 ẨN THAM SỐ URL DƯ THỪA ĐỂ BẢO MẬT & ĐẸP MẮT
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        })
        .catch(err => console.error("Lỗi tải chủ đề:", err));
    }

    function bindEvents(els) {
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

    function renderTopics() {
      const els = elements;
      els.topicsList.innerHTML = "";
      if (topics.length === 0) {
        els.topicsEmpty.classList.add("show");
        return;
      }
      els.topicsEmpty.classList.remove("show");

      topics.forEach((topic, idx) => {
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

        // BỎ HẲN NÚT KIỂM TRA - CHỈ GIỮ LẠI: BẮT ĐẦU, CHỈNH SỬA, XÓA
        col.innerHTML = `
          <div class="topic-card" style="border-left: 4px solid ${topic.color}; background: linear-gradient(to right, ${colorVars.veryLight}, white);">
            ${isValidData
            ? '<i class="bx bx-check-circle text-success topic-status-icon" title="Dữ liệu hợp lệ"></i>'
            : '<i class="bx bx-x-circle text-danger topic-status-icon" title="Thiếu hoặc sai dữ liệu JSON"></i>'}
            <h6 class="fw-bold mb-1 text-truncate">${escapeHtml(topic.name)}</h6>
            <p class="text-muted small mb-3"><i class="bx bx-collection me-1"></i>${parsedData.length} từ vựng</p>
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-sm rounded-pill text-white btn-start ${!isValidData ? 'disabled opacity-50' : ''}" style="background-color: ${topic.color};" ${!isValidData ? 'disabled' : ''}>
                <i class="bx bx-play me-1"></i>Bắt đầu
              </button>
              <button class="btn btn-outline-secondary btn-sm rounded-pill btn-edit">
                <i class="bx bx-edit me-1"></i>Chỉnh sửa
              </button>
              <button class="btn btn-outline-danger btn-sm rounded-pill btn-delete">
                <i class="bx bx-trash me-1"></i>Xóa
              </button>
            </div>
          </div>
        `;

        // Nút Bắt đầu lật thẻ
        col.querySelector(".btn-start").addEventListener("click", function () {
          if (isValidData) {
            window.location.href = `/study-flashcard?id=${topic.topicId}`;
          }
        });

        // Nút Chỉnh sửa
        col.querySelector(".btn-edit").addEventListener("click", function () {
          currentTopicId = topic.topicId;
          els.editTopicName.value = topic.name;

          let displayData = (topic.dataJson || "").trim();
          if (displayData.startsWith("[")) displayData = displayData.substring(1).trim();
          if (displayData.endsWith("]")) displayData = displayData.substring(0, displayData.length - 1).trim();

          els.editTopicData.value = displayData;
          selectedColor = topic.color || COLORS[0];

          renderColorPicker(els);
          els.editTopicModal.show();
        });

        // Nút Xóa có Modal xác nhận
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

            renderTopics();
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

      if (rawInput) {
        rawInput = rawInput.replaceAll("```json", "").replaceAll("```", "").trim();
        if (rawInput.startsWith("[")) rawInput = rawInput.substring(1).trim();
        if (rawInput.endsWith("]")) rawInput = rawInput.substring(0, rawInput.length - 1).trim();

        rawInput = rawInput.replace(/}\s*\{/g, "},{");
        rawInput = "[" + rawInput + "]";

        try {
          const parsedArr = JSON.parse(rawInput);
          if (!Array.isArray(parsedArr)) throw new Error();
        } catch (e) {
          if (window.showToast) {
            showToast("Dữ liệu JSON bị sai cú pháp! Hãy kiểm tra lại các dấu ngoặc.", "danger");
          }
          return;
        }
      } else {
        rawInput = "[]";
      }

      const existingTopic = topics.find(t => t.topicId === currentTopicId);

      const updatedTopic = {
        topicId: currentTopicId,
        name: name,
        color: selectedColor,
        dataJson: rawInput,
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