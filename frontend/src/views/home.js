import { esc } from "../lib/ui.js";

const FLOW = [
  ["Current profile", "Where you are today"],
  ["Skill analysis", "What you can actually do"],
  ["Target career", "Where you want to go"],
  ["Roadmap", "Week by week, built for your hours"],
  ["Career ready", "Proof, not just certificates"],
];

const PROBLEMS = [
  ["Too many career choices", "Fourteen job titles sound good. Nobody tells you which one fits you."],
  ["Too many courses", "Endless playlists, no order, no idea what to open first."],
  ["Unclear skills", "You don't know which skills a hiring manager actually checks for."],
  ["No personal plan", "Generic roadmaps assume you have 40 free hours a week."],
  ["Certificates without proof", "A certificate says you watched. A project says you can."],
  ["No progress measurement", "You can't tell whether four months of effort moved you."],
  ["No mentor at 11pm", "The moment you're confused is rarely office hours."],
];

const FEATURES = [
  ["🧭", "AI Career Discovery", "A six-question quiz that suggests three careers that fit how you actually think."],
  ["🔍", "Skill-Gap Analyzer", "Compares your real skill levels and confidence against the role's foundations."],
  ["📊", "Career Readiness Score", "One honest number, calculated from your answers — never a guess."],
  ["🗺️", "Personalized Roadmap", "A week-by-week plan sized to the hours you truly have."],
  ["📚", "Learning Resource Finder", "Verified, human-checked links only. No invented URLs, ever."],
  ["🛠️", "Project Builder", "Projects matched to your current level, with deliverables spelled out."],
  ["🎯", "Internship Readiness", "A candid checklist of what's ready and what isn't."],
  ["📈", "Progress Tracker", "Mark skills, weeks and projects as you move through them."],
  ["🤖", "AI Career Coach", "Ask anything — it answers using your profile, not generic advice."],
];

export function renderHome(root) {
  root.innerHTML = `
  <section class="hero rise" data-testid="hero-section">
    <div>
      <span class="badge" data-testid="hero-badge">✦ Personalized career intelligence</span>
      <h1 style="margin-top:1rem">From where you are <span class="arrow">→</span><br />to where you want to be</h1>
      <p class="lead">Tell us where you are, where you want to go, what you already know and how much time you have.
      We'll turn that into a realistic career path.</p>
      <div class="hero-ctas">
        <a class="btn btn-primary" href="/navigator" data-link data-testid="hero-build-roadmap-button">Build My Roadmap →</a>
        <a class="btn btn-ghost" href="/learn" data-link data-testid="hero-browse-resources-button">Browse Learning Resources</a>
      </div>
      <p style="margin-top:1rem"><a class="btn-link" href="/navigator?quiz=1" data-link data-testid="hero-quiz-link">Not sure what career fits me?</a></p>
      <div class="hero-stats">
        <div><strong>14</strong><span>careers mapped</span></div>
        <div><strong>35+</strong><span>verified resources</span></div>
        <div><strong>0</strong><span>invented links</span></div>
      </div>
    </div>

    <div class="card flowcard" data-testid="hero-visual">
      <div class="between" style="margin-bottom:1rem">
        <div>
          <span class="eyebrow">How it works</span>
          <h3 style="margin:0">Your navigation path</h3>
        </div>
        <span class="chip chip-lime">Sample</span>
      </div>
      ${FLOW.map(
        (f, i) => `
        <div class="flow-step">
          <span class="num">${i + 1}</span>
          <span><strong>${esc(f[0])}</strong><br /><span class="muted">${esc(f[1])}</span></span>
        </div>
        ${i < FLOW.length - 1 ? '<div class="flow-arrow" aria-hidden="true">↓</div>' : ""}`,
      ).join("")}
      <div class="glass" style="margin-top:1rem">
        <p class="muted" style="margin-bottom:.5rem">Example skills tracked</p>
        <div class="row">
          <span class="chip chip-cyan">SQL</span><span class="chip chip-cyan">Python</span>
          <span class="chip">Excel</span><span class="chip">Power BI</span><span class="chip">Git</span>
        </div>
        <div style="margin-top:1rem">
          <div class="row" style="justify-content:space-between">
            <span class="muted">Sample readiness</span><strong style="color:#fff">68%</strong>
          </div>
          <div class="meter" style="margin-top:.4rem" aria-hidden="true"><span style="width:68%"></span></div>
          <p class="muted" style="margin:.6rem 0 0;font-size:.78rem">Illustration only — your real score is calculated from your own answers.</p>
        </div>
      </div>
    </div>
  </section>

  <section data-testid="why-section">
    <span class="eyebrow">Why this platform</span>
    <h2>Choosing a career is easy.<br />Knowing what to do next isn't.</h2>
    <p class="lead">These are the seven things students tell us keep them stuck.</p>
    <div class="grid g3" style="margin-top:1.75rem">
      ${PROBLEMS.map(
        (p) => `
        <article class="card hover">
          <h3>${esc(p[0])}</h3>
          <p class="muted" style="margin:0">${esc(p[1])}</p>
        </article>`,
      ).join("")}
    </div>
    <div class="glass" style="margin-top:1.5rem;border-color:rgba(53,224,208,.3)">
      <h3 style="margin:0">Career &amp; Skilling Navigator turns uncertainty into a clear next step.</h3>
      <p class="muted" style="margin:.4rem 0 0">One profile in. A readiness score, prioritised gaps, verified resources, a roadmap and a project out.</p>
    </div>
  </section>

  <section data-testid="features-section">
    <span class="eyebrow">Core features</span>
    <h2>Nine tools, one direction</h2>
    <div class="grid g3" style="margin-top:1.75rem">
      ${FEATURES.map(
        (f) => `
        <article class="card hover" data-testid="feature-card">
          <div class="card-icon" aria-hidden="true">${f[0]}</div>
          <h3>${esc(f[1])}</h3>
          <p class="muted" style="margin:0">${esc(f[2])}</p>
        </article>`,
      ).join("")}
    </div>
  </section>

  <section data-testid="home-cta-section">
    <div class="card" style="text-align:center;padding:2.5rem 1.5rem;border-color:rgba(53,224,208,.28)">
      <h2 style="margin-bottom:.5rem">Ready to see where you stand?</h2>
      <p class="lead" style="margin:0 auto 1.5rem">Six short steps. No signup. You'll leave with a plan you can start tonight.</p>
      <div class="row" style="justify-content:center">
        <a class="btn btn-primary" href="/navigator" data-link data-testid="cta-build-roadmap-button">Build My Roadmap →</a>
        <a class="btn btn-ghost" href="/careers" data-link data-testid="cta-explore-careers-button">Explore careers first</a>
      </div>
    </div>
  </section>`;
}
