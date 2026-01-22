from sqlalchemy.orm import Session
from app.models.models import AuditLog


def log_event(db: Session, actor_user_id: int, action: str, entity_type: str, entity_id: str, metadata: dict | None = None) -> None:
    entry = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        metadata=metadata or {},
    )
    db.add(entry)
    db.commit()
