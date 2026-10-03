# routes/load.py

import numpy as np
import base64
from sqlalchemy.orm import Session
from models import Series

def handle_load(req, session: Session):
    """
    req = {
        "project_id": 1
    }

    指定 project_id の Series を読み込む（BLOB → float32）
    UI が必要とする series[], packed, lengths を返す
    """

    project_id = req.get("project_id")
    if not project_id:
        return {
            "status": "ERROR",
            "reason": "project_id required",
            "series": [],
            "packed": "",
            "lengths": []
        }

    try:
        # ------------------------------------------------------------
        # 該当 project_id の Series を取得（論理削除されていないもの）
        # ------------------------------------------------------------
        rows = (
            session.query(Series)
            .filter(
                Series.project_id == project_id,
                Series.deleted_flag == False
            )
            .order_by(Series.id)
            .all()
        )

        if not rows:
            return {
                "status": "OK",
                "series": [],
                "packed": "",
                "lengths": []
            }

        series = []
        lengths = []
        packed_list = []

        # ------------------------------------------------------------
        # BLOB → float32 array 復元
        # ------------------------------------------------------------
        for row in rows:
            x_arr = np.frombuffer(row.x_blob, dtype=np.float32)
            y_arr = np.frombuffer(row.y_blob, dtype=np.float32)

            if x_arr.size == 0 or y_arr.size == 0:
                continue

            nlen = len(x_arr)
            lengths.append(nlen)

            # packed 用
            packed_list.extend(x_arr.tolist())
            packed_list.extend(y_arr.tolist())

            # b64（UI が使う）
            buf = np.zeros(nlen * 2, dtype=np.float32)
            buf[:nlen] = x_arr
            buf[nlen:] = y_arr
            b64 = base64.b64encode(buf.tobytes()).decode("utf8")

            series.append({
                "id": row.id,
                "name": row.name,
                "length": nlen,
                "timestamp": int(row.timestamp),
                "comment": row.comment,
                "b64": b64
            })

        # ------------------------------------------------------------
        # packed（高速描画用）
        # ------------------------------------------------------------
        packed_arr = np.asarray(packed_list, dtype=np.float32)
        packed_b64 = base64.b64encode(packed_arr.tobytes()).decode("utf8")

        return {
            "status": "OK",
            "series": series,
            "packed": packed_b64,
            "lengths": lengths
        }

    except Exception as e:
        return {
            "status": "ERROR",
            "reason": str(e),
            "series": [],
            "packed": "",
            "lengths": []
        }
