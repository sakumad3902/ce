// src/leftpane/FloatingSelected.jsx

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "./LeftPaneItems";

export default function FloatingSelected({
  openSelected,
  setOpenSelected,
  selectedList,
  selectedOrder,
  toggleSeries,
  handleRightClickSelected,
  handleDoubleClickSelected,
}) {
  return (
    <div className={`floating-selected-container ${openSelected ? "open" : ""}`}>    
      <div className="floating-selected-header"
        onMouseEnter={() => {
          // ヘッダーにいる間は閉じない
          setOpenSelected(true);
        }}
        onMouseLeave={(e) => {
          const leftPaneEl = document.getElementById("leftPane");
          // LeftPane に戻っただけなら閉じない
          if (leftPaneEl && leftPaneEl.contains(e.relatedTarget)) {
            return;
          }
          // ヘッダーから完全に離れた時だけ閉じる
          setOpenSelected(false);
        }}
      >
        ドラッグで並び替え⇅
      </div>

      {openSelected && (
        <div
          className="floating-selected-scroll"
          onMouseEnter={() => {
            // スクロール領域にいる間は閉じない
            setOpenSelected(true);
          }}
          onMouseLeave={() => {
            // スクロール領域から出たら閉じる（LeftPane にもいなければ）
            setOpenSelected(false);
          }}
        >
          <SortableContext
            items={selectedList.map((h) => h.id)}
            strategy={verticalListSortingStrategy}
          >
            {selectedList.map((h, idx) => (
              <div key={h.id} title={h.name}>
                <SortableItem
                  h={h}
                  indexNumber={idx + 1}
                  selectedOrder={selectedOrder}
                  toggleSeries={toggleSeries}
                  handleRightClickSelected={handleRightClickSelected}
                  handleDoubleClickSelected={handleDoubleClickSelected}
                />
              </div>
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
