"""Deterministic career analysis engine. Works fully without the LLM."""

from __future__ import annotations

import re

from data.careers import CAREERS_BY_ID, PROJECTS
from data.resources import resources_for_skill

LEVELS = ["Not Yet", "Beginner", "Intermediate", "Strong"]
LEVEL_SCORE = {"Not Yet": 0.0, "Beginner": 0.4, "Intermediate": 0.75, "Strong": 1.0}
CONFIDENCE_FACTOR = {"Low": 0.8, "Medium": 1.0, "High": 1.12}
IMPORTANCE_WEIGHT = {"high": 3.0, "medium": 2.0, "low": 1.0}
TARGET_LEVEL = {"high": "Intermediate", "medium": "Intermediate", "low": "Beginner"}
TARGET_SCORE = {"high": 0.75, "medium": 0.7, "low": 0.4}

WHY_IT_MATTERS = {
    "SQL": "Almost every data question at work starts with pulling the right rows.",
    "Excel / Spreadsheets": "It is still the fastest tool for exploring and sharing small datasets.",
    "Statistics": "It stops you from confidently reporting noise as a finding.",
    "Power BI / Tableau": "Dashboards are how your analysis reaches decision makers.",
    "Python": "It automates the repetitive work that spreadsheets cannot scale to.",
    "Data Visualization": "A clear chart persuades faster than a paragraph of numbers.",
    "Communication": "Insight that nobody understands changes nothing.",
    "Machine Learning": "It is the core craft of predicting outcomes rather than describing them.",
    "Mathematics": "Linear algebra and calculus are what make models understandable, not magic.",
    "HTML": "It is the structural foundation every interface is built on.",
    "CSS": "Layout and responsiveness are most of the day-to-day frontend work.",
    "JavaScript": "It is where interactivity, state and data fetching actually happen.",
    "Git": "No team will let you contribute without it.",
    "Responsive Design": "Most of your users will arrive on a phone.",
    "Accessibility": "It is both a legal expectation and a mark of craft.",
    "UI Fundamentals": "Spacing, hierarchy and type make the difference between rough and professional.",
    "APIs": "APIs are the contract between every part of a modern product.",
    "Databases": "Bad schema decisions are the most expensive kind to undo.",
    "Testing": "It is how you ship changes without fear.",
    "Linux": "Nearly all servers you will ever touch run it.",
    "Cloud Fundamentals": "Compute, storage, identity and networking underpin every deployment.",
    "Networking": "You cannot secure or debug what you cannot trace.",
    "Docker": "It makes 'works on my machine' irrelevant.",
    "CI/CD": "Automated pipelines are what let teams release safely and often.",
    "Security Basics": "Knowing the common attack classes is the entry ticket to the field.",
    "Incident Response": "Detection matters only if someone knows what to do next.",
    "Figma": "It is the industry-standard canvas for interface work.",
    "User Research": "It is the difference between designing for users and guessing.",
    "Wireframing": "Cheap sketches prevent expensive rebuilds.",
    "Prototyping": "Clickable flows are how you test an idea before it is built.",
    "Visual Design": "Polish is what makes a portfolio memorable.",
    "Usability Testing": "Five sessions will reveal problems no critique will.",
    "Product Thinking": "Deciding what not to build is the actual job.",
    "Business Fundamentals": "Understanding revenue and cost makes your work relevant to leadership.",
    "Process Mapping": "You can only improve a process you can draw.",
    "Marketing Analytics": "Attribution decides where the next rupee of budget goes.",
    "Content & Copy": "Words are the interface of most marketing.",
    "Financial Modelling": "Models are the language finance teams argue in.",
    "Accounting Basics": "Statements are the raw data of every financial decision.",
}

# Ordered curriculum stages per skill. Each stage becomes one or more roadmap weeks.
CURRICULUM = {
    "SQL": [
        {"focus": "SQL Foundations", "objectives": ["SELECT and column aliases", "WHERE filtering", "ORDER BY", "GROUP BY with COUNT/SUM"], "practice": "Write 10–15 queries against a sample database", "mini_project": "Answer five business questions about one table", "hours": 10},
        {"focus": "SQL for Real Data", "objectives": ["INNER and LEFT JOINs", "Aggregations across tables", "Subqueries", "CASE expressions"], "practice": "Recreate a report using joins across 3 tables", "mini_project": "Monthly sales analysis with joins", "hours": 15},
    ],
    "Excel / Spreadsheets": [
        {"focus": "Spreadsheet Fluency", "objectives": ["Data cleaning techniques", "Core formulas and lookups", "Pivot tables", "Charts that read clearly"], "practice": "Clean one messy public dataset", "mini_project": "A one-page KPI sheet", "hours": 18},
    ],
    "Statistics": [
        {"focus": "Practical Statistics", "objectives": ["Distributions and spread", "Correlation vs causation", "Sampling and bias", "Confidence intervals"], "practice": "Summarise a dataset and state uncertainty", "mini_project": "A statistical summary report", "hours": 18},
        {"focus": "Inference & Testing", "objectives": ["Hypothesis testing", "p-values in plain language", "A/B test design", "Common statistical traps"], "practice": "Analyse an A/B test dataset", "mini_project": "An experiment write-up with a verdict", "hours": 15},
    ],
    "Power BI / Tableau": [
        {"focus": "Dashboarding", "objectives": ["Data import and Power Query", "Data modelling and relationships", "Core visuals and filters", "Publishing and sharing"], "practice": "Rebuild a dashboard you admire", "mini_project": "An interactive sales dashboard", "hours": 25},
    ],
    "Python": [
        {"focus": "Python Basics", "objectives": ["Types, lists and dicts", "Loops and conditionals", "Functions", "Reading files"], "practice": "Solve 20 small exercises", "mini_project": "A script that cleans a CSV", "hours": 18},
        {"focus": "Python for Real Work", "objectives": ["pandas dataframes", "Working with APIs", "Error handling", "Virtual environments"], "practice": "Automate one repetitive task you actually have", "mini_project": "A data-processing tool with a README", "hours": 20},
    ],
    "Data Visualization": [
        {"focus": "Visual Communication", "objectives": ["Choosing the right chart", "Removing chart junk", "Colour and annotation", "Telling a story with order"], "practice": "Redesign three bad charts", "mini_project": "A one-slide insight summary", "hours": 15},
    ],
    "Communication": [
        {"focus": "Explaining Your Work", "objectives": ["Structuring a recommendation", "Writing an executive summary", "Presenting to non-experts", "Handling questions"], "practice": "Present one project in 3 minutes", "mini_project": "A written case study of your best project", "hours": 12},
    ],
    "Machine Learning": [
        {"focus": "ML Foundations", "objectives": ["Train/test splitting", "Regression and classification", "Overfitting and regularisation", "Evaluation metrics"], "practice": "Model one dataset end to end", "mini_project": "A baseline model with honest metrics", "hours": 22},
        {"focus": "Applied ML", "objectives": ["Feature engineering", "Cross-validation", "Model comparison", "Communicating uncertainty"], "practice": "Improve your baseline measurably", "mini_project": "A model report with error analysis", "hours": 23},
    ],
    "Mathematics": [{"focus": "Maths for ML", "objectives": ["Vectors and matrices", "Derivatives and gradients", "Probability rules", "Cost functions intuitively"], "practice": "Hand-derive gradient descent once", "mini_project": "Notes explaining the maths in your own words", "hours": 30}],
    "HTML": [{"focus": "HTML & Semantics", "objectives": ["Document structure", "Semantic elements", "Forms and labels", "Images and media"], "practice": "Mark up three page layouts", "mini_project": "A semantic personal profile page", "hours": 12}],
    "CSS": [
        {"focus": "CSS Layout", "objectives": ["Box model", "Flexbox", "Grid", "Custom properties"], "practice": "Rebuild two real layouts from screenshots", "mini_project": "A responsive landing page", "hours": 15},
        {"focus": "CSS Polish", "objectives": ["Transitions and animation", "Design tokens", "Dark mode", "Component patterns"], "practice": "Add motion to an existing page", "mini_project": "A themed component set", "hours": 10},
    ],
    "JavaScript": [
        {"focus": "JavaScript Core", "objectives": ["Variables, functions, scope", "Arrays and objects", "DOM manipulation", "Events"], "practice": "Build three tiny interactive widgets", "mini_project": "An interactive to-do interface", "hours": 20},
        {"focus": "JavaScript in the Real World", "objectives": ["fetch and async/await", "Error and loading states", "Modules", "Debugging with devtools"], "practice": "Consume a public API", "mini_project": "A live data dashboard", "hours": 20},
    ],
    "Git": [{"focus": "Git & Collaboration", "objectives": ["Commits and branches", "Merging and conflicts", "Pull requests", "Sensible commit messages"], "practice": "Contribute to one open repository", "mini_project": "A repo with clean history and README", "hours": 10}],
    "Responsive Design": [{"focus": "Responsive Layouts", "objectives": ["Mobile-first thinking", "Media queries", "Fluid type and spacing", "Testing on devices"], "practice": "Make one old page fully responsive", "mini_project": "A layout that works at 320px and 1440px", "hours": 15}],
    "Accessibility": [{"focus": "Accessible Interfaces", "objectives": ["Semantic landmarks", "Keyboard navigation", "Focus management", "Contrast and ARIA basics"], "practice": "Audit a page with a screen reader", "mini_project": "An accessibility fix report", "hours": 12}],
    "UI Fundamentals": [{"focus": "Interface Craft", "objectives": ["Spacing and rhythm", "Typographic hierarchy", "Colour systems", "Consistency"], "practice": "Redesign one ugly screen", "mini_project": "A before/after UI comparison", "hours": 15}],
    "APIs": [{"focus": "Designing APIs", "objectives": ["REST conventions", "Request validation", "Status codes and errors", "Documentation"], "practice": "Build and document six endpoints", "mini_project": "A documented CRUD API", "hours": 22}],
    "Databases": [{"focus": "Data Modelling", "objectives": ["Tables and relationships", "Normalisation", "Indexes", "Transactions"], "practice": "Model one real domain", "mini_project": "A schema with seeded data and queries", "hours": 25}],
    "Testing": [{"focus": "Testing Fundamentals", "objectives": ["Unit vs integration tests", "Fixtures", "Assertions that matter", "Running tests in CI"], "practice": "Add tests to an old project", "mini_project": "A tested module with coverage notes", "hours": 15}],
    "Linux": [{"focus": "Linux & Shell", "objectives": ["Filesystem and permissions", "Core commands and pipes", "Processes and services", "Shell scripting basics"], "practice": "Do a week of tasks CLI-only", "mini_project": "A useful shell script", "hours": 20}],
    "Cloud Fundamentals": [
        {"focus": "Cloud Core Services", "objectives": ["Compute options", "Object storage", "Identity and permissions", "Cost basics"], "practice": "Deploy one static site yourself", "mini_project": "A cloud-hosted site with a cost estimate", "hours": 18},
        {"focus": "Cloud Architecture", "objectives": ["VPC and subnets", "Load balancing", "Managed databases", "Infrastructure as code"], "practice": "Draw and build a two-tier architecture", "mini_project": "A documented deployed architecture", "hours": 17},
    ],
    "Networking": [{"focus": "Networking Essentials", "objectives": ["TCP/IP and ports", "DNS", "HTTP and TLS", "Firewalls and routing"], "practice": "Trace a request end to end with tooling", "mini_project": "A packet-capture analysis write-up", "hours": 25}],
    "Docker": [{"focus": "Containers", "objectives": ["Images vs containers", "Writing a Dockerfile", "Volumes and networking", "Compose"], "practice": "Containerise one of your apps", "mini_project": "A one-command multi-service stack", "hours": 20}],
    "CI/CD": [{"focus": "Pipelines", "objectives": ["Workflow triggers", "Build and test stages", "Secrets handling", "Deploy steps"], "practice": "Add CI to two repositories", "mini_project": "A pipeline that tests and deploys", "hours": 25}],
    "Security Basics": [
        {"focus": "Security Foundations", "objectives": ["CIA triad", "OWASP Top 10", "Authentication vs authorisation", "Hardening basics"], "practice": "Exploit and then fix a deliberately vulnerable app", "mini_project": "A findings-and-fixes report", "hours": 18},
        {"focus": "Defensive Security", "objectives": ["Logging and monitoring", "Threat models", "Vulnerability scanning", "Patch strategy"], "practice": "Scan your own lab and triage results", "mini_project": "A prioritised remediation plan", "hours": 12},
    ],
    "Incident Response": [{"focus": "Responding to Incidents", "objectives": ["IR lifecycle", "Log triage", "Containment decisions", "Post-incident write-ups"], "practice": "Run one tabletop exercise", "mini_project": "An IR playbook for one scenario", "hours": 20}],
    "Figma": [{"focus": "Figma Fluency", "objectives": ["Frames and auto layout", "Components and variants", "Styles and tokens", "Prototyping links"], "practice": "Rebuild an app screen pixel-close", "mini_project": "A reusable component set", "hours": 20}],
    "User Research": [{"focus": "Understanding Users", "objectives": ["Writing interview scripts", "Running non-leading interviews", "Synthesising findings", "Journey mapping"], "practice": "Interview five real people", "mini_project": "A research summary with insights", "hours": 25}],
    "Wireframing": [{"focus": "Wireframing", "objectives": ["Information hierarchy", "Low-fidelity flows", "Comparing alternatives", "Annotating intent"], "practice": "Sketch three versions of one screen", "mini_project": "A wireframed user flow", "hours": 15}],
    "Prototyping": [{"focus": "Prototyping", "objectives": ["Interactive flows", "States and transitions", "Realistic content", "Sharing for feedback"], "practice": "Prototype one complete task", "mini_project": "A clickable prototype", "hours": 18}],
    "Visual Design": [{"focus": "Visual Craft", "objectives": ["Type scales", "Colour and contrast", "Grid and spacing", "Visual polish passes"], "practice": "Do three polish passes on one screen", "mini_project": "A high-fidelity screen set", "hours": 25}],
    "Usability Testing": [{"focus": "Testing With Users", "objectives": ["Writing test tasks", "Moderating without leading", "Recording observations", "Prioritising fixes"], "practice": "Test your prototype with five people", "mini_project": "A usability findings report", "hours": 18}],
    "Product Thinking": [{"focus": "Product Judgement", "objectives": ["Problem framing", "Prioritisation frameworks", "Writing a crisp PRD", "Defining success metrics"], "practice": "Write one PRD for a feature you'd want", "mini_project": "A PRD plus teardown", "hours": 30}],
    "Business Fundamentals": [{"focus": "How Businesses Work", "objectives": ["Revenue and cost drivers", "Unit economics", "Market sizing", "Reading a P&L"], "practice": "Model one company's basics", "mini_project": "A one-page business analysis", "hours": 25}],
    "Process Mapping": [{"focus": "Mapping Processes", "objectives": ["As-is mapping", "Bottleneck spotting", "To-be design", "Requirement writing"], "practice": "Map one process you experience", "mini_project": "A process improvement proposal", "hours": 15}],
    "Marketing Analytics": [{"focus": "Measuring Marketing", "objectives": ["GA4 basics", "Attribution models", "CAC, LTV, ROAS", "Reporting cadence"], "practice": "Build one campaign report", "mini_project": "A channel performance dashboard", "hours": 25}],
    "Content & Copy": [{"focus": "Writing That Converts", "objectives": ["Audience and offer", "Headline patterns", "Landing page structure", "Testing copy"], "practice": "Rewrite three weak headlines", "mini_project": "A landing page copy doc", "hours": 18}],
    "Financial Modelling": [{"focus": "Financial Models", "objectives": ["Assumption tabs", "Linked statements", "Scenario and sensitivity", "Model hygiene"], "practice": "Build one three-statement model", "mini_project": "A model with sensitivity tables", "hours": 30}],
    "Accounting Basics": [{"focus": "Accounting Foundations", "objectives": ["The three statements", "Accruals vs cash", "Working capital", "Common ratios"], "practice": "Analyse one annual report", "mini_project": "A ratio analysis summary", "hours": 25}],
}

DEFAULT_STAGE = {
    "objectives": ["Core concepts and vocabulary", "Hands-on basics", "One realistic application", "Common mistakes to avoid"],
    "practice": "Apply the skill on a small real task",
    "mini_project": "A small artefact you can show someone",
}


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "custom-career"


def infer_custom_career(name: str, skills: list[str] | None = None) -> dict:
    """Build a career record for a career not in the catalog."""
    skills = skills or ["Communication", "Excel / Spreadsheets", "Business Fundamentals", "Python", "Data Visualization", "Product Thinking"]
    return {
        "id": _slug(name),
        "name": name,
        "category": "Custom",
        "custom": True,
        "description": f"A personalised path towards becoming a {name}.",
        "salary": "Varies by industry and location",
        "difficulty": "Moderate",
        "learning_curve": "Depends on your starting point",
        "responsibilities": [f"Core day-to-day work of a {name}", "Collaborating with a team", "Continuously building relevant skills"],
        "tools": [],
        "next_roles": [f"Senior {name}", f"Lead {name}"],
        "skills": [(s, "high" if i < 3 else "medium", 25) for i, s in enumerate(skills[:8])],
    }


def get_career(target_id: str | None, custom_career: str | None, custom_skills: list[str] | None = None) -> dict:
    if target_id and target_id in CAREERS_BY_ID:
        return CAREERS_BY_ID[target_id]
    if custom_career:
        return infer_custom_career(custom_career.strip(), custom_skills)
    return CAREERS_BY_ID["data-analyst"]


def career_skills(career: dict) -> list[dict]:
    return [
        {"name": n, "importance": imp, "hours": hrs, "target_level": TARGET_LEVEL[imp], "why": WHY_IT_MATTERS.get(n, f"{n} is a foundational expectation for this role.")}
        for (n, imp, hrs) in career["skills"]
    ]


def _score(level: str, confidence: str) -> float:
    base = LEVEL_SCORE.get(level, 0.0)
    return min(1.0, base * CONFIDENCE_FACTOR.get(confidence, 1.0))


def _stages_for(skill: str, hours: int) -> list[dict]:
    stages = CURRICULUM.get(skill)
    if stages:
        return [dict(s) for s in stages]
    return [{"focus": f"{skill} Foundations", "hours": hours, **DEFAULT_STAGE}]


def analyze(payload: dict) -> dict:
    career = get_career(payload.get("targetCareer"), payload.get("customCareer"), payload.get("customSkills"))
    skills_meta = career_skills(career)
    levels: dict = payload.get("skills") or {}
    confidences: dict = payload.get("skillConfidence") or {}
    learning_style = payload.get("learningStyle") or "A mix of everything"

    hours_per_day = float(payload.get("hoursPerDay") or 2)
    days_per_week = float(payload.get("daysPerWeek") or 4)
    hours_per_week = max(1.0, round(hours_per_day * days_per_week, 1))

    known_strong, known_developing, missing = [], [], []
    weighted_sum = weight_total = 0.0
    breakdown = []

    for meta in skills_meta:
        name = meta["name"]
        level = levels.get(name, "Not Yet")
        if level not in LEVEL_SCORE:
            level = "Not Yet"
        conf = confidences.get(name, "Medium")
        s = _score(level, conf)
        w = IMPORTANCE_WEIGHT[meta["importance"]]
        weighted_sum += s * w
        weight_total += w
        breakdown.append({"skill": name, "level": level, "confidence": conf, "score": round(s * 100), "importance": meta["importance"], "weight": w})

        if s >= 0.75:
            known_strong.append({"skill": name, "level": level, "confidence": conf, "score": round(s * 100)})
        elif s >= 0.3:
            known_developing.append({"skill": name, "level": level, "confidence": conf, "score": round(s * 100)})

        target = TARGET_SCORE[meta["importance"]]
        if s < target:
            remaining = max(0.15, target - s) / max(target, 0.01)
            est = max(4, int(round(meta["hours"] * remaining)))
            missing.append({
                "skill": name,
                "current_level": level,
                "target_level": meta["target_level"],
                "importance": meta["importance"],
                "estimated_hours": est,
                "why": meta["why"],
                "gap": round((target - s) * 100),
            })

    readiness = round(weighted_sum / weight_total * 100) if weight_total else 0

    order = {"high": 0, "medium": 1, "low": 2}
    missing.sort(key=lambda m: (order[m["importance"]], -m["gap"]))
    priority = []
    for i, m in enumerate(missing[:3]):
        priority.append({
            "rank": i + 1,
            "skill": m["skill"],
            "estimated_hours": m["estimated_hours"],
            "reason": f"Start here because {m['why'][0].lower()}{m['why'][1:]}" if i == 0 else m["why"],
        })

    total_hours = sum(m["estimated_hours"] for m in missing)
    estimated_weeks = max(1, int(round(total_hours / hours_per_week))) if total_hours else 0

    # Roadmap: walk the prioritised gaps, slicing curriculum stages into weekly buckets.
    roadmap = []
    week = 1
    budget_cap = max(60, int(hours_per_week * 16))
    spent = 0
    for m in missing:
        for stage in _stages_for(m["skill"], m["estimated_hours"]):
            stage_hours = min(int(stage.get("hours", m["estimated_hours"])), max(6, m["estimated_hours"]))
            if spent >= budget_cap:
                break
            remaining_hours = stage_hours
            part = 1
            total_parts = max(1, int(round(stage_hours / hours_per_week + 0.35)))
            while remaining_hours > 0 and week <= 24:
                chunk = min(hours_per_week, remaining_hours)
                title = stage["focus"] if total_parts == 1 else f"{stage['focus']} (part {part})"
                roadmap.append({
                    "week": week,
                    "skill": m["skill"],
                    "focus": title,
                    "objectives": stage["objectives"],
                    "practice": stage["practice"],
                    "mini_project": stage["mini_project"],
                    "hours": round(chunk, 1),
                })
                remaining_hours -= chunk
                spent += chunk
                week += 1
                part += 1
        if spent >= budget_cap:
            break

    if not roadmap:
        roadmap.append({
            "week": 1, "skill": "Portfolio", "focus": "Turn your skills into proof",
            "objectives": ["Pick one substantial project", "Write a clear README", "Publish it publicly", "Prepare a 3-minute walkthrough"],
            "practice": "Polish one existing project to a shareable standard",
            "mini_project": "A portfolio-ready case study", "hours": hours_per_week,
        })

    # Projects: pick tier from readiness/skill level
    tier = 0 if readiness < 40 else (1 if readiness < 70 else 2)
    pool = PROJECTS.get(career["id"])
    if not pool:
        pool = PROJECTS["data-analyst"]
    projects = []
    ordered = pool[tier:] + pool[:tier]
    pref = (payload.get("projectPreference") or "").strip()
    for p in ordered[:3]:
        fit = f"Matches your current level ({p['difficulty'].lower()}) and uses skills you're building."
        if pref:
            fit += f" It also leans towards your interest in {pref.lower()}."
        projects.append({**p, "why_fits": fit,
                         "github": f"Push the code plus a README explaining the problem, your approach and the result for '{p['name']}'.",
                         "resume": f"One line: built {p['name']} using {', '.join(p['skills'][:3])} — {p['outcome'].lower()}."})

    # Resources: only for missing skills, from the verified DB
    resources = []
    for m in missing:
        recs = resources_for_skill(m["skill"], limit=2, preferred_format=learning_style)
        if recs:
            resources.append({"skill": m["skill"], "items": recs})

    # Internship readiness
    strong_count = len(known_strong)
    if readiness < 30:
        cat, advice = "Starting Out", "Focus entirely on your first priority skill and one small project. Applications can wait 4–6 weeks."
    elif readiness < 50:
        cat, advice = "Building Foundations", "You have a base. Finish one beginner project end to end — proof matters more than more courses right now."
    elif readiness < 70:
        cat, advice = "Developing", "Close your top priority gap and publish one intermediate project with a README. Then start applying."
    else:
        cat, advice = "Strong Foundation", "You're competitive for internships. Polish two projects, tighten your resume and start applying this month."

    internship = {
        "category": cat,
        "advice": advice,
        "checks": [
            {"label": "Core skills", "status": "Strong" if readiness >= 70 else ("Developing" if readiness >= 40 else "Early"), "note": f"{strong_count} of {len(skills_meta)} core skills are solid."},
            {"label": "Projects", "status": "Planned", "note": f"Start with '{projects[0]['name']}' — {projects[0]['hours']}h."},
            {"label": "Portfolio evidence", "status": "Action needed" if readiness < 70 else "In progress", "note": "A public repo with a README is the minimum bar."},
            {"label": "Communication", "status": "Developing", "note": "Practise a 3-minute walkthrough of your best project."},
            {"label": "Resume readiness", "status": "Draft" if readiness < 50 else "Ready to polish", "note": "One line per project: what, how, outcome."},
        ],
        "disclaimer": "This is a preparation guide, not a guarantee of an internship offer.",
    }

    insight = (
        f"You're at {readiness}% readiness for {career['name']}. "
        f"With {hours_per_week:g} hours a week, closing your key gaps takes roughly {estimated_weeks or 1} weeks. "
        f"Start with {priority[0]['skill'] if priority else 'a portfolio project'} — everything else builds on it."
    )

    return {
        "career": {
            "id": career["id"], "name": career["name"], "category": career["category"],
            "description": career["description"], "salary": career["salary"], "difficulty": career["difficulty"],
            "learning_curve": career.get("learning_curve", ""), "tools": career.get("tools", []),
            "responsibilities": career.get("responsibilities", []), "next_roles": career.get("next_roles", []),
            "custom": bool(career.get("custom")),
        },
        "profile": {
            "name": (payload.get("name") or "Student").strip() or "Student",
            "education": payload.get("education") or "Student",
            "year": payload.get("year") or "",
            "hoursPerDay": hours_per_day, "daysPerWeek": days_per_week,
            "hoursPerWeek": hours_per_week, "hoursPerMonth": round(hours_per_week * 4.3),
            "learningStyle": learning_style, "projectPreference": pref,
        },
        "readiness": readiness,
        "readinessBreakdown": breakdown,
        "readinessExplanation": "Your readiness score shows how closely your current capabilities match the foundational skills expected for your target role. It is not a prediction of hiring outcomes.",
        "knownSkills": {"strong": known_strong, "developing": known_developing},
        "missingSkills": missing,
        "prioritySkills": priority,
        "estimatedHours": total_hours,
        "estimatedWeeks": estimated_weeks,
        "roadmap": roadmap,
        "resources": resources,
        "projects": projects,
        "internshipReadiness": internship,
        "insight": insight,
        "aiInsight": None,
    }
