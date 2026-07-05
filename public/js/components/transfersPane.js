// TransfersPaneResize — lets the operator continuously resize the left
// pane's width by dragging a handle on its right edge (#26), replacing the
// #16 two-state expand toggle. Width persists across reloads via
// localStorage. Below the #1023px stacked-layout breakpoint the pane is
// already full-width, so the handle is hidden by CSS and this module is a
// no-op there.

const STORAGE_KEY = "an.transfersPaneWidth";
const MIN_WIDTH = 320;
const MAX_WIDTH_CAP = 680;
const MAX_WIDTH_VIEWPORT_FRACTION = 0.5;
const KEYBOARD_STEP = 24;

function maxWidth() {
  return Math.min(MAX_WIDTH_CAP, Math.round(window.innerWidth * MAX_WIDTH_VIEWPORT_FRACTION));
}

function clampWidth(px) {
  return Math.round(Math.min(maxWidth(), Math.max(MIN_WIDTH, px)));
}

export function initTransfersPaneResize() {
  const pane = document.querySelector(".transfers-strip");
  const handle = document.getElementById("transfers-pane-resize-handle");
  if (!pane || !handle) return;

  const setWidth = (px, { persist = true } = {}) => {
    const clamped = clampWidth(px);
    pane.style.width = `${clamped}px`;
    handle.setAttribute("aria-valuenow", String(clamped));
    if (persist) localStorage.setItem(STORAGE_KEY, String(clamped));
    return clamped;
  };

  handle.setAttribute("aria-valuemin", String(MIN_WIDTH));
  handle.setAttribute("aria-valuemax", String(maxWidth()));

  const stored = Number(localStorage.getItem(STORAGE_KEY));
  if (Number.isFinite(stored) && stored > 0) {
    setWidth(stored, { persist: false });
  } else {
    handle.setAttribute("aria-valuenow", String(Math.round(pane.getBoundingClientRect().width)));
  }

  let dragStartX = 0;
  let dragStartWidth = 0;

  const onPointerMove = (event) => {
    setWidth(dragStartWidth + (event.clientX - dragStartX));
  };

  const onPointerUp = (event) => {
    pane.classList.remove("transfers-strip--resizing");
    try {
      handle.releasePointerCapture(event.pointerId);
    } catch {
      /* ignored */
    }
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    dragStartX = event.clientX;
    dragStartWidth = pane.getBoundingClientRect().width;
    pane.classList.add("transfers-strip--resizing");
    // Best-effort: drag tracking itself relies on the window-level listeners
    // below, not on capture, so a capture failure shouldn't block resizing.
    try {
      handle.setPointerCapture(event.pointerId);
    } catch {
      /* ignored */
    }
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    event.preventDefault();
  });

  handle.addEventListener("keydown", (event) => {
    const current = pane.getBoundingClientRect().width;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      setWidth(current + KEYBOARD_STEP);
      event.preventDefault();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      setWidth(current - KEYBOARD_STEP);
      event.preventDefault();
    } else if (event.key === "Home") {
      setWidth(MIN_WIDTH);
      event.preventDefault();
    } else if (event.key === "End") {
      setWidth(maxWidth());
      event.preventDefault();
    }
  });

  window.addEventListener("resize", () => {
    handle.setAttribute("aria-valuemax", String(maxWidth()));
    setWidth(pane.getBoundingClientRect().width, { persist: false });
  });
}
