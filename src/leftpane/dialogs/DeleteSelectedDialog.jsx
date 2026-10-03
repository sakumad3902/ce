import Modal from "../Modal";

export default function DeleteSelectedDialog({ logic }) {
  const pos = logic.modalPos;

  return (
    <Modal
      title="選択中データを全て削除しますか？"
      onCancel={logic.handleDeleteSelectedCancel}
      onOk={logic.handleDeleteSelectedOk}
      x={pos.x}
      y={pos.y}
    >
      <>対象：<strong>{logic.deleteSelectedIds.length}</strong> 件</>

      <div className="selected-scroll">
        {logic.selectedList.map(item => (
          <div key={item.id}>
            {item.name}【{item.project_name}】
          </div>
        ))}
      </div>

      <>この操作は取り消せません</>
    </Modal>
  );
}
