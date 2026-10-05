// src/utils/correctionService.js

export const correctionService = (api, state, getPacked) => {
  const { selectedOrder } = state;

  const applyCorrection = async (params) => {
    const { selected, packed, lengths, names, ids } = getPacked();

    const refIndex = Math.max(
      0,
      selected.findIndex(s => s.id === selectedOrder[0])
    );

    const data = await api.applyCorrection({
      ...params,
      packed,
      lengths,
      ids,
      names,
      refIndex
    });

    if (data?.status !== "OK") {
      alert("補正処理に失敗しました");
      return null;
    }

    return data;
  };

  return {
    applyCorrection
  };
};
