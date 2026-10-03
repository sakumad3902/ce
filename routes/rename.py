from sqlalchemy.orm import Session
from models import Series, Project
import time

def handle_rename(req, session: Session):
    project_id = req.get("project_id")
    target_id = req.get("id")
    new_name = req.get("newName")
    user_id = req.get("user_id")

    if project_id is None:
        return {"status": "ERROR", "reason": "project_id required"}

    if target_id is None or new_name is None:
        return {"status": "ERROR", "reason": "id and newName required"}

    target_id = str(target_id)

    try:
        with session.begin():

            project = (
                session.query(Project)
                .filter(Project.id == project_id, Project.deleted_flag == False)
                .first()
            )
            if not project:
                raise ValueError("project not found")   # return しない

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
                raise ValueError("ID not found")        # return しない

            series.name = str(new_name)
            series.updated_by = user_id
            series.updated_at = int(time.time())

        return {"status": "OK"}   # begin の外で return

    except Exception as e:
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
