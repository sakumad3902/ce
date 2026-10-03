# routes/tag_create.py

import time
from sqlalchemy.orm import Session
from models import Tag, User

def handle_tag_create(req, session: Session):
    print("TAG_CREATE params:", req, flush=True)

    name = req.get("name")
    normalized_name = req.get("normalized_name")
    user_id = req.get("user_id")

    if not name or not normalized_name:
        return {"status": "ERROR", "reason": "name and normalized_name required"}
    if not user_id:
        return {"status": "ERROR", "reason": "user_id required"}

    try:
        with session.begin():

            # User チェック
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("user not found")

            # 重複チェック
            dup = (
                session.query(Tag)
                .filter(
                    (Tag.name == name) |
                    (Tag.normalized_name == normalized_name)
                )
                .first()
            )
            if dup:
                raise ValueError("Tag already exists")

            # 作成
            now = int(time.time())
            tag = Tag(
                name=name,
                normalized_name=normalized_name,
                created_at=now,
                updated_at=now,
                created_by=user_id,
                updated_by=user_id
            )
            session.add(tag)

        # begin を抜けた時点で commit 完了
        return {"status": "OK", "tag_id": tag.id}

    except Exception as e:
        # begin の外で rollback は OK（begin が閉じていれば）
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
