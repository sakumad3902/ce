# routes/update_comment.py

import time
from sqlalchemy.orm import Session
from models import Series, Project

def handle_update_comment(req, session: Session):
    """
    req = {
        "project_id": 7,
        "id": 123,
        "comment": "xxx",
        "user_id": 1
    }

    Series.comment を更新する（Project テーブル対応版）
    """

    project_id = req.get("project_id")
    target_id = req.get("id")
    new_comment = req.get("comment")
    user_id = req.get("user_id")

    if project_id is None:
        return {"status": "ERROR", "reason": "project_id required"}

    if target_id is None or new_comment is None:
        return {"status": "ERROR", "reason": "id and comment required"}

    target_id = str(target_id)

    try:
        # ACID トランザクション開始
        with session.begin():

            # ------------------------------------------------------------
            # Project を取得（deleted_flag = False）
            # ------------------------------------------------------------
            project = (
                session.query(Project)
                .filter(Project.id == project_id, Project.deleted_flag == False)
                .first()
            )

            if not project:
                return {"status": "ERROR", "reason": "project not found"}

            # ------------------------------------------------------------
            # Series を project_id + id で検索（論理削除されていないもの）
            # ------------------------------------------------------------
            series = (
                session.query(Series)
                .filter(
                    Series.project_id == project_id,
                    Series.id == target_id,
                    Series.deleted_flag == False
                )
                .first()
            )

            if not series:
                return {"status": "ERROR", "reason": "ID not found"}

            # ------------------------------------------------------------
            # comment 更新
            # ------------------------------------------------------------
            series.comment = str(new_comment)
            series.updated_at = int(time.time())
            series.updated_by = user_id

        # begin() を抜けた時点で commit 完了
        return {"status": "OK"}

    except Exception as e:
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
