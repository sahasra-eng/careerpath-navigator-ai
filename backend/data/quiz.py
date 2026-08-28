"""Career discovery quiz — 6 multiple-choice questions scoring career affinities."""

# Each option carries weights toward career ids.
QUIZ = [
    {
        "id": "q1",
        "question": "Which of these would you happily spend a whole Saturday on?",
        "options": [
            {"id": "a", "label": "Digging through a spreadsheet to find why a number moved", "weights": {"data-analyst": 3, "business-analyst": 2, "financial-analyst": 2}},
            {"id": "b", "label": "Building something on screen that people can click", "weights": {"frontend-developer": 3, "fullstack-developer": 2, "uiux-designer": 1}},
            {"id": "c", "label": "Making a machine guess something correctly", "weights": {"data-scientist": 3, "ml-engineer": 3}},
            {"id": "d", "label": "Breaking into your own test system to see if it's safe", "weights": {"cybersecurity-analyst": 3, "cloud-engineer": 1}},
        ],
    },
    {
        "id": "q2",
        "question": "How do you prefer to solve a problem?",
        "options": [
            {"id": "a", "label": "With numbers and evidence", "weights": {"data-analyst": 2, "financial-analyst": 3, "data-scientist": 2}},
            {"id": "b", "label": "By sketching and trying visual ideas", "weights": {"uiux-designer": 3, "frontend-developer": 1}},
            {"id": "c", "label": "By writing code until it works", "weights": {"backend-developer": 3, "fullstack-developer": 2, "ml-engineer": 1}},
            {"id": "d", "label": "By talking to people and aligning them", "weights": {"product-manager": 3, "business-analyst": 2, "digital-marketing-analyst": 1}},
        ],
    },
    {
        "id": "q3",
        "question": "Which compliment would mean most to you at work?",
        "options": [
            {"id": "a", "label": "\"Your analysis changed our decision.\"", "weights": {"data-analyst": 3, "business-analyst": 2, "financial-analyst": 2}},
            {"id": "b", "label": "\"This is the nicest interface I've used.\"", "weights": {"uiux-designer": 3, "frontend-developer": 2}},
            {"id": "c", "label": "\"Nothing has gone down in months.\"", "weights": {"devops-engineer": 3, "cloud-engineer": 3, "cybersecurity-analyst": 1}},
            {"id": "d", "label": "\"You knew exactly what to build next.\"", "weights": {"product-manager": 3, "business-analyst": 1}},
        ],
    },
    {
        "id": "q4",
        "question": "Pick the environment you'd thrive in.",
        "options": [
            {"id": "a", "label": "Deep focus, working mostly independently", "weights": {"backend-developer": 2, "data-scientist": 2, "ml-engineer": 2, "cybersecurity-analyst": 1}},
            {"id": "b", "label": "Constant collaboration with many teams", "weights": {"product-manager": 3, "business-analyst": 2, "digital-marketing-analyst": 2}},
            {"id": "c", "label": "A mix — build alone, review together", "weights": {"fullstack-developer": 3, "frontend-developer": 2, "data-analyst": 1}},
            {"id": "d", "label": "High-stakes, alert-driven, never boring", "weights": {"cybersecurity-analyst": 3, "devops-engineer": 2}},
        ],
    },
    {
        "id": "q5",
        "question": "Which sentence sounds most like you?",
        "options": [
            {"id": "a", "label": "I notice patterns before other people do", "weights": {"data-analyst": 3, "data-scientist": 2}},
            {"id": "b", "label": "I care a lot about how things look and feel", "weights": {"uiux-designer": 3, "frontend-developer": 2}},
            {"id": "c", "label": "I like understanding how systems fit together", "weights": {"cloud-engineer": 3, "devops-engineer": 2, "backend-developer": 2}},
            {"id": "d", "label": "I like markets, money and growth", "weights": {"financial-analyst": 3, "digital-marketing-analyst": 3, "product-manager": 1}},
        ],
    },
    {
        "id": "q6",
        "question": "What's your relationship with maths?",
        "options": [
            {"id": "a", "label": "I genuinely enjoy it", "weights": {"data-scientist": 3, "ml-engineer": 2, "financial-analyst": 2}},
            {"id": "b", "label": "Comfortable with practical maths and stats", "weights": {"data-analyst": 3, "business-analyst": 2, "digital-marketing-analyst": 2}},
            {"id": "c", "label": "I'd rather build than calculate", "weights": {"frontend-developer": 3, "fullstack-developer": 2, "backend-developer": 2, "devops-engineer": 1}},
            {"id": "d", "label": "I'd rather work with people and design", "weights": {"uiux-designer": 3, "product-manager": 2}},
        ],
    },
]

REASONS = {
    "data-analyst": "You enjoy patterns, numbers and turning information into useful conclusions — that's the daily work of an analyst.",
    "data-scientist": "You like maths and open-ended problems, which is exactly what modelling and experimentation demand.",
    "ml-engineer": "You want to build things that learn, and you're comfortable with both code and maths.",
    "frontend-developer": "You like making tangible things people can immediately see and use.",
    "backend-developer": "You gravitate to logic, data and making systems behave correctly under the surface.",
    "fullstack-developer": "You like owning a whole feature rather than one slice of it.",
    "cloud-engineer": "You think in systems and want to understand the infrastructure everything runs on.",
    "devops-engineer": "You'd rather automate a problem permanently than solve it twice.",
    "cybersecurity-analyst": "You're curious about how things break, and you like high-stakes investigation.",
    "uiux-designer": "You care about how things look, feel and flow for real people.",
    "product-manager": "You like aligning people, framing problems and deciding what matters next.",
    "business-analyst": "You're comfortable translating between business language and data.",
    "digital-marketing-analyst": "You're drawn to growth, experiments and measurable results.",
    "financial-analyst": "You enjoy numbers with real money attached and precise reasoning.",
}
