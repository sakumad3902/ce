
export function AccordionTitle({ open, setOpen, children}) {
  return (
    <div className="accordion-title">
      <div
        className="accordion-title-label"
        onClick={() => setOpen(!open)}
      >
        <span className="accordion-arrow">
          {open ? "▼" : "▶"}
        </span>
        {children}
      </div>    
    </div>
  );
}
