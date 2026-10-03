# routes/register_user.py

from models import User
from sqlalchemy.orm import Session
import time
import hashlib

def hash_password(password: str) -> str:
    """簡易ハッシュ（本番は Argon2id 推奨）"""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def handle(db: Session, payload: dict):
    """
    payload = {
        "username": str,
        "email": str,
        "password": str
    }
    """

    username = payload.get("username")
    email = payload.get("email")
    password = payload.get("password")

    if not username or not email or not password:
        return {"status": "ERROR", "reason": "missing fields"}

    try:
        # ACID トランザクション開始
        with db.begin():

            # ------------------------------------------------------------
            # email 重複チェック（論理削除ユーザーは除外）
            # ------------------------------------------------------------
            exists = (
                db.query(User)
                .filter(User.email == email)
                .first()
            )

            if exists:
                return {"status": "ERROR", "reason": "email already registered"}

            # ------------------------------------------------------------
            # パスワードハッシュ化
            # ------------------------------------------------------------
            password_hash = hash_password(password)

            # ------------------------------------------------------------
            # 新規ユーザー作成
            # ------------------------------------------------------------
            user = User(
                username=username,
                email=email,
                password_hash=password_hash,
                role="user",
                created_at=int(time.time())
            )

            db.add(user)

        # begin() を抜けた時点で commit 完了
        return {"status": "OK", "user_id": user.id}

    except Exception as e:
        # begin() が rollback を保証するが、念のため
        db.rollback()
        return {"status": "ERROR", "reason": str(e)}
