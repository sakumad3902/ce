# routes/login_user.py

from models import User
from sqlalchemy.orm import Session
import hashlib
import uuid

from session_store import session_store


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def handle(db: Session, payload: dict):
    email = payload.get("email")
    password = payload.get("password")

    if not email or not password:
        return {"status": "ERROR", "reason": "missing fields"}

    try:
        with db.begin():
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return {"status": "ERROR", "reason": "user not found"}

            if user.password_hash != hash_password(password):
                return {"status": "ERROR", "reason": "invalid password"}

        # セッション作成（SessionStore の正しい使い方）
        token = session_store.create(
            user_id=user.id,
            username=user.username,
            role=user.role
        )

        return {
            "status": "OK",
            "token": token,
            "user_id": user.id,
            "username": user.username,
            "role": user.role
        }

    except Exception as e:
        db.rollback()
        return {"status": "ERROR", "reason": str(e)}
