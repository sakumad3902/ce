// src/utils/saveHighResPng.js
import Chart from "chart.js/auto";

export const saveHighResPng = (chart, canvas) => {
  if (!chart || !canvas) return;

  const scale = 1.2;
  const w = canvas.width * scale;
  const h = canvas.height * scale;

  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;

  const safeOptions = {
    responsive: false,
    animation: false,
    devicePixelRatio: scale,
    layout: { padding: 0 },
    plugins: {
      whiteBackground: true,
      legend: {
        display: true,
        position: "right",
        labels: {
          color: "#000",
          font: { size: 10 },
          maxWidth: 100,
          boxWidth: 8
        }
      },
      tooltip: { enabled: false },
      chartArea: { backgroundColor: "white" },
      annotation: JSON.parse(JSON.stringify(chart.options.plugins.annotation)),
      zoom: { zoom: { enabled: false }, pan: { enabled: false } }
    },
    scales: JSON.parse(JSON.stringify(chart.options.scales))
  };

  const tmpChart = new Chart(off, {
    type: "scatter",
    data: chart.data,
    options: safeOptions
  });

  setTimeout(() => {
    off.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "chart.png";
      a.click();
      URL.revokeObjectURL(url);
      tmpChart.destroy();
    });
  }, 80);
};
