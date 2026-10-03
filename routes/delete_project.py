# routes/delete_project.py

import time
from sqlalchemy.orm import Session
from models import Project, Series

def handle_delete_project(req, session: Session):
    """
    req = {
        "project_id": 2,
        "user_id": 1
    }

    プロジェクト削除（Project.deleted_flag + Series.deleted_flag）
    """

    project_id = req.get("project_id")
    user_id = req.get("user_id")

    if not project_id:
        return {"status": "ERROR", "reason": "project_id required"}

    # ------------------------------------------------------------
    # DB からプロジェクト取得
    # ------------------------------------------------------------
    project = (
        session.query(Project)
        .filter_by(id=project_id, deleted_flag=False)
        .first()
    )
    if not project:
        return {"status": "ERROR", "reason": "project not found"}

    # ------------------------------------------------------------
    # トランザクション（安全版）
    # ------------------------------------------------------------
    try:
        now = int(time.time())

        # 1. Project を論理削除
        project.deleted_flag = True
        project.updated_by = user_id
        project.updated_at = now

        # 削除済みの名前が UNIQUE に抵触しないように変更する
        project.name = f"{project.name}__deleted__{project.id}"

        # 2. Series を論理削除
        session.query(Series).filter(
            Series.project_id == project.id
        ).update(
            {
                Series.deleted_flag: True,
                Series.updated_by: user_id,
                Series.updated_at: now 
            },
            synchronize_session=False
        )

        # 3. commit
        session.commit()
        return {"status": "OK"}

    except Exception as e:
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
