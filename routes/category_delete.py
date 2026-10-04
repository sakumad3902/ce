# routes/category_delete.py

import time
from sqlalchemy.orm import Session
from models import Category, User, Tag

def handle_category_delete(req, session: Session):
    """
    単独カテゴリ削除
    req = {
        "id": 3,
        "user_id": 5
    }
    """
    print("CATEGORY_DELETE params:", req, flush=True)

    try:
        category_id = req.get("id")
        user_id = req.get("user_id")

        # ----------------------------------------
        # 必須チェック
        # ----------------------------------------
        if not category_id:
            return {"status": "ERROR", "reason": "id required"}
        if not user_id:
            return {"status": "ERROR", "reason": "user_id required"}

        try:
            with session.begin():

                # ----------------------------------------
                # User チェック
                # ----------------------------------------
                user = session.query(User).filter(User.id == user_id).first()
                if not user:
                    raise ValueError("user not found")

                # ----------------------------------------
                # Category チェック
                # ----------------------------------------
                cat = session.query(Category).filter(Category.id == category_id).first()
                if not cat:
                    raise ValueError("Category not found")

                # ----------------------------------------
                # 使用中チェック（タグが紐づいている場合は削除不可）
                # ----------------------------------------
                linked_tags = (
                    session.query(Tag)
                    .filter(Tag.category_id == category_id)
                    .first()
                )
                if linked_tags:
                    raise ValueError("Category is used by tags and cannot be deleted")

                # ----------------------------------------
                # 削除処理（ACID）
                # ----------------------------------------
                print(f"Deleting category: {cat.id} ({cat.name})", flush=True)
                session.delete(cat)

            return {
                "status": "OK",
                "deleted_category_id": category_id
            }

        except Exception as e:
            session.rollback()
            return {"status": "ERROR", "reason": str(e)}

    except Exception as e:
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
