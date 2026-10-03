import { useEffect, useState } from "react";

export default function EvaluateViewer() {
  const params = new URLSearchParams(window.location.search);
  const project = params.get("project");

  const [data, setData] = useState(null);

  useEffect(() => {
    setData(window.resultData);
  }, []);

  if (!data) return <div>読み込み中...</div>;

  const { series, results, stats } = data;

  // ▼ Python と同じ色付けロジック
  function colorForValue(value, mean, threeSigma) {
    const diff = value - mean;
    if (diff > threeSigma) return "#FFCCCC"; // 薄赤
    if (diff < -threeSigma) return "#CCE5FF"; // 薄青
    return "#FFFFFF";
  }

  function colorForCv(cv) {
    if (cv > 5) return "#FFE0B3"; // 薄橙
    if (cv > 2) return "#FFF5CC"; // 薄黄
    return "#FFFFFF";
  }

  function colorForSimilarity(simPct) {
    if (simPct < 97.0) return "#E6CCFF"; // 薄紫
    return "#FFFFFF";
  }

  // ▼ 項目説明（Python と同じ）
  const explanations = {
    name: "系列名",
    x_peak: "ピークトップの X 座標",
    base_drift: "ベースライン前後5%の平均差",
    peak_height: "ピーク高さ",
    peak_area: "ピーク面積",
    FWHM_upper: "ピーク幅（上部75%）",
    FWHM_middle: "ピーク幅（中部50%）",
    FWHM_lower: "ピーク幅（下部25%）",
    cosine_pct: "コサイン類似度（基準系列に対して）",
    shape_similarity_pct: "形状類似度（基準系列に対して）"
  };

  // ▼ Excel出力（Python の base64 をそのまま blob に変換）
  async function handleExcelExport() {
    const base64 = data.excel;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "evaluate.xlsx";
    a.click();
  }

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>波形評価結果</h2>

      <table border="1" cellPadding="4" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {[
              "name", "x_peak", "base_drift", "peak_height", "peak_area",
              "FWHM_upper", "FWHM_middle", "FWHM_lower",
              "cosine_pct", "shape_similarity_pct"
            ].map(col => (
              <th key={col} title={explanations[col]}>
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* ▼ データ行 */}
          {results.map((r) => {
            const wf = r.waveform;
            const bl = r.baseline;

            return (
              <tr key={r.name}>
                <td>{r.name}</td>

                {/* x_peak */}
                <td style={{
                  background: colorForValue(
                    wf.x_peak,
                    stats.x_peak.mean,
                    stats.x_peak.three_sigma
                  )
                }}>
                  {wf.x_peak.toFixed(2)}
                </td>

                {/* base_drift */}
                <td style={{
                  background: colorForValue(
                    bl.base_drift,
                    stats.base_drift.mean,
                    stats.base_drift.three_sigma
                  )
                }}>
                  {bl.base_drift.toFixed(2)}
                </td>

                {/* peak_height */}
                <td style={{
                  background: colorForValue(
                    wf.peak_height,
                    stats.peak_height.mean,
                    stats.peak_height.three_sigma
                  )
                }}>
                  {wf.peak_height.toFixed(2)}
                </td>

                {/* peak_area */}
                <td style={{
                  background: colorForValue(
                    wf.peak_area,
                    stats.peak_area.mean,
                    stats.peak_area.three_sigma
                  )
                }}>
                  {wf.peak_area.toFixed(2)}
                </td>

                {/* FWHM_upper */}
                <td style={{
                  background: colorForValue(
                    wf.FWHM_upper,
                    stats.FWHM_upper.mean,
                    stats.FWHM_upper.three_sigma
                  )
                }}>
                  {wf.FWHM_upper.toFixed(2)}
                </td>

                {/* FWHM_middle */}
                <td style={{
                  background: colorForValue(
                    wf.FWHM_middle,
                    stats.FWHM_middle.mean,
                    stats.FWHM_middle.three_sigma
                  )
                }}>
                  {wf.FWHM_middle.toFixed(2)}
                </td>

                {/* FWHM_lower */}
                <td style={{
                  background: colorForValue(
                    wf.FWHM_lower,
                    stats.FWHM_lower.mean,
                    stats.FWHM_lower.three_sigma
                  )
                }}>
                  {wf.FWHM_lower.toFixed(2)}
                </td>

                {/* cosine_pct */}
                <td style={{
                  background: colorForSimilarity(wf.cosine_pct)
                }}>
                  {wf.cosine_pct.toFixed(1)}
                </td>

                {/* shape_similarity_pct */}
                <td style={{
                  background: colorForSimilarity(wf.shape_similarity_pct)
                }}>
                  {wf.shape_similarity_pct.toFixed(1)}
                </td>
              </tr>
            );
          })}

          {/* ▼ 統計行（mean / 3σ / CV） */}
          {/* ▼ 統計行（mean / 3σ / CV） */}
          {["mean", "three_sigma", "cv"].map(label => (
            <tr key={label}>
              <td style={{ fontWeight: "bold" }}>{label}</td>

              {[
                "x_peak", "base_drift", "peak_height", "peak_area",
                "FWHM_upper", "FWHM_middle", "FWHM_lower"
              ].map(col => {
                const val = stats[col][label];
                const bg =
                  label === "cv"
                    ? colorForCv(stats[col].cv)
                    : "#FFFFFF";

                return (
                  <td key={col} style={{ background: bg }}>
                    {val.toFixed(2)}
                  </td>
                );
              })}

              {/* 類似度列は統計対象外なので空欄 */}
              <td></td>
              <td></td>
            </tr>
          ))}

        </tbody>
      </table>

      <div style={{ marginTop: 20 }}>
        <button onClick={handleExcelExport} style={{ marginRight: "10px" }}>
          Excel出力
        </button>
        <button onClick={() => window.close()}>
          閉じる
        </button>
      </div>
    </div>
  );
}
