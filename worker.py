# worker.py（スリム版）

import zmq
import traceback

from worker_dispatcher import dispatch_cmd
from worker_zmq_helpers import parse_frames, send_load_response

# ============================================================
# ZMQ 初期化
# ============================================================
ctx = zmq.Context()
sock = ctx.socket(zmq.REP)
sock.bind("tcp://127.0.0.1:5555")

print("WORKER_READY", flush=True)

# セッションストア（dispatcher に渡す）
session_store = {}

# ============================================================
# Main Loop（超スリム）
# ============================================================
while True:
    try:
        frames = sock.recv_multipart()

        cmd, req = parse_frames(frames)

        # フレーム数がおかしい場合
        if cmd is None:
            sock.send_json(req)
            continue

        # dispatcher に丸投げ
        result = dispatch_cmd(cmd, req, session_store)

        # load は multipart 応答（既存仕様）
        if cmd == "load":
            send_load_response(sock, result)
        else:
            sock.send_json(result)

    except Exception as e:
        traceback.print_exc()
        sock.send_json({"status": "ERROR", "reason": str(e)})
