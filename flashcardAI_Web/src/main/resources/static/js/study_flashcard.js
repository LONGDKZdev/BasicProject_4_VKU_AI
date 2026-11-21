document.addEventListener("DOMContentLoaded", function () {
  const STORAGE_STUDY_KEY = "study-space.flashcard-study.v1";

  // --- KHAI BÁO ÂM THANH ---
  const audioFlip = new Audio("/assets/sounds/flipcard.mp3");
  audioFlip.playbackRate = 1.8;

  function playAudio(audioObj) {
    if (!audioObj) return;
    audioObj.currentTime = 0;
    audioObj
      .play()
      .catch((err) => console.log("Trình duyệt chặn phát âm thanh:", err));
  }

  const urlParams = new URLSearchParams(window.location.search);
  let topicId = urlParams.get("id");

  if (topicId) {
    localStorage.setItem("current_study_topic_id", topicId);
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    topicId = localStorage.getItem("current_study_topic_id");
  }

  if (!topicId) {
    alert("Không tìm thấy chủ đề!");
    window.location.href = "/";
    return;
  }

  window.history.replaceState({}, document.title, window.location.pathname);

  // DOM Elements
  const els = {
    studyTopicName: document.getElementById("study-topic-name"),
    studyProgress: document.getElementById("study-progress"),
    studyCarousel: document.getElementById("study-carousel"),
    studyOverlay: document.getElementById("study-overlay"),
    btnPrevCard: document.getElementById("btn-prev-card"),
    btnNextCard: document.getElementById("btn-next-card"),
    btnCloseStudy: document.getElementById("btn-close-study"),
    btnOpenTestRounds: document.getElementById("btn-open-test-rounds"),
    quickSelectDropdown: document.getElementById("quick-select-dropdown"),
  };

  let currentStudyTopic = null;
  let currentCardIndex = 0;
  let isCardExpanded = false;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getColorVariants(baseColor) {
    let r = parseInt(baseColor.slice(1, 3), 16),
      g = parseInt(baseColor.slice(3, 5), 16),
      b = parseInt(baseColor.slice(5, 7), 16);
    if (isNaN(r)) {
      r = 74;
      g = 222;
      b = 128;
    }
    return {
      base: baseColor,
      light: `rgb(${Math.min(255, r + 120)}, ${Math.min(255, g + 120)}, ${Math.min(255, b + 120)})`,
      veryLight: `rgb(${Math.min(255, r + 160)}, ${Math.min(255, g + 160)}, ${Math.min(255, b + 160)})`,
    };
  }

  function normalizeCardItem(item) {
    return {
      english: String(item.englishVocabulary ?? item.english ?? "").trim(),
      vietnamese: String(
        item.vietnameseVocabulary ?? item.vietnamese ?? "",
      ).trim(),
      pronunciation: String(item.pronunciation ?? item.ipa ?? "").trim(),
      wordPos: String(item.wordPos ?? item.type ?? "").trim(),
      example: String(item.example ?? "").trim(),
      description: String(item.description ?? item.note ?? "").trim(),
    };
  }

  // Khởi tạo lấy dữ liệu từ REST API
  function init() {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((topics) => {
        const topic = topics.find((t) => String(t.topicId) === String(topicId));

        if (!topic || !topic.dataJson) {
          alert("Chủ đề không tồn tại hoặc chưa có dữ liệu hợp lệ!");
          window.location.href = "/";
          return;
        }

        let parsedData = [];
        try {
          let clean = (topic.dataJson || "[]").trim();
          if (!clean.startsWith("[")) clean = "[" + clean + "]";
          parsedData = JSON.parse(clean);
        } catch (e) {
          console.error("Lỗi parse JSON:", e);
        }

        currentStudyTopic = {
          ...topic,
          name: topic.name,
          color: topic.color || "#4ade80",
          data: parsedData.map(normalizeCardItem),
        };

        els.studyTopicName.textContent = currentStudyTopic.name;

        const savedState = JSON.parse(
          window.localStorage.getItem(STORAGE_STUDY_KEY)
        );
        if (savedState && String(savedState.topicId) === String(topicId)) {
          currentCardIndex = savedState.cardIndex || 0;
          if (currentCardIndex >= currentStudyTopic.data.length) {
            currentCardIndex = 0;
          }
        }

        renderCarousel();
        updateCarouselPositions();
        bindEvents();
      })
      .catch((err) => {
        console.error("Lỗi tải chủ đề:", err);
        alert("Không thể kết nối đến máy chủ!");
      });
  }

  function bindEvents() {
    els.btnPrevCard.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isCardExpanded) collapseCurrentCard();
      goToPrevCard();
    });
    els.btnNextCard.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isCardExpanded) collapseCurrentCard();
      goToNextCard();
    });
    els.btnCloseStudy.addEventListener("click", () => {
      window.location.href = "/";
    });
    if (els.btnOpenTestRounds) {
      els.btnOpenTestRounds.addEventListener("click", () => {
        openTestRoundsModal(topicId);
      });
    }
    els.studyOverlay.addEventListener("click", () => collapseCurrentCard());
  }

  function renderCarousel() {
    els.studyCarousel.innerHTML = "";
    const colorVars = getColorVariants(currentStudyTopic.color);

    currentStudyTopic.data.forEach((card, index) => {
      const cardEl = document.createElement("div");
      cardEl.className = "study-carousel-card";
      cardEl.dataset.index = index;
      cardEl.style.setProperty("--topic-border-color", colorVars.base);

      let cleanPronunciation = card.pronunciation
        .split("|")
        .pop()
        .replace(/US:\s*/g, "")
        .replace(/UK:\s*/g, "")
        .trim();

      let pronunciationHtml = `
        <div class="d-flex align-items-center justify-content-center gap-2" style="margin-left: 5px;">
          <button class="btn btn-sm p-0 border-0 btn-speak-us" style="color: #000;" title="Nghe phát âm">
            <i class="bx bx-volume-full fs-4"></i>
          </button>
          <span>${escapeHtml(cleanPronunciation)}</span>
        </div>
      `;

      let exampleHtml = "";
      if (card.example) {
        let eng = card.example,
          vie = "";
        const splitSign = card.example.includes(". Dịch:")
          ? ". Dịch:"
          : card.example.includes("Dịch:")
            ? "Dịch:"
            : null;
        if (splitSign) {
          const parts = card.example.split(splitSign);
          eng = parts[0].trim();
          vie = parts[1] ? parts[1].trim() : "";
        }
        exampleHtml = `<div class="description-box text-start w-100" style="background: transparent; border: none; padding: 0; margin-top: 15px;"><p class="text-dark pt-1 mt-1" style="font-size: 20px; margin: 0;"><strong>Ví dụ:</strong> ${escapeHtml(eng)}</p>${vie ? `<p class="text-dark pt-1 mt-1" style="font-size: 20px; margin: 0;"><strong>Dịch nghĩa:</strong> ${escapeHtml(vie)}</p>` : ""}</div>`;
      }

      cardEl.innerHTML = `
        <div class="card-preview">
          <div class="card-preview-word-box"><span class="card-preview-word-text" style="color: #000;">${escapeHtml(card.english || `Thẻ #${index + 1}`)}</span></div>
        </div>
        <div class="card-content" style="width: 100%;">
          <div class="w-100 d-flex justify-content-between align-items-center mb-3"><span class="text-black font-monospace fw-bold" style="font-size: 20px; padding: 4px 10px;">#${index + 1}</span></div>
          <div class="text my-3 shadow-sm position-relative" style="background-color: ${colorVars.base}; height: auto; min-height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 15px; padding: 12px 24px; word-break: break-word;">
            <h3 class="fw-bold m-0 d-flex align-items-center flex-wrap justify-content-center gap-2" style="color: #ffffff; font-size: 22px; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">
              <span>${escapeHtml(card.english)}</span> 
              <span style="opacity: 0.8; font-size: 18px;">${escapeHtml(card.wordPos)}</span>
            </h3>
          </div>
          <div class="w-100 text-start"><p class="text-center mb-4" style="font-size: 20px;font-weight: bold; color: #000;">${escapeHtml(card.vietnamese)}</p><div class="text-center mb-3 d-flex align-items-start" style="font-size: 20px; color: #000; line-height: 1.4;"><div class="flex-grow-1">${pronunciationHtml}</div></div></div>
          ${exampleHtml}
        </div>
      `;

      const speakBtnUS = cardEl.querySelector(".btn-speak-us");
      if (speakBtnUS) {
        speakBtnUS.addEventListener("click", function (e) {
          e.stopPropagation();
          speakText(card.english, "en-US");
        });
      }

      cardEl.addEventListener("click", function () {
        const idx = parseInt(this.dataset.index, 10);
        if (idx === currentCardIndex) {
          isCardExpanded ? collapseCurrentCard() : expandCurrentCard();
        } else {
          if (isCardExpanded) collapseCurrentCard();
          currentCardIndex = idx;
          updateCarouselPositions();
          updateProgress();
          saveStudyState();
        }
      });
      els.studyCarousel.appendChild(cardEl);
    });
    updateProgress();
    renderQuickSelectDropdown();
  }

  function renderQuickSelectDropdown() {
    els.quickSelectDropdown.innerHTML = "";
    currentStudyTopic.data.forEach((_, index) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "dropdown-item fw-semibold text-dark text-center py-2";
      a.href = "#";
      a.textContent = `Chuyển tới thẻ #${index + 1}`;

      a.addEventListener("click", function (e) {
        e.preventDefault();
        if (isCardExpanded) collapseCurrentCard();

        currentCardIndex = index;
        updateCarouselPositions();
        updateProgress();
        saveStudyState();
      });

      li.appendChild(a);
      els.quickSelectDropdown.appendChild(li);
    });
  }

  function updateCarouselPositions() {
    const cards = els.studyCarousel.querySelectorAll(".study-carousel-card");
    const total = cards.length;
    const colorVars = getColorVariants(currentStudyTopic.color);

    cards.forEach((card) => {
      const idx = parseInt(card.dataset.index, 10);
      card.classList.remove(
        "carousel-pos-left",
        "carousel-pos-center",
        "carousel-pos-right",
        "carousel-pos-hidden-left",
        "carousel-pos-hidden-right",
      );
      if (!card.classList.contains("expanded"))
        card.style.background = `linear-gradient(145deg, ${colorVars.veryLight}, ${colorVars.light})`;

      let pos = "hidden-right";
      if (total <= 1 || idx === currentCardIndex) pos = "center";
      else if (idx === (currentCardIndex - 1 + total) % total) pos = "left";
      else if (idx === (currentCardIndex + 1) % total) pos = "right";
      else if (
        (currentCardIndex - idx + total) % total <
        (idx - currentCardIndex + total) % total
      )
        pos = "hidden-left";

      card.classList.add(`carousel-pos-${pos}`);
      if (pos === "center" && !card.classList.contains("expanded"))
        card.style.background = colorVars.base;
    });
  }

  function expandCurrentCard() {
    const card = Array.from(els.studyCarousel.children).find(
      (c) => parseInt(c.dataset.index, 10) === currentCardIndex,
    );
    if (card) {
      playAudio(audioFlip);
      card.classList.add("expanded");
      els.studyOverlay.classList.add("show");
      isCardExpanded = true;
    }
  }

  function collapseCurrentCard() {
    const card = Array.from(els.studyCarousel.children).find(
      (c) => parseInt(c.dataset.index, 10) === currentCardIndex,
    );
    if (card) {
      playAudio(audioFlip);
      card.classList.remove("expanded");
      els.studyOverlay.classList.remove("show");
      isCardExpanded = false;
      updateCarouselPositions();
    }
  }

  function goToPrevCard() {
    currentCardIndex =
      (currentCardIndex - 1 + currentStudyTopic.data.length) %
      currentStudyTopic.data.length;
    updateCarouselPositions();
    updateProgress();
    saveStudyState();
  }

  function goToNextCard() {
    currentCardIndex = (currentCardIndex + 1) % currentStudyTopic.data.length;
    updateCarouselPositions();
    updateProgress();
    saveStudyState();
  }

  function updateProgress() {
    els.studyProgress.textContent = `${currentCardIndex + 1} / ${currentStudyTopic.data.length}`;
  }

  function saveStudyState() {
    window.localStorage.setItem(
      STORAGE_STUDY_KEY,
      JSON.stringify({
        topicId: currentStudyTopic.topicId,
        cardIndex: currentCardIndex,
      }),
    );
  }

  let lastSpokenId = "";
  let isSlowMode = false;

  function speakText(text, lang = "en-US") {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const currentId = text + "_" + lang;

      if (currentId === lastSpokenId) {
        isSlowMode = !isSlowMode;
      } else {
        isSlowMode = false;
        lastSpokenId = currentId;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = isSlowMode ? 0.5 : 0.9;

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Rất tiếc, trình duyệt của bạn không hỗ trợ tính năng đọc văn bản.");
    }
  }

  // Mở Modal 4 vòng kiểm tra & đồng bộ tiến độ trực tiếp từ Cloud Firestore
  async function openTestRoundsModal(targetTopicId) {
    const container = document.getElementById("test-rounds-container");
    if (!container) return;

    const roundDescriptions = [
      { title: "Vòng 1: Nhận diện mặt chữ", desc: "Trắc nghiệm chọn nghĩa tiếng Việt (Anh → Việt)" },
      { title: "Vòng 2: Phản xạ từ vựng", desc: "Trắc nghiệm chọn từ tiếng Anh tương ứng (Việt → Anh)" },
      { title: "Vòng 3: Luyện viết chính tả", desc: "Gõ lại từ tiếng Anh dựa theo nghĩa và phiên âm IPA" },
      { title: "Vòng 4: Nghe & Viết tổng hợp", desc: "Nghe phát âm chuẩn và điền từ vựng chính xác" }
    ];

    container.innerHTML = `<div class="text-center text-muted py-4"><i class="bx bx-loader-alt bx-spin fs-3"></i><p class="mt-2 small">Đang tải tiến độ từ máy chủ...</p></div>`;

    const modalEl = document.getElementById("testRoundsModal");
    let modal = bootstrap.Modal.getInstance(modalEl);
    if (!modal) modal = new bootstrap.Modal(modalEl);
    modal.show();

    let completedRounds = [];
    try {
      const res = await fetch(`/api/progress/${encodeURIComponent(targetTopicId)}`);
      if (res.ok) {
        const progressData = await res.json();
        completedRounds = progressData.completedRounds || [];
      }
    } catch (err) {
      console.error("Lỗi nạp tiến độ:", err);
    }

    function renderRounds(doneList) {
      container.innerHTML = "";
      for (let i = 1; i <= 4; i++) {
        const isDone = doneList.includes(i);
        const statusBadge = isDone
          ? `<span class="badge bg-success rounded-pill px-3 py-1"><i class="bx bx-check me-1"></i>Đã hoàn thành</span>`
          : `<span class="badge bg-secondary text-white rounded-pill px-3 py-1">Chưa làm</span>`;

        const info = roundDescriptions[i - 1];
        const row = document.createElement("div");
        row.className = "d-flex justify-content-between align-items-center p-3 border rounded-4 bg-white shadow-sm";
        row.innerHTML = `
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h6 class="fw-bold m-0 text-dark">${info.title}</h6>
              ${statusBadge}
            </div>
            <small class="text-muted">${info.desc}</small>
          </div>
          <button class="btn btn-dark fw-bold rounded-pill px-4 btn-start-round" data-round="${i}">
            Kiểm tra <i class="bx bx-play ms-1"></i>
          </button>
        `;

        row.querySelector(".btn-start-round").addEventListener("click", () => {
          window.location.href = `/test-flashcard?id=${encodeURIComponent(targetTopicId)}&round=${i}`;
        });

        container.appendChild(row);
      }
    }

    renderRounds(completedRounds);

    const btnReset = document.getElementById("btn-reset-rounds");
    if (btnReset) {
      const newBtnReset = btnReset.cloneNode(true);
      btnReset.parentNode.replaceChild(newBtnReset, btnReset);

      newBtnReset.addEventListener("click", async () => {
        try {
          const delRes = await fetch(`/api/progress/${encodeURIComponent(targetTopicId)}`, {
            method: "DELETE"
          });
          if (delRes.ok) {
            completedRounds = [];
            renderRounds(completedRounds);
            if (window.showToast) window.showToast("Đã đặt lại toàn bộ tiến độ kiểm tra!", "success");
          }
        } catch (err) {
          if (window.showToast) window.showToast("Lỗi khi đặt lại tiến độ!", "danger");
        }
      });
    }
  }

  init();
});