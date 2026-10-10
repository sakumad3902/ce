# worker_dispatcher.py

import json
import base64  # ★ 必要
from worker_zmq_helpers import split_raw_bytes, encode_chunk  # ★ 必要

from db import get_session
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
from routes.get_series_by_id import handle_get_series_by_id
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

from routes.register_user import handle as register_user
from routes.login_user import handle as login_user


# ============================================================
# セッションラッパ
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


def run_user_route(req, handler, session_store):
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
# dispatcher 本体
# ============================================================
load_cache = {}   # project_id → raw_bytes

def dispatch_cmd(cmd, req, session_store):

    # Series
    if cmd == "load":
        return run_series_route(req, handle_load)

    elif cmd == "load_chunk":
        part = int(req.get("part", 0))
        total_parts = int(req.get("total_parts", 1))
        project_id = req.get("project_id")

        # キャッシュに raw_bytes があるなら handle_load を呼ばない
        if project_id in load_cache:
            raw_bytes = load_cache[project_id]
        else:
            result = run_series_route(req, handle_load)
            if result.get("status") != "OK":
                return result

            packed_b64 = result.get("packed", "")
            raw_bytes = base64.b64decode(packed_b64.encode("utf8"))

            load_cache[project_id] = raw_bytes  # ★ キャッシュ保存

        chunk = split_raw_bytes(raw_bytes, part, total_parts)
        chunk_b64 = encode_chunk(chunk)

        return {
            "status": "OK",
            "part": part,
            "total_parts": total_parts,
            "chunk_b64": chunk_b64,
        }



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
        result = run_series_route(req, handle_get_series_with_creator)

        # lengths を load から取得して合成
        load_result = run_series_route(req, handle_load)
        result["lengths"] = load_result.get("lengths", [])

        return result

    elif cmd == "get_series_by_id":
        return run_series_route(req, handle_get_series_by_id)

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
        return handle_export_excel(req)

    elif cmd == "export_excel_status":
        return handle_export_excel(req)

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
        return run_user_route(req, register_user, session_store)

    elif cmd == "login_user":
        return run_user_route(req, login_user, session_store)

    elif cmd == "session_check":
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

    return {"status": "ERROR", "reason": f"Unknown cmd: {cmd}"}
