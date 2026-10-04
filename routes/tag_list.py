# routes/tag_list.py

from sqlalchemy.orm import Session
from models import Tag, Category

def handle_tag_list(req, session: Session):
    print("TAG_LIST params:", req, flush=True)

    try:
        # Tag と Category を LEFT JOIN
        tags = (
            session.query(Tag, Category)
            .outerjoin(Category, Tag.category_id == Category.id)
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
                    "category_id": t.category_id,
                    "category_name": c.name if c else None,
                    "created_by": t.created_by,
                    "updated_by": t.updated_by,
                    "created_at": t.created_at,
                    "updated_at": t.updated_at
                }
                for (t, c) in tags
            ]
        }

    except Exception as e:
        return {"status": "ERROR", "reason": str(e)}
