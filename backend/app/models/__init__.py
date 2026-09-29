"""
Import every model module here so that `Base.metadata` is fully populated
wherever `app.database.Base` is used (Alembic autogenerate, create_all in
dev/test, etc). Add new model modules to this list as they're created.
"""

from app.models.user import Department, Role, RoleName, User  # noqa: F401
from app.models.competency import (  # noqa: F401
    Competency,
    CompetencyDomain,
    CompetencyHistory,
    GapSeverity,
    RoleCompetency,
    SkillGap,
    UserCompetency,
)
from app.models.learning import (  # noqa: F401
    Course,
    CourseCompetency,
    CourseSource,
    Enrollment,
    EnrollmentStatus,
    LearningProgress,
    Recommendation,
)
from app.models.assessment import (  # noqa: F401
    Assessment,
    ContentChunk,
    MaterialType,
    Question,
    QuestionStatus,
    QuizAttempt,
    UploadedMaterial,
)
from app.models.misc import AuditLog, CommunityPost, Feedback  # noqa: F401
from app.models.auth import OtpCode, OtpPurpose  # noqa: F401
