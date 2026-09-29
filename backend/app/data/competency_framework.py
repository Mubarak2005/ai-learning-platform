"""
Static definitions of the Official Statistics competency framework.

This is deliberately data, not logic: Phase 4/5 (assessment + gap analysis)
read these rows but never hardcode competency names in code, so the
framework can be revised by editing this file (or, later, an admin UI)
without touching the assessment engine.
"""

from app.models.competency import CompetencyDomain

COMPETENCIES = {
    CompetencyDomain.STATISTICAL: [
        "Survey Design",
        "Sampling",
        "National Accounts",
        "Price Statistics",
        "Labour Statistics",
        "Agricultural Statistics",
        "Industrial Statistics",
        "SDG Indicators",
        "Metadata Standards",
        "Data Quality Frameworks",
    ],
    CompetencyDomain.TECHNICAL: [
        "Python",
        "R",
        "SQL",
        "Stata",
        "SPSS",
        "SAS",
        "GIS",
        "Data Visualization",
        "AI/ML",
        "Cloud Computing",
        "APIs",
        "Open Data",
    ],
    CompetencyDomain.DIGITAL_GOVERNANCE: [
        "Cybersecurity",
        "Data Privacy",
        "Digital Signatures",
        "Government Cloud",
        "Digital Public Infrastructure",
    ],
    CompetencyDomain.BEHAVIOURAL_MANAGERIAL: [
        "Leadership",
        "Communication",
        "Project Management",
        "Ethics",
        "Decision Making",
        "Change Management",
    ],
}

# job_role -> { competency_name: required_level (1-5) }
# A starter mapping for common Official Statistics job roles; extend freely.
ROLE_COMPETENCY_REQUIREMENTS = {
    "Survey Officer": {
        "Survey Design": 4,
        "Sampling": 4,
        "Data Quality Frameworks": 3,
        "SPSS": 3,
        "Data Visualization": 2,
        "Ethics": 3,
        "Communication": 3,
    },
    "Data Analyst": {
        "Python": 4,
        "SQL": 4,
        "R": 3,
        "Data Visualization": 4,
        "AI/ML": 3,
        "Data Quality Frameworks": 3,
        "Cloud Computing": 2,
    },
    "National Accounts Officer": {
        "National Accounts": 5,
        "SDG Indicators": 3,
        "Metadata Standards": 3,
        "Stata": 3,
        "Communication": 3,
    },
    "IT / Systems Officer": {
        "Cybersecurity": 4,
        "Government Cloud": 4,
        "Digital Public Infrastructure": 3,
        "APIs": 4,
        "Cloud Computing": 4,
        "Data Privacy": 3,
    },
    "Divisional Head": {
        "Leadership": 5,
        "Project Management": 4,
        "Decision Making": 4,
        "Change Management": 4,
        "Data Quality Frameworks": 3,
        "Communication": 4,
    },
    "Statistical Officer": {
        "Survey Design": 3,
        "Sampling": 3,
        "Data Quality Frameworks": 3,
        "Python": 3,
        "Data Visualization": 3,
        "SDG Indicators": 2,
        "Communication": 3,
        "Ethics": 3,
    },
}

DEPARTMENTS = [
    ("National Sample Survey Office", "NSSO"),
    ("Central Statistics Office", "CSO"),
    ("NSSTA Training Division", "NSSTA"),
    ("Office of the Registrar General", "ORGI"),
    ("Ministry of Statistics & PI", "MOSPI"),
]
