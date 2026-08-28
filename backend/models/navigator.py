from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    name: str = Field(default="Student", max_length=80)
    education: str = Field(default="Student", max_length=120)
    year: str = Field(default="", max_length=60)
    targetCareer: str | None = None
    customCareer: str | None = Field(default=None, max_length=120)
    hoursPerDay: float = Field(default=2, ge=0.5, le=12)
    daysPerWeek: float = Field(default=4, ge=1, le=7)
    skills: dict[str, str] = Field(default_factory=dict)
    skillConfidence: dict[str, str] = Field(default_factory=dict)
    learningStyle: str = Field(default="A mix of everything", max_length=60)
    projectPreference: str = Field(default="", max_length=60)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    studentProfile: dict[str, Any] | None = None
    latestAnalysis: dict[str, Any] | None = None


class ChatResponse(BaseModel):
    answer: str
    ai: bool


class QuizSubmitRequest(BaseModel):
    answers: dict[str, str] = Field(default_factory=dict)


class QuizMatch(BaseModel):
    career_id: str
    name: str
    match: int
    reason: str
    salary: str
    category: str


class QuizResult(BaseModel):
    matches: list[QuizMatch]


class SkillRequirement(BaseModel):
    name: str
    importance: str
    target_level: str
    hours: int
    why: str


class CareerSummary(BaseModel):
    id: str
    name: str
    category: str
    description: str
    salary: str
    difficulty: str
    core_skills: list[str]
    projects: list[str]


class CareerDetail(CareerSummary):
    learning_curve: str
    responsibilities: list[str]
    tools: list[str]
    next_roles: list[str]
    skills: list[SkillRequirement]
    learning_path: list[str]
    project_details: list[dict[str, Any]]
    resources: list[dict[str, Any]]


class CareersResponse(BaseModel):
    categories: list[str]
    careers: list[CareerSummary]


class ResourcesResponse(BaseModel):
    total: int
    skills: list[str]
    formats: list[str]
    difficulties: list[str]
    resources: list[dict[str, Any]]


class CompareResponse(BaseModel):
    left: CareerDetail
    right: CareerDetail
    summary: str
    ai: bool
