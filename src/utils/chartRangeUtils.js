// src/utils/chartRangeUtils.js

// 0.5刻みで丸める
const round05 = (v) => Math.round(v * 2) / 2;

/**
 * 現在のチャート表示範囲を取得する
 * Chart.js の x/y スケールから min/max を読み取り、0.5刻みで丸める
 */
export function getRoundedChartRange(chart) {
  if (!chart) return null;

  const xs = chart.scales.x;
  const ys = chart.scales.y;
  if (!xs || !ys) return null;

  return {
    xMin: round05(xs.min),
    xMax: round05(xs.max),
    yMin: round05(ys.min),
    yMax: round05(ys.max)
  };
}

/**
 * 現在のチャート範囲が axisRange と一致しているか判定する
 */
export function isViewRangeSynced(chart, axisRange) {
  const current = getRoundedChartRange(chart);
  if (!current) return true;

  return (
    current.xMin === axisRange.xMin &&
    current.xMax === axisRange.xMax &&
    current.yMin === axisRange.yMin &&
    current.yMax === axisRange.yMax
  );
}
