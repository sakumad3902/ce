// src/leftpane/selectionStateLogic.js

export function buildSelectionStateLogic({
  setSelectedOrder,
  dbFilter,
  setOpenSelected,
}) {

  const toggleSeries = (id) => {
    setSelectedOrder(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 30
          ? [...prev, id]
          : (alert("選択できるのは最大 30 件までです。"), prev)
    );
    setOpenSelected?.(true);
  };

  const clearSelectionAndReload = () => {
    setSelectedOrder([]);
    dbFilter.applyAllCorrections?.();
    setOpenSelected?.(false);
  };

  const clearAllSelectionAndReload = () => {
    setSelectedOrder(dbFilter.headerNames.map(h => h.id));
    dbFilter.applyAllCorrections?.();
    setOpenSelected?.(false);
  };

  return {
    toggleSeries,
    clearSelectionAndReload,
    clearAllSelectionAndReload,
  };
}
