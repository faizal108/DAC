import { ReplaceEntityCommand } from "@dac/core-commands";
import { createCircle, createPoint } from "@dac/core-geometry";

export function CircleEditor({ entity, commands, canEdit }) {
  const { geometry } = entity;

  function update(patch) {
    if (!canEdit) return;

    const next = createCircle(
      createPoint(patch.cx ?? geometry.center.x, patch.cy ?? geometry.center.y),
      patch.r ?? geometry.radius,
    );

    commands.execute(new ReplaceEntityCommand(entity.id, next));
  }

  return (
    <div className="inspector-section">
      <div className="section-title">Circle</div>

      <Field
        label="Center X"
        value={geometry.center.x}
        onChange={(v) => update({ cx: v })}
        disabled={!canEdit}
      />
      <Field
        label="Center Y"
        value={geometry.center.y}
        onChange={(v) => update({ cy: v })}
        disabled={!canEdit}
      />

      <Field
        label="Radius"
        value={geometry.radius}
        onChange={(v) => update({ r: Math.round(v) })}
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
