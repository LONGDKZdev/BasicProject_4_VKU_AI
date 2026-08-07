// frontend/js/drag_drop_helper.js

window.initDragAndDropList = function (
  containerSelector,
  dataArray,
  onReorderCallback,
) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  let draggedIndex = null;

  const items = container.querySelectorAll(".col");

  items.forEach((li, idx) => {
    li.draggable = true;
    li.dataset.index = idx;

    li.ondragstart = (e) => {
      draggedIndex = idx;
      e.dataTransfer.effectAllowed = "move";
      // Thêm hiệu ứng mờ cho thẻ đang kéo
      setTimeout(() => li.classList.add("dragging-card"), 0);
    };

    li.ondragend = () => {
      li.classList.remove("dragging-card");
      items.forEach((el) => el.classList.remove("drag-over-card"));
    };

    li.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      // Làm sáng viền card khi rê chuột qua để nhận diện vùng thả
      items.forEach((el) => {
        if (el !== li) el.classList.remove("drag-over-card");
      });
      li.classList.add("drag-over-card");
    };

    li.ondragleave = () => {
      li.classList.remove("drag-over-card");
    };

    li.ondrop = (e) => {
      e.preventDefault();
      li.classList.remove("drag-over-card");

      const targetIndex = idx;

      if (draggedIndex !== null && draggedIndex !== targetIndex) {
        // LOGIC THAY THẾ TRỰC TIẾP (SWAP): Đổi chỗ 2 phần tử cho nhau trong mảng
        const temp = dataArray[draggedIndex];
        dataArray[draggedIndex] = dataArray[targetIndex];
        dataArray[targetIndex] = temp;

        if (typeof onReorderCallback === "function") {
          onReorderCallback(dataArray);
        }
      }
      draggedIndex = null;
    };
  });
};
