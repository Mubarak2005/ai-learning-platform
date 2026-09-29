"""
AI provider abstraction for question generation.

Mirrors the iGOT/NSSTA/Email pattern used elsewhere: call sites depend only
on `AIProvider`, never on a specific LLM SDK, so a real provider (Claude,
GPT, etc.) can be dropped in later by implementing this interface and
flipping `AI_PROVIDER` in config — no changes needed in assessment_service
or the API routes.

`MockAIProvider` ships a small curated question bank for competencies that
come up often in the seed data, and falls back to a generic
domain-knowledge question template for any competency it doesn't have
curated content for, so the assessment flow always has *something* to ask
regardless of which of the 33 seeded competencies is requested.
"""

import random
import re
from abc import ABC, abstractmethod
from typing import TypedDict


class GeneratedQuestion(TypedDict):
    prompt: str
    options: list[str]
    correct_option_index: int
    explanation: str
    difficulty: str  # easy | medium | hard


class AIProvider(ABC):
    @abstractmethod
    def generate_assessment_questions(
        self, *, competency_name: str, domain: str, count: int
    ) -> list[GeneratedQuestion]:
        ...

    @abstractmethod
    def generate_questions_from_text(self, *, chunks: list[str], count: int) -> list[GeneratedQuestion]:
        """Phase 9: generate MCQs grounded in trainer-uploaded material chunks."""
        ...


# Curated starter bank: competency name -> list of question dicts.
# Extend this over time; it is intentionally small for Phase 4 since the
# real content-driven generation pipeline (from uploaded material) is
# Phase 8/9 — this bank exists only to make self-assessment meaningful
# before that pipeline exists.
_QUESTION_BANK: dict[str, list[GeneratedQuestion]] = {
    "Python": [
        {
            "prompt": "Which of the following is used to define a function in Python?",
            "options": ["function", "def", "func", "lambda only"],
            "correct_option_index": 1,
            "explanation": "Python functions are defined with the `def` keyword.",
            "difficulty": "easy",
        },
        {
            "prompt": "Which library is most commonly used for tabular data analysis in Python?",
            "options": ["pandas", "matplotlib", "flask", "requests"],
            "correct_option_index": 0,
            "explanation": "pandas provides DataFrame structures purpose-built for tabular data.",
            "difficulty": "easy",
        },
        {
            "prompt": "What does a list comprehension like `[x*2 for x in range(5)]` produce?",
            "options": ["A generator", "[0, 2, 4, 6, 8]", "A syntax error", "A tuple"],
            "correct_option_index": 1,
            "explanation": "It builds a list by doubling each value from 0 to 4.",
            "difficulty": "medium",
        },
    ],
    "SQL": [
        {
            "prompt": "Which clause is used to filter rows after aggregation in SQL?",
            "options": ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
            "correct_option_index": 1,
            "explanation": "HAVING filters aggregated groups; WHERE filters rows before aggregation.",
            "difficulty": "medium",
        },
        {
            "prompt": "Which JOIN returns all rows from the left table and matched rows from the right?",
            "options": ["INNER JOIN", "RIGHT JOIN", "LEFT JOIN", "CROSS JOIN"],
            "correct_option_index": 2,
            "explanation": "LEFT JOIN keeps every row from the left table, filling unmatched right-side columns with NULL.",
            "difficulty": "easy",
        },
    ],
    "Survey Design": [
        {
            "prompt": "What is the primary purpose of a pilot survey?",
            "options": [
                "To finalize the budget",
                "To test and refine the questionnaire before full rollout",
                "To publish preliminary results",
                "To train field staff on data entry software",
            ],
            "correct_option_index": 1,
            "explanation": "A pilot survey identifies ambiguous questions, flow issues, and timing problems before the main survey.",
            "difficulty": "medium",
        },
        {
            "prompt": "Which type of question bias occurs when the wording of a question influences the response?",
            "options": ["Sampling bias", "Leading question bias", "Non-response bias", "Coverage bias"],
            "correct_option_index": 1,
            "explanation": "Leading questions steer respondents toward a particular answer through their phrasing.",
            "difficulty": "medium",
        },
    ],
    "Sampling": [
        {
            "prompt": "In stratified sampling, the population is divided into groups based on:",
            "options": [
                "Random chance",
                "Shared characteristics relevant to the study",
                "Alphabetical order",
                "Survey response order",
            ],
            "correct_option_index": 1,
            "explanation": "Strata are formed from meaningful shared characteristics to reduce variance within groups.",
            "difficulty": "medium",
        },
    ],
    "Data Privacy": [
        {
            "prompt": "Which practice best protects respondent privacy in published statistical tables?",
            "options": [
                "Publishing raw microdata",
                "Cell suppression / statistical disclosure control",
                "Removing table titles",
                "Rounding to the nearest hundred only",
            ],
            "correct_option_index": 1,
            "explanation": "Statistical disclosure control techniques (e.g. cell suppression) prevent re-identification of individuals.",
            "difficulty": "medium",
        },
    ],
    "Leadership": [
        {
            "prompt": "Which approach best describes situational leadership?",
            "options": [
                "Using the same leadership style regardless of context",
                "Adapting leadership style based on the team's readiness and the task at hand",
                "Delegating all decisions permanently",
                "Avoiding feedback to maintain team morale",
            ],
            "correct_option_index": 1,
            "explanation": "Situational leadership adjusts directive vs supportive behaviour based on follower readiness.",
            "difficulty": "medium",
        },
    ],
}


def _generic_questions(competency_name: str, domain: str, count: int) -> list[GeneratedQuestion]:
    """Fallback template used when no curated bank entry exists for a competency."""
    templates = [
        {
            "prompt": f"Which statement best reflects a core principle of {competency_name}?",
            "options": [
                f"{competency_name} has no established standards or best practices",
                f"Applying {competency_name} correctly improves data quality and decision-making",
                f"{competency_name} is only relevant to private-sector organizations",
                f"{competency_name} cannot be taught or assessed",
            ],
            "correct_option_index": 1,
            "explanation": f"Sound application of {competency_name} directly supports data quality and evidence-based decisions.",
            "difficulty": "easy",
        },
        {
            "prompt": f"In the context of Official Statistics, {competency_name} is most relevant to:",
            "options": [
                "Marketing and advertising only",
                f"Producing reliable, comparable statistical outputs that depend on {competency_name}",
                "Personal hobby projects",
                "None of the above",
            ],
            "correct_option_index": 1,
            "explanation": f"{competency_name} contributes to the reliability and comparability of official statistical outputs.",
            "difficulty": "medium",
        },
        {
            "prompt": f"A common risk of weak {competency_name} skills in a statistical office is:",
            "options": [
                "Improved turnaround time",
                "Reduced data quality or compliance issues",
                "Lower operating costs",
                "No measurable impact",
            ],
            "correct_option_index": 1,
            "explanation": f"Gaps in {competency_name} typically show up as quality, compliance, or efficiency issues.",
            "difficulty": "medium",
        },
    ]
    return templates[:count]


class MockAIProvider(AIProvider):
    def generate_assessment_questions(
        self, *, competency_name: str, domain: str, count: int
    ) -> list[GeneratedQuestion]:
        bank = _QUESTION_BANK.get(competency_name)
        if bank:
            selected = bank[:count] if len(bank) >= count else bank
            if len(selected) < count:
                selected = selected + _generic_questions(competency_name, domain, count - len(selected))
            return selected
        return _generic_questions(competency_name, domain, count)

    def generate_questions_from_text(self, *, chunks: list[str], count: int) -> list[GeneratedQuestion]:
        """
        Heuristic mock generation: extracts sentence-length statements
        directly from the uploaded material as correct answers, and pairs
        each with statements drawn from *other*, unrelated chunks as
        distractors. This is a stand-in for a real LLM extraction/
        generation pass (Phase 9's intended real implementation) — it
        produces materially-grounded questions without requiring an LLM
        API, and every generated question is explicitly flagged
        AI_GENERATED and held for trainer review before publication.
        """
        sentences_by_chunk: list[list[str]] = []
        for chunk in chunks:
            sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", chunk) if 40 <= len(s.strip()) <= 220]
            sentences_by_chunk.append(sentences)

        all_sentences = [s for group in sentences_by_chunk for s in group]
        if len(all_sentences) < 2:
            return []

        questions: list[GeneratedQuestion] = []
        used = set()
        for i, correct in enumerate(all_sentences):
            if len(questions) >= count:
                break
            if correct in used:
                continue
            distractor_pool = [s for s in all_sentences if s != correct and s not in used]
            if len(distractor_pool) < 3:
                continue
            distractors = random.sample(distractor_pool, 3)
            options = distractors + [correct]
            random.shuffle(options)
            correct_index = options.index(correct)
            used.add(correct)

            questions.append(
                {
                    "prompt": "Which of the following statements appears in the uploaded material?",
                    "options": options,
                    "correct_option_index": correct_index,
                    "explanation": f'The uploaded material states: "{correct}"',
                    "difficulty": "medium",
                }
            )
        return questions


def get_ai_provider() -> AIProvider:
    # AI_PROVIDER in config currently only has a "mock" implementation.
    # A real provider (e.g. Anthropic) would be selected here and must
    # implement the same AIProvider interface.
    return MockAIProvider()
