export class LocalProvider {
  load() {
    return Promise.resolve({
      user: {
        id: "demo",
        tier: "free",
      },

      capabilities: {
        SAVE_PROJECT: true,
        EXPORT_DXF: true,
        EXPORT_GCODE: true,
        EXPORT_IMAGE: true,
        EXPORT_JSON: true,
        EDIT_GEOMETRY: true,

        ADVANCED_TRIM: true,
        CIRCLE_TOOL: true,

        CAPTURE: true,
      },
    });
  }
}
