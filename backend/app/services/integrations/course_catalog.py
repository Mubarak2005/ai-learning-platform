"""
Phase 7 — iGOT Karmayogi & NSSTA/TPAC integration layer.

The rest of the platform (recommendation engine, course browsing,
enrollment) depends only on `CourseCatalogAdapter`, never on iGOT or NSSTA
directly. Two mock adapters implement that contract today, generating a
realistic catalogue from the competency framework so the platform is
fully demoable without external API access. Swapping in the real iGOT API
later means writing a `LiveIgotAdapter` that implements this same
interface and flipping `IGOT_MODE=live` in config — nothing else changes.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from app.config import get_settings

settings = get_settings()


@dataclass
class AdapterCourse:
    external_id: str
    title: str
    description: str
    duration_hours: float
    url: str
    competency_names: list[str] = field(default_factory=list)
    target_level: int = 3


class CourseCatalogAdapter(ABC):
    @abstractmethod
    def list_courses_for_competencies(self, competency_names: list[str]) -> list[AdapterCourse]:
        ...


class MockIgotAdapter(CourseCatalogAdapter):
    """
    Generates a plausible iGOT Karmayogi-style catalogue entry per
    competency. In live mode this would call the real iGOT course-search
    API and map its response into the same AdapterCourse shape.
    """

    def list_courses_for_competencies(self, competency_names: list[str]) -> list[AdapterCourse]:
        courses = []
        for name in competency_names:
            courses.append(
                AdapterCourse(
                    external_id=f"igot-{name.lower().replace(' ', '-').replace('/', '-')}",
                    title=f"{name} Fundamentals",
                    description=(
                        f"An iGOT Karmayogi course covering the fundamentals of {name}, "
                        f"designed for officials in India's Official Statistical System."
                    ),
                    duration_hours=6.0,
                    url=f"https://igotkarmayogi.gov.in/courses/{name.lower().replace(' ', '-')}",
                    competency_names=[name],
                    target_level=3,
                )
            )
            courses.append(
                AdapterCourse(
                    external_id=f"igot-{name.lower().replace(' ', '-').replace('/', '-')}-advanced",
                    title=f"Advanced {name} for Statistical Officers",
                    description=(
                        f"An advanced iGOT Karmayogi course building expert-level proficiency in {name}."
                    ),
                    duration_hours=12.0,
                    url=f"https://igotkarmayogi.gov.in/courses/{name.lower().replace(' ', '-')}-advanced",
                    competency_names=[name],
                    target_level=5,
                )
            )
        return courses


class MockNsstaAdapter(CourseCatalogAdapter):
    """Generates NSSTA/TPAC-style training-programme catalogue entries."""

    def list_courses_for_competencies(self, competency_names: list[str]) -> list[AdapterCourse]:
        courses = []
        for name in competency_names:
            courses.append(
                AdapterCourse(
                    external_id=f"nssta-{name.lower().replace(' ', '-').replace('/', '-')}",
                    title=f"NSSTA Workshop: {name}",
                    description=(
                        f"A classroom-and-practicum NSSTA/TPAC training programme on {name}, "
                        f"aligned to the TPAC-recommended curriculum."
                    ),
                    duration_hours=24.0,
                    url=f"https://nssta.gov.in/programmes/{name.lower().replace(' ', '-')}",
                    competency_names=[name],
                    target_level=4,
                )
            )
        return courses


def get_igot_adapter() -> CourseCatalogAdapter:
    # Only "mock" is implemented; IGOT_MODE=live would return a real adapter
    # once credentials/API access exist.
    return MockIgotAdapter()


def get_nssta_adapter() -> CourseCatalogAdapter:
    return MockNsstaAdapter()
