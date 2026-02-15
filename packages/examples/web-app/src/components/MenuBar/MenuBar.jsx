import "./MenuBar.css";

export function MenuBar({
  menus,
  activeMenu,
  onSelectMenu,
}) {
  return (
    <div className="menu-bar">
      <div className="menu-left">
        {menus.map((group) => (
          <button
            key={group.id}
            className={`menu-tab ${activeMenu === group.id ? "active" : ""}`}
            onClick={() => onSelectMenu?.(group.id)}
          >
            {group.label}
          </button>
        ))}
      </div>

      <div className="menu-brand">DAC</div>
      <div className="menu-right" />
    </div>
  );
}
