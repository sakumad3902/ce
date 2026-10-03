# init_db.py

from sqlalchemy import create_engine
from models import Base
import sys

def init_db():
    try:
        # 単一 DB に統合（FK が使える）
        engine = create_engine("sqlite:///data.db", echo=False)

        # User / Series すべてのテーブルを作成
        Base.metadata.create_all(bind=engine)

        print("Unified DB initialized successfully.", flush=True)

    except Exception as e:
        print(f"Unified DB initialization failed: {e}", flush=True)
        sys.exit(1)


if __name__ == "__main__":
    init_db()
