// src/components/ChartCanvas/ChartCanvas.jsx
import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState
} from "react";

import Chart from "chart.js/auto";
import annotationPlugin from "chartjs-plugin-annotation";
import zoomPlugin from "chartjs-plugin-zoom";

import { saveHighResPng } from "../utils/saveHighResPng";
import { whiteBackgroundPlugin } from "../utils/chartPlugins";
import { createChartOptions } from "../utils/chartInitOptions";

import { useChartInteractions } from "./useChartInteractions";

Chart.register(annotationPlugin, zoomPlugin, whiteBackgroundPlugin);

const ChartCanvas = forwardRef(function ChartCanvas(
  {
    axisMode,
    range,
    zeroApplied,
    lastZeroX,
    yApplied,
    xyApplied,
    lastRange,
    zeroMode,
    rangeMode,
    guideVisible
  },
  ref
) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState(null);
  const [showTipOnce] = useState(true);   // 初回だけ表示
  const [fadeOut, setFadeOut] = useState(false);

 /* ============================================================
    Chart.js 初期化
============================================================ */
useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas || chartRef.current) return;

  const chart = new Chart(canvas.getContext("2d"), {
    type: "scatter",
    data: { datasets: [] },
    options: createChartOptions()
  });

  chartRef.current = chart;

  const dbl = () => chart.resetZoom?.();
  canvas.addEventListener("dblclick", dbl);

  return () => {
    if (canvas) {
      canvas.removeEventListener("dblclick", dbl);
    }
    chart.destroy();
    chartRef.current = null;
  };
}, []);

/* ============================================================
    Altドラッグ高速化
============================================================ */
useEffect(() => {
  const canvas = canvasRef.current;
  const chart = chartRef.current;
  if (!canvas || !chart) return;

  let originalDatasets = null;
  let isLight = false;

  const makeLightDataset = (ds) => {
    const step = Math.ceil(ds.data.length / 300);
    return { ...ds, data: ds.data.filter((_, i) => i % step === 0) };
  };

  const mousedown = (e) => {
    if (!e.altKey) return;

    if (!originalDatasets) {
      originalDatasets = chart.data.datasets.map((d) => ({
        ...d,
        data: [...d.data]
      }));
    }

    chart.data.datasets = originalDatasets.map((d) => makeLightDataset(d));
    isLight = true;
    chart.update("none");
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
    if (canvas) {
      canvas.removeEventListener("mousedown", mousedown);
    }
    window.removeEventListener("mouseup", mouseup);
  };
}, []);

/* ============================================================
    メニュー外クリックで閉じる
============================================================ */
useEffect(() => {
  if (!menuPos) return;

  const closeOnOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setMenuPos(null);
    }
  };

  document.addEventListener("mousedown", closeOnOutside);

  return () => {
    document.removeEventListener("mousedown", closeOnOutside);
  };
}, [menuPos]);


  /* ============================================================
      操作系ロジック（ホイールズーム・pan制御など）
  ============================================================ */
  useChartInteractions(canvasRef, chartRef, zeroMode, rangeMode);

  /* ============================================================
      updateSeries
  ============================================================ */
  useImperativeHandle(ref, () => ({
    chart: chartRef.current,

    updateSeries(series) {
      const chart = chartRef.current;
      if (!chart) return;

      const colors = [
        "#4472C4", "#ED7D31", "#A5A5A5", "#FFC000",
        "#5B9BD5", "#70AD47", "#264478", "#9E480E",
        "#636363", "#997300", "#255E91", "#43682B"
      ];

      chart.data.datasets = series.map((s, i) => ({
        label: s.name ?? `Series ${i}`,
        data: s.data,
        borderColor: colors[i % colors.length],
        borderWidth: i === 0 ? 2 : 1, /* 基準の線の太さ、それ以外の線の太さ */
        showLine: true,
        pointRadius: 0,
        tension: 0.3
      }));

      chart.update("none");
    },

    updateOriginalScaleLimits(range) {
      const chart = chartRef.current;
      if (!chart) return;

      const xs = chart.options.scales.x;
      const ys = chart.options.scales.y;

      xs.min = range.xMin;
      xs.max = range.xMax;
      ys.min = range.yMin;
      ys.max = range.yMax;

      chart.update("none");
    },

    resetZoom() {
      chartRef.current?.resetZoom?.();
      chartRef.current?.update("none");
    },

    saveHighResPng() {
      saveHighResPng(chartRef.current, canvasRef.current);
    }
  }));

  /* ============================================================
      annotation 更新
  ============================================================ */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const ann = chart.options.plugins.annotation.annotations;

    if (zeroMode || rangeMode || !guideVisible) {
      ann.cursorLine.display = false;
      ann.correctionRange.display = false;
      chart.update("none");
      return;
    }

    ann.cursorLine.display = zeroApplied && lastZeroX != null;
    ann.cursorLine.xMin = lastZeroX;
    ann.cursorLine.xMax = lastZeroX;

    ann.correctionRange.display =
      (yApplied || xyApplied) && lastRange.x1 != null;
    ann.correctionRange.xMin = lastRange.x1;
    ann.correctionRange.xMax = lastRange.x2;

    chart.update("none");
  }, [
    guideVisible,
    zeroApplied,
    lastZeroX,
    yApplied,
    xyApplied,
    lastRange.x1,
    lastRange.x2
  ]);

  /* ============================================================
      軸設定
  ============================================================ */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || zeroMode || rangeMode) return;

    const xs = chart.options.scales.x;
    const ys = chart.options.scales.y;

    const toNum = (v) =>
      v === "" || v === null || v === undefined ? undefined : Number(v);

    xs.min = axisMode.x === "manual" ? toNum(range.xMin) : undefined;
    xs.max = axisMode.x === "manual" ? toNum(range.xMax) : undefined;
    ys.min = axisMode.y === "manual" ? toNum(range.yMin) : undefined;
    ys.max = axisMode.y === "manual" ? toNum(range.yMax) : undefined;

    chart.update("none");
  }, [axisMode, range]);

  /* ============================================================
      右クリックメニュー
  ============================================================ */
  const handleCanvasRightClick = (e) => {
    e.preventDefault();

    const menuWidth = 180;
    const menuHeight = 40;
    const padding = 10;

    let x = e.clientX;
    let y = e.clientY;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (x + menuWidth + padding > vw) {
      x = vw - menuWidth - padding;
    }
    if (y + menuHeight + padding > vh) {
      y = vh - menuHeight - padding;
    }

    setMenuPos({ x, y });
  };

  /* ============================================================
      メニュー外クリックで閉じる
  ============================================================ */
  useEffect(() => {
    if (!menuPos) return;

    const closeOnOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuPos(null);
      }
    };

    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [menuPos]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={750} /*チャートサイズ*/
        height={405}
        onContextMenu={handleCanvasRightClick}
        onMouseEnter={() => {
          if (showTipOnce) {
            setTimeout(() => setFadeOut(true), 8000);
          }
        }}
      />

      {menuPos && (
        <div
          ref={menuRef}
          className="context-menu"
          style={{ top: menuPos.y, left: menuPos.x }}
          onClick={() => {
            saveHighResPng(chartRef.current, canvasRef.current);
            setMenuPos(null);
          }}
        >
          <div className="context-menu-item">チャート画像を保存</div>
        </div>
      )}
    </>
  );
});

export default ChartCanvas;

/*    {showTipOnce && (
        <div className={`tooltip ${fadeOut ? "fade-out" : "show"}`}>
          Shift+マウスホイールで縦軸ズーム<br />
          Ctrl+マウスホイールで横軸ズーム<br />
          Alt+ドラッグで拡大範囲選択<br />
          ダブルクリックで表示範囲復元<br />
          右クリックでチャート画像保存
        </div>
      )}*/
