export default function CreateCategoryDialog({ onSubmit, onClose }) {
  const [name, setName] = useState("");

  return (
    <div className="modal">
      <h3>カテゴリ作成</h3>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="カテゴリ名"
      />

      <button onClick={() => onSubmit(name)}>作成</button>
      <button onClick={onClose}>閉じる</button>
    </div>
  );
}
