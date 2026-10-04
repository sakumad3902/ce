// src/utils/seriesService.js

export const seriesService = (api, state, currentProjectRef) => {
  const {
    originalSeries, setOriginalSeries,
    headerNames, setHeaderNames,
    setCorrectedZero, setCorrectedY, setCorrectedXY,
    selectedOrder,
  } = state;

  /* ============================================================
     ▼ 共通ヘルパー：UI 状態更新
  ============================================================ */
  const applyFieldUpdate = (id, field, value) => {
    const apply = setter =>
      setter(prev =>
        prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
      );

    // HeaderNames / OriginalSeries の更新
    [setHeaderNames, setOriginalSeries].forEach(apply);

    // 名前変更時は補正済みデータも更新
    if (field === "name") {
      [setCorrectedZero, setCorrectedY, setCorrectedXY].forEach(apply);
    }
  };

  /* ============================================================
     ▼ renameSeries
  ============================================================ */
  const renameSeries = async (id, newName) => {
    const project_id = currentProjectRef.current;

    await api.rename(id, newName, project_id);
    applyFieldUpdate(id, "name", newName);
  };

  /* ============================================================
     ▼ updateComment
  ============================================================ */
  const updateComment = async (id, comment) => {
    const project_id = currentProjectRef.current;

    await api.updateComment(id, comment, project_id);
    applyFieldUpdate(id, "comment", comment);
  };

  /* ============================================================
     ▼ updateTimestamp
  ============================================================ */
  const updateTimestamp = async (id, ts) => {
    const project_id = currentProjectRef.current;

    await api.updateTimestamp(id, ts, project_id);
    applyFieldUpdate(id, "timestamp", ts);
  };

  /* ============================================================
     ▼ 返却
  ============================================================ */
  return {
    renameSeries,
    updateComment,
    updateTimestamp
  };
};
