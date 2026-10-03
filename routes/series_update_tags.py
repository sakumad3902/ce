# routes/series_update_tags.py

import time
from sqlalchemy.orm import Session
from models import Series, Tag, SeriesTags, User

def handle_series_update_tags(req, session: Session):
    print("SERIES_UPDATE_TAGS params:", req, flush=True)

    series_id = req.get("series_id")
    tagIds = req.get("tagIds") or []
    user_id = req.get("user_id")

    if not series_id:
        return {"status": "ERROR", "reason": "series_id required"}
    if not user_id:
        return {"status": "ERROR", "reason": "user_id required"}

    # User チェック
    user = session.query(User).filter(User.id == user_id).first()
    if not user:
        return {"status": "ERROR", "reason": "user not found"}

    # Series チェック
    series = session.query(Series).filter(Series.id == series_id).first()
    if not series:
        return {"status": "ERROR", "reason": "Series not found"}

    try:
        # ここからトランザクション相当の処理
        # ① 既存タグ削除
        session.execute(
            SeriesTags.delete().where(SeriesTags.c.series_id == series_id)
        )

        # ② tagIds の存在チェック
        for tid in tagIds:
            tag = session.query(Tag).filter(Tag.id == tid).first()
            if not tag:
                raise ValueError(f"Tag id {tid} not found")

        # ③ 再作成
        for tid in tagIds:
            session.execute(
                SeriesTags.insert().values(series_id=series_id, tag_id=tid)
            )

        # 明示的に commit
        session.commit()
        return {"status": "OK"}

    except Exception as e:
        # 失敗時は rollback
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
