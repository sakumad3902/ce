# routes/get_series_with_creator.py

from models import Series, User, SeriesTags, Tag
from sqlalchemy.orm import Session

def handle_get_series_with_creator(req, session: Session):
    project_id = req.get("project_id")
    if not project_id:
        return {"status": "ERROR", "reason": "project_id required"}

    try:
        # ------------------------------------------------------------
        # Series + User JOIN
        # ------------------------------------------------------------
        rows = (
            session.query(
                Series.id,
                Series.name,
                Series.timestamp,
                Series.comment,
                Series.created_by,
                User.username
            )
            .outerjoin(User, Series.created_by == User.id)
            .filter(
                Series.project_id == project_id,
                Series.deleted_flag == False
            )
            .order_by(Series.id)
            .all()
        )

        # ------------------------------------------------------------
        # 全シリーズIDを抽出してタグを一括ロード（N+1防止）
        # ------------------------------------------------------------
        series_ids = [r.id for r in rows]

        tag_rows = (
            session.query(
                SeriesTags.c.series_id,
                Tag.id,
                Tag.name
            )
            .join(Tag, SeriesTags.c.tag_id == Tag.id)
            .filter(SeriesTags.c.series_id.in_(series_ids))
            .all()
        )

        # series_id → [tags] の辞書にまとめる
        tag_map = {}
        for sid, tid, tname in tag_rows:
            tag_map.setdefault(sid, []).append({"id": tid, "name": tname})

        # ------------------------------------------------------------
        # 返却
        # ------------------------------------------------------------
        result = []
        for r in rows:
            result.append({
                "id": r.id,
                "name": r.name,
                "timestamp": r.timestamp,
                "comment": r.comment,
                "created_by_username": r.username or "(不明)",
                "tags": tag_map.get(r.id, [])
            })

        return {"status": "OK", "series": result}

    except Exception as e:
        return {"status": "ERROR", "reason": str(e)}
