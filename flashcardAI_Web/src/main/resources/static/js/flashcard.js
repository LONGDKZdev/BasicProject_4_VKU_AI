(function () {
  const API_BASE_URL = "http://localhost:8080/api/topics";
  const API_AI_URL = "http://localhost:8080/api/ai/generate";
  
  // Tạm giả định userId của người dùng hiện tại (sau này gắn với module Auth)
  const currentUserId = "user_test_123"; 

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
    };

    renderColorPicker(elements);
    loadTopicsFromServer(elements);
    bindEvents(elements);

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

    // 1. GỌI API LẤY DANH SÁCH TỪ FIREBASE THƯƠNG QUA SPRING BOOT
    function loadTopicsFromServer(els) {
      fetch(`${API_BASE_URL}?userId=${currentUserId}`)
        .then(res => res.json())
        .then(data => {
          topics = data || [];
          renderTopics(els);
        })
        .catch(err => console.error("Lỗi tải chủ đề:", err));
    }

    function bindEvents(els) {
      // 2. TÍCH HỢP GỌI AI TRỰC TIẾP THAY VÌ COPY PROMPT
      els.btnGeneratePrompt.addEventListener("click", function () {
        const topicName = els.topicInput.value.trim();
        const count = parseInt(els.countInput.value, 10) || 10;

        if (!topicName) {
          alert("Vui lòng nhập chủ đề tiếng Anh!");
          return;
        }

        // Gọi API Backend để sinh dữ liệu từ AI
        fetch(API_AI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicName, count })
        })
        .then(res => res.text())
        .then(jsonResult => {
          // Tạo object topic mới và lưu thẳng lên Firebase qua Spring Boot
          const newTopic = {
            userId: currentUserId,
            name: topicName,
            color: COLORS[0],
            count: count,
            dataJson: jsonResult
          };

          return fetch(API_BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newTopic)
          });
        })
        .then(() => {
          alert("Đã tạo chủ đề và sinh dữ liệu AI thành công!");
          loadTopicsFromServer(els);
          els.topicInput.value = "";
        })
        .catch(err => {
          console.error("Lỗi:", err);
          alert("Có lỗi xảy ra khi kết nối AI!");
        });
      });

      els.btnSaveEdit.addEventListener("click", function () {
        handleSaveEdit(els);
      });
    }

    function renderTopics(els) {
      els.topicsList.innerHTML = "";
      if (topics.length === 0) {
        els.topicsEmpty.classList.add("show");
        return;
      }
      els.topicsEmpty.classList.remove("show");

      topics.forEach((topic) => {
        const col = document.createElement("div");
        const colorVars = getColorVariants(topic.color);
        
        let parsedData = [];
        try { parsedData = JSON.parse(topic.dataJson || "[]"); } catch(e){}

        col.className = "col position-relative";
        col.innerHTML = `
          <div class="topic-card" style="border-left: 4px solid ${topic.color}; background: linear-gradient(to right, ${colorVars.veryLight}, white);">
            <i class="bx bx-check-circle text-success topic-status-icon"></i>
            <h6 class="fw-bold mb-1 text-truncate">${escapeHtml(topic.name)}</h6>
            <p class="text-muted small mb-3"><i class="bx bx-collection me-1"></i>${parsedData.length} từ vựng</p>
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-sm rounded-pill text-white btn-start" style="background-color: ${topic.color};">
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

        // Sự kiện Xóa chủ đề qua API
        col.querySelector(".btn-delete").addEventListener("click", function () {
          if (confirm("Bạn chắc chắn muốn xóa chủ đề này?")) {
            fetch(`${API_BASE_URL}/${topic.topicId}`, { method: "DELETE" })
              .then(() => loadTopicsFromServer(els));
          }
        });

        els.topicsList.appendChild(col);
      });
    }

    function handleSaveEdit(els) {
      if (!currentTopicId) return;
      const name = els.editTopicName.value.trim();
      const dataJson = els.editTopicData.value.trim();

      const updatedTopic = {
        topicId: currentTopicId,
        userId: currentUserId,
        name: name,
        color: selectedColor,
        dataJson: dataJson
      };

      fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTopic)
      })
      .then(() => {
        els.editTopicModal.hide();
        loadTopicsFromServer(els);
      });
    }
  });
})();