import "./AppLayout.css";

export function AppLayout({ menu, toolbar, workspace, status }) {
  return (
    <div className="app-layout">
      <div className="app-menu">{menu}</div>
      <div className="app-toolbar">{toolbar}</div>
      <div className="app-workspace">{workspace}</div>
      <div className="app-status">{status}</div>
    </div>
  );
}
