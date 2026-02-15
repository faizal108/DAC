import { useState } from "react";
import "./SubMenuPanel.css";

function SplitButton({ item, onAction }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="split-wrap">
      <button
        className={`sub-btn ${item.active ? "active" : ""}`}
        disabled={item.disabled}
        onClick={() => onAction(item.action)}
      >
        <span className="sub-icon">{item.icon || "[]"}</span>
        <span className="sub-label">{item.label}</span>
      </button>
      <button
        className="split-arrow"
        disabled={item.disabled}
        onClick={() => setOpen((v) => !v)}
      >
        v
      </button>
      {open && (
        <div className="split-menu">
          {item.options.map((opt) => (
            <button
              key={opt.id}
              className="split-item"
              onClick={() => {
                onAction(opt.action);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SubMenuPanel({
  activeMenuLabel,
  unitLabel,
  cursorLabel,
  sections,
  onAction,
  collapsed,
  onToggleCollapsed,
  width,
}) {
  if (collapsed) {
    return (
      <aside className="submenu-panel collapsed">
        <button className="submenu-expand" onClick={onToggleCollapsed}>
          {">"}
        </button>
        <div className="submenu-collapsed-label">{activeMenuLabel}</div>
      </aside>
    );
  }

  return (
    <aside className="submenu-panel" style={{ width: `${width}px` }}>
      <div className="submenu-header">
        <button className="submenu-collapse" onClick={onToggleCollapsed}>
          {"<"}
        </button>
        <div className="submenu-title">{activeMenuLabel}</div>
        <div className="submenu-meta">Units: {unitLabel}</div>
        <div className="submenu-meta">{cursorLabel}</div>
      </div>

      {sections.map((section) => (
        <section key={section.id} className="submenu-section">
          <h4 className="submenu-section-title">{section.label}</h4>
          <div className="submenu-grid">
            {section.items.map((item) => {
              if (item.type === "split") {
                return (
                  <SplitButton key={item.id} item={item} onAction={onAction} />
                );
              }

              if (item.type === "select") {
                return (
                  <label key={item.id} className="sub-select-wrap">
                    <span className="sub-select-label">{item.label}</span>
                    <select
                      className="sub-select"
                      value={item.value}
                      onChange={(e) => onAction(item.action, e.target.value)}
                    >
                      {item.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }

              return (
                <button
                  key={item.id}
                  className={`sub-btn ${item.active ? "active" : ""}`}
                  disabled={item.disabled}
                  onClick={() => onAction(item.action)}
                >
                  <span className="sub-icon">{item.icon || "[]"}</span>
                  <span className="sub-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </aside>
  );
}
