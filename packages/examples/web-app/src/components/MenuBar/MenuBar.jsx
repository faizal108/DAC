import "./MenuBar.css";
import { MENU } from "../../config/MenuConfig";
import { usePlatform } from "../../platform/PlatformContext";

export function MenuBar({ onAction }) {
  const { auth } = usePlatform();

  return (
    <div className="menu-bar">
      {MENU.map((group) => (
        <div key={group.id} className="menu-group">
          <span className="menu-title">{group.label}</span>

          <div className="menu-dropdown">
            {group.items.map((item) => {
              const enabled = auth.can(item.feature);

              return (
                <div
                  key={item.id}
                  className={`menu-item ${enabled ? "" : "disabled"}`}
                  onClick={() => enabled && onAction?.(item.id)}
                >
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
