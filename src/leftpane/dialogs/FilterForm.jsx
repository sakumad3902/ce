export function FilterForm({ fields, logic }) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      {fields.map((f, i) => (
        <div
          key={i}
          className={f.fullWidth ? "filter-row-full" : "filter-row"}
        >
          {!f.fullWidth && <label>{f.label}</label>}

          {f.type === "select" && (
            <select
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="filter-input"
            >
              {f.options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {f.type === "text" && (
            <input
              type="text"
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              className="name-input"
            />
          )}

          {f.type === "date-range" && (
            <>
              <input
                type="date"
                value={f.from}
                onChange={(e) => f.onChangeFrom(e.target.value)}
                className="date-input"
              />
              <label>～</label>
              <input
                type="date"
                value={f.to}
                onChange={(e) => f.onChangeTo(e.target.value)}
                className="date-input"
              />
            </>
          )}

          {f.type === "custom" && f.render(logic)}
        </div>
      ))}
    </div>
  );
}
