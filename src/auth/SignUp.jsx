// src/auth/SignUp.jsx
import { useState } from "react";
import useApi from "../useApi";
import "./css/auth.css";

export default function SignUp({ onRegistered, onBack }) {
  const api = useApi();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setMessage("全ての項目を入力してください");
      return;
    }

    const result = await api.register(username, email, password);

    if (result.status === "OK") {
      onRegistered();
    } else {
      setMessage(result.reason || "登録に失敗しました");
    }
  };

  return (
    <div className="auth-page">   

      <div className="auth-container">

        <h2 className="auth-title">アカウント作成</h2>

        <input
          className="auth-input"
          placeholder="ユーザー名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          className="auth-input"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="auth-button" onClick={handleRegister}>
          登録
        </button>

        {message && <div className="auth-error">{message}</div>}

        {/* ▼ 戻るリンク（文字だけ） */}
        <div className="auth-text-link" onClick={onBack}>
          ログイン画面に戻る
        </div>

      </div>
    </div>
  );
}
