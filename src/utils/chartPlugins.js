// src/utils/chartPlugins.js
export const whiteBackgroundPlugin = {
  id: "whiteBackground",
  beforeDraw: (chart) => {
    const ctx = chart.ctx;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};
