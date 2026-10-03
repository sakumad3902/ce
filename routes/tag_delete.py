# routes/tag_delete.py

import time
from sqlalchemy.orm import Session
from models import Tag, User, SeriesTags

def handle_tag_delete(req, session: Session):
    """
    未使用タグ（Series に紐づいていないタグ）を複数削除する。
    req = {
        "tag_ids": [1, 2, 3],
        "user_id": 5
    }
    """

    print("TAG_DELETE params:", req, flush=True)

    try:
        tag_ids = req.get("tag_ids")
        user_id = req.get("user_id")

        if not isinstance(tag_ids, list) or len(tag_ids) == 0:
            return {"status": "ERROR", "reason": "tag_ids required"}

        if not user_id:
            return {"status": "ERROR", "reason": "user_id required"}

        try:
            with session.begin():

                # ------------------------------------------------------------
                # User チェック
                # ------------------------------------------------------------
                user = session.query(User).filter(User.id == user_id).first()
                if not user:
                    raise ValueError("user not found")

                # ------------------------------------------------------------
                # 対象タグの取得
                # ------------------------------------------------------------
                tags = (
                    session.query(Tag)
                    .filter(Tag.id.in_(tag_ids))
                    .all()
                )

                if len(tags) == 0:
                    raise ValueError("no tags found")

                # ------------------------------------------------------------
                # 未使用タグチェック（SeriesTags に存在しないこと）
                # ------------------------------------------------------------
                for tag in tags:
                    linked = (
                        session.query(SeriesTags)
                        .filter(SeriesTags.c.tag_id == tag.id)
                        .first()
                    )
                    if linked:
                        raise ValueError(f"Tag {tag.id} is used and cannot be deleted")

                # ------------------------------------------------------------
                # 削除処理（ACID）
                # ------------------------------------------------------------
                now = int(time.time())

                for tag in tags:
                    print(f"Deleting unused tag: {tag.id} ({tag.name})", flush=True)
                    session.delete(tag)

                # コミットは session.begin() により自動

            return {
                "status": "OK",
                "deleted_count": len(tags),
                "deleted_tag_ids": tag_ids
            }

        except Exception as e:
            session.rollback()
            return {"status": "ERROR", "reason": str(e)}

    except Exception as e:
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
