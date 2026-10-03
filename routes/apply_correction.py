import numpy as np
import base64

# ============================================================
# peak_in_range（最大/最小を自動判定し、端点も補間して考慮）
#   高速版：x, y はすでに np.float32、端点用 xa/xb/ya/yb も事前計算済み
# ============================================================
def peak_in_range_fast(x, y, xa, xb, ya, yb, x1, x2):
    if x1 is None or x2 is None:
        return None, None

    if x2 < x1:
        x1, x2 = x2, x1

    peak_y = None
    peak_x = None

    # 範囲内の点で最大/最小を取る
    mask = (x >= x1) & (x <= x2)
    if np.any(mask):
        y_in = y[mask]
        x_in = x[mask]

        local_max = float(y_in.max())
        local_min = float(y_in.min())

        if abs(local_max) >= abs(local_min):
            idx = int(np.argmax(y_in))
            peak_y = local_max
            peak_x = float(x_in[idx])
            mode = "max"
        else:
            idx = int(np.argmin(y_in))
            peak_y = local_min
            peak_x = float(x_in[idx])
            mode = "min"
    else:
        mode = "max"

    # 端点補間（x1, x2 をまたぐ線分がある場合）
    if len(x) >= 2:
        # ---- x1 側 ----
        mask1 = (xa <= x1) & (xb >= x1)
        if np.any(mask1):
            xa1 = xa[mask1]
            xb1 = xb[mask1]
            ya1 = ya[mask1]
            yb1 = yb[mask1]

            denom = (xb1 - xa1)
            valid = denom != 0
            if np.any(valid):
                t = (x1 - xa1[valid]) / denom[valid]
                yx1 = ya1[valid] + t * (yb1[valid] - ya1[valid])

                y1 = float(yx1.max() if mode == "max" else yx1.min())

                if peak_y is None or \
                   (mode == "max" and y1 > peak_y) or \
                   (mode == "min" and y1 < peak_y):
                    peak_y = y1
                    peak_x = float(x1)

        # ---- x2 側 ----
        mask2 = (xa <= x2) & (xb >= x2)
        if np.any(mask2):
            xa2 = xa[mask2]
            xb2 = xb[mask2]
            ya2 = ya[mask2]
            yb2 = yb[mask2]

            denom = (xb2 - xa2)
            valid = denom != 0
            if np.any(valid):
                t = (x2 - xa2[valid]) / denom[valid]
                yx2 = ya2[valid] + t * (yb2[valid] - ya2[valid])

                y2 = float(yx2.max() if mode == "max" else yx2.min())

                if peak_y is None or \
                   (mode == "max" and y2 > peak_y) or \
                   (mode == "min" and y2 < peak_y):
                    peak_y = y2
                    peak_x = float(x2)

    return peak_y, peak_x

# ============================================================
# apply_corrections（peak_in_range_fast を使用）
# refIndex で「基準系列」を指定
# ============================================================
def apply_corrections(all_series, meta):
    zero_applied = bool(meta.get("zeroApplied"))
    y_applied    = bool(meta.get("yApplied"))
    xy_applied   = bool(meta.get("xyApplied"))
    last_zero_x  = meta.get("lastZeroX")
    last_range   = meta.get("lastRange") or {}

    x1 = last_range.get("x1")
    x2 = last_range.get("x2")

    count = len(all_series)
    if count == 0:
        return [], [], []

    ref_index = int(meta.get("refIndex", 0))
    if ref_index < 0 or ref_index >= count:
        ref_index = 0

    # 事前に NumPy 化＆端点用配列を準備
    np_series = []
    for s in all_series:
        x = np.asarray(s["x"], dtype=np.float32)
        y = np.asarray(s["y"], dtype=np.float32)
        if len(x) >= 2:
            xa = x[:-1]
            xb = x[1:]
            ya = y[:-1]
            yb = y[1:]
        else:
            xa = xb = ya = yb = np.array([], dtype=np.float32)
        np_series.append({
            "name": s["name"],
            "x": x,
            "y": y,
            "xa": xa,
            "xb": xb,
            "ya": ya,
            "yb": yb
        })

    # ---------------- Zero 補正 ----------------
    if zero_applied and last_zero_x is not None:
        zx = float(last_zero_x)
        zero = []
        for s in np_series:
            x = s["x"]
            y = s["y"]

            if len(x) < 2:
                zero.append({"name": s["name"], "x": x, "y": y})
                continue

            order = np.argsort(x)
            x_sorted = x[order]
            y_sorted = y[order]

            y0 = float(np.interp(zx, x_sorted, y_sorted))
            zero.append({
                "name": s["name"],
                "x": x_sorted,
                "y": (y_sorted - y0).astype(np.float32)
            })
    else:
        zero = [
            {
                "name": s["name"],
                "x": s["x"],
                "y": s["y"]
            }
            for s in np_series
        ]

    # ---------------- Y / XY 補正 ----------------
    if (y_applied or xy_applied) and x1 is not None and x2 is not None:
        base_series = []
        for z in zero:
            x = np.asarray(z["x"], dtype=np.float32)
            y = np.asarray(z["y"], dtype=np.float32)
            if len(x) >= 2:
                xa = x[:-1]
                xb = x[1:]
                ya = y[:-1]
                yb = y[1:]
            else:
                xa = xb = ya = yb = np.array([], dtype=np.float32)
            base_series.append({
                "name": z["name"],
                "x": x,
                "y": y,
                "xa": xa,
                "xb": xb,
                "ya": ya,
                "yb": yb
            })

        base = base_series[ref_index]
        Yref, Xref = peak_in_range_fast(
            base["x"], base["y"],
            base["xa"], base["xb"], base["ya"], base["yb"],
            float(x1), float(x2)
        )

        y_corr  = [
            {"name": s["name"], "x": s["x"], "y": s["y"].copy()}
            for s in base_series
        ]
        xy_corr = [
            {"name": s["name"], "x": s["x"].copy(), "y": s["y"].copy()}
            for s in base_series
        ]

        # peak 結果をキャッシュして再計算を避ける
        peak_cache = {}

        def get_peak(idx):
            if idx in peak_cache:
                return peak_cache[idx]
            s = base_series[idx]
            py, px = peak_in_range_fast(
                s["x"], s["y"],
                s["xa"], s["xb"], s["ya"], s["yb"],
                float(x1), float(x2)
            )
            peak_cache[idx] = (py, px)
            return py, px

        if y_applied and Yref is not None and Yref != 0:
            for idx in range(count):
                s = y_corr[idx]
                maxY, _ = get_peak(idx)

                if maxY is None or maxY == 0:
                    continue

                coefY = Yref / maxY
                s["y"] *= coefY

        if xy_applied and Yref is not None and Yref != 0 and Xref is not None:
            for idx in range(count):
                s = xy_corr[idx]
                maxY, maxX = get_peak(idx)

                if maxY is None or maxY == 0 or maxX is None:
                    continue

                coefY = Yref / maxY
                coefX = Xref - maxX

                s["y"] *= coefY
                s["x"] += coefX
    else:
        y_corr  = [
            {"name": s["name"], "x": s["x"], "y": s["y"]}
            for s in zero
        ]
        xy_corr = [
            {"name": s["name"], "x": s["x"], "y": s["y"]}
            for s in zero
        ]

    zero = [
        {"name": s["name"], "x": z["x"], "y": z["y"]}
        for s, z in zip(all_series, zero)
    ]

    y_corr = [
        {"name": s["name"], "x": y["x"], "y": y["y"]}
        for s, y in zip(all_series, y_corr)
    ]

    xy_corr = [
        {"name": s["name"], "x": xy["x"], "y": xy["y"]}
        for s, xy in zip(all_series, xy_corr)
    ]

    return zero, y_corr, xy_corr

# ============================================================
# handle_apply_correction（name / ids / lengths / refIndex を保持）
# ============================================================
def handle_apply_correction(meta):
    try:
        lengths = meta["lengths"]
        packed  = meta["packed"]

        ids   = meta.get("ids")
        names = meta.get("names")

        raw = base64.b64decode(packed)
        arr = np.frombuffer(raw, dtype=np.float32)

        all_series = []
        offset = 0

        for i, n in enumerate(lengths):
            n = int(n)
            x = arr[offset:offset+n]
            y = arr[offset+n:offset+2*n]
            offset += 2*n

            name = names[i] if names and i < len(names) else f"Series_{i+1}"

            all_series.append({
                "name": name,
                "x": x,
                "y": y
            })

        zeroArr, yArr, xyArr = apply_corrections(all_series, meta)

        total = sum(int(n) for n in lengths) * 2

        def pack(series_list):
            buf = np.zeros(total, dtype=np.float32)
            off = 0
            for s in series_list:
                x = np.asarray(s["x"], dtype=np.float32)
                y = np.asarray(s["y"], dtype=np.float32)
                n = len(x)
                buf[off:off+n] = x
                buf[off+n:off+2*n] = y
                off += 2*n
            return base64.b64encode(buf.tobytes()).decode("utf8")

        return {
            "status": "OK",
            "ids": ids,
            "lengths": lengths,
            "zero": pack(zeroArr),
            "y":    pack(yArr),
            "xy":   pack(xyArr)
        }
    except Exception as e:
        return {
            "status": "ERROR",
            "reason": str(e),
            "ids": meta.get("ids"),
            "lengths": meta.get("lengths"),
            "zero": "",
            "y": "",
            "xy": ""
        }
