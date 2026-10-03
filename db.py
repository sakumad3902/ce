# db.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ============================
# DB 切替設定
# ============================
# USE_POSTGRES=true なら PostgreSQL
# それ以外なら SQLite
USE_POSTGRES = os.getenv("USE_POSTGRES", "false").lower() == "true"

if USE_POSTGRES:
    # ============================
    # PostgreSQL
    # ============================
    DATABASE_URL = "postgresql+psycopg2://postgres:111015@localhost:5432/chemdata"

    engine = create_engine(
        DATABASE_URL,
        echo=False,
        future=True
    )

else:
    # ============================
    # SQLite
    # ============================
    DATABASE_URL = "sqlite:///data.db"

    engine = create_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        connect_args={"check_same_thread": False}
    )

# ============================
# Session 管理
# ============================
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    future=True
)

def get_session():
    """統合 DB 用 Session"""
    return SessionLocal()
