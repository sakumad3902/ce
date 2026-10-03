// src/useApi.js
import { useState, useRef } from "react";
import { packSeriesToBinary } from "./utils/binary";
import { post, get, postMultipart } from "./api/http";
import { loadHeaderApi } from "./api/loadHeader";
import { runExcelJob } from "./api/excel";

/* ============================================================
   ▼ Viewer 専用 API
============================================================ */
export const apiAppendClipboard = ({ project_id, series }) => {
  const user_id = localStorage.getItem("user_id");
  return post("append_clipboard", { project_id, series, user_id });
};

export const apiImportParquetPreview = ({ project_id, file }) => {
  const fd = new FormData();
  fd.append("project_id", project_id);
  fd.append("file", file);
  return postMultipart("import_parquet_preview", fd);
};

export const apiImportParquetApply = ({ project_id, file, overrideSeries }) => {
  const fd = new FormData();
  fd.append("project_id", project_id);
  fd.append("file", file);
  fd.append("overrideSeries", JSON.stringify(overrideSeries));
  return postMultipart("import_parquet_apply", fd);
};

export const apiExportParquetPreview = ({ project_id }) => {
  const fd = new FormData();
  fd.append("project_id", project_id);
  return postMultipart("export_parquet_preview", fd);
};

export const apiExportParquetApply = ({ project_id }) => {
  const fd = new FormData();
  fd.append("project_id", project_id);
  return postMultipart("export_parquet_apply", fd);
};

/* ============================================================
   ▼ API クライアント
============================================================ */
const api = {
  getProjects: () => get("projects"),

  addProject: (name) => post("add_project", { name, user_id: localStorage.getItem("user_id")}),
  renameProject: (project_id, newName) => post("rename_project", { project_id, newName, user_id: localStorage.getItem("user_id")}),
  deleteProject: (project_id) => post("delete_project", { project_id, user_id: localStorage.getItem("user_id")}),

  loadHeader: (project_id) => post("load", { project_id }),
  applyCorrection: (params) => post("apply_correction", params),

  rename: (id, newName, project_id) => post("rename", { id, newName, project_id }),
  updateComment: (id, comment, project_id) => post("update_comment", { id, comment, project_id }),
  updateTimestamp: (id, timestamp, project_id) => post("update_timestamp", { id, timestamp, project_id }),

  moveSelected: (payload) => post("move_selected", {...payload, user_id: localStorage.getItem("user_id")}),
  deleteSelected: (ids) => post("delete_selected", { ids, user_id: localStorage.getItem("user_id")}),

  evaluateSeries: (payload) => post("evaluate_series", payload),
  exportExcelStart: (payload) => post("export_excel_start", payload),
  exportExcelStatus: (jobId) => get(`export_excel_status?jobId=${jobId}`),

  getSeriesWithCreator: (project_id) => post("get_series_with_creator", { project_id }),

  fetchTags: () => get("tags"),
  createTag: (name, normalized_name) => post("tag_create", { name, normalized_name, user_id: localStorage.getItem("user_id") }),
  updateTag: (tag_id, name, normalized_name) => post("tag_update", { tag_id, name, normalized_name, user_id: localStorage.getItem("user_id") }),
  
  updateSeriesTags: ({ series_id, tagIds }) => {
    const fd = new FormData();
    fd.append("series_id", series_id);
    fd.append("user_id", localStorage.getItem("user_id"));
    fd.append("tagIds", JSON.stringify(tagIds));
    return postMultipart("series_update_tags", fd);
  },

  register: (username, email, password) => post("register", { username, email, password }),
  login: (email, password) => post("login", { email, password }),
};

/* ============================================================
   ▼ useApi 本体
============================================================ */
const authApi = {
  register: (username, email, password) => post("register", { username, email, password }),
  login: (email, password) => post("login", { email, password })
};

export default function useApi(state) {
  if (!state) return authApi;

  const {
    originalSeries, setOriginalSeries,
    headerNames, setHeaderNames,
    selectedOrder, setSelectedOrder,
    setCorrectedZero, setCorrectedY, setCorrectedXY,
    lastZeroX, lastRange,
    zeroApplied, yApplied, xyApplied,
    currentSheet,
    axisMode, axisRange
  } = state;

  const currentProjectRef = useRef(null);

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  /* ============================================================
     ▼ 共通ヘルパー
  ============================================================ */

  const getSelectedSeries = () => {
    const map = new Map(originalSeries.map(s => [s.id, s]));
    return selectedOrder.map(id => map.get(id)).filter(Boolean);
  };

  const getPacked = () => {
    const selected = getSelectedSeries();
    const { packed, lengths } = packSeriesToBinary(selected);
    return {
      selected,
      packed,
      lengths,
      names: selected.map(s => s.name),
      ids: selected.map(s => s.id)
    };
  };

  const updateField = async (id, field, value) => {
    const project_id = currentProjectRef.current;

    await api[
      field === "name"
        ? "rename"
        : field === "comment"
        ? "updateComment"
        : "updateTimestamp"
    ](id, value, project_id);

    const apply = setter =>
      setter(prev => prev.map(s => (s.id === id ? { ...s, [field]: value } : s)));

    [setHeaderNames, setOriginalSeries].forEach(apply);

    if (field === "name") {
      [setCorrectedZero, setCorrectedY, setCorrectedXY].forEach(apply);
    }
  };

  /* ============================================================
     ▼ プロジェクト管理（project_id）
  ============================================================ */
  const setProject = (project_id) => {
    currentProjectRef.current = project_id;
  };

  const loadHeader = async ({ resetSelection = false } = {}) => {
    const project_id = currentProjectRef.current;

    if (!project_id) {
      setHeaderNames([]);
      setOriginalSeries([]);
      setSelectedOrder([]);
      return { headers: [] };
    }

    const merged = await loadHeaderApi(project_id);

    // UI 反映（ここは useApi に残す）
    setHeaderNames(merged);

    setOriginalSeries(prev => {
      const map = new Map(prev.map(s => [`${s.project_id}-${s.id}`, s]));
      merged.forEach(s => {
        const key = `${project_id}-${s.id}`;
        map.set(key, { ...map.get(key), ...s });
      });
      return [...map.values()];
    });

    if (resetSelection) {
      setSelectedOrder(prev => [...new Set([...prev, ...merged.map(s => s.id)])]);
    }

    return { headers: merged };
  };

  /* ============================================================
     ▼ 補正処理
  ============================================================ */
  const applyCorrection = async (params) => {
    const { selected, packed, lengths, names, ids } = getPacked();

    const refIndex = Math.max(0, selected.findIndex(s => s.id === selectedOrder[0]));

    const data = await api.applyCorrection({
      ...params,
      packed,
      lengths,
      ids,
      names,
      refIndex
    });

    return data?.status === "OK" ? data : (alert("補正処理に失敗しました"), null);
  };

  /* ============================================================
     ▼ 編集系
  ============================================================ */
  const renameSeries = (id, newName) => updateField(id, "name", newName);
  const updateComment = (id, comment) => updateField(id, "comment", comment);
  const updateTimestamp = (id, ts) => updateField(id, "timestamp", ts);

  /* ============================================================
     ▼ 移動
  ============================================================ */
  const onMoveSelected = async (ids, targetProjectId) => {
    const res = await api.moveSelected({ids, target_project_id: targetProjectId});
    if (res?.status !== "OK") return alert("選択移動に失敗しました"), false;
    setSelectedOrder(prev => prev.filter(id => !ids.includes(id))); // 選択解除
    await loadHeader();
    return true;
  };

  /* ============================================================
     ▼ 削除
  ============================================================ */
  const onDeleteSelected = async (ids) => {
    const res = await api.deleteSelected(ids);
    if (res?.status !== "OK") return alert("選択削除に失敗しました"), false;
    setSelectedOrder(prev => prev.filter(id => !ids.includes(id))); // 選択解除
    await loadHeader();
    return true;
  };

  /* ============================================================
     ▼ 波形評価
  ============================================================ */
  const onEvaluateSeries = async () => {
    const { packed, lengths, names } = getPacked();
    const project_id = currentProjectRef.current;

    const data = await api.evaluateSeries({
      project_id,
      packed,
      lengths,
      names,
      ref_index: 0
    });

    if (data?.status !== "OK") return alert("波形評価に失敗しました"), false;

    const viewer = window.open(`/evaluate-viewer.html?project_id=${project_id}`, "_blank");
    if (viewer) viewer.resultData = { ...data, packed, lengths, names, ref_index: 0 };

    return true;
  };

  /* ============================================================
     ▼ Excel 出力
  ============================================================ */
  const onExportExcel = async () => {
    const { packed, lengths, names, ids } = getPacked();
    const project_id = currentProjectRef.current;

    return await runExcelJob({
      project_id,
      packed,
      lengths,
      names,
      ids,
      selectedOrder,
      zeroApplied, yApplied, xyApplied,
      lastZeroX, lastRange,
      currentSheet, axisMode, axisRange,
      refIndex: 0
    }, {
      setIsExporting,
      setProgress
    });
  };

  /* ============================================================
     ▼ 返却
  ============================================================ */
  return {
    setProject,
    currentProjectRef,
    
    getProjects: api.getProjects,
    addProject: api.addProject,
    renameProject: api.renameProject,
    deleteProject: api.deleteProject,

    loadHeader,

    updateSeriesTags: api.updateSeriesTags,
    getSeriesWithCreator: api.getSeriesWithCreator, 

    fetchTags: api.fetchTags,
    createTag: api.createTag,
    updateTag: api.updateTag,

    renameSeries,
    updateComment,
    updateTimestamp,
    onMoveSelected,
    onDeleteSelected,
    applyCorrection,
    onExportExcel,
    onEvaluateSeries,

    isExporting,
    progress,

    register: api.register,
    login: api.login
  };
}
