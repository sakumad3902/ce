// server.js

const express = require("express");
const cors = require("cors");
const path = require("path");
const zmqClient = require("./zmq_client");
const zmq = zmqClient();
const multer = require("multer");
const upload = multer();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

/* ============================================================
   ZMQ 通信ユーティリティ
============================================================ */
async function callZmq(cmd, payload = {}) {
  try {
    return await zmq.sendJson({ cmd, ...payload });
  } catch (e) {
    console.error(`ZMQ error (${cmd}):`, e);
    return { status: "ERROR", reason: `${cmd} failed` };
  }
}

const createZmqRoute = cmd => async (req, res) =>
  res.json(await callZmq(cmd, req.body));


/* ============================================================
   認証系
============================================================ */
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  res.json(await callZmq("register_user", { username, email, password }));
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  res.json(await callZmq("login_user", { email, password }));
});

app.post("/session_check", async (req, res) => {
  const { token } = req.body;
  res.json(await callZmq("session_check", { token }));
});


/* ============================================================
   プロジェクト管理
============================================================ */
app.get("/projects", async (req, res) => {
  try {
    const reply = await callZmq("projects");
    if (reply.status !== "OK") return res.json([]);
    res.json(reply.projects);
  } catch (err) {
    console.error("Failed to load projects:", err);
    res.status(500).json({ error: "Failed to load projects" });
  }
});

app.post("/add_project", async (req, res) => {
  const { name, user_id } = req.body;
  const reply = await callZmq("add_project", { name, user_id });

  if (reply?.status !== "OK") {
    return res.json({
      status: "ERROR",
      reason: reply?.reason || "worker failed"
    });
  }

  res.json({ status: "OK", project_id: reply.project_id });
});

app.post("/rename_project", async (req, res) => {
  const { project_id, newName, user_id } = req.body;
  res.json(await callZmq("rename_project", { project_id, newName, user_id }));
});

app.post("/delete_project", async (req, res) => {
  const { project_id, user_id } = req.body;
  res.json(await callZmq("delete_project", { project_id, user_id }));
});


/* ============================================================
   Category / Tag CRUD（createZmqRoute）
============================================================ */
const crudCommands = [
  "category_create",
  "category_update",
  "category_delete",
  "tag_create",
  "tag_update",
  "tag_delete"
];

crudCommands.forEach(cmd => {
  app.post(`/${cmd}`, createZmqRoute(cmd));
});


/* ============================================================
   タグ・カテゴリ一覧
============================================================ */
app.get("/categories", async (req, res) => {
  const reply = await callZmq("category_list", {});
  if (reply.status !== "OK") return res.json([]);
  res.json(reply.categories);
});

app.get("/tags", async (req, res) => {
  const reply = await callZmq("tag_list", {});
  if (reply.status !== "OK") return res.json([]);
  res.json(reply.tags);
});

app.get("/tags_unused", async (req, res) => {
  const reply = await callZmq("tag_list_unused", {});
  if (reply.status !== "OK") return res.json([]);
  res.json(reply.tags);
});


/* ============================================================
   シリーズ関連
============================================================ */
app.post("/get_series_with_creator", async (req, res) => {
  const { project_id } = req.body;
  const reply = await callZmq("get_series_with_creator", { project_id });

  if (reply.status !== "OK") {
    return res.json({ status: "ERROR", reason: reply.reason || "worker failed" });
  }

  res.json(reply);
});

app.post("/get_series_by_id", createZmqRoute("get_series_by_id"));

app.post("/series_update_tags", upload.none(), async (req, res) => {
  const { series_id, tagIds, user_id } = req.body;

  let parsedTagIds = [];
  try {
    parsedTagIds = JSON.parse(tagIds || "[]");
  } catch (e) {
    console.error("tagIds parse error", e);
  }

  res.json(await callZmq("series_update_tags", {
    series_id,
    tagIds: parsedTagIds,
    user_id
  }));
});


/* ============================================================
   ロード / 補正処理
============================================================ */
app.post("/load", async (req, res) => {
  const { project_id } = req.body;

  const frames = await zmq.sendMultipart("load", { project_id });

  // frames = [frame0, frame1, frame2]
  const cmd = frames[0].toString();
  const meta = JSON.parse(frames[1].toString());
  const raw = frames[2]; // Uint8Array

  res.json({
    status: meta.status,
    series: meta.series,
    lengths: meta.lengths,
    raw: Buffer.from(raw).toString("base64") // React で扱いやすい
  });
});

app.post("/apply_correction", async (req, res) => {
  const reply = await callZmq("apply_correction", req.body);

  if (reply.status !== "OK") {
    return res.json({ status: "ERROR", reason: reply.reason || "worker failed" });
  }

  res.json(reply);
});


/* ============================================================
   その他の ZMQ ルート（createZmqRoute）
============================================================ */
[
  "rename",
  "update_comment",
  "update_timestamp",
  "move_selected",
  "delete_selected",
  "append_clipboard",
  "evaluate_series",
  "export_excel",
  "export_excel_start"
].forEach(cmd => {
  app.post(`/${cmd}`, createZmqRoute(cmd));
});

app.get("/export_excel_status", async (req, res) => {
  const jobId = req.query.jobId;
  res.json(await callZmq("export_excel_status", { jobId }));
});


/* ============================================================
   Excel バイナリ返却
============================================================ */
app.post("/evaluate_series_excel", async (req, res) => {
  const reply = await callZmq("evaluate_series", req.body);
  const excelBuffer = Buffer.from(reply.excel, "base64");

  res.setHeader("Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=evaluate.xlsx");

  res.send(excelBuffer);
});


/* ============================================================
   Parquet インポート／エクスポート
============================================================ */
const parquetRoute = cmd => async (req, res) => {
  const meta = { project_id: req.body.project_id };

  if (req.body.overrideSeries) {
    try {
      meta.overrideSeries = JSON.parse(req.body.overrideSeries);
    } catch (e) {
      console.error("overrideSeries parse error", e);
    }
  }

  const fileBuffer = req.file ? req.file.buffer : Buffer.from([]);
  const reply = await zmq.sendMultipart(cmd, meta, fileBuffer);
  res.json(reply);
};

app.post("/import_parquet_preview", upload.single("file"), parquetRoute("import_parquet_preview"));
app.post("/import_parquet_apply", upload.single("file"), parquetRoute("import_parquet_apply"));
app.post("/export_parquet_preview", upload.none(), parquetRoute("export_parquet_preview"));
app.post("/export_parquet_apply", upload.none(), parquetRoute("export_parquet_apply"));


/* ============================================================
   起動
============================================================ */
app.listen(3000, "0.0.0.0", () => {
  console.log("Node proxy running on port 3000");
});
