# routes/category_list.py

from sqlalchemy.orm import Session
from models import Category

def handle_category_list(req, session: Session):
    print("CATEGORY_LIST params:", req, flush=True)

    try:
        # Category を name 昇順で取得
        categories = (
            session.query(Category)
            .order_by(Category.name.asc())
            .all()
        )

        return {
            "status": "OK",
            "categories": [
                {
                    "id": c.id,
                    "name": c.name,
                    "created_at": c.created_at,
                    "updated_at": c.updated_at
                }
                for c in categories
            ]
        }

    except Exception as e:
        return {"status": "ERROR", "reason": str(e)}
