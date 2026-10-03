# routes/append_clipboard.py

import numpy as np
import time
from sqlalchemy.orm import Session
from models import Series, Project, SeriesTags

def handle_append_clipboard(req, session: Session):
    print("APPEND_CLIPBOARD params:", req, flush=True)

    try:
        # ------------------------------------------------------------
        # project_id
        # ------------------------------------------------------------
        project_id = req.get("project_id")
        if not project_id:
            return {"status": "ERROR", "reason": "project_id required"}

        project = (
            session.query(Project)
            .filter(Project.id == project_id, Project.deleted_flag == False)
            .first()
        )
        if not project:
            return {"status": "ERROR", "reason": "project not found"}

        # ------------------------------------------------------------
        # series_list
        # ------------------------------------------------------------
        series_list = req.get("series")
        if not series_list or not isinstance(series_list, list):
            return {"status": "ERROR", "reason": "No valid series"}

        # ------------------------------------------------------------
        # user_id
        # ------------------------------------------------------------
        user_id = req.get("user_id")
        if not user_id:
            return {"status": "ERROR", "reason": "user_id required"}

        # ------------------------------------------------------------
        # トランザクション（安全版）
        # ------------------------------------------------------------
        objects = []
        tag_links = []   # ← SeriesTags の insert 用
        now = int(time.time())

        for s in series_list:
            sid = str(s["id"])
            name = str(s["name"])
            ts = int(s["timestamp"])

            x_arr = np.asarray(s.get("x", []), dtype=np.float32)
            y_arr = np.asarray(s.get("y", []), dtype=np.float32)

            if x_arr.size == 0 or y_arr.size == 0:
                continue

            # ------------------------------------------------------------
            # Series 本体
            # ------------------------------------------------------------
            objects.append(
                Series(
                    id=sid,
                    project_id=project.id,
                    name=name,
                    timestamp=ts,
                    updated_at=now,
                    deleted_flag=False,
                    x_blob=x_arr.tobytes(),
                    y_blob=y_arr.tobytes(),
                    created_by=user_id,
                    updated_by=user_id
                )
            )

            # ------------------------------------------------------------
            # タグ紐付け（tags: number[]）
            # ------------------------------------------------------------
            tag_ids = s.get("tags", [])
            if tag_ids and isinstance(tag_ids, list):
                for tid in tag_ids:
                    tag_links.append({"series_id": sid, "tag_id": tid})

        try:
            # ------------------------------------------------------------
            # Series 本体を bulk insert
            # ------------------------------------------------------------
            session.bulk_save_objects(objects)

            # ------------------------------------------------------------
            # SeriesTags を insert
            # ------------------------------------------------------------
            if tag_links:
                session.execute(SeriesTags.insert(), tag_links)

            session.commit()

        except Exception as e:
            session.rollback()
            return {"status": "ERROR", "reason": str(e)}

        return {"status": "OK"}

    except Exception as e:
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
