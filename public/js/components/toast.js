// Toast — transient top-center callouts over the map. Used for the explicit
// "what just moved, between which sites" announcement when a Transfer's
// logistics step completes (#13), so the operator isn't left inferring the
// move from two panels updating at once.

const TOAST_MS = 7000;

function ensureRoot() {
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "toast-root";
    root.setAttribute("aria-live", "polite");
    document.body.appendChild(root);
  }
  return root;
}

// `html` is trusted template markup — callers must escape any dynamic text
// they interpolate into it (see main.js's dispatch callout).
export function showToast(html) {
  const root = ensureRoot();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = html;
  root.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("toast--visible"));
  setTimeout(() => {
    toast.classList.remove("toast--visible");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    setTimeout(() => toast.remove(), 1000); // fallback if no transition fires
  }, TOAST_MS);
}
