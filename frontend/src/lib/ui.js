export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/** Build a DOM node from an HTML string. */
export function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function toast(message, kind = "ok") {
  const wrap = document.querySelector(".toast-wrap");
  if (!wrap) return;
  const node = el(`<div class="toast ${kind === "err" ? "err" : ""}" role="status" data-testid="toast">${esc(message)}</div>`);
  wrap.append(node);
  setTimeout(() => {
    node.style.opacity = "0";
    setTimeout(() => node.remove(), 300);
  }, 4200);
}

export function spinner(label = "Loading…") {
  return `<div class="analysing" data-testid="loading-state"><div class="spinner"></div><p class="muted">${esc(label)}</p></div>`;
}

export function emptyState(title, body, testid = "empty-state") {
  return `<div class="empty" data-testid="${testid}"><h3>${esc(title)}</h3><p class="muted">${esc(body)}</p></div>`;
}

export function chips(items, cls = "chip") {
  return (items || []).map((i) => `<span class="${cls}">${esc(i)}</span>`).join("");
}

export function meter(pct, testid) {
  const v = Math.max(0, Math.min(100, Number(pct) || 0));
  return `<div class="meter" role="progressbar" aria-valuenow="${v}" aria-valuemin="0" aria-valuemax="100"${testid ? ` data-testid="${testid}"` : ""}><span style="width:${v}%"></span></div>`;
}

export function dial(pct, testid = "readiness-dial") {
  const v = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
  const r = 76;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - v / 100);
  return `
  <div class="dial" data-testid="${testid}">
    <svg width="176" height="176" viewBox="0 0 176 176" aria-hidden="true">
      <defs><linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#35e0d0" /><stop offset="100%" stop-color="#c6f24e" />
      </linearGradient></defs>
      <circle class="track" cx="88" cy="88" r="${r}"></circle>
      <circle class="prog" cx="88" cy="88" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${offset}"></circle>
    </svg>
    <div class="dial-value"><strong data-testid="readiness-value">${v}%</strong><span>Career readiness</span></div>
  </div>`;
}

export function scrollTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
