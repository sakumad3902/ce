// src/hooks/useCorrection.js
import { useCallback, useEffect } from "react";

/* ------------------------------
   base64 → Float32Array
------------------------------ */
const decodeF32 = (b64) =>
  new Float32Array(Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer);

/* ------------------------------
   Float32Array → [{x,y}]×N
------------------------------ */
const splitXY = (f32, lengths) => {
  let o = 0;
  return lengths.map(n => {
    const x = f32.slice(o, o + n);
    const y = f32.slice(o + n, o + 2 * n);
    o += n * 2;
    return { x, y };
  });
};

export default function useCorrection(state, api) {
  const {
    zeroApplied, setZeroApplied,
    yApplied, setYApplied,
    xyApplied, setXyApplied,
    lastZeroX, setLastZeroX,
    lastRange, setLastRange,

    setCorrectedZero,
    setCorrectedY,
    setCorrectedXY,

    setCurrentSheet,

    setZeroMode, setRangeMode,
    setModeBannerVisible, setModeText,
    setUiLocked,

    lengths,
    originalPacked,
    originalSeries,

    refreshChart,
    selectedOrder
  } = state;

  const { applyCorrection } = api;

  /* ------------------------------
     UI モード設定（簡略版）
  ------------------------------ */
  const setModeState = useCallback(
    ({ type, banner, locked, text }) => {
      setZeroMode(type === "zero");
      setRangeMode(type === "range");
      setModeBannerVisible(banner);
      setUiLocked(locked);
      setModeText(text || "");
    },
    []
  );

  const exitCorrectionMode = useCallback(
    () => setModeState({ type: "none", banner: false, locked: false, text: "" }),
    [setModeState]
  );

  /* ------------------------------
     Python → React 復元（短縮版）
     - originalSeries をベースに merge
     - 補正されていない series も保持
  ------------------------------ */
  const decodeResult = useCallback(
    (resp) => {
      if (!resp?.zero || !resp?.y || !resp?.xy) {
        return { zero: originalSeries, y: originalSeries, xy: originalSeries };
      }

      const L = resp.lengths?.length ? resp.lengths : lengths;
      const ids = resp.ids?.length === L.length ? resp.ids : originalSeries.map(s => s.id);

      const rawZero = splitXY(decodeF32(resp.zero), L);
      const rawY    = splitXY(decodeF32(resp.y), L);
      const rawXY   = splitXY(decodeF32(resp.xy), L);

      const buildMap = (raw) => {
        const m = new Map();
        raw.forEach((s, i) => m.set(ids[i], s));
        return m;
      };

      const merge = (map) =>
        originalSeries.map(meta => {
          const c = map.get(meta.id);
          return c
            ? { ...meta, x: c.x, y: c.y }
            : meta;
        });

      return {
        zero: merge(buildMap(rawZero)),
        y:    merge(buildMap(rawY)),
        xy:   merge(buildMap(rawXY))
      };
    },
    [lengths, originalSeries]
  );

  /* ------------------------------
     補正の唯一の入口
  ------------------------------ */
  const applyAllCorrections = useCallback(
    async ({ mode = "auto", x = null, x1 = null, x2 = null } = {}) => {
      if (!originalPacked) return;

      const z  = mode === "zero" ? true : zeroApplied;
      const y  = mode === "xy"   ? true : yApplied;
      const xy = mode === "xy"   ? true : xyApplied;

      const zx = mode === "zero" ? Number(x) : lastZeroX;
      const rg = mode === "xy"   ? { x1, x2 } : lastRange;

      const resp = await applyCorrection({
        mode: xy ? "xy" : z ? "zero" : "original",
        zeroApplied: z,
        yApplied: y,
        xyApplied: xy,
        lastZeroX: zx,
        lastRange: rg,
        packed: originalPacked,
        lengths
      });
      if (!resp) return;

      const { zero, y: yArr, xy: xyArr } = decodeResult(resp);

      setCorrectedZero(zero);
      setCorrectedY(yArr);
      setCorrectedXY(xyArr);

      setZeroApplied(z);
      setYApplied(y);
      setXyApplied(xy);
      setLastZeroX(zx);
      setLastRange(rg);

      if (mode !== "auto") {
        setCurrentSheet(y || xy ? "y" : z ? "zero" : "original");
      }

      refreshChart?.();
    },
    [
      zeroApplied, yApplied, xyApplied,
      lastZeroX, lastRange,
      originalPacked, lengths,
      applyCorrection, decodeResult,
      refreshChart
    ]
  );

  /* ------------------------------
     originalPacked / selectedOrder の変化で自動補正
  ------------------------------ */
  useEffect(() => {
    if ((zeroApplied || yApplied || xyApplied) && originalPacked) {
      applyAllCorrections({ mode: "auto" });
    }
  }, [originalPacked, selectedOrder]);

  /* ------------------------------
     UI から呼ばれる関数
  ------------------------------ */
  const handleZeroClick = useCallback(
    (x) => {
      exitCorrectionMode();
      applyAllCorrections({ mode: "zero", x });
    },
    [exitCorrectionMode, applyAllCorrections]
  );

  const handleRangeSelect = useCallback(
    (x1, x2) => {
      exitCorrectionMode();
      applyAllCorrections({ mode: "xy", x1, x2 });
    },
    [exitCorrectionMode, applyAllCorrections]
  );

  const resetAll = useCallback(() => {
    setZeroApplied(false);
    setYApplied(false);
    setXyApplied(false);
    setLastZeroX(null);
    setLastRange({ x1: null, x2: null });
    setCurrentSheet("original");
  }, []);

  return {
    exitCorrectionMode,
    startZeroMode: () =>
      setModeState({ type: "zero", banner: true, locked: true, text: "ゼロ補正モード中" }),
    startRangeMode: () =>
      setModeState({ type: "range", banner: true, locked: true, text: "範囲選択モード中" }),
    cancelMode: exitCorrectionMode,

    applyAllCorrections,
    handleZeroClick,
    handleRangeSelect,
    resetAll
  };
}
