import { ReplaceEntityCommand } from "@dac/core-commands";
import { createLine, createPoint } from "@dac/core-geometry";

export function LineEditor({ entity, commands, canEdit }) {
  const { geometry } = entity;

  function update(patch) {
    if (!canEdit) return;

    const g = geometry;
    const next = createLine(
      createPoint(patch.x1 ?? g.start.x, patch.y1 ?? g.start.y),
      createPoint(patch.x2 ?? g.end.x, patch.y2 ?? g.end.y),
    );

    commands.execute(new ReplaceEntityCommand(entity.id, next));
  }

  return (
    <div className="inspector-section">
      <div className="section-title">Line</div>

      <Field
        label="Start X"
        value={geometry.start.x}
        onChange={(v) => update({ x1: v })}
        disabled={!canEdit}
      />
      <Field
        label="Start Y"
        value={geometry.start.y}
        onChange={(v) => update({ y1: v })}
        disabled={!canEdit}
      />

      <Field
        label="End X"
        value={geometry.end.x}
        onChange={(v) => update({ x2: v })}
        disabled={!canEdit}
      />
      <Field
        label="End Y"
        value={geometry.end.y}
        onChange={(v) => update({ y2: v })}
        disabled={!canEdit}
      />
    </div>
  );
}

function Field({ label, value, onChange, disabled }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
