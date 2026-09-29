from app.models.competency import GapSeverity
from app.services.gap_service import _severity_for


def test_gap_severity_thresholds():
    assert _severity_for(0) == GapSeverity.NONE
    assert _severity_for(0.5) == GapSeverity.LOW
    assert _severity_for(0.99) == GapSeverity.LOW
    assert _severity_for(1.0) == GapSeverity.MODERATE
    assert _severity_for(1.99) == GapSeverity.MODERATE
    assert _severity_for(2.0) == GapSeverity.CRITICAL
    assert _severity_for(4.5) == GapSeverity.CRITICAL


def test_level_from_percent_is_deterministic_and_linear():
    from app.services.assessment_service import _level_from_percent

    assert _level_from_percent(0) == 0
    assert _level_from_percent(100) == 5
    assert _level_from_percent(50) == 2.5
    assert _level_from_percent(60) == 3.0
    # Same input always produces the same output — no randomness in scoring.
    assert _level_from_percent(73) == _level_from_percent(73)
