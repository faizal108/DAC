import "./InspectorPanel.css";
import { usePlatform } from "../../platform/PlatformContext";
import { useEffect, useState } from "react";
import { EmptyState } from "./EmptyState";
import { LineEditor } from "./GeometryEditors/LineEditor";
import { CircleEditor } from "./GeometryEditors/CircleEditor";

export function InspectorPanel({ scene, commands }) {
  const { auth } = usePlatform();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // simple polling; later we can add a subscription
    const id = setInterval(() => {
      const ids = scene.selection.getAll();
      setSelected(ids.length === 1 ? scene.get(ids[0]) : null);
    }, 100);

    return () => clearInterval(id);
  }, [scene]);

  if (!selected) {
    return <EmptyState />;
  }

  switch (selected.type) {
    case "LINE":
      return (
        <LineEditor
          entity={selected}
          commands={commands}
          canEdit={auth.can("EDIT_GEOMETRY")}
        />
      );

    case "CIRCLE":
      return (
        <CircleEditor
          entity={selected}
          commands={commands}
          canEdit={auth.can("EDIT_GEOMETRY")}
        />
      );

    default:
      return <EmptyState message="Unsupported entity" />;
  }
}
