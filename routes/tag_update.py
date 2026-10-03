# routes/tag_update.py

import time
from sqlalchemy.orm import Session
from models import Tag, User

def handle_tag_update(req, session: Session):
    print("TAG_UPDATE params:", req, flush=True)

    try:
        tag_id = req.get("tag_id")
        name = req.get("name")
        normalized_name = req.get("normalized_name")
        user_id = req.get("user_id")

        if not tag_id:
            return {"status": "ERROR", "reason": "tag_id required"}
        if not user_id:
            return {"status": "ERROR", "reason": "user_id required"}

        try:
            with session.begin():

                # User チェック
                user = session.query(User).filter(User.id == user_id).first()
                if not user:
                    raise ValueError("user not found")

                # Tag チェック
                tag = session.query(Tag).filter(Tag.id == tag_id).first()
                if not tag:
                    raise ValueError("Tag not found")

                # 重複チェック
                if name or normalized_name:
                    q = session.query(Tag).filter(Tag.id != tag_id)
                    if name:
                        q = q.filter(Tag.name == name)
                    if normalized_name:
                        q = q.filter(Tag.normalized_name == normalized_name)

                    dup = q.first()
                    if dup:
                        raise ValueError("Tag already exists")

                # 更新
                now = int(time.time())
                if name:
                    tag.name = name
                if normalized_name:
                    tag.normalized_name = normalized_name

                tag.updated_by = user_id
                tag.updated_at = now

            return {"status": "OK"}

        except Exception as e:
            session.rollback()
            return {"status": "ERROR", "reason": str(e)}

    except Exception as e:
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
