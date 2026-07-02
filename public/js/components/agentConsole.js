// AgentConsole — renders the interleaved agent-step / message timeline for
// the selected Transfer, and keeps a plain-text mirror for the Copy button.

let consoleText = "";

export function renderAgentConsole(agentSteps, messages) {
  const events = [
    ...agentSteps.map((s) => ({ kind: "step", at: s.created_at, ...s })),
    ...messages.map((m) => ({ kind: "message", at: m.createdAt ?? m.created_at, ...m })),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));

  const consoleEl = document.getElementById("agent-console");
  consoleEl.innerHTML = events.map(eventHtml).join("");
  consoleEl.scrollTop = consoleEl.scrollHeight;

  consoleText = events.map(eventText).join("\n\n");
}

export function initConsoleCopy() {
  document.getElementById("console-copy-btn").addEventListener("click", async () => {
    const btn = document.getElementById("console-copy-btn");
    try {
      await navigator.clipboard.writeText(consoleText);
      btn.textContent = "Copied!";
    } catch {
      btn.textContent = "Copy failed";
    }
    setTimeout(() => (btn.textContent = "Copy"), 1500);
  });
}

function eventHtml(e) {
  if (e.kind === "step") {
    const args = typeof e.tool_args === "string" ? e.tool_args : JSON.stringify(e.tool_args);
    return `<div class="line"><span class="thought">thought:</span> ${e.thought}<br/><span class="tool">-> ${e.tool_name}(${args})</span></div>`;
  }
  return `<div class="line message-${e.sender}">[${e.sender}] ${e.body}</div>`;
}

function eventText(e) {
  if (e.kind === "step") {
    const args = typeof e.tool_args === "string" ? e.tool_args : JSON.stringify(e.tool_args);
    return `thought: ${e.thought}\n-> ${e.tool_name}(${args})`;
  }
  return `[${e.sender}] ${e.body}`;
}
