// src/AuthGate.jsx

import { useEffect, useState } from "react";
import App from "./App";
import Login from "./auth/Login";
import SignUp from "./auth/SignUp";

// .env の API URL を読む
const API_URL = import.meta.env.VITE_API_URL;

export default function AuthGate() {
  const [authenticated, setAuthenticated] = useState(null);
  const [username, setUsername] = useState(null);
  const [mode, setMode] = useState("login");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("username");

    if (!token) {
      setAuthenticated(false);
      return;
    }

    // API URL を .env から読む
    fetch(`${API_URL}/session_check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setAuthenticated(true);
          setUsername(name); // localStorage の username を使う
        } else {
          setAuthenticated(false);
        }
      })
      .catch(() => {
        setAuthenticated(false);
      });
  }, []);

  if (authenticated === null) {
    return <div style={{ padding: 40 }}>認証確認中...</div>;
  }

  if (!authenticated) {
    return (
      <>
        {mode === "login" ? (
          <Login
            onLogin={(reply) => {
              // localStorage に保存
              localStorage.setItem("token", reply.token);
              localStorage.setItem("username", reply.username);

              setUsername(reply.username);
              setAuthenticated(true);
            }}
            onSwitchToSignUp={() => setMode("signup")}
          />
        ) : (
          <SignUp
            onRegistered={() => setMode("login")}
            onBack={() => setMode("login")}
          />
        )}
      </>
    );
  }

  return <App username={username} />;
}
