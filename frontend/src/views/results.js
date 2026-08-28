import { reset, setProgress, state } from "../lib/store.js";
import { chips, dial, esc, meter, scrollTop, toast } from "../lib/ui.js";
import { navigate } from "../router.js";

const SKILL_STATUS = ["Not Started", "Learning", "Practiced", "Completed"];
const STATUS_SCORE = { "Not Started": 0, Learning: 0.35, Practiced: 0.7, Completed: 1 };

function overallProgress(a, progress) {
  const skills = a.missingSkills.map((m) => STATUS_SCORE[progress.skills[m.skill] || "Not Started"]);
  const weeks = a.roadmap.map((w) => (progress.weeks[w.week] ? 1 : 0));
  const projects = a.projects.map((p) => (progress.projects[p.name] ? 1 : 0));
  const all = [...skills, ...weeks, ...projects];
  const pct = all.length ? Math.round((all.reduce((s, v) => s + v, 0) / all.length) * 100) : 0;
  return {
    pct,
    skillsDone: skills.filter((s) => s === 1).length,
    skillsTotal: skills.length,
    weeksDone: weeks.filter(Boolean).length,
    weeksTotal: weeks.length,
    projectsDone: projects.filter(Boolean).length,
    projectsTotal: projects.length,
  };
}

export function renderResults(root) {
  const a = state.analysis;
  if (!a) {
    navigate("/navigator");
    return;
  }
  const p = a.profile;
  const prog = state.progress;
  const o = overallProgress(a, prog);
  const insight = a.aiInsight || a.insight;

  root.innerHTML = `
  <section class="rise" data-testid="results-header">
    <span class="eyebrow">Your results</span>
    <h1 style="font-size:clamp(1.8rem,4vw,2.9rem)" data-testid="results-greeting">${esc(p.name)}, here's where you stand.</h1>
    <div class="grid g4" style="margin-top:1.5rem">
      <div class="glass"><span class="muted" style="font-size:.78rem">Target career</span><br /><strong style="color:#fff" data-testid="results-target-career">${esc(a.career.name)}</strong>${a.career.custom ? ' <span class="chip chip-lime">custom</span>' : ""}</div>
      <div class="glass"><span class="muted" style="font-size:.78rem">Education / year</span><br /><strong style="color:#fff">${esc(p.education)}${p.year ? ` · ${esc(p.year)}` : ""}</strong></div>
      <div class="glass"><span class="muted" style="font-size:.78rem">Hours per day</span><br /><strong style="color:#fff">${esc(p.hoursPerDay)}</strong></div>
      <div class="glass"><span class="muted" style="font-size:.78rem">Days per week</span><br /><strong style="color:#fff">${esc(p.daysPerWeek)}</strong></div>
    </div>
    <div class="row" style="margin-top:1.25rem">
      <button class="btn btn-ghost btn-sm" type="button" data-edit data-testid="edit-profile-button">Edit profile</button>
      <button class="btn btn-primary btn-sm" type="button" data-recalc data-testid="recalculate-button">Recalculate roadmap</button>
      <button class="btn btn-ghost btn-sm" type="button" data-restart data-testid="start-over-button">Start over</button>
    </div>
  </section>

  <section data-testid="readiness-section">
    <span class="eyebrow">Career readiness</span>
    <div class="card" style="border-color:rgba(53,224,208,.28)">
      <div class="grid g2" style="align-items:center">
        <div style="display:grid;place-items:center">${dial(a.readiness)}</div>
        <div>
          <h2 style="margin-bottom:.5rem">${esc(a.career.name)} readiness</h2>
          <p class="muted">${esc(a.readinessExplanation)}</p>
          <p style="color:#dfe9f7" data-testid="results-insight">${esc(insight)}</p>
          <div class="row" style="margin-top:1rem;gap:1.5rem">
            <div><span class="muted" style="font-size:.78rem">Estimated learning effort</span><br /><strong style="color:#fff;font-size:1.4rem;font-family:var(--font-head)" data-testid="estimated-hours">${a.estimatedHours} hours</strong></div>
            <div><span class="muted" style="font-size:.78rem">Estimated duration</span><br /><strong style="color:#fff;font-size:1.4rem;font-family:var(--font-head)" data-testid="estimated-weeks">${a.estimatedWeeks} weeks</strong></div>
            <div><span class="muted" style="font-size:.78rem">Your pace</span><br /><strong style="color:#fff;font-size:1.4rem;font-family:var(--font-head)">${p.hoursPerWeek} h/week</strong></div>
          </div>
          <p class="muted" style="margin-top:1rem;font-size:.78rem">An estimate, not a promise — and reaching 100% doesn't guarantee a job.</p>
        </div>
      </div>
      <details style="margin-top:1.25rem">
        <summary style="cursor:pointer;color:var(--cyan);font-weight:700" data-testid="readiness-breakdown-toggle">See how this was calculated</summary>
        <div style="margin-top:.85rem">
          ${a.readinessBreakdown
            .map(
              (b) => `<div style="margin-bottom:.6rem">
                <div class="row" style="justify-content:space-between"><span style="color:#fff;font-weight:600">${esc(b.skill)}</span><span class="muted">${esc(b.level)} · ${esc(b.confidence)} confidence · ${esc(b.importance)} importance</span></div>
                ${meter(b.score)}
              </div>`,
            )
            .join("")}
        </div>
      </details>
    </div>
  </section>

  <section data-testid="knowledge-section">
    <span class="eyebrow">What do I know?</span>
    <h2>Knowledge you already have</h2>
    <div class="grid g2" style="margin-top:1.25rem">
      <div class="card">
        <h3>Strong</h3>
        ${
          a.knownSkills.strong.length
            ? a.knownSkills.strong
                .map((s) => `<div style="margin-bottom:.75rem" data-testid="strong-skill"><div class="row" style="justify-content:space-between"><strong style="color:#fff">${esc(s.skill)}</strong><span class="chip chip-cyan">${esc(s.level)}</span></div>${meter(s.score)}</div>`)
                .join("")
            : '<p class="muted">Nothing here yet — that\'s completely normal at the start. Your first priority skill will land here soon.</p>'
        }
      </div>
      <div class="card">
        <h3>Developing</h3>
        ${
          a.knownSkills.developing.length
            ? a.knownSkills.developing
                .map((s) => `<div style="margin-bottom:.75rem" data-testid="developing-skill"><div class="row" style="justify-content:space-between"><strong style="color:#fff">${esc(s.skill)}</strong><span class="chip chip-lime">${esc(s.level)}</span></div>${meter(s.score)}</div>`)
                .join("")
            : '<p class="muted">No partial skills recorded. Everything is either solid or still ahead of you.</p>'
        }
      </div>
    </div>
  </section>

  <section data-testid="build-now-section">
    <span class="eyebrow">What can I build?</span>
    <h2>What you can build now</h2>
    <p class="lead">Matched to your current level — beginner-friendly first, then a stretch.</p>
    <div class="grid g3" style="margin-top:1.25rem">
      ${a.projects
        .map(
          (pr) => `<article class="card hover" data-testid="project-card">
            <div class="row" style="justify-content:space-between"><span class="chip chip-cyan">${esc(pr.difficulty)}</span><span class="chip">~${pr.hours}h</span></div>
            <h3 style="margin-top:.85rem">${esc(pr.name)}</h3>
            <p class="muted" style="margin-bottom:.6rem">${esc(pr.why_fits)}</p>
            <p class="muted" style="font-size:.8rem;margin:0 0 .3rem">Skills used</p>
            <div class="row" style="margin-bottom:.75rem">${chips(pr.skills)}</div>
            <p style="color:#dfe9f7;font-size:.88rem;margin:0"><strong>Expected outcome:</strong> ${esc(pr.outcome)}</p>
          </article>`,
        )
        .join("")}
    </div>
  </section>

  <section data-testid="gaps-section">
    <span class="eyebrow">What am I missing?</span>
    <h2>Gaps to close</h2>
    ${
      a.missingSkills.length
        ? `<div class="grid g2" style="margin-top:1.25rem">
      ${a.missingSkills
        .map(
          (m) => `<article class="card" data-testid="gap-card">
            <div class="row" style="justify-content:space-between;align-items:flex-start">
              <h3 style="margin:0">${esc(m.skill)}</h3>
              <span class="chip ${m.importance === "high" ? "chip-cyan" : ""}">${esc(m.importance)} importance</span>
            </div>
            <div class="row" style="margin:.75rem 0"><span class="chip">Current: ${esc(m.current_level)}</span><span class="chip chip-lime">Target: ${esc(m.target_level)}</span><span class="chip">~${m.estimated_hours}h</span></div>
            <p class="muted" style="margin:0">${esc(m.why)}</p>
          </article>`,
        )
        .join("")}
    </div>`
        : '<div class="card" style="margin-top:1.25rem"><p class="muted" style="margin:0">No foundational gaps detected for this role. Shift your energy to building portfolio proof and depth.</p></div>'
    }
  </section>

  ${
    a.prioritySkills.length
      ? `<section data-testid="priorities-section">
    <span class="eyebrow">What should I learn first?</span>
    <h2>Your top ${a.prioritySkills.length} priorities</h2>
    <p class="lead">Don't touch everything at once. Work down this list.</p>
    <div class="grid g3" style="margin-top:1.25rem">
      ${a.prioritySkills
        .map(
          (pr) => `<article class="card hover" data-testid="priority-card">
            <div class="card-icon" aria-hidden="true">${pr.rank}</div>
            <h3>${esc(pr.skill)}</h3>
            <p class="muted" style="margin-bottom:.6rem">${esc(pr.reason)}</p>
            <span class="chip chip-lime">~${pr.estimated_hours} focused hours</span>
          </article>`,
        )
        .join("")}
    </div>
  </section>`
      : ""
  }

  <section data-testid="where-to-learn-section">
    <span class="eyebrow">Where can I learn it?</span>
    <h2>Where to learn</h2>
    <p class="lead">Verified links from our own resource database — matched only to the skills you're missing.</p>
    ${
      a.resources.length
        ? a.resources
            .map(
              (grp) => `<div class="card" style="margin-top:1.25rem" data-testid="resource-group">
                <h3>${esc(grp.skill)}</h3>
                <div class="grid g2" style="margin-top:.75rem">
                  ${grp.items
                    .map(
                      (r) => `<a class="glass" style="display:block" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" data-testid="results-resource-link">
                        <strong style="color:#fff">${esc(r.title)}</strong>
                        <p class="muted" style="margin:.3rem 0 .5rem;font-size:.84rem">${esc(r.description)}</p>
                        <div class="row"><span class="chip">${esc(r.platform)}</span><span class="chip">${esc(r.format)}</span><span class="chip ${r.free ? "chip-lime" : "chip-warn"}">${r.free ? "Free" : "Paid"}</span></div>
                      </a>`,
                    )
                    .join("")}
                </div>
              </div>`,
            )
            .join("")
        : '<div class="card" style="margin-top:1.25rem"><p class="muted" style="margin:0">No gap-specific resources needed right now. Browse the full library from the Learn page.</p></div>'
    }
    <div class="row" style="margin-top:1rem"><a class="btn btn-ghost btn-sm" href="/learn" data-link data-testid="results-browse-library-button">Browse the full library →</a></div>
  </section>

  <section data-testid="roadmap-section">
    <span class="eyebrow">How long will it take?</span>
    <h2>Your personalized roadmap</h2>
    <p class="lead">${a.roadmap.length} week${a.roadmap.length === 1 ? "" : "s"} sized to ${p.hoursPerWeek} hours a week. Tick a week when you finish it.</p>
    <div class="timeline" style="margin-top:1.5rem">
      ${a.roadmap
        .map(
          (w) => `<article class="card tl-item ${prog.weeks[w.week] ? "done" : ""}" data-testid="roadmap-week-${w.week}">
            <div class="row" style="justify-content:space-between;align-items:flex-start">
              <div>
                <span class="chip chip-cyan">Week ${w.week}</span>
                <h3 style="margin:.6rem 0 .1rem">${esc(w.focus)}</h3>
                <p class="muted" style="margin:0;font-size:.84rem">${esc(w.skill)} · ~${w.hours}h this week</p>
              </div>
              <label class="check"><input type="checkbox" data-week="${w.week}" ${prog.weeks[w.week] ? "checked" : ""} data-testid="roadmap-week-${w.week}-checkbox" /> Done</label>
            </div>
            <div class="grid g2" style="margin-top:1rem">
              <div>
                <p class="muted" style="font-size:.8rem;margin:0 0 .3rem">Learn</p>
                <ul>${w.objectives.map((ob) => `<li>${esc(ob)}</li>`).join("")}</ul>
              </div>
              <div>
                <p class="muted" style="font-size:.8rem;margin:0 0 .3rem">Practice</p>
                <p style="color:#dfe9f7;margin:0 0 .75rem">${esc(w.practice)}</p>
                <p class="muted" style="font-size:.8rem;margin:0 0 .3rem">Mini project</p>
                <p style="color:#dfe9f7;margin:0">${esc(w.mini_project)}</p>
              </div>
            </div>
          </article>`,
        )
        .join("")}
    </div>
  </section>

  <section data-testid="portfolio-section">
    <span class="eyebrow">Project portfolio</span>
    <h2>Build proof, not just certificates.</h2>
    <div class="grid g2" style="margin-top:1.25rem">
      ${a.projects
        .map(
          (pr) => `<article class="card" data-testid="portfolio-project-card">
            <div class="row" style="justify-content:space-between;align-items:flex-start">
              <h3 style="margin:0">${esc(pr.name)}</h3>
              <label class="check"><input type="checkbox" data-project="${esc(pr.name)}" ${prog.projects[pr.name] ? "checked" : ""} data-testid="project-done-checkbox" /> Built</label>
            </div>
            <div class="row" style="margin:.75rem 0"><span class="chip">${esc(pr.difficulty)}</span><span class="chip">~${pr.hours}h</span></div>
            <div class="row" style="margin-bottom:.75rem">${chips(pr.skills)}</div>
            <p class="muted" style="font-size:.8rem;margin:0 0 .3rem">Deliverables</p>
            <ul style="margin-bottom:.75rem">${pr.deliverables.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>
            <p style="color:#dfe9f7;font-size:.86rem;margin:0 0 .5rem"><strong>Portfolio value:</strong> ${esc(pr.portfolio_value)}</p>
            <p style="color:#dfe9f7;font-size:.86rem;margin:0 0 .5rem"><strong>What to put on GitHub:</strong> ${esc(pr.github)}</p>
            <p style="color:#dfe9f7;font-size:.86rem;margin:0"><strong>What to mention on your resume:</strong> ${esc(pr.resume)}</p>
          </article>`,
        )
        .join("")}
    </div>
  </section>

  <section data-testid="internship-section">
    <span class="eyebrow">Internship readiness</span>
    <h2>Are you ready to apply?</h2>
    <div class="card" style="margin-top:1.25rem">
      <div class="row" style="justify-content:space-between;align-items:flex-start">
        <div>
          <span class="chip chip-cyan" data-testid="internship-category">${esc(a.internshipReadiness.category)}</span>
          <p style="color:#dfe9f7;margin:.75rem 0 0;max-width:60ch">${esc(a.internshipReadiness.advice)}</p>
        </div>
      </div>
      <div class="grid g2" style="margin-top:1.25rem">
        ${a.internshipReadiness.checks
          .map(
            (c) => `<div class="glass" data-testid="internship-check">
              <div class="row" style="justify-content:space-between"><strong style="color:#fff">${esc(c.label)}</strong><span class="chip">${esc(c.status)}</span></div>
              <p class="muted" style="margin:.4rem 0 0;font-size:.84rem">${esc(c.note)}</p>
            </div>`,
          )
          .join("")}
      </div>
      <p class="muted" style="margin-top:1rem;font-size:.78rem">${esc(a.internshipReadiness.disclaimer)}</p>
    </div>
  </section>

  <section data-testid="progress-section">
    <span class="eyebrow">Progress</span>
    <h2>Track what you've actually done</h2>
    <div class="card" style="margin-top:1.25rem">
      <div class="row" style="justify-content:space-between"><strong style="color:#fff">Overall progress</strong><strong style="color:#fff" data-testid="overall-progress-value">${o.pct}%</strong></div>
      ${meter(o.pct, "overall-progress-meter")}
      <div class="grid g3" style="margin-top:1.25rem">
        <div class="glass"><span class="muted" style="font-size:.78rem">Skills completed</span><br /><strong style="color:#fff" data-testid="skills-progress">${o.skillsDone} / ${o.skillsTotal}</strong></div>
        <div class="glass"><span class="muted" style="font-size:.78rem">Roadmap weeks done</span><br /><strong style="color:#fff" data-testid="weeks-progress">${o.weeksDone} / ${o.weeksTotal}</strong></div>
        <div class="glass"><span class="muted" style="font-size:.78rem">Projects built</span><br /><strong style="color:#fff" data-testid="projects-progress">${o.projectsDone} / ${o.projectsTotal}</strong></div>
      </div>
      ${
        a.missingSkills.length
          ? `<div style="margin-top:1.5rem">
        ${a.missingSkills
          .map((m) => {
            const cur = prog.skills[m.skill] || "Not Started";
            const slug = m.skill.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            return `<div class="skillrow" data-testid="progress-skill-${esc(slug)}">
              <header><strong>${esc(m.skill)}</strong><span class="chip">${esc(cur)}</span></header>
              <div class="opts">${SKILL_STATUS.map(
                (s) => `<button type="button" class="opt" data-skill-status="${esc(m.skill)}" data-status="${esc(s)}" aria-pressed="${cur === s}" data-testid="progress-${esc(slug)}-${esc(s.toLowerCase().replace(/\s+/g, "-"))}">${esc(s)}</button>`,
              ).join("")}</div>
            </div>`;
          })
          .join("")}
      </div>`
          : ""
      }
    </div>
  </section>

  <section data-testid="next-step-section">
    <div class="card" style="text-align:center;border-color:rgba(198,242,78,.3)">
      <h2 style="margin-bottom:.4rem">What should I do next?</h2>
      <p class="lead" style="margin:0 auto 1.25rem">${
        a.prioritySkills.length
          ? `Open week 1 of your roadmap and start ${esc(a.prioritySkills[0].skill)}. Budget ${p.hoursPerWeek} hours this week.`
          : `Start building ${esc(a.projects[0]?.name || "your portfolio project")} this week.`
      }</p>
      <div class="row" style="justify-content:center">
        <button class="btn btn-primary" type="button" data-coach-open data-testid="results-ask-coach-button">Ask the AI Career Coach 🤖</button>
        <a class="btn btn-ghost" href="/learn" data-link>Find a resource</a>
      </div>
    </div>
  </section>`;

  // interactions
  root.querySelectorAll("[data-week]").forEach((cb) =>
    cb.addEventListener("change", () => {
      setProgress("weeks", cb.dataset.week, cb.checked);
      renderResults(root);
    }),
  );
  root.querySelectorAll("[data-project]").forEach((cb) =>
    cb.addEventListener("change", () => {
      setProgress("projects", cb.dataset.project, cb.checked);
      renderResults(root);
    }),
  );
  root.querySelectorAll("[data-skill-status]").forEach((b) =>
    b.addEventListener("click", () => {
      setProgress("skills", b.dataset.skillStatus, b.dataset.status);
      renderResults(root);
    }),
  );

  root.querySelector("[data-edit]").addEventListener("click", async () => {
    const { renderNavigator, goToStep } = await import("./navigator.js");
    goToStep(0);
    renderNavigator(root, { forceWizard: true });
    scrollTop();
  });

  root.querySelector("[data-recalc]").addEventListener("click", async () => {
    const { runAnalysis } = await import("./navigator.js");
    runAnalysis(root);
    scrollTop();
  });

  root.querySelector("[data-restart]").addEventListener("click", async () => {
    const { resetWizard } = await import("./navigator.js");
    reset();
    resetWizard();
    toast("Cleared. Let's start fresh.");
    navigate("/navigator");
  });

  const coachBtn = root.querySelector("[data-coach-open]");
  if (coachBtn) coachBtn.addEventListener("click", () => document.querySelector(".coach-fab")?.click());
}
