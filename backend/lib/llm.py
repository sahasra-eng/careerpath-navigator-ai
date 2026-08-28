"""LLM helpers. Every call degrades gracefully — the analyzer never depends on it."""

from __future__ import annotations

import json
import logging
import os
import uuid

logger = logging.getLogger(__name__)

MODEL_PROVIDER = "openai"
MODEL_NAME = "gpt-5.4"


async def ask_llm(system_message: str, prompt: str, session_id: str | None = None) -> str | None:
    """Return the model's text, or None if the LLM is unavailable for any reason."""
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        return None
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        chat = LlmChat(
            api_key=key,
            session_id=session_id or str(uuid.uuid4()),
            system_message=system_message,
        ).with_model(MODEL_PROVIDER, MODEL_NAME)
        reply = await chat.send_message(UserMessage(text=prompt))
        if isinstance(reply, str):
            return reply.strip()
        return str(reply).strip()
    except Exception as exc:  # noqa: BLE001 - any failure must degrade, never raise
        logger.warning("LLM call failed: %s", exc)
        return None


COACH_SYSTEM = (
    "You are the AI Career Coach inside 'Career & Skilling Navigator', an app for Indian university students. "
    "You are given the student's real profile and analysis. Always answer specifically using their name, target career, "
    "skill levels, gaps, weekly hours and roadmap. Be direct, warm and practical. Keep answers under 180 words, "
    "use short paragraphs or a maximum of 5 bullets. Never invent URLs or course links — tell them to open the "
    "'Where to learn' section instead. Never promise jobs, salaries or internship offers."
)

INSIGHT_SYSTEM = (
    "You are a career coach writing a short personal note to a student about their skill analysis. "
    "3-4 sentences, second person, specific to their numbers and gaps, encouraging but honest. "
    "No URLs, no bullet lists, no promises about jobs."
)

CUSTOM_SKILLS_SYSTEM = (
    "You map a job title to its foundational entry-level skills. Reply with ONLY a JSON array of 6 short skill names "
    "(strings), ordered most-foundational first. No prose, no markdown fences."
)


def profile_context(profile: dict | None, analysis: dict | None) -> str:
    if not analysis:
        if profile:
            return f"Student has not run an analysis yet. Partial profile: {json.dumps(profile)[:900]}"
        return "No student profile available yet — the student has not built a roadmap. Encourage them to run the Navigator."
    a = analysis
    prof = a.get("profile", {})
    parts = [
        f"Name: {prof.get('name')}",
        f"Education: {prof.get('education')} ({prof.get('year')})",
        f"Target career: {a.get('career', {}).get('name')}",
        f"Time available: {prof.get('hoursPerDay')}h/day x {prof.get('daysPerWeek')} days = {prof.get('hoursPerWeek')}h/week",
        f"Learning style: {prof.get('learningStyle')}; project interest: {prof.get('projectPreference')}",
        f"Career readiness: {a.get('readiness')}%",
        f"Strong skills: {', '.join(s['skill'] for s in a.get('knownSkills', {}).get('strong', [])) or 'none yet'}",
        f"Developing skills: {', '.join(s['skill'] for s in a.get('knownSkills', {}).get('developing', [])) or 'none'}",
        "Gaps: " + (", ".join(f"{m['skill']} ({m['current_level']}→{m['target_level']}, {m['estimated_hours']}h, {m['importance']} importance)" for m in a.get("missingSkills", [])) or "none"),
        "Top priorities: " + (", ".join(f"{p['rank']}. {p['skill']}" for p in a.get("prioritySkills", [])) or "none"),
        f"Estimated effort: {a.get('estimatedHours')}h over ~{a.get('estimatedWeeks')} weeks",
        "Roadmap weeks: " + "; ".join(f"W{w['week']}: {w['focus']}" for w in a.get("roadmap", [])[:8]),
        "Suggested projects: " + ", ".join(f"{p['name']} ({p['difficulty']})" for p in a.get("projects", [])),
        f"Internship readiness: {a.get('internshipReadiness', {}).get('category')}",
    ]
    return "\n".join(parts)


async def custom_career_skills(career_name: str) -> list[str] | None:
    raw = await ask_llm(CUSTOM_SKILLS_SYSTEM, f"Job title: {career_name}")
    if not raw:
        return None
    try:
        text = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        data = json.loads(text)
        skills = [str(s).strip() for s in data if str(s).strip()]
        return skills[:8] or None
    except Exception:  # noqa: BLE001
        return None
