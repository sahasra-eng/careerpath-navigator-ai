import { apiGet, qs } from "../lib/http.js";
import { setProfile } from "../lib/store.js";
import { chips, el, emptyState, esc, spinner, toast } from "../lib/ui.js";
import { navigate } from "../router.js";

let cache = null;
let filter = { category: "All", q: "" };

function careerCard(c) {
  return `
  <article class="card hover" data-testid="career-card-${esc(c.id)}">
    <div class="row" style="justify-content:space-between;align-items:flex-start">
      <div><span class="chip chip-cyan">${esc(c.category)}</span></div>
      <span class="chip">${esc(c.difficulty)}</span>
    </div>
    <h3 style="margin-top:.85rem">${esc(c.name)}</h3>
    <p class="muted" style="margin-bottom:.75rem">${esc(c.description)}</p>
    <p style="margin:0 0 .25rem"><strong style="color:#fff;font-size:1.05rem">${esc(c.salary)}</strong></p>
    <p class="muted" style="font-size:.76rem;margin-bottom:.85rem">Indicative entry-level range in India — not a guarantee.</p>
    <p class="muted" style="margin:0 0 .35rem;font-size:.8rem">Core skills</p>
    <div class="row" style="margin-bottom:.75rem">${chips(c.core_skills)}</div>
    <p class="muted" style="margin:0 0 .35rem;font-size:.8rem">Typical projects</p>
    <div class="row" style="margin-bottom:1rem">${chips(c.projects, "chip chip-lime")}</div>
    <button class="btn btn-ghost btn-sm" type="button" data-explore="${esc(c.id)}" data-testid="explore-career-${esc(c.id)}">Explore ${esc(c.name)}</button>
  </article>`;
}

async function openDetail(id) {
  const back = el(`<div class="modal-back" data-testid="career-detail-modal"><div class="modal">${spinner("Loading career details…")}</div></div>`);
  document.body.append(back);
  document.body.style.overflow = "hidden";
  const close = () => {
    back.remove();
    document.body.style.overflow = "";
  };
  back.addEventListener("click", (e) => {
    if (e.target === back) close();
  });
  document.addEventListener("keydown", function onEsc(e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", onEsc);
    }
  });

  try {
    const d = await apiGet(`/careers/${encodeURIComponent(id)}`);
    back.querySelector(".modal").innerHTML = `
      <div class="modal-head">
        <div>
          <span class="chip chip-cyan">${esc(d.category)}</span>
          <h2 style="margin:.6rem 0 .2rem">${esc(d.name)}</h2>
          <p class="muted" style="margin:0">${esc(d.description)}</p>
        </div>
        <button class="icon-btn" type="button" data-close aria-label="Close" data-testid="career-detail-close">✕</button>
      </div>

      <div class="grid g2" style="margin-bottom:1.25rem">
        <div class="glass">
          <p class="muted" style="margin:0 0 .2rem;font-size:.78rem">Entry-level salary guidance</p>
          <strong style="color:#fff;font-size:1.25rem" data-testid="career-detail-salary">${esc(d.salary)}</strong>
          <p class="muted" style="margin:.35rem 0 0;font-size:.76rem">Indicative range in India. Varies by city, company and skills.</p>
        </div>
        <div class="glass">
          <p class="muted" style="margin:0 0 .2rem;font-size:.78rem">Beginner difficulty</p>
          <strong style="color:#fff;font-size:1.25rem">${esc(d.difficulty)}</strong>
          <p class="muted" style="margin:.35rem 0 0;font-size:.76rem">${esc(d.learning_curve)}</p>
        </div>
      </div>

      <h3>Typical responsibilities</h3>
      <ul style="margin-bottom:1.25rem">${d.responsibilities.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>

      <h3>Core skills</h3>
      <div style="margin-bottom:1.25rem">
        ${d.skills
          .map(
            (s) => `<div class="row" style="justify-content:space-between;border-bottom:1px solid rgba(120,170,220,.14);padding:.5rem 0">
              <span style="color:#fff;font-weight:600">${esc(s.name)}</span>
              <span class="row"><span class="chip ${s.importance === "high" ? "chip-cyan" : ""}">${esc(s.importance)} importance</span><span class="chip">target: ${esc(s.target_level)}</span><span class="chip">~${s.hours}h</span></span>
            </div>`,
          )
          .join("")}
      </div>

      <h3>Important tools</h3>
      <div class="row" style="margin-bottom:1.25rem">${chips(d.tools, "chip chip-lime")}</div>

      <h3>Learning path</h3>
      <p class="muted">${d.learning_path.map(esc).join(" → ")}</p>

      <h3 style="margin-top:1.25rem">Typical projects</h3>
      <div class="grid g2" style="margin-bottom:1.25rem">
        ${d.project_details
          .map(
            (p) => `<div class="glass">
              <strong style="color:#fff">${esc(p.name)}</strong>
              <div class="row" style="margin:.4rem 0"><span class="chip">${esc(p.difficulty)}</span><span class="chip">~${p.hours}h</span></div>
              <p class="muted" style="margin:0 0 .4rem;font-size:.84rem">${esc(p.outcome)}</p>
              <div class="row">${chips(p.skills)}</div>
            </div>`,
          )
          .join("")}
      </div>

      <h3>Possible future roles</h3>
      <div class="row" style="margin-bottom:1.25rem">${chips(d.next_roles)}</div>

      <h3>Recommended resources</h3>
      <div class="grid g2" style="margin-bottom:1.5rem">
        ${d.resources
          .map(
            (r) => `<a class="glass" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" style="display:block" data-testid="career-detail-resource">
              <strong style="color:#fff">${esc(r.title)}</strong>
              <p class="muted" style="margin:.3rem 0 0;font-size:.82rem">${esc(r.platform)} · ${esc(r.format)} · ${r.free ? "Free" : "Paid"}</p>
            </a>`,
          )
          .join("")}
      </div>

      <div class="row">
        <button class="btn btn-primary" type="button" data-start="${esc(d.id)}" data-testid="career-detail-start-roadmap">Start My Roadmap →</button>
        <button class="btn btn-ghost" type="button" data-close>Close</button>
      </div>`;

    back.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
    const startBtn = back.querySelector("[data-start]");
    startBtn.addEventListener("click", () => {
      setProfile({ targetCareer: d.id, customCareer: "" });
      close();
      navigate("/navigator");
      toast(`Target set: ${d.name}`);
    });
    back.querySelector("[data-close]").focus();
  } catch (err) {
    back.querySelector(".modal").innerHTML = `${emptyState("Couldn't load this career", err.message, "career-detail-error")}
      <div class="row" style="justify-content:center;margin-top:1rem"><button class="btn btn-ghost" type="button" data-close>Close</button></div>`;
    back.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  }
}

async function renderList(host) {
  host.innerHTML = spinner("Loading careers…");
  try {
    const data = await apiGet(`/careers${qs({ category: filter.category, q: filter.q })}`);
    cache = data;
    host.innerHTML = data.careers.length
      ? `<div class="grid g3" data-testid="careers-grid">${data.careers.map(careerCard).join("")}</div>`
      : emptyState("No careers match that search", "Try a different keyword, or enter a custom career below.", "careers-empty");
    host.querySelectorAll("[data-explore]").forEach((b) =>
      b.addEventListener("click", () => openDetail(b.dataset.explore)),
    );
  } catch (err) {
    host.innerHTML = emptyState("Careers couldn't load", err.message, "careers-error");
  }
}

async function renderCompare(host, leftId, rightId) {
  host.innerHTML = spinner("Comparing careers…");
  try {
    const d = await apiGet(`/compare${qs({ left: leftId, right: rightId })}`);
    const rows = [
      ["Role", (c) => esc(c.name)],
      ["Category", (c) => esc(c.category)],
      ["Salary range (indicative)", (c) => esc(c.salary)],
      ["Difficulty", (c) => esc(c.difficulty)],
      ["Learning curve", (c) => esc(c.learning_curve)],
      ["Core skills", (c) => c.skills.slice(0, 6).map((s) => esc(s.name)).join(", ")],
      ["Tools", (c) => c.tools.map(esc).join(", ") || "—"],
      ["Typical projects", (c) => c.project_details.map((p) => esc(p.name)).join(", ")],
      ["Possible next roles", (c) => c.next_roles.map(esc).join(", ")],
    ];
    host.innerHTML = `
      <div class="card" data-testid="compare-result">
        <p class="muted" style="margin:0 0 1rem">${esc(d.summary)} ${d.ai ? '<span class="chip chip-cyan">AI</span>' : ""}</p>
        <div style="overflow-x:auto">
          <table class="tablecmp">
            <thead><tr><th>Compare</th><th>${esc(d.left.name)}</th><th>${esc(d.right.name)}</th></tr></thead>
            <tbody>${rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${r[1](d.left)}</td><td>${r[1](d.right)}</td></tr>`).join("")}</tbody>
          </table>
        </div>
      </div>`;
  } catch (err) {
    host.innerHTML = emptyState("Comparison unavailable", err.message, "compare-error");
  }
}

export async function renderCareers(root) {
  root.innerHTML = `
  <section data-testid="careers-page">
    <span class="eyebrow">Career explorer</span>
    <h2>Find the role you're aiming at</h2>
    <p class="lead">Fourteen entry-level careers, each with real skills, indicative salaries and the projects that get you hired.</p>

    <div class="filters" style="margin-top:1.75rem">
      <div>
        <label class="field-label" for="career-search">Search careers</label>
        <input id="career-search" type="search" placeholder="e.g. data, cloud, design" data-testid="careers-search-input" />
      </div>
      <div>
        <label class="field-label" for="career-category">Category</label>
        <select id="career-category" data-testid="careers-category-select"><option>All</option></select>
      </div>
    </div>

    <div id="careers-host"></div>

    <div class="card" style="margin-top:2rem;border-color:rgba(198,242,78,.28)" data-testid="custom-career-block">
      <h3>Something else in mind?</h3>
      <p class="muted">Enter any career. We'll infer its foundational skills with AI and map verified resources to them.</p>
      <form class="row" data-testid="custom-career-form" style="margin-top:.5rem">
        <label class="sr-only" for="custom-career">Custom career</label>
        <input id="custom-career" style="flex:1;min-width:220px" placeholder="e.g. Game Developer, Robotics Engineer" data-testid="custom-career-input" />
        <button class="btn btn-lime" type="submit" data-testid="custom-career-submit">Build a path for this →</button>
      </form>
    </div>
  </section>

  <section data-testid="compare-section">
    <span class="eyebrow">Compare careers</span>
    <h2>Torn between two paths?</h2>
    <p class="lead">Put two careers side by side before you commit months of study to one.</p>
    <div class="filters" style="margin-top:1.5rem">
      <div>
        <label class="field-label" for="cmp-left">First career</label>
        <select id="cmp-left" data-testid="compare-left-select"></select>
      </div>
      <div>
        <label class="field-label" for="cmp-right">Second career</label>
        <select id="cmp-right" data-testid="compare-right-select"></select>
      </div>
      <div style="display:flex;align-items:flex-end">
        <button class="btn btn-primary" type="button" id="cmp-go" data-testid="compare-submit-button">Compare</button>
      </div>
    </div>
    <div id="compare-host"></div>
  </section>`;

  const host = root.querySelector("#careers-host");
  const search = root.querySelector("#career-search");
  const catSel = root.querySelector("#career-category");
  search.value = filter.q;

  await renderList(host);

  if (cache) {
    catSel.innerHTML = ["All", ...cache.categories].map((c) => `<option${c === filter.category ? " selected" : ""}>${esc(c)}</option>`).join("");
    const opts = cache.careers.length ? cache.careers : [];
    const all = await apiGet("/careers").catch(() => ({ careers: opts }));
    const list = all.careers || opts;
    const optionsHtml = list.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
    const left = root.querySelector("#cmp-left");
    const right = root.querySelector("#cmp-right");
    left.innerHTML = optionsHtml;
    right.innerHTML = optionsHtml;
    left.value = list[0]?.id || "";
    right.value = list[1]?.id || "";
    root.querySelector("#cmp-go").addEventListener("click", () => {
      if (left.value === right.value) return toast("Pick two different careers to compare.", "err");
      renderCompare(root.querySelector("#compare-host"), left.value, right.value);
    });
  }

  let t;
  search.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      filter.q = search.value.trim();
      renderList(host);
    }, 280);
  });
  catSel.addEventListener("change", () => {
    filter.category = catSel.value;
    renderList(host);
  });

  root.querySelector("[data-testid='custom-career-form']").addEventListener("submit", (e) => {
    e.preventDefault();
    const value = root.querySelector("#custom-career").value.trim();
    if (!value) return toast("Type a career first.", "err");
    setProfile({ targetCareer: "other", customCareer: value });
    navigate("/navigator");
  });
}
