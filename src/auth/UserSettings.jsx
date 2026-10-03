// src/auth/UserSettings.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useApi from "../useApi";
import "./css/auth.css";

export default function UserSettings() {
  const api = useApi();
  const navigate = useNavigate();

  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error"); // "success" or "error"
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleSave = async () => {
    if (!username || !email) {
      setMessage("ユーザー名とメールアドレスは必須です");
      setMessageType("error");
      return;
    }

    if (newPassword && !currentPassword) {
      setMessage("パスワードを変更する場合は現在のパスワードが必要です");
      setMessageType("error");
      return;
    }

    setLoading(true);

    const result = await api.updateUserInfo({
      username,
      email,
      currentPassword: currentPassword || null,
      newPassword: newPassword || null,
    });

    setLoading(false);

    if (result.status === "OK") {
      localStorage.setItem("username", username);
      localStorage.setItem("email", email);

      setMessage("ユーザー情報を更新しました");
      setMessageType("success");

      // パスワード欄はクリア
      setCurrentPassword("");
      setNewPassword("");
    } else {
      setMessage(result.reason || "更新に失敗しました");
      setMessageType("error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        <h2 className="auth-title">ユーザー情報編集</h2>

        {/* ▼ ユーザー名 */}
        <input
          className="auth-input"
          placeholder="ユーザー名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* ▼ メールアドレス */}
        <input
          className="auth-input"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* ▼ 現在のパスワード */}
        <input
          className="auth-input"
          type={showPassword ? "text" : "password"}
          placeholder="現在のパスワード（変更する場合のみ）"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        {/* ▼ 新しいパスワード */}
        <input
          className="auth-input"
          type={showPassword ? "text" : "password"}
          placeholder="新しいパスワード（変更する場合のみ）"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        {/* ▼ パスワード表示切替 */}
        <div
          className="auth-text-link"
          style={{ marginTop: "-10px", marginBottom: "10px" }}
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? "パスワードを隠す" : "パスワードを表示する"}
        </div>

        {/* ▼ 保存ボタン */}
        <button className="auth-button" onClick={handleSave} disabled={loading}>
          {loading ? "保存中..." : "保存"}
        </button>

        {/* ▼ メッセージ */}
        {message && (
          <div
            className="auth-error"
            style={{
              color: messageType === "success" ? "green" : "red",
              marginTop: "10px",
            }}
          >
            {message}
          </div>
        )}

        {/* ▼ 戻る */}
        <div className="auth-text-link" onClick={() => navigate("/")}>
          戻る
        </div>

      </div>
    </div>
  );
}
