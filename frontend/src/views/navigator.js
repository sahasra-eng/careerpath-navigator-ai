import { apiGet, apiPost, qs } from "../lib/http.js";
import { setAnalysis, setProfile, state } from "../lib/store.js";
import { el, emptyState, esc, meter, scrollTop, spinner, toast } from "../lib/ui.js";
import { navigate } from "../router.js";
import { renderResults } from "./results.js";

const STEPS = ["Profile", "Career", "Time", "Skills", "Style"];
const EDUCATIONS = ["1st Year CSE", "2nd Year IT", "Final Year ECE", "B.Com Student", "Working Professional", "Looking for my first job", "Other"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Graduate", "Working", "Other"];
const LEVELS = ["Not Yet", "Beginner", "Intermediate", "Strong"];
const CONFIDENCE = ["Low", "Medium", "High"];
const STYLES = ["Video courses", "Interactive practice", "Reading / documentation", "Projects", "A mix of everything"];
const INTERESTS = ["Data", "Websites", "Apps", "AI", "Design", "Cybersecurity", "Business", "Something else"];
const ANALYSIS_STEPS = [
  "Understanding your profile",
  "Evaluating your current skills",
  "Matching your target career",
  "Calculating career readiness",
  "Identifying skill gaps",
  "Estimating learning effort",
  "Selecting learning resources",
  "Building your roadmap",
  "Finding a project you can start now",
];

let step = 0;
let careers = [];
let skillList = [];
let skillsFor = "";

function stepsBar() {
  return `<div class="steps" data-testid="wizard-progress">${STEPS.map(
    (s, i) => `<div class="step ${i < step ? "done" : i === step ? "active" : ""}"><div class="bar"><i></i></div><span>${esc(s)}</span></div>`,
  ).join("")}</div>
  <p class="muted" data-testid="wizard-step-label">Step ${step + 1} of ${STEPS.length} — ${esc(STEPS[step])}</p>`;
}

function optGroup(name, values, current, testid, cls = "opt") {
  return `<div class="opts" data-testid="${testid}">${values
    .map(
      (v) => `<button type="button" class="${cls}" data-group="${esc(name)}" data-value="${esc(v)}" aria-pressed="${String(v) === String(current)}" data-testid="${testid}-${esc(String(v).toLowerCase().replace(/[^a-z0-9]+/g, "-"))}">${esc(v)}</button>`,
    )
    .join("")}</div>`;
}

/* ---------------- steps ---------------- */

function stepProfile(p) {
  return `
  <div class="card rise" data-testid="step-profile">
    <h2>Where are you right now?</h2>
    <p class="muted">Three quick answers. Nothing is stored on a server against your name.</p>
    <div class="field">
      <label for="w-name">What's your name?</label>
      <input id="w-name" value="${esc(p.name)}" placeholder="e.g. Ananya" data-testid="profile-name-input" />
    </div>
    <div class="field">
      <span class="field-label">What are you studying or doing right now?</span>
      ${optGroup("education", EDUCATIONS, p.education, "profile-education-options")}
      <div style="margin-top:.6rem">
        <label class="sr-only" for="w-education">Or type your own</label>
        <input id="w-education" value="${esc(EDUCATIONS.includes(p.education) ? "" : p.education)}" placeholder="Or type your own — e.g. 3rd Year Mechanical" data-testid="profile-education-input" />
      </div>
    </div>
    <div class="field">
      <span class="field-label">What year are you in?</span>
      ${optGroup("year", YEARS, p.year, "profile-year-options")}
      <div style="margin-top:.6rem">
        <label class="sr-only" for="w-year">Or type your own year</label>
        <input id="w-year" value="${esc(YEARS.includes(p.year) ? "" : p.year)}" placeholder="Or type your own" data-testid="profile-year-input" />
      </div>
    </div>
  </div>`;
}

function stepCareer(p) {
  const isOther = p.targetCareer === "other";
  return `
  <div class="card rise" data-testid="step-career">
    <h2>Where do you want to go?</h2>
    <p class="muted">Pick the role you're aiming at. You can change it later and recalculate.</p>
    <div class="grid g3" style="margin:1.25rem 0" data-testid="career-choices">
      ${careers
        .map(
          (c) => `<button type="button" class="pickcard" data-career="${esc(c.id)}" aria-pressed="${p.targetCareer === c.id}" data-testid="career-choice-${esc(c.id)}">
            <strong>${esc(c.name)}</strong>
            <span class="muted" style="font-size:.82rem">${esc(c.salary)} · ${esc(c.difficulty)}</span>
          </button>`,
        )
        .join("")}
      <button type="button" class="pickcard" data-career="other" aria-pressed="${isOther}" data-testid="career-choice-other">
        <strong>Other</strong><span class="muted" style="font-size:.82rem">Something else in mind</span>
      </button>
    </div>
    <div class="field" ${isOther ? "" : 'hidden'} data-other-wrap>
      <label for="w-custom">What career do you have in mind?</label>
      <input id="w-custom" value="${esc(p.customCareer)}" placeholder="e.g. Game Developer" data-testid="career-custom-input" />
      <p class="muted" style="margin:.4rem 0 0">We'll use AI to infer its foundational skills, then map verified resources to them.</p>
    </div>
    <div class="glass" style="margin-top:1.25rem">
      <h3 style="margin:0 0 .3rem">Not sure what career fits you?</h3>
      <p class="muted" style="margin:0 0 .75rem">Answer six questions and we'll suggest three careers that match how you think.</p>
      <button class="btn btn-lime btn-sm" type="button" data-quiz data-testid="open-quiz-button">Take the 6-question quiz ✦</button>
    </div>
  </div>`;
}

function stepTime(p) {
  const perWeek = (Number(p.hoursPerDay) || 0) * (Number(p.daysPerWeek) || 0);
  return `
  <div class="card rise" data-testid="step-time">
    <h2>How much time can you realistically give?</h2>
    <p class="muted">Be honest — an accurate plan beats an ambitious one you abandon.</p>
    <div class="field">
      <span class="field-label">Hours per day</span>
      ${optGroup("hoursPerDay", [1, 2, 3, 4, 5, 6], p.hoursPerDay, "time-hours-options")}
    </div>
    <div class="field">
      <span class="field-label">Days per week</span>
      ${optGroup("daysPerWeek", [1, 2, 3, 4, 5, 6, 7], p.daysPerWeek, "time-days-options", "opt opt-lime")}
    </div>
    <div class="glass" data-testid="time-summary">
      <div class="row" style="gap:2rem">
        <div><span class="muted" style="font-size:.8rem">Hours per week</span><br /><strong style="color:#fff;font-size:1.5rem;font-family:var(--font-head)" data-testid="hours-per-week">${perWeek}</strong></div>
        <div><span class="muted" style="font-size:.8rem">Hours per month</span><br /><strong style="color:#fff;font-size:1.5rem;font-family:var(--font-head)" data-testid="hours-per-month">${Math.round(perWeek * 4.3)}</strong></div>
      </div>
      <p class="muted" style="margin:.9rem 0 0">Consistency matters more than studying for long hours. Even 4 focused hours a week compounds.</p>
    </div>
  </div>`;
}

function stepSkills(p) {
  if (!skillList.length) return `<div class="card">${spinner("Working out which skills this career needs…")}</div>`;
  return `
  <div class="card rise" data-testid="step-skills">
    <h2>What can you already do?</h2>
    <p class="muted">These are the foundational skills for <strong style="color:#fff">${esc(skillsFor)}</strong>. Rate both comfort and real-world confidence.</p>
    <div style="margin-top:1.25rem">
      ${skillList
        .map((s) => {
          const key = s.name;
          const lvl = p.skills[key] || "Not Yet";
          const conf = p.skillConfidence[key] || "Medium";
          const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          return `
          <div class="skillrow" data-testid="skill-row-${esc(slug)}">
            <header>
              <strong>${esc(key)}</strong>
              <span class="row"><span class="chip ${s.importance === "high" ? "chip-cyan" : ""}">${esc(s.importance)} importance</span><span class="chip">target: ${esc(s.target_level)}</span></span>
            </header>
            <p class="sub">How comfortable are you?</p>
            ${optGroup(`skill:${key}`, LEVELS, lvl, `skill-level-${esc(slug)}`)}
            <p class="sub" style="margin-top:.75rem">How confident are you actually using it?</p>
            ${optGroup(`conf:${key}`, CONFIDENCE, conf, `skill-confidence-${esc(slug)}`, "opt opt-lime")}
          </div>`;
        })
        .join("")}
    </div>
  </div>`;
}

function stepStyle(p) {
  return `
  <div class="card rise" data-testid="step-style">
    <h2>How do you learn best?</h2>
    <p class="muted">We use this to order your roadmap and pick which resources to surface first.</p>
    <div class="field">
      <span class="field-label">Preferred learning format</span>
      ${optGroup("learningStyle", STYLES, p.learningStyle, "style-format-options")}
    </div>
    <div class="field">
      <span class="field-label">What kind of projects interest you?</span>
      ${optGroup("projectPreference", INTERESTS, p.projectPreference, "style-interest-options", "opt opt-lime")}
    </div>
    <div class="glass">
      <p class="muted" style="margin:0">Next we'll calculate your readiness, gaps, priorities, verified resources, a week-by-week roadmap and a project you can start now.</p>
    </div>
  </div>`;
}

/* ---------------- quiz ---------------- */

async function openQuiz(rerender) {
  const back = el(`<div class="modal-back" data-testid="quiz-modal"><div class="modal">${spinner("Loading the quiz…")}</div></div>`);
  document.body.append(back);
  document.body.style.overflow = "hidden";
  const close = () => {
    back.remove();
    document.body.style.overflow = "";
  };
  back.addEventListener("click", (e) => e.target === back && close());

  let questions = [];
  try {
    const data = await apiGet("/quiz");
    questions = data.questions;
  } catch (err) {
    back.querySelector(".modal").innerHTML = `${emptyState("Quiz unavailable", err.message, "quiz-error")}<div class="row" style="justify-content:center;margin-top:1rem"><button class="btn btn-ghost" data-close>Close</button></div>`;
    back.querySelector("[data-close]").addEventListener("click", close);
    return;
  }

  const answers = {};
  const modal = back.querySelector(".modal");

  const draw = () => {
    const answered = Object.keys(answers).length;
    modal.innerHTML = `
      <div class="modal-head">
        <div>
          <span class="eyebrow">Career discovery</span>
          <h2 style="margin:0">Which career fits how you think?</h2>
          <p class="muted" style="margin:.35rem 0 0">${answered} of ${questions.length} answered</p>
        </div>
        <button class="icon-btn" data-close aria-label="Close quiz" data-testid="quiz-close-button">✕</button>
      </div>
      ${meter((answered / questions.length) * 100, "quiz-progress")}
      <div style="margin-top:1.25rem">
        ${questions
          .map(
            (q, i) => `<fieldset style="border:0;padding:0;margin:0 0 1.5rem" data-testid="quiz-question-${i + 1}">
              <legend class="field-label" style="padding:0">${i + 1}. ${esc(q.question)}</legend>
              <div class="opts" style="flex-direction:column;align-items:stretch">
                ${q.options
                  .map(
                    (o) => `<button type="button" class="opt" style="text-align:left" data-q="${esc(q.id)}" data-o="${esc(o.id)}" aria-pressed="${answers[q.id] === o.id}" data-testid="quiz-option-${i + 1}-${esc(o.id)}">${esc(o.label)}</button>`,
                  )
                  .join("")}
              </div>
            </fieldset>`,
          )
          .join("")}
      </div>
      <div class="row" style="justify-content:space-between">
        <button class="btn btn-ghost" data-close type="button">Cancel</button>
        <button class="btn btn-primary" type="button" data-submit ${answered < questions.length ? "disabled" : ""} data-testid="quiz-submit-button">See my matches ✦</button>
      </div>`;

    modal.querySelectorAll("[data-q]").forEach((b) =>
      b.addEventListener("click", () => {
        answers[b.dataset.q] = b.dataset.o;
        draw();
      }),
    );
    modal.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
    const sub = modal.querySelector("[data-submit]");
    if (sub) sub.addEventListener("click", submit);
  };

  const submit = async () => {
    modal.innerHTML = spinner("Matching careers…");
    try {
      const res = await apiPost("/quiz", { answers });
      modal.innerHTML = `
        <div class="modal-head">
          <div><span class="eyebrow">Your matches</span><h2 style="margin:0">Three careers that fit you</h2></div>
          <button class="icon-btn" data-close aria-label="Close" data-testid="quiz-results-close">✕</button>
        </div>
        <div class="grid" data-testid="quiz-results">
          ${res.matches
            .map(
              (m, i) => `<div class="glass" data-testid="quiz-match-${i + 1}">
                <div class="row" style="justify-content:space-between">
                  <div><span class="chip chip-cyan">${i === 0 ? "Top match" : i === 1 ? "Second match" : "Third match"}</span>
                  <h3 style="margin:.5rem 0 .1rem">${esc(m.name)}</h3>
                  <p class="muted" style="margin:0;font-size:.82rem">${esc(m.category)} · ${esc(m.salary)}</p></div>
                  <strong style="font-family:var(--font-head);font-size:1.8rem;color:#fff">${m.match}%</strong>
                </div>
                ${meter(m.match)}
                <p class="muted" style="margin:.75rem 0">${esc(m.reason)}</p>
                <button class="btn btn-primary btn-sm" type="button" data-choose="${esc(m.career_id)}" data-testid="quiz-choose-${esc(m.career_id)}">Choose this career</button>
              </div>`,
            )
            .join("")}
        </div>
        <p class="muted" style="margin-top:1rem;font-size:.8rem">A quiz is a nudge, not a verdict. Explore the careers page before you commit.</p>
        <div class="row" style="margin-top:.5rem"><button class="btn btn-ghost" data-close type="button">Close</button></div>`;

      modal.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
      modal.querySelectorAll("[data-choose]").forEach((b) =>
        b.addEventListener("click", () => {
          setProfile({ targetCareer: b.dataset.choose, customCareer: "" });
          skillList = [];
          close();
          toast("Target career set from your quiz results.");
          rerender();
        }),
      );
    } catch (err) {
      modal.innerHTML = `${emptyState("Couldn't score the quiz", err.message, "quiz-submit-error")}<div class="row" style="justify-content:center;margin-top:1rem"><button class="btn btn-ghost" data-close>Close</button></div>`;
      modal.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
    }
  };

  draw();
}

/* ---------------- analysis ---------------- */

export async function runAnalysis(root) {
  const p = state.profile;
  root.innerHTML = `
    <section class="analysing" data-testid="analysis-progress">
      <div class="spinner"></div>
      <h2>Building your career path...</h2>
      <p class="muted">Reading your profile against the role's foundations.</p>
      <ul>${ANALYSIS_STEPS.map((s, i) => `<li data-i="${i}"><span class="tick">✓</span><span>${esc(s)}</span></li>`).join("")}</ul>
    </section>`;
  const items = [...root.querySelectorAll(".analysing li")];
  let i = 0;
  const timer = setInterval(() => {
    if (i < items.length) items[i++].classList.add("on");
  }, 260);

  const payload = {
    name: p.name || "Student",
    education: p.education || "Student",
    year: p.year || "",
    targetCareer: p.targetCareer || null,
    customCareer: p.customCareer || null,
    hoursPerDay: Number(p.hoursPerDay) || 2,
    daysPerWeek: Number(p.daysPerWeek) || 4,
    skills: p.skills,
    skillConfidence: p.skillConfidence,
    learningStyle: p.learningStyle,
    projectPreference: p.projectPreference,
  };

  try {
    const [result] = await Promise.all([apiPost("/analyze", payload), new Promise((r) => setTimeout(r, 2400))]);
    clearInterval(timer);
    items.forEach((it) => it.classList.add("on"));
    setAnalysis(result);
    renderResults(root);
    scrollTop();
  } catch (err) {
    clearInterval(timer);
    root.innerHTML = `<section>${emptyState("We couldn't finish the analysis", err.message, "analysis-error")}
      <div class="row" style="justify-content:center;margin-top:1rem">
        <button class="btn btn-primary" type="button" data-retry data-testid="analysis-retry-button">Try again</button>
      </div></section>`;
    root.querySelector("[data-retry]").addEventListener("click", () => renderNavigator(root));
    toast(err.message, "err");
  }
}

/* ---------------- wizard shell ---------------- */

async function ensureSkills(rerender) {
  const p = state.profile;
  const key = p.targetCareer === "other" ? `custom:${p.customCareer}` : p.targetCareer;
  if (skillsForKey === key && skillList.length) return;
  try {
    const params = p.targetCareer && p.targetCareer !== "other" ? { career: p.targetCareer } : { custom: p.customCareer };
    const data = await apiGet(`/skills${qs(params)}`);
    skillList = data.skills;
    skillsFor = data.career;
    skillsForKey = key;
    rerender();
  } catch (err) {
    toast(err.message, "err");
    skillList = [];
  }
}

let skillsForKey = "";

export async function renderNavigator(root, opts = {}) {
  if (state.analysis && !opts.forceWizard) {
    renderResults(root);
    return;
  }

  if (!careers.length) {
    try {
      const data = await apiGet("/careers");
      careers = data.careers;
    } catch {
      careers = [];
    }
  }

  const rerender = () => draw();

  function draw() {
    const p = state.profile;
    const body =
      step === 0 ? stepProfile(p) : step === 1 ? stepCareer(p) : step === 2 ? stepTime(p) : step === 3 ? stepSkills(p) : stepStyle(p);

    root.innerHTML = `
    <section data-testid="navigator-page">
      <span class="eyebrow">Build my roadmap</span>
      <h2 style="margin-bottom:1.25rem">Five short steps to your plan</h2>
      ${stepsBar()}
      <div style="margin-top:1.5rem">${body}</div>
      <div class="wizard-nav">
        <button class="btn btn-ghost" type="button" data-back ${step === 0 ? "disabled" : ""} data-testid="wizard-back-button">← Back</button>
        ${
          step === STEPS.length - 1
            ? '<button class="btn btn-primary" type="button" data-analyze data-testid="wizard-analyze-button">Analyze My Profile ✦</button>'
            : '<button class="btn btn-primary" type="button" data-next data-testid="wizard-next-button">Continue →</button>'
        }
      </div>
    </section>`;

    // option groups
    root.querySelectorAll("[data-group]").forEach((btn) =>
      btn.addEventListener("click", () => {
        const g = btn.dataset.group;
        const v = btn.dataset.value;
        if (g.startsWith("skill:")) {
          const s = { ...state.profile.skills, [g.slice(6)]: v };
          setProfile({ skills: s });
        } else if (g.startsWith("conf:")) {
          const s = { ...state.profile.skillConfidence, [g.slice(5)]: v };
          setProfile({ skillConfidence: s });
        } else if (g === "hoursPerDay" || g === "daysPerWeek") {
          setProfile({ [g]: Number(v) });
        } else if (g === "education" || g === "year") {
          setProfile({ [g]: v });
        } else {
          setProfile({ [g]: v });
        }
        draw();
      }),
    );

    // text inputs
    const bindText = (sel, key) => {
      const node = root.querySelector(sel);
      if (node) node.addEventListener("input", () => setProfile({ [key]: node.value }));
    };
    bindText("#w-name", "name");
    bindText("#w-custom", "customCareer");
    const eduInput = root.querySelector("#w-education");
    if (eduInput) eduInput.addEventListener("input", () => eduInput.value.trim() && setProfile({ education: eduInput.value }));
    const yearInput = root.querySelector("#w-year");
    if (yearInput) yearInput.addEventListener("input", () => yearInput.value.trim() && setProfile({ year: yearInput.value }));

    // career picks
    root.querySelectorAll("[data-career]").forEach((btn) =>
      btn.addEventListener("click", () => {
        setProfile({ targetCareer: btn.dataset.career, customCareer: btn.dataset.career === "other" ? state.profile.customCareer : "" });
        skillList = [];
        draw();
      }),
    );

    const quizBtn = root.querySelector("[data-quiz]");
    if (quizBtn) quizBtn.addEventListener("click", () => openQuiz(rerender));

    const back = root.querySelector("[data-back]");
    if (back)
      back.addEventListener("click", () => {
        step = Math.max(0, step - 1);
        draw();
        scrollTop();
      });

    const next = root.querySelector("[data-next]");
    if (next)
      next.addEventListener("click", async () => {
        if (step === 0 && !state.profile.name.trim()) return toast("Tell us your name so the plan feels like yours.", "err");
        if (step === 0 && !state.profile.education.trim()) return toast("Pick or type what you're studying.", "err");
        if (step === 1) {
          if (!state.profile.targetCareer) return toast("Choose a target career, or take the quiz.", "err");
          if (state.profile.targetCareer === "other" && !state.profile.customCareer.trim())
            return toast("Type the career you have in mind.", "err");
        }
        step += 1;
        draw();
        scrollTop();
        if (step === 3) await ensureSkills(rerender);
      });

    const analyze = root.querySelector("[data-analyze]");
    if (analyze) analyze.addEventListener("click", () => runAnalysis(root));

    if (step === 3 && !skillList.length) ensureSkills(rerender);
  }

  draw();

  if (opts.openQuiz) openQuiz(rerender);
}

export function resetWizard() {
  step = 0;
  skillList = [];
  skillsFor = "";
  skillsForKey = "";
}

export function goToStep(n) {
  step = Math.max(0, Math.min(STEPS.length - 1, n));
}

export { navigate };
