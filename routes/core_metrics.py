# routes/core_metrics.py
"""
core_metrics.py
波形評価ロジック・統計処理・色付け判定を集約
"""

import numpy as np
import base64
from scipy.signal import find_peaks, peak_prominences


# -------------------------
# Utility
# -------------------------
def unpack_series(packed, lengths, names):
    arr = np.frombuffer(base64.b64decode(packed), np.float32)
    series, off = [], 0
    for n, nm in zip(lengths, names):
        n = int(n)
        x = arr[off:off+n]
        y = arr[off+n:off+2*n]
        off += 2*n
        series.append({"name": nm, "x": x, "y": y})
    return series


def peak_bounds(x, y):
    peaks, _ = find_peaks(y, prominence=0.1)
    if len(peaks) == 0:
        return None
    idx = peaks[np.argmax(y[peaks])]
    prom, lb, rb = peak_prominences(y, [idx])
    return {
        "peak_idx": idx,
        "x_peak": float(x[idx]),
        "height": float(y[idx]),
        "x_left": float(x[lb[0]]),
        "x_right": float(x[rb[0]])
    }


def zero_correct(y):
    baseline = np.median(y)
    return y - baseline


def peak_area(x, y, b):
    mask = (x >= b["x_left"]) & (x <= b["x_right"])
    x_seg = x[mask]
    y_seg = y[mask]
    y_seg = np.maximum(y_seg, 0)
    if len(x_seg) < 2:
        return 0.0
    return float(np.trapz(y_seg, x_seg))


def calc_width(x, y, peak_idx, ratio):
    target = y[peak_idx] * ratio
    left = np.where(y[:peak_idx] <= target)[0]
    right = np.where(y[peak_idx:] <= target)[0]
    if len(left) == 0 or len(right) == 0:
        return 0.0
    return float(x[peak_idx + right[0]] - x[left[-1]])


def cosine_similarity(a, b):
    # 長さを揃える
    n = min(len(a), len(b))
    if n == 0:
        return 0.0

    a2 = a[:n]
    b2 = b[:n]

    norm = np.linalg.norm(a2) * np.linalg.norm(b2)
    if norm == 0:
        return 0.0

    return float(np.sum(a2 * b2) / norm)

# -------------------------
# baseline_metrics（前後5%方式）
# -------------------------
def baseline_metrics(x, y, b):
    # ピーク領域を除外
    mask = (x < b["x_left"]) | (x > b["x_right"])
    bx = x[mask]
    by = y[mask]

    if len(bx) < 10:
        return {"drift": 0.0}

    # 一次回帰（最小二乗法）
    # y = ax + c の a（傾き）を drift とする
    A = np.vstack([bx, np.ones(len(bx))]).T
    slope, intercept = np.linalg.lstsq(A, by, rcond=None)[0]

    return {"drift": float(slope)}


# -------------------------
# shape similarity（内部は相対幅）
# -------------------------
def shape_similarity(cos_sim, upper_pct, middle_pct, lower_pct):
    C = (1 - cos_sim)
    U = abs(upper_pct - 100) / 100
    M = abs(middle_pct - 100) / 100
    L = abs(lower_pct - 100) / 100

    score = 1 - (
        0.20 * C +
        0.15 * U +
        0.30 * M +
        0.35 * L
    )
    return max(0, score) * 100


# -------------------------
# 統計値計算
# -------------------------
def compute_stats(values):
    arr = np.array(values, dtype=float)
    if len(arr) == 0:
        return 0.0, 0.0, 0.0
    mean = float(np.mean(arr))
    std = float(np.std(arr))
    cv = float(std / mean * 100) if mean != 0 else 0.0
    return mean, std * 3, cv


# -------------------------
# 丸め処理
# -------------------------
def round_abs(value):
    return round(float(value), 2)


def round_similarity(value):
    return round(float(value), 1)


# -------------------------
# 色付け判定（GUI/Excel 共通）
# -------------------------
def color_for_value(value, mean, three_sigma):
    diff = value - mean
    if diff > three_sigma:
        return "FFCCCC"  # 薄赤
    if diff < -three_sigma:
        return "CCE5FF"  # 薄青
    return "FFFFFF"


def color_for_cv(cv):
    if cv > 5:
        return "FFE0B3"  # 薄橙
    if cv > 2:
        return "FFF5CC"  # 薄黄
    return "FFFFFF"


def color_for_similarity(sim_pct):
    if sim_pct < 97.0:
        return "E6CCFF"  # 薄紫
    return "FFFFFF"


# -------------------------
# 評価結果生成（GUI/Excel 共通）
# -------------------------
def build_results_and_stats(series, names, ref_index=0):

    if not series:
        return [], {}

    ref_index = max(0, min(ref_index, len(series) - 1))
    ref = series[ref_index]
    rb = peak_bounds(ref["x"], ref["y"])
    if rb is None:
        return [], {}

    ref_y = zero_correct(ref["y"])
    ref_area = peak_area(ref["x"], ref_y, rb)

    ref_upper = calc_width(ref["x"], ref_y, rb["peak_idx"], 0.75)
    ref_middle = calc_width(ref["x"], ref_y, rb["peak_idx"], 0.50)
    ref_lower = calc_width(ref["x"], ref_y, rb["peak_idx"], 0.25)

    results = []

    for s in series:
        b = peak_bounds(s["x"], s["y"])
        if b is None:
            results.append({
                "name": s["name"],
                "baseline": {"base_drift": 0.0},
                "waveform": {
                    "x_peak": 0.0,
                    "peak_height": 0.0,
                    "peak_area": 0.0,
                    "FWHM_upper": 0.0,
                    "FWHM_middle": 0.0,
                    "FWHM_lower": 0.0,
                    "cosine_pct": 0.0,
                    "shape_similarity_pct": 0.0
                }
            })
            continue

        y0 = zero_correct(s["y"])
        base = baseline_metrics(s["x"], y0, b)

        peak_height = b["height"]
        area = peak_area(s["x"], y0, b)

        upper = calc_width(s["x"], y0, b["peak_idx"], 0.75)
        middle = calc_width(s["x"], y0, b["peak_idx"], 0.50)
        lower = calc_width(s["x"], y0, b["peak_idx"], 0.25)

        cos_sim = cosine_similarity(ref_y, y0)
        cos_pct = cos_sim * 100.0

        upper_pct = upper / ref_upper * 100 if ref_upper > 0 else 100
        middle_pct = middle / ref_middle * 100 if ref_middle > 0 else 100
        lower_pct = lower / ref_lower * 100 if ref_lower > 0 else 100

        shape_sim = shape_similarity(cos_sim, upper_pct, middle_pct, lower_pct)

        results.append({
            "name": s["name"],
            "baseline": {
                "base_drift": base["drift"]
            },
            "waveform": {
                "x_peak": b["x_peak"],
                "peak_height": peak_height,
                "peak_area": area,
                "FWHM_upper": upper,
                "FWHM_middle": middle,
                "FWHM_lower": lower,
                "cosine_pct": cos_pct,
                "shape_similarity_pct": shape_sim
            }
        })

    stat_cols = ["x_peak", "base_drift", "peak_height", "peak_area",
                 "FWHM_upper", "FWHM_middle", "FWHM_lower"]

    stats = {}
    for col in stat_cols:
        values = []
        for r in results:
            if col == "base_drift":
                values.append(r["baseline"]["base_drift"])
            else:
                values.append(r["waveform"][col])
        mean, three_sigma, cv = compute_stats(values)
        stats[col] = {
            "mean": mean,
            "three_sigma": three_sigma,
            "cv": cv
        }

    return results, stats

