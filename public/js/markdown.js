// Escape-first Markdown -> HTML.
//
// There is no bundler in this project, so every string that originates from
// an LLM (agent thoughts, drafted email bodies) or a human (manager replies,
// Regional Director overrides) is untrusted and must NEVER reach the DOM as
// raw HTML. The only safe ordering is:
//
//   1. escape ALL HTML entities first, so the source can no longer contain a
//      live "<", ">", "&", quote or apostrophe;
//   2. THEN layer a fixed, closed set of transforms on the already-escaped
//      text. Each transform only ever emits a known tag (<strong>, <em>,
//      <code>, <ul>/<ol>/<li>, <p>) -- it can't reintroduce arbitrary markup
//      because the raw angle brackets are already neutralised.
//
// This is deliberately a *small* subset of Markdown (bold, italic, inline
// code, unordered/ordered lists, paragraphs). It is not a spec-compliant
// parser and doesn't try to be -- it just has to be safe and legible.

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Inline transforms applied to a single ALREADY-escaped line. Inline code is
// pulled out to sentinel tokens first so that any `*`/`_` inside a code span
// is shielded from the bold/italic passes, then restored at the end. The
// sentinels are wrapped in NUL (\x00) -- a byte escapeHtml never emits and
// prose never contains -- so the restore pass can't collide with real digits.
function inline(escaped) {
  const codeSpans = [];
  let out = escaped.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(code);
    return "\x00" + (codeSpans.length - 1) + "\x00";
  });

  out = out
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");

  return out.replace(/\x00(\d+)\x00/g, (_, i) => `<code>${codeSpans[Number(i)]}</code>`);
}

export function renderMarkdown(value) {
  const lines = escapeHtml(value).split(/\r?\n/);
  const out = [];
  let listTag = null; // "ul" | "ol" | null

  const closeList = () => {
    if (listTag) {
      out.push(`</${listTag}>`);
      listTag = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (bullet) {
      if (listTag !== "ul") {
        closeList();
        out.push("<ul>");
        listTag = "ul";
      }
      out.push(`<li>${inline(bullet[1])}</li>`);
    } else if (ordered) {
      if (listTag !== "ol") {
        closeList();
        out.push("<ol>");
        listTag = "ol";
      }
      out.push(`<li>${inline(ordered[1])}</li>`);
    } else if (line.trim() === "") {
      closeList();
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }

  closeList();
  return out.join("");
}
