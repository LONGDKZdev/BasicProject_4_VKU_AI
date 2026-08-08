(function () {
  const API_BASE_URL = "http://localhost:8080/api/topics";
  let currentUserId = null; // Không còn gán cứng user_test_123 nữa

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

    // Lấy chính xác user hiện tại thông qua API bảo mật
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
        window.location.href = "/login"; // Chuyển hướng về trang login nếu chưa xác thực
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
      fetch(API_BASE_URL) // Backend tự lấy qua Principal nên không cần truyền param ?userId nữa
        .then(res => res.json())
        .then(data => {
          topics = data || [];
          renderTopics();
        })
        .catch(err => console.error("Lỗi tải chủ đề:", err));
    }

    function bindEvents(els) {
      els.btnGeneratePrompt.addEventListener("click", function () {
        const topicName = els.topicInput.value.trim();
        const count = parseInt(els.countInput.value, 10) || 10;

        if (!topicName) {
          alert("Vui lòng nhập tên chủ đề tiếng Anh!");
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
          } else {
            alert("Lỗi khi tạo chủ đề!");
          }
        })
        .catch(err => console.error("Lỗi:", err));
      });

      if (els.btnCopyEditPrompt) {
        els.btnCopyEditPrompt.addEventListener("click", function () {
          const topicName = els.editTopicName.value.trim() || "Chủ đề mới";
          
          // Mở Popup lựa chọn chế độ chat thay vì chuyển hướng trực tiếp
          const choiceModalEl = document.getElementById('chatChoiceModal');
          if (choiceModalEl) {
            const choiceModal = new bootstrap.Modal(choiceModalEl);
            choiceModal.show();
          } else {
            // Fallback an toàn nếu chưa chèn modal vào html
            redirectToChat(topicName, 'new');
            return;
          }

          // Xử lý nút Tạo đoạn chat mới (mode=new)
          const btnCreateNew = document.getElementById("btn-create-new-chat");
          if (btnCreateNew) {
            btnCreateNew.onclick = function() {
              redirectToChat(topicName, 'new');
            };
          }

          // Xử lý nút Tiếp tục đoạn chat trước đó (mode=continue)
          const btnContinue = document.getElementById("btn-continue-chat");
          if (btnContinue) {
            btnContinue.onclick = function() {
              redirectToChat(topicName, 'continue');
            };
          }
        });
      }

      function redirectToChat(topicName, mode) {
        const promptText = `Bạn hãy tạo 10 cặp thẻ flashcard cho chủ đề: "${topicName}".\n\nMỗi thẻ phải có cấu trúc dữ liệu sau:\nenglishVocabulary: Từ vựng tiếng Anh\nvietnameseVocabulary: Từ vựng tiếng Việt\nexample: Câu ví dụ chứa từ vựng bằng tiếng Anh và câu dịch tiếng Việt\npronunciation: Phiên âm quốc tế IPA (Ví dụ: /ˈbjuːtɪfl/)\nwordPos: Loại từ chính của từ vựng đó (Ví dụ: (n), (v), (adj), (adv))\n\nYÊU CẦU BẮT BUỘC: \n1. Trả về DỮ LIỆU JSON THUẦN. Tuyệt đối KHÔNG viết thêm bất kỳ lời giải thích nào ngoài khối JSON.\n2. ĐA DẠNG LOẠI TỪ: Phân bổ đồng đều giữa Danh từ (n), Động từ (v), Tính từ (adj) và Trạng từ (adv).\n\nĐịnh dạng mẫu:\n[\n  {\n    "englishVocabulary": "Beautiful",\n    "vietnameseVocabulary": "Xinh đẹp",\n    "example": "She has a beautiful smile. Dịch: Cô ấy có nụ cười xinh đẹp.",\n    "pronunciation": "/ˈbjuːtɪfl/",\n    "wordPos": "(adj)"\n  }\n]`;

        if (mode === 'new') {
          window.location.href = `/chat-ai?prompt=` + encodeURIComponent(promptText) + `&topic=` + encodeURIComponent(topicName) + `&mode=new`;
        } else {
          window.location.href = `/chat-ai?topic=` + encodeURIComponent(topicName) + `&mode=continue`;
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
          parsedData = JSON.parse(topic.dataJson || "[]"); 
          isValidData = Array.isArray(parsedData) && parsedData.length > 0;
        } catch(e) {
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
            <p class="text-muted small mb-3"><i class="bx bx-collection me-1"></i>${parsedData.length} từ vựng</p>
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-sm rounded-pill text-white btn-start ${!isValidData ? 'disabled opacity-50' : ''}" style="background-color: ${topic.color};" ${!isValidData ? 'disabled' : ''}>
                <i class="bx bx-play me-1"></i>Bắt đầu
              </button>
              <button class="btn btn-outline-secondary btn-sm rounded-pill btn-edit">
                <i class="bx bx-edit me-1"></i>Thêm/Chỉnh sửa
              </button>
              <button class="btn btn-outline-danger btn-sm rounded-pill btn-delete">
                <i class="bx bx-trash me-1"></i>Xóa
              </button>
            </div>
          </div>
        `;

        col.querySelector(".btn-edit").addEventListener("click", function () {
          currentTopicId = topic.topicId;
          els.editTopicName.value = topic.name;
          els.editTopicData.value = topic.dataJson || "[]";
          selectedColor = topic.color || COLORS[0];
          
          els.colorPickerContainer.querySelectorAll(".color-option").forEach((n) => {
            if (n.style.backgroundColor === selectedColor || rgbToHex(n.style.backgroundColor) === selectedColor) {
              n.classList.add("active");
            } else {
              n.classList.remove("active");
            }
          });

          els.editTopicModal.show();
        });

        col.querySelector(".btn-delete").addEventListener("click", function () {
          if (confirm("Bạn chắc chắn muốn xóa chủ đề này?")) {
            fetch(`${API_BASE_URL}/${topic.topicId}`, { method: "DELETE" })
              .then(() => loadTopicsFromServer());
          }
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
            if (window.showToast) {
              showToast("Đã lưu vị trí sắp xếp mới!", "success");
            }
          }
        );
      }
    }

    function handleSaveEdit(els) {
      if (!currentTopicId) return;
      const name = els.editTopicName.value.trim();
      const dataJson = els.editTopicData.value.trim();

      const existingTopic = topics.find(t => t.topicId === currentTopicId);

      const updatedTopic = {
        topicId: currentTopicId,
        name: name,
        color: selectedColor,
        dataJson: dataJson,
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
          if (window.showToast) showToast("Đã lưu thay đổi chủ đề!", "success");
        } else {
          alert("Lỗi khi lưu chủ đề!");
        }
      })
      .catch(err => console.error("Lỗi:", err));
    }

    function rgbToHex(rgb) {
      if (!rgb.startsWith('rgb')) return rgb;
      let sep = rgb.indexOf(",") > -1 ? "," : " ";
      rgb = rgb.substr(4).split(")")[0].split(sep);
      let r = (+rgb[0]).toString(16),
          g = (+rgb[1]).toString(16),
          b = (+rgb[2]).toString(16);
      if (r.length == 1) r = "0" + r;
      if (g.length == 1) g = "0" + g;
      if (b.length == 1) b = "0" + b;
      return "#" + r + g + b;
    }
  });
})();