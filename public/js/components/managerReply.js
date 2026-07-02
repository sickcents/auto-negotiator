import { api } from "../api.js";

// ManagerReplyPanel — presets and the free-text box are two inputs into the
// same sendReply call; there's no separate "scripted" code path (PRD Section 7).
export function initManagerReply({ getSelectedTransferId, onSent }) {
  async function sendReply(body) {
    const id = getSelectedTransferId();
    if (id == null) return;
    await api(`/transfers/${id}/reply`, { method: "POST", body: JSON.stringify({ body }) });
    await onSent();
  }

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => sendReply(btn.dataset.preset));
  });

  document.getElementById("reply-btn").addEventListener("click", () => {
    const input = document.getElementById("reply-text");
    if (input.value.trim()) sendReply(input.value.trim());
    input.value = "";
  });
}
