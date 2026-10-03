// src/components/useProjectFilter.js
import { useState, useMemo } from "react";

export function useProjectFilter({ projectList, setOpenProject }) {

  /* ----------------------------------------
     state
  ---------------------------------------- */
  // ▼ デフォルトは「最新順（更新日降順）」
  const [projectSortMode, setProjectSortMode] = useState("updatedDesc");

  const [showProjectSearchModal, setShowProjectSearchModal] = useState(false);
  const [projectDateFrom, setProjectDateFrom] = useState("");
  const [projectDateTo, setProjectDateTo] = useState("");
  const [projectKeyword, setProjectKeyword] = useState("");
  const [projectSearchModalPos, setProjectSearchModalPos] = useState({ x: 0, y: 0, zIndex: 0 });

  /* ----------------------------------------
     装置一覧フィルタリング
  ---------------------------------------- */
  const projectListFiltered = useMemo(() => {
    if (!projectList) return [];

    // updated_at / created_at を補完
    let arr = projectList.map(p => ({
      ...p,
      updated_at: p.updated_at ?? 0,
      created_at: p.created_at ?? 0
    }));

    // ▼ キーワード検索
    if (projectKeyword.trim()) {
      const kw = projectKeyword.toLowerCase();
      arr = arr.filter(p => p.name.toLowerCase().includes(kw));
    }

    // ▼ 日付フィルタ
    if (projectDateFrom) {
      const fromTs = Math.floor(new Date(projectDateFrom + "T00:00:00").getTime() / 1000);
      arr = arr.filter(p => p.updated_at >= fromTs);
    }

    if (projectDateTo) {
      const toTs = Math.floor(new Date(projectDateTo + "T23:59:59").getTime() / 1000);
      arr = arr.filter(p => p.updated_at <= toTs);
    }

    // ▼ ソート（デフォルト updatedDesc = 最新順）
    const sortMap = {
      updatedAsc: (a, b) => a.updated_at - b.updated_at,
      updatedDesc: (a, b) => b.updated_at - a.updated_at,
      nameAsc: (a, b) => a.name.localeCompare(b.name),
      nameDesc: (a, b) => b.name.localeCompare(a.name)
    };

    arr.sort(sortMap[projectSortMode]);

    return arr;
  }, [
    projectList,
    projectKeyword,
    projectDateFrom,
    projectDateTo,
    projectSortMode
  ]);

  /* ----------------------------------------
     Reset（最新順に統一）
  ---------------------------------------- */
  const handleProjectFilterReset = () => {
    setProjectSortMode("updatedDesc");
    setProjectDateFrom("");
    setProjectDateTo("");
    setProjectKeyword("");
  };

  /* ----------------------------------------
     モーダル位置計算
  ---------------------------------------- */
  const handleProjectFilterClick = (e, opts = {}) => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    const zIndex = opts.zIndex ?? 1000; // デフォルト 1000　※複数モーダル時のレイヤー管理のため引数対応
    setProjectSearchModalPos({
      x: rect.right + 10,
      y: rect.top + 10,
      zIndex
    });
    setShowProjectSearchModal(prev => !prev);
    setOpenProject(true);
  };

  return {
    projectListFiltered,

    showProjectSearchModal,
    setShowProjectSearchModal,

    projectSortMode,
    setProjectSortMode,

    projectDateFrom,
    setProjectDateFrom,

    projectDateTo,
    setProjectDateTo,

    projectKeyword,
    setProjectKeyword,

    projectSearchModalPos,
    handleProjectFilterClick,

    handleProjectFilterReset
  };
}
