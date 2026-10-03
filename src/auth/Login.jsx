// src/auth/Login.jsx
import { useState } from "react";
import useApi from "../useApi";
import "./css/auth.css";

export default function Login({ onLogin, onSwitchToSignUp }) {
  const api = useApi();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("メールアドレスとパスワードを入力してください");
      return;
    }

    const result = await api.login(email, password);

    if (result.status === "OK") {
      localStorage.setItem("user_id", result.user_id);
      localStorage.setItem("username", result.username);
      localStorage.setItem("token", result.token);
      localStorage.setItem("role", result.role);

      onLogin({
        token: result.token,
        username: result.username,
        user_id: result.user_id
      });
    } else {
      setMessage(result.reason || "ログインに失敗しました");
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-container">

        <div className="auth-logo">
          <img src="../../icons/logo.png" alt="Chart Corrector Logo" className="logo-image" />
        </div>

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

        <button className="auth-button" onClick={handleLogin}>
          ログイン
        </button>

        {message && <div className="auth-error">{message}</div>}

        <button className="auth-text-link" onClick={onSwitchToSignUp}>
          新規ユーザー登録はこちら
        </button>

      </div>
    </div>
  );
}
