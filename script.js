const box = document.querySelector("#box");
const img = document.querySelector("#mainImg");
const marker = document.querySelector("#marker");
const output = document.querySelector("#output");
const imageInput = document.querySelector("#imageInput");
const copyBtn = document.querySelector("#copyBtn");
const resetBtn = document.querySelector("#resetBtn");
const imageUrl = document.querySelector("#imageUrl");
const loadUrlBtn = document.querySelector("#loadUrlBtn");

// Load image using URL
loadUrlBtn.addEventListener("click", function () {
  const url = imageUrl.value.trim();

  if (!url) {
    alert("Bro, pehle image URL paste karo!");
    return;
  }

  resetArea();

  img.onload = function () {
    resetArea();
  };

  img.onerror = function () {
    alert("Image load nahi hui. Direct image URL try karo.");
  };

  img.src = url;
});
let area = null;
let action = "";
let startX = 0;
let startY = 0;
let original = null;

// Image load
imageInput.addEventListener("change", function () {
  const file = this.files[0];

  if (!file) return;

  img.src = URL.createObjectURL(file);

  img.onload = function () {
    resetArea();
  };
});

// Start drawing only when no rectangle exists
img.addEventListener("pointerdown", function (e) {
  if (!img.src || area) return;

  e.preventDefault();

  const rect = img.getBoundingClientRect();

  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;

  area = {
    x: startX,
    y: startY,
    w: 1,
    h: 1
  };

  action = "draw";
  marker.style.display = "block";
  updateMarker();

  img.setPointerCapture(e.pointerId);
});

// Move or resize rectangle
marker.addEventListener("pointerdown", function (e) {
  if (!area) return;

  e.preventDefault();
  e.stopPropagation();

  const rect = img.getBoundingClientRect();

  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;

  const handle = e.target.closest(".handle");

  action = handle ? handle.classList[1] : "move";

  original = { ...area };

  marker.setPointerCapture(e.pointerId);
});

// Track pointer movement
function movePointer(e) {
  if (!action || !area) return;

  const rect = img.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const dx = x - startX;
  const dy = y - startY;

  const maxW = img.clientWidth;
  const maxH = img.clientHeight;

  if (action === "draw") {
    area.x = Math.max(0, Math.min(startX, x));
    area.y = Math.max(0, Math.min(startY, y));

    area.w = Math.abs(x - startX);
    area.h = Math.abs(y - startY);
  }

  else if (action === "move") {
    area.x = Math.max(
      0,
      Math.min(maxW - original.w, original.x + dx)
    );

    area.y = Math.max(
      0,
      Math.min(maxH - original.h, original.y + dy)
    );
  }

  else {
    let left = original.x;
    let top = original.y;
    let right = original.x + original.w;
    let bottom = original.y + original.h;

    if (action.includes("l")) {
      left = Math.max(0, Math.min(right - 1, original.x + dx));
    }

    if (action.includes("r")) {
      right = Math.min(maxW, Math.max(left + 1, original.x + original.w + dx));
    }

    if (action.includes("t")) {
      top = Math.max(0, Math.min(bottom - 1, original.y + dy));
    }

    if (action.includes("b")) {
      bottom = Math.min(maxH, Math.max(top + 1, original.y + original.h + dy));
    }

    area.x = left;
    area.y = top;
    area.w = right - left;
    area.h = bottom - top;
  }

  updateMarker();
  generateCSS();
}

img.addEventListener("pointermove", movePointer);
marker.addEventListener("pointermove", movePointer);

// Stop dragging
function stopPointer() {
  action = "";
  original = null;
}

img.addEventListener("pointerup", stopPointer);
marker.addEventListener("pointerup", stopPointer);
img.addEventListener("pointercancel", stopPointer);
marker.addEventListener("pointercancel", stopPointer);

// Update rectangle position
function updateMarker() {
  marker.style.left = area.x + "px";
  marker.style.top = area.y + "px";
  marker.style.width = area.w + "px";
  marker.style.height = area.h + "px";
}

// Generate CSS
function generateCSS() {
  if (!area || !img.naturalWidth) return;

  const scaleX = img.naturalWidth / img.clientWidth;
  const scaleY = img.naturalHeight / img.clientHeight;

  const x = Math.round(area.x * scaleX);
  const y = Math.round(area.y * scaleY);
  const w = Math.round(area.w * scaleX);
  const h = Math.round(area.h * scaleY);

  output.textContent =
`.target-button {
  position: absolute;
  left: ${x}px;
  top: ${y}px;
  width: ${w}px;
  height: ${h}px;
  opacity: 0;
  cursor: pointer;
}`;
}

// Copy CSS
copyBtn.addEventListener("click", async function () {
  try {
    await navigator.clipboard.writeText(output.textContent);
    copyBtn.textContent = "Copied!";

    setTimeout(() => {
      copyBtn.textContent = "Copy CSS";
    }, 1200);
  } catch {
    output.focus?.();
    alert("Copy nahi hua. CSS ko manually select karke copy karo.");
  }
});

// Reset rectangle
function resetArea() {
  area = null;
  action = "";
  original = null;

  marker.style.display = "none";
  output.textContent = "Image load karke area select karo.";
}

resetBtn.addEventListener("click", resetArea);
