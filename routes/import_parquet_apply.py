# routes/import_parquet_apply.py (ACID + bulk insert 対応版・Project対応)

import time
import pyarrow as pa
import pyarrow.parquet as pq
import numpy as np
import pandas as pd

from models import Series, Project
from db import get_session

SCHEMA = pa.schema({
    "id": pa.int64(),
    "name": pa.string(),
    "x": pa.list_(pa.float32()),
    "y": pa.list_(pa.float32()),
    "timestamp": pa.int64()
})

def _generate_new_series_id(existing_ids: set) -> str:
    """グローバル一意IDを生成する（UNIX time ms ベース）"""
    while True:
        new_id = str(int(time.time() * 1000))
        if new_id not in existing_ids:
            return new_id
        time.sleep(0.001)


def handle_import_parquet_apply(req):
    project_name = req.get("project")
    file_bytes = req.get("file_bytes")
    override_series = req.get("overrideSeries")
    user_id = req.get("user_id")

    if not project_name:
        return {"status": "ERROR", "reason": "project required"}
    if not file_bytes:
        return {"status": "ERROR", "reason": "file_bytes missing"}
    if not user_id:
        return {"status": "ERROR", "reason": "user_id required"}

    # ------------------------------------------------------------
    # Parquet 読み込み
    # ------------------------------------------------------------
    try:
        new_table = pq.read_table(pa.BufferReader(file_bytes))
        new_table = new_table.cast(SCHEMA)
        new_df = new_table.to_pandas()
    except Exception as e:
        return {"status": "ERROR", "reason": f"parquet read failed: {e}"}

    # ------------------------------------------------------------
    # 読み取り専用セッション（既存データ取得）
    # ------------------------------------------------------------
    read_session = get_session()
    try:
        # Project を取得
        project = (
            read_session.query(Project)
            .filter(Project.name == project_name, Project.deleted_flag == False)
            .first()
        )
        if not project:
            return {"status": "ERROR", "reason": "project not found"}

        # 対象プロジェクトの既存 Series
        existing_rows = (
            read_session.query(Series)
            .filter(Series.project_id == project.id, Series.deleted_flag == False)
            .all()
        )

        # 全プロジェクトの既存ID（グローバル一意制約用）
        all_ids_rows = read_session.query(Series.id).all()
        all_existing_ids = {row.id for row in all_ids_rows}

    finally:
        read_session.close()

    # ------------------------------------------------------------
    # 結合処理（Python側）
    # ------------------------------------------------------------
    existing_df = None
    if existing_rows:
        existing_df = []
        for r in existing_rows:
            x_arr = np.frombuffer(r.x_blob, dtype=np.float32)
            y_arr = np.frombuffer(r.y_blob, dtype=np.float32)
            existing_df.append({
                "id": int(r.id),
                "name": r.name,
                "timestamp": int(r.timestamp),
                "x": x_arr.tolist(),
                "y": y_arr.tolist()
            })

    if existing_df:
        merged = pd.concat([pd.DataFrame(existing_df), new_df], ignore_index=True)
    else:
        merged = new_df

    # 同一プロジェクト内の重複IDは「最後を採用」
    merged = merged.drop_duplicates(subset="id", keep="last")

    # 既存 name を優先
    if existing_df:
        id_to_existing_name = {row["id"]: row["name"] for row in existing_df}
        merged["name"] = merged.apply(
            lambda row: id_to_existing_name.get(row["id"], row["name"]),
            axis=1
        )

    # overrideSeries による name 上書き
    if override_series:
        id_to_name = {int(s["id"]): s["name"] for s in override_series}
        merged["name"] = merged.apply(
            lambda row: id_to_name.get(row["id"], row["name"]),
            axis=1
        )

    # ------------------------------------------------------------
    # グローバル一意ID制約に合わせたID再採番（B案）
    # ------------------------------------------------------------
    target_ids = set(int(row["id"]) for _, row in merged.iterrows())

    existing_ids_int = set()
    for sid in all_existing_ids:
        try:
            existing_ids_int.add(int(sid))
        except ValueError:
            pass

    conflict_ids = target_ids & existing_ids_int
    all_existing_ids_str = set(all_existing_ids)

    def _resolve_id_conflict(row):
        original_id_int = int(row["id"])
        if original_id_int in conflict_ids:
            new_id_str = _generate_new_series_id(all_existing_ids_str)
            new_id_int = int(new_id_str)
            all_existing_ids_str.add(new_id_str)
            return new_id_int
        else:
            return original_id_int

    merged["id"] = merged.apply(_resolve_id_conflict, axis=1)

    # ------------------------------------------------------------
    # 書き込み専用セッション（ACID トランザクション）
    # ------------------------------------------------------------
    write_session = get_session()
    try:
        with write_session.begin():

            # 対象プロジェクトの既存 Series を論理削除
            write_session.query(Series).filter(
                Series.project_id == project.id
            ).update(
                {Series.deleted_flag: True},
                synchronize_session=False
            )

            # INSERT（bulk insert）
            objects = []
            now_ts = int(time.time())

            for _, row in merged.iterrows():
                x_arr = np.asarray(row["x"], dtype=np.float32)
                y_arr = np.asarray(row["y"], dtype=np.float32)

                objects.append(
                    Series(
                        id=str(int(row["id"])),
                        project_id=project.id,
                        name=str(row["name"]),
                        comment="",
                        timestamp=int(row["timestamp"]),
                        updated_at=now_ts,
                        deleted_flag=False,
                        x_blob=x_arr.tobytes(),
                        y_blob=y_arr.tobytes(),
                        created_by=user_id,
                        updated_by=user_id
                    )
                )

            write_session.bulk_save_objects(objects)

        return {"status": "OK"}

    except Exception as e:
        write_session.rollback()
        return {"status": "ERROR", "reason": f"DB write failed: {e}"}

    finally:
        write_session.close()
