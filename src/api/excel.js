// src/api/excel.js
import { post, get } from "./http";

export async function runExcelJob(payload, {
  setIsExporting,
  setProgress
}) {
  // ▼ Excel ジョブ開始
  const reply = await post("export_excel_start", payload);
  if (reply?.status !== "OK") {
    alert("Excel ジョブ開始に失敗しました");
    return false;
  }

  const jobId = reply.jobId;
  setIsExporting(true);
  setProgress(0);

  // ▼ 進捗ポーリング
  const timer = setInterval(async () => {
    const status = await get(`export_excel_status?jobId=${jobId}`);

    if (status?.status !== "OK") {
      clearInterval(timer);
      setIsExporting(false);
      return;
    }

    if (["running", "pending"].includes(status.state)) {
      setProgress(p => Math.min(p + 10, 90));
      return;
    }

    if (status.state === "error") {
      clearInterval(timer);
      setIsExporting(false);
      alert("Excel 生成に失敗しました: " + status.error);
      return;
    }

    if (status.state === "finished") {
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => setIsExporting(false), 500);
      window.location.href = status.path;
    }
  }, 1000);

  return true;
}
