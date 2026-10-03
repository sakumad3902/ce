# routes/tag_list.py

from sqlalchemy.orm import Session
from models import Tag

def handle_tag_list(req, session: Session):
    print("TAG_LIST params:", req, flush=True)

    try:
        tags = (
            session.query(Tag)
            .order_by(Tag.name.asc())
            .all()
        )

        return {
            "status": "OK",
            "tags": [
                {
                    "id": t.id,
                    "name": t.name,
                    "normalized_name": t.normalized_name,
                    "created_by": t.created_by,
                    "updated_by": t.updated_by,
                    "created_at": t.created_at,
                    "updated_at": t.updated_at
                }
                for t in tags
            ]
        }

    except Exception as e:
        return {"status": "ERROR", "reason": str(e)}
