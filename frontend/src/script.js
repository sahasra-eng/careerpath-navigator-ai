import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/plus-jakarta-sans";
import "./style.css";

import { apiPost } from "./lib/http.js";
import { state } from "./lib/store.js";
import { el, esc, toast } from "./lib/ui.js";
import { startRouter } from "./router.js";

/* ---------- mobile nav ---------- */
const toggle = document.querySelector(".nav-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
toggle?.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  if (open) mobileMenu.setAttribute("hidden", "");
  else mobileMenu.removeAttribute("hidden");
});

/* ---------- AI career coach ---------- */
const fab = document.querySelector(".coach-fab");
const panel = document.querySelector("#coach-panel");
const log = panel.querySelector(".coach-log");
const form = panel.querySelector(".coach-form");
const input = panel.querySelector("#coach-input");
const suggestionsWrap = panel.querySelector(".coach-suggestions");
const contextLine = panel.querySelector("[data-testid='coach-context-line']");

const SUGGESTIONS = [
  "What should I learn first?",
  "Am I ready for an internship?",
  "What project should I build?",
  "I only have 5 hours a week — what matters most?",
  "Why does this skill matter?",
];

let started = false;

/** Escape, then render the only markdown the coach uses: **bold** and leading bullets. */
function fmt(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\s*[-*]\s+/gm, "• ");
}

function addMessage(text, who) {
  const node = el(`<div class="msg ${who}" data-testid="coach-message-${who}">${who === "bot" ? fmt(text) : esc(text)}</div>`);
  log.append(node);
  log.scrollTop = log.scrollHeight;
  return node;
}

function refreshContextLine() {
  if (state.analysis) {
    const a = state.analysis;
    contextLine.textContent = `Using ${a.profile.name}'s profile · ${a.career.name} · ${a.readiness}% ready`;
  } else {
    contextLine.textContent = "Run the Navigator and I'll answer using your own profile";
  }
}

function drawSuggestions() {
  suggestionsWrap.innerHTML = SUGGESTIONS.map(
    (s) => `<button type="button" class="btn btn-ghost btn-sm" data-suggestion="${esc(s)}" data-testid="coach-suggestion">${esc(s)}</button>`,
  ).join("");
  suggestionsWrap.querySelectorAll("[data-suggestion]").forEach((b) =>
    b.addEventListener("click", () => {
      input.value = b.dataset.suggestion;
      form.requestSubmit();
    }),
  );
}

function openCoach() {
  panel.removeAttribute("hidden");
  fab.setAttribute("aria-expanded", "true");
  refreshContextLine();
  if (!started) {
    started = true;
    addMessage("Hey 👋 I'm your AI Career Coach. What are you working on?", "bot");
    drawSuggestions();
  }
  input.focus();
}

function closeCoach() {
  panel.setAttribute("hidden", "");
  fab.setAttribute("aria-expanded", "false");
  fab.focus();
}

fab.addEventListener("click", () => (panel.hasAttribute("hidden") ? openCoach() : closeCoach()));
panel.querySelector("[data-coach-close]").addEventListener("click", closeCoach);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !panel.hasAttribute("hidden")) closeCoach();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = input.value.trim();
  if (!question) {
    toast("Type a question for the coach.", "err");
    return;
  }
  addMessage(question, "me");
  input.value = "";
  const thinking = addMessage("Thinking…", "bot");
  const btn = form.querySelector("button[type='submit']");
  btn.disabled = true;
  try {
    const res = await apiPost("/chat", {
      question,
      studentProfile: state.profile,
      latestAnalysis: state.analysis,
    });
    thinking.innerHTML = fmt(res.answer);
    thinking.dataset.ai = String(res.ai);
  } catch (err) {
    thinking.textContent = `I couldn't reach the coach just now. ${err.message}`;
  } finally {
    btn.disabled = false;
    log.scrollTop = log.scrollHeight;
    input.focus();
  }
});

drawSuggestions();
startRouter();
