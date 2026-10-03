# routes/move.py (ACID対応・プロジェクト跨ぎ移動)

import time
from sqlalchemy.orm import Session
from models import Series

def handle_move(req, session: Session):
    """
    req = {
        "ids": [1,2,3],          # 移動対象 Series ID
        "target_project_id": 5,  # 移動先 project_id
        "user_id": 1             # 実行者
    }

    Series の project_id を一括更新する（論理削除ではない）
    """

    ids = req.get("ids")
    target_project_id = req.get("target_project_id")
    user_id = req.get("user_id")

    if not ids:
        return {"status": "ERROR", "reason": "ids required"}

    if not target_project_id:
        return {"status": "ERROR", "reason": "target_project_id required"}

    # ID を文字列化
    target_ids = {str(i) for i in ids}

    try:
        with session.begin():

            # ------------------------------------------------------------
            # 対象行を取得（deleted_flag=False のみ）
            # ------------------------------------------------------------
            rows = (
                session.query(Series)
                .filter(Series.id.in_(target_ids), Series.deleted_flag == False)
                .all()
            )

            if not rows:
                return {"status": "ERROR", "reason": "ID(s) not found"}

            # ------------------------------------------------------------
            # project_id を移動先に更新
            # ------------------------------------------------------------
            session.query(Series).filter(
                Series.id.in_(target_ids)
            ).update(
                {
                    Series.project_id: target_project_id,
                    Series.updated_by: user_id,
                    Series.updated_at: int(time.time())
                },
                synchronize_session=False
            )

        # begin() を抜けた時点で commit 完了
        return {
            "status": "OK"
        }

    except Exception as e:
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
