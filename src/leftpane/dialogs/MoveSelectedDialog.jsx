import Modal from "../Modal";
import { Virtuoso } from "react-virtuoso";

export default function MoveSelectedDialog({ logic }) {
  const pos = logic.modalPos;

  return (
    <Modal
      title="選択中データの移動先を指定してください"
      onCancel={logic.handleMoveSelectedCancel}
      onOk={logic.handleMoveSelectedOk}
      x={pos.x}
      y={pos.y}
    >
      <>対象：<strong>{logic.moveSelectedIds.length}</strong> 件</>

      <div className="selected-scroll">
        {logic.selectedList.map(item => (
          <div key={item.id}>
            {item.name}【{item.project_name}】
          </div>
        ))}
      </div>

      <div className="move-target-header">
        <b>データ移動先</b>
        <button
          onClick={(e) => {
            e.stopPropagation();
            logic.handleProjectFilterClick(e, { zIndex: 3000 });
          }}
        >
          検索
        </button>
      </div>

      <Virtuoso
        className="selected-scroll"
        style={{ height: "180px" }}
        totalCount={logic.projectListFiltered.length}
        itemContent={(index) => {
          const p = logic.projectListFiltered[index];
          const isCurrent = p.project_id === Number(logic.selectedProject);

          return (
            <div
              key={p.project_id}
              className={"leftpane-row-main" + (isCurrent ? " disabled-row" : "")}
              onClick={() => {
                if (!isCurrent) {
                  logic.setMoveTargetProjectId(p.project_id);
                }
              }}
            >
              <input
                type="radio"
                name="moveTargetProject"
                value={p.project_id}
                checked={logic.moveTargetProjectId === p.project_id}
                disabled={isCurrent}
                onChange={() => {
                  if (!isCurrent) {
                    logic.setMoveTargetProjectId(p.project_id);
                  }
                }}
              />

              <span className="leftpane-row-name">{p.name}</span>
            </div>
          );
        }}
      />
    </Modal>
  );
}
