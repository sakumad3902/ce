# routes/get_series_by_id.py

from models import Series, User, SeriesTags, Tag
from sqlalchemy.orm import Session

def handle_get_series_by_id(req, session: Session):
    """
    req = {
        "series_id": 123
    }

    Series + User + Tags を 1件だけ返す
    （loadHeader の部分更新用）
    """

    sid = req.get("series_id")
    if not sid:
        return {"status": "ERROR", "reason": "series_id required"}

    try:
        # ------------------------------------------------------------
        # Series 1件取得
        # ------------------------------------------------------------
        series = (
            session.query(Series)
            .filter(Series.id == sid, Series.deleted_flag == False)
            .one_or_none()
        )

        if not series:
            return {"status": "ERROR", "reason": "series not found"}

        # ------------------------------------------------------------
        # created_by の username を取得
        # ------------------------------------------------------------
        username = (
            session.query(User.username)
            .filter(User.id == series.created_by)
            .scalar()
        ) or "(不明)"

        # ------------------------------------------------------------
        # タグ一覧を取得（SeriesTags → Tag）
        # ------------------------------------------------------------
        tag_rows = (
            session.query(Tag)
            .join(SeriesTags, SeriesTags.c.tag_id == Tag.id)
            .filter(SeriesTags.c.series_id == series.id)
            .all()
        )

        tags = [{"id": t.id, "name": t.name} for t in tag_rows]

        # ------------------------------------------------------------
        # 返却（loadHeader と同じ構造）
        # ------------------------------------------------------------
        return {
            "status": "OK",
            "series": {
                "id": series.id,
                "name": series.name,
                "timestamp": series.timestamp,
                "comment": series.comment,
                "created_by": series.created_by,
                "created_by_username": username,
                "tags": tags,
            }
        }

    except Exception as e:
        return {"status": "ERROR", "reason": str(e)}
