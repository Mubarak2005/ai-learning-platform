import uuid
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.rbac import get_current_user
from app.database import get_db
from app.models.misc import CommunityPost
from app.models.user import User

router = APIRouter()


class PostCreateRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    topic: Optional[str] = Field(None, max_length=200)


class PostResponse(BaseModel):
    id: uuid.UUID
    content: str
    topic: Optional[str] = None
    author_name: str
    author_role: Optional[str] = None
    created_at: str


@router.get("", response_model=list[PostResponse])
def list_posts(db: Session = Depends(get_db)):
    posts = db.query(CommunityPost).order_by(CommunityPost.created_at.desc()).limit(100).all()
    return [
        PostResponse(
            id=p.id,
            content=p.content,
            topic=p.topic,
            author_name=p.user.full_name if p.user else "Unknown",
            author_role=p.user.role.name.value if p.user and p.user.role else None,
            created_at=p.created_at.isoformat(),
        )
        for p in posts
    ]


@router.post("", response_model=PostResponse, status_code=201)
def create_post(
    payload: PostCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    post = CommunityPost(user_id=current_user.id, content=payload.content, topic=payload.topic)
    db.add(post)
    db.commit()
    db.refresh(post)
    return PostResponse(
        id=post.id,
        content=post.content,
        topic=post.topic,
        author_name=current_user.full_name,
        author_role=current_user.role.name.value if current_user.role else None,
        created_at=post.created_at.isoformat(),
    )
