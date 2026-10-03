// src/leftpane/buildSelectedList.js

/**
 * UI 表示用の selectedList を構築する純粋関数。
 *
 * selectedOrder（選択された series の ID 配列）を元に、
 * originalSeries（波形データの生データ）から該当 series を取得し、
 * projectList（プロジェクト一覧）から project_name を付与して
 * UI 用に整形された選択データの配列を返す。
 *
 * originalSeries は project_id しか持たないため、
 * UI 表示に必要な project_name はここで合成する。
 *
 * この関数は副作用を持たず、入力に応じて常に同じ出力を返す。
 *
 * @param {number[]} selectedOrder - 選択中 series の ID 配列（表示順）
 * @param {Object[]} originalSeries - 波形データの生データ（project_id を含む）
 * @param {Object[]} projectList - プロジェクト一覧（project_id と name を含む）
 * @returns {Object[]} UI 表示用に整形された選択データ（project_name を含む）
 */
export function buildSelectedList(selectedOrder, originalSeries, projectList) {
  return selectedOrder
    .map(id => {
      const s = originalSeries.find(x => x.id === id);
      if (!s) return null;

      const proj = projectList.find(p => p.project_id === s.project_id);

      return {
        ...s,
        project_name: proj?.name ?? ""
      };
    })
    .filter(Boolean);
}

