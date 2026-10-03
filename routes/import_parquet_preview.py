# routes/import_parquet_preview.py (DB非依存・堅牢版)

import pyarrow.parquet as pq
import pyarrow as pa
import numpy as np

SCHEMA = pa.schema({
    "id": pa.int64(),
    "name": pa.string(),
    "x": pa.list_(pa.float32()),
    "y": pa.list_(pa.float32()),
    "timestamp": pa.int64()
})

def handle_import_parquet_preview(req):
    project = req.get("project_id")   
    file_bytes = req.get("file_bytes")

    if not project:
        return {"status": "ERROR", "reason": "project required"}

    if not file_bytes:
        return {"status": "ERROR", "reason": "file_bytes missing"}

    try:
        # ------------------------------------------------------------
        # Parquet 読み込み
        # ------------------------------------------------------------
        table = pq.read_table(pa.BufferReader(file_bytes))

        # ------------------------------------------------------------
        # スキーマ統一
        # ------------------------------------------------------------
        table = table.cast(SCHEMA)

        # ------------------------------------------------------------
        # プレビュー用 series（id / name / timestamp のみ）
        # ------------------------------------------------------------
        series = []

        raw_ids = table["id"].to_pylist()
        raw_names = table["name"].to_pylist()
        raw_x = table["x"].to_pylist()
        raw_y = table["y"].to_pylist()
        raw_ts = table["timestamp"].to_pylist()

        for id_val, name_val, x_list, y_list, ts in zip(
            raw_ids, raw_names, raw_x, raw_y, raw_ts
        ):
            # name 修復（古い parquet の list 対応）
            if isinstance(name_val, list):
                name_val = name_val[0] if len(name_val) > 0 else ""
            name_val = str(name_val)

            # x / y 修復（list でない場合の補正）
            try:
                if not isinstance(x_list, list):
                    x_list = list(x_list)
                if not isinstance(y_list, list):
                    y_list = list(y_list)
            except Exception:
                # 異常データはスキップ
                continue

            if len(x_list) == 0 or len(y_list) == 0:
                continue

            series.append({
                "id": int(id_val),
                "name": name_val,
                "timestamp": int(ts)
            })

        return {
            "status": "OK",
            "series": series
        }

    except Exception as e:
        return {
            "status": "ERROR",
            "reason": str(e)
        }
