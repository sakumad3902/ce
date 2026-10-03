# routes/export_parquet_preview.py (ACID対応版・Project対応)

import numpy as np
from sqlalchemy.orm import Session
from models import Series, Project

def handle_export_parquet_preview(req, session: Session):
    project_name = req.get("project")
    if not project_name:
        return {"status": "ERROR", "reason": "project required"}

    try:
        # ACID 読み取りトランザクション開始
        with session.begin():

            # ------------------------------------------------------------
            # Project を取得（deleted_flag = False）
            # ------------------------------------------------------------
            project = (
                session.query(Project)
                .filter(Project.name == project_name, Project.deleted_flag == False)
                .first()
            )

            if not project:
                return {"status": "ERROR", "reason": "project not found"}

            # ------------------------------------------------------------
            # ORM で Series を読み込み（論理削除されていないもの）
            # ------------------------------------------------------------
            rows = (
                session.query(Series)
                .filter(
                    Series.project_id == project.id,
                    Series.deleted_flag == False
                )
                .order_by(Series.id)
                .all()
            )

            # データが無ければ空リストを返す
            if not rows:
                return {"status": "OK", "series": []}

            # ------------------------------------------------------------
            # プレビュー用 series（id / name / timestamp のみ）
            # ------------------------------------------------------------
            series = []

            for r in rows:
                x_arr = np.frombuffer(r.x_blob, dtype=np.float32)
                y_arr = np.frombuffer(r.y_blob, dtype=np.float32)

                # x,y が空ならスキップ
                if x_arr.size == 0 or y_arr.size == 0:
                    continue

                series.append({
                    "id": int(r.id),
                    "name": str(r.name),
                    "timestamp": int(r.timestamp)
                })

        # begin() を抜けた時点で読み取りトランザクション終了
        return {
            "status": "OK",
            "series": series
        }

    except Exception as e:
        session.rollback()
        return {
            "status": "ERROR",
            "reason": str(e)
        }
