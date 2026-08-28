import { apiGet, qs } from "../lib/http.js";
import { chips, emptyState, esc, spinner } from "../lib/ui.js";

let meta = null;
const f = { q: "", skill: "All", career: "All", difficulty: "All", format: "All", free: false };

function resourceCard(r) {
  return `
  <article class="card hover" data-testid="resource-card">
    <div class="row" style="justify-content:space-between;align-items:flex-start">
      <span class="chip chip-cyan">${esc(r.platform)}</span>
      <span class="chip ${r.free ? "chip-lime" : "chip-warn"}">${r.free ? "Free" : "Paid"}</span>
    </div>
    <h3 style="margin-top:.85rem">${esc(r.title)}</h3>
    <p class="muted" style="margin-bottom:.75rem">${esc(r.description)}</p>
    <div class="row" style="margin-bottom:.6rem">${chips(r.skills.slice(0, 4))}</div>
    <div class="row" style="margin-bottom:1rem"><span class="chip">${esc(r.difficulty)}</span><span class="chip">${esc(r.format)}</span></div>
    <a class="btn btn-primary btn-sm" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" data-testid="resource-learn-button">Learn →</a>
  </article>`;
}

async function load(host, countEl) {
  host.innerHTML = spinner("Finding resources…");
  try {
    const data = await apiGet(`/resources${qs(f)}`);
    meta = meta || data;
    countEl.textContent = `${data.total} resource${data.total === 1 ? "" : "s"}`;
    host.innerHTML = data.resources.length
      ? `<div class="grid g3" data-testid="resources-grid">${data.resources.map(resourceCard).join("")}</div>`
      : emptyState("No resources match those filters", "Try clearing a filter or searching a broader term like 'sql' or 'design'.", "resources-empty");
  } catch (err) {
    host.innerHTML = emptyState("Resource library unavailable", err.message, "resources-error");
  }
}

export async function renderLearn(root) {
  root.innerHTML = `
  <section data-testid="learn-page">
    <span class="eyebrow">Where to learn</span>
    <h2>A library you can trust</h2>
    <p class="lead">Every link here is human-verified and stored on our backend. The AI never invents a URL.</p>

    <div class="filters" style="margin-top:1.75rem">
      <div>
        <label class="field-label" for="res-q">Search</label>
        <input id="res-q" type="search" placeholder="e.g. sql, power bi, ux" data-testid="resources-search-input" />
      </div>
      <div><label class="field-label" for="res-skill">Skill</label><select id="res-skill" data-testid="resources-skill-select"></select></div>
      <div><label class="field-label" for="res-career">Career</label><select id="res-career" data-testid="resources-career-select"></select></div>
      <div><label class="field-label" for="res-diff">Difficulty</label><select id="res-diff" data-testid="resources-difficulty-select"></select></div>
      <div><label class="field-label" for="res-format">Learning type</label><select id="res-format" data-testid="resources-format-select"></select></div>
      <div style="display:flex;align-items:flex-end;gap:1rem;flex-wrap:wrap">
        <label class="check"><input type="checkbox" id="res-free" data-testid="resources-free-checkbox" /> Free resources only</label>
        <button class="btn btn-ghost btn-sm" type="button" id="res-clear" data-testid="resources-clear-button">Clear</button>
      </div>
    </div>

    <p class="muted" data-testid="resources-count" style="margin-bottom:1rem">Loading…</p>
    <div id="res-host"></div>
  </section>`;

  const host = root.querySelector("#res-host");
  const countEl = root.querySelector("[data-testid='resources-count']");

  const bootstrap = await apiGet("/resources").catch(() => null);
  if (!bootstrap) {
    host.innerHTML = emptyState("Resource library unavailable", "We couldn't reach the resource database. Please retry in a moment.", "resources-error");
    countEl.textContent = "";
    return;
  }
  meta = bootstrap;
  const careers = await apiGet("/careers").catch(() => ({ careers: [] }));

  const fill = (sel, values, labelFn = (v) => v) => {
    sel.innerHTML = ["All", ...values].map((v) => (v === "All" ? '<option value="All">All</option>' : `<option value="${esc(typeof v === "string" ? v : v.id)}">${esc(labelFn(v))}</option>`)).join("");
  };
  fill(root.querySelector("#res-skill"), meta.skills);
  fill(root.querySelector("#res-career"), careers.careers, (c) => c.name);
  fill(root.querySelector("#res-diff"), meta.difficulties);
  fill(root.querySelector("#res-format"), meta.formats);

  const q = root.querySelector("#res-q");
  let t;
  q.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      f.q = q.value.trim();
      load(host, countEl);
    }, 280);
  });
  const bind = (id, key) =>
    root.querySelector(id).addEventListener("change", (e) => {
      f[key] = e.target.value;
      load(host, countEl);
    });
  bind("#res-skill", "skill");
  bind("#res-career", "career");
  bind("#res-diff", "difficulty");
  bind("#res-format", "format");
  root.querySelector("#res-free").addEventListener("change", (e) => {
    f.free = e.target.checked;
    load(host, countEl);
  });
  root.querySelector("#res-clear").addEventListener("click", () => {
    Object.assign(f, { q: "", skill: "All", career: "All", difficulty: "All", format: "All", free: false });
    q.value = "";
    root.querySelector("#res-free").checked = false;
    ["#res-skill", "#res-career", "#res-diff", "#res-format"].forEach((s) => (root.querySelector(s).value = "All"));
    load(host, countEl);
  });

  await load(host, countEl);
}
