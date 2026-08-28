const KEY = "csn-state-v1";

const initial = {
  profile: {
    name: "",
    education: "",
    year: "",
    targetCareer: "",
    customCareer: "",
    hoursPerDay: 2,
    daysPerWeek: 4,
    skills: {},
    skillConfidence: {},
    learningStyle: "A mix of everything",
    projectPreference: "",
  },
  analysis: null,
  progress: { skills: {}, weeks: {}, projects: {} },
};

function load() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return structuredClone(initial);
    const parsed = JSON.parse(raw);
    return {
      profile: { ...initial.profile, ...(parsed.profile || {}) },
      analysis: parsed.analysis || null,
      progress: { ...initial.progress, ...(parsed.progress || {}) },
    };
  } catch {
    return structuredClone(initial);
  }
}

export const state = load();

const listeners = new Set();

export function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* session storage may be unavailable — the app still works in memory */
  }
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setProfile(patch) {
  Object.assign(state.profile, patch);
  save();
}

export function setAnalysis(analysis) {
  state.analysis = analysis;
  state.progress = { skills: {}, weeks: {}, projects: {} };
  save();
}

export function setProgress(kind, id, value) {
  state.progress[kind][id] = value;
  save();
}

export function reset() {
  const fresh = structuredClone(initial);
  state.profile = fresh.profile;
  state.analysis = null;
  state.progress = fresh.progress;
  save();
}
