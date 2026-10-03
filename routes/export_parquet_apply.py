# routes/export_parquet_apply.py (ACID対応版・Project対応)

import os
import pyarrow as pa
import pyarrow.parquet as pq
import numpy as np
import time
from sqlalchemy.orm import Session
from models import Series, Project

SCHEMA = pa.schema({
    "id": pa.int64(),
    "name": pa.string(),
    "x": pa.list_(pa.float32()),
    "y": pa.list_(pa.float32()),
    "timestamp": pa.int64()
})

def handle_export_parquet_apply(req, session: Session):
    project_name = req.get("project")
    override_series = req.get("overrideSeries")  # 任意

    if not project_name:
        return {"status": "ERROR", "reason": "project required"}

    try:
        # ★ ACID 読み取りトランザクション開始
        with session.begin():

            # ------------------------------------------------------------
            # Project を取得（deleted_flag = False）
            # ------------------------------------------------------------
            project = (
                session.query(Project)
                .filter(Project.name == project_name, Project.deleted_flag == False)
                .first()
            )

            if not project:
                return {"status": "ERROR", "reason": "project not found"}

            # ------------------------------------------------------------
            # ORM で Series を読み込み（論理削除されていないもの）
            # ------------------------------------------------------------
            rows = (
                session.query(Series)
                .filter(
                    Series.project_id == project.id,
                    Series.deleted_flag == False
                )
                .order_by(Series.id)
                .all()
            )

            if not rows:
                return {"status": "ERROR", "reason": f"no data for project: {project_name}"}

            # ------------------------------------------------------------
            # ORM → Python list（pandas を使わない）
            # ------------------------------------------------------------
            ids = []
            names = []
            timestamps = []
            xs = []
            ys = []

            for r in rows:
                id_val = int(r.id)
                name_val = r.name
                ts_val = int(r.timestamp)

                x_arr = np.frombuffer(r.x_blob, dtype=np.float32).tolist()
                y_arr = np.frombuffer(r.y_blob, dtype=np.float32).tolist()

                ids.append(id_val)
                names.append(name_val)
                timestamps.append(ts_val)
                xs.append(x_arr)
                ys.append(y_arr)

            # ------------------------------------------------------------
            # overrideSeries による name 上書き
            # ------------------------------------------------------------
            if override_series:
                id_to_name = {s["id"]: s["name"] for s in override_series}
                names = [id_to_name.get(i, n) for i, n in zip(ids, names)]

        # ------------------------------------------------------------
        # SCHEMA に完全一致する pyarrow.Table を生成
        # ------------------------------------------------------------
        try:
            table = pa.Table.from_arrays(
                [
                    pa.array(ids, type=pa.int64()),
                    pa.array(names, type=pa.string()),
                    pa.array([pa.array(v, type=pa.float32()) for v in xs],
                             type=pa.list_(pa.float32())),
                    pa.array([pa.array(v, type=pa.float32()) for v in ys],
                             type=pa.list_(pa.float32())),
                    pa.array(timestamps, type=pa.int64())
                ],
                schema=SCHEMA
            )

            os.makedirs("downloads", exist_ok=True)

            out_name = f"{project_name}_export_{int(time.time())}.parquet"
            out_path = os.path.join("downloads", out_name)

            pq.write_table(table, out_path)

        except Exception as e:
            return {"status": "ERROR", "reason": f"write failed: {e}"}

        return {
            "status": "OK",
            "download": out_name
        }

    except Exception as e:
        session.rollback()
        return {"status": "ERROR", "reason": str(e)}
