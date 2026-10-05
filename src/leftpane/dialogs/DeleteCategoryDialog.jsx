export default function DeleteCategoryDialog({
  category,
  onSubmit,
  onClose
}) {
  return (
    <div className="modal">
      <h3>カテゴリ削除</h3>

      <p>「{category.name}」を削除しますか？</p>

      <button onClick={() => onSubmit(category.id)}>削除</button>
      <button onClick={onClose}>キャンセル</button>
    </div>
  );
}
