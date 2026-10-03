// src/components/ChartView.jsx
import React, { useMemo } from "react";

import ChartCanvas from "./ChartCanvas";
import AxisControl from "./AxisControl";

export default function ChartView({
  chartCanvasRef,

  zeroApplied,
  yApplied,
  xyApplied,
  lastZeroX,
  lastRange,

  zeroMode,
  rangeMode,

  axisMode,
  setAxisMode,
  axisRange,
  setAxisRange,

  applyCurrentViewRange,

  guideVisible,
  toggleGuide
}) {
  const updateRange = (key, value) => {
    const map = {
      xmin: "xMin",
      xmax: "xMax",
      ymin: "yMin",
      ymax: "yMax"
    };

    const realKey = map[key];

    setAxisRange(prev => ({
      ...prev,
      [realKey]: value === "" ? null : Number(value)
    }));
  };

  const updateMode = (axis, mode) => {
    setAxisMode(prev => ({
      ...prev,
      [axis]: mode
    }));
  };

  // range を useMemo で固定化（毎レンダーで新しいオブジェクトを作らない）
  const memoRange = useMemo(
    () => ({
      xMin: axisRange.xMin ?? "",
      xMax: axisRange.xMax ?? "",
      yMin: axisRange.yMin ?? "",
      yMax: axisRange.yMax ?? ""
    }),
    [axisRange.xMin, axisRange.xMax, axisRange.yMin, axisRange.yMax]
  );

  return (
    <>
      <div id="chartArea">
        <ChartCanvas
          ref={chartCanvasRef}
          axisMode={axisMode}
          range={memoRange}
          zeroApplied={zeroApplied}
          lastZeroX={lastZeroX}
          yApplied={yApplied}
          xyApplied={xyApplied}
          lastRange={lastRange}
          zeroMode={zeroMode}
          rangeMode={rangeMode}
          guideVisible={guideVisible}
        />
      </div>

      <div className="axis-control-area">
        <AxisControl
          axisMode={axisMode}
          range={memoRange}
          setMode={updateMode}
          updateRange={updateRange}
          applyCurrentViewRange={applyCurrentViewRange}
          guideVisible={guideVisible}
          toggleGuide={toggleGuide}
        />
      </div>
    </>
  );
}
