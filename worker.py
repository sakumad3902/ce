# worker.py

import os
import json
import pyarrow as pa
import pyarrow.parquet as pq
import zmq
import traceback
import uuid
import threading

# ============================
# DB 設定
# ============================
from db import engine
from models import Base

Base.metadata.create_all(bind=engine)

from db import get_session
from models import Series, User
from init_db import init_db

# ============================
# ルート関数
# ============================
from routes.add_project import handle_add_project
from routes.rename_project import handle_rename_project
from routes.delete_project import handle_delete_project
from routes.load_projects import handle_load_projects

from routes.load import handle_load
from routes.rename import handle_rename
from routes.update_comment import handle_update_comment
from routes.update_timestamp import handle_update_timestamp

from routes.move import handle_move
from routes.delete import handle_delete
from routes.apply_correction import handle_apply_correction

from routes.import_parquet_preview import handle_import_parquet_preview
from routes.import_parquet_apply import handle_import_parquet_apply
from routes.export_parquet_preview import handle_export_parquet_preview
from routes.export_parquet_apply import handle_export_parquet_apply

from routes.export_excel import handle_export_excel
from routes.append_clipboard import handle_append_clipboard
from routes.evaluate_series import evaluate_series

from routes.get_series_with_creator import handle_get_series_with_creator
from routes.series_update_tags import handle_series_update_tags

from routes.category_list import handle_category_list
from routes.category_create import handle_category_create
from routes.category_update import handle_category_update
from routes.category_delete import handle_category_delete

from routes.tag_list import handle_tag_list
from routes.tag_create import handle_tag_create
from routes.tag_update import handle_tag_update
from routes.tag_list_unused import handle_tag_list_unused
from routes.tag_delete import handle_tag_delete

# 認証系
from routes.register_user import handle as register_user
from routes.login_user import handle as login_user

# ============================================================
# DB 初期化
# ============================================================
# PostgreSQL の場合は init_db を呼ばない
# SQLite の場合のみ data.db がなければ初期化
if engine.url.get_backend_name() == "sqlite":
    if not os.path.exists("data.db"):
        init_db()

# ============================================================
# セッションストア
# ============================================================
session_store = {}

# ============================================================
# Session_Check
# ============================================================
def handle_session_check(req):
    token = req.get("token")
    user = session_store.get(token)
    if not user:
        return {"authenticated": False}

    return {
        "authenticated": True,
        "username": user["username"],
        "role": user["role"],
        "user_id": user["user_id"]
    }

# ============================================================
# ラッパ関数
# ============================================================
def run_series_route(req, handler):
    session = get_session()
    try:
        return handler(req, session)
    finally:
        session.close()

def run_tag_route(req, handler):
    session = get_session()
    try:
        return handler(req, session)
    finally:
        session.close()

def run_user_route(req, handler):
    session = get_session()
    try:
        result = handler(session, req)

        if req.get("cmd") == "login_user" and result.get("status") == "OK":
            token = result.get("token")
            if token:
                session_store[token] = {
                    "user_id": result.get("user_id"),
                    "username": result.get("username"),
                    "role": result.get("role")
                }

        return result
    finally:
        session.close()

# ============================================================
# Excel 非同期ジョブ
# ============================================================
jobs = {}

def start_export_excel_job(meta):
    jobId = str(uuid.uuid4())
    jobs[jobId] = {"status": "pending", "path": None, "error": None}

    threading.Thread(
        target=run_export_excel_job,
        args=(jobId, meta),
        daemon=True
    ).start()

    return {"status": "OK", "jobId": jobId}

def run_export_excel_job(jobId, meta):
    jobs[jobId]["status"] = "running"
    try:
        result = handle_export_excel(meta)
        if result.get("status") == "OK":
            jobs[jobId].update(status="finished", path=result.get("path"))
        else:
            jobs[jobId].update(status="error", error=result.get("reason"))
    except Exception as e:
        jobs[jobId].update(status="error", error=str(e))

def get_export_excel_status(meta):
    jobId = meta.get("jobId")
    if jobId not in jobs:
        return {"status": "ERROR", "reason": "NO_JOB"}

    j = jobs[jobId]
    return {
        "status": "OK",
        "jobId": jobId,
        "state": j["status"],
        "path": j["path"],
        "error": j["error"]
    }

# ============================================================
# cmd 分岐を関数化
# ============================================================
def dispatch_cmd(cmd, req):
    # Series
    if cmd == "load":
        return run_series_route(req, handle_load)

    elif cmd == "rename":
        return run_series_route(req, handle_rename)

    elif cmd == "update_comment":
        return run_series_route(req, handle_update_comment)

    elif cmd == "update_timestamp":
        return run_series_route(req, handle_update_timestamp)

    elif cmd == "move_selected":
        return run_series_route(req, handle_move)

    elif cmd == "delete_selected":
        return run_series_route(req, handle_delete)

    elif cmd == "append_clipboard":
        return run_series_route(req, handle_append_clipboard)

    elif cmd == "import_parquet_apply":
        return handle_import_parquet_apply(req)

    elif cmd == "export_parquet_preview":
        return run_series_route(req, handle_export_parquet_preview)

    elif cmd == "export_parquet_apply":
        return run_series_route(req, handle_export_parquet_apply)

    elif cmd == "get_series_with_creator":
        return run_series_route(req, handle_get_series_with_creator)

    elif cmd == "series_update_tags":
        return run_series_route(req, handle_series_update_tags)

    # DB を使わない
    elif cmd == "apply_correction":
        return handle_apply_correction(req)

    elif cmd == "import_parquet_preview":
        return handle_import_parquet_preview(req)

    elif cmd == "evaluate_series":
        return evaluate_series(
            req.get("packed"),
            req.get("lengths"),
            req.get("names"),
            req.get("ref_index", 0)
        )

    # Excel 非同期ジョブ
    elif cmd == "export_excel_start":
        return start_export_excel_job(req)

    elif cmd == "export_excel_status":
        return get_export_excel_status(req)

    # Project
    elif cmd == "add_project":
        return run_series_route(req, handle_add_project)

    elif cmd == "rename_project":
        return run_series_route(req, handle_rename_project)

    elif cmd == "delete_project":
        return run_series_route(req, handle_delete_project)

    elif cmd == "projects":
        return run_series_route(req, handle_load_projects)

    # Category
    elif cmd == "category_list":
        return run_tag_route(req, handle_category_list)

    elif cmd == "category_create":
        return run_tag_route(req, handle_category_create)

    elif cmd == "category_update":
        return run_tag_route(req, handle_category_update)

    elif cmd == "category_delete":
        return run_tag_route(req, handle_category_delete)

    # Tag
    elif cmd == "tag_list":
        return run_tag_route(req, handle_tag_list)
    
    elif cmd == "tag_create":
        return run_tag_route(req, handle_tag_create)

    elif cmd == "tag_update":
        return run_tag_route(req, handle_tag_update)

    elif cmd == "tag_list_unused":
        return run_tag_route(req, handle_tag_list_unused)

    elif cmd == "tag_delete":
        return run_tag_route(req, handle_tag_delete)    

    # User
    elif cmd == "register_user":
        return run_user_route(req, register_user)

    elif cmd == "login_user":
        return run_user_route(req, login_user)

    elif cmd == "session_check":
        return handle_session_check(req)

    return {"status": "ERROR", "reason": f"Unknown cmd: {cmd}"}

# ============================================================
# ZMQ 初期化
# ============================================================
ctx = zmq.Context()
sock = ctx.socket(zmq.REP)
sock.bind("tcp://127.0.0.1:5555")

print("WORKER_READY", flush=True)

# ============================================================
# Main Loop
# ============================================================
while True:
    try:
        frames = sock.recv_multipart()

        if len(frames) == 1:
            req = json.loads(frames[0].decode("utf8"))
            cmd = req.get("cmd")

        elif len(frames) == 3:
            cmd = frames[0].decode("utf8")
            meta = json.loads(frames[1].decode("utf8"))
            req = {**meta, "file_bytes": frames[2]}

        else:
            sock.send_json({"status": "ERROR", "reason": "Invalid ZMQ frame count"})
            continue

        result = dispatch_cmd(cmd, req)
        sock.send_json(result)

    except Exception as e:
        traceback.print_exc()
        sock.send_json({"status": "ERROR", "reason": str(e)})
