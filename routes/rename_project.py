# routes/rename_project.py

import time
from sqlalchemy.orm import Session
from models import Project

def handle_rename_project(req, session: Session):
    project_id = req.get("project_id")
    new_name = req.get("newName")
    user_id = req.get("user_id")

    if not project_id or not new_name:
        return {"status": "ERROR", "reason": "project_id and newName required"}

    try:
        with session.begin():

            project = (
                session.query(Project)
                .filter_by(id=project_id, deleted_flag=False)
                .first()
            )
            if not project:
                raise ValueError("project not found")

            dup = (
                session.query(Project)
                .filter(Project.name == new_name)
                .filter(Project.deleted_flag == False)
                .filter(Project.id != project_id)
                .first()
            )
            if dup:
                raise ValueError("newName already exists")

            project.name = new_name
            project.updated_at = int(time.time())
            project.updated_by = user_id

        return {"status": "OK"}

    except Exception as e:
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
