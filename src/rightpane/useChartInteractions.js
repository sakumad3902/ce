// src/components/ChartCanvas/useChartInteractions.js
import { useEffect } from "react";

export function useChartInteractions(canvasRef, chartRef, zeroMode, rangeMode) {

  /* ============================================================
      共通：軽量化ロジック
  ============================================================ */
  const makeLightDataset = (ds) => {
    const step = Math.ceil(ds.data.length / 300); // 300点に間引き
    return {
      ...ds,
      data: ds.data.filter((_, i) => i % step === 0)
    };
  };

  /* ============================================================
      ホイールズーム高速化：dataset を軽量化
  ============================================================ */
  useEffect(() => {
    const canvas = canvasRef.current;
    const chart = chartRef.current;
    if (!canvas || !chart) return;

    let originalDatasets = null;
    let isLight = false;
    let wheelTimeout = null;

    const wheel = (e) => {
      e.preventDefault();
      if (zeroMode || rangeMode) return;

      // throttle（1フレームに1回）
      if (wheelTimeout) return;
      wheelTimeout = requestAnimationFrame(() => {
        wheelTimeout = null;
      });

      // dataset 軽量化（初回のみ）
      if (!isLight) {
        originalDatasets = chart.data.datasets.map((d) => ({
          ...d,
          data: [...d.data]
        }));
        chart.data.datasets = originalDatasets.map((d) => makeLightDataset(d));
        isLight = true;
      }

      const d = e.deltaY > 0 ? 1.1 : 0.9;

      if (e.ctrlKey) {
        chart.zoom({ x: d });
      } else if (e.shiftKey) {
        chart.zoom({ y: d });
      } else {
        chart.zoom(d);
      }

      chart.update("none");
    };

    const wheelEnd = () => {
      if (!isLight || !originalDatasets) return;

      chart.data.datasets = originalDatasets;
      originalDatasets = null;
      isLight = false;

      chart.update("none");
    };

    canvas.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("mouseup", wheelEnd);
    window.addEventListener("wheelend", wheelEnd);

    return () => {
      canvas.removeEventListener("wheel", wheel);
      window.removeEventListener("mouseup", wheelEnd);
      window.removeEventListener("wheelend", wheelEnd);
    };
  }, [zeroMode, rangeMode]);

  /* ============================================================
      パン高速化：パン中だけ dataset を軽量化
  ============================================================ */
  useEffect(() => {
    const canvas = canvasRef.current;
    const chart = chartRef.current;
    if (!canvas || !chart) return;

    let originalDatasets = null;
    let isLight = false;

    const mousedown = (e) => {
      // Altドラッグはズームなので除外
      if (e.altKey) return;

      const zoom = chart.options.plugins.zoom;
      if (!zoom.pan.enabled) return;

      // dataset 軽量化（初回のみ）
      if (!isLight) {
        originalDatasets = chart.data.datasets.map((d) => ({
          ...d,
          data: [...d.data]
        }));
        chart.data.datasets = originalDatasets.map((d) => makeLightDataset(d));
        isLight = true;
        chart.update("none");
      }
    };

    const mouseup = () => {
      if (!isLight || !originalDatasets) return;

      chart.data.datasets = originalDatasets;
      originalDatasets = null;
      isLight = false;

      chart.update("none");
    };

    canvas.addEventListener("mousedown", mousedown);
    window.addEventListener("mouseup", mouseup);

    return () => {
      canvas.removeEventListener("mousedown", mousedown);
      window.removeEventListener("mouseup", mouseup);
    };
  }, [zeroMode, rangeMode]);

  /* ============================================================
      Shift / Ctrl / Alt 押下時 pan OFF
  ============================================================ */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const keyDown = (e) => {
      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt") {
        chart.options.plugins.zoom.pan.enabled = false;
        chart.update("none");
      }
    };

    const keyUp = (e) => {
      if (e.key === "Shift" || e.key === "Control" || e.key === "Alt") {
        chart.options.plugins.zoom.pan.enabled = !(zeroMode || rangeMode);
        chart.update("none");
      }
    };

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [zeroMode, rangeMode]);

  /* ============================================================
      Alt + drag zoom 時カーソル変更
  ============================================================ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const kd = (e) => {
      if (e.key === "Alt" && !zeroMode && !rangeMode) {
        canvas.style.cursor = "crosshair";
      }
    };
    const ku = (e) => {
      if (e.key === "Alt") {
        canvas.style.cursor = "default";
      }
    };

    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [zeroMode, rangeMode]);

  /* ============================================================
      補正モード中は pan / drag zoom 無効化
  ============================================================ */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const zoom = chart.options.plugins.zoom;
    const active = !(zeroMode || rangeMode);

    zoom.pan.enabled = active;
    zoom.zoom.drag.enabled = active;

    chart.update("none");
  }, [zeroMode, rangeMode]);
}
