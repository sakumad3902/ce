# routes/category_create.py

import time
from sqlalchemy.orm import Session
from models import Category, User

def handle_category_create(req, session: Session):
    print("CATEGORY_CREATE params:", req, flush=True)

    name = req.get("name")
    user_id = req.get("user_id")

    # ----------------------------------------
    # 必須チェック
    # ----------------------------------------
    if not name:
        return {"status": "ERROR", "reason": "name required"}
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
            # 重複チェック（name）
            # ----------------------------------------
            dup = session.query(Category).filter(Category.name == name).first()
            if dup:
                raise ValueError("Category already exists")

            # ----------------------------------------
            # 作成
            # ----------------------------------------
            now = int(time.time())
            cat = Category(
                name=name,
                created_at=now,
                updated_at=now
            )
            session.add(cat)

        return {"status": "OK", "category_id": cat.id}

    except Exception as e:
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
