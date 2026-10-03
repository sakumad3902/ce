# routes/delete.py (ACID対応・プロジェクト跨ぎ削除版)

import time
from sqlalchemy.orm import Session
from models import Series, Project

def handle_delete(req, session: Session):
    """
    req = {
        "ids": [1,2,3],   # 複数削除
        "id": 123,        # 単体削除
        "user_id": 1      # 削除実行者（任意）
    }

    Series の論理削除（project 跨ぎ対応）
    """

    id_single = req.get("id")
    ids_multi = req.get("ids")
    user_id = req.get("user_id")

    if id_single is None and not ids_multi:
        return {"status": "ERROR", "reason": "id or ids required"}

    # 削除対象 ID のセット化（文字列化）
    if ids_multi:
        target_ids = {str(i) for i in ids_multi}
    else:
        target_ids = {str(id_single)}

    try:
        with session.begin():

            # ------------------------------------------------------------
            # 対象行を取得（project 条件なし）
            # ------------------------------------------------------------
            rows = (
                session.query(Series)
                .filter(Series.id.in_(target_ids), Series.deleted_flag == False)
                .all()
            )

            if not rows:
                return {"status": "ERROR", "reason": "ID(s) not found"}

            # ------------------------------------------------------------
            # 削除前に project_id を抽出（Node 側で meta.json 更新に使う）
            # ------------------------------------------------------------
            project_ids = {row.project_id for row in rows}

            # ------------------------------------------------------------
            # 論理削除（deleted_flag を立てる）
            # ------------------------------------------------------------
            session.query(Series).filter(
                Series.id.in_(target_ids)
            ).update(
                {
                    Series.deleted_flag: True,
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
