# routes/tag_list_unused.py

from sqlalchemy.orm import Session
from models import Tag, SeriesTags, Category

def handle_tag_list_unused(req, session: Session):
    print("TAG_LIST_UNUSED params:", req, flush=True)

    try:
        # ------------------------------------------------------------
        # 未使用タグ = SeriesTags に存在しない tag_id
        # ------------------------------------------------------------
        unused_tags = (
            session.query(Tag, Category)
            .outerjoin(Category, Tag.category_id == Category.id)
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
                    "category_id": t.category_id,
                    "category_name": c.name if c else None,
                    "created_by": t.created_by,
                    "updated_by": t.updated_by,
                    "created_at": t.created_at,
                    "updated_at": t.updated_at
                }
                for (t, c) in unused_tags
            ]
        }

    except Exception as e:
        return {"status": "ERROR", "reason": str(e)}
