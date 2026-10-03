# routes/get_series_with_creator.py

from models import Series, User, SeriesTags, Tag
from sqlalchemy.orm import Session

def handle_get_series_with_creator(req, session: Session):
    project_id = req.get("project_id")
    if not project_id:
        return {"status": "ERROR", "reason": "project_id required"}

    try:
        # ------------------------------------------------------------
        # Series + User JOIN（論理削除されていない Series）
        # ------------------------------------------------------------
        rows = (
            session.query(Series, User.username)
            .outerjoin(User, Series.created_by == User.id)
            .filter(
                Series.project_id == project_id,
                Series.deleted_flag == False
            )
            .order_by(Series.id)
            .all()
        )

        result = []

        for series, username in rows:

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
            # Series 情報 + created_by_username + tags を返却
            # ------------------------------------------------------------
            result.append({
                "id": series.id,
                "name": series.name,
                "timestamp": series.timestamp,
                "comment": series.comment,
                "created_by": series.created_by,
                "created_by_username": username or "(不明)",
                "tags": tags,
            })

        return {"status": "OK", "series": result}

    except Exception as e:
        return {"status": "ERROR", "reason": str(e)}
