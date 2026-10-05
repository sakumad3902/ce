export default function EditCategoryDialog({
  initialCategory,
  onSubmit,
  onClose
}) {
  const [name, setName] = useState(initialCategory.name);

  return (
    <div className="modal">
      <h3>カテゴリ編集</h3>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={() => onSubmit(initialCategory.id, name)}>更新</button>
      <button onClick={onClose}>閉じる</button>
    </div>
  );
}
