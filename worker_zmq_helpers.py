# worker_zmq_helpers.py
import json
import base64


# ============================================================
# ZMQ フレーム解析
# ============================================================
def parse_frames(frames):
    """
    REQ/REP 前提の既存仕様:
      - [json] 1フレーム → JSONコマンド
      - [cmd, metaJson, fileBytes] 3フレーム → multipart
    """
    if len(frames) == 1:
        # JSON コマンド
        req = json.loads(frames[0].decode("utf8"))
        cmd = req.get("cmd")
        return cmd, req

    elif len(frames) == 3:
        # multipart コマンド
        cmd = frames[0].decode("utf8")
        meta = json.loads(frames[1].decode("utf8"))
        req = {**meta, "file_bytes": frames[2]}
        return cmd, req

    # フレーム数がおかしい場合
    return None, {"status": "ERROR", "reason": "Invalid ZMQ frame count"}


# ============================================================
# load 専用応答（既存の挙動を完全維持）
# ============================================================
def send_load_response(sock, result):
    """
    packed(b64) → raw bytes に戻して multipart で返す。
    既存 worker.py の load 応答ロジックをそのまま外部化。
    """
    raw_bytes = base64.b64decode(result.get("packed", ""))

    meta = {
        "status": result.get("status"),
        "series": result.get("series"),
        "lengths": result.get("lengths"),
    }

    sock.send_multipart([
        b"load",
        json.dumps(meta).encode("utf8"),
        raw_bytes,
    ])


# ============================================================
# 今後追加する並列ロード用ヘルパ（まだ未使用）
# ============================================================
def split_raw_bytes(raw_bytes, part, total_parts):
    """
    並列ロード用のチャンク分割ヘルパ。
    今は worker.py では使わないが、load_part 実装時に使う。
    """
    size = len(raw_bytes)
    chunk_size = size // total_parts

    start = part * chunk_size
    end = size if part == total_parts - 1 else (part + 1) * chunk_size

    return raw_bytes[start:end]


def encode_chunk(chunk_bytes):
    """
    Node 側が既存の base64 を前提にしているため、
    チャンクは base64 で返す（既存仕様を壊さない）。
    """
    return base64.b64encode(chunk_bytes).decode("ascii")
