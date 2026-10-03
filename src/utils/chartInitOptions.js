// src/utils/chartInitOptions.js
export const createChartOptions = () => ({
  responsive: false,
  animation: false,

  // hover 無効化
  interaction: {
    mode: null,
    intersect: false
  },

  scales: {
    x: { type: "linear" },
    y: { type: "linear" }
  },

  plugins: {
    legend: {
      display: true,
      position: "right",
      labels: {
        color: "#000",
        font: { size: 11 },
        maxWidth: 100,
        boxWidth: 8
      }
    },

    // annotation
    annotation: {
      annotations: {
        cursorLine: {
          type: "line",
          borderColor: "red",
          borderWidth: 1,
          display: false
        },
        correctionRange: {
          type: "box",
          backgroundColor: "rgba(0,128,255,0.15)",
          borderColor: "blue",
          borderWidth: 1,
          display: false
        }
      }
    },

    // tooltip 無効化
    tooltip: {
      enabled: false
    },

    // 高速化（min-max 最速）
    decimation: {
      enabled: true,
      algorithm: "min-max",
      samples: 2000
    },

    zoom: {
      zoom: {
        wheel: { enabled: false },
        pinch: { enabled: true },
        drag: {
          enabled: true,
          modifierKey: "alt",

          // drag矩形の描画負荷を軽減
          backgroundColor: "rgba(0,0,0,0.05)",
          borderColor: "rgba(0,0,0,0.3)",
          borderWidth: 1
        },
        mode: "xy"
      },
      pan: {
        enabled: true,
        mode: "xy"
      }
    }
  },

  // point を完全に消して高速化
  elements: {
    line: {
      tension: 0,
      borderWidth: 2
    },
    point: {
      radius: 0,
      hitRadius: 0,
      hoverRadius: 0,
      hoverBorderWidth: 0
    }
  }
});
