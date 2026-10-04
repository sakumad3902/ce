# routes/category_update.py

import time
from sqlalchemy.orm import Session
from models import Category, User

def handle_category_update(req, session: Session):
    print("CATEGORY_UPDATE params:", req, flush=True)

    try:
        category_id = req.get("id")
        name = req.get("name")
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
                # 重複チェック（name）
                # ----------------------------------------
                if name:
                    dup = (
                        session.query(Category)
                        .filter(Category.id != category_id)
                        .filter(Category.name == name)
                        .first()
                    )
                    if dup:
                        raise ValueError("Category already exists")

                # ----------------------------------------
                # 更新
                # ----------------------------------------
                now = int(time.time())
                if name:
                    cat.name = name

                cat.updated_at = now

            return {"status": "OK"}

        except Exception as e:
            session.rollback()
            return {"status": "ERROR", "reason": str(e)}

    except Exception as e:
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
