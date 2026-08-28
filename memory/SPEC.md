# Career & Skilling Navigator — Spec

Vanilla HTML/CSS/JS frontend (no React) served by the Vite dev server on :3000; pure-Python
FastAPI backend on :8001, all routes on `api_router` under `/api`.

## Frontend
- `frontend/index.html` — shell: sticky nav (Home / Navigator / Careers / Learn), floating AI coach FAB + panel, toast host.
- `frontend/src/script.js` — bootstrap: fonts, mobile nav, AI coach chat, router start.
- `frontend/src/router.js` — history-API router: `/`, `/navigator` (`?quiz=1` auto-opens quiz), `/careers`, `/learn`.
- `frontend/src/views/{home,careers,learn,navigator,results}.js`, `frontend/src/lib/{http,store,ui}.js`.
- Session state (profile, analysis, progress) in `sessionStorage` key `csn-state-v1`. No accounts, no login.

## Backend
- `backend/data/careers.py` — 14 careers (id, category, salary, difficulty, skills[(name, importance, hours)], tools, responsibilities, next_roles) + 3 tiered projects each.
- `backend/data/resources.py` — 35 verified learning resources (real URLs only; the LLM never generates URLs).
- `backend/data/quiz.py` — 6-question discovery quiz with career weights.
- `backend/lib/engine.py` — deterministic analyzer: readiness (level score × confidence factor, weighted by importance), gaps, top-3 priorities, effort hours/weeks, week-by-week roadmap from a per-skill curriculum, tiered projects, internship readiness. Works with the LLM fully offline.
- `backend/lib/llm.py` — Emergent Universal key (`EMERGENT_LLM_KEY` in backend/.env), openai `gpt-5.4` via `emergentintegrations`. Used only for: results insight, coach answers, career-comparison summary, custom-career skill inference. Every call degrades to a deterministic fallback.

## Endpoints (all under /api)
`GET /careers` (·?category&q), `GET /careers/{career_id}`, `GET /compare?left&right`,
`GET /resources` (?q&skill&career&difficulty&format&free), `GET /quiz`, `POST /quiz`,
`GET /skills?career|custom`, `POST /analyze`, `POST /chat`.

## Key flow
Home → Navigator wizard (Profile → Career (+quiz) → Time → Skills level+confidence → Learning style)
→ animated analysis → results dashboard (readiness dial, knowledge, buildable projects, gaps,
top-3 priorities, where-to-learn, roadmap timeline, portfolio, internship readiness, progress
tracking, edit/recalculate/start-over) → AI coach with full profile context.

## Auth
None. No credentials exist anywhere in the app.
