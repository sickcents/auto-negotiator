// TransfersPaneExpand — lets the operator widen the left pane for easier
// reading (#16). A two-state toggle (normal / expanded) rather than
// drag-to-resize: the complaint was readability, not needing an arbitrary
// width. Persists via localStorage so the choice survives a reload.

import { icon } from "../icons.js";

const STORAGE_KEY = "an.transfersPaneExpanded";

export function initTransfersPaneExpand() {
  const pane = document.querySelector(".transfers-strip");
  const toggle = document.getElementById("pane-expand-toggle");
  if (!pane || !toggle) return;

  // A single caret, rotated 180deg via CSS when expanded (same convention as
  // .timeline-group__caret) — no separate expand/collapse icon asset needed.
  toggle.innerHTML = icon("caret-right", "pane-expand-toggle__icon");

  const apply = (expanded) => {
    pane.classList.toggle("transfers-strip--expanded", expanded);
    toggle.setAttribute("aria-expanded", String(expanded));
    const label = expanded ? "Collapse pane" : "Expand pane for easier reading";
    toggle.title = label;
    toggle.setAttribute("aria-label", label);
  };

  apply(localStorage.getItem(STORAGE_KEY) === "1");

  toggle.addEventListener("click", () => {
    const expanded = !pane.classList.contains("transfers-strip--expanded");
    apply(expanded);
    localStorage.setItem(STORAGE_KEY, expanded ? "1" : "0");
  });
}
