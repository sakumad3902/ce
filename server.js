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
   ZMQ 通信
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
   register_user / login_user
============================================================ */
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  res.json(await callZmq("register_user", { username, email, password }));
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  res.json(await callZmq("login_user", { email, password }));
});

/* ============================================================
   /session_check
============================================================ */
app.post("/session_check", async (req, res) => {
  const { token } = req.body;
  res.json(await callZmq("session_check", { token }));
});

/* ============================================================
   /projects
============================================================ */
app.get("/projects", async (req, res) => {
  try {
    const reply = await callZmq("projects");   

    if (reply.status !== "OK") {
      return res.json([]);
    }

    res.json(reply.projects);  
  } catch (err) {
    console.error("Failed to load projects:", err);
    res.status(500).json({ error: "Failed to load projects" });
  }
});

/* ============================================================
   add_project
============================================================ */
app.post("/add_project", async (req, res) => {
  try {
    const { name, user_id } = req.body;
    const reply = await callZmq("add_project", { name, user_id });

    if (reply?.status !== "OK") {
      return res.json({
        status: "ERROR",
        reason: reply?.reason || "worker failed"
      });
    }
  
    res.json({ status: "OK", project_id: reply.project_id });

  } catch (err) {
    console.error("add_project error:", err);
    res.status(500).json({ status: "ERROR", reason: err.message });
  }
});

/* ============================================================
   rename_project / delete_project
============================================================ */
app.post("/rename_project", async (req, res) => {
  const { project_id, newName, user_id } = req.body;
  res.json(await callZmq("rename_project", { project_id, newName, user_id }));
});

app.post("/delete_project", async (req, res) => {
  const { project_id, user_id  } = req.body;
  res.json(await callZmq("delete_project", { project_id, user_id }));
});
/* ============================================================
   delete_project
============================================================ */
app.post("/delete_project", async (req, res) => {
  const { project_id, user_id  } = req.body;
  res.json(await callZmq("delete_project", { project_id, user_id }));
});

/* ============================================================
   Tag 管理
============================================================ */
app.get("/tags", async (req, res) => {
  const reply = await callZmq("tag_list", {});
  if (reply.status !== "OK") return res.json([]);
  res.json(reply.tags);
});

app.post("/tag_create", async (req, res) => {
  const { name, normalized_name, user_id } = req.body;
  res.json(await callZmq("tag_create", { name, normalized_name, user_id }));
});

app.post("/tag_update", async (req, res) => {
  const { tag_id, name, normalized_name, user_id } = req.body;
  res.json(await callZmq("tag_update", { tag_id, name, normalized_name, user_id }));
});

app.get("/tags_unused", async (req, res) => {
  const reply = await callZmq("tag_list_unused", {});
  if (reply.status !== "OK") return res.json([]);
  res.json(reply.tags);
});

app.post("/tag_delete", async (req, res) => {
  const { tag_ids, user_id } = req.body;
  // tag_ids は配列である必要がある
  if (!Array.isArray(tag_ids)) {
    return res.json({ status: "ERROR", reason: "tag_ids must be an array" });
  }
  res.json(await callZmq("tag_delete", { tag_ids, user_id }));
});

/* ============================================================
   load / apply_correction
============================================================ */
app.post("/load", createZmqRoute("load"));
app.post("/apply_correction", createZmqRoute("apply_correction"));

/* ============================================================
   Rename / update_comment / update_timestamp
============================================================ */
app.post("/rename", async (req, res) => {
  const { id, newName, project_id } = req.body;
  res.json(await callZmq("rename", { id, newName, project_id }));
});

app.post("/update_comment", async (req, res) => {
  const { id, comment, project_id } = req.body;
  res.json(await callZmq("update_comment", { id, comment, project_id }));
});

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

app.post("/update_timestamp", async (req, res) => {
  const { id, timestamp, project_id } = req.body;
  res.json(await callZmq("update_timestamp", { id, timestamp, project_id }));
});

/* ============================================================
   move_selected
============================================================ */
app.post("/move_selected", async (req, res) => {
  const { ids, target_project_id, user_id } = req.body;
  res.json(await callZmq("move_selected", {ids, target_project_id, user_id }));
});

/* ============================================================
   delete_selected
============================================================ */
app.post("/delete_selected", async (req, res) => {
  const { ids, user_id } = req.body;
  res.json(await callZmq("delete_selected", { ids, user_id }));
});

/* ============================================================
   append_clipboard
============================================================ */
app.post("/append_clipboard", async (req, res) => {
  const { project_id, series, user_id } = req.body;
  res.json(await callZmq("append_clipboard", { project_id, series, user_id }));
});

app.post("/get_series_with_creator", async (req, res) => {
  const { project_id } = req.body;
  res.json(await callZmq("get_series_with_creator", { project_id }));
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
   evaluate_series
============================================================ */
const evaluateSeriesCore = req => callZmq("evaluate_series", req.body);

app.post("/evaluate_series", async (req, res) => {
  res.json(await evaluateSeriesCore(req));
});

app.post("/evaluate_series_excel", async (req, res) => {
  const reply = await evaluateSeriesCore(req);
  const excelBuffer = Buffer.from(reply.excel, "base64");

  res.setHeader("Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=evaluate.xlsx");

  res.send(excelBuffer);
});

/* ============================================================
   Excel エクスポート
============================================================ */
app.post("/export_excel", async (req, res) => {
  res.json(await callZmq("export_excel", req.body));
});

app.post("/export_excel_start", async (req, res) => {
  res.json(await callZmq("export_excel_start", req.body));
});

app.get("/export_excel_status", async (req, res) => {
  const jobId = req.query.jobId;
  res.json(await callZmq("export_excel_status", { jobId }));
});

/* ============================================================
   起動
============================================================ */
app.listen(3000, "0.0.0.0", () => {
  console.log("Node proxy running on port 3000");
});
