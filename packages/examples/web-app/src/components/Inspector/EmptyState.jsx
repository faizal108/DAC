import "./InspectorPanel.css";

export function EmptyState({ message = "No selection" }) {
  return (
    <div className="inspector-empty">
      <div className="empty-title">{message}</div>
      <div className="empty-sub">Select an object to edit its properties</div>
    </div>
  );
}
