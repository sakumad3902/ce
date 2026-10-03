import time
from sqlalchemy import (
    Column, String, Integer, LargeBinary, ForeignKey, Boolean,
    UniqueConstraint, Table
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

# ============================
# User テーブル
# ============================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)

    username = Column(String, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    password_hash = Column(String, nullable=False)

    role = Column(String, nullable=False, default="user")

    created_at = Column(Integer, nullable=False, default=lambda: int(time.time()))
    updated_at = Column(Integer, nullable=False, default=lambda: int(time.time()))
    last_login = Column(Integer, nullable=True)

    status = Column(String, nullable=False, default="active")

    created_series = relationship(
        "Series",
        foreign_keys="Series.created_by",
        back_populates="creator",
        lazy="dynamic"
    )
    updated_series = relationship(
        "Series",
        foreign_keys="Series.updated_by",
        back_populates="updater",
        lazy="dynamic"
    )

    created_projects = relationship(
        "Project",
        foreign_keys="Project.created_by",
        back_populates="creator",
        lazy="dynamic"
    )
    updated_projects = relationship(
        "Project",
        foreign_keys="Project.updated_by",
        back_populates="updater",
        lazy="dynamic"
    )

    # Tag との関連（作成・更新）
    created_tags = relationship(
        "Tag",
        foreign_keys="Tag.created_by",
        back_populates="creator",
        lazy="dynamic"
    )
    updated_tags = relationship(
        "Tag",
        foreign_keys="Tag.updated_by",
        back_populates="updater",
        lazy="dynamic"
    )


# ============================
# Tag テーブル
# ============================
class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String, nullable=False, unique=True)
    normalized_name = Column(String, nullable=False, unique=True)

    created_at = Column(Integer, nullable=False, default=lambda: int(time.time()))
    updated_at = Column(Integer, nullable=False, default=lambda: int(time.time()))

    # FK: User.id
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    creator = relationship("User", foreign_keys=[created_by], back_populates="created_tags")
    updater = relationship("User", foreign_keys=[updated_by], back_populates="updated_tags")

    # Series との多対多
    series = relationship(
        "Series",
        secondary="series_tags",
        back_populates="tags"
    )


# ============================
# SeriesTags 中間テーブル（Series ↔ Tag）
# ============================
SeriesTags = Table(
    "series_tags",
    Base.metadata,
    Column("series_id", String, ForeignKey("series.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True)
)


# ============================
# Project テーブル
# ============================
class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String, nullable=False)
    description = Column(String, nullable=True, default="")

    created_at = Column(Integer, nullable=False, default=lambda: int(time.time()))
    updated_at = Column(Integer, nullable=False, default=lambda: int(time.time()))
    deleted_flag = Column(Boolean, nullable=False, default=False)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    creator = relationship("User", foreign_keys=[created_by], back_populates="created_projects")
    updater = relationship("User", foreign_keys=[updated_by], back_populates="updated_projects")

    series = relationship(
        "Series",
        back_populates="project_ref",
        lazy="dynamic"
    )

    __table_args__ = (
        UniqueConstraint("name", "deleted_flag", name="uq_project_name_active"),
    )


# ============================
# Series テーブル
# ============================
class Series(Base):
    __tablename__ = "series"

    id = Column(String, primary_key=True)

    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    name = Column(String, nullable=False)
    comment = Column(String, nullable=True, default="")

    # タグ（多対多）
    tags = relationship(
        "Tag",
        secondary="series_tags",
        back_populates="series",
        lazy="joined"
    )

    timestamp = Column(Integer, nullable=False)
    updated_at = Column(Integer, nullable=False, default=lambda: int(time.time()))
    deleted_flag = Column(Boolean, nullable=False, default=False)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    creator = relationship("User", foreign_keys=[created_by], back_populates="created_series")
    updater = relationship("User", foreign_keys=[updated_by], back_populates="updated_series")

    project_ref = relationship("Project", back_populates="series")

    x_blob = Column(LargeBinary, nullable=False)
    y_blob = Column(LargeBinary, nullable=False)
