// src/api/http.js
const API = import.meta.env.VITE_API_URL;

export async function post(path, body) {
  const res = await fetch(`${API}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

export async function postMultipart(path, formData) {
  const res = await fetch(`${API}/${path}`, {
    method: "POST",
    body: formData
  });
  return res.json();
}

export async function get(path) {
  const res = await fetch(`${API}/${path}`);
  return res.json();
}
