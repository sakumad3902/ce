# routes/add_project.py

import time
from sqlalchemy.orm import Session
from models import Project

def handle_add_project(req, session: Session):
    """
    req = {
        "name": "プロジェクト名",
        "user_id": 1
    }
    """

    project_name = req.get("name")
    user_id = req.get("user_id")

    if not project_name:
        return {"status": "ERROR", "reason": "name required"}

    # ------------------------------------------------------------
    # 重複チェック（deleted_flag=False のみ）
    # ------------------------------------------------------------
    existing = session.query(Project).filter_by(
        name=project_name,
        deleted_flag=False
    ).first()

    if existing:
        return {"status": "ERROR", "reason": "project already exists"}

    now = int(time.time())

    try:
        # ------------------------------------------------------------
        # ACID トランザクション（DB のみ）
        # ------------------------------------------------------------
        new_project = Project(
            name=project_name,
            description="",
            created_at=now,
            updated_at=now,
            created_by=user_id,
            updated_by=user_id,
            deleted_flag=False
        )

        session.add(new_project)
        session.commit() 

        return {
            "status": "OK",
            "project_id": new_project.id,
            "name": new_project.name,
            "created_at": new_project.created_at,
            "updated_at": new_project.updated_at
        }

    except Exception as e:
        session.rollback() 
        return {"status": "ERROR", "reason": str(e)}
