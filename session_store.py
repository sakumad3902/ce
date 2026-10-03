# session_store.py

import secrets
import time

class SessionStore:
    def __init__(self):
        # token → { user_id, username, role, expires }
        self.sessions = {}  # ★ これが dict であることが絶対条件

        # セッション有効期限（1時間）
        self.EXPIRE_SEC = 3600

    def create(self, user_id, username, role):
        token = secrets.token_hex(32)
        self.sessions[token] = {
            "user_id": user_id,
            "username": username,
            "role": role,
            "expires": time.time() + self.EXPIRE_SEC
        }
        return token

    def get(self, token):
        data = self.sessions.get(token)
        if not data:
            return None

        # 有効期限チェック
        if data["expires"] < time.time():
            del self.sessions[token]
            return None

        return data

    def delete(self, token):
        if token in self.sessions:
            del self.sessions[token]

# ★ worker が import するインスタンス
session_store = SessionStore()
