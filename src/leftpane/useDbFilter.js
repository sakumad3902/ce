import { useState, useMemo, useEffect } from "react";
import { tagManager } from "../api/tagManager";

export function useDbFilter({ headerNames, selectedOrder, currentProjectRef, allTags }) {

  const [sortMode, setSortMode] = useState("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [keyword, setKeyword] = useState("");
  const [creatorKeyword, setCreatorKeyword] = useState("");
  const [commentKeyword, setCommentKeyword] = useState("");

  const [tagKeyword, setTagKeyword] = useState([]);
  const [tagMode, setTagMode] = useState("AND");
  const [tagFilteredSeries, setTagFilteredSeries] = useState(null);

  /* ----------------------------------------
     タグ検索
  ---------------------------------------- */
  useEffect(() => {
    const run = async () => {
      const projectId = currentProjectRef.current;
      if (!projectId) {
        setTagFilteredSeries(null);
        return;
      }

      // タグが選択されていない場合は null
      if (!Array.isArray(tagKeyword) || tagKeyword.length === 0) {
        setTagFilteredSeries(null);
        return;
      }

      // AND / OR 検索
      const filtered = tagManager.searchByTags(
        tagKeyword,
        headerNames,
        projectId,
        tagMode
      );

      setTagFilteredSeries(filtered);
    };

    run();
  }, [tagKeyword, tagMode, headerNames, currentProjectRef]);

  const topTags = useMemo(() => {
    if (!Array.isArray(allTags)) return [];
    return [...allTags]
      .sort((a, b) => (b.usage || 0) - (a.usage || 0))
      .slice(0, 10);
  }, [allTags]);

  /* ----------------------------------------
     DB List（検索・ソート）
  ---------------------------------------- */
  const dbList = useMemo(() => {
    let arr = [...headerNames];

    // ▼ タグ検索結果がある場合はそれを使う
    if (tagFilteredSeries) {
      const ids = new Set(tagFilteredSeries.map(s => s.id));
      arr = arr.filter(h => ids.has(h.id));
    }

    // データ名キーワード検索
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      arr = arr.filter(h => h.name.toLowerCase().includes(kw));
    }

    // 登録者名で絞り込み
    if (creatorKeyword.trim()) {
      const ck = creatorKeyword.trim().toLowerCase();
      arr = arr.filter(h =>
        (h.created_by_username || "").toLowerCase().includes(ck)
      );
    }

    // コメントで絞り込み
    if (commentKeyword.trim()) {
      const ck = commentKeyword.trim().toLowerCase();
      arr = arr.filter(h =>
        (h.comment || "").toLowerCase().includes(ck)
      );
    }

    // ▼ dateFrom フィルタ
    if (dateFrom) {
      const fromTs = Math.floor(new Date(dateFrom + "T00:00:00").getTime() / 1000);
      arr = arr.filter(h => h.timestamp >= fromTs);
    }

    if (dateTo) {
      const toTs = Math.floor(new Date(dateTo + "T23:59:59").getTime() / 1000);
      arr = arr.filter(h => h.timestamp <= toTs);
    }

    // ▼ ソート
    const sortMap = {
      asc: (a, b) => a.timestamp - b.timestamp,
      desc: (a, b) => b.timestamp - a.timestamp,
      nameAsc: (a, b) => a.name.localeCompare(b.name),
      nameDesc: (a, b) => b.name.localeCompare(a.name)
    };

    arr.sort(sortMap[sortMode]);

    // selected フラグ付与
    return arr.map(h => ({
      ...h,
      selected: selectedOrder.includes(h.id)
    }));
  }, [
    headerNames,
    tagFilteredSeries,
    keyword,
    creatorKeyword,
    commentKeyword,
    dateFrom,
    dateTo,
    sortMode,
    selectedOrder
  ]);

  /* ----------------------------------------
     Reset
  ---------------------------------------- */
  const handleFilterReset = () => {
    setSortMode("desc");
    setDateFrom("");
    setDateTo("");
    setKeyword("");
    setCreatorKeyword("");
    setCommentKeyword("");

    setTagKeyword([]);    
    setTagMode("AND");        
    setTagFilteredSeries(null);
  };

  return {
    dbList,
    sortMode,
    setSortMode,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    keyword,
    setKeyword,
    creatorKeyword,
    setCreatorKeyword,
    commentKeyword,
    setCommentKeyword,

    tagKeyword,
    setTagKeyword,
    tagMode,
    setTagMode,
    topTags,

    handleFilterReset
  };
}
