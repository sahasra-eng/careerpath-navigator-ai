from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from data.careers import CAREERS, CAREERS_BY_ID, CATEGORIES, LEARNING_PATHS, PROJECTS
from data.quiz import QUIZ, REASONS
from data.resources import DIFFICULTIES, FORMATS, RESOURCES, ALL_SKILLS, resources_for_skill
from lib.db import db
from lib.engine import analyze, career_skills, get_career
from lib.llm import COACH_SYSTEM, INSIGHT_SYSTEM, ask_llm, custom_career_skills, profile_context
from models.navigator import (
    AnalyzeRequest,
    CareerDetail,
    CareersResponse,
    CareerSummary,
    ChatRequest,
    ChatResponse,
    CompareResponse,
    QuizResult,
    QuizSubmitRequest,
    ResourcesResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _summary(c: dict) -> dict:
    return {
        "id": c["id"], "name": c["name"], "category": c["category"], "description": c["description"],
        "salary": c["salary"], "difficulty": c["difficulty"],
        "core_skills": [s[0] for s in c["skills"]][:5],
        "projects": [p["name"] for p in PROJECTS.get(c["id"], [])][:3],
    }


def _detail(c: dict) -> dict:
    skills = career_skills(c)
    seen: dict[str, dict] = {}
    for s in skills:
        for r in resources_for_skill(s["name"], limit=1):
            seen.setdefault(r["id"], r)
    return {
        **_summary(c),
        "learning_curve": c.get("learning_curve", ""),
        "responsibilities": c.get("responsibilities", []),
        "tools": c.get("tools", []),
        "next_roles": c.get("next_roles", []),
        "skills": [{"name": s["name"], "importance": s["importance"], "target_level": s["target_level"], "hours": s["hours"], "why": s["why"]} for s in skills],
        "learning_path": LEARNING_PATHS.get(c["id"], [s["name"] for s in skills]),
        "project_details": PROJECTS.get(c["id"], []),
        "resources": list(seen.values())[:6],
    }


@router.get("/careers", response_model=CareersResponse)
async def list_careers(category: str | None = None, q: str | None = None):
    items = CAREERS
    if category and category != "All":
        items = [c for c in items if c["category"] == category]
    if q:
        low = q.lower()
        items = [c for c in items if low in c["name"].lower() or low in c["description"].lower() or any(low in s[0].lower() for s in c["skills"])]
    return {"categories": CATEGORIES, "careers": [CareerSummary(**_summary(c)) for c in items]}


@router.get("/careers/{career_id}", response_model=CareerDetail)
async def career_detail(career_id: str):
    c = CAREERS_BY_ID.get(career_id)
    if not c:
        raise HTTPException(status_code=404, detail="Career not found")
    return CareerDetail(**_detail(c))


@router.get("/compare", response_model=CompareResponse)
async def compare_careers(left: str = Query(...), right: str = Query(...)):
    a, b = CAREERS_BY_ID.get(left), CAREERS_BY_ID.get(right)
    if not a or not b:
        raise HTTPException(status_code=404, detail="Career not found")
    if a["id"] == b["id"]:
        raise HTTPException(status_code=400, detail="Pick two different careers")
    prompt = (
        f"Compare these two entry-level careers for an Indian student in 4 sentences. Say who each suits.\n"
        f"A: {a['name']} — {a['description']} Skills: {[s[0] for s in a['skills']]}. Difficulty: {a['difficulty']}.\n"
        f"B: {b['name']} — {b['description']} Skills: {[s[0] for s in b['skills']]}. Difficulty: {b['difficulty']}."
    )
    ai_text = await ask_llm("You are a concise, honest career advisor. No URLs, no job guarantees.", prompt)
    fallback = (
        f"{a['name']} ({a['salary']}, {a['difficulty'].lower()}) leans on {', '.join(s[0] for s in a['skills'][:3])}, "
        f"while {b['name']} ({b['salary']}, {b['difficulty'].lower()}) leans on {', '.join(s[0] for s in b['skills'][:3])}. "
        "Pick the one whose core skills you'd enjoy practising every day — the overlap means switching later is realistic."
    )
    return {"left": CareerDetail(**_detail(a)), "right": CareerDetail(**_detail(b)), "summary": ai_text or fallback, "ai": bool(ai_text)}


@router.get("/resources", response_model=ResourcesResponse)
async def list_resources(
    q: str | None = None,
    skill: str | None = None,
    career: str | None = None,
    difficulty: str | None = None,
    format: str | None = None,
    free: bool | None = None,
):
    items: list[dict[str, Any]] = list(RESOURCES)
    if career and career != "All":
        c = CAREERS_BY_ID.get(career)
        if c:
            wanted = {s[0] for s in c["skills"]}
            items = [r for r in items if wanted & set(r["skills"])]
    if skill and skill != "All":
        items = [r for r in items if skill in r["skills"]]
    if difficulty and difficulty != "All":
        items = [r for r in items if r["difficulty"] == difficulty]
    if format and format != "All":
        items = [r for r in items if r["format"] == format]
    if free:
        items = [r for r in items if r["free"]]
    if q:
        low = q.lower()
        items = [r for r in items if low in r["title"].lower() or low in r["description"].lower() or low in r["platform"].lower() or any(low in s.lower() for s in r["skills"])]
    return {"total": len(items), "skills": ALL_SKILLS, "formats": FORMATS, "difficulties": DIFFICULTIES, "resources": items}


@router.get("/quiz")
async def get_quiz():
    return {"questions": QUIZ}


@router.post("/quiz", response_model=QuizResult)
async def submit_quiz(payload: QuizSubmitRequest):
    if not payload.answers:
        raise HTTPException(status_code=400, detail="Answer at least one question to get a match")
    scores: dict[str, float] = {}
    for q in QUIZ:
        chosen = payload.answers.get(q["id"])
        if not chosen:
            continue
        for opt in q["options"]:
            if opt["id"] == chosen:
                for cid, w in opt["weights"].items():
                    scores[cid] = scores.get(cid, 0) + w
    if not scores:
        raise HTTPException(status_code=400, detail="No valid answers received")
    top = sorted(scores.items(), key=lambda kv: -kv[1])[:3]
    best = top[0][1] or 1
    matches = []
    for i, (cid, sc) in enumerate(top):
        c = CAREERS_BY_ID[cid]
        pct = int(round(min(95, 55 + (sc / best) * 40 - i * 4)))
        matches.append({
            "career_id": cid, "name": c["name"], "match": pct,
            "reason": REASONS.get(cid, c["description"]), "salary": c["salary"], "category": c["category"],
        })
    return {"matches": matches}


@router.post("/analyze")
async def analyze_profile(payload: AnalyzeRequest):
    data = payload.model_dump()
    target, custom = data.get("targetCareer"), (data.get("customCareer") or "").strip()
    if not target and not custom:
        raise HTTPException(status_code=400, detail="Please choose a target career first")
    if target == "other" or (target and target not in CAREERS_BY_ID):
        if not custom:
            raise HTTPException(status_code=400, detail="Tell us which career you have in mind")
        data["targetCareer"] = None

    if not data.get("targetCareer") and custom:
        inferred = await custom_career_skills(custom)
        if inferred:
            data["customSkills"] = inferred

    result = analyze(data)

    ai_text = await ask_llm(
        INSIGHT_SYSTEM,
        "Write the note for this student:\n" + profile_context(None, result),
        session_id=f"insight-{result['career']['id']}",
    )
    if ai_text:
        result["aiInsight"] = ai_text

    try:
        await db.analyses.insert_one(dict(result))
    except Exception as exc:  # noqa: BLE001 - persistence is best-effort
        logger.warning("Could not persist analysis: %s", exc)
    result.pop("_id", None)
    return result


@router.get("/skills")
async def skills_for_career(career: str | None = None, custom: str | None = None):
    """Skill checklist for the chosen career — dynamic per career, LLM-inferred for custom ones."""
    if career and career in CAREERS_BY_ID:
        c = CAREERS_BY_ID[career]
        return {"career": c["name"], "custom": False, "skills": career_skills(c)}
    name = (custom or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Choose a career or enter a custom one")
    inferred = await custom_career_skills(name)
    c = get_career(None, name, inferred)
    return {"career": c["name"], "custom": True, "ai": bool(inferred), "skills": career_skills(c)}


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Ask a question to get started")
    context = profile_context(payload.studentProfile, payload.latestAnalysis)
    answer = await ask_llm(
        COACH_SYSTEM,
        f"STUDENT CONTEXT\n{context}\n\nSTUDENT QUESTION\n{question}",
        session_id="coach",
    )
    if answer:
        return {"answer": answer, "ai": True}

    a = payload.latestAnalysis or {}
    if a:
        pr = a.get("prioritySkills") or []
        proj = (a.get("projects") or [{}])[0]
        lines = [
            f"The AI coach is unavailable right now, but here's what your analysis already says:",
            f"• Readiness for {a.get('career', {}).get('name', 'your target role')}: {a.get('readiness')}%.",
        ]
        if pr:
            lines.append(f"• Learn first: {', '.join(p['skill'] for p in pr)}.")
        if proj:
            lines.append(f"• Build next: {proj.get('name')} ({proj.get('difficulty')}, ~{proj.get('hours')}h).")
        lines.append(f"• Estimated effort: {a.get('estimatedHours')} hours over about {a.get('estimatedWeeks')} weeks.")
        return {"answer": "\n".join(lines), "ai": False}
    return {
        "answer": "The AI coach is temporarily unavailable. Run 'Build My Roadmap' and I'll be able to give you specific, personal guidance based on your profile.",
        "ai": False,
    }
