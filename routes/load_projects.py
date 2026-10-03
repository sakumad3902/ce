# routes/load_projects.py

from models import Project, User
from sqlalchemy.orm import Session, aliased

def handle_load_projects(req, session: Session):
    """
    プロジェクト一覧を返す
    UI は get("projects") を呼ぶ
    """

    try:
        # ------------------------------------------------------------
        # User テーブルを 2 回 JOIN するための alias
        # ------------------------------------------------------------
        UpdatedByUser = aliased(User)
        CreatedByUser = aliased(User)

        # ------------------------------------------------------------
        # JOIN（updated_by と created_by の両方の username を取得）
        # ------------------------------------------------------------
        rows = (
            session.query(
                Project.id.label("project_id"),
                Project.name,
                Project.created_at,
                Project.updated_at,
                Project.description,
                Project.updated_by,
                Project.created_by,
                UpdatedByUser.username.label("updated_by_username"),
                CreatedByUser.username.label("created_by_username")
            )
            .outerjoin(UpdatedByUser, UpdatedByUser.id == Project.updated_by)
            .outerjoin(CreatedByUser, CreatedByUser.id == Project.created_by)
            .filter(Project.deleted_flag == False)
            .order_by(Project.id)
            .all()
        )

        # ------------------------------------------------------------
        # JSON 変換
        # ------------------------------------------------------------
        projects = [
            {
                "project_id": p.project_id,
                "name": p.name,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
                "description": p.description,

                # 作成者
                "created_by": p.created_by,
                "created_by_username": p.created_by_username or "不明",

                # 更新者
                "updated_by": p.updated_by,
                "updated_by_username": p.updated_by_username or "不明",
            }
            for p in rows
        ]

        return {
            "status": "OK",
            "projects": projects
        }

    except Exception as e:
        return {
            "status": "ERROR",
            "reason": str(e)
        }
