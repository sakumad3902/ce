# routes/tag_list_unused.py

from sqlalchemy.orm import Session
from models import Tag, SeriesTags

def handle_tag_list_unused(req, session: Session):
    print("TAG_LIST_UNUSED params:", req, flush=True)

    try:
        # ------------------------------------------------------------
        # 未使用タグ = SeriesTags に存在しない tag_id
        # ------------------------------------------------------------
        unused_tags = (
            session.query(Tag)
            .filter(~Tag.id.in_(
                session.query(SeriesTags.c.tag_id)
            ))
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
                for t in unused_tags
            ]
        }

    except Exception as e:
        return {"status": "ERROR", "reason": str(e)}
